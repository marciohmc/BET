import { Router } from 'express';
import { getDiagnostics } from '../controllers/diagnostics.controller';

const router = Router();

router.get('/', getDiagnostics);

export default router;
