import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AlertEventType, Chain, Prisma } from '@prisma/client';
import { redis } from '../config/redis.js';
import { ALERT_DELIVERY_STREAM } from '../services/alert/notificationDispatcher.js';

export class AlertController {
  static async createAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return;
      const {
        name,
        eventType = AlertEventType.TRANSFER,
        chain,
        targetAddress,
        minAmountUsd = 100000,
        channels = ['TELEGRAM', 'DISCORD', 'WEBSOCKET'],
      } = req.body;

      const alert = await prisma.alert.create({
        data: {
          userId: req.user.userId,
          name,
          eventType,
          chain: chain as Chain,
          targetAddress,
          minAmountUsd: new Prisma.Decimal(minAmountUsd),
          channels,
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Alert rule created successfully',
        data: { alert },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return;

      const alerts = await prisma.alert.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        data: { alerts },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return;
      const { id } = req.params;
      const { name, isActive, minAmountUsd, channels, targetAddress } = req.body;

      const alert = await prisma.alert.update({
        where: { id, userId: req.user.userId },
        data: {
          ...(name && { name }),
          ...(isActive !== undefined && { isActive }),
          ...(minAmountUsd !== undefined && { minAmountUsd: new Prisma.Decimal(minAmountUsd) }),
          ...(channels && { channels }),
          ...(targetAddress !== undefined && { targetAddress }),
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Alert rule updated successfully',
        data: { alert },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return;
      const { id } = req.params;

      await prisma.alert.delete({
        where: { id, userId: req.user.userId },
      });

      res.status(200).json({
        status: 'success',
        message: 'Alert rule deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: req.user.userId },
          skip,
          take: limit,
          orderBy: { sentAt: 'desc' },
        }),
        prisma.notification.count({ where: { userId: req.user.userId } }),
        prisma.notification.count({ where: { userId: req.user.userId, isRead: false } }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          notifications,
          unreadCount,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async testAlertDispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return;
      const { channels = ['TELEGRAM', 'DISCORD', 'EMAIL', 'WEB_PUSH', 'MOBILE_PUSH'] } = req.body;

      const userSettings = await prisma.settings.findUnique({
        where: { userId: req.user.userId },
      });

      const deliveryPayload = {
        userId: req.user.userId,
        alertId: 'test_alert_id',
        ruleName: 'Test Alert Rule',
        title: '🔔 Test Multi-Channel Alert',
        message: 'This is a test notification from Crypto Intel Platform.',
        channels,
        eventData: { test: true },
        userSettings: {
          telegramChatId: userSettings?.telegramChatId || undefined,
          discordWebhookUrl: userSettings?.discordWebhookUrl || undefined,
          email: req.user.email,
        },
      };

      await redis.xadd(
        ALERT_DELIVERY_STREAM,
        '*',
        'payload',
        JSON.stringify(deliveryPayload)
      );

      res.status(200).json({
        status: 'success',
        message: 'Test notification queued for multi-channel dispatch',
        data: { channels },
      });
    } catch (error) {
      next(error);
    }
  }
}
