import { Router } from 'express';
import { matchSymptom, getSymptomRules } from '../controllers/symptom.controller';

const router = Router();

router.post('/match', matchSymptom);
router.get('/rules', getSymptomRules);

export default router;
