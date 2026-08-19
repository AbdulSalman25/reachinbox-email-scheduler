import { prisma } from '../lib/prisma.js';
import {
  addScheduledEmailJob,
  cancelEmailJob,
  rescheduleEmailJob,
  getQueueStats,
  emailQueue,
} from './queue.service.js';
import { ScheduleEmailPayload, EmailStatus } from '../types/index.js';

export async function scheduleEmail(payload: ScheduleEmailPayload) {
  const targetDate = new Date(payload.scheduledAt);
  const now = Date.now();
  const baseDelayMs = Math.max(0, targetDate.getTime() - now);
  const sender = payload.senderProfile?.trim() || 'Salman <salman@reachinbox.ai>';

  // Determine list of recipients
  let recipientList: string[] = [];
  if (payload.recipients && Array.isArray(payload.recipients) && payload.recipients.length > 0) {
    recipientList = payload.recipients.map((r) => r.trim().toLowerCase()).filter((r) => r.length > 0);
  } else if (payload.recipient) {
    recipientList = [payload.recipient.trim().toLowerCase()];
  }

  if (recipientList.length === 0) {
    throw new Error('No valid recipient provided.');
  }

  const minDelaySec = Math.max(0, payload.minDelayPerSend || 0);
  const createdJobs = [];

  for (let i = 0; i < recipientList.length; i++) {
    const recipient = recipientList[i];
    const itemDelayMs = baseDelayMs + i * minDelaySec * 1000;
    const itemScheduledAt = new Date(now + itemDelayMs);

    // 1. Create DB record
    const emailRecord = await prisma.emailJob.create({
      data: {
        recipient,
        senderProfile: sender,
        subject: payload.subject.trim(),
        body: payload.body.trim(),
        scheduledAt: itemScheduledAt,
        status: 'SCHEDULED',
        attempts: 0,
      },
    });

    // 2. Add job to BullMQ
    const bullmqJob = await addScheduledEmailJob(
      {
        emailId: emailRecord.id,
        recipient: emailRecord.recipient,
        senderProfile: sender,
        subject: emailRecord.subject,
        body: emailRecord.body,
        scheduledAt: emailRecord.scheduledAt.toISOString(),
      },
      itemDelayMs
    );

    // 3. Link BullMQ ID
    const updated = await prisma.emailJob.update({
      where: { id: emailRecord.id },
      data: { bullmqJobId: bullmqJob.id ? String(bullmqJob.id) : emailRecord.id },
    });

    createdJobs.push({
      ...updated,
      delayMs: itemDelayMs,
    });
  }

  return createdJobs.length === 1 ? createdJobs[0] : { totalScheduled: createdJobs.length, jobs: createdJobs };
}

export async function getEmails(query: {
  status?: EmailStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 50));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { recipient: { contains: query.search } },
      { subject: { contains: query.search } },
      { body: { contains: query.search } },
      { senderProfile: { contains: query.search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.emailJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.emailJob.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getEmailById(id: string) {
  const email = await prisma.emailJob.findUnique({
    where: { id },
  });

  if (!email) {
    return null;
  }

  let queueState: string | null = null;
  if (email.bullmqJobId) {
    try {
      const job = await emailQueue.getJob(email.bullmqJobId);
      if (job) {
        queueState = await job.getState();
      }
    } catch {
      // ignore
    }
  }

  return {
    ...email,
    queueState,
  };
}

export async function cancelEmail(id: string) {
  const email = await prisma.emailJob.findUnique({
    where: { id },
  });

  if (!email) {
    throw new Error('Email job not found');
  }

  if (email.status === 'SENT') {
    throw new Error('Cannot cancel an email that has already been sent');
  }

  if (email.status === 'CANCELLED') {
    return email;
  }

  // Cancel from BullMQ
  if (email.bullmqJobId) {
    await cancelEmailJob(email.bullmqJobId);
  }

  // Update DB status
  const updated = await prisma.emailJob.update({
    where: { id },
    data: {
      status: 'CANCELLED',
    },
  });

  return updated;
}

export async function rescheduleEmail(id: string, newScheduledAt: string) {
  const email = await prisma.emailJob.findUnique({
    where: { id },
  });

  if (!email) {
    throw new Error('Email job not found');
  }

  if (email.status === 'SENT') {
    throw new Error('Cannot reschedule an email that has already been sent');
  }

  const targetDate = new Date(newScheduledAt);
  const now = Date.now();
  const delayMs = Math.max(0, targetDate.getTime() - now);

  // Update DB record
  const updated = await prisma.emailJob.update({
    where: { id },
    data: {
      scheduledAt: targetDate,
      status: 'SCHEDULED',
      errorMessage: null,
    },
  });

  // Reschedule in BullMQ
  await rescheduleEmailJob(
    {
      emailId: updated.id,
      recipient: updated.recipient,
      senderProfile: updated.senderProfile,
      subject: updated.subject,
      body: updated.body,
      scheduledAt: updated.scheduledAt.toISOString(),
    },
    delayMs
  );

  return {
    ...updated,
    delayMs,
  };
}

export async function getDashboardStats() {
  const oneHourAgo = new Date(Date.now() - 3600 * 1000);

  const [total, scheduled, sent, failed, cancelled, sentLastHour, queueStats] = await Promise.all([
    prisma.emailJob.count(),
    prisma.emailJob.count({ where: { status: 'SCHEDULED' } }),
    prisma.emailJob.count({ where: { status: 'SENT' } }),
    prisma.emailJob.count({ where: { status: 'FAILED' } }),
    prisma.emailJob.count({ where: { status: 'CANCELLED' } }),
    prisma.emailJob.count({
      where: {
        status: 'SENT',
        sentAt: { gte: oneHourAgo },
      },
    }),
    getQueueStats(),
  ]);

  const hourlyLimit = 200;
  const remaining = Math.max(0, hourlyLimit - sentLastHour);

  return {
    counts: {
      total,
      scheduled,
      sent,
      failed,
      cancelled,
      deferred: 0,
    },
    quota: {
      limit: hourlyLimit,
      usedThisHour: sentLastHour,
      remaining,
    },
    queue: queueStats,
  };
}
