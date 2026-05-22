import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import next from 'next';
import { createBackendApp } from './backend/src/app';
import { setupGMachine } from './g-machine/src/index';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './frontend' });
const handle = app.getRequestHandler();

const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cassanova';

async function startServer() {
  await app.prepare();
  
  const server = express();
  const httpServer = createServer(server);
  
  // 1. Initialize Socket.io for G-Machine
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });
  setupGMachine(io, `http://localhost:${PORT}/api`);

  // 2. Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }

  // 3. Mount Backend API
  const backendApp = createBackendApp();
  server.use(backendApp);

  // 4. Handle Next.js Requests
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Cassanova Unified Server running on http://localhost:${PORT}`);
    console.log(`- Frontend: ${PORT}`);
    console.log(`- API: ${PORT}/api`);
    console.log(`- G-Machine: WS on ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Unified Server Startup Error:', err);
});
