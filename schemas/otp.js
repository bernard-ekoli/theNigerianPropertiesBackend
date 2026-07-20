import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otpHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 min TTL
});

const OTP = mongoose.Model.Otp || mongoose.model('Otp', otpSchema);

export default OTP