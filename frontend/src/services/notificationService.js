import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotifications = async () => {
  let token;
  
  // Check if device is physical (not simulator/emulator)
  if (Constants.isDevice) {
    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If no permission, request it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // If still no permission, return
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      // Get push token
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'unknown',
      })).data;
    } catch (error) {
      console.error('Error getting push token:', error);
      // Continue without push token
      return;
    }
    
    // Save token to storage
    await AsyncStorage.setItem('pushToken', token);
    
    // Send token to server
    try {
      await api.post('/auth/push-token', { token });
    } catch (error) {
      console.error('Error sending push token to server:', error);
    }
  } else {
    console.log('Must use physical device for push notifications');
  }

  // Set notification channel for Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }

  return token;
};

// Send local notification
export const sendLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Send immediately
  });
};

// Add notification listener
export const addNotificationListener = (callback) => {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return subscription;
};

// Add notification response listener
export const addNotificationResponseListener = (callback) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return subscription;
};

// Remove notification listener
export const removeNotificationListener = (subscription) => {
  if (subscription) {
    Notifications.removeNotificationSubscription(subscription);
  }
};

// Get notification badge count
export const getNotificationBadgeCount = async () => {
  try {
    const count = await AsyncStorage.getItem('notificationCount');
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting notification count:', error);
    return 0;
  }
};

// Set notification badge count
export const setNotificationBadgeCount = async (count) => {
  try {
    await AsyncStorage.setItem('notificationCount', count.toString());
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting notification count:', error);
  }
};

// Increment notification badge count
export const incrementNotificationBadgeCount = async () => {
  try {
    const count = await getNotificationBadgeCount();
    await setNotificationBadgeCount(count + 1);
  } catch (error) {
    console.error('Error incrementing notification count:', error);
  }
};

// Reset notification badge count
export const resetNotificationBadgeCount = async () => {
  try {
    await setNotificationBadgeCount(0);
  } catch (error) {
    console.error('Error resetting notification count:', error);
  }
};

// Handle notification
export const handleNotification = async (notification) => {
  // Extract notification data
  const { title, body, data } = notification.request.content;
  
  // Log notification
  console.log('Notification received:', { title, body, data });
  
  // Increment badge count
  await incrementNotificationBadgeCount();
  
  // In a real app, you would handle different types of notifications here
  // For example, navigate to a specific screen based on the notification type
  
  return { title, body, data };
};

export default {
  registerForPushNotifications,
  sendLocalNotification,
  addNotificationListener,
  addNotificationResponseListener,
  removeNotificationListener,
  getNotificationBadgeCount,
  setNotificationBadgeCount,
  incrementNotificationBadgeCount,
  resetNotificationBadgeCount,
  handleNotification,
};
