import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Expense Tracker',
  slug: 'expense-tracker',
  scheme: 'expensetracker',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: ['expo-router', 'expo-secure-store'],
  android: {
    package: 'com.zaki1993.expensetracker',
  },
  extra: {
    googleOAuth: {
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
    },
  },
};

export default config;
