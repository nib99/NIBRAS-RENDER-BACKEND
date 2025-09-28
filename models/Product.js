const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: [
      'templates',
      'components',
      'themes',
      'plugins',
      'courses',
      'ebooks',
      'graphics',
      'other'
    ]
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  files: [{
    name: String,
    url: String,
    size: Number,
    type: String
  }],
  demoUrl: String,
  githubUrl: String,
  documentation: String,
  features: [{
    type: String,
    trim: true
  }],
  techStack: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  whatIncluded: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isDigital: {
    type: Boolean,
    default: true
  },
  downloadLimit: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  license: {
    type: String,
    enum: ['personal', 'commercial', 'extended'],
    default: 'personal'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false
});

// Indexes for better query performance
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'stats.rating.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ tags: 1 });

// Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  shortDescription: 'text',
  tags: 'text'
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true
    });
  }
  next();
});

// Pre-save middleware to ensure only one primary image
productSchema.pre('save', function(next) {
  if (this.isModified('images')) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        if (index > 0) img.isPrimary = false;
      });
    } else if (primaryImages.length === 0 && this.images.length > 0) {
      // Set first image as primary if none is set
      this.images[0].isPrimary = true;
    }
  }
  next();
});

// Static method to find active products
productSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find featured products
productSchema.statics.findFeatured = function() {
  return this.find({ isActive: true, isFeatured: true });
};

// Instance method to increment view count
productSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

// Instance method to increment download count
productSchema.methods.incrementDownloads = function() {
  this.stats.downloads += 1;
  return this.save();
};

// Instance method to increment sales count
productSchema.methods.incrementSales = function() {
  this.stats.sales += 1;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);