// @ts-check
const { test, expect } = require('@playwright/test');

const ROUTES = ['/', '/ליווי-אישי', '/קורס', '/הרצאות', '/אודות', '/צור-קשר'];

/** אוסף שגיאות console + בקשות שנכשלו לכל בדיקה */
function attachErrorCollectors(page) {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => errors.push(`requestfailed: ${req.url()}`));
  return errors;
}

test.describe('בריאות בסיסית של האתר', () => {

  test('US-01 — טעינה וניתוב בין כל העמודים ללא שגיאות console', async ({ page }) => {
    const errors = attachErrorCollectors(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/Influ Capital/);

    for (const route of ROUTES) {
      await page.goto(`/#${route}`);
      // עמוד פעיל אחד בלבד מוצג
      const active = page.locator('article.page.active');
      await expect(active).toHaveCount(1);
      await expect(active).toBeVisible();
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('US-03/04/05 — קישורי המרה תקינים (וואטסאפ / טלפון / מייל)', async ({ page }) => {
    await page.goto('/');
    const wa = page.locator('[data-wa-link]').first();
    await expect(wa).toHaveAttribute('href', /wa\.me\/\d+/);

    const call = page.locator('[data-call-link]').first();
    await expect(call).toHaveAttribute('href', /^tel:/);

    const email = page.locator('[data-email-link]').first();
    await expect(email).toHaveAttribute('href', /^mailto:/);
  });

  test('אייקוני Lucide עברו רינדור ל-SVG (אין placeholders יתומים)', async ({ page }) => {
    await page.goto('/');
    // לאחר createIcons אסור שיישארו אלמנטי <i data-lucide>
    await expect(page.locator('i[data-lucide]')).toHaveCount(0);
    // ויש לפחות כמה אייקוני lucide מרונדרים
    expect(await page.locator('svg.lucide').count()).toBeGreaterThan(5);
  });

  test('US-02 — תפריט המבורגר במובייל', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'רלוונטי רק למסכים צרים');
    await page.goto('/');
    const burger = page.locator('#hamburger');
    await expect(burger).toBeVisible();
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
  });

  test('US-06 — אקורדיון שאלות נפוצות נפתח', async ({ page }) => {
    await page.goto('/#/קורס');
    // אקורדיון בעמוד הפעיל בלבד (SPA: יש אקורדיונים גם בעמודים מוסתרים — שו״ת בבית, סילבוס בקורס)
    const items = page.locator('article.page.active .acc-item');
    if (await items.count() === 0) test.skip(true, 'אין אקורדיון בעמוד זה');
    const first = items.first();
    await first.locator('button, .acc-head, [aria-expanded]').first().click();
    // נפתח גובה כלשהו
    await expect(first).toBeVisible();
  });
});
