import crypto from 'crypto';

/**
 * RNG (Random Number Generator) de nível industrial para iGaming.
 * Utiliza o módulo crypto do Node.js para garantir imprevisibilidade.
 */
export class GameMathEngine {
  /**
   * Gera um número inteiro aleatório entre um intervalo (inclusive).
   */
  public static getRandomInt(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValidValue = Math.floor(Math.pow(256, bytesNeeded) / range) * range;

    let randomValue: number;
    do {
      randomValue = crypto.randomBytes(bytesNeeded).readUIntBE(0, bytesNeeded);
    } while (randomValue >= maxValidValue);

    return min + (randomValue % range);
  }

  /**
   * Simula um sorteio baseado em pesos (Weights).
   * Útil para decidir raridade de símbolos em Slots.
   */
  public static getWeightedResult<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let random = this.getRandomInt(1, totalWeight);

    for (let i = 0; i < items.length; i++) {
      if (random <= weights[i]) {
        return items[i];
      }
      random -= weights[i];
    }

    return items[items.length - 1];
  }
}
