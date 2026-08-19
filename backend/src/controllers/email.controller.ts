import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as emailService from '../services/email.service.js';
import { getQueueStats } from '../services/queue.service.js';
import { getEtherealAccountInfo } from '../config/mailer.js';
import { EmailStatus } from '../types/index.js';

const scheduleSchema = z.object({
  recipient: z.string().email('Please enter a valid email address').optional(),
  recipients: z.array(z.string().email()).optional(),
  senderProfile: z.string().optional(),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject too long'),
  body: z.string().min(1, 'Email body is required'),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'scheduledAt must be a valid ISO 8601 date string',
  }),
  minDelayPerSend: z.number().min(0).optional(),
}).refine((data) => data.recipient || (data.recipients && data.recipients.length > 0), {
  message: 'At least one recipient email address is required',
  path: ['recipient'],
});

const rescheduleSchema = z.object({
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'scheduledAt must be a valid ISO 8601 date string',
  }),
});

export async function scheduleEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validated = scheduleSchema.parse(req.body);
    const result = await emailService.scheduleEmail(validated);

    return res.status(201).json({
      success: true,
      message: 'Email successfully scheduled',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmailsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { status, search, page, limit } = req.query;

    const result = await emailService.getEmails({
      status: status as EmailStatus | undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmailByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const result = await emailService.getEmailById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const result = await emailService.cancelEmail(id);

    return res.status(200).json({
      success: true,
      message: 'Email job cancelled successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function rescheduleEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const validated = rescheduleSchema.parse(req.body);
    const result = await emailService.rescheduleEmail(id, validated.scheduledAt);

    return res.status(200).json({
      success: true,
      message: 'Email rescheduled successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getQueueStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const stats = await getQueueStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const stats = await emailService.getDashboardStats();
    const etherealAccount = getEtherealAccountInfo();

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        etherealAccount,
      },
    });
  } catch (error) {
    next(error);
  }
}
