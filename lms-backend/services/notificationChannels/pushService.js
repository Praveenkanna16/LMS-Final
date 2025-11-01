const admin = require('firebase-admin');
const logger = require('../../config/logger');

class PushNotificationService {
  constructor() {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          })
        });
      }
      this.enabled = true;
    } else {
      this.enabled = false;
      logger.warn('Firebase credentials not found. Push notifications will be disabled.');
    }
  }

  async sendPushNotification(tokens, title, body, data = {}) {
    if (!this.enabled) {
      logger.debug('Push notifications are disabled. Skipping send.');
      return;
    }

    try {
      if (!tokens || tokens.length === 0) {
        return;
      }

      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        },
        tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      logger.info(`Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`);
      
      return response;
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw error;
    }
  }

  async subscribeToTopic(tokens, topic) {
    if (!this.enabled) {
      logger.debug('Push notifications are disabled. Skipping topic subscription.');
      return;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      logger.info(`Subscribed to topic ${topic}: ${response.successCount} successful, ${response.failureCount} failed`);
      return response;
    } catch (error) {
      logger.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens, topic) {
    if (!this.enabled) {
      logger.debug('Push notifications are disabled. Skipping topic unsubscription.');
      return;
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      logger.info(`Unsubscribed from topic ${topic}: ${response.successCount} successful, ${response.failureCount} failed`);
      return response;
    } catch (error) {
      logger.error(`Error unsubscribing from topic ${topic}:`, error);
      throw error;
    }
  }
}

module.exports = new PushNotificationService();
