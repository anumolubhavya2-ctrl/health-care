import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError, sendNotFound, sendUnauthorized } from '../utils/response';
import { emitNotification } from '../socket/socket';

// POST /payments/:appointmentId/pay - Simulate payment
export const processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({
      method: z.enum(['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CASH']),
    });

    const { method } = schema.parse(req.body);
    const { appointmentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { appointmentId },
      include: { appointment: true },
    });

    if (!payment) { sendNotFound(res, 'Payment not found'); return; }
    if (payment.status === 'PAID') { sendError(res, 'Payment already processed', 400); return; }

    // Simulate payment processing (in production, integrate real gateway)
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        method,
        transactionId,
        paidAt: new Date(),
        gatewayResponse: { simulated: true, message: 'Payment processed successfully' },
      },
    });

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CONFIRMED' },
    });

    // Notify patient
    emitNotification(req.user.userId, {
      title: 'Payment Successful',
      message: `Payment of ₹${payment.amount} processed successfully. Transaction ID: ${transactionId}`,
    });

    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: `Payment of ₹${payment.amount} confirmed. Transaction ID: ${transactionId}`,
        data: { transactionId, amount: payment.amount },
      },
    });

    sendSuccess(res, updated, 'Payment processed successfully');
  } catch (error) {
    next(error);
  }
};

// GET /payments/my - Patient's payment history
export const getMyPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
    if (!patient) { sendNotFound(res, 'Patient not found'); return; }

    const payments = await prisma.payment.findMany({
      where: { patientId: patient.id },
      include: {
        appointment: {
          include: {
            doctor: { select: { firstName: true, lastName: true } },
          },
        },
        refund: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, payments);
  } catch (error) {
    next(error);
  }
};

// GET /payments/:id
export const getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        appointment: {
          include: {
            doctor: { select: { firstName: true, lastName: true } },
            patient: { select: { firstName: true, lastName: true } },
          },
        },
        refund: true,
      },
    });

    if (!payment) { sendNotFound(res, 'Payment not found'); return; }
    sendSuccess(res, payment);
  } catch (error) {
    next(error);
  }
};
