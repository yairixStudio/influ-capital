# משימות

## פעילות

- [ ] לשמור את `לוגו/ANCHOR-always-carry-forward.png` כרפרנס חובה בכל סבבי הלוגו עד להנחיה אחרת
- [ ] למחוק את ליד הבדיקה מ-Wix (אומת 2026-07-30: חוזה `{ok:true}` + שמירה מלאה): CMS ← "לידים מהאתר" ← רשומת "בדיקה למחיקה — QA" (`source: qa_e2e_test`), ואיש הקשר התואם ב-Contacts (`contactId: 5b9d3219`)
- [ ] להחליף את ההמלצות הדמה (`testimonials.json`) בהמלצות אמת — לקבל מאדם
- [ ] לעדכן את `contact.json` לפרטי קשר אמת (כולל TikTok/לינקדאין ואיחוד מייל/טלפון) — לקבל מאדם
- [ ] לוודא בטלפון אמיתי שהאתר מתפקד בדפדפנים המובנים של פייסבוק/אינסטגרם (לפתוח קישור מפוסט/סטורי: ניווט, באנר עוגיות, טופס, וואטסאפ/חיוג). החלק האוטומטי (אמולציה) — ב-`BACKLOG.md`
- [ ] **ביצועי מובייל ≥90**: עם gzip/brotli בהוסטינג = **92** (אומת 2026-06-21 אחרי תיקון רגרסיית הלוגו). לוודא שהדחיסה מופעלת בהוסטינג. בשרת הבדיקה הלא-דחוס = 82 (הפער = דחיסת ה-HTML 230KB→42KB). הזרקת עמודים עצלה — אופציונלי בלבד, כבר לא חוסם. ראה qa/results/2026-06-21.md
- [ ] (אופציונלי) לחבר נתוני מניות אמת לטיקר: להעמיד proxy/Edge-Function (Cloudflare Worker / Vercel) שמחזיק מפתח API (Finnhub/Twelve Data) ומחזיר `{SYMBOL: changePercent}`, ולהזין את כתובתו ל-`SITE_CONFIG.quotesUrl`. אסור מפתח API בצד-לקוח.
- [ ] ~3.11.2026: לבדוק ב-GSC את דוח "Page indexing" — שכל 10 הכתובות מ-`sitemap.xml` נכנסו לאינדקס; אם יש החרגות (Duplicate / Crawled not indexed) — לטפל
- [ ] לפצל פונקציות טהורות מ-`js/site.js` למודול `js/site-utils.js` כדי לאפשר בדיקות יחידה אמיתיות (ראה `qa/tests/unit/README.md`)

## הושלמו
- [x] Google Search Console חובר (נכס Domain) ו-`sitemap.xml` הוגש (2026-10-20)
- [x] שיטת עבודה חדשה: מקור יחיד `_src/index.html` → כל עמודי ה-HTML נוצרים רזים (גם דף הבית); CSS/JS חולצו ל-`site-chrome.css` / `js/site.js` עם cache-busting אוטומטי; `serve.py` בונה לבד; pre-commit hook (2026-10-20)
- [x] CLS בדף הבית במובייל (0.168 במעבדה): `fonts.css` נטען אסינכרונית והחליף פונט אחרי הציור הראשון → עכשיו stylesheet רגיל (2026-10-20)
- [x] עמודים סטטיים רזים — כל עמוד שנוצר מכיל רק את ה-`<article>` שלו (~150KB במקום ~250KB, בלי כפילות תוכן); `/קורס/` מועבר ל-`/קורס` (2026-10-20)
- [x] SEO: ניתוב נתיבים אמיתיים במקום `#` (History API) + עמוד סטטי לכל נתיב עם title/canonical משלו (`tools/build-pages.py`), `404.html`, `sitemap.xml`, `robots.txt`, noindex לעמודי הראווה; canonical → influ-capital.com (שני האתרים מתקיימים במקביל) (2026-10-20)
- [x] GA4 (G-ZWL0NJ7276) עם Consent Mode v2 — מדידה בסיסית ללא עוגיות לכולם, מלאה בהסכמה; מדיניות פרטיות/עוגיות עודכנה (2026-10-20)
- [x] Meta Pixel (3682923041866819) הוזן ב-`SITE_CONFIG.fbPixelId` — פעיל מאחורי הסכמת שיווק v2; PageView לכל ניווט, Lead בקליטת טופס מאומתת-שרת, Contact בלחיצות קשר, ModalOpen (2026-08-02)
- [x] סשן QA 2026-06-21: תיקון רגרסיית לוגו 850KB→16KB (WebP `web/`, מובייל Perf 68→92), `inert` ל-sticky-header (a11y aria-hidden-focus, 97→100), עימעום `--whatsapp-btn` ל-AA #15873f (4.6:1). כל ה-KPI ירוקים בשני המכשירים. ראה qa/results/2026-06-21.md
- [x] סקשן "מניות מובילות" — טיקר נע (`.ticker`) עם לוגואי 10 חברות מובילות (`media/stock-company/monochrome`) + שינויי אחוז אדום/ירוק חיים (להמחשה, עם דיסקליימר). דף הבית
- [x] איזור המלצות מתחלף — קיר ביקורות נע (`.testi-wall`) בעמודי המוצר (בהשראת Recomm של יהל) + הדמיית צ'אט וואטסאפ חיה בדף הבית
- [x] לבנות את האתר המלא (`index.html`) — SPA עברי RTL, 6 עמודי ניווט + 4 מסמכי רגולציה, מ-brand.css/COPY.md/BLUEPRINT.md/contact.json (2026-06-17)
- [x] סבב ביקורת רב-סוכני (6 ממדים) + אימות יריב → 18 ממצאים תוקנו; QA: 19/19 E2E ב-4 מכשירים, Lighthouse desktop 100, CLS 0 (2026-06-17)
- [x] להוסיף סקשן פודקאסטים (בית + אודות) — chips ל-Spotify/Apple/YouTube
- [x] מבנה תומך אנליטיקס — `SITE_CONFIG.ga4Id` + `loadAnalytics()` מאחורי הסכמת עוגיות (פרטיות-first)
- [x] תמונת שיתוף OG/Twitter — מטא + `media/brand-logos/web/og-image.png`
- [x] פיצול `brand-docs.css` — סגנונות תצוגה-בלבד הופרדו מ-brand.css כדי שעמוד האתר יטען רק את הליבה
- [x] אייקונים inline SVG (במקום Lucide CDN @latest) — הוסר 408KB JS, ללא תלות CDN; לוגואי מותג כ-SVG ייעודי
