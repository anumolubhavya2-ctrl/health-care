import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';

// ============================================================
// Rule-based symptom → specialty mapping (deterministic, no external API)
// ============================================================
interface SymptomRule {
  keywords: string[];
  specialty: string;
  specialtySlug: string;
  reason: string;
  confidence: number;
}

const SYMPTOM_RULES: SymptomRule[] = [
  {
    keywords: ['chest pain', 'heart', 'palpitation', 'shortness of breath', 'breathlessness', 'cardiac', 'angina'],
    specialty: 'Cardiologist',
    specialtySlug: 'cardiology',
    reason: 'Chest and heart-related symptoms are best evaluated by a cardiologist.',
    confidence: 0.9,
  },
  {
    keywords: ['skin', 'rash', 'itching', 'eczema', 'acne', 'psoriasis', 'dermatitis', 'hives', 'skin irritation', 'pimple', 'spot'],
    specialty: 'Dermatologist',
    specialtySlug: 'dermatology',
    reason: 'Skin-related symptoms require evaluation by a dermatologist.',
    confidence: 0.9,
  },
  {
    keywords: ['headache', 'migraine', 'dizziness', 'seizure', 'numbness', 'tremor', 'memory', 'stroke', 'nerve', 'neurological'],
    specialty: 'Neurologist',
    specialtySlug: 'neurology',
    reason: 'Neurological symptoms such as headaches, dizziness, or memory issues are handled by neurologists.',
    confidence: 0.85,
  },
  {
    keywords: ['bone', 'joint', 'knee', 'back pain', 'fracture', 'arthritis', 'shoulder', 'hip', 'spine', 'muscle pain', 'ortho'],
    specialty: 'Orthopedic Surgeon',
    specialtySlug: 'orthopedics',
    reason: 'Bone and joint problems are managed by orthopedic specialists.',
    confidence: 0.88,
  },
  {
    keywords: ['stomach', 'abdomen', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'acidity', 'gastric', 'liver', 'bowel', 'digestion', 'ibs'],
    specialty: 'Gastroenterologist',
    specialtySlug: 'gastroenterology',
    reason: 'Digestive and abdominal symptoms require evaluation by a gastroenterologist.',
    confidence: 0.87,
  },
  {
    keywords: ['breathing', 'cough', 'asthma', 'lung', 'respiratory', 'wheezing', 'bronchitis', 'pneumonia', 'sputum', 'inhaler'],
    specialty: 'Pulmonologist',
    specialtySlug: 'pulmonology',
    reason: 'Respiratory and lung symptoms are best handled by a pulmonologist.',
    confidence: 0.88,
  },
  {
    keywords: ['eye', 'vision', 'blurred', 'cataract', 'glaucoma', 'redness in eyes', 'watery eyes', 'eye pain'],
    specialty: 'Ophthalmologist',
    specialtySlug: 'ophthalmology',
    reason: 'Eye and vision problems require evaluation by an ophthalmologist.',
    confidence: 0.92,
  },
  {
    keywords: ['ear', 'hearing', 'throat', 'nose', 'sinus', 'tonsil', 'ent', 'cold', 'nasal', 'snoring'],
    specialty: 'ENT Specialist',
    specialtySlug: 'ent',
    reason: 'Ear, nose, and throat conditions are treated by ENT specialists.',
    confidence: 0.9,
  },
  {
    keywords: ['diabetes', 'thyroid', 'hormone', 'weight gain', 'obesity', 'insulin', 'adrenal', 'endocrine', 'blood sugar'],
    specialty: 'Endocrinologist',
    specialtySlug: 'endocrinology',
    reason: 'Hormonal and metabolic disorders are managed by endocrinologists.',
    confidence: 0.87,
  },
  {
    keywords: ['kidney', 'urine', 'urinary', 'bladder', 'nephrologist', 'renal', 'creatinine', 'dialysis'],
    specialty: 'Nephrologist',
    specialtySlug: 'nephrology',
    reason: 'Kidney and urinary tract conditions require a nephrologist.',
    confidence: 0.88,
  },
  {
    keywords: ['pregnancy', 'menstrual', 'period', 'gynecology', 'ovary', 'uterus', 'fertility', 'pcos', 'menopause', 'vaginal'],
    specialty: 'Gynecologist',
    specialtySlug: 'gynecology',
    reason: 'Female reproductive health issues are managed by gynecologists/obstetricians.',
    confidence: 0.92,
  },
  {
    keywords: ['child', 'baby', 'infant', 'toddler', 'pediatric', 'vaccination', 'growth delay', 'newborn'],
    specialty: 'Pediatrician',
    specialtySlug: 'pediatrics',
    reason: 'Health issues in children and infants require a pediatrician.',
    confidence: 0.92,
  },
  {
    keywords: ['anxiety', 'depression', 'mental health', 'stress', 'insomnia', 'phobia', 'panic', 'psychiatry', 'mood', 'bipolar', 'ocd'],
    specialty: 'Psychiatrist',
    specialtySlug: 'psychiatry',
    reason: 'Mental health concerns require the attention of a psychiatrist.',
    confidence: 0.87,
  },
  {
    keywords: ['cancer', 'tumor', 'oncology', 'chemotherapy', 'biopsy', 'malignant', 'lymphoma', 'leukemia'],
    specialty: 'Oncologist',
    specialtySlug: 'oncology',
    reason: 'Cancer and tumor-related concerns must be evaluated by an oncologist urgently.',
    confidence: 0.93,
  },
  {
    keywords: ['fever', 'infection', 'flu', 'cold', 'fatigue', 'weakness', 'body ache', 'general', 'routine', 'checkup'],
    specialty: 'General Physician',
    specialtySlug: 'general-medicine',
    reason: 'General symptoms like fever, fatigue, and body ache are best assessed by a general physician first.',
    confidence: 0.8,
  },
];

