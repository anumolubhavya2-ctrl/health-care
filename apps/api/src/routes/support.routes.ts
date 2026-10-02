import { Router } from 'express';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  sendMessage,
  escalateTicket,
} from '../controllers/support.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/tickets', createTicket);
router.get('/tickets/my', getMyTickets);
router.get('/tickets/:id', getTicketById);
router.post('/tickets/:id/messages', sendMessage);
router.patch('/tickets/:id/escalate', escalateTicket);

export default router;
