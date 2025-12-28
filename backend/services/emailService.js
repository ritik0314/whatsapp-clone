
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const missingEmailConfig = !emailUser || !emailPass;

// Use explicit Gmail SMTP configuration with secure port
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
  greetingTimeout: 5000,
});

transporter.verify((error) => {
  if (error) {
    console.error('Gmail SMTP verification failed:', error?.message || error);
  } else {
    console.log('Gmail SMTP ready to send emails');
  }
});

const sendOtpToEmail = async (email, otp) => {
  if (missingEmailConfig) {
    throw new Error('Email service not configured: set EMAIL_USER and EMAIL_PASS');
  }
      const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 WhatsApp Web Verification</h2>
      
      <p>Hi there,</p>
      
      <p>Your one-time password (OTP) to verify your WhatsApp Web account is:</p>
      
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>

      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>

      <p>If you didn’t request this OTP, please ignore this email.</p>

      <p style="margin-top: 20px;">Thanks & Regards,<br/>WhatsApp Web Security Team</p>

      <hr style="margin: 30px 0;" />

      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;

  await transporter.sendMail({
    from: `WhatsApp Web <${emailUser}>`,
    to: email,
    subject: 'Your WhatsApp Verification Code',
    html,
  });
};

module.exports= sendOtpToEmail