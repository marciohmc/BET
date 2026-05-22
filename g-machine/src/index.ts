import { Server, Socket } from 'socket.io';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { RNG } from './core/rng';
import { SlotEngine } from './core/slots';

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
const sessionSeeds: Record<string, string> = {};

export function setupGMachine(io: Server, backendUrl: string) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected to G-Machine:', socket.id);

    socket.on('join_game', ({ userId, gameSlug }) => {
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

        const matrix = engine.generateMatrix(serverSeed, clientSeed, nonce);
        const win = engine.calculatePayout(matrix, bet);
        const transactionId = uuidv4();
        
        try {
          const response = await axios.post(`${backendUrl}/gmachine/sync`, {
            userId,
            betAmount: bet,
            winAmount: win,
            gameSlug: 'tiger-original',
            transactionId
          });

          if (!response.data.success) {
            throw new Error(response.data.message || 'Sync failed');
          }

          socket.emit('spin_result', {
            matrix,
            win,
            newBalance: response.data.newBalance,
            newNonce: nonce + 1,
            serverSeedHash: RNG.hashServerSeed(serverSeed)
          });

          sessionSeeds[socket.id] = RNG.generateServerSeed();

        } catch (syncError: any) {
          socket.emit('error', { 
            message: syncError.response?.data?.message || 'Erro de sincronização de saldo' 
          });
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      delete sessionSeeds[socket.id];
    });
  });
}
