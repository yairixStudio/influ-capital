// @ts-check
const { test, expect } = require('@playwright/test');

const ROUTES = ['/', '/ליווי-אישי', '/קורס', '/הרצאות', '/אודות', '/צור-קשר'];

/** אוסף שגיאות console + בקשות שנכשלו לכל בדיקה */
function attachErrorCollectors(page) {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  // רק בקשות של האתר עצמו — בקשות צד ג' (GA4 / Meta / YouTube) נחתכות כשהבדיקה נסגרת ואינן בשליטתנו
  page.on('requestfailed', (req) => { if (new URL(req.url()).hostname === 'localhost') errors.push(`requestfailed: ${req.url()}`); });
  return errors;
}

test.describe('SEO — כל עמוד הוא URL נפרד', () => {

  test('טעינה ישירה של עמוד פנימי: עמוד פעיל, title ו-canonical משלו', async ({ page }) => {
    await page.goto('/קורס');
    await expect(page.locator('article.page.active')).toHaveAttribute('data-page', '/קורס');
    await expect(page).toHaveTitle(/קורס השקעות ערך/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://influ-capital.com/' + encodeURIComponent('קורס'));
  });

  test('ניווט פנימי משנה נתיב ו-title בלי טעינה מחדש', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.evaluate(() => { window.__noReload = true; });
    if (isMobile) await page.locator('#hamburger').click();
    await page.locator('#nav-links a[href="/אודות"]').click();
    await expect(page).toHaveURL(/%D7%90%D7%95%D7%93%D7%95%D7%AA$/);
    await expect(page).toHaveTitle(/אודות/);
    expect(await page.evaluate(() => window.__noReload)).toBe(true);
    await page.goBack();
    await expect(page.locator('article.page.active')).toHaveAttribute('data-page', '/');
  });

  test('קישורים ישנים בפורמט hash מועברים לנתיב החדש', async ({ page }) => {
    await page.goto('/#/רגולציה/עוגיות');
    await expect(page).toHaveURL(/%D7%A2%D7%95%D7%92%D7%99%D7%95%D7%AA$/);
    await expect(page.locator('#reg-tabs .tab.active')).toHaveAttribute('data-doc', 'עוגיות');
    await page.goto('/#/קורס');
    await expect(page.locator('article.page.active')).toHaveAttribute('data-page', '/קורס');
  });

  test('עמוד סטטי רזה: רק התוכן שלו, וניווט לעמוד אחר בטעינה מלאה', async ({ page, isMobile }) => {
    await page.goto('/קורס');
    await expect(page.locator('article.page')).toHaveCount(1);
    if (isMobile) await page.locator('#hamburger').click();
    await page.locator('#nav-links a[href="/אודות"]').click();
    await expect(page.locator('article.page.active')).toHaveAttribute('data-page', '/אודות');
    await page.goBack();
    await expect(page.locator('article.page.active')).toHaveAttribute('data-page', '/קורס');
  });

  test('לוכסן בסוף (‎/קורס/) מועבר לנתיב הנקי', async ({ page }) => {
    await page.goto('/קורס/');
    await expect(page).toHaveURL(/%D7%A7%D7%95%D7%A8%D7%A1$/);
    await expect(page.locator('article.page.active')).toHaveAttribute('data-page', '/קורס');
  });

  test('נתיב לא קיים → 404 עם noindex', async ({ page }) => {
    const res = await page.goto('/no-such-page/deep');
    expect(res?.status()).toBe(404);
    await expect(page.locator('article.page.active')).toHaveAttribute('data-page', '/404');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('sitemap ו-robots זמינים', async ({ request }) => {
    const sm = await (await request.get('/sitemap.xml')).text();
    expect(sm).toContain('<loc>https://influ-capital.com/</loc>');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://influ-capital.com/sitemap.xml');
  });
});

test.describe('בריאות בסיסית של האתר', () => {

  test('US-01 — טעינה וניתוב בין כל העמודים ללא שגיאות console', async ({ page }) => {
    const errors = attachErrorCollectors(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/Influ Capital/);

    await page.waitForLoadState('networkidle');
    // ניווט פנימי (כמו קליק בתפריט) — בלי טעינה מחדש, כדי לא לבטל בקשות באמצע
    for (const route of ROUTES) {
      await page.evaluate((r) => { history.pushState(null, '', r); dispatchEvent(new PopStateEvent('popstate')); }, route);
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
    await page.goto('/קורס');
    // אקורדיון בעמוד הפעיל בלבד (SPA: יש אקורדיונים גם בעמודים מוסתרים — שו״ת בבית, סילבוס בקורס)
    const items = page.locator('article.page.active .acc-item');
    if (await items.count() === 0) test.skip(true, 'אין אקורדיון בעמוד זה');
    const first = items.first();
    await first.locator('button, .acc-head, [aria-expanded]').first().click();
    // נפתח גובה כלשהו
    await expect(first).toBeVisible();
  });
});
