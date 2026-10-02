import { Router } from 'express';
import { getMyProfile, updateMyProfile, getAppointmentHistory } from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('PATIENT'));

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.get('/me/history', getAppointmentHistory);

export default router;
