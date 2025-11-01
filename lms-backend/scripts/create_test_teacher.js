const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

async function run() {
  await sequelize.authenticate();
  console.log('DB connected');

  const passwordHash = await bcrypt.hash('password123', 10);

  const [user, created] = await User.findOrCreate({
    where: { email: 'teacher@test.com' },
    defaults: {
      name: 'Test Teacher',
      email: 'teacher@test.com',
      password: passwordHash,
      role: 'teacher',
      isActive: true,
      availableForPayout: 5000
    }
  });

  console.log('User id:', user.id, 'created:', created);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
