const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendEmail } = require('../utils/sendEmail');

const router = express.Router();

// @route   POST /api/contact
// @desc    Send contact form message
// @access  Public
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, subject, message } = req.body;

    // Send email to admin
    try {
      await sendEmail({
        email: process.env.CONTACT_EMAIL || 'contact@nibrasahmed.com',
        subject: `Contact Form: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e40af;">New Contact Form Submission</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              This message was sent from the contact form on your website.
            </p>
          </div>
        `
      });

      // Send confirmation email to user
      await sendEmail({
        email: email,
        subject: 'Thank you for contacting us',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Thank You!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e40af; margin-top: 0;">Hi ${name}! 👋</h2>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Your Message:</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong> ${message}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                We typically respond within 24 hours during business days.
              </p>
            </div>
          </div>
        `
      });

    } catch (emailError) {
      console.error('Contact email failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon!'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

module.exports = router;
