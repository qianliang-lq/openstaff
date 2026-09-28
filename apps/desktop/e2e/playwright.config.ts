import { defineConfig, devices } from '@playwright/test';

// Playwright E2E configuration for @openstaff/desktop
// See https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:1420', // Tauri dev server default
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev:web',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
  },
});
