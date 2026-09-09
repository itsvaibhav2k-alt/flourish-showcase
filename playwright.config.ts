import { defineConfig } from '@playwright/test'

const port = process.env.PLAYWRIGHT_PORT ? Number(process.env.PLAYWRIGHT_PORT) : 3100

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `BYPASS_AUTH=true npx next dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      BYPASS_AUTH: 'true',
    },
  },
})
