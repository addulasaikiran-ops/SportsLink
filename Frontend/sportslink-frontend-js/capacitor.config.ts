import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sportslink.app',
  appName: 'SPORTSLINK',
  webDir: 'public',
  server: {
    // Connected APK: the app loads the existing production website.
    url: 'https://sportslink.up.railway.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
