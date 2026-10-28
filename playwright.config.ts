import { defineConfig, devices } from '@playwright/test';

const baseUrl = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // A failure on the first attempt is the signal; retries can hide it.
  workers: 3, // Balance stability and throughput, as in the reference repos.
  reporter: 'html',
  use: {
    baseURL: baseUrl,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm exec astro build && pnpm exec astro preview --host 127.0.0.1 --port 3000',
    // Keep Astro's agent auto-backgrounding off so Playwright can supervise it.
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
    url: baseUrl,
    // Always start our preview; never reuse an unrelated Astro dev server.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
