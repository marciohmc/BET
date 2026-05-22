import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisService {
  private client: any = null;
  private isConnected = false;
  private memoryFallback = new Map<string, string>();

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.client = createClient({
        url: REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.warn('[Redis] Connection failed. Switching permanently to memory fallback.');
              return false; // Stop retrying
            }
            return 1000;
          }
        }
      });

      this.client.on('error', (err: any) => {
        // Silent block to trigger reconnect/fallback without crashing
        console.warn('[Redis] Client error:', err.message);
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('[Redis] Connected successfully to server.');
    } catch (err: any) {
      console.warn('[Redis] Connection failed initially, using cache fallback:', err.message);
      this.client = null;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        console.warn('[Redis] Get error in client, using fallback:', err);
      }
    }
    return this.memoryFallback.get(key) || null;
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, { EX: ttlSeconds });
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        console.warn('[Redis] Set error in client, using fallback:', err);
      }
    }
    this.memoryFallback.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => {
        this.memoryFallback.delete(key);
      }, ttlSeconds * 1000);
    }
  }

  public async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        console.warn('[Redis] Del error in client, using fallback:', err);
      }
    }
    this.memoryFallback.delete(key);
  }
}

export const redisService = new RedisService();
