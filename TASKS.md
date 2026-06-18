# משימות

## פעילות

- [ ] לשמור את `לוגו/ANCHOR-always-carry-forward.png` כרפרנס חובה בכל סבבי הלוגו עד להנחיה אחרת
- [ ] להחליף את ההמלצות הדמה (`testimonials.json`) בהמלצות אמת
- [ ] לעדכן את `contact.json` לפרטי קשר אמת (כולל TikTok/לינקדאין ואיחוד מייל/טלפון)
- [ ] לוודא שהאתר נפתח ומתפקד טוב גם בדפדפנים המובנים של פייסבוק/אינסטגרם (in-app browsers) שלעיתים משבשים אתרים
- [ ] **ביצועי מובייל ≥90**: כיום 85–89 בשרת הבדיקה הלא-דחוס (96 ב-gzip/פרודקשן). לוודא gzip/brotli בהוסטינג; אם נדרש ≥90 גם בשרת הבדיקה — להחליט אדריכלית על הזרקת עמודים עצלה (כל 10 עמודי ה-SPA כרגע ב-DOM יחד, ~1481 nodes, CPU-bound תחת throttle). ראה qa/results/2026-06-17.md
- [ ] (אופציונלי) לחבר נתוני מניות אמת לטיקר: להעמיד proxy/Edge-Function (Cloudflare Worker / Vercel) שמחזיק מפתח API (Finnhub/Twelve Data) ומחזיר `{SYMBOL: changePercent}`, ולהזין את כתובתו ל-`SITE_CONFIG.quotesUrl`. אסור מפתח API בצד-לקוח.
- [ ] לחלץ את הלוגיקה ה-inline שב-`index.html` למודול `js/site-utils.js` כדי לאפשר בדיקות יחידה אמיתיות (ראה `qa/tests/unit/README.md`)

## הושלמו
- [x] סקשן "מניות מובילות" — טיקר נע (`.ticker`) עם לוגואי 10 חברות מובילות (`media/stock-company/monochrome`) + שינויי אחוז אדום/ירוק חיים (להמחשה, עם דיסקליימר). דף הבית
- [x] איזור המלצות מתחלף — קיר ביקורות נע (`.testi-wall`) בעמודי המוצר (בהשראת Recomm של יהל) + הדמיית צ'אט וואטסאפ חיה בדף הבית
- [x] לבנות את האתר המלא (`index.html`) — SPA עברי RTL, 6 עמודי ניווט + 4 מסמכי רגולציה, מ-brand.css/COPY.md/BLUEPRINT.md/contact.json (2026-06-17)
- [x] סבב ביקורת רב-סוכני (6 ממדים) + אימות יריב → 18 ממצאים תוקנו; QA: 19/19 E2E ב-4 מכשירים, Lighthouse desktop 100, CLS 0 (2026-06-17)
- [x] להוסיף סקשן פודקאסטים (בית + אודות) — chips ל-Spotify/Apple/YouTube
- [x] מבנה תומך אנליטיקס — `SITE_CONFIG.ga4Id` + `loadAnalytics()` מאחורי הסכמת עוגיות (פרטיות-first)
- [x] תמונת שיתוף OG/Twitter — מטא + `media/brand-logos/web/og-image.png`
- [x] פיצול `brand-docs.css` — סגנונות תצוגה-בלבד הופרדו מ-brand.css כדי שעמוד האתר יטען רק את הליבה
- [x] אייקונים inline SVG (במקום Lucide CDN @latest) — הוסר 408KB JS, ללא תלות CDN; לוגואי מותג כ-SVG ייעודי
