import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendUnauthorized } from '../utils/response';

// GET /admin/stats - System dashboard
export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      pendingRefunds,
      openTickets,
      revenue,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { scheduledDate: { gte: today } } }),
      prisma.refund.count({ where: { status: { in: ['REQUESTED', 'UNDER_REVIEW'] } } }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
    ]);

    sendSuccess(res, {
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      pendingRefunds,
      openTickets,
      totalRevenue: revenue._sum.amount || 0,
    });
  } catch (error) { next(error); }
};

// GET /admin/doctors - List all doctors
export const getAllDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const { page = '1', limit = '20', search, verified } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (verified !== undefined) where.isVerified = verified === 'true';

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where: where as any,
        include: {
          user: { select: { email: true, isActive: true, createdAt: true } },
          specialties: { include: { specialty: true } },
          _count: { select: { appointments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.doctor.count({ where: where as any }),
    ]);

    sendSuccess(res, doctors, 'Doctors retrieved', 200, {
      page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) { next(error); }
};

// PATCH /admin/doctors/:id/verify
export const verifyDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const doctor = await prisma.doctor.update({
      where: { id: req.params.id },
      data: { isVerified: true },
    });

    sendSuccess(res, doctor, 'Doctor verified');
  } catch (error) { next(error); }
};

// GET /admin/patients - List all patients
export const getAllPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const { page = '1', limit = '20', search } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: where as any,
        include: {
          user: { select: { email: true, isActive: true, createdAt: true } },
          _count: { select: { appointments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.patient.count({ where: where as any }),
    ]);

    sendSuccess(res, patients, 'Patients retrieved', 200, {
      page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) { next(error); }
};

// GET /admin/appointments
export const getAllAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const { page = '1', limit = '20', status, date } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.scheduledDate = { gte: d, lt: next };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: where as any,
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { firstName: true, lastName: true } },
          payment: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.appointment.count({ where: where as any }),
    ]);

    sendSuccess(res, appointments, 'Appointments retrieved', 200, {
      page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) { next(error); }
};

// GET /admin/refunds
export const getAllRefunds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const refunds = await prisma.refund.findMany({
      include: {
        appointment: {
          include: {
            patient: { select: { firstName: true, lastName: true } },
            doctor: { select: { firstName: true, lastName: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, refunds);
  } catch (error) { next(error); }
};

// GET /admin/support
export const getAllTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const { status } = req.query as { status?: string };
    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();

    const tickets = await prisma.supportTicket.findMany({
      where: where as any,
      include: {
        _count: { select: { messages: true } },
        assignedAdmin: { select: { firstName: true, lastName: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    sendSuccess(res, tickets);
  } catch (error) { next(error); }
};
