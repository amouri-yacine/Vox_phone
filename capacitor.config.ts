import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yacine.voxphone',
  appName: 'VoxPhone',
  webDir: 'dist', // laisse comme ça (pas important ici)
  server: {
    url: 'http://192.168.100.28:3001',
    cleartext: true
}
}

export default config;
