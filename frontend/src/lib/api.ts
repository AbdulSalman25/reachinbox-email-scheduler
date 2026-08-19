import axios from 'axios';
import { DashboardStats, EmailJob, EmailStatus, Pagination, QueueStats, ScheduleEmailPayload } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchEmails(params?: {
  status?: EmailStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: EmailJob[]; pagination: Pagination }> {
  const response = await apiClient.get('/emails', { params });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

export async function fetchEmailById(id: string): Promise<EmailJob> {
  const response = await apiClient.get(`/emails/${id}`);
  return response.data.data;
}

export async function scheduleEmail(payload: ScheduleEmailPayload): Promise<EmailJob> {
  const response = await apiClient.post('/emails/schedule', payload);
  return response.data.data;
}

export async function cancelEmail(id: string): Promise<EmailJob> {
  const response = await apiClient.post(`/emails/${id}/cancel`);
  return response.data.data;
}

export async function rescheduleEmail(id: string, scheduledAt: string): Promise<EmailJob> {
  const response = await apiClient.post(`/emails/${id}/reschedule`, { scheduledAt });
  return response.data.data;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get('/dashboard/stats');
  return response.data.data;
}

export async function fetchQueueStats(): Promise<QueueStats> {
  const response = await apiClient.get('/queue/stats');
  return response.data.data;
}
