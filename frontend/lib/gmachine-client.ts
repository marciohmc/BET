import { io, Socket } from 'socket.io-client';

class GMachineClient {
  private socket: Socket | null = null;
  private getInitialUrl() {
    if (typeof window !== 'undefined') {
      const envUrl = process.env.NEXT_PUBLIC_G_MACHINE_URL;
      if (envUrl) return envUrl;
      
      // Se estiver em produção (Render/etc), o backend integrado estará no mesmo host
      // mas possivelmente em betdabetbe.onrender.com enquanto o front está em betdabet.onrender.com
      // Então respeitamos o env se existir, caso contrário tentamos derivar ou ficamos no padrão.
      const hostname = window.location.hostname;
      if (hostname.includes('onrender.com')) {
        // Se o front está no render, o backend provavelmente também está.
        // O usuário configurou betdabetbe.onrender.com nos logs.
      }
    }
    return process.env.NEXT_PUBLIC_G_MACHINE_URL || 'http://localhost:5000'; // Mudado para 5000 pois agora está integrado
  }

  private url = this.getInitialUrl();

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
