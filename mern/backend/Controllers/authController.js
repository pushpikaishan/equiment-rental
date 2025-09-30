const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../Model/userModel");
const Supplier = require("../Model/supplierModel");
const Admin = require("../Model/adminModel");
const Staff = require("../Model/staffModel");
const PasswordReset = require("../Model/passwordResetModel");
const { sendPasswordCode, sendMail, sendTwoFactorCode } = require("../helpers/emailHelper");
const crypto = require("crypto");
const TwoFactorSettings = require('../Model/twoFactorSettingsModel');
const TwoFactorCode = require('../Model/twoFactorCodeModel');

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // extend token lifetime to reduce frequent expirations
  );
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Check if fields are empty
  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    // Trim email to remove spaces
    const trimmedEmail = String(email).trim();

    // Find account in all collections
    let account =
      (await User.findOne({ email: trimmedEmail })) ||
      (await Supplier.findOne({ email: trimmedEmail })) ||
      (await Admin.findOne({ email: trimmedEmail })) ||
      (await Staff.findOne({ email: trimmedEmail }));

    // Validate account existence and password (support bcrypt hash or plain text)
    if (!account) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    let isValid = false;
    const stored = String(account.password || "");
    try {
      if (/^\$2[aby]\$/.test(stored)) {
        // bcrypt hash
        isValid = await bcrypt.compare(password, stored);
      } else {
        // plain-text fallback
        isValid = stored === password;
      }
    } catch (e) {
      isValid = false;
    }

    if (!isValid) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // If 2FA is enabled for this account, create a pending session and send code
    const tfa = await TwoFactorSettings.findOne({ userId: account._id, role: account.role, enabled: true });
    if (tfa) {
      const code = (Math.floor(100000 + Math.random() * 900000)).toString();
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await TwoFactorCode.updateMany({ userId: account._id, role: account.role, used: false }, { used: true });
      await TwoFactorCode.create({ userId: account._id, role: account.role, codeHash, expiresAt });
      await sendTwoFactorCode(account.email, code);
      return res.json({
        tfaRequired: true,
        role: account.role,
        user: { id: account._id, email: account.email, name: account.name, role: account.role }
      });
    }

    const token = generateToken(account);
    res.json({ token, role: account.role, user: { id: account._id, name: account.name, email: account.email, role: account.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    let account;
    switch (req.user.role) {
      case "user":
        account = await User.findById(req.user.id).select("-password");
        break;
      case "supplier":
        account = await Supplier.findById(req.user.id).select("-password");
        break;
      case "admin":
        account = await Admin.findById(req.user.id).select("-password");
        break;
      case "staff":
        account = await Staff.findById(req.user.id).select("-password");
        break;
      default:
        return res.status(400).json({ msg: "Invalid role" });
    }
    if (!account) {
      return res.status(404).json({ msg: "Account not found" });
    }
    res.json(account);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).send("Server error");
  }
};

