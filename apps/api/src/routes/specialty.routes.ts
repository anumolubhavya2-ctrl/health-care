import { Router } from 'express';
import { getSpecialties, getSpecialtyById, createSpecialty, updateSpecialty } from '../controllers/specialty.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getSpecialties);
router.get('/:id', getSpecialtyById);
router.post('/', authenticate, authorize('ADMIN'), createSpecialty);
router.put('/:id', authenticate, authorize('ADMIN'), updateSpecialty);

export default router;
