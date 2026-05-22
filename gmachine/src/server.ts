import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { SlotEngine } from './math/slotEngine.js';
import { WalletService } from './services/walletService.js';
import { GameAction, WSMessage } from './types/game.js';
import { redisService } from './services/redisService.js';
import { ProvablyFair } from './core/provablyFair.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-jwt-secret';

const wss = new WebSocketServer({ port: PORT });
const engine = new SlotEngine();

console.log(`[G-Machine] RGS Running on port ${PORT}`);

// Helper to get or initialize a user's Provably Fair seeds
async function getOrInitSeeds(userId: string) {
  const seedsKey = `pf_seeds:${userId}`;
  const saved = await redisService.get(seedsKey);
  
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // JSON parse error, recreate below
    }
  }

  const serverSeed = ProvablyFair.generateServerSeed();
  const serverSeedHash = ProvablyFair.hashSeed(serverSeed);
  const clientSeed = ProvablyFair.generateClientSeed();
  const fairState = {
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce: 0
  };

  await redisService.set(seedsKey, JSON.stringify(fairState));
  return fairState;
}

wss.on('connection', (ws: WebSocket) => {
  let userId: string | null = null;
  let isAuthenticated = false;

  ws.on('message', async (data: Buffer | string | ArrayBuffer | Buffer[]) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());

      // 1. Handshake / Auth
      if (message.action === GameAction.AUTH) {
        if (!message.token) return ws.send(JSON.stringify({ error: 'No token provided' }));
        
        try {
          const decoded = jwt.verify(message.token, JWT_SECRET) as { id: string };
          userId = decoded.id;
          isAuthenticated = true;

          // Initialize/retrieve Provably Fair seeds
          const fairState = await getOrInitSeeds(userId);

          // Check if there is a pending bonus that can be resumed
          const bonusKey = `active_bonus:${userId}`;
          const pendingBonusStr = await redisService.get(bonusKey);
          let resumedBonus = null;

          if (pendingBonusStr) {
            try {
              resumedBonus = JSON.parse(pendingBonusStr);
              console.log(`[G-Machine] Resuming pending bonus for user: ${userId}`);
            } catch {
              // Ignore corrupt JSON
            }
          }

          return ws.send(JSON.stringify({ 
            action: 'auth_ok', 
            userId,
            fairState: {
              serverSeedHash: fairState.serverSeedHash,
              clientSeed: fairState.clientSeed,
              nonce: fairState.nonce
            },
            resumedBonus
          }));
        } catch (err) {
          return ws.send(JSON.stringify({ error: 'Invalid Session' }));
        }
      }

      // 2. Proteção de conexão não autenticada
      if (!isAuthenticated || !userId) {
        return ws.send(JSON.stringify({ error: 'Unauthorized' }));
      }

      // 3. Provably Fair Actions: GET_FAIR
      if (message.action === GameAction.GET_FAIR) {
        const fairState = await getOrInitSeeds(userId);
        return ws.send(JSON.stringify({
          action: 'fair_seeds',
          fairState: {
            serverSeedHash: fairState.serverSeedHash,
            clientSeed: fairState.clientSeed,
            nonce: fairState.nonce
          }
        }));
      }

      // 4. Provably Fair Actions: UPDATE_SEED
      if (message.action === GameAction.UPDATE_SEED) {
        const { clientSeed } = message.payload || {};
        if (!clientSeed || typeof clientSeed !== 'string' || clientSeed.trim() === '') {
          return ws.send(JSON.stringify({ error: 'Invalid client seed' }));
        }

        const seedsKey = `pf_seeds:${userId}`;
        const previousState = await getOrInitSeeds(userId);

        // Generate fresh secret server seed & hash, reset nonce
        const newServerSeed = ProvablyFair.generateServerSeed();
        const newServerSeedHash = ProvablyFair.hashSeed(newServerSeed);
        const newState = {
          serverSeed: newServerSeed,
          serverSeedHash: newServerSeedHash,
          clientSeed: clientSeed.trim(),
          nonce: 0
        };

        await redisService.set(seedsKey, JSON.stringify(newState));

        // Return seeds info and REVEAL the previous unhashed Server Seed for audit verification!
        return ws.send(JSON.stringify({
          action: 'update_seed_result',
          revealedPreviousServerSeed: previousState.serverSeed,
          fairState: {
            serverSeedHash: newState.serverSeedHash,
            clientSeed: newState.clientSeed,
            nonce: newState.nonce
          }
        }));
      }

      // 5. Game Logic: SPIN
      if (message.action === GameAction.SPIN) {
        const { bet } = message.payload || {};
        if (!bet || bet <= 0) return ws.send(JSON.stringify({ error: 'Invalid bet' }));

        try {
          // A. Seamless Wallet: DEBIT
          const debitRes = await WalletService.debit(userId, bet);
          
          // Retrieve current seeds state from Redis
          const seedsKey = `pf_seeds:${userId}`;
          const fairState = await getOrInitSeeds(userId);

          // B. Engine Logic using Provably Fair data
          const result = engine.spin(bet, {
            serverSeed: fairState.serverSeed,
            clientSeed: fairState.clientSeed,
            nonce: fairState.nonce
          });

          // Increment nonce for the next round
          fairState.nonce += 1;
          await redisService.set(seedsKey, JSON.stringify(fairState));

          // Save/persist bonus step into Redis if triggered
          const bonusKey = `active_bonus:${userId}`;
          if (result.isBonus) {
            await redisService.set(bonusKey, JSON.stringify({
              timestamp: Date.now(),
              bet,
              bonusResult: result.bonusResult
            }), 1800); // Expires in 30 minutes
            console.log(`[Redis] Stored active respin bonus for user: ${userId}`);
          } else {
            // Clean active bonus if a normal spin is evaluated without bonus
            await redisService.del(bonusKey);
          }

          // C. Seamless Wallet: CREDIT
          if (result.totalWin > 0) {
            await WalletService.credit(userId, result.totalWin);
          }

          // If bonus existed and has run successfully, we clear the active bonus key
          if (!result.isBonus) {
            await redisService.del(bonusKey);
          }

          // D. Response with updated balance & seeds metadata
          ws.send(JSON.stringify({
            action: 'spin_result',
            payload: result,
            balance: debitRes.balance + (result.totalWin > 0 ? result.totalWin : 0),
            fairState: {
              serverSeedHash: fairState.serverSeedHash,
              clientSeed: fairState.clientSeed,
              nonce: fairState.nonce // Return updated nonce for next round
            }
          }));

        } catch (error: any) {
          ws.send(JSON.stringify({ action: 'error', message: error.message }));
        }
      }

    } catch (err) {
      console.error('[G-Machine] Parse Error:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[G-Machine] Client disconnected: ${userId}`);
  });
});
