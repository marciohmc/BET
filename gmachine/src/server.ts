import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { SlotEngine } from './math/slotEngine.js';
import { WalletService } from './services/walletService.js';
import { GameAction, WSMessage } from './types/game.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-jwt-secret';

const wss = new WebSocketServer({ port: PORT });
const engine = new SlotEngine();

console.log(`[G-Machine] RGS Running on port ${PORT}`);

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
          return ws.send(JSON.stringify({ action: 'auth_ok', userId }));
        } catch (err) {
          return ws.send(JSON.stringify({ error: 'Invalid Session' }));
        }
      }

      // 2. Proteção de conexão não autenticada
      if (!isAuthenticated || !userId) {
        return ws.send(JSON.stringify({ error: 'Unauthorized' }));
      }

      // 3. Game Logic: SPIN
      if (message.action === GameAction.SPIN) {
        const { bet } = message.payload;
        if (!bet || bet <= 0) return ws.send(JSON.stringify({ error: 'Invalid bet' }));

        try {
          // A. Seamless Wallet: DEBIT
          const debitRes = await WalletService.debit(userId, bet);
          
          // B. Engine Logic
          const result = engine.spin(bet);

          // C. Seamless Wallet: CREDIT
          if (result.totalWin > 0) {
            await WalletService.credit(userId, result.totalWin);
          }

          // D. Response updated balance (Backend usually returns it in debit/credit)
          // Enviamos o resultado completo para o cliente renderizar
          ws.send(JSON.stringify({
            action: 'spin_result',
            payload: result,
            balance: debitRes.balance + (result.totalWin > 0 ? result.totalWin : 0) // Simples estimativa, o ideal é o backend retornar após crédito
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
