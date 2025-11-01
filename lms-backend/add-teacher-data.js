const { sequelize, User, Payment, TeacherBankAccount } = require('./models');
const bcrypt = require('bcryptjs');

async function addTeachersQuick() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const password = await bcrypt.hash('password123', 10);

    // Check if we have any teachers
    const existingTeachers = await User.findAll({ where: { role: 'teacher' } });
    console.log(`Found ${existingTeachers.length} existing teachers`);

    if (existingTeachers.length >= 5) {
      console.log('Already have 5+ teachers. Adding payment data...');
      
      for (const teacher of existingTeachers.slice(0, 5)) {
        // Add bank account
        const [bankAccount] = await TeacherBankAccount.findOrCreate({
          where: { teacher_id: teacher.id },
          defaults: {
            teacher_id: teacher.id,
            bank_name: 'HDFC Bank',
            account_holder_name: teacher.name,
            account_number: `5678${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            ifsc_code: `HDFC0${Math.floor(100000 + Math.random() * 900000)}`,
            branch_name: 'Mumbai Main',
            account_type: 'savings',
            status: 'verified'
          }
        });
        console.log(`  💳 Bank account for ${teacher.name}`);

        // Add 3 salary payments
        for (let i = 0; i < 3; i++) {
          const month = 8 + i; // Aug, Sept, Oct
          const amount = 10000 + Math.floor(Math.random() * 15000);
          const status = i < 2 ? 'completed' : 'pending';
          
          const [payment] = await Payment.findOrCreate({
            where: {
              student_id: teacher.id,
              source: 'teacher',
              notes: { [sequelize.Sequelize.Op.like]: `%"month":${month}%"year":2024%"isSalary":true%` }
            },
            defaults: {
              studentId: teacher.id,
              teacherId: teacher.id,
              batchId: 1, // Dummy batch ID
              courseId: 1, // Dummy course ID
              amount: amount,
              originalAmount: amount,
              currency: 'INR',
              status: status === 'completed' ? 'paid' : 'created',
              paymentMethod: 'upi',
              paymentGateway: 'cashfree',
              source: 'teacher',
              commissionRate: 0,
              platformFee: 0,
              teacherEarnings: amount,
              notes: JSON.stringify({
                month: month,
                year: 2024,
                description: `Salary for ${['August', 'September', 'October'][i]} 2024`,
                paymentMode: 'bank_transfer',
                teacherName: teacher.name,
                isSalary: true
              }),
              paidAt: status === 'completed' ? new Date(2024, month - 1, 28) : null,
              cashfreeOrderId: `SALARY_${teacher.id}_${Date.now()}_${i}`
            }
          });
          console.log(`  💰 ${status} payment: ₹${amount} for month ${month}`);
        }
      }
    }

    console.log('\n✅ Done! Teachers have bank accounts and payment history');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTeachersQuick();
