import { prisma } from '../src/lib/prisma.js';
import { scheduleEmail, getEmails, cancelEmail, rescheduleEmail, getDashboardStats } from '../src/services/email.service.js';
import { initEmailWorker, closeEmailWorker } from '../src/workers/email.worker.js';
import { closeEmailQueue, emailQueue } from '../src/services/queue.service.js';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING REACHINBOX SCHEDULER VERIFICATION TESTS');
  console.log('====================================================\n');

  try {
    // 0. Clean DB for fresh test run
    await prisma.emailJob.deleteMany();
    await emailQueue.drain();
    await emailQueue.clean(0, 1000, 'delayed');
    await emailQueue.clean(0, 1000, 'completed');

    // 1. Initialize Worker
    const worker = initEmailWorker();
    console.log('[Test] Worker started.');

    // Test 1: Schedule an email with 4-second delay
    console.log('\n--- TEST 1: Schedule Delayed Email & Verify Ethereal Delivery ---');
    const scheduleTime = new Date(Date.now() + 4000).toISOString();
    const scheduled = await scheduleEmail({
      recipient: 'john.doe@reachinbox-client.com',
      subject: 'Welcome to ReachInbox AI Outreach Engine',
      body: 'Hello John,\n\nWe are testing the full-stack persistent job scheduler with BullMQ and Ethereal Email.\n\nBest Regards,\nReachInbox Team',
      scheduledAt: scheduleTime,
    });

    console.log(`[Test 1] Email created with ID: ${scheduled.id}, Status: ${scheduled.status}, Delay: ${scheduled.delayMs}ms`);
    if (scheduled.status !== 'SCHEDULED') {
      throw new Error(`Expected status SCHEDULED, got ${scheduled.status}`);
    }

    // Verify job in BullMQ
    const bullmqJob = await emailQueue.getJob(scheduled.id);
    if (!bullmqJob) {
      throw new Error(`BullMQ job ${scheduled.id} not found in queue!`);
    }
    const jobState = await bullmqJob.getState();
    console.log(`[Test 1] BullMQ Job State: ${jobState} (Expected: delayed)`);

    // Test 2: Test Cancellation
    console.log('\n--- TEST 2: Schedule & Cancel Email ---');
    const cancelTargetTime = new Date(Date.now() + 60000).toISOString();
    const emailToCancel = await scheduleEmail({
      recipient: 'cancel.me@example.com',
      subject: 'This email will be cancelled before sending',
      body: 'Do not send this email.',
      scheduledAt: cancelTargetTime,
    });
    console.log(`[Test 2] Scheduled email to cancel with ID: ${emailToCancel.id}`);

    const cancelled = await cancelEmail(emailToCancel.id);
    console.log(`[Test 2] Email cancelled. Status: ${cancelled.status}`);
    if (cancelled.status !== 'CANCELLED') {
      throw new Error(`Expected status CANCELLED, got ${cancelled.status}`);
    }

    // Test 3: Test Rescheduling
    console.log('\n--- TEST 3: Reschedule Email ---');
    const emailToReschedule = await scheduleEmail({
      recipient: 'reschedule.me@example.com',
      subject: 'This email will be rescheduled',
      body: 'Testing reschedule functionality.',
      scheduledAt: new Date(Date.now() + 100000).toISOString(),
    });
    const newTargetTime = new Date(Date.now() + 200000).toISOString();
    const rescheduled = await rescheduleEmail(emailToReschedule.id, newTargetTime);
    console.log(`[Test 3] Email rescheduled to: ${rescheduled.scheduledAt.toISOString()}`);

    // Wait for Test 1 email to be executed by BullMQ Worker (4s delay + 3s margin for SMTP delivery)
    console.log('\n--- WAITING FOR WORKER TO EXECUTE TEST 1 EMAIL (8s) ---');
    let emailResult = null;
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      emailResult = await prisma.emailJob.findUnique({
        where: { id: scheduled.id },
      });
      process.stdout.write(`\r[Test 1 Polling] Status: ${emailResult?.status} (elapsed: ${i + 1}s)...`);
      if (emailResult?.status === 'SENT') {
        break;
      }
    }
    console.log('\n');

    if (emailResult?.status !== 'SENT') {
      throw new Error(`Email was not sent in time! Current status: ${emailResult?.status}, Error: ${emailResult?.errorMessage}`);
    }

    console.log('✅ TEST 1 PASSED: Email successfully delivered via Ethereal SMTP!');
    console.log(`  - Recipient:           ${emailResult.recipient}`);
    console.log(`  - Status:              ${emailResult.status}`);
    console.log(`  - Sent At:             ${emailResult.sentAt}`);
    console.log(`  - Ethereal Message ID: ${emailResult.etherealMessageId}`);
    console.log(`  - Ethereal Web Link:   ${emailResult.etherealPreviewUrl}`);

    // Test 4: Server Restart Simulation Test
    console.log('\n--- TEST 4: SERVER RESTART RESILIENCE SIMULATION ---');
    console.log('Scheduling email for 4 seconds in the future, then simulating server kill & restart...');
    const restartEmail = await scheduleEmail({
      recipient: 'restart.survival@reachinbox-testing.com',
      subject: 'Server Restart Resilience Proof',
      body: 'This job survived an abrupt server restart without losing queue state or double sending!',
      scheduledAt: new Date(Date.now() + 4000).toISOString(),
    });
    console.log(`[Test 4] Scheduled restart email: ${restartEmail.id}`);

    // Simulating server crash: close worker immediately
    console.log('[Test 4] Simulating server shutdown (Worker terminated)...');
    await closeEmailWorker();
    console.log('[Test 4] Server down for 2 seconds...');
    await sleep(2000);

    console.log('[Test 4] Simulating server reboot (Worker re-attached to existing Redis queue)...');
    initEmailWorker();

    console.log('[Test 4] Waiting for BullMQ to resume and deliver the scheduled job...');
    let restartResult = null;
    for (let i = 0; i < 10; i++) {
      await sleep(1000);
      restartResult = await prisma.emailJob.findUnique({
        where: { id: restartEmail.id },
      });
      if (restartResult?.status === 'SENT') {
        break;
      }
    }

    if (restartResult?.status !== 'SENT') {
      throw new Error(`Restart resilience test failed! Status: ${restartResult?.status}`);
    }

    console.log('✅ TEST 4 PASSED: Job survived server restart and executed on schedule!');
    console.log(`  - Ethereal Preview: ${restartResult.etherealPreviewUrl}`);

    // Check final dashboard stats
    const stats = await getDashboardStats();
    console.log('\n--- FINAL SYSTEM METRICS ---');
    console.log('DB Counts:   ', stats.counts);
    console.log('Queue Status:', stats.queue);

    console.log('\n====================================================');
    console.log('🎉 ALL INTEGRATION AND RESILIENCE TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  } finally {
    await closeEmailWorker();
    await closeEmailQueue();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTestSuite();
