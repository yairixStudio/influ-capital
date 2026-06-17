# Influ Capital — ספריית נכסי מותג (Brand Assets)

תיקייה מסודרת עם כל צורות הלוגו והאייקונים שהאתר צריך, בשמות עקביים.
הכל ברקע **שקוף** (PNG) אלא אם צוין אחרת, וללא מטא־דאטה (פרטיות + משקל קל).

## פלטת מותג
| תפקיד | HEX |
|------|-----|
| Indigo (ראשי) | `#5643FF` |
| Teal (אקסנט) | `#13C9CA` |
| Deep Navy (טקסט) | `#000414` |

## וריאנטים
- **color** — גרסת הצבע המלאה (לרקעים בהירים).
- **black** — מונוכרום שחור (הדפסה / רקע בהיר / שימוש חד־צבעי).
- **white** — גרסת היפוך לבנה (לרקעים כהים).

## מבנה התיקייה
```
brand/
├── source/                      # המקור המלא (1536×1024), שונה שם בלבד
│   └── influ-capital-source-lockup-{color,black,white}.png
├── logo/
│   ├── lockup-horizontal/       # אייקון + שם, אופקי (השימוש הראשי)
│   │   └── influ-capital-logo-horizontal-{color,black,white}.png
│   ├── lockup-stacked/          # אייקון מעל השם, ריבועי — להרכבה ריבועית
│   │   └── influ-capital-logo-stacked-{color,black,white}.png
│   ├── icon/                    # אייקון בלבד (ה"יהלום")
│   │   ├── influ-capital-icon-{color,black,white}.png        # חתוך צמוד
│   │   └── influ-capital-icon-{color,black,white}-1024.png   # מאסטר ריבועי 1024
│   └── wordmark/                # שם בלבד ("Influ Capital")
│       └── influ-capital-wordmark-{color,black,white}.png
├── favicon/
│   ├── favicon.ico              # 16/32/48 משולבים
│   └── favicon-{16x16,32x32,48x48}.png
└── web/                         # נכסי PWA / רשת / שיתוף
    ├── apple-touch-icon.png     # 180×180, רקע לבן (אפל מעגל אוטומטית)
    ├── icon-192.png             # PWA, רקע שקוף
    ├── icon-512.png
    ├── icon-192-maskable.png    # אייקון לבן על Indigo, אזור בטוח ~60%
    ├── icon-512-maskable.png
    ├── og-image.png             # 1200×630 לשיתוף ברשתות (Open Graph / Twitter)
    └── site.webmanifest         # מניפסט PWA מוכן
```

## הרכבה ריבועית מותאמת אישית
האייקון (`logo/icon/…`) והשם (`logo/wordmark/…`) מופרדים לקבצים נפרדים —
אפשר להרכיב כל פריסה (ריבועית/אנכית/אופקית) בלי לחתוך מחדש מהמקור.
`lockup-stacked` הוא דוגמה ריבועית מוכנה.

## הטמעה ב‑`<head>`
```html
<link rel="icon" href="/brand/favicon/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon/favicon-32x32.png">
<link rel="apple-touch-icon" href="/brand/web/apple-touch-icon.png">
<link rel="manifest" href="/brand/web/site.webmanifest">
<meta name="theme-color" content="#5643FF">
<meta property="og:image" content="/brand/web/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```
לוגו בעמוד — השתמשו ב‑`logo/lockup-horizontal/…` עם `alt="Influ Capital"`
(שמרו טקסט חלופי לנגישות + SEO).

## שדרוג עתידי אופציונלי
המקור הוא ראסטר (לוגו שנוצר ב‑AI). לחדות מושלמת בכל גודל ניתן בהמשך
לוקטר את האייקון ל‑SVG (האייקון השחור משתרשר נקי דרך `potrace`).
