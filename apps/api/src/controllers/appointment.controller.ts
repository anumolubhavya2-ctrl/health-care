import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppointmentStatus, ConsultationType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendCreated, sendError, sendNotFound, sendUnauthorized } from '../utils/response';
import { emitQueueUpdate, emitAppointmentUpdate, emitNotification } from '../socket/socket';

const bookingSchema = z.object({
  doctorId: z.string().uuid(),
  scheduledDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  consultationType: z.enum(['IN_PERSON', 'VIDEO', 'PHONE']).default('IN_PERSON'),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================
// POST /appointments - Book appointment
// ============================================================
export const bookAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const data = bookingSchema.parse(req.body);

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
    if (!patient) { sendError(res, 'Patient profile not found', 404); return; }

    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      include: { queue: true },
    });
    if (!doctor) { sendNotFound(res, 'Doctor not found'); return; }

    // Check for slot conflict
    const scheduledDate = new Date(data.scheduledDate);
    const startOfDay = new Date(scheduledDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledDate); endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        scheduledTime: data.scheduledTime,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    if (existing) {
      sendError(res, 'This time slot is already booked. Please choose another.', 409);
      return;
    }

    // Get fee
    let fee = Number(doctor.consultationFee);
    if (data.consultationType === 'VIDEO' && doctor.videoFee) fee = Number(doctor.videoFee);
    if (data.consultationType === 'PHONE' && doctor.phoneFee) fee = Number(doctor.phoneFee);

    // Create appointment + payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: data.doctorId,
          scheduledDate,
          scheduledTime: data.scheduledTime,
          consultationType: data.consultationType as ConsultationType,
          symptoms: data.symptoms,
          notes: data.notes,
          status: 'PENDING',
        },
        include: {
          doctor: { include: { specialties: { include: { specialty: true } } } },
          patient: true,
        },
      });

      // Create pending payment
      await tx.payment.create({
        data: {
          appointmentId: appointment.id,
          patientId: patient.id,
          amount: fee,
          status: 'PENDING',
        },
      });

      // Generate token number
      let queue = await tx.queue.findUnique({ where: { doctorId: data.doctorId } });
      if (!queue) {
        queue = await tx.queue.create({
          data: { doctorId: data.doctorId, date: new Date() },
        });
      }

      const tokenNumber = queue.totalTokens + 1;
      const position = tokenNumber;

      await tx.queue.update({
        where: { id: queue.id },
        data: { totalTokens: { increment: 1 } },
      });

      const queueEntry = await tx.queueEntry.create({
        data: {
          queueId: queue.id,
          appointmentId: appointment.id,
          tokenNumber,
          position,
        },
      });

      await tx.appointment.update({
        where: { id: appointment.id },
        data: { tokenNumber, queuePosition: position, status: 'CONFIRMED' },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: req.user!.userId,
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Appointment Confirmed',
          message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} on ${scheduledDate.toDateString()} at ${data.scheduledTime} is confirmed. Token: #${tokenNumber}`,
          data: { appointmentId: appointment.id, tokenNumber },
        },
      });

      return { appointment, queueEntry, tokenNumber, fee };
    });

    // Emit real-time queue update
    emitQueueUpdate(data.doctorId, {
      type: 'NEW_BOOKING',
      tokenNumber: result.tokenNumber,
      doctorId: data.doctorId,
    });

    sendCreated(res, result, 'Appointment booked successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /appointments - List appointments
// ============================================================
export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const { status, page = '1', limit = '10' } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    let where: Record<string, unknown> = {};

    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
      if (!patient) { sendError(res, 'Patient not found', 404); return; }
      where.patientId = patient.id;
    } else if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (!doctor) { sendError(res, 'Doctor not found', 404); return; }
      where.doctorId = doctor.id;
    }

    if (status) {
      where.status = status.toUpperCase() as AppointmentStatus;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: where as any,
        include: {
          doctor: {
            include: { specialties: { include: { specialty: true }, where: { isPrimary: true } } },
          },
          patient: { select: { firstName: true, lastName: true, profileImage: true } },
          payment: true,
          queueEntry: true,
          refund: true,
        },
        orderBy: { scheduledDate: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.appointment.count({ where: where as any }),
    ]);

    sendSuccess(res, appointments, 'Appointments retrieved', 200, {
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
// GET /appointments/:id
// ============================================================
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: {
          include: {
            specialties: { include: { specialty: true } },
            user: { select: { email: true } },
          },
        },
        patient: true,
        payment: true,
        queueEntry: true,
        refund: true,
      },
    });

    if (!appointment) { sendNotFound(res, 'Appointment not found'); return; }

    sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PATCH /appointments/:id/cancel - Cancel appointment
