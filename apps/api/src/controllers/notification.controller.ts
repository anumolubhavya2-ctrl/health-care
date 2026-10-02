import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendUnauthorized } from '../utils/response';

export const getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const { page = '1', limit = '20', unreadOnly } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where: Record<string, unknown> = { userId: req.user.userId };
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.notification.count({ where: where as any }),
      prisma.notification.count({ where: { userId: req.user.userId, isRead: false } }),
    ]);

    sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved', 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) { next(error); }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { sendUnauthorized(res); return; }

    const { ids } = req.body as { ids?: string[] };

    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: req.user.userId },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: req.user.userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    }

    sendSuccess(res, null, 'Marked as read');
  } catch (error) { next(error); }
};
