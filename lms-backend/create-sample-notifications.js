const { Notification, User } = require('./models');
const sequelize = require('./config/database');

async function createSampleNotifications() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Create sample notifications
    const sampleNotifications = [
      {
        title: 'Welcome to GenZEd LMS!',
        message: 'Thank you for joining our learning management system. Get started by exploring your dashboard.',
        recipientId: 1,
        senderId: null,
        type: 'system',
        priority: 'medium',
        isRead: false,
        metadata: JSON.stringify({ category: 'welcome' })
      },
      {
        title: 'New Course Available',
        message: 'A new course "Advanced JavaScript" has been added to your learning path.',
        recipientId: 1,
        senderId: null,
        type: 'course',
        priority: 'low',
        isRead: false,
        metadata: JSON.stringify({ courseId: 1, category: 'course_update' })
      },
      {
        title: 'Payment Confirmation',
        message: 'Your payment of ₹999 for the Premium Learning Package has been successfully processed.',
        recipientId: 1,
        senderId: null,
        type: 'payment',
        priority: 'high',
        isRead: true,
        metadata: JSON.stringify({ amount: 999, transactionId: 'TXN123456' })
      },
      {
        title: 'Assignment Due Soon',
        message: 'Your assignment "React Components Project" is due in 2 days. Make sure to submit on time!',
        recipientId: 1,
        senderId: null,
        type: 'assignment_due',
        priority: 'urgent',
        isRead: false,
        metadata: JSON.stringify({ assignmentId: 1, dueDate: '2024-11-01' })
      },
      {
        title: 'System Maintenance',
        message: 'Scheduled maintenance will be performed tonight from 2:00 AM to 4:00 AM. Services may be temporarily unavailable.',
        recipientId: 1,
        senderId: null,
        type: 'system',
        priority: 'medium',
        isRead: false,
        metadata: JSON.stringify({ maintenanceStart: '2024-10-29T02:00:00Z', maintenanceEnd: '2024-10-29T04:00:00Z' })
      }
    ];

    // Create notifications
    for (const notificationData of sampleNotifications) {
      const notification = await Notification.create(notificationData);
      console.log(`Created notification: ${notification.title}`);
    }

    console.log('Sample notifications created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample notifications:', error);
    process.exit(1);
  }
}

createSampleNotifications();
