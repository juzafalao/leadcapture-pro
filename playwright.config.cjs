const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'always' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,
    slowMo: 400,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { channel: 'chrome' } }],
});
