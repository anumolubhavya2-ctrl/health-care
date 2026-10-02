import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response';

export const getSpecialties = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const specialties = await prisma.specialty.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { doctors: true } },
      },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, specialties);
  } catch (error) {
    next(error);
  }
};

export const getSpecialtyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const specialty = await prisma.specialty.findUnique({
      where: { id: req.params.id },
      include: {
        doctors: {
          include: {
            doctor: {
              include: { user: { select: { email: true } } },
            },
          },
        },
      },
    });

    if (!specialty) { sendNotFound(res, 'Specialty not found'); return; }
    sendSuccess(res, specialty);
  } catch (error) {
    next(error);
  }
};

export const createSpecialty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const specialty = await prisma.specialty.create({ data });
    sendCreated(res, specialty);
  } catch (error) {
    next(error);
  }
};

export const updateSpecialty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      isActive: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const specialty = await prisma.specialty.update({ where: { id: req.params.id }, data });
    sendSuccess(res, specialty, 'Specialty updated');
  } catch (error) {
    next(error);
  }
};
