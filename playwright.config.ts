import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ... other global options ...
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://localhost:3000',

    // Populates context with given storage state.
    // storageState: 'auth.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Example for mobile testing
    {
      name: 'android',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
