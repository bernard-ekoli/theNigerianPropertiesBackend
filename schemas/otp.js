import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otpHash: { type: String, required: true },
  lastSentAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

const OTP = mongoose.Model.Otp || mongoose.model('Otp', otpSchema);

export default OTP