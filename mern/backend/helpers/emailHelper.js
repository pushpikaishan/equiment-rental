const nodemailer = require('nodemailer');

// Create a single transporter instance based on environment
function createTransporter() {
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = typeof process.env.SMTP_SECURE !== 'undefined'
      ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
      : port === 465;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  // Dev fallback: json transport outputs payload to console
  return nodemailer.createTransport({ jsonTransport: true });
}

const transporter = createTransporter();

async function sendMail({ to, subject, text, html, from, attachments }) {
  const mailFrom = from || process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@equiprent.local';
  const info = await transporter.sendMail({ from: mailFrom, to, subject, text, html, attachments });
  if (info && info.message) {
    try { console.log('[DEV MAIL]', JSON.parse(info.message)); } catch { console.log('[DEV MAIL]', info); }
  }
  return info;
}

async function sendTwoFactorCode(to, code) {
  const subject = 'Your 2FA verification code';
  const text = `Your 2FA verification code is: ${code}. It expires in 10 minutes.`;
  const html = `<p>Your 2FA verification code is:</p><p style="font-size:20px;font-weight:bold">${code}</p><p>This code expires in 10 minutes.</p>`;
  await sendMail({ to, subject, text, html });
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV] 2FA code for ${to}: ${code}`);
  }
}

// Send password reset code email
async function sendPasswordCode(to, code) {
  const subject = 'Your password reset code';
  const text = `Use this code to reset your password: ${code}. It expires in 10 minutes.`;
  const html = `<p>Use this code to reset your password:</p><p style="font-size:20px;font-weight:bold">${code}</p><p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>`;
  await sendMail({ to, subject, text, html });
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV] Password reset code for ${to}: ${code}`);
  }
}

module.exports = { sendMail, sendTwoFactorCode, sendPasswordCode };
