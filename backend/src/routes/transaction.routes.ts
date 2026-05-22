import { Router } from 'express';
import { getUserTransactions, createDeposit, createPixDeposit, createWithdrawal, createPixWithdrawal, processGameBet, processGameWin } from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserTransactions);
router.post('/deposit', createDeposit);
router.post('/deposit/pix', createPixDeposit);
router.post('/withdrawal', createWithdrawal);
router.post('/withdrawal/pix', createPixWithdrawal);

// G-Machine Game Transactions (Seamless Wallet)
router.post('/game/bet', processGameBet);
router.post('/game/win', processGameWin);

export default router;
