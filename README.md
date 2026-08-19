# Influ Capital

**A Hebrew, RTL-first marketing website for Influ Capital — personal stock-market investment guidance by Adam Vainshtein, a licensed investment marketer (Israel Securities Authority).**

<div dir="rtl">

אתר תדמית ולידים בעברית מלאה (RTL) עבור **Influ Capital — אדם ויינשטיין**, בעל רישיון שיווק השקעות מטעם הרשות לניירות ערך: ליווי השקעות אישי בשוק ההון, קורס השקעות ערך 1:1 והרצאות לארגונים.

**אתר חי:** [influ-capital.com](https://influ-capital.com)

## מה יש כאן

אתר סטטי מהיר ב־Vanilla HTML/CSS/JS, ללא פריימוורקים וללא build — עמוד `index.html` יחיד עם ניתוב hash שמכיל את כל עמודי הניווט ואת עמודי הרגולציה, לצד מערכת עיצוב מלאה ותשתית QA.

## תכונות עיקריות

- **עברית בלבד, RTL-first** — כל התוכן, הניווט וה־ARIA בעברית; פריסות ורכיבים מתוכננים מימין לשמאל
- **SPA סטטי עם ניתוב hash** — עמודי השירות (ליווי / קורס / הרצאות), אודות, יצירת קשר וארבעה מסמכי רגולציה — הכול בקובץ אחד, בלי שרת
- **מערכת עיצוב מרוכזת** — טוקנים ורכיבים ב־`brand.css` (מקור אמת יחיד, בלי ערכים קשיחים), מתועדים ב־`brand-book.html` ובעמודי ראווה (`heroes.html`, `sections.html`, `design-verticals.html`)
- **טופס לידים** — נשלח ל־Wix HTTP Function עם אימות בצד השרת, כולל לכידת אטריבוציה (UTM / gclid / fbclid / referrer)
- **פרטיות תחילה** — אנליטיקס (GA4 / Meta Pixel) נטען רק לאחר הסכמת עוגיות; פונטים באירוח עצמי ללא קריאות CDN
- **ביצועים** — פונטים `woff2` בתת־קבוצות עברית+לטינית, אייקוני Lucide מוטמעים כ־SVG inline (ללא JS חיצוני), תמונות AVIF/WebP רספונסיביות
- **SEO / GEO** — נתונים מובנים (Schema.org `FinancialService`), Open Graph, מבנה סמנטי מותאם גם למנועי AI
- **נגישות** — כיוון WCAG: ניגודיות AA, ניווט מקלדת, ARIA בעברית
- **טיקר מניות** — קיר לוגואים נע עם שינויי אחוז להמחשה (כולל דיסקליימר); תומך בחיבור ציטוטים אמיתיים דרך `SITE_CONFIG.quotesUrl`
- **המרה בוואטסאפ** — CTA ישיר עם הודעה מוכנה מראש

## טכנולוגיות

- **HTML5 / CSS3 / Vanilla JavaScript** — ללא פריימוורקים, ללא build step
- **פונטים:** Rubik (כותרות) + IBM Plex Sans Hebrew (גוף) — קבצי `woff2` מקומיים ב־`fonts/`
- **אייקונים:** [Lucide](https://lucide.dev) (רישיון ISC), מוטמעים inline
- **QA:** Playwright (E2E) + Lighthouse, עם ספי KPI ותיעוד תוצאות ב־`qa/`
- **אירוח:** GitHub Pages (דיפלוי מ־branch `main`, דומיין מותאם דרך `CNAME`)

## מבנה הפרויקט — מקורות אמת

| קובץ / תיקייה | תפקיד |
|---|---|
| `index.html` | האתר עצמו — עמוד יחיד עם כל הדפים |
| `brand.css` | טוקני עיצוב ורכיבי ליבה (מקור אמת יחיד לעיצוב) |
| `brand-book.html` | ספר המותג — צבעים, טיפוגרפיה, לוגו, טון |
| `BLUEPRINT.md` | עץ האתר — עמודים, סקשנים, טמפלטים (נערך ויזואלית ב־`tools/blueprint.html`) |
| `COPY.md` | בנק המסרים והקופי המאושר |
| `contact.json` | פרטי הקשר של העסק (מקור יחיד) |
| `fonts/` | פונטים באירוח עצמי + `fonts.css` |
| `media/` | לוגואים, תמונות, נכסי גרפיקה תלת־ממדיים |
| `qa/` | תוכנית בדיקות: E2E, Lighthouse, user stories, KPI, תוצאות |
| `tools/` | כלים פנימיים — עורך בלופרינט וסקריפטים ליצירת נכסים |
| `archive/` | גרסאות עיצוב קודמות (רפרנס) |

## הרצה מקומית

אין build. משכפלים ומרימים שרת סטטי:

</div>

```bash
git clone https://github.com/yairixStudio/influ-capital.git
cd influ-capital
python3 -m http.server 8000
```

<div dir="rtl">

ואז פותחים [http://localhost:8000](http://localhost:8000). (העמוד עובד גם ישירות מ־`file://` — הקונפיגורציה מוטמעת inline.)

### הרצת בדיקות (E2E)

</div>

```bash
cd qa
npm install
npx playwright install
npm run test:e2e
```

<div dir="rtl">

Playwright מרים שרת מקומי לבד ומריץ את התרחישים על מספר מכשירים. ראו `qa/README.md` ואת ה־runbooks לפרטים.

## יוצר

**[Yairix Studio](https://yairix.com)**

- אתר: [https://yairix.com](https://yairix.com)
- אימייל: yairixstudio@gmail.com

נבנה עבור **Influ Capital — אדם ויינשטיין** · [info@influ-capital.co.il](mailto:info@influ-capital.co.il)

</div>
