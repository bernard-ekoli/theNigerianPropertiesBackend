import * as crypto from "crypto";
import * as bcrypt from "bcrypt"
import OTP from '../schemas/otp.js';
import express from 'express'

import { sendOTPEmail } from "../utils/mailer.js"
const router = express()

router.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const existing = await OTP.findOne({ email });
  if (existing) {
    return res.status(429).json({ error: 'OTP already sent, check your inbox or wait' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await OTP.create({ email, otpHash });
  await sendOTPEmail(email, otp);

  res.json({ message: 'OTP sent' });
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const record = await Otp.findOne({ email });

  if (!record) return res.status(400).json({ error: 'OTP expired or not found' });

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

  await Otp.deleteOne({ _id: record._id });
  res.json({ message: 'Verified' });
});

export default router