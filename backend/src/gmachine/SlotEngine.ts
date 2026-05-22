import { GameMathEngine } from './MathEngine';

export interface SlotConfig {
  reels: number;
  rows: number;
  symbols: string[];
  paytable: Record<string, number[]>; // Ex: 'cherry': [0, 0, 2, 5, 10] (ganho por 1, 2, 3, 4, 5 ícones)
  reelsStrips: string[][]; // Símbolos presentes em cada bobina
}

export class SlotGameEngine {
  constructor(private config: SlotConfig) {}

  /**
   * Gera o resultado de um giro (Spin).
   */
  public spin() {
    const matrix: string[][] = [];

    for (let i = 0; i < this.config.reels; i++) {
      const reelResult: string[] = [];
      const strip = this.config.reelsStrips[i];
      const stopPosition = GameMathEngine.getRandomInt(0, strip.length - 1);

      for (let j = 0; j < this.config.rows; j++) {
        const symbolIndex = (stopPosition + j) % strip.length;
        reelResult.push(strip[symbolIndex]);
      }
      matrix.push(reelResult);
    }

    return matrix;
  }

  /**
   * Verifica linhas de pagamento (Simples: 3x3 ou 3x5 horizontal).
   * Em uma versão real, usaríamos Paylines dinâmicas.
   */
  public calculateWins(matrix: string[][], betPerLine: number) {
    let totalWin = 0;
    const winningLines: any[] = [];

    // Exemplo de verificação de linha horizontal central
    const middleRow = matrix.map(reel => reel[1]);
    const firstSymbol = middleRow[0];
    let count = 1;

    for (let i = 1; i < middleRow.length; i++) {
      if (middleRow[i] === firstSymbol) {
        count++;
      } else {
        break;
      }
    }

    const paytable = this.config.paytable[firstSymbol];
    if (paytable && count >= 3) {
      const multiplier = paytable[count - 1] || 0;
      totalWin += betPerLine * multiplier;
      winningLines.push({ line: 'middle', count, symbol: firstSymbol, win: betPerLine * multiplier });
    }

    return { totalWin, winningLines };
  }
}
