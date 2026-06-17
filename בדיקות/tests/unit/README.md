# בדיקות יחידה (Unit)

**מדיניות:** כל פיסת לוגיקה שניתן לבודד מקבלת בדיקת יחידה, ומורצת ב‑`npm run test:unit` (Node test runner מובנה).

## מצב נוכחי

הלוגיקה (בניית קישורי וואטסאפ/טלפון, ניתוב hash, ולידציית טופס) כתובה כרגע **inline בתוך `index.html`**, ולכן לא ניתנת לייבוא ישיר לבדיקה.

## צעד הבא לכיסוי אמיתי

לחלץ את הפונקציות הטהורות למודול נפרד, למשל `../../js/site-utils.js`:

```js
export const waLink = (intl, msg) => `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
export const telLink = (phone) => `tel:${phone}`;
export const routeFromHash = (hash) => hash.replace(/^#/, '') || '/';
```

ואז `index.html` ייבא אותן, וכאן תיכתב `links.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { waLink, telLink } = require('../../js/site-utils.js');

test('waLink מקודד את ההודעה', () => {
  assert.ok(waLink('972500000000', 'שלום').startsWith('https://wa.me/972500000000?text='));
});
```

> עד החילוץ — הכיסוי הפונקציונלי מסופק ע"י בדיקות ה‑E2E (Playwright). זו משימה מתועדת ב‑`TASKS.md`.
