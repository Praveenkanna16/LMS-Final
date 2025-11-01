require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Ensure schema exists but do not drop tables
    await sequelize.sync();

    const password = process.env.SEED_ADMIN_PASSWORD || 'password';
    const hashed = await bcrypt.hash(password, 10);

    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@genzed.com' },
      defaults: {
        name: 'Admin User',
        password: hashed,
        role: 'admin'
      }
    });

    console.log(created ? '👤 Admin created' : '👤 Admin already exists');
    console.log(`➡️  Email: admin@genzed.com, Password: ${password}`);

    process.exit(0);
  } catch (e) {
    console.error('❌ Seed failed', e);
    process.exit(1);
  }
}

seed();
