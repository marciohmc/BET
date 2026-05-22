import axios from 'axios';

/**
 * Serviço responsável por comunicar a G-Machine com o Backend do Cassanova.
 * Implementa o protocolo Seamless Wallet (Carteira Única).
 */
export class PlatformService {
  private static API_URL = process.env.CASSANOVA_API_URL || 'http://localhost:3000/api';
  private static SECRET = process.env.G_MACHINE_SECRET || 'secret';

  /**
   * Valida o token do jogador e retorna o saldo e dados do perfil.
   */
  public static async validateSession(token: string) {
    try {
      const response = await axios.get(`${this.API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('[PLATFORM-SERVICE] Erro ao validar sessão:', error);
      return null;
    }
  }

  /**
   * Realiza o débito da aposta (Bet) na plataforma principal.
   */
  public static async debitBalance(token: string, amount: number, gameId: string) {
    try {
      // Aqui chamaremos um endpoint específico que criaremos no backend principal para a G-Machine
      const response = await axios.post(`${this.API_URL}/transactions/game/bet`, {
        amount,
        gameId,
        secret: this.SECRET
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('[PLATFORM-SERVICE] Erro no débito:', error);
      throw new Error('Erro ao processar aposta');
    }
  }

  /**
   * Realiza o crédito do ganho (Win) na plataforma principal.
   */
  public static async creditBalance(token: string, amount: number, gameId: string, transactionId: string) {
    try {
      const response = await axios.post(`${this.API_URL}/transactions/game/win`, {
        amount,
        gameId,
        betTransactionId: transactionId,
        secret: this.SECRET
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('[PLATFORM-SERVICE] Erro no crédito:', error);
      throw new Error('Erro ao processar prêmio');
    }
  }
}
