// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * כל עמוד הוא קובץ HTML רזה שנוצר מ-../_src/index.html; לכל נתיב יש קובץ סטטי
 * (tools/build-pages.py). השרת המקומי tools/serve.py מחקה את GitHub Pages: ‎/קורס → קורס.html, ו-404.html.
 */
const PORT = 4173;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // מרים שרת מקומי שמחקה את GitHub Pages על תיקיית השורש
  webServer: {
    command: `python3 ../tools/serve.py ${PORT}`,
    url: `http://localhost:${PORT}/`,
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
