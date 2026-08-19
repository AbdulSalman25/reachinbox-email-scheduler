import { Queue, Job } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { EmailJobData, QueueStats } from '../types/index.js';

export const EMAIL_QUEUE_NAME = 'email-scheduler-queue';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s initial backoff
    },
    removeOnComplete: {
      age: 24 * 3600, // keep completed jobs for 24h
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // keep failed jobs for 7 days
      count: 5000,
    },
  },
});

emailQueue.on('error', (err) => {
  console.error('[BullMQ Queue Error]', err);
});

/**
 * Adds an email send job to BullMQ with a calculated delay
 */
export async function addScheduledEmailJob(
  data: EmailJobData,
  delayMs: number
): Promise<Job<EmailJobData>> {
  const safeDelay = Math.max(0, Math.floor(delayMs));

  const job = await emailQueue.add('send-scheduled-email', data, {
    jobId: data.emailId, // 1:1 mapping with DB record ID
    delay: safeDelay,
  });

  console.log(`[Queue] Enqueued Job ${job.id} for email ${data.emailId} with delay: ${safeDelay}ms`);
  return job;
}

/**
 * Cancels a pending / delayed job from BullMQ
 */
export async function cancelEmailJob(jobId: string): Promise<boolean> {
  try {
    const job = await emailQueue.getJob(jobId);
    if (!job) {
      console.warn(`[Queue] Job ${jobId} not found in BullMQ to cancel.`);
      return false;
    }

    const state = await job.getState();
    console.log(`[Queue] Cancelling Job ${jobId} (current state: ${state})`);

    if (state === 'delayed' || state === 'waiting') {
      await job.remove();
      return true;
    }

    // If job is already active or completed, we cannot remove cleanly
    return false;
  } catch (error) {
    console.error(`[Queue] Error cancelling job ${jobId}:`, error);
    return false;
  }
}

/**
 * Reschedules an existing job with a new delay
 */
export async function rescheduleEmailJob(
  data: EmailJobData,
  newDelayMs: number
): Promise<Job<EmailJobData>> {
  const safeDelay = Math.max(0, Math.floor(newDelayMs));

  // Try to remove the previous job if it exists
  try {
    const existingJob = await emailQueue.getJob(data.emailId);
    if (existingJob) {
      await existingJob.remove();
    }
  } catch (err) {
    console.warn(`[Queue] Could not remove existing job before reschedule:`, err);
  }

  // Add the newly scheduled job
  const newJob = await emailQueue.add('send-scheduled-email', data, {
    jobId: data.emailId,
    delay: safeDelay,
  });

  console.log(`[Queue] Rescheduled Job ${newJob.id} with new delay: ${safeDelay}ms`);
  return newJob;
}

/**
 * Get real-time queue counts
 */
export async function getQueueStats(): Promise<QueueStats> {
  const counts = await emailQueue.getJobCounts(
    'waiting',
    'active',
    'delayed',
    'completed',
    'failed',
    'paused'
  );

  return {
    waiting: counts.waiting || 0,
    active: counts.active || 0,
    delayed: counts.delayed || 0,
    completed: counts.completed || 0,
    failed: counts.failed || 0,
    paused: counts.paused || 0,
  };
}

export async function closeEmailQueue(): Promise<void> {
  console.log('[Queue] Closing BullMQ Email Queue...');
  await emailQueue.close();
}
