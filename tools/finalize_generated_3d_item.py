#!/usr/bin/env python3
"""Finalize a generated 3D item into transparent PNG/WebP assets."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = ROOT / "media" / "assets" / "3d-generated-items"
GENERATED_ROOT = Path.home() / ".codex" / "generated_images"
CHROMA_HELPER = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")) / "skills" / ".system" / "imagegen" / "scripts" / "remove_chroma_key.py"


def newest_generated_after(marker: Path) -> Path:
    marker_time = marker.stat().st_mtime
    candidates = [
        path
        for path in GENERATED_ROOT.rglob("*.png")
        if path.stat().st_mtime > marker_time
    ]
    if not candidates:
        raise SystemExit(f"No generated PNG found after marker: {marker}")
    return max(candidates, key=lambda path: path.stat().st_mtime)


def normalize_transparent_item(src: Path, dst: Path, size: int = 1200, visual_max: int = 1060) -> None:
    image = Image.open(src).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if not bbox:
        raise SystemExit(f"No visible pixels after background removal: {src}")

    x0, y0, x1, y1 = bbox
    pad_x = max(18, int((x1 - x0) * 0.055))
    pad_y = max(18, int((y1 - y0) * 0.055))
    crop = image.crop((
        max(0, x0 - pad_x),
        max(0, y0 - pad_y),
        min(image.width, x1 + pad_x),
        min(image.height, y1 + pad_y),
    ))

    scale = min(visual_max / crop.width, visual_max / crop.height)
    resized = crop.resize(
        (max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
        Image.Resampling.LANCZOS,
    )

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    out.save(dst, "PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("name")
    parser.add_argument("--marker", type=Path, default=Path("/tmp/adam-3d-gen-marker"))
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)
    source_dir = args.out_dir / "source"
    tmp_dir = args.out_dir / "tmp"
    source_dir.mkdir(exist_ok=True)
    tmp_dir.mkdir(exist_ok=True)

    generated = newest_generated_after(args.marker)
    source_path = source_dir / f"{args.name}-source.png"
    tmp_alpha = tmp_dir / f"{args.name}-alpha.png"
    final_png = args.out_dir / f"{args.name}.png"
    final_webp = args.out_dir / f"{args.name}.webp"

    shutil.copy2(generated, source_path)
    subprocess.run(
        [
            "python3",
            str(CHROMA_HELPER),
            "--input",
            str(source_path),
            "--out",
            str(tmp_alpha),
            "--auto-key",
            "border",
            "--soft-matte",
            "--transparent-threshold",
            "18",
            "--opaque-threshold",
            "230",
            "--edge-contract",
            "1",
            "--despill",
        ],
        check=True,
    )
    normalize_transparent_item(tmp_alpha, final_png)
    Image.open(final_png).convert("RGBA").save(final_webp, "WEBP", quality=88, method=6, exact=True)
    print(final_png)
    print(final_webp)


if __name__ == "__main__":
    main()
