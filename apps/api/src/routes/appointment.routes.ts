import { Router } from 'express';
import {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  checkIn,
  startConsultation,
  completeConsultation,
} from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('PATIENT'), bookAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.patch('/:id/cancel', cancelAppointment);
router.patch('/:id/checkin', authorize('PATIENT'), checkIn);
router.patch('/:id/start', authorize('DOCTOR'), startConsultation);
router.patch('/:id/complete', authorize('DOCTOR'), completeConsultation);

export default router;
