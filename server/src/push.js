import { Expo } from "expo-server-sdk";

const expo = new Expo();

// Sends an Expo push notification. Silently ignores users without a valid
// registered device token (e.g. running in a simulator without push).
export async function sendPush(pushToken, title, body, data = {}) {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) return;
  try {
    const messages = [{ to: pushToken, sound: "default", title, body, data }];
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error("Push send failed:", err.message);
  }
}
