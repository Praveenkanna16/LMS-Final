const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/genzed_lms_dev.db',
  logging: console.log
});

// Define essential models
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin'),
    defaultValue: 'student'
  }
});

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

const Batch = sequelize.define('Batch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id'
    }
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

// Define associations
User.hasMany(Course, { foreignKey: 'teacherId' });
Course.belongsTo(User, { foreignKey: 'teacherId' });

User.hasMany(Batch, { foreignKey: 'teacherId' });
Batch.belongsTo(User, { foreignKey: 'teacherId' });

Course.hasMany(Batch, { foreignKey: 'courseId' });
Batch.belongsTo(Course, { foreignKey: 'courseId' });

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite connection established successfully.');
    
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully.');
    
    // Create a default admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@genzed.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'admin'
    });
    console.log('✅ Default admin user created.');
    
    await sequelize.close();
    console.log('✅ Database initialization completed.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

initDatabase();
