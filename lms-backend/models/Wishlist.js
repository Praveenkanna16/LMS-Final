const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wishlist = sequelize.define('Wishlist', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  batch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  priority: {
    type: DataTypes.STRING(20),
    defaultValue: 'medium'
  },
  tags: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price_alert: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  target_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  share_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'], unique: true },
    { fields: ['share_token'], unique: true },
    { fields: ['course_id'] },
    { fields: ['batch_id'] }
  ]
});

// Hooks
Wishlist.beforeUpdate(async (wishlist) => {
  wishlist.lastActivity = new Date();
});

// Static methods
Wishlist.getWishlistByUser = async function(userId) {
  return await this.findOne({ where: { user_id: userId } });
};

Wishlist.getPublicWishlist = async function(shareToken) {
  return await this.findOne({
    where: {
      shareToken,
      isPublic: true
    }
  });
};

// Instance methods
Wishlist.prototype.addItem = async function(itemData) {
  try {
    const items = JSON.parse(this.items || '[]');

    // Check if item already exists
    const existingItemIndex = items.findIndex(item =>
      (itemData.courseId && item.courseId === itemData.courseId) ||
      (itemData.batchId && item.batchId === itemData.batchId)
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      items[existingItemIndex] = { ...items[existingItemIndex], ...itemData };
    } else {
      // Add new item
      const newItem = {
        id: Date.now().toString(),
        courseId: itemData.courseId,
        batchId: itemData.batchId,
        type: itemData.type,
        title: itemData.title,
        description: itemData.description,
        price: itemData.price,
        originalPrice: itemData.originalPrice,
        discount: itemData.discount || 0,
        thumbnail: itemData.thumbnail,
        category: itemData.category,
        level: itemData.level,
        rating: itemData.rating,
        teacherId: itemData.teacherId,
        teacherName: itemData.teacherName,
        teacherAvatar: itemData.teacherAvatar,
        priority: itemData.priority || 'medium',
        notes: itemData.notes,
        priceAlerts: itemData.priceAlerts || { enabled: false },
        tags: itemData.tags || [],
        addedAt: new Date().toISOString(),
        lastViewed: new Date().toISOString(),
        notifyOnSale: itemData.notifyOnSale !== false,
        notifyOnNewBatch: itemData.notifyOnNewBatch !== false,
        notifyOnDiscount: itemData.notifyOnDiscount !== false
      };

      if (itemData.batchDetails) {
        newItem.batchDetails = itemData.batchDetails;
      }

      items.push(newItem);
    }

    this.items = JSON.stringify(items);
    await this.save();
    await this.updateStats();

    return this;
  } catch (error) {
    console.error('Error adding item to wishlist:', error);
    throw error;
  }
};

Wishlist.prototype.removeItem = async function(itemId) {
  try {
    const items = JSON.parse(this.items || '[]');
    this.items = JSON.stringify(items.filter(item => item.id !== itemId));
    await this.save();
    await this.updateStats();

    return this;
  } catch (error) {
    console.error('Error removing item from wishlist:', error);
    throw error;
  }
};

Wishlist.prototype.updateItemPriority = async function(itemId, priority) {
  try {
    const items = JSON.parse(this.items || '[]');
    const item = items.find(item => item.id === itemId);

    if (item) {
      item.priority = priority;
      item.lastViewed = new Date().toISOString();
      this.items = JSON.stringify(items);
      await this.save();
    }

    return this;
  } catch (error) {
    console.error('Error updating item priority:', error);
    throw error;
  }
};

Wishlist.prototype.addNote = async function(itemId, note) {
  try {
    const items = JSON.parse(this.items || '[]');
    const item = items.find(item => item.id === itemId);

    if (item) {
      item.notes = note;
      this.items = JSON.stringify(items);
      await this.save();
    }

    return this;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

Wishlist.prototype.togglePriceAlert = async function(itemId, targetPrice) {
  try {
    const items = JSON.parse(this.items || '[]');
    const item = items.find(item => item.id === itemId);

    if (item) {
      item.priceAlerts = {
        enabled: !item.priceAlerts?.enabled,
        targetPrice: targetPrice || item.price,
        alertSent: false
      };
      this.items = JSON.stringify(items);
      await this.save();
    }

    return this;
  } catch (error) {
    console.error('Error toggling price alert:', error);
    throw error;
  }
};

Wishlist.prototype.updateStats = async function() {
  try {
    const items = JSON.parse(this.items || '[]');

    const stats = {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + item.price, 0),
      potentialSavings: items.reduce((sum, item) => {
        return item.originalPrice && item.originalPrice > item.price
          ? sum + (item.originalPrice - item.price)
          : sum;
      }, 0),
      courses: items.filter(item => item.type === 'course').length,
      batches: items.filter(item => item.type === 'batch').length
    };

    // Update categories
    const categoryMap = {};
    items.forEach(item => {
      const category = item.category || 'Other';
      if (!categoryMap[category]) {
        categoryMap[category] = { count: 0, totalValue: 0 };
      }
      categoryMap[category].count++;
      categoryMap[category].totalValue += item.price;
    });

    const categories = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      count: data.count,
      totalValue: data.totalValue
    }));

    this.stats = JSON.stringify(stats);
    this.categories = JSON.stringify(categories);
    await this.save();
  } catch (error) {
    console.error('Error updating wishlist stats:', error);
  }
};

Wishlist.prototype.generateShareToken = async function() {
  try {
    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');
    this.shareToken = token;
    this.isPublic = true;
    await this.save();
    return token;
  } catch (error) {
    console.error('Error generating share token:', error);
    throw error;
  }
};

Wishlist.prototype.makePrivate = async function() {
  this.isPublic = false;
  this.shareToken = null;
  await this.save();
  return this;
};

// Associations
Wishlist.associate = (models) => {
  Wishlist.belongsTo(models.User, { foreignKey: 'user_id' });
  Wishlist.belongsTo(models.Course, { foreignKey: 'course_id' });
  Wishlist.belongsTo(models.Batch, { foreignKey: 'batch_id' });
};

module.exports = Wishlist;
