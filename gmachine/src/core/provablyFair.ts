import crypto from 'crypto';

export interface FairState {
  serverSeed: string; // Secret server seed
  serverSeedHash: string; // Public hashed seed
  clientSeed: string; // Player customizable seed
  nonce: number; // Play count
}

export class ProvablyFair {
  // Generates a random cryptographic server seed
  public static generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generates SHA-256 hash of a seed
  public static hashSeed(seed: string): string {
    return crypto.createHash('sha256').update(seed).digest('hex');
  }

  // Generates a default random client seed
  public static generateClientSeed(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Generates a array of 9 indexes dynamically using HMAC-SHA256.
   * This guarantees that anyone can verify the exact numbers chosen.
   */
  public static getDeterministicReelStops(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    reelLengths: number[]
  ): number[] {
    const combinedInput = `${clientSeed}-${nonce}`;
    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(combinedInput);
    const hash = hmac.digest('hex');

    const stops: number[] = [];
    for (let i = 0; i < 9; i++) {
      // Each index is computed from 4 bytes of the hex hash (8 characters)
      const offset = i * 6;
      const byteChunk = hash.substring(offset, offset + 6);
      const randomValue = parseInt(byteChunk, 16);
      
      const reelLength = reelLengths[i % reelLengths.length];
      stops.push(randomValue % reelLength);
    }

    return stops;
  }
}
