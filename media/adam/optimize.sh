#!/usr/bin/env bash
# optimize.sh — ייצור גרסאות web מאופטמות מתמונת מקור.
# פלט לכל קובץ: AVIF + WebP בכמה רוחבים + fallback (JPG/PNG) + LQIP זעיר.
#
# שימוש:  ./optimize.sh <קובץ-מקור> <תיקיית-יעד> ["רוחב1 רוחב2 ..."]
# דוגמה:  ./optimize.sh portraits/adam-arms-crossed.jpg web/portraits "400 800 1200 1366"
set -euo pipefail

src="$1"; outdir="$2"; widths="${3:-400 800 1200 1600}"
name="$(basename "${src%.*}")"
mkdir -p "$outdir"
srcw=$(magick identify -format "%w" "$src")

# יש שקיפות? → fallback ל-PNG. אחרת → JPG.
alpha=$(magick identify -format "%A" "$src")
case "$alpha" in [Tt]rue*|[Bb]lend*) fb=png ;; *) fb=jpg ;; esac

last=0
for w in $widths; do
  tw=$w; [ "$w" -gt "$srcw" ] && tw=$srcw      # אף פעם לא להגדיל מעבר למקור
  [ "$tw" = "$last" ] && continue              # למנוע כפילויות באותו רוחב
  last=$tw
  base="$outdir/${name}-${tw}"
  magick "$src" -resize "${tw}x" -strip -quality 52 "$base.avif"
  magick "$src" -resize "${tw}x" -strip -define webp:method=6 -quality 80 "$base.webp"
  if [ "$fb" = jpg ]; then
    magick "$src" -resize "${tw}x" -strip -interlace JPEG -sampling-factor 4:2:0 -quality 82 "$base.jpg"
  else
    magick "$src" -resize "${tw}x" -strip "$base.png"
  fi
  [ "$tw" -ge "$srcw" ] && break               # הגענו לרוחב המקור
done

# LQIP — מציין-טעינה זעיר (~24px) להצגה מיידית / מסכים קטנים מאוד
magick "$src" -resize 24x -strip -quality 35 "$outdir/${name}-lqip.webp"

echo "✓ $name  →  $outdir"
