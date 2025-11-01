const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class LearningPath extends Model {
  async updateProgress(moduleIndex, progressData) {
    const modules = Array.isArray(this.modules) ? this.modules : [];
    const module = modules[moduleIndex - 1];

    if (!module) {
      throw new Error('Module not found');
    }

    if (progressData.isCompleted !== undefined) {
      module.isCompleted = progressData.isCompleted;
      module.completedAt = progressData.isCompleted ? new Date() : null;
    }

    if (progressData.score !== undefined) {
      module.score = progressData.score;
    }

    if (progressData.timeSpent !== undefined) {
      module.timeSpent = progressData.timeSpent;
    }

    if (progressData.attempts !== undefined) {
      module.attempts = progressData.attempts;
    }

    this.modules = modules;
    this.progress = {
      ...this.progress,
      completedModules: modules.filter(m => m.isCompleted).length,
      timeSpent: modules.reduce((sum, m) => sum + (m.timeSpent || 0), 0),
      currentModule: modules.findIndex(m => !m.isCompleted) + 1,
      lastAccessed: new Date()
    };

    await this.save();
    return this;
  }

  async addRecommendation(recommendation) {
    const recommendations = Array.isArray(this.recommendations) ? this.recommendations : [];
    recommendations.push({
      ...recommendation,
      createdAt: new Date()
    });

    if (recommendations.length > 10) {
      this.recommendations = recommendations.slice(-10);
    } else {
      this.recommendations = recommendations;
    }

    await this.save();
    return this;
  }

  async calculateAnalytics() {
    const modules = Array.isArray(this.modules) ? this.modules : [];
    
    this.analytics = {
      ...this.analytics,
      strugglingTopics: modules.filter(m => m.score && m.score < 70).map(m => m.title),
      masteredTopics: modules.filter(m => m.score && m.score >= 90).map(m => m.title),
      improvementAreas: modules.filter(m => m.attempts > 2 && (!m.score || m.score < 80)).map(m => m.title)
    };

    await this.save();
    return this;
  }
}

LearningPath.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 500]
    }
  },
  slug: {
    type: DataTypes.STRING,
    unique: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: false
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  modules: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isValidModules(value) {
        if (!Array.isArray(value)) {
          throw new Error('Modules must be an array');
        }
        value.forEach((module, index) => {
          if (!module.title || typeof module.title !== 'string' || module.title.length > 100) {
            throw new Error(`Invalid title for module at index ${index}`);
          }
          if (module.description && typeof module.description !== 'string' || module.description?.length > 300) {
            throw new Error(`Invalid description for module at index ${index}`);
          }
          if (!module.order || typeof module.order !== 'number' || module.order < 1) {
            throw new Error(`Invalid order for module at index ${index}`);
          }
          if (!module.type || !['video', 'quiz', 'assignment', 'reading', 'interactive', 'practice'].includes(module.type)) {
            throw new Error(`Invalid type for module at index ${index}`);
          }
        });
      }
    }
  },

  progress: {
    type: DataTypes.JSON,
    defaultValue: {
      completedModules: 0,
      totalModules: 0,
      currentModule: 1,
      timeSpent: 0,
      lastAccessed: null,
      startedAt: null,
      completionRate: 0
    }
  },
  personalization: {
    type: DataTypes.JSON,
    defaultValue: {
      learningStyle: 'visual',
      pace: 'medium',
      strengths: [],
      weaknesses: [],
      preferences: {
        preferredTime: null,
        sessionLength: 45,
        difficultyAdjustment: 0
      }
    }
  },
  recommendations: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  certificate: {
    type: DataTypes.JSON,
    defaultValue: {
      issued: false,
      issuedAt: null,
      certificateId: null,
      grade: null
    }
  },
  analytics: {
    type: DataTypes.JSON,
    defaultValue: {
      totalTimeSpent: 0,
      averageSessionTime: 0,
      peakPerformanceTime: null,
      strugglingTopics: [],
      masteredTopics: [],
      improvementAreas: []
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'abandoned'),
    defaultValue: 'active'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'LearningPath',
  tableName: 'learning_paths',
  timestamps: true,
  indexes: [
    { fields: ['studentId'] },
    { fields: ['courseId'] },
    { fields: ['difficulty'] },
    { fields: ['status'] },
    { fields: ['slug'], unique: true }
  ],
  hooks: {
    beforeSave: (instance) => {
      const modules = Array.isArray(instance.modules) ? instance.modules : [];
      
      // Calculate total and completed modules
      const totalModules = modules.length;
      const completedModules = modules.filter(m => m.isCompleted).length;
      
      // Update progress
      instance.progress = {
        ...instance.progress,
        totalModules,
        completedModules,
        completionRate: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
        timeSpent: modules.reduce((sum, m) => sum + (m.timeSpent || 0), 0),
        lastAccessed: new Date(),
        startedAt: instance.progress?.startedAt || new Date()
      };

      // Set completion status
      if (instance.progress.completionRate === 100 && !instance.isCompleted) {
        instance.isCompleted = true;
        instance.completedAt = new Date();
      }

      // Generate slug if title changed and no slug exists
      if (instance.changed('title') && !instance.slug) {
        const slug = instance.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
        instance.slug = `${slug}-${instance.studentId.toString().slice(-6)}`;
      }
    }
  }
});

module.exports = LearningPath;
