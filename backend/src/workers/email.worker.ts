import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { EMAIL_QUEUE_NAME } from '../services/queue.service.js';
import { EmailJobData } from '../types/index.js';
import { sendEmailViaEthereal } from '../config/mailer.js';
import { prisma } from '../lib/prisma.js';

let emailWorker: Worker<EmailJobData> | null = null;

export function initEmailWorker(): Worker<EmailJobData> {
  if (emailWorker) {
    return emailWorker;
  }

  emailWorker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { emailId, recipient, subject, body } = job.data;
      console.log(`\n[Worker] ⚡ Processing Job ID ${job.id} (Email ID: ${emailId}, Attempt: ${job.attemptsMade + 1})`);

      // 1. Check if email exists in DB and wasn't cancelled
      const emailRecord = await prisma.emailJob.findUnique({
        where: { id: emailId },
      });

      if (!emailRecord) {
        console.warn(`[Worker] Email record ${emailId} not found in database. Skipping.`);
        return { skipped: true, reason: 'Record not found' };
      }

      if (emailRecord.status === 'CANCELLED') {
        console.log(`[Worker] Email ${emailId} is CANCELLED. Skipping execution.`);
        return { skipped: true, reason: 'Email cancelled by user' };
      }

      // 2. Mark status as PROCESSING
      await prisma.emailJob.update({
        where: { id: emailId },
        data: {
          status: 'PROCESSING',
          attempts: job.attemptsMade + 1,
        },
      });

      try {
        // 3. Send email via Ethereal Fake SMTP
        const result = await sendEmailViaEthereal({
          to: recipient,
          subject: subject,
          body: body,
        });

        const previewUrl = typeof result.previewUrl === 'string' ? result.previewUrl : null;

        // 4. Mark status as SENT
        const updated = await prisma.emailJob.update({
          where: { id: emailId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            etherealMessageId: result.messageId,
            etherealPreviewUrl: previewUrl,
            errorMessage: null,
          },
        });

        console.log(`[Worker] ✅ Email successfully sent to ${recipient}!`);
        console.log(`[Worker] ✉️  Message ID: ${result.messageId}`);
        if (previewUrl) {
          console.log(`[Worker] 🔗 Ethereal Web Preview: ${previewUrl}`);
        }

        return {
          success: true,
          emailId,
          messageId: result.messageId,
          previewUrl,
        };
      } catch (error: any) {
        const errorMsg = error?.message || 'Unknown SMTP error';
        console.error(`[Worker] ❌ Failed to send email ${emailId}: ${errorMsg}`);

        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 3);

        await prisma.emailJob.update({
          where: { id: emailId },
          data: {
            status: isLastAttempt ? 'FAILED' : 'PROCESSING',
            errorMessage: errorMsg,
          },
        });

        // Rethrow so BullMQ can trigger exponential backoff retry if attempts remain
        throw error;
      }
    },
    {
      connection: redisConnectionOptions,
      concurrency: 5,
      lockDuration: 30000,
      stalledInterval: 15000,
    }
  );

  emailWorker.on('ready', () => {
    console.log('[Worker] 🚀 BullMQ Email Worker is ready and listening for scheduled jobs.');
  });

  emailWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully.`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
  });

  emailWorker.on('error', (err) => {
    console.error('[Worker] Worker internal error:', err);
  });

  emailWorker.on('stalled', (jobId) => {
    console.warn(`[Worker] Job ${jobId} stalled and will be re-processed.`);
  });

  return emailWorker;
}

export async function closeEmailWorker(): Promise<void> {
  if (emailWorker) {
    console.log('[Worker] Closing BullMQ Email Worker...');
    await emailWorker.close();
    emailWorker = null;
  }
}
