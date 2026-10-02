import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  getMyProfile,
  updateMyProfile,
  updateStatus,
  setAvailability,
  addSpecialty,
  getDoctorAvailability,
  getTodayAppointments,
} from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/availability', getDoctorAvailability);

// Doctor authenticated routes
router.get('/me/profile', authenticate, authorize('DOCTOR'), getMyProfile);
router.put('/me/profile', authenticate, authorize('DOCTOR'), updateMyProfile);
router.patch('/me/status', authenticate, authorize('DOCTOR'), updateStatus);
router.post('/me/availability', authenticate, authorize('DOCTOR'), setAvailability);
router.post('/me/specialties', authenticate, authorize('DOCTOR'), addSpecialty);
router.get('/me/appointments/today', authenticate, authorize('DOCTOR'), getTodayAppointments);

export default router;
