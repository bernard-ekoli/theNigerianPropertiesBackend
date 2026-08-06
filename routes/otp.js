import * as crypto from "crypto";
import * as bcrypt from "bcrypt"
import OTP from '../schemas/otp.js';
import express from 'express'

import { sendOTPEmail } from "../utils/mailer.js"
const router = express()

const RESEND_COOLDOWN_SECONDS = 60;

router.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const existing = await OTP.findOne({ email });

  if (existing) {
    const secondsSinceLastSend = (Date.now() - existing.lastSentAt) / 1000;

    if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
      return res.status(429).json({
        error: `Please wait ${waitTime}s before requesting another code`
      });
    }

    // cooldown passed — generate a fresh OTP, overwrite the same record
    const otp = crypto.randomInt(100000, 999999).toString();
    existing.otpHash = await bcrypt.hash(otp, 10);
    existing.lastSentAt = new Date();
    existing.createdAt = new Date(); // resets the 10-min TTL expiry too
    await existing.save();
    await sendOTPEmail(email, otp);
    return res.json({ message: 'OTP resent' });
  }

  // no existing record — first request
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await OTP.create({ email, otpHash, lastSentAt: new Date() });
  await sendOTPEmail(email, otp);

  res.json({ message: 'OTP sent' });
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const record = await OTP.findOne({ email });

  if (!record) return res.status(400).json({ error: 'OTP expired or not found' });

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

  await OTP.deleteOne({ _id: record._id });
  res.json({ message: 'Verified' });
});

export default router