// ============================================================
export const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({ reason: z.string().optional() });
    const { reason } = schema.parse(req.body);

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { payment: true, patient: true, doctor: true },
    });

    if (!appointment) { sendNotFound(res, 'Appointment not found'); return; }

    if (['COMPLETED', 'CANCELLED', 'IN_PROGRESS'].includes(appointment.status)) {
      sendError(res, `Cannot cancel a ${appointment.status.toLowerCase()} appointment`, 400);
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date(),
          cancelledBy: req.user!.userId,
        },
      });

      // Auto-create refund if payment was made
      if (appointment.payment?.status === 'PAID') {
        await tx.refund.create({
          data: {
            appointmentId: appointment.id,
            paymentId: appointment.payment.id,
            amount: appointment.payment.amount,
            reason: reason || 'Appointment cancelled by patient',
            status: 'REQUESTED',
          },
        });

        await tx.notification.create({
          data: {
            userId: req.user!.userId,
            type: 'REFUND_UPDATE',
            title: 'Refund Initiated',
            message: `A refund of ₹${appointment.payment.amount} has been requested for your cancelled appointment.`,
            data: { appointmentId: appointment.id },
          },
        });
      }

      // Remove from queue
      if (appointment.queuePosition) {
        await tx.queueEntry.updateMany({
          where: { appointmentId: appointment.id },
          data: { isSkipped: true },
        });
      }

      return updated;
    });

    emitQueueUpdate(appointment.doctorId, {
      type: 'CANCELLED',
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
    });

    sendSuccess(res, result, 'Appointment cancelled');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PATCH /appointments/:id/checkin - Patient check-in
// ============================================================
export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { queueEntry: true },
    });

    if (!appointment) { sendNotFound(res, 'Appointment not found'); return; }
    if (appointment.status !== 'CONFIRMED') {
      sendError(res, 'Appointment cannot be checked in at this stage', 400);
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CHECKED_IN' },
      });

      if (appointment.queueEntry) {
        await tx.queueEntry.update({
          where: { id: appointment.queueEntry.id },
          data: { checkedInAt: new Date() },
        });
      }
    });

    emitQueueUpdate(appointment.doctorId, {
      type: 'CHECKED_IN',
      appointmentId: appointment.id,
      tokenNumber: appointment.tokenNumber,
    });

    sendSuccess(res, null, 'Checked in successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PATCH /appointments/:id/start - Doctor starts consultation
// ============================================================
export const startConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { queueEntry: true, patient: { include: { user: true } }, doctor: true },
    });

    if (!appointment) { sendNotFound(res, 'Appointment not found'); return; }

    const updated = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: 'IN_PROGRESS', actualStartTime: new Date() },
      });

      if (appointment.queueEntry) {
        await tx.queueEntry.update({
          where: { id: appointment.queueEntry.id },
          data: { calledAt: new Date() },
        });
      }

      // Update doctor status
      await tx.doctor.update({
        where: { id: appointment.doctorId },
        data: { status: 'IN_CONSULTATION' },
      });

      return appt;
    });

    emitQueueUpdate(appointment.doctorId, { type: 'CONSULTATION_STARTED', tokenNumber: appointment.tokenNumber });
    emitAppointmentUpdate(appointment.patient.userId, updated);

    sendSuccess(res, updated, 'Consultation started');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PATCH /appointments/:id/complete - Doctor ends consultation
// ============================================================
export const completeConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({
      doctorNotes: z.string().optional(),
      diagnosis: z.string().optional(),
      prescription: z.string().optional(),
      followUpDate: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { queueEntry: true, patient: { include: { user: true } }, doctor: true },
    });

    if (!appointment) { sendNotFound(res, 'Appointment not found'); return; }

    const updated = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'COMPLETED',
          actualEndTime: new Date(),
          doctorNotes: data.doctorNotes,
          diagnosis: data.diagnosis,
          prescription: data.prescription,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        },
      });

      if (appointment.queueEntry) {
        await tx.queueEntry.update({
          where: { id: appointment.queueEntry.id },
          data: { completedAt: new Date() },
        });
      }

      // Mark payment as paid if pending
      await tx.payment.updateMany({
        where: { appointmentId: appointment.id, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });

      // Update doctor status back
      await tx.doctor.update({
        where: { id: appointment.doctorId },
        data: { status: 'AVAILABLE', totalPatients: { increment: 1 } },
      });

      // Advance queue
      await tx.queue.update({
        where: { doctorId: appointment.doctorId },
        data: { currentToken: { increment: 1 } },
      });

      await tx.notification.create({
        data: {
          userId: appointment.patient.userId,
          type: 'GENERAL',
          title: 'Consultation Complete',
          message: `Your consultation is complete. ${data.prescription ? 'Your prescription is ready.' : ''}`,
          data: { appointmentId: appointment.id },
        },
      });

      return appt;
    });

    emitQueueUpdate(appointment.doctorId, { type: 'CONSULTATION_ENDED', doctorId: appointment.doctorId });
    emitDoctorStatusChange(appointment.doctorId, { doctorId: appointment.doctorId, status: 'AVAILABLE' });
    emitAppointmentUpdate(appointment.patient.userId, updated);

    sendSuccess(res, updated, 'Consultation completed');
  } catch (error) {
    next(error);
  }
};

// Fix missing import
function emitDoctorStatusChange(doctorId: string, data: unknown): void {
  try {
    const { emitDoctorStatusChange: emit } = require('../socket/socket');
    emit(doctorId, data);
  } catch { /* non-fatal */ }
}