// Request password reset code
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });
    const trimmedEmail = String(email).trim();

    // Verify user exists in any role
    const account =
      (await User.findOne({ email: trimmedEmail })) ||
      (await Supplier.findOne({ email: trimmedEmail })) ||
      (await Admin.findOne({ email: trimmedEmail })) ||
      (await Staff.findOne({ email: trimmedEmail }));
    if (!account) return res.status(404).json({ msg: "No account for that email" });

    // Generate a 6-digit code
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    // Hash the code for storage
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous codes for this email
    await PasswordReset.updateMany({ email: trimmedEmail, used: false }, { used: true });
    // Save new code
    await PasswordReset.create({ email: trimmedEmail, codeHash, expiresAt });

    // Send email with code
    await sendPasswordCode(trimmedEmail, code);

    return res.json({ msg: "Reset code sent to email" });
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Reset password with code
exports.resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ msg: "Email, code and newPassword are required" });
    }
    const trimmedEmail = String(email).trim();

    // Find latest reset record
    const record = await PasswordReset.findOne({ email: trimmedEmail, used: false })
      .sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ msg: "Invalid or expired code" });
    if (record.expiresAt < new Date()) {
      record.used = true;
      await record.save();
      return res.status(400).json({ msg: "Code expired" });
    }

    // Compare hashes
    const codeHash = crypto.createHash("sha256").update(String(code)).digest("hex");
    if (codeHash !== record.codeHash) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) record.used = true; // lock after too many attempts
      await record.save();
      return res.status(400).json({ msg: "Invalid code" });
    }

    // Find account in any collection and update password (hash if necessary)
    const collections = [User, Supplier, Admin, Staff];
    let account = null;
    for (const Model of collections) {
      const found = await Model.findOne({ email: trimmedEmail });
      if (found) { account = { doc: found, Model }; break; }
    }
    if (!account) return res.status(404).json({ msg: "Account not found" });

    // Always hash new password
    const hashed = await bcrypt.hash(String(newPassword), 10);
    account.doc.password = hashed;
    await account.doc.save();

    // Mark code as used
    record.used = true;
    await record.save();

    return res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("resetPasswordWithCode error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Check if an email exists in any collection (user, supplier, admin, staff)
exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ msg: "Email is required" });
    const trimmedEmail = String(email).trim();

    const collections = [
      { Model: User, role: 'user' },
      { Model: Supplier, role: 'supplier' },
      { Model: Admin, role: 'admin' },
      { Model: Staff, role: 'staff' },
    ];
    for (const { Model, role } of collections) {
      const found = await Model.findOne({ email: trimmedEmail }).select('_id');
      if (found) return res.json({ exists: true, role, id: found._id });
    }
    return res.json({ exists: false });
  } catch (err) {
    console.error('checkEmailExists error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// Dev-only: send a test email to verify SMTP configuration
exports.testEmail = async (req, res) => {
  try {
    if (!String(process.env.ENABLE_TEST_EMAIL || '').toLowerCase() === 'true') {
      return res.status(403).json({ msg: 'Test email endpoint disabled' });
    }
  } catch {}

  try {
    const { to, subject, text, html } = req.body || {};
    if (!to) return res.status(400).json({ msg: 'Field "to" is required' });
    const sub = subject || 'Test email from Equipment Rental';
    const bodyText = text || 'This is a test email to verify SMTP setup.';
    const bodyHtml = html || `<p>This is a <strong>test email</strong> to verify SMTP setup.</p>`;
    const info = await sendMail({ to, subject: sub, text: bodyText, html: bodyHtml });
    return res.json({ msg: 'Sent', id: info && (info.messageId || info.response || 'ok') });
  } catch (err) {
    console.error('testEmail error:', err);
    return res.status(500).json({ msg: 'Failed to send test email', error: String(err && err.message || err) });
  }
};

// Enable or disable 2FA for the logged-in user (email-based)
exports.setTwoFactor = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: 'Unauthorized' });
    const { enabled } = req.body || {};
    if (typeof enabled !== 'boolean') return res.status(400).json({ msg: 'enabled boolean required' });
    const email = req.user.email || (await (async () => {
      const collections = [User, Supplier, Admin, Staff];
      for (const M of collections) {
        const doc = await M.findById(req.user.id).select('email');
        if (doc) return doc.email;
      }
      return null;
    })());
    if (!email) return res.status(400).json({ msg: 'Email not found for account' });
    const doc = await TwoFactorSettings.findOneAndUpdate(
      { userId: req.user.id, role: req.user.role },
      { userId: req.user.id, role: req.user.role, email, enabled },
      { new: true, upsert: true }
    );
    res.json({ ok: true, settings: doc });
  } catch (err) {
    console.error('setTwoFactor error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Resend a 2FA code for a pending session (after login indicated tfaRequired)
exports.resendTwoFactor = async (req, res) => {
  try {
    const { userId, role } = req.body || {};
    if (!userId || !role) return res.status(400).json({ msg: 'userId and role required' });
    const account = await (async () => {
      const map = { user: User, supplier: Supplier, admin: Admin, staff: Staff };
      const Model = map[role];
      return Model ? Model.findById(userId) : null;
    })();
    if (!account) return res.status(404).json({ msg: 'Account not found' });
    const tfa = await TwoFactorSettings.findOne({ userId, role, enabled: true });
    if (!tfa) return res.status(400).json({ msg: '2FA not enabled' });
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await TwoFactorCode.updateMany({ userId, role, used: false }, { used: true });
    await TwoFactorCode.create({ userId, role, codeHash, expiresAt });
    await sendTwoFactorCode(account.email, code);
    res.json({ ok: true });
  } catch (err) {
    console.error('resendTwoFactor error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Verify 2FA code and return a JWT
exports.verifyTwoFactor = async (req, res) => {
  try {
    const { userId, role, code } = req.body || {};
    if (!userId || !role || !code) return res.status(400).json({ msg: 'userId, role, and code are required' });
    const rec = await TwoFactorCode.findOne({ userId, role, used: false }).sort({ createdAt: -1 });
    if (!rec) return res.status(400).json({ msg: 'Invalid or expired code' });
    if (rec.expiresAt < new Date()) { rec.used = true; await rec.save(); return res.status(400).json({ msg: 'Code expired' }); }
    const codeHash = crypto.createHash('sha256').update(String(code)).digest('hex');
    if (codeHash !== rec.codeHash) {
      rec.attempts = (rec.attempts || 0) + 1;
      if (rec.attempts >= 5) rec.used = true;
      await rec.save();
      return res.status(400).json({ msg: 'Invalid code' });
    }
    rec.used = true; await rec.save();
    // load account and issue token
    const account = await (async () => {
      const map = { user: User, supplier: Supplier, admin: Admin, staff: Staff };
      const Model = map[role];
      return Model ? Model.findById(userId) : null;
    })();
    if (!account) return res.status(404).json({ msg: 'Account not found' });
    const token = generateToken(account);
    res.json({ token, role: account.role, user: { id: account._id, name: account.name, email: account.email, role: account.role } });
  } catch (err) {
    console.error('verifyTwoFactor error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
