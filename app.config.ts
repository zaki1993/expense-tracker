import type { ExpoConfig } from 'expo/config';

const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const googleRedirectScheme = androidClientId
  ? `com.googleusercontent.apps.${androidClientId.split('.')[0]}`
  : 'expensetracker';

const config: ExpoConfig = {
  name: 'Expense Tracker',
  slug: 'expense-tracker',
  scheme: googleRedirectScheme,
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: ['expo-router', 'expo-secure-store'],
  android: {
    package: 'com.zaki1993.expensetracker',
  },
  extra: {
    googleOAuth: {
      androidClientId,
    },
  },
};

export default config;
