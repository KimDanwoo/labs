import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: process.env.CI ? 180_000 : 90_000,
  expect: { timeout: process.env.CI ? 45_000 : 20_000 },
  workers: 1,
  maxFailures: 1,
  use: {
    baseURL: 'http://127.0.0.1:3123',
    channel: process.env.CI ? undefined : 'chrome',
    viewport: process.env.CI ? { width: 960, height: 640 } : { width: 1440, height: 960 },
    launchOptions: {
      // GPU 없는 CI에서도 로컬 앱의 실제 WebGL 출력을 검증한다.
      args: process.env.CI ? ['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'] : [],
    },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm start --hostname 127.0.0.1 --port 3123',
    url: 'http://127.0.0.1:3123',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
