export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface ScheduleEmailPayload {
  recipient?: string;
  recipients?: string[];
  senderProfile?: string;
  subject: string;
  body: string;
  scheduledAt: string; // ISO 8601 string
  minDelayPerSend?: number; // seconds between batch sends
}

export interface RescheduleEmailPayload {
  scheduledAt: string; // ISO 8601 string
}

export interface EmailJobData {
  emailId: string;
  recipient: string;
  senderProfile?: string;
  subject: string;
  body: string;
  scheduledAt: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: number;
}

export interface HourlyQuotaStats {
  limit: number;
  usedThisHour: number;
  remaining: number;
}
