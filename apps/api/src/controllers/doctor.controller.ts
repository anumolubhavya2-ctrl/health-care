import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DoctorStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError, sendNotFound, sendUnauthorized } from '../utils/response';
import { emitDoctorStatusChange } from '../socket/socket';

// ============================================================
// GET /doctors - Search doctors
// ============================================================
export const getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      search,
      specialty,
      city,
      status,
      consultationType,
      minFee,
      maxFee,
      rating,
      gender,
      language,
      availableToday,
      page = '1',
      limit = '12',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      isVerified: true,
      user: { isActive: true },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { clinicName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (specialty) {
      where.specialties = {
        some: {
          specialty: { slug: { equals: specialty, mode: 'insensitive' } },
        },
      };
    }

    if (city) {
      where.clinicCity = { contains: city, mode: 'insensitive' };
    }

    if (status) {
      where.status = status.toUpperCase() as DoctorStatus;
    }

    if (gender) {
      where.gender = gender.toUpperCase();
    }

    if (language) {
      where.languages = { has: language };
    }

    if (minFee || maxFee) {
      where.consultationFee = {
        ...(minFee ? { gte: parseFloat(minFee) } : {}),
        ...(maxFee ? { lte: parseFloat(maxFee) } : {}),
      };
    }

    if (rating) {
      where.rating = { gte: parseFloat(rating) };
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where: where as any,
        include: {
          specialties: { include: { specialty: true }, where: { isPrimary: true } },
          availabilities: true,
          user: { select: { email: true, isActive: true } },
          queue: true,
        },
        orderBy: [{ rating: 'desc' }, { totalReviews: 'desc' }],
        skip,
        take: limitNum,
      }),
      prisma.doctor.count({ where: where as any }),
    ]);

    sendSuccess(res, doctors, 'Doctors retrieved', 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /doctors/:id
// ============================================================
export const getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        specialties: { include: { specialty: true } },
        availabilities: true,
        user: { select: { email: true } },
        queue: { include: { entries: { where: { completedAt: null, isSkipped: false } } } },
        reviews: {
          where: { isPublic: true },
          include: {
            patient: { select: { firstName: true, lastName: true, profileImage: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!doctor) {
      sendNotFound(res, 'Doctor not found');
      return;
    }

    sendSuccess(res, doctor);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /doctors/me - Doctor's own profile
// ============================================================
export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.userId },
      include: {
        specialties: { include: { specialty: true } },
        availabilities: true,
        queue: { include: { entries: { orderBy: { position: 'asc' }, include: { appointment: { include: { patient: true } } } } } },
      },
    });

    if (!doctor) { sendNotFound(res, 'Doctor profile not found'); return; }

    sendSuccess(res, doctor);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PUT /doctors/me - Update profile
// ============================================================
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      bio: z.string().optional(),
      experience: z.number().min(0).optional(),
      qualifications: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      consultationFee: z.number().min(0).optional(),
      videoFee: z.number().min(0).optional(),
      phoneFee: z.number().min(0).optional(),
      isAvailableForVideo: z.boolean().optional(),
      isAvailableForPhone: z.boolean().optional(),
      clinicName: z.string().optional(),
      clinicAddress: z.string().optional(),
      clinicCity: z.string().optional(),
      clinicState: z.string().optional(),
      clinicPincode: z.string().optional(),
      gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    });

    const data = schema.parse(req.body);

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) { sendNotFound(res, 'Doctor not found'); return; }

    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data,
      include: { specialties: { include: { specialty: true } }, availabilities: true },
    });

    sendSuccess(res, updated, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PATCH /doctors/me/status - Change live status
// ============================================================
export const updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({
      status: z.enum(['AVAILABLE', 'BUSY', 'DELAYED', 'ON_LEAVE', 'IN_CONSULTATION', 'OFFLINE']),
      statusMessage: z.string().optional(),
      delayMinutes: z.number().optional(),
    });

    const data = schema.parse(req.body);

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) { sendNotFound(res, 'Doctor not found'); return; }

    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        status: data.status as DoctorStatus,
        statusMessage: data.statusMessage,
        delayMinutes: data.delayMinutes,
      },
    });

    // Log status change
    await prisma.doctorStatusLog.create({
      data: {
        doctorId: doctor.id,
        status: data.status as DoctorStatus,
        message: data.statusMessage,
      },
    });

    // Emit real-time event
    emitDoctorStatusChange(doctor.id, {
      doctorId: doctor.id,
      status: data.status,
      statusMessage: data.statusMessage,
      delayMinutes: data.delayMinutes,
      updatedAt: new Date(),
    });

    sendSuccess(res, updated, 'Status updated');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /doctors/me/availability - Set availability
// ============================================================
export const setAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      slotDuration: z.number().min(15).max(120).default(30),
      isActive: z.boolean().default(true),
    }));

    const slots = schema.parse(req.body);

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) { sendNotFound(res, 'Doctor not found'); return; }

    // Upsert availabilities
    const results = await Promise.all(
      slots.map((slot) =>
        prisma.availability.upsert({
          where: { doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: slot.dayOfWeek } },
          create: { doctorId: doctor.id, ...slot },
          update: slot,
        })
      )
    );

    sendSuccess(res, results, 'Availability updated');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /doctors/me/specialties - Add specialty
// ============================================================
export const addSpecialty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({
      specialtyId: z.string().uuid(),
      isPrimary: z.boolean().default(false),
    });

    const data = schema.parse(req.body);
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) { sendNotFound(res, 'Doctor not found'); return; }

    const result = await prisma.doctorSpecialty.upsert({
      where: { doctorId_specialtyId: { doctorId: doctor.id, specialtyId: data.specialtyId } },
      create: { doctorId: doctor.id, specialtyId: data.specialtyId, isPrimary: data.isPrimary },
      update: { isPrimary: data.isPrimary },
      include: { specialty: true },
    });

    sendSuccess(res, result, 'Specialty added');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /doctors/:id/availability - Get available slots for a date
// ============================================================
export const getDoctorAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query as { date?: string };

    if (!date) {
      sendError(res, 'Date is required', 400);
      return;
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        availabilities: { where: { dayOfWeek, isActive: true } },
      },
    });

    if (!doctor) { sendNotFound(res, 'Doctor not found'); return; }

    const availability = doctor.availabilities[0];
    if (!availability) {
      sendSuccess(res, { available: false, slots: [] });
      return;
    }

    // Get existing appointments for that date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { scheduledTime: true },
    });

    const bookedTimes = new Set(bookedAppointments.map((a) => a.scheduledTime));

    // Generate time slots
    const slots: { time: string; available: boolean }[] = [];
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + availability.slotDuration <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push({ time, available: !bookedTimes.has(time) });
      currentMinutes += availability.slotDuration;
    }

    sendSuccess(res, {
      available: true,
      dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      slotDuration: availability.slotDuration,
      slots,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /doctors/me/appointments/today
// ============================================================
export const getTodayAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) { sendNotFound(res, 'Doctor not found'); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledDate: { gte: today, lt: tomorrow },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        patient: { select: { firstName: true, lastName: true, profileImage: true, dateOfBirth: true } },
        queueEntry: true,
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    sendSuccess(res, appointments);
  } catch (error) {
    next(error);
  }
};
