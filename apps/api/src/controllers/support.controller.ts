import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendCreated, sendError, sendNotFound, sendUnauthorized } from '../utils/response';
import { emitSupportMessage, emitNotification } from '../socket/socket';

// POST /support/tickets - Create ticket
export const createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({
      subject: z.string().min(3),
      description: z.string().min(10),
      category: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    });

    const data = schema.parse(req.body);

    const ticket = await prisma.supportTicket.create({
      data: {
        patientId: req.user.userId,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        messages: {
          create: {
            senderId: req.user.userId,
            message: data.description,
          },
        },
      },
      include: { messages: true },
    });

    sendCreated(res, ticket, 'Support ticket created');
  } catch (error) { next(error); }
};

// GET /support/tickets/my
export const getMyTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const tickets = await prisma.supportTicket.findMany({
      where: { patientId: req.user.userId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    sendSuccess(res, tickets);
  } catch (error) { next(error); }
};

// GET /support/tickets/:id
export const getTicketById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          include: { sender: { select: { role: true, patient: { select: { firstName: true, lastName: true } }, admin: { select: { firstName: true, lastName: true } } } } },
          orderBy: { createdAt: 'asc' },
        },
        assignedAdmin: true,
      },
    });

    if (!ticket) { sendNotFound(res, 'Ticket not found'); return; }
    sendSuccess(res, ticket);
  } catch (error) { next(error); }
};

// POST /support/tickets/:id/messages - Send message
export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const schema = z.object({ message: z.string().min(1) });
    const { message } = schema.parse(req.body);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) { sendNotFound(res, 'Ticket not found'); return; }

    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      sendError(res, 'Cannot send message to a closed/resolved ticket', 400);
      return;
    }

    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: req.user.userId,
        message,
      },
      include: {
        sender: { select: { role: true } },
      },
    });

    // Update ticket status
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
        updatedAt: new Date(),
      },
    });

    // Emit to support room
    emitSupportMessage(ticket.id, newMessage);

    sendCreated(res, newMessage, 'Message sent');
  } catch (error) { next(error); }
};

// PATCH /support/tickets/:id/escalate - Escalate to human
export const escalateTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) { sendNotFound(res, 'Ticket not found'); return; }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'ESCALATED', priority: 'HIGH' },
    });

    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'SUPPORT_MESSAGE',
        title: 'Ticket Escalated',
        message: 'Your support ticket has been escalated to a human agent. We will respond shortly.',
        data: { ticketId: ticket.id },
      },
    });

    sendSuccess(res, updated, 'Ticket escalated to human support');
  } catch (error) { next(error); }
};
