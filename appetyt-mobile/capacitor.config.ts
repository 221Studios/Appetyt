import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pl.appetyt.app',
  appName: 'Appetyt',
  webDir: 'dist',
  plugins: {
    // Auth uses an HttpOnly cookie on the API's domain. Native HTTP keeps
    // that cookie in the platform cookie store instead of relying on the
    // WebView's third-party-cookie policy.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
