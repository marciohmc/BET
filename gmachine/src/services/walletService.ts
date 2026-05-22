import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.CASSANOVA_API_URL || 'http://localhost:3000/api/v1';
const GM_SECRET = process.env.G_MACHINE_SECRET || 'gm-secret-key-123';

export class WalletService {
  public static async debit(userId: string, amount: number) {
    try {
      const response = await axios.post(`${BACKEND_URL}/wallet/debit`, {
        userId,
        amount,
        secret: GM_SECRET
      });
      return response.data; // { success: true, balance: number }
    } catch (error: any) {
      console.error('[GM-Wallet] Debit Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Insuficiente Balance or Wallet Error');
    }
  }

  public static async credit(userId: string, amount: number) {
    if (amount <= 0) return;
    try {
      const response = await axios.post(`${BACKEND_URL}/wallet/credit`, {
        userId,
        amount,
        secret: GM_SECRET
      });
      return response.data;
    } catch (error: any) {
      console.error('[GM-Wallet] Credit Error:', error.response?.data || error.message);
      // Aqui poderíamos implementar uma fila de retry se o crédito falhar
    }
  }
}
