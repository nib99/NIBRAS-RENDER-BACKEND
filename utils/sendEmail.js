const nodemailer = require('nodemailer');

// Simple email sending function
const sendEmail = async (options) => {
  try {
    // For development - just log the email
    console.log('📧 Email would be sent:', {
      to: options.email,
      subject: options.subject,
      message: options.message || options.html
    });

    // Return success for now
    return { success: true, messageId: 'dev-' + Date.now() };

  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Utility functions for common email types
const sendWelcomeEmail = async (email, name, loginUrl) => {
  return sendEmail({
    email,
    subject: 'Welcome!',
    message: `Hi ${name}, welcome to our platform!`
  });
};

const sendPasswordResetEmail = async (email, name, resetUrl, expiryTime = '10 minutes') => {
  return sendEmail({
    email,
    subject: 'Password Reset',
    message: `Hi ${name}, click here to reset your password: ${resetUrl}`
  });
};

const sendOrderConfirmationEmail = async (email, name, orderData) => {
  return sendEmail({
    email,
    subject: `Order Confirmation #${orderData.orderNumber}`,
    message: `Hi ${name}, your order has been confirmed!`
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail
};
