import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendNotFound, sendUnauthorized } from '../utils/response';

export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.userId },
      include: { user: { select: { email: true, phone: true, createdAt: true } } },
    });

    if (!patient) { sendNotFound(res, 'Patient profile not found'); return; }
    sendSuccess(res, patient);
  } catch (error) { next(error); }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      dateOfBirth: z.string().optional(),
      gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
      bloodGroup: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      emergencyContact: z.string().optional(),
      emergencyPhone: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
    if (!patient) { sendNotFound(res, 'Patient not found'); return; }

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });

    sendSuccess(res, updated, 'Profile updated');
  } catch (error) { next(error); }
};

export const getAppointmentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
    if (!patient) { sendNotFound(res, 'Patient not found'); return; }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id, status: 'COMPLETED' },
      include: {
        doctor: { include: { specialties: { include: { specialty: true }, where: { isPrimary: true } } } },
        payment: true,
      },
      orderBy: { scheduledDate: 'desc' },
    });

    sendSuccess(res, appointments);
  } catch (error) { next(error); }
};
