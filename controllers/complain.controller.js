const db = require("../helper/db");
const admin = require('../data/config/firebase_admin/index');

const sendWebPushNotification = async (registrationTokens, notificationData) => {
  try {
    const message = {
      tokens: registrationTokens,
      webpush: {
        notification: {
          title: notificationData.title,
          body: notificationData.body,
          data: {
            message: notificationData.message,
            email: notificationData.email
          }
        },
      },
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};


const complains = async (req, res) => {
  try {
    const { name, email, subject, message, token } = req.body;

    let registrationTokens = [];
    if (Array.isArray(token)) {
      registrationTokens = token;
    } else {
      registrationTokens.push(token);
    }

    if (registrationTokens.length === 0) {
      return res.status(400).json({ error: 'No valid FCM tokens provided' });
    }

    await db.query('INSERT INTO complains (name, email, subject, message) VALUES (?, ?, ?, ?)', [name, email, subject, message]);

    const notificationData = {
      title: 'New Complaint Received',
      body: `Subject: ${subject}\nFrom: ${name}\nMessage: ${message}`
    };

    await sendWebPushNotification(registrationTokens, notificationData);

    return res.status(200).json({ message: 'Complaint sent successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



  module.exports = {
    complains
  }