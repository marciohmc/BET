import crypto from 'crypto';

/**
 * G-Machine RNG System - Provably Fair
 * 
 * Uses HMAC-SHA256 to generate random results based on three inputs:
 * 1. Server Seed (Secret, hashed before play)
 * 2. Client Seed (Provided by user)
 * 3. Nonce (Sequential number of bets)
 */
export class RNG {
  /**
   * Generates a random number between 0 and 1
   */
  static generateResult(serverSeed: string, clientSeed: string, nonce: number): number {
    const combinedHash = crypto
      .createHmac('sha256', serverSeed)
      .update(`${clientSeed}:${nonce}`)
      .digest('hex');

    // Convert hex to float (0..1)
    // We take the first 8 characters and divide by max hex value
    const hexSlice = combinedHash.substring(0, 8);
    return parseInt(hexSlice, 16) / 0xffffffff;
  }

  /**
   * Generates a random integer between min and max (inclusive)
   */
  static getRandomInt(serverSeed: string, clientSeed: string, nonce: number, min: number, max: number): number {
    const random = this.generateResult(serverSeed, clientSeed, nonce);
    return Math.floor(random * (max - min + 1)) + min;
  }

  /**
   * Generates a new secure server seed
   */
  static generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generates a hash of the server seed (to show the player before they play)
   */
  static hashServerSeed(seed: string): string {
    return crypto.createHash('sha256').update(seed).digest('hex');
  }
}
