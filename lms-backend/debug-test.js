const { Batch, LiveSession, User } = require('./models');
const { Op } = require('sequelize');

// Test student ID 8 which is in batch 4
const studentId = 8;
const now = new Date();

async function test() {
  try {
    console.log('\n=== DEBUGGING LIVESESSION QUERY ===\n');
    console.log('Current time:', now.toISOString());
    console.log('Student ID:', studentId);

    // Get student batches
    const batches = await Batch.findAll({
      where: {
        students: {
          [Op.like]: `%"student":${studentId}%`
        }
      }
    });

    console.log('\n✅ Batches found:', batches.length);
    const studentBatchIds = batches.map(b => b.id);
    console.log('Batch IDs:', studentBatchIds);

    // Check all sessions
    const allSessions = await LiveSession.findAll();
    console.log('\n🔍 All LiveSessions:', allSessions.length);
    allSessions.forEach(s => {
      console.log(`  - ID: ${s.id}, Batch: ${s.batchId}, Title: ${s.title}, Start: ${s.startTime}, Status: ${s.status}`);
    });

    // Check sessions in student batches (without time filter)
    const sessionsByBatch = await LiveSession.findAll({
      where: {
        batchId: { [Op.in]: studentBatchIds }
      }
    });
    console.log('\n📍 Sessions in student batches:', sessionsByBatch.length);
    sessionsByBatch.forEach(s => {
      console.log(`  - ID: ${s.id}, Batch: ${s.batchId}, Start: ${s.startTime}, Status: ${s.status}`);
    });

    // Check upcoming sessions (with time filter)
    const upcomingSessions = await LiveSession.findAll({
      where: {
        batchId: { [Op.in]: studentBatchIds },
        startTime: { [Op.gt]: now },
        status: { [Op.in]: ['scheduled', 'live'] }
      },
      include: [
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'name']
        }
      ]
    });
    console.log('\n✅ Upcoming sessions:', upcomingSessions.length);
    upcomingSessions.forEach(s => {
      console.log(`  - ID: ${s.id}, Title: ${s.title}, Batch: ${s.batchId}, Start: ${s.startTime}`);
      console.log(`    Minutes until start: ${(new Date(s.startTime) - now) / 60000}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

test();
