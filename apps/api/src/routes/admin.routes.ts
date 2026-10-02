import { Router } from 'express';
import {
  getStats,
  getAllDoctors,
  verifyDoctor,
  getAllPatients,
  getAllAppointments,
  getAllRefunds,
  getAllTickets,
} from '../controllers/admin.controller';
import { processRefund } from '../controllers/refund.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/doctors', getAllDoctors);
router.patch('/doctors/:id/verify', verifyDoctor);
router.get('/patients', getAllPatients);
router.get('/appointments', getAllAppointments);
router.get('/refunds', getAllRefunds);
router.patch('/refunds/:id/process', processRefund);  // admin-protected refund processing
router.get('/support', getAllTickets);

export default router;
