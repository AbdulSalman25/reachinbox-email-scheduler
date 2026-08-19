export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface EmailJob {
  id: string;
  bullmqJobId: string | null;
  recipient: string;
  senderProfile?: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt: string | null;
  etherealPreviewUrl: string | null;
  etherealMessageId: string | null;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  queueState?: string | null;
}

export interface QueueStats {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: number;
}

export interface HourlyQuota {
  limit: number;
  usedThisHour: number;
  remaining: number;
}

export interface DashboardStats {
  counts: {
    total: number;
    scheduled: number;
    sent: number;
    failed: number;
    cancelled: number;
    deferred?: number;
  };
  quota?: HourlyQuota;
  queue: QueueStats;
  etherealAccount?: {
    user: string;
    pass: string;
    webUrl?: string;
  } | null;
}

export interface ScheduleEmailPayload {
  recipient?: string;
  recipients?: string[];
  senderProfile?: string;
  subject: string;
  body: string;
  scheduledAt: string;
  minDelayPerSend?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
