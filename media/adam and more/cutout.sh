#!/usr/bin/env bash
# cutout.sh — הסרת רקע ויצירת PNG שקוף (master).
# שיטה ראשית: rembg (סגמנטציית ML) — איכותי, עובד גם על חולצות בהירות/כיסאות.
# נפילה: floodfill מ-4 פינות (fuzz) — רק לרקע אחיד מאוד, איכות draft.
#
# שימוש:  ./cutout.sh <קובץ-מקור> <יעד.png> [fuzz%-לנפילה]
# דוגמה:  ./cutout.sh portraits/adam-grey-suit.jpg cutouts/adam-grey-suit.png
set -euo pipefail

src="$1"; out="$2"; fuzz="${3:-15}"
mkdir -p "$(dirname "$out")"
VENV="$HOME/.rembg-venv"

# bootstrap ל-rembg אם חסר (פעם אחת, ~200MB + מודל ~170MB בריצה ראשונה)
if [ ! -x "$VENV/bin/rembg" ]; then
  echo "… מתקין rembg (חד-פעמי) ב-$VENV"
  python3 -m venv "$VENV" && "$VENV/bin/pip" install -q --upgrade pip \
    && "$VENV/bin/pip" install -q "rembg[cli]" onnxruntime || true
fi

if [ -x "$VENV/bin/rembg" ]; then
  "$VENV/bin/rembg" i "$src" "$out"
  echo "✓ cutout (rembg) → $out"
else
  echo "⚠️ rembg לא זמין — נופל ל-floodfill (איכות draft, רקע אחיד בלבד)"
  w=$(magick identify -format "%w" "$src"); h=$(magick identify -format "%h" "$src")
  x2=$((w-1)); y2=$((h-1))
  magick "$src" -alpha set -fuzz "${fuzz}%" -fill none \
    -draw "color 0,0 floodfill"   -draw "color $x2,0 floodfill" \
    -draw "color 0,$y2 floodfill" -draw "color $x2,$y2 floodfill" "$out"
  echo "✓ cutout (floodfill ${fuzz}%) → $out"
fi
