// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * האתר הוא קובץ סטטי יחיד (../index.html) עם ניתוב hash.
 * מרימים שרת סטטי מקומי מתיקיית השורש של הפרויקט.
 */
const PORT = 4173;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: `http://localhost:${PORT}/index.html`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // מרים שרת סטטי על תיקיית השורש (ההורה של תיקיית הבדיקות)
  webServer: {
    command: `python3 -m http.server ${PORT} --directory ..`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: true,
    timeout: 20000,
  },

  // מטריצת המכשירים מתוך kpi.md
  projects: [
    { name: 'desktop',       use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-iphone', use: { ...devices['iPhone 14'] } },
    { name: 'mobile-pixel',  use: { ...devices['Pixel 5'] } },
    { name: 'tablet',        use: { ...devices['iPad (gen 7)'] } },
  ],
});
