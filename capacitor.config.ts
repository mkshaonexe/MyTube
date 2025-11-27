import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'my.tube.com',
  appName: 'MyTube',
  webDir: 'dist',
  android: {
    backgroundColor: '#0f0f0f',
    allowMixedContent: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
