import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.credpos.app',
  appName: 'CredPOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#0F172A'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com']
    }
  }
};

export default config;
