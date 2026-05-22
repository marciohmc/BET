import { Router } from 'express';
import { processGameAction } from '../controllers/gmachine.controller';

const router = Router();

// This route should be protected by IP whitelist or a secret header in production
router.post('/sync', processGameAction);

export default router;
