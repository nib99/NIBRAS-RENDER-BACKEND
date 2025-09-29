const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendEmail } = require('../utils/sendEmail');

const router = express.Router();

// Simple in-memory storage for newsletter subscribers
// In production, use a proper database
const subscribers = new Set();

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post('/subscribe', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
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

    const { email, name } = req.body;

    // Check if already subscribed
    if (subscribers.has(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email is already subscribed to our newsletter'
      });
    }

    // Add to subscribers
    subscribers.add(email);

    // Send welcome email
    try {
      await sendEmail({
        email: email,
        subject: 'Welcome to Nibras Ahmed Newsletter!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Our Newsletter! 📧</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #059669; margin-top: 0;">Hi ${name || 'there'}! 👋</h2>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for subscribing to our newsletter! You'll now receive updates about:
              </p>
              <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
                <li>🚀 New digital products and templates</li>
                <li>💡 Development tips and tutorials</li>
                <li>🎯 Exclusive offers and discounts</li>
                <li>📈 Industry insights and trends</li>
              </ul>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                We promise to only send valuable content and never spam your inbox.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || '#'}" style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Visit Our Website
                </a>
              </div>
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                You can unsubscribe at any time by replying to any of our emails.
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Newsletter welcome email failed:', emailError);
      // Don't fail the subscription if email fails
    }

    res.json({
      success: true,
      message: 'Successfully subscribed to newsletter!'
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while subscribing to newsletter'
    });
  }
});

// @route   POST /api/newsletter/unsubscribe
// @desc    Unsubscribe from newsletter
// @access  Public
router.post('/unsubscribe', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
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

    const { email } = req.body;

    // Remove from subscribers
    const wasSubscribed = subscribers.delete(email);

    if (!wasSubscribed) {
      return res.status(400).json({
        success: false,
        message: 'Email is not subscribed to our newsletter'
      });
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unsubscribing from newsletter'
    });
  }
});

// @route   GET /api/newsletter/count
// @desc    Get subscriber count (admin only)
// @access  Public (for demo purposes)
router.get('/count', (req, res) => {
  res.json({
    success: true,
    data: {
      subscriberCount: subscribers.size
    }
  });
});

module.exports = router;
