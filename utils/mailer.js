import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendOTPEmail(to, otp) {
  await transporter.sendMail({
    from: `"TheNigerianProperties" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Your verification code',
    text: `Your OTP is ${otp}. It expires in 10 minutes. Do not share this code.`,
  });
}

export { sendOTPEmail };