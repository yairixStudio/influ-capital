# Lighthouse Runbook

בדיקת ביצועים/נגישות/SEO/Best-Practices לכל עמוד, מול הספים ב‑[`kpi.md`](./kpi.md).

> האתר הוא SPA עם ניתוב hash. Lighthouse מודד את ה‑document שנטען; כדי לבדוק כל "עמוד" מנווטים ל‑hash שלו ומריצים. בנוסף תמיד בודקים את ה‑load הראשוני של `/`.

## הרצה מקומית

```bash
cd בדיקות
npm install            # פעם ראשונה (כולל lighthouse)
# הרם שרת מקומי בטרמינל נפרד:
python3 tools/serve.py 4173   # מהשורש של הפרויקט — מחקה את GitHub Pages (נתיבים בלי .html, 404). ללא דחיסה → Performance נמוך ב~10 מהאתר החי

# מובייל (ברירת מחדל ב-Lighthouse):
npx lighthouse "http://localhost:4173/"            --form-factor=mobile  --output=html --output-path=./results/lh-home-mobile.html
npx lighthouse "http://localhost:4173/ליווי-אישי"  --form-factor=mobile  --output=html --output-path=./results/lh-livui-mobile.html
npx lighthouse "http://localhost:4173/קורס"        --form-factor=mobile  --output=html --output-path=./results/lh-course-mobile.html
npx lighthouse "http://localhost:4173/הרצאות"      --form-factor=mobile  --output=html --output-path=./results/lh-talks-mobile.html
npx lighthouse "http://localhost:4173/אודות"       --form-factor=mobile  --output=html --output-path=./results/lh-about-mobile.html
npx lighthouse "http://localhost:4173/צור-קשר"     --form-factor=mobile  --output=html --output-path=./results/lh-contact-mobile.html

# דסקטופ — הוסף:  --preset=desktop  ושנה את שם הקובץ ל-...-desktop.html
```

## מה עושים עם התוצאות

1. פותחים כל דוח ומשווים לספים ב‑`kpi.md`.
2. כל ציון מתחת לסף → ממצא ב‑`results/<תאריך>.md` + משימה ב‑`TASKS.md`.
3. מתקנים, מריצים שוב, חוזרים על כך עד שכל העמודים ירוקים בשתי הפורמטים.

## טיפ אוטומציה

אפשר להריץ את כל העמודים בלולאה ולשמור JSON לסיכום מצרפי:

```bash
for r in "/" "ליווי-אישי" "קורס" "הרצאות" "אודות" "צור-קשר"; do
  npx lighthouse "http://localhost:4173/${r#/}" --quiet --chrome-flags="--headless" \
    --output=json --output-path="./results/lh-${r//\//_}.json"
done
```

## מול האתר החי — בלי לזהם את GA4/Meta

האתר שולח מדידה בסיסית (Consent Mode) גם בלי הסכמה, ולכן כל ריצת Lighthouse / Playwright מול `influ-capital.com` נספרת ב-GA. לחסום תמיד:

```bash
npx lighthouse "https://influ-capital.com/" --form-factor=mobile \
  --blocked-url-patterns='*googletagmanager*' --blocked-url-patterns='*google-analytics*' \
  --blocked-url-patterns='*facebook*'
```
ב-Playwright: `context.route(/googletagmanager|google-analytics|facebook/, r => r.fulfill({ status: 204, body: '' }))` (לא `abort` — מדפיס שגיאות console).
