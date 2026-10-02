import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendCreated, sendError, sendNotFound, sendUnauthorized } from '../utils/response';
import { emitNotification } from '../socket/socket';

// GET /refunds/my
export const getMyRefunds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
    if (!patient) { sendNotFound(res, 'Patient not found'); return; }

    const refunds = await prisma.refund.findMany({
      where: { appointment: { patientId: patient.id } },
      include: {
        appointment: {
          include: {
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

// POST /refunds - Request refund
export const requestRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({
      appointmentId: z.string().uuid(),
      reason: z.string().min(10, 'Please provide a detailed reason'),
    });

    const { appointmentId, reason } = schema.parse(req.body);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { payment: true },
    });

    if (!appointment) { sendNotFound(res, 'Appointment not found'); return; }
    if (!appointment.payment || appointment.payment.status !== 'PAID') {
      sendError(res, 'No paid payment found for this appointment', 400);
      return;
    }

    const existing = await prisma.refund.findUnique({ where: { appointmentId } });
    if (existing) {
      sendError(res, 'A refund request already exists for this appointment', 409);
      return;
    }

    const refund = await prisma.refund.create({
      data: {
        appointmentId,
        paymentId: appointment.payment.id,
        amount: appointment.payment.amount,
        reason,
        status: 'REQUESTED',
      },
    });

    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'REFUND_UPDATE',
        title: 'Refund Requested',
        message: `Your refund request for ₹${appointment.payment.amount} has been submitted and is under review.`,
        data: { refundId: refund.id },
      },
    });

    sendCreated(res, refund, 'Refund requested successfully');
  } catch (error) { next(error); }
};

// GET /refunds/:id
export const getRefundById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const refund = await prisma.refund.findUnique({
      where: { id: req.params.id },
      include: {
        appointment: {
          include: { doctor: { select: { firstName: true, lastName: true } }, patient: true },
        },
        payment: true,
      },
    });

    if (!refund) { sendNotFound(res, 'Refund not found'); return; }
    sendSuccess(res, refund);
  } catch (error) { next(error); }
};

// PATCH /refunds/:id/process - Admin processes refund
export const processRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({
      status: z.enum(['APPROVED', 'PROCESSED', 'REJECTED']),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const refund = await prisma.refund.findUnique({
      where: { id: req.params.id },
      include: { appointment: { include: { patient: { include: { user: true } } } } },
    });

    if (!refund) { sendNotFound(res, 'Refund not found'); return; }

    const updated = await prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: data.status,
        notes: data.notes,
        processedAt: ['PROCESSED', 'REJECTED'].includes(data.status) ? new Date() : undefined,
        processedBy: req.user.userId,
        transactionId: data.status === 'PROCESSED' ? `REF_${Date.now()}` : undefined,
      },
    });

    // Notify patient
    const patientUserId = refund.appointment.patient.userId;
    const message = data.status === 'PROCESSED'
      ? `Your refund of ₹${refund.amount} has been processed successfully.`
      : data.status === 'APPROVED'
      ? `Your refund of ₹${refund.amount} has been approved and will be processed within 3-5 business days.`
      : `Your refund request has been rejected. ${data.notes || ''}`;

    emitNotification(patientUserId, { title: `Refund ${data.status}`, message });

    await prisma.notification.create({
      data: {
        userId: patientUserId,
        type: 'REFUND_UPDATE',
        title: `Refund ${data.status}`,
        message,
        data: { refundId: refund.id, status: data.status },
      },
    });

    sendSuccess(res, updated, 'Refund updated');
  } catch (error) { next(error); }
};
