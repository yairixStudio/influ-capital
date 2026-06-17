# Lighthouse Runbook

בדיקת ביצועים/נגישות/SEO/Best-Practices לכל עמוד, מול הספים ב‑[`kpi.md`](./kpi.md).

> האתר הוא SPA עם ניתוב hash. Lighthouse מודד את ה‑document שנטען; כדי לבדוק כל "עמוד" מנווטים ל‑hash שלו ומריצים. בנוסף תמיד בודקים את ה‑load הראשוני של `/`.

## הרצה מקומית

```bash
cd בדיקות
npm install            # פעם ראשונה (כולל lighthouse)
# הרם שרת מקומי בטרמינל נפרד:
python3 -m http.server 4173   # מהשורש של הפרויקט (התיקייה שמכילה את index.html)

# מובייל (ברירת מחדל ב-Lighthouse):
npx lighthouse "http://localhost:4173/index.html#/"            --form-factor=mobile  --output=html --output-path=./results/lh-home-mobile.html
npx lighthouse "http://localhost:4173/index.html#/ליווי-אישי"  --form-factor=mobile  --output=html --output-path=./results/lh-livui-mobile.html
npx lighthouse "http://localhost:4173/index.html#/קורס"        --form-factor=mobile  --output=html --output-path=./results/lh-course-mobile.html
npx lighthouse "http://localhost:4173/index.html#/הרצאות"      --form-factor=mobile  --output=html --output-path=./results/lh-talks-mobile.html
npx lighthouse "http://localhost:4173/index.html#/אודות"       --form-factor=mobile  --output=html --output-path=./results/lh-about-mobile.html
npx lighthouse "http://localhost:4173/index.html#/צור-קשר"     --form-factor=mobile  --output=html --output-path=./results/lh-contact-mobile.html

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
  npx lighthouse "http://localhost:4173/index.html#/$r" --quiet --chrome-flags="--headless" \
    --output=json --output-path="./results/lh-${r//\//_}.json"
done
```
