import { Router } from 'express';
import { getMyRefunds, requestRefund, getRefundById, processRefund } from '../controllers/refund.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/my', authorize('PATIENT'), getMyRefunds);
router.post('/', authorize('PATIENT'), requestRefund);
router.get('/:id', getRefundById);
router.patch('/:id/process', authorize('ADMIN'), processRefund);

export default router;
