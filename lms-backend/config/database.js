require('dotenv').config();
const { Sequelize } = require('sequelize');

const config = {
  development: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'genzed_lms_dev.db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    storage: './database/genzed_lms_dev.db',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    dialect: 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME ? `${process.env.DB_NAME}_test.db` : 'genzed_lms_test.db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    storage: './database/genzed_lms_test.db',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env]);

// Disable foreign key constraints for SQLite to avoid sync issues
if (config[env].dialect === 'sqlite') {
  sequelize.query('PRAGMA foreign_keys = OFF;');
}

module.exports = sequelize;
