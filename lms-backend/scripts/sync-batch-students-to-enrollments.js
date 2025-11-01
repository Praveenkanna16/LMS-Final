const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../models');

(async () => {
  try {
    const { Batch, BatchEnrollment, sequelize } = db;

    const batches = await Batch.findAll({
      where: {},
      attributes: ['id', 'name', 'students']
    });

    let created = 0;
    for (const batch of batches) {
      const studentsJson = batch.students || '[]';
      let students = [];
      try { students = JSON.parse(studentsJson); } catch (e) { students = []; }
      for (const s of students) {
        const studentId = s.student || s.id || s;
        if (!studentId) continue; // skip malformed entries

        const exists = await BatchEnrollment.findOne({ where: { batchId: batch.id, studentId } });
        if (!exists) {
          try {
            await BatchEnrollment.create({ batchId: batch.id, studentId, status: s.status || 'active', enrolledAt: s.enrolledAt || new Date() });
            created++;
          } catch (err) {
            // If unique constraint or other DB error, log and continue
            console.warn(`Failed to create enrollment for batch ${batch.id} student ${studentId}:`, err.message);
            continue;
          }
        }
      }
    }

    console.log(`Sync complete. Enrollments created: ${created}`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
})();
