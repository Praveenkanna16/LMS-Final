const db = require('./models');
const { Op } = require('sequelize');

async function clearSamplePayments() {
  try {
    console.log('🗑️  Clearing sample/mock payment data...\n');

    // Find all salary payments (created from sample data)
    const salaryPayments = await db.Payment.findAll({
      where: {
        notes: {
          [Op.like]: '%"isSalary":true%'
        }
      }
    });

    console.log(`📊 Found ${salaryPayments.length} salary payment records`);

    if (salaryPayments.length > 0) {
      console.log('\nPayment details:');
      salaryPayments.forEach((payment, index) => {
        const notes = JSON.parse(payment.notes || '{}');
        console.log(`  ${index + 1}. Payment ID: ${payment.id}`);
        console.log(`     Teacher ID: ${payment.student_id}`);
        console.log(`     Amount: ₹${payment.amount}`);
        console.log(`     Status: ${payment.status}`);
        console.log(`     Month/Year: ${notes.month}/${notes.year}`);
        console.log(`     Created: ${payment.created_at}`);
        console.log('');
      });

      // Delete all salary payments
      const deletedCount = await db.Payment.destroy({
        where: {
          notes: {
            [Op.like]: '%"isSalary":true%'
          }
        }
      });

      console.log(`✅ Successfully deleted ${deletedCount} sample payment records\n`);
      console.log('🎯 Now all payments will be created through REAL Cashfree API calls only!\n');
      console.log('📝 Next steps:');
      console.log('   1. Go to Teacher Salary Management page');
      console.log('   2. Click "Pay" button for any teacher');
      console.log('   3. Choose payment mode (Online or Bank Transfer)');
      console.log('   4. Real Cashfree API will be called');
      console.log('   5. For Bank Transfer: Real payout will be initiated');
      console.log('   6. For Online Payment: Real payment link will be generated\n');
    } else {
      console.log('ℹ️  No sample payment records found. Database is clean!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing payments:', error);
    process.exit(1);
  }
}

clearSamplePayments();
