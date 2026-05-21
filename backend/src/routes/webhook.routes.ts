import { Router } from 'express';
import { handlePixGoWebhook } from '../controllers/webhook.controller';
import express from 'express';

const router = Router();
router.post('/pixgo', express.raw({ type: 'application/json' }), handlePixGoWebhook);
export default router;
