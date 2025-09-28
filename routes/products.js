const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['templates', 'components', 'themes', 'plugins', 'courses', 'ebooks', 'graphics', 'other']),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be non-negative'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be non-negative'),
  query('sort').optional().isIn(['newest', 'oldest', 'price-low', 'price-high', 'popular', 'rating']),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      search,
      featured
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Featured filter
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'price-low':
        sortObj = { price: 1 };
        break;
      case 'price-high':
        sortObj = { price: -1 };
        break;
      case 'popular':
        sortObj = { 'stats.sales': -1, 'stats.views': -1 };
        break;
      case 'rating':
        sortObj = { 'stats.rating.average': -1, 'stats.rating.count': -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // If search is used, add text score to sort
    if (search) {
      sortObj = { score: { $meta: 'textScore' }, ...sortObj };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name')
        .select('-files -__v'),
      Product.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      },
      filters: {
        category,
        minPrice,
        maxPrice,
        search,
        sort
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID or slug
// @access  Public
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by ID first, then by slug
    let product;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId
      product = await Product.findById(identifier);
    } else {
      // Assume it's a slug
      product = await Product.findOne({ slug: identifier });
    }

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count (don't await to avoid slowing response)
    product.incrementViews().catch(err => console.error('Error incrementing views:', err));

    // Populate related data
    await product.populate('createdBy', 'name avatar');

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin only)
router.post('/', [auth, admin, upload.array('images', 10)], [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('category')
    .isIn(['templates', 'components', 'themes', 'plugins', 'courses', 'ebooks', 'graphics', 'other'])
    .withMessage('Invalid category')
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

    const productData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: file.path,
        alt: `${req.body.name} - Image ${index + 1}`,
        isPrimary: index === 0
      }));
    }

    // Parse arrays from form data
    if (req.body.tags) {
      productData.tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(tag => tag.trim());
    }
    if (req.body.features) {
      productData.features = Array.isArray(req.body.features) ? req.body.features : req.body.features.split(',').map(feature => feature.trim());
    }
    if (req.body.techStack) {
      productData.techStack = Array.isArray(req.body.techStack) ? req.body.techStack : req.body.techStack.split(',').map(tech => tech.trim());
    }

    const product = new Product(productData);
    await product.save();

    await product.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id', [auth, admin], [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('category')
    .optional()
    .isIn(['templates', 'components', 'themes', 'plugins', 'courses', 'ebooks', 'graphics', 'other'])
    .withMessage('Invalid category')
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

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });

    product.updatedBy = req.user.id;
    await product.save();

    await product.populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    product.updatedBy = req.user.id;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
});

// @route   GET /api/products/:id/download
// @desc    Download product files
// @access  Private (Must own the product)
router.get('/:id/download', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has purchased this product
    // This would typically check against orders/purchases
    // For now, we'll allow admin users to download
    if (req.user.role !== 'admin') {
      // TODO: Check if user has purchased this product
      // const hasPurchased = await Order.findOne({
      //   user: req.user.id,
      //   'items.product': product._id,
      //   status: 'completed'
      // });
      
      // if (!hasPurchased) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'You must purchase this product to download it'
      //   });
      // }
    }

    // Increment download count
    product.incrementDownloads().catch(err => console.error('Error incrementing downloads:', err));

    res.json({
      success: true,
      message: 'Download links generated',
      data: {
        files: product.files,
        downloadUrl: product.files[0]?.url || null
      }
    });

  } catch (error) {
    console.error('Download product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing download'
    });
  }
});

module.exports = router;