import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mijornada.app',
  appName: 'Mi Turno',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0d0d14',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;