import { Router } from 'express';
import { getUserTransactions, createDeposit, createPixDeposit, createWithdrawal, createPixWithdrawal } from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserTransactions);
router.post('/deposit', createDeposit);
router.post('/deposit/pix', createPixDeposit);
router.post('/withdrawal', createWithdrawal);
router.post('/withdrawal/pix', createPixWithdrawal);

export default router;
