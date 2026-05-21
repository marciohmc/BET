import { Router } from 'express';
import { getLogsJSON, clearLogsHandler, getLogsView, addTestLogHandler } from '../controllers/log.controller';

const router = Router();

// Endpoint for raw logs JSON (used by live page updates)
router.get('/', getLogsJSON);

// Endpoint to POST a test log
router.post('/', addTestLogHandler);

// Endpoint to purge the logs
router.delete('/', clearLogsHandler);

// Endpoint that serves a highly visual HTML log monitor
router.get('/view', getLogsView);

export default router;
