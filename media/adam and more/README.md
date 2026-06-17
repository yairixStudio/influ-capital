# מדריך מדיה — הוספה ואופטימיזציה של תמונות

מדריך תמציתי. **בכל הוספת תמונה חדשה — לפעול לפי השלבים כאן.**

---

## 1. מבנה התיקיות

| תיקייה | תוכן | סטטוס |
|--------|------|--------|
| `portraits/` | תמונות תדמית — **מקור** (JPG ברזולוציה מלאה) | master, לא לגעת |
| `lectures/`  | תמונות הרצאות — **מקור** (PNG / RAW `.cr3`) | master, לא לגעת |
| `cutouts/`   | גרסאות **רקע שקוף** (PNG master, נוצר ב-rembg) | master |
| `video/`     | וידאו מקור (`.mov`) | master |
| `web/`       | **גרסאות מאופטמות לאתר בלבד** (AVIF/WebP/fallback/LQIP) | נוצר אוטומטית |

**כלל זהב:** קבצי מקור נשארים תמיד. ל-`web/` אסור להעלות ידנית — הוא נוצר רק ע"י `optimize.sh`.

---

## 2. שמות קבצים

- אנגלית, אותיות קטנות, מקפים בלבד: `adam-navy-suit-seated.jpg`
- תיאוריים ועקביים: `<נושא>-<וריאציה>` (לא `IMG_2931`, לא רווחים, לא עברית).
- הסקריפט מוסיף את הסיומות (`-800.webp`, `-lqip.webp`) — אל תוסיפו ידנית.

---

## 3. הוספת תמונת תדמית חדשה (workflow)

```bash
# 1. שמרו את המקור בתיקייה הנכונה (שם תקין):
#    portraits/adam-grey-suit.jpg

# 2. רקע שקוף (אם צריך cutout) — rembg (ML) אוטומטית, נופל ל-floodfill אם חסר:
./cutout.sh portraits/adam-grey-suit.jpg cutouts/adam-grey-suit.png
#    (פעם ראשונה מתקין rembg ל-~/.rembg-venv ומוריד מודל — חד-פעמי)

# 3. ייצור גרסאות web מאופטמות (גם למקור וגם ל-cutout):
./optimize.sh portraits/adam-grey-suit.jpg web/portraits "400 800 1200 1366"
./optimize.sh cutouts/adam-grey-suit.png   web/cutouts   "400 800 1200 1366"
```

---

## 4. פורמטים ואיכות (מה הסקריפט מייצר)

לכל תמונה, בכל רוחב:

| פלט | תפקיד | איכות |
|-----|-------|--------|
| `.avif` | פורמט ראשי — הכי קל | q≈52 |
| `.webp` | fallback ראשון (תמיכה רחבה) | q≈80 |
| `.jpg` / `.png` | fallback אחרון (כל דפדפן) | q≈82 / שקוף |
| `-lqip.webp` | תצוגה מיידית (~24px) למסכים זעירים / טעינה מקדימה | q≈35 |

**רוחבים מומלצים:** תדמית `400 800 1200 1366` · הרצאות `400 800 1200`. הסקריפט אף פעם לא מגדיל מעבר למקור.

---

## 5. שילוב באתר — fallback חכם

תמיד `<picture>` עם סדר יורד (avif → webp → fallback) + `srcset` רספונסיבי + `lazy` + LQIP כ-placeholder:

```html
<img src="web/portraits/adam-grey-suit-lqip.webp"
     data-src="web/portraits/adam-grey-suit-800.webp" alt="אדם ויינשטיין">

<picture>
  <source type="image/avif"
    srcset="web/portraits/adam-grey-suit-400.avif 400w,
            web/portraits/adam-grey-suit-800.avif 800w,
            web/portraits/adam-grey-suit-1200.avif 1200w"
    sizes="(max-width:600px) 400px, 800px">
  <source type="image/webp"
    srcset="web/portraits/adam-grey-suit-400.webp 400w,
            web/portraits/adam-grey-suit-800.webp 800w,
            web/portraits/adam-grey-suit-1200.webp 1200w"
    sizes="(max-width:600px) 400px, 800px">
  <img src="web/portraits/adam-grey-suit-800.jpg"
       width="1366" height="2048" loading="lazy" decoding="async"
       alt="אדם ויינשטיין — תדמית">
</picture>
```

הדפדפן בוחר אוטומטית: פורמט נתמך + הרוחב המתאים למסך. מכשיר ישן → נופל ל-WebP, ואז ל-JPG/PNG.

---

## 6. כללי זהב (נגישות + ביצועים + SEO)

- **`alt` בעברית, תיאורי ומשמעותי** — חובה בכל תמונה (נגישות + SEO).
- **`width` + `height`** תמיד — מונע קפיצת layout (CLS).
- **`loading="lazy"`** לכל תמונה שלא ב-fold הראשון; הראשונה — `eager` + `fetchpriority="high"`.
- אין להטמיע תמונות מקור כבדות; רק קבצי `web/`.
- וידאו: להמיר `.mov` → `.mp4` (H.264) + `.webp`/`.webm` poster:
  `ffmpeg -i video/atmosphere-video.mov -vcodec libx264 -crf 24 -movflags +faststart web/atmosphere.mp4`
