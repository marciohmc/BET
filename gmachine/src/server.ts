import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { RNG } from './core/rng';
import { SlotEngine } from './core/slots';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = 6000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

// Demo Configuration for "Tiger Original"
const tigerConfig = {
  reels: 3,
  rows: 3,
  symbols: [
    { id: 'tiger_gold', value: 50, weight: 1 },
    { id: 'tiger_red', value: 20, weight: 5 },
    { id: 'tiger_blue', value: 10, weight: 10 },
    { id: 'coin', value: 5, weight: 20 },
    { id: 'envelope', value: 2, weight: 40 },
    { id: 'orange', value: 1, weight: 60 }
  ],
  rtp: 0.96
};

const engine = new SlotEngine(tigerConfig);

// Keep server seed state (In production, use Redis/DB)
const sessionSeeds: Record<string, string> = {};

io.on('connection', (socket) => {
  console.log('Client connected to G-Machine:', socket.id);

  socket.on('join_game', ({ userId, gameSlug }) => {
    console.log(`[G-Machine] User ${userId} joined game ${gameSlug}`);
    
    // Generate initial seeds
    const serverSeed = RNG.generateServerSeed();
    sessionSeeds[socket.id] = serverSeed;
    
    socket.emit('game_ready', {
      serverSeedHash: RNG.hashServerSeed(serverSeed),
      config: tigerConfig
    });
  });

  socket.on('spin', async ({ userId, bet, clientSeed, nonce }) => {
    try {
      const serverSeed = sessionSeeds[socket.id];
      if (!serverSeed) throw new Error('No session seed found');

      // 1. GENERATE RESULT (Deterministic for Provably Fair)
      const matrix = engine.generateMatrix(serverSeed, clientSeed, nonce);
      const win = engine.calculatePayout(matrix, bet);

      console.log(`[G-Machine] SPIN | User: ${userId} | Bet: ${bet} | Win: ${win}`);
      
      // 2. SEAMLESS WALLET: Call backend to sync balance
      const transactionId = uuidv4();
      
      try {
        const response = await axios.post(`${BACKEND_URL}/gmachine/sync`, {
          userId,
          betAmount: bet,
          winAmount: win,
          gameSlug: 'tiger-original',
          transactionId
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Sync failed');
        }

        // 3. EMIT RESULT
        socket.emit('spin_result', {
          matrix,
          win,
          newBalance: response.data.newBalance,
          newNonce: nonce + 1,
          serverSeedHash: RNG.hashServerSeed(serverSeed) // Hash for next round
        });

        // Prepare next server seed for Provably Fair chain
        sessionSeeds[socket.id] = RNG.generateServerSeed();

      } catch (syncError: any) {
        console.error(`[G-Machine] WALLET ERROR | User: ${userId} | Error:`, syncError.response?.data || syncError.message);
        socket.emit('error', { 
          message: syncError.response?.data?.message || 'Erro de sincronização de saldo' 
        });
      }

    } catch (error: any) {
      console.error(`[G-Machine] ENGINE ERROR:`, error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    delete sessionSeeds[socket.id];
    console.log('[G-Machine] Client disconnected');
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gmachine' });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`G-Machine Engine running on http://0.0.0.0:${PORT}`);
});
