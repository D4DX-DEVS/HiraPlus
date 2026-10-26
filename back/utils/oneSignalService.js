const axios = require('axios');

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * Send push notification to all users
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 */
async function sendPushNotification(title, description) {
    try {
        const response = await axios.post('https://onesignal.com/api/v1/notifications', {
            app_id: ONESIGNAL_APP_ID,
            included_segments: ['All'],
            contents: {
                en: description
            },
            headings: {
                en: title
            },
            priority: 10,
            ttl: 259200, // 3 days
            android_visibility: 1,
            existing_android_channel_id: "default", // Use default channel
            ios_sound: "default",
            android_sound: "default"
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
            }
        });

        console.log('OneSignal notification sent successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending OneSignal notification:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    sendPushNotification
}; 