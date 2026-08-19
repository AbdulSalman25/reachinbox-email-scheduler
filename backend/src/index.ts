import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import emailRoutes from './routes/email.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { initEmailWorker, closeEmailWorker } from './workers/email.worker.js';
import { closeEmailQueue } from './services/queue.service.js';
import { getMailerTransporter } from './config/mailer.js';
import { prisma } from './lib/prisma.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev/dashboard simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/queue/stats' && req.originalUrl !== '/api/health') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'reachinbox-email-scheduler',
  });
});

import path from 'path';
import fs from 'fs';

// API Routes
app.use('/api', emailRoutes);

// Serve Frontend Static Build if available
const frontendDistPath = path.resolve(process.cwd(), '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Error Handler
app.use(errorHandler);

// Server bootstrap
let server: any = null;

async function bootstrap() {
  try {
    console.log('----------------------------------------------------');
    console.log('🚀 ReachInbox Full-Stack Email Job Scheduler Service');
    console.log('----------------------------------------------------');

    // 1. Verify DB Connection
    await prisma.$connect();
    console.log('[Database] ✅ Prisma successfully connected to Database.');

    // 2. Initialize Nodemailer & Ethereal
    await getMailerTransporter();

    // 3. Start BullMQ Worker
    initEmailWorker();

    // 4. Start HTTP Server
    server = app.listen(config.port, () => {
      console.log(`[Server] 🌐 Server running at http://localhost:${config.port}`);
      console.log(`[Server] 📡 Health check at http://localhost:${config.port}/api/health`);
      console.log('----------------------------------------------------\n');
    });
  } catch (error) {
    console.error('[Bootstrap Error] Failed to start application:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n[Shutdown] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      console.log('[Shutdown] HTTP Server closed.');
    });
  }

  try {
    await closeEmailWorker();
    await closeEmailQueue();
    await prisma.$disconnect();
    console.log('[Shutdown] All background workers and DB connections closed cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('[Shutdown Error] Error during teardown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

bootstrap();
