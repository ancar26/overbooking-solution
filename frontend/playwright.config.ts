import { defineConfig, devices } from '@playwright/test'

// This repo doesn't ship TS node typings; declare minimal env shape for config usage.
const env = (globalThis.process?.env ?? {}) as Record<string, string | undefined>

// This config intentionally describes "one deterministic local app + one deterministic browser".
// Keeping the matrix small is a great default for product E2E suites:
// - faster feedback
// - less flaky CI
// - easier debugging
export default defineConfig({
  // All tests are colocated under e2e/tests to keep boundaries clear:
  // unit/integration tests can live elsewhere without runner confusion.
  testDir: './e2e/tests',
  // Playwright can shard independent test files; each test should create its own state.
  fullyParallel: true,
  forbidOnly: !!env.CI,
  retries: env.CI ? 2 : 0,
  // Lower worker count in CI reduces contention for CPU/network resources.
  workers: env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // Use relative URLs in tests (`page.goto('/bookings')`) and centralize environment switching here.
    baseURL: env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Disable video to avoid ffmpeg dependency issues in sandboxed runs.
    video: 'off'
  },
  webServer: {
    // Starts the SPA before tests and waits until `url` is reachable.
    command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    // Reuse local dev server if already running (better DX when iterating).
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      // Single browser project: scale to firefox/webkit later when app behavior is stable.
      // Use local Chrome channel to avoid brittle browser binary paths in custom environments.
      use: { ...devices['Desktop Chrome'], channel: env.PLAYWRIGHT_CHANNEL || 'chrome' }
    }
  ]
})

