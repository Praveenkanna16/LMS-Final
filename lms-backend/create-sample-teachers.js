require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Course, Batch, Payment, TeacherBankAccount } = require('./models');

async function createSampleTeachers() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    const password = await bcrypt.hash('password123', 10);

    // Create 5 sample teachers with realistic data
    const teachers = [
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@genzed.com',
        phone: '9876543210',
        role: 'teacher',
        status: 'active',
        isActive: true,
        approvalStatus: 'approved',
        commissionRate: 60,
        maxStudentsPerBatch: 50,
        totalEarnings: 125000,
        pendingEarnings: 15000,
        availableForPayout: 15000
      },
      {
        name: 'Prof. Priya Sharma',
        email: 'priya.sharma@genzed.com',
        phone: '9876543211',
        role: 'teacher',
        status: 'active',
        isActive: true,
        approvalStatus: 'approved',
        commissionRate: 65,
        maxStudentsPerBatch: 45,
        totalEarnings: 98000,
        pendingEarnings: 12000,
        availableForPayout: 12000
      },
      {
        name: 'Mr. Amit Patel',
        email: 'amit.patel@genzed.com',
        phone: '9876543212',
        role: 'teacher',
        status: 'active',
        isActive: true,
        approvalStatus: 'approved',
        commissionRate: 55,
        maxStudentsPerBatch: 60,
        totalEarnings: 156000,
        pendingEarnings: 18000,
        availableForPayout: 18000
      },
      {
        name: 'Ms. Sneha Reddy',
        email: 'sneha.reddy@genzed.com',
        phone: '9876543213',
        role: 'teacher',
        status: 'active',
        isActive: true,
        approvalStatus: 'approved',
        commissionRate: 60,
        maxStudentsPerBatch: 40,
        totalEarnings: 89000,
        pendingEarnings: 10000,
        availableForPayout: 10000
      },
      {
        name: 'Dr. Vikram Singh',
        email: 'vikram.singh@genzed.com',
        phone: '9876543214',
        role: 'teacher',
        status: 'active',
        isActive: true,
        approvalStatus: 'approved',
        commissionRate: 70,
        maxStudentsPerBatch: 35,
        totalEarnings: 210000,
        pendingEarnings: 25000,
        availableForPayout: 25000
      }
    ];

    const createdTeachers = [];
    
    for (const teacherData of teachers) {
      const [teacher, created] = await User.findOrCreate({
        where: { email: teacherData.email },
        defaults: { ...teacherData, password }
      });
      
      createdTeachers.push(teacher);
      console.log(created ? `✅ Created teacher: ${teacher.name}` : `⏩ Teacher already exists: ${teacher.name}`);

      // Create bank account for each teacher
      const [bankAccount, bankCreated] = await TeacherBankAccount.findOrCreate({
        where: { teacher_id: teacher.id },
        defaults: {
          teacher_id: teacher.id,
          account_number: `5678${Math.floor(1000 + Math.random() * 9000)}${Math.floor(10000 + Math.random() * 90000)}`,
          ifsc_code: `HDFC0${Math.floor(100000 + Math.random() * 900000)}`,
          account_holder_name: teacher.name,
          bank_name: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank'][Math.floor(Math.random() * 5)],
          branch_name: ['Mumbai Main', 'Delhi Branch', 'Bangalore HSR', 'Pune Wakad', 'Hyderabad Hitech'][Math.floor(Math.random() * 5)],
          account_type: 'savings',
          status: 'verified'
        }
      });

      if (bankCreated) {
        console.log(`  💳 Added bank account for ${teacher.name}`);
      }

      // Create payment history (salary payments)
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'];
      const numPayments = 3 + Math.floor(Math.random() * 3); // 3-5 payments

      for (let i = 0; i < numPayments; i++) {
        const monthIndex = months.length - numPayments + i;
        const month = months[monthIndex];
        const amount = 10000 + Math.floor(Math.random() * 15000);
        
        const [payment, paymentCreated] = await Payment.findOrCreate({
          where: {
            userId: teacher.id,
            paymentType: 'salary',
            metadata: {
              [sequelize.Sequelize.Op.like]: `%"month":"${monthIndex + 1}"%"year":"2024"%`
            }
          },
          defaults: {
            userId: teacher.id,
            amount: amount,
            currency: 'INR',
            status: i < numPayments - 1 ? 'completed' : 'pending', // Last payment is pending
            paymentType: 'salary',
            paymentGateway: 'cashfree',
            orderId: `SALARY_${teacher.id}_${Date.now()}_${i}`,
            transactionId: i < numPayments - 1 ? `TXN_${Date.now()}_${i}` : null,
            paidAt: i < numPayments - 1 ? new Date(2024, monthIndex, 28) : null,
            metadata: JSON.stringify({
              month: monthIndex + 1,
              year: 2024,
              description: `Salary for ${month} 2024`,
              paymentMode: 'bank_transfer',
              teacherName: teacher.name,
              teacherEmail: teacher.email
            })
          }
        });

        if (paymentCreated) {
          console.log(`  💰 Created ${payment.status} payment: ₹${amount} for ${month} 2024`);
        }
      }
    }

    console.log('\n✅ Sample teachers, courses, batches, and payment history created successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Teachers: ${createdTeachers.length}`);
    console.log(`   Default password for all teachers: password123`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample teachers:', error);
    process.exit(1);
  }
}

createSampleTeachers();
