import { Router } from 'express';
import { processPayment, getMyPayments, getPaymentById } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/my', authorize('PATIENT'), getMyPayments);
router.get('/:id', getPaymentById);
router.post('/:appointmentId/pay', authorize('PATIENT'), processPayment);

export default router;
