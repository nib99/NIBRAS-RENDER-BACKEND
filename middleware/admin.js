// Admin middleware to check if user has admin privileges
const admin = (req, res, next) => {
  try {
    // Check if user exists and is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // User is admin, proceed to next middleware
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization'
    });
  }
};

module.exports = admin;
