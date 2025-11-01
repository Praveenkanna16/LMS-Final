const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeacherBankAccount = sequelize.define('TeacherBankAccount', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'teacher_id',
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    teacherId: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('teacher_id');
      },
      set(value) {
        this.setDataValue('teacher_id', value);
      }
    },
    bank_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'bank_name'
    },
    bankName: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('bank_name');
      },
      set(value) {
        this.setDataValue('bank_name', value);
      }
    },
    account_holder_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'account_holder_name'
    },
    accountHolderName: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('account_holder_name');
      },
      set(value) {
        this.setDataValue('account_holder_name', value);
      }
    },
    account_number: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'account_number'
    },
    accountNumber: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('account_number');
      },
      set(value) {
        this.setDataValue('account_number', value);
      }
    },
    ifsc_code: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'ifsc_code'
    },
    ifscCode: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('ifsc_code');
      },
      set(value) {
        this.setDataValue('ifsc_code', value);
      }
    },
    branch_name: {
      type: DataTypes.STRING,
      field: 'branch_name'
    },
    branchName: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('branch_name');
      },
      set(value) {
        this.setDataValue('branch_name', value);
      }
    },
    account_type: {
      type: DataTypes.STRING,
      defaultValue: 'savings',
      field: 'account_type'
    },
    accountType: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('account_type');
      },
      set(value) {
        this.setDataValue('account_type', value);
      }
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_default'
    },
    isDefault: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('is_default');
      },
      set(value) {
        this.setDataValue('is_default', value);
      }
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'verified', 'rejected']]
      }
    },
    verification_details: {
      type: DataTypes.TEXT,
      field: 'verification_details',
      get() {
        const rawValue = this.getDataValue('verification_details');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('verification_details', value ? JSON.stringify(value) : null);
      }
    },
    verificationDetails: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('verification_details');
      },
      set(value) {
        this.setDataValue('verification_details', value);
      }
    },
    created_at: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('created_at');
      }
    },
    updated_at: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('updated_at');
      }
    }
  }, {
    tableName: 'teacher_bank_accounts',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['teacher_id', 'account_number']
      }
    ]
  });

module.exports = TeacherBankAccount;
