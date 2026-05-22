import { RNG } from './rng';

export interface SlotSymbol {
  id: string;
  value: number;
  weight: number; // Higher weight = more common
}

export interface SlotConfig {
  reels: number;
  rows: number;
  symbols: SlotSymbol[];
  rtp: number; // Target Return to Player (e.g. 0.96)
}

export class SlotEngine {
  private config: SlotConfig;

  constructor(config: SlotConfig) {
    this.config = config;
  }

  /**
   * Generates a result matrix (e.g. 3x3 or 5x3)
   */
  generateMatrix(serverSeed: string, clientSeed: string, nonce: number): string[][] {
    const matrix: string[][] = [];
    
    // We use the nonce as base, but increment for each cell to get different results
    let cellNonce = nonce;

    for (let r = 0; r < this.config.reels; r++) {
      const reel: string[] = [];
      for (let i = 0; i < this.config.rows; i++) {
        const symbol = this.weightedRandom(serverSeed, clientSeed, cellNonce++);
        reel.push(symbol.id);
      }
      matrix.push(reel);
    }

    return matrix;
  }

  /**
   * Selection based on weights
   */
  private weightedRandom(serverSeed: string, clientSeed: string, nonce: number): SlotSymbol {
    const totalWeight = this.config.symbols.reduce((sum, s) => sum + s.weight, 0);
    const random = RNG.generateResult(serverSeed, clientSeed, nonce) * totalWeight;
    
    let cumulativeWeight = 0;
    for (const symbol of this.config.symbols) {
      cumulativeWeight += symbol.weight;
      if (random <= cumulativeWeight) {
        return symbol;
      }
    }
    
    return this.config.symbols[0]; // Fallback
  }

  /**
   * Simple payout calculator (horizontal lines only for this basic version)
   */
  calculatePayout(matrix: string[][], bet: number): number {
    let totalWin = 0;
    const { rows, reels } = this.config;

    // Check horizontal lines
    for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
      const firstSymbolId = matrix[0][rowIdx];
      let matchCount = 1;

      for (let reelIdx = 1; reelIdx < reels; reelIdx++) {
        if (matrix[reelIdx][rowIdx] === firstSymbolId) {
          matchCount++;
        } else {
          break;
        }
      }

      if (matchCount >= 3) {
        const symbol = this.config.symbols.find(s => s.id === firstSymbolId);
        if (symbol) {
          // Simplistic payout: value * matchCount
          totalWin += (bet / reels) * symbol.value * matchCount;
        }
      }
    }

    return totalWin;
  }
}
