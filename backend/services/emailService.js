
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const emailUser = process.env.EMAIL_USER?.trim();
const emailPass = process.env.EMAIL_PASS?.trim();

const missingEmailConfig = !emailUser || !emailPass;

// Use Gmail SMTP with TLS (port 587) for better compatibility with hosting providers
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS instead of SSL
  requireTLS: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 15000,
  socketTimeout: 15000,
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
    const error = new Error('Email service not configured: set EMAIL_USER and EMAIL_PASS');
    console.error('❌ Email Config Error:', error.message);
    throw error;
  }
  
  console.log(`📧 Attempting to send OTP to ${email} using ${emailUser}`);
  
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

  try {
    const info = await transporter.sendMail({
      from: `WhatsApp Web <${emailUser}>`,
      to: email,
      subject: 'Your WhatsApp Verification Code',
      html,
    });
    console.log('✅ Email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    throw error;
  }
};

module.exports= sendOtpToEmail