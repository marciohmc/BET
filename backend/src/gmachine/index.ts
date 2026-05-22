import { Server } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { SlotGameEngine, SlotConfig } from './SlotEngine';

// Configuração de exemplo para um Slot tipo "Fortune Tiger"
const TIGER_CONFIG: SlotConfig = {
  reels: 3,
  rows: 3,
  symbols: ['gold_ingot', 'red_envelope', 'orange', 'firecracker', 'tiger_wild'],
  paytable: {
    'tiger_wild': [0, 0, 50],
    'gold_ingot': [0, 0, 20],
    'red_envelope': [0, 0, 10],
    'orange': [0, 0, 5],
    'firecracker': [0, 0, 3],
  },
  reelsStrips: [
    ['tiger_wild', 'orange', 'gold_ingot', 'red_envelope', 'orange', 'firecracker'],
    ['gold_ingot', 'tiger_wild', 'red_envelope', 'firecracker', 'orange', 'gold_ingot'],
    ['red_envelope', 'orange', 'firecracker', 'tiger_wild', 'gold_ingot', 'red_envelope'],
  ]
};

const tigerEngine = new SlotGameEngine(TIGER_CONFIG);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function setupGameServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  console.log('[G-MACHINE] Integrado ao Servidor Principal');

  io.on('connection', (socket) => {
    console.log(`[G-MACHINE] Novo jogador conectado: ${socket.id}`);

    socket.on('join_game', async (data: { gameId: string, token: string }) => {
      try {
        const decoded: any = jwt.verify(data.token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          socket.emit('error', 'Sessão inválida. Por favor, faça login novamente.');
          return;
        }

        socket.join(data.gameId);
        
        const initialMatrix = data.gameId === 'tiger' ? tigerEngine.spin() : null;

        socket.emit('game_ready', { 
          balance: user.balance, 
          initialMatrix,
          config: data.gameId === 'tiger' ? TIGER_CONFIG : null 
        });
      } catch (err) {
        socket.emit('error', 'Erro na autenticação do jogo.');
      }
    });

    socket.on('spin', async (data: { gameId: string, token: string, bet: number }) => {
      try {
        const decoded: any = jwt.verify(data.token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.balance < data.bet) {
          return socket.emit('error', 'Saldo insuficiente ou sessão expirada.');
        }

        // 1. Débito do Saldo
        user.balance -= data.bet;
        
        // 2. Processar Matemática
        const matrix = tigerEngine.spin();
        const { totalWin, winningLines } = tigerEngine.calculateWins(matrix, data.bet);

        // 3. Crédito de Ganho
        if (totalWin > 0) {
          user.balance += totalWin;
        }

        await user.save();

        // 4. Emitir resultado
        socket.emit('spin_result', {
          matrix,
          totalWin,
          winningLines,
          newBalance: user.balance
        });

      } catch (error: any) {
        socket.emit('error', error.message || 'Erro inesperado no servidor de jogo.');
      }
    });

    socket.on('disconnect', () => {
      console.log(`[G-MACHINE] Jogador desconectado: ${socket.id}`);
    });
  });

  return io;
}
