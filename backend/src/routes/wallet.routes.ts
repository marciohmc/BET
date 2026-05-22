import { Router } from 'express';
import { debit, credit } from '../controllers/wallet.controller';

const router = Router();

router.post('/debit', debit);
router.post('/credit', credit);

export default router;
