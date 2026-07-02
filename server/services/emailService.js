const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Configure standard SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"GU MerchStore" <${process.env.SMTP_USER || 'merch@geetauniversity.ac.in'}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Email sending failed: ${error.message}`);
    // Return mock successful result in local development if environment variables are not set
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Skipping actual email send (SMTP credentials missing). Returning mock response.');
      return { mock: true, messageId: 'mock-message-id' };
    }
    throw error;
  }
};

module.exports = { sendEmail };
