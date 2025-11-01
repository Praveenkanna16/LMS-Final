const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id' // Map to actual database column
  },
  sessionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'session_id' // Map to actual database column
  },
  items: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'total_amount' // Map to actual database column
  },
  promoCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'promo_code' // Map to actual database column
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'discount_amount' // Map to actual database column
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'final_amount' // Map to actual database column
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'course_id' // Map to actual database column
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'batch_id' // Map to actual database column
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'], unique: true },
    { fields: ['session_id'] },
    { fields: ['course_id'] },
    { fields: ['batch_id'] }
  ]
});

// Hooks
Cart.beforeUpdate(async (cart) => {
  cart.lastActivity = new Date();
});

// Static methods
Cart.getCartByUser = async function(userId) {
  return await this.findOne({ where: { userId } });
};

Cart.getActiveCarts = async function(limit = 20) {
  return await this.findAll({
    where: { status: 'active' },
    order: [['lastActivity', 'DESC']],
    limit
  });
};

// Instance methods
Cart.prototype.addItem = async function(itemData) {
  try {
    const items = JSON.parse(this.items || '[]');

    // Check if item already exists
    const existingItemIndex = items.findIndex(item =>
      (itemData.courseId && item.courseId === itemData.courseId) ||
      (itemData.batchId && item.batchId === itemData.batchId)
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      items[existingItemIndex].quantity = (items[existingItemIndex].quantity || 1) + (itemData.quantity || 1);
    } else {
      // Add new item
      const newItem = {
        id: Date.now().toString(),
        courseId: itemData.courseId,
        batchId: itemData.batchId,
        type: itemData.type,
        title: itemData.title,
        price: itemData.price,
        originalPrice: itemData.originalPrice,
        discount: itemData.discount || 0,
        thumbnail: itemData.thumbnail,
        teacherId: itemData.teacherId,
        teacherName: itemData.teacherName,
        quantity: itemData.quantity || 1,
        addedAt: new Date().toISOString()
      };

      if (itemData.batchDetails) {
        newItem.batchDetails = itemData.batchDetails;
      }

      items.push(newItem);
    }

    this.items = JSON.stringify(items);
    await this.save();
    await this.calculateSummary();

    return this;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
};

Cart.prototype.removeItem = async function(itemId) {
  try {
    const items = JSON.parse(this.items || '[]');
    this.items = JSON.stringify(items.filter(item => item.id !== itemId));
    await this.save();
    await this.calculateSummary();

    return this;
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw error;
  }
};

Cart.prototype.updateQuantity = async function(itemId, quantity) {
  try {
    const items = JSON.parse(this.items || '[]');
    const item = items.find(item => item.id === itemId);

    if (item) {
      item.quantity = Math.max(1, quantity);
      this.items = JSON.stringify(items);
      await this.save();
      await this.calculateSummary();
    }

    return this;
  } catch (error) {
    console.error('Error updating item quantity:', error);
    throw error;
  }
};

Cart.prototype.applyPromoCode = async function(promoCode) {
  try {
    // Simplified promo code logic
    if (promoCode.code === 'WELCOME10') {
      this.promoCode = JSON.stringify({
        code: promoCode.code,
        discountType: 'percentage',
        discountValue: 10,
        appliedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    } else if (promoCode.code === 'SAVE50') {
      this.promoCode = JSON.stringify({
        code: promoCode.code,
        discountType: 'fixed',
        discountValue: 50,
        appliedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    await this.save();
    await this.calculateSummary();

    return this;
  } catch (error) {
    console.error('Error applying promo code:', error);
    throw error;
  }
};

Cart.prototype.calculateSummary = async function() {
  try {
    const items = JSON.parse(this.items || '[]');
    const promoCode = JSON.parse(this.promoCode || '{}');

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const savings = items.reduce((sum, item) => {
      const itemSavings = item.originalPrice && item.originalPrice > item.price
        ? (item.originalPrice - item.price) * item.quantity
        : 0;
      return sum + itemSavings;
    }, 0);

    let discount = 0;
    if (promoCode.code) {
      if (promoCode.discountType === 'percentage') {
        discount = subtotal * (promoCode.discountValue / 100);
      } else {
        discount = Math.min(promoCode.discountValue, subtotal);
      }
    }

    const taxes = (subtotal - discount) * 0.18; // 18% GST
    const total = subtotal - discount + taxes;

    this.summary = JSON.stringify({
      subtotal,
      discount,
      taxes,
      total,
      itemCount,
      savings
    });

    await this.save();
  } catch (error) {
    console.error('Error calculating cart summary:', error);
  }
};

Cart.prototype.clearCart = async function() {
  this.items = '[]';
  this.promoCode = '{}';
  this.summary = '{"subtotal":0,"discount":0,"taxes":0,"total":0,"itemCount":0,"savings":0}';
  await this.save();
  return this;
};

Cart.prototype.markAsConverted = async function() {
  this.status = 'converted';
  await this.save();
  return this;
};

Cart.prototype.markAsAbandoned = async function() {
  this.status = 'abandoned';
  await this.save();
  return this;
};

// Associations
Cart.associate = (models) => {
  Cart.belongsTo(models.User, { foreignKey: 'userId' });
  Cart.belongsTo(models.Course, { foreignKey: 'courseId' });
  Cart.belongsTo(models.Batch, { foreignKey: 'batchId' });
};

module.exports = Cart;
