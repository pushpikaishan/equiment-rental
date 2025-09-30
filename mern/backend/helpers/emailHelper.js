const nodemailer = require("nodemailer");

// Use env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
let transporter;
if (process.env.SMTP_HOST) {
  const port = Number(process.env.SMTP_PORT || 587);
  // If SMTP_SECURE is explicitly set, use it. Otherwise, if port is 465, force secure.
  const secure = typeof process.env.SMTP_SECURE !== 'undefined'
    ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
    : port === 465;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
} else {
  // Dev fallback: do not actually send, just output JSON
  transporter = nodemailer.createTransport({ jsonTransport: true });
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@example.com";
  let info;
  try {
    info = await transporter.sendMail({ from, to, subject, text, html });
  } catch (err) {
    console.error("Email send error:", err && err.response ? err.response : err);
    throw err;
  }
  if (info && info.message) {
    // jsonTransport returns an object with the message
    try { console.log("[DEV MAIL]", JSON.parse(info.message)); } catch { console.log("[DEV MAIL]", info); }
  }
  return info;
}

async function sendPasswordCode(to, code) {
  const subject = "Your password reset code";
  const text = `Your password reset code is: ${code}. It expires in 10 minutes.`;
  const html = `<p>Your password reset code is:</p><p style=\"font-size:20px;font-weight:bold\">${code}</p><p>This code expires in 10 minutes.</p>`;
  await sendMail({ to, subject, text, html });
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV] Password reset code for ${to}: ${code}`);
  }
}

module.exports = { sendMail, sendPasswordCode };
// 2FA code sender (email-based)
async function sendTwoFactorCode(to, code) {
  const subject = 'Your 2FA verification code';
  const text = `Your 2FA verification code is: ${code}. It expires in 10 minutes.`;
  const html = `<p>Your 2FA verification code is:</p><p style="font-size:20px;font-weight:bold">${code}</p><p>This code expires in 10 minutes.</p>`;
  await sendMail({ to, subject, text, html });
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV] 2FA code for ${to}: ${code}`);
  }
}

module.exports.sendTwoFactorCode = sendTwoFactorCode;
