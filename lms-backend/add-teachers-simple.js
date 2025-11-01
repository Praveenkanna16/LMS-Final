const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.sqlite');

async function addTeachers() {
  const password = await bcrypt.hash('password123', 10);
  
  const teachers = [
    { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@genzed.com', totalEarnings: 125000, pendingEarnings: 15000 },
    { name: 'Prof. Priya Sharma', email: 'priya.sharma@genzed.com', totalEarnings: 98000, pendingEarnings: 12000 },
    { name: 'Mr. Amit Patel', email: 'amit.patel@genzed.com', totalEarnings: 156000, pendingEarnings: 18000 },
    { name: 'Ms. Sneha Reddy', email: 'sneha.reddy@genzed.com', totalEarnings: 89000, pendingEarnings: 10000 },
    { name: 'Dr. Vikram Singh', email: 'vikram.singh@genzed.com', totalEarnings: 210000, pendingEarnings: 25000 }
  ];

  db.serialize(() => {
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO Users 
      (name, email, password, role, status, isActive, approvalStatus, commissionRate, maxStudentsPerBatch, totalEarnings, pendingEarnings, availableForPayout, created_at, updated_at)
      VALUES (?, ?, ?, 'teacher', 'active', 1, 'approved', ?, 50, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    teachers.forEach((teacher, index) => {
      const commissionRate = [60, 65, 55, 60, 70][index];
      insertUser.run(
        teacher.name,
        teacher.email,
        password,
        commissionRate,
        teacher.totalEarnings,
        teacher.pendingEarnings,
        teacher.pendingEarnings
      );
      console.log(`✅ Added teacher: ${teacher.name}`);
    });

    insertUser.finalize();

    // Add bank accounts
    setTimeout(() => {
      db.all('SELECT id, name FROM Users WHERE role = "teacher"', (err, teacherRows) => {
        if (err) {
          console.error('Error fetching teachers:', err);
          return;
        }

        const insertBank = db.prepare(`
          INSERT OR IGNORE INTO teacher_bank_accounts
          (teacher_id, bank_name, account_holder_name, account_number, ifsc_code, branch_name, account_type, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'savings', 'verified', datetime('now'), datetime('now'))
        `);

        const banks = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank'];
        const branches = ['Mumbai Main', 'Delhi Branch', 'Bangalore HSR', 'Pune Wakad', 'Hyderabad Hitech'];

        teacherRows.forEach((teacher, index) => {
          const accountNumber = `5678${Math.floor(1000 + Math.random() * 9000)}${Math.floor(10000 + Math.random() * 90000)}`;
          const ifscCode = `HDFC0${Math.floor(100000 + Math.random() * 900000)}`;
          
          insertBank.run(
            teacher.id,
            banks[index % banks.length],
            teacher.name,
            accountNumber,
            ifscCode,
            branches[index % branches.length]
          );
          console.log(`  💳 Added bank account for ${teacher.name}`);
        });

        insertBank.finalize();

        // Add payment history
        setTimeout(() => {
          const insertPayment = db.prepare(`
            INSERT INTO payments
            (student_id, amount, currency, status, payment_method, payment_gateway, source, notes, paid_at, created_at, updated_at)
            VALUES (?, ?, 'INR', ?, 'bank_transfer', 'cashfree', 'salary', ?, ?, datetime('now'), datetime('now'))
          `);

          teacherRows.forEach((teacher) => {
            const months = ['August', 'September', 'October'];
            months.forEach((month, monthIndex) => {
              const amount = 10000 + Math.floor(Math.random() * 15000);
              const status = monthIndex < 2 ? 'completed' : 'pending';
              const paidAt = status === 'completed' ? `2024-${8 + monthIndex}-28` : null;
              const notes = JSON.stringify({
                month: 8 + monthIndex,
                year: 2024,
                description: `Salary for ${month} 2024`,
                paymentMode: 'bank_transfer',
                teacherName: teacher.name
              });

              insertPayment.run(teacher.id, amount, status, notes, paidAt);
            });
            console.log(`  💰 Added 3 salary payments for ${teacher.name}`);
          });

          insertPayment.finalize();

          console.log('\n✅ All teachers, bank accounts, and payment history added successfully!');
          db.close();
        }, 1000);
      });
    }, 1000);
  });
}

addTeachers().catch(console.error);
