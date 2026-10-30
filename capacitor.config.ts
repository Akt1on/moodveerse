import type { CapacitorConfig } from '@capacitor/cli';

// Live-reload from the Lovable preview only when CAP_LIVE_RELOAD=1;
// release/CI builds bundle the local dist files.
const live = process.env.CAP_LIVE_RELOAD === '1';

const config: CapacitorConfig = {
  appId: 'app.lovable.p8423d7f5f0374de8950b60682d818a04',
  appName: 'MoodVerse',
  webDir: 'dist',
  ...(live
    ? {
        server: {
          url: 'https://8423d7f5-f037-4de8-950b-60682d818a04.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }
    : {}),
};

export default config;
