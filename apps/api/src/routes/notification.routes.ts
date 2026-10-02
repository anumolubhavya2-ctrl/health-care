import { Router } from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read', markAsRead);

export default router;
