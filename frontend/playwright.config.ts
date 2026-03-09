import { defineConfig, devices } from '@playwright/test'

// This repo doesn't ship TS node typings; declare minimal env shape for config usage.
const env = (globalThis.process?.env ?? {}) as Record<string, string | undefined>

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!env.CI,
  retries: env.CI ? 2 : 0,
  workers: env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      // Use local Chrome to avoid environment-specific browser download paths.
      use: { ...devices['Desktop Chrome'], channel: env.PLAYWRIGHT_CHANNEL || 'chrome' }
    }
  ]
})

