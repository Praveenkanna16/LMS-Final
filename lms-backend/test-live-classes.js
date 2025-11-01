const { LiveSession, User, Batch, Course } = require('./models');
const sequelize = require('./config/database');

async function testLiveClasses() {
  try {
    console.log('🔍 Testing Live Classes API...\n');

    // Test 1: Check if we can fetch live sessions
    console.log('1. Checking existing live sessions...');
    const existingSessions = await LiveSession.findAll({
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'name']
        }
      ]
    });
    console.log(`Found ${existingSessions.length} existing live sessions`);

    // Test 2: Check if we have any batches and teachers for creating sessions
    console.log('\n2. Checking available batches and teachers...');
    const batches = await Batch.findAll({
      limit: 5,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    console.log(`Found ${batches.length} batches`);

    const teachers = await User.findAll({
      where: { role: 'teacher' },
      limit: 5,
      attributes: ['id', 'name', 'email']
    });
    console.log(`Found ${teachers.length} teachers`);

    // Test 3: Create a sample live session if we have data
    if (batches.length > 0 && teachers.length > 0) {
      console.log('\n3. Creating a sample live session...');
      
      const sampleSession = await LiveSession.create({
        batchId: batches[0].id,
        teacherId: teachers[0].id,
        title: 'Sample Live Class',
        description: 'This is a test live class session',
        meetingId: `test_${Date.now()}`,
        zoomLink: `https://zoom.us/j/test_${Date.now()}`,
        startTime: new Date(),
        duration: 60,
        status: 'scheduled',
        isRecorded: false
      });
      
      console.log('✅ Sample session created:', {
        id: sampleSession.id,
        title: sampleSession.title,
        batch: batches[0].name,
        teacher: teachers[0].name
      });

      // Test 4: Fetch the session with associations
      console.log('\n4. Fetching session with associations...');
      const sessionWithDetails = await LiveSession.findByPk(sampleSession.id, {
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Batch,
            as: 'batch',
            attributes: ['id', 'name']
          }
        ]
      });
      
      console.log('✅ Session with details:', JSON.stringify(sessionWithDetails, null, 2));
    } else {
      console.log('\n❌ Cannot create sample session - missing batches or teachers');
      
      // Let's create a minimal batch and teacher for testing
      console.log('\n3. Creating minimal test data...');
      
      // Create a test teacher
      const testTeacher = await User.create({
        name: 'Test Teacher',
        email: 'test.teacher@example.com',
        password: 'hashedpassword',
        role: 'teacher',
        isEmailVerified: true
      });
      
      // Create a test course
      const testCourse = await Course.create({
        title: 'Test Course',
        description: 'A test course for live classes',
        teacherId: testTeacher.id,
        price: 1000,
        status: 'published'
      });
      
      // Create a test batch
      const testBatch = await Batch.create({
        name: 'Test Batch',
        courseId: testCourse.id,
        teacherId: testTeacher.id,
        maxStudents: 20,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active'
      });
      
      // Now create a live session
      const sampleSession = await LiveSession.create({
        batchId: testBatch.id,
        teacherId: testTeacher.id,
        title: 'Test Live Class',
        description: 'This is a test live class session',
        meetingId: `test_${Date.now()}`,
        zoomLink: `https://zoom.us/j/test_${Date.now()}`,
        startTime: new Date(),
        duration: 60,
        status: 'scheduled',
        isRecorded: false
      });
      
      console.log('✅ Test data created successfully!');
      console.log('✅ Sample session created:', {
        id: sampleSession.id,
        title: sampleSession.title,
        batchName: testBatch.name,
        teacherName: testTeacher.name
      });
    }

    console.log('\n🎉 Live Classes test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing live classes:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testLiveClasses();
