import { io, Socket } from 'socket.io-client';

class GMachineClient {
  private socket: Socket | null = null;
  private url = process.env.NEXT_PUBLIC_G_MACHINE_URL || 'http://localhost:3001';

  public getUrl() {
    return this.url;
  }

  public connect(token: string, gameId: string) {
    console.log('[G-MACHINE] Tentando conectar ao URL:', this.url);
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.url, {
      // Remover transports restrito para permitir fallback automático e handshake inicial via polling
      // que é mais resiliente em arquiteturas de proxy como Render/Heroku
      reconnectionAttempts: 5,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('[G-MACHINE] Conectado ao servidor de jogos');
      this.socket?.emit('join_game', { gameId, token });
    });

    this.socket.on('error', (msg: string) => {
      console.error('[G-MACHINE] Erro:', msg);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[G-MACHINE] Erro de conexão detalhado:', {
        message: err.message,
        url: this.url,
        stack: err.stack
      });
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
