import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { EmailStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy · HH:mm:ss');
  } catch {
    return dateString;
  }
}

export function formatTimeRelative(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function getCountdownTime(scheduledAtString: string): { text: string; isDue: boolean; secondsLeft: number } {
  try {
    const target = parseISO(scheduledAtString).getTime();
    const now = Date.now();
    const diffMs = target - now;

    if (diffMs <= 0) {
      return { text: 'Sending now...', isDue: true, secondsLeft: 0 };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    if (hours > 0) {
      return { text: `in ${hours}h ${remainingMins}m`, isDue: false, secondsLeft: totalSeconds };
    }
    if (minutes > 0) {
      return { text: `in ${minutes}m ${seconds}s`, isDue: false, secondsLeft: totalSeconds };
    }
    return { text: `in ${seconds}s`, isDue: false, secondsLeft: totalSeconds };
  } catch {
    return { text: '-', isDue: false, secondsLeft: 0 };
  }
}

export function getStatusBadgeConfig(status: EmailStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'SCHEDULED':
      return {
        label: 'Scheduled',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'PROCESSING':
      return {
        label: 'Sending...',
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        dot: 'bg-sky-500 animate-ping',
      };
    case 'SENT':
      return {
        label: 'Sent (Ethereal SMTP)',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'FAILED':
      return {
        label: 'Delivery Failure',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}
