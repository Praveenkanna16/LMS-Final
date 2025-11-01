const { DataTypes, Op } = require('sequelize');
const slugify = require('slugify');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: sequelize.getDialect() === 'postgres' ? DataTypes.UUID : DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: sequelize.getDialect() === 'postgres' ? DataTypes.UUIDV4 : undefined,
    allowNull: false,
    autoIncrement: sequelize.getDialect() === 'sqlite'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 2000]
    }
  },
  shortDescription: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'teacher_id' // Map to actual database column
  },
  category: {
    type: DataTypes.ENUM(
      'Mathematics', 'Physics', 'Chemistry', 'Biology',
      'English', 'Computer Science', 'Economics', 'History',
      'Geography', 'Art', 'Music', 'Programming', 'Other'
    ),
    allowNull: false
  },
  subcategory: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  level: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'All Levels'),
    allowNull: false,
    defaultValue: 'All Levels'
  },
  duration: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(50),
    defaultValue: 'English'
  },
  tags: {
    type: DataTypes.TEXT, // Store as JSON string for SQLite
    defaultValue: '[]'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  studentsEnrolled: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'students_enrolled'
  },
  studentsCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'students_completed'
  },
  coTeachers: {
    type: DataTypes.TEXT, // Store as JSON string for SQLite
    defaultValue: '[]'
  },
  // Learning objectives stored as JSON string for SQLite
  learningObjectives: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  prerequisites: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  targetAudience: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  // Course modules stored as JSON string for SQLite
  modules: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  // AI features stored as JSON string for SQLite
  aiFeatures: {
    type: DataTypes.TEXT,
    defaultValue: '{"personalizedPaths":false,"adaptiveDifficulty":false,"autoRecommendations":false,"smartAssessments":false,"contentSuggestions":false}'
  },
  // Analytics stored as JSON string for SQLite
  stats: {
    type: DataTypes.TEXT,
    defaultValue: '{"rating":0,"reviewCount":0,"studentsEnrolled":0,"studentsCompleted":0,"completionRate":0,"averageTimeToComplete":0,"dropOffPoints":[],"popularModules":[]}'
  },
  // Media stored as JSON string for SQLite
  media: {
    type: DataTypes.TEXT,
    defaultValue: '{"thumbnail":"","trailer":"","gallery":[],"promotionalVideo":""}'
  },
  // Settings stored as JSON string for SQLite
  settings: {
    type: DataTypes.TEXT,
    defaultValue: '{"isActive":true,"isPublished":false,"isPremium":true,"allowPreview":true,"certificateEnabled":true,"discussionsEnabled":true,"assignmentsEnabled":true,"liveSessionsEnabled":true}'
  },
  // Pricing stored as JSON string for SQLite
  pricing: {
    type: DataTypes.TEXT,
    defaultValue: '{"originalPrice":0,"discountPrice":0,"discountPercentage":0,"currency":"INR","priceTiers":[]}'
  },
  // SEO stored as JSON string for SQLite
  seo: {
    type: DataTypes.TEXT,
    defaultValue: '{"slug":"","metaTitle":"","metaDescription":"","keywords":[]}'
  },
  // Quality stored as JSON string for SQLite
  quality: {
    type: DataTypes.TEXT,
    defaultValue: '{"isVerified":false,"verifiedBy":null,"verifiedAt":null,"standards":[],"accreditation":[]}'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updateNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Reviews stored as JSON string for SQLite
  featuredReviews: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  }
}, {
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['teacher_id'] },
    { fields: ['category'] },
    { fields: ['level'] },
    { fields: ['price'] },
    { fields: ['rating'] },
    { fields: ['students_enrolled'] },
    { fields: ['slug'] },
    { fields: ['created_at'] }
  ]
});

