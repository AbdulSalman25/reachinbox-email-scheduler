import nodemailer, { Transporter } from 'nodemailer';
import { config } from './env.js';

let transporter: Transporter | null = null;
let etherealAccountInfo: { user: string; pass: string; webUrl?: string } | null = null;

export async function getMailerTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter;
  }

  let user = config.ethereal.user;
  let pass = config.ethereal.pass;

  if (!user || !pass) {
    console.log('[Mailer] No Ethereal credentials found in env. Creating a new Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    user = testAccount.user;
    pass = testAccount.pass;
    etherealAccountInfo = {
      user: testAccount.user,
      pass: testAccount.pass,
      webUrl: `https://ethereal.email/login`,
    };
    console.log(`[Mailer] Generated Ethereal Test Account:`);
    console.log(`  User: ${user}`);
    console.log(`  Pass: ${pass}`);
    console.log(`  Web:  https://ethereal.email/login`);
  } else {
    etherealAccountInfo = { user, pass };
  }

  transporter = nodemailer.createTransport({
    host: config.ethereal.host,
    port: config.ethereal.port,
    secure: false, // Ethereal port 587 uses STARTTLS
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export function getEtherealAccountInfo() {
  return etherealAccountInfo;
}

export async function sendEmailViaEthereal(options: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}): Promise<{ messageId: string; previewUrl: string | false }> {
  const mailer = await getMailerTransporter();

  const sender = options.from || (etherealAccountInfo ? `ReachInbox Scheduler <${etherealAccountInfo.user}>` : 'ReachInbox Scheduler <scheduler@reachinbox.ai>');

  const info = await mailer.sendMail({
    from: sender,
    to: options.to,
    subject: options.subject,
    text: options.body,
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <div style="margin-bottom: 20px; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
        <h2 style="color: #4f46e5; margin: 0;">ReachInbox Job Scheduler</h2>
        <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">Automated Email Outreach Engine</p>
      </div>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <p style="white-space: pre-wrap; margin: 0;">${options.body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>
      <div style="margin-top: 25px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px;">
        Sent via ReachInbox Persistent BullMQ Email Scheduler at ${new Date().toISOString()}
      </div>
    </div>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl,
  };
}
