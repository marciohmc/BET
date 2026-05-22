import { SpinResult, WinningLine, BonusResult, BonusStep } from '../types/game.js';
import { ProvablyFair } from '../core/provablyFair.js';

export class SlotEngine {
  // IDs dos Símbolos: 0: Laranja, 1: Fogos, 2: Envelope, 3: Saco Moedas, 4: Pote Ouro, 5: Amuleto, 6: Tigre (WILD)
  private readonly reels = [
    [0, 1, 2, 0, 3, 4, 0, 5, 0, 6, 1, 2, 3, 0, 4, 5, 0, 1, 2, 3], // Reel 1
    [0, 1, 2, 1, 3, 4, 1, 5, 1, 6, 2, 3, 0, 1, 4, 5, 1, 2, 3, 4], // Reel 2
    [0, 1, 2, 2, 3, 4, 2, 5, 2, 6, 0, 1, 2, 3, 4, 5, 2, 1, 0, 3], // Reel 3
  ];

  private readonly payTables: Record<number, number> = {
    0: 3,   // Laranja
    1: 5,   // Fogos
    2: 8,   // Envelope
    3: 10,  // Saco Moedas
    4: 15,  // Pote Ouro
    5: 25,  // Amuleto
    6: 40,  // Tigre (WILD)
  };

  private readonly lines = [
    [[0, 0], [0, 1], [0, 2]], // Horizontal Superior
    [[1, 0], [1, 1], [1, 2]], // Horizontal Central
    [[2, 0], [2, 1], [2, 2]], // Horizontal Inferior
    [[0, 0], [1, 1], [2, 2]], // Diagonal Descendente
    [[2, 0], [1, 1], [0, 2]], // Diagonal Ascendente
  ];

  public spin(bet: number, fairState?: { serverSeed: string; clientSeed: string; nonce: number }): SpinResult {
    const matrix = this.generateMatrix(fairState);
    let isBonusTriggered = Math.random() < 0.05; // 5% de chance de bônus

    if (fairState) {
      // Deterministic bonus trigger based on a separate hash offset
      const stops = ProvablyFair.getDeterministicReelStops(
        fairState.serverSeed,
        fairState.clientSeed,
        fairState.nonce + 999, // Offset
        [100]
      );
      isBonusTriggered = stops[0] < 5; // 5% de chance
    }

    if (isBonusTriggered) {
      return this.processBonus(bet, matrix);
    }

    return this.evaluateSpin(matrix, bet);
  }

  private generateMatrix(fairState?: { serverSeed: string; clientSeed: string; nonce: number }): number[][] {
    const matrix: number[][] = [];
    
    if (fairState) {
      // Get deterministic stops for each of the reels
      const reelLengths = this.reels.map(r => r.length);
      const stops = ProvablyFair.getDeterministicReelStops(
        fairState.serverSeed,
        fairState.clientSeed,
        fairState.nonce,
        reelLengths
      );

      for (let r = 0; r < 3; r++) {
        matrix[r] = [];
        for (let c = 0; c < 3; c++) {
          const reel = this.reels[c];
          const stopIndex = stops[c];
          const pos = (stopIndex + r) % reel.length;
          matrix[r][c] = reel[pos];
        }
      }
    } else {
      for (let r = 0; r < 3; r++) {
        matrix[r] = [];
        for (let c = 0; c < 3; c++) {
          const reel = this.reels[c];
          matrix[r][c] = reel[Math.floor(Math.random() * reel.length)];
        }
      }
    }
    return matrix;
  }

  private evaluateSpin(matrix: number[][], bet: number): SpinResult {
    const winningLines: WinningLine[] = [];
    let totalWin = 0;

    this.lines.forEach((line, index) => {
      const symbols = line.map(([r, c]) => matrix[r][c]);
      const result = this.checkLine(symbols);
      if (result) {
        const payout = (bet / 5) * this.payTables[result.symbol];
        winningLines.push({
          lineId: index,
          symbol: result.symbol,
          count: 3,
          payout: payout
        });
        totalWin += payout;
      }
    });

    // Multiplicador 10x de Tela Cheia
    let multiplier = 1;
    const flatMatrix = matrix.flat();
    const firstNonWild = flatMatrix.find(s => s !== 6) ?? 6;
    const isFullScreen = flatMatrix.every(s => s === firstNonWild || s === 6);

    if (isFullScreen && totalWin > 0) {
      multiplier = 10;
      totalWin *= 10;
    }

    return {
      matrix,
      winningLines,
      totalWin,
      bet,
      isBonus: false,
      multiplier
    };
  }

  private checkLine(symbols: number[]): { symbol: number } | null {
    const firstSymbol = symbols[0];
    const baseSymbol = firstSymbol === 6 ? symbols.find(s => s !== 6) ?? 6 : firstSymbol;
    
    if (symbols.every(s => s === baseSymbol || s === 6)) {
      return { symbol: baseSymbol };
    }
    return null;
  }

  private processBonus(bet: number, initialMatrix: number[][]): SpinResult {
    const bonusSymbol = Math.floor(Math.random() * 6); // Escolhe um símbolo (exceto Wild para o bônus)
    const respins: BonusStep[] = [];
    let currentMatrix = initialMatrix.map(row => [...row]);
    let totalBonusWin = 0;
    let finished = false;

    // Lógica simplificada de respins estilo Fortune Tiger
    while (!finished && respins.length < 9) {
      const stepWin = 0; // Ganhos só no final ou parciais? No Tiger é tela cheia.
      const newLockedPositions: [number, number][] = [];
      
      // Simula uma rodada de respin onde o símbolo escolhido ou Wild "trancam"
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (currentMatrix[r][c] !== bonusSymbol && currentMatrix[r][c] !== 6) {
            if (Math.random() < 0.3) {
              currentMatrix[r][c] = Math.random() < 0.8 ? bonusSymbol : 6;
              newLockedPositions.push([r, c]);
            }
          }
        }
      }

      respins.push({
        matrix: currentMatrix.map(row => [...row]),
        newLockedPositions,
        stepWin
      });

      if (newLockedPositions.length === 0) finished = true;
      if (currentMatrix.flat().every(s => s === bonusSymbol || s === 6)) finished = true;
    }

    const finalResult = this.evaluateSpin(currentMatrix, bet);
    
    return {
      ...finalResult,
      isBonus: true,
      bonusResult: {
        symbol: bonusSymbol,
        respins,
        totalBonusWin: finalResult.totalWin
      }
    };
  }
}