// Hooks
Course.beforeCreate(async (course) => {
  // Generate slug from title
  if (course.title) {
    course.slug = slugify(course.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });

    // Ensure unique slug
    let counter = 1;
    const originalSlug = course.slug;

    while (await Course.findOne({ where: { slug: course.slug } })) {
      course.slug = `${originalSlug}-${counter}`;
      counter++;
    }
  }

  // Update last updated timestamp
  course.lastUpdated = new Date();
});

Course.beforeUpdate(async (course) => {
  // Update last updated timestamp
  course.lastUpdated = new Date();
});

// Static methods
Course.getFeaturedCourses = async function(limit = 10) {
  return await this.findAll({
    where: {
      'settings.isPublished': true,
      'settings.isActive': true
    },
    order: [['rating', 'DESC'], ['students_enrolled', 'DESC']],
    limit
  });
};

Course.getByCategory = async function(category, options = {}) {
  const whereClause = {
    category,
    'settings.isPublished': true,
    'settings.isActive': true
  };

  let order = [['created_at', 'DESC']];
  if (options.sort) {
    order = options.sort;
  }

  return await this.findAll({
    where: whereClause,
    order,
    limit: options.limit,
    offset: options.skip || 0
  });
};

Course.getPopularCourses = async function(limit = 10) {
  return await this.findAll({
    where: {
      'settings.isPublished': true,
      'settings.isActive': true,
      studentsEnrolled: { [Op.gte]: 10 }
    },
    order: [['students_enrolled', 'DESC'], ['rating', 'DESC']],
    limit
  });
};

Course.searchCourses = async function(searchTerm, filters = {}) {
  // For now, use simple LIKE search since PostgreSQL doesn't have text search by default
  // In production, you might want to use full-text search
  const whereClause = {
    [Op.or]: [
      { title: { [Op.iLike]: `%${searchTerm}%` } },
      { description: { [Op.iLike]: `%${searchTerm}%` } }
    ],
    'settings.isPublished': true,
    'settings.isActive': true
  };

  // Apply filters
  if (filters.category) whereClause.category = filters.category;
  if (filters.level) whereClause.level = filters.level;
  if (filters.minPrice !== undefined) whereClause.price = { [Op.gte]: filters.minPrice };
  if (filters.maxPrice !== undefined) whereClause.price = { ...whereClause.price, [Op.lte]: filters.maxPrice };
  if (filters.minRating !== undefined) whereClause.rating = { [Op.gte]: filters.minRating };

  return await this.findAll({
    where: whereClause,
    order: [['rating', 'DESC'], ['students_enrolled', 'DESC']]
  });
};

// Instance methods
Course.prototype.updateStats = async function() {
  // Update enrollment stats
  const Batch = require('./Batch');

  try {
    const enrolledBatches = await Batch.findAll({
      where: {
        course_id: this.id,
        'settings.isActive': true
      }
    });

    let totalEnrolled = 0;
    let totalCompleted = 0;

    enrolledBatches.forEach(batch => {
      totalEnrolled += batch.students?.length || 0;
      // Calculate completed students (simplified logic)
      const completedInBatch = Math.floor((batch.students?.length || 0) * 0.7); // 70% completion rate
      totalCompleted += completedInBatch;
    });

    this.studentsEnrolled = totalEnrolled;
    this.studentsCompleted = totalCompleted;

    // Update completion rate
    if (totalEnrolled > 0) {
      this.stats = this.stats || {};
      this.stats.completionRate = Math.round((totalCompleted / totalEnrolled) * 100);
    }

    await this.save();
  } catch (error) {
    console.error('Error updating course stats:', error);
  }
};

Course.prototype.calculateRating = async function() {
  // This would be called when new reviews are added
  // Implementation would depend on review system
  return this.rating;
};

// Associations
Course.associate = (models) => {
  Course.belongsTo(models.User, { foreignKey: 'teacherId', as: 'teacher' });
  Course.hasMany(models.Batch, { foreignKey: 'courseId', as: 'batches' });
};

module.exports = Course;