const matchSymptoms = (input: string): SymptomRule | null => {
  const normalizedInput = input.toLowerCase();
  let bestMatch: SymptomRule | null = null;
  let bestScore = 0;

  for (const rule of SYMPTOM_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (normalizedInput.includes(keyword)) {
        score += keyword.split(' ').length; // Multi-word matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  return bestScore > 0 ? bestMatch : null;
};

// POST /symptoms/match
export const matchSymptom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      symptoms: z.string().min(3, 'Please describe your symptoms in more detail'),
    });

    const { symptoms } = schema.parse(req.body);

    const match = matchSymptoms(symptoms);

    if (!match) {
      // Default to general physician
      const gpSpecialty = await prisma.specialty.findFirst({
        where: { slug: 'general-medicine' },
      });

      const doctors = await prisma.doctor.findMany({
        where: {
          isVerified: true,
          ...(gpSpecialty ? {
            specialties: { some: { specialtyId: gpSpecialty.id } },
          } : {}),
          status: { not: 'OFFLINE' },
        },
        include: { specialties: { include: { specialty: true }, where: { isPrimary: true } } },
        take: 5,
        orderBy: { rating: 'desc' },
      });

      sendSuccess(res, {
        matched: false,
        recommendation: {
          specialty: 'General Physician',
          specialtySlug: 'general-medicine',
          reason: 'Based on your symptoms, we recommend starting with a General Physician who can assess and refer you to a specialist if needed.',
          confidence: 0.7,
        },
        doctors,
        disclaimer: 'This is not a medical diagnosis. Please consult a qualified doctor for proper evaluation.',
      });
      return;
    }

    // Find matching doctors
    const specialty = await prisma.specialty.findFirst({
      where: { slug: match.specialtySlug },
    });

    const doctors = await prisma.doctor.findMany({
      where: {
        isVerified: true,
        ...(specialty ? {
          specialties: { some: { specialtyId: specialty.id } },
        } : {}),
      },
      include: {
        specialties: { include: { specialty: true }, where: { isPrimary: true } },
        availabilities: true,
        queue: true,
      },
      take: 6,
      orderBy: [{ rating: 'desc' }, { status: 'asc' }],
    });

    sendSuccess(res, {
      matched: true,
      recommendation: {
        specialty: match.specialty,
        specialtySlug: match.specialtySlug,
        reason: match.reason,
        confidence: match.confidence,
      },
      doctors,
      disclaimer: 'This is for specialist navigation only and is NOT a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.',
    });
  } catch (error) {
    next(error);
  }
};

// GET /symptoms/rules - Return all rules (for display)
export const getSymptomRules = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, SYMPTOM_RULES.map((r) => ({
      specialty: r.specialty,
      specialtySlug: r.specialtySlug,
      exampleSymptoms: r.keywords.slice(0, 4),
    })));
  } catch (error) {
    next(error);
  }
};
