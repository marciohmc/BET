import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // Porta diferente do backend principal

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Endpoint básico de saúde (Handshake com a Plataforma)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Cassanova G-Machine',
    version: '1.0.0-alpha' 
  });
});

// Middleware de Logs para Auditoria das Rodadas
app.use((req, res, next) => {
  console.log(`[RGS-LOG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

import { PlatformService } from './services/PlatformService';
import { SlotGameEngine, SlotConfig } from './games/SlotEngine';

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

// Gerenciamento de Conexões em Tempo Real (Jogos)
io.on('connection', (socket) => {
  console.log(`[G-MACHINE] Novo jogador conectado: ${socket.id}`);

  socket.on('join_game', async (data: { gameId: string, token: string }) => {
    console.log(`[G-MACHINE] Jogador tentando entrar no jogo: ${data.gameId}`);
    
    const user = await PlatformService.validateSession(data.token);
    if (!user) {
      socket.emit('error', 'Sessão inválida. Por favor, faça login novamente.');
      return;
    }

    socket.join(data.gameId);
    socket.emit('game_ready', { 
      balance: user.balance, 
      config: data.gameId === 'tiger' ? TIGER_CONFIG : null 
    });
  });

  socket.on('spin', async (data: { gameId: string, token: string, bet: number }) => {
    try {
      // 1. Validar Sessão e Saldo (Handshake)
      const user = await PlatformService.validateSession(data.token);
      if (!user || user.balance < data.bet) {
        return socket.emit('error', 'Saldo insuficiente ou sessão expirada.');
      }

      // 2. Débito Atômico na Plataforma
      await PlatformService.debitBalance(data.token, data.bet, data.gameId);

      // 3. Processar Matemática no Motor (RGS)
      const matrix = tigerEngine.spin();
      const { totalWin, winningLines } = tigerEngine.calculateWins(matrix, data.bet / 1); // Exemplo simplificado

      // 4. Crédito de Ganho se houver
      if (totalWin > 0) {
        await PlatformService.creditBalance(data.token, totalWin, data.gameId, 'tx_' + Date.now());
      }

      // 5. Emitir resultado para o Frontend exibir animação
      socket.emit('spin_result', {
        matrix,
        totalWin,
        winningLines,
        newBalance: user.balance - data.bet + totalWin
      });

    } catch (error: any) {
      socket.emit('error', error.message || 'Erro inesperado no servidor de jogo.');
    }
  });

  socket.on('disconnect', () => {
    console.log(`[G-MACHINE] Jogador desconectado: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`🚀 Cassanova G-Machine (RGS) rodando na porta ${port}`);
});
