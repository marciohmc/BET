import { io, Socket } from 'socket.io-client';

class GMachineClient {
  private socket: Socket | null = null;
  private url = process.env.NEXT_PUBLIC_G_MACHINE_URL || 'http://localhost:3001';

  public connect(token: string, gameId: string) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.url, {
      transports: ['websocket'], // Forçar websocket para menor latência
    });

    this.socket.on('connect', () => {
      console.log('[G-MACHINE] Conectado ao servidor de jogos');
      this.socket?.emit('join_game', { gameId, token });
    });

    this.socket.on('error', (msg: string) => {
      console.error('[G-MACHINE] Erro:', msg);
    });

    return this.socket;
  }

  public spin(token: string, gameId: string, bet: number) {
    if (!this.socket) return;
    this.socket.emit('spin', { token, gameId, bet });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const gMachineClient = new GMachineClient();
