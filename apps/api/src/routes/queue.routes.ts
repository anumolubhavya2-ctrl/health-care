import { Router } from 'express';
import { getQueue, getMyQueuePosition, callNextPatient } from '../controllers/queue.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// IMPORTANT: specific routes must come BEFORE wildcard /:doctorId
router.get('/my/position', authenticate, authorize('PATIENT'), getMyQueuePosition);
router.patch('/next', authenticate, authorize('DOCTOR'), callNextPatient);
router.get('/:doctorId', getQueue);

export default router;
