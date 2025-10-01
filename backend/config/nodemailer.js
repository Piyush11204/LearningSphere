const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.AUTH_EMAIL || !process.env.AUTH_PASS) {
      console.log('Email would be sent:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', html.substring(0, 200) + '...');
      return { success: true, message: 'Email logged (no config)' };
    }

    const info = await transporter.sendMail({
      from: `"LearningSphere Support" <${process.env.AUTH_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

module.exports = { transporter, sendEmail };
