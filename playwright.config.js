// @ts-check
const { defineConfig, devices } = require('/opt/node22/lib/node_modules/playwright/test.js');

/**
 * Playwright configuration for pedrohbtp.github.io end-to-end tests.
 *
 * Prerequisites:
 *   bundle exec jekyll serve --port 4000 --destination _site
 *   (or: rake test  — which builds and starts the server automatically)
 *
 * Run tests:
 *   /opt/node22/bin/playwright test
 *   /opt/node22/bin/playwright test --headed   (with browser window)
 *   /opt/node22/bin/playwright test --ui        (interactive UI mode)
 */
module.exports = defineConfig({
  testDir: './tests',

  /* Fail fast in CI, retry once in local dev */
  retries: process.env.CI ? 2 : 0,

  /* Collect full trace on first retry */
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the Jekyll dev server automatically (reuse if already running) */
  webServer: {
    command:
      'RUBYOPT="-E utf-8" PATH="/opt/rbenv/versions/3.3.6/bin:$PATH" bundle _2.7.2_ exec jekyll serve --port 4000 --destination _site',
    url: 'http://localhost:4000',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
