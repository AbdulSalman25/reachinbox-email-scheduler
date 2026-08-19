import { Router } from 'express';
import {
  scheduleEmailHandler,
  getEmailsHandler,
  getEmailByIdHandler,
  cancelEmailHandler,
  rescheduleEmailHandler,
  getQueueStatsHandler,
  getDashboardStatsHandler,
} from '../controllers/email.controller.js';

const router = Router();

// Email routes
router.post('/emails/schedule', scheduleEmailHandler);
router.get('/emails', getEmailsHandler);
router.get('/emails/:id', getEmailByIdHandler);
router.post('/emails/:id/cancel', cancelEmailHandler);
router.post('/emails/:id/reschedule', rescheduleEmailHandler);

// Metrics & Health
router.get('/queue/stats', getQueueStatsHandler);
router.get('/dashboard/stats', getDashboardStatsHandler);

export default router;
