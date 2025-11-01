const { Model } = require('sequelize');

class Progress extends Model {
  static associate(models) {
    // Progress belongs to a User
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Progress belongs to a Course
    this.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course'
    });

    // Progress belongs to a Batch (optional)
    this.belongsTo(models.Batch, {
      foreignKey: 'batchId',
      as: 'batch'
    });
  }
}

module.exports = Progress;
