import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendNotFound, sendUnauthorized } from '../utils/response';
import { emitQueueUpdate } from '../socket/socket';

// GET /queue/:doctorId - Get live queue for a doctor
export const getQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, firstName: true, lastName: true, status: true, statusMessage: true, delayMinutes: true },
    });

    if (!doctor) { sendNotFound(res, 'Doctor not found'); return; }

    const queue = await prisma.queue.findUnique({
      where: { doctorId },
      include: {
        entries: {
          where: { completedAt: null, isSkipped: false },
          orderBy: { position: 'asc' },
          include: {
            appointment: {
              include: {
                patient: { select: { firstName: true, lastName: true, profileImage: true } },
              },
            },
          },
        },
      },
    });

    sendSuccess(res, { doctor, queue });
  } catch (error) {
    next(error);
  }
};

// GET /queue/my - Patient's queue position
export const getMyQueuePosition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
    if (!patient) { sendNotFound(res, 'Patient not found'); return; }

    const { appointmentId } = req.query as { appointmentId?: string };

    if (!appointmentId) {
      // Get all active queue entries for patient
      const entries = await prisma.queueEntry.findMany({
        where: {
          appointment: { patientId: patient.id, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          completedAt: null,
          isSkipped: false,
        },
        include: {
          queue: {
            include: {
              doctor: {
                select: { firstName: true, lastName: true, status: true, statusMessage: true },
              },
            },
          },
          appointment: { select: { scheduledDate: true, scheduledTime: true, tokenNumber: true } },
        },
      });
      sendSuccess(res, entries);
      return;
    }

    const entry = await prisma.queueEntry.findFirst({
      where: { appointmentId },
      include: {
        queue: {
          include: {
            doctor: {
              select: { firstName: true, lastName: true, status: true, statusMessage: true, delayMinutes: true },
            },
            entries: {
              where: { completedAt: null, isSkipped: false, position: { lt: 999 } },
            },
          },
        },
      },
    });

    if (!entry) { sendNotFound(res, 'Queue entry not found'); return; }

    // Calculate position ahead
    const aheadCount = entry.queue?.entries.filter(e => e.position < entry.position).length || 0;
    const estimatedWaitMinutes = aheadCount * (entry.queue?.avgWaitMinutes || 15);

    sendSuccess(res, {
      ...entry,
      aheadCount,
      estimatedWaitMinutes,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /queue/next - Doctor calls next patient
export const callNextPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) { sendNotFound(res, 'Doctor not found'); return; }

    const queue = await prisma.queue.findUnique({
      where: { doctorId: doctor.id },
      include: {
        entries: {
          where: { calledAt: null, completedAt: null, isSkipped: false },
          orderBy: { position: 'asc' },
          take: 1,
          include: { appointment: { include: { patient: { include: { user: true } } } } },
        },
      },
    });

    if (!queue || queue.entries.length === 0) {
      sendSuccess(res, { message: 'No patients in queue' });
      return;
    }

    const nextEntry = queue.entries[0];

    await prisma.queueEntry.update({
      where: { id: nextEntry.id },
      data: { calledAt: new Date() },
    });

    emitQueueUpdate(doctor.id, {
      type: 'NEXT_CALLED',
      tokenNumber: nextEntry.tokenNumber,
      patientName: `${nextEntry.appointment.patient.firstName} ${nextEntry.appointment.patient.lastName}`,
    });

    // Notify patient
    const { emitNotification } = require('../socket/socket');
    emitNotification(nextEntry.appointment.patient.userId, {
      title: 'Your turn!',
      message: `Token #${nextEntry.tokenNumber} - Please proceed to the doctor's room.`,
    });

    sendSuccess(res, nextEntry, 'Next patient called');
  } catch (error) {
    next(error);
  }
};
