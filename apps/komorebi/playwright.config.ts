import { defineConfig } from '@playwright/test';

const PORT = 3111;

/** Runs against the static export; build first with `pnpm build`. */
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  // Parallel WebGL pages starve each other in headless Chrome and never finish loading.
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel: 'chrome', viewport: { width: 1280, height: 800 } },
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory out`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
