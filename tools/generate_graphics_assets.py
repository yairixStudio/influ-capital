#!/usr/bin/env python3
"""Generate transparent bitmap graphics for the Influ Capital website."""

from __future__ import annotations

import math
import random
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "media" / "assets"
BRAND_CSS = ROOT / "brand.css"


def read_tokens() -> dict[str, tuple[int, int, int]]:
    css = BRAND_CSS.read_text(encoding="utf-8")
    tokens: dict[str, tuple[int, int, int]] = {}
    for name, value in re.findall(r"--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})", css):
        tokens[name] = hex_rgb(value)
    return tokens


def hex_rgb(value: str) -> tuple[int, int, int]:
    value = value.strip().lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


TOKENS = read_tokens()
INDIGO = TOKENS["indigo-500"]
INDIGO_DARK = TOKENS["indigo-800"]
INDIGO_DEEP = TOKENS["indigo-900"]
INK = TOKENS["ink"]
TEAL = TOKENS["teal-400"]
TEAL_LIGHT = TOKENS["teal-300"]
POSITIVE = TOKENS["positive"]
BG = TOKENS["bg"]
WHITE = (255, 255, 255)


def rgba(color: tuple[int, int, int], alpha: int) -> tuple[int, int, int, int]:
    return color[0], color[1], color[2], alpha


def canvas(size: tuple[int, int]) -> Image.Image:
    return Image.new("RGBA", size, (0, 0, 0, 0))


def scale_box(box: tuple[float, float, float, float], scale: int) -> tuple[int, int, int, int]:
    return tuple(int(round(v * scale)) for v in box)


def scale_points(points: list[tuple[float, float]], scale: int) -> list[tuple[int, int]]:
    return [(int(round(x * scale)), int(round(y * scale))) for x, y in points]


def aa_mask(
    size: tuple[int, int],
    draw_fn,
    scale: int = 3,
) -> Image.Image:
    w, h = size
    mask = Image.new("L", (w * scale, h * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw_fn(draw, scale)
    return mask.resize(size, Image.Resampling.LANCZOS)


def mask_ellipse(size: tuple[int, int], box: tuple[float, float, float, float]) -> Image.Image:
    return aa_mask(size, lambda d, s: d.ellipse(scale_box(box, s), fill=255))


def mask_round_rect(
    size: tuple[int, int],
    box: tuple[float, float, float, float],
    radius: float,
) -> Image.Image:
    return aa_mask(
        size,
        lambda d, s: d.rounded_rectangle(scale_box(box, s), radius=int(radius * s), fill=255),
    )


def mask_polygon(size: tuple[int, int], points: list[tuple[float, float]]) -> Image.Image:
    return aa_mask(size, lambda d, s: d.polygon(scale_points(points, s), fill=255))


def mask_line(
    size: tuple[int, int],
    points: list[tuple[float, float]],
    width: float,
    round_caps: bool = True,
    scale: int = 3,
) -> Image.Image:
    def draw_line(draw: ImageDraw.ImageDraw, s: int) -> None:
        pts = scale_points(points, s)
        draw.line(pts, fill=255, width=max(1, int(width * s)), joint="curve")
        if round_caps:
            r = width * s / 2
            for x, y in pts:
                draw.ellipse((x - r, y - r, x + r, y + r), fill=255)

    return aa_mask(size, draw_line, scale=scale)


def mask_ellipse_outline(
    size: tuple[int, int],
    box: tuple[float, float, float, float],
    width: float,
    rotation: float = 0,
) -> Image.Image:
    def draw_outline(draw: ImageDraw.ImageDraw, s: int) -> None:
        draw.ellipse(scale_box(box, s), outline=255, width=max(1, int(width * s)))

    mask = aa_mask(size, draw_outline)
    if rotation:
        cx = (box[0] + box[2]) / 2
        cy = (box[1] + box[3]) / 2
        mask = mask.rotate(rotation, resample=Image.Resampling.BICUBIC, center=(cx, cy), fillcolor=0)
    return mask


def mask_arc(
    size: tuple[int, int],
    box: tuple[float, float, float, float],
    start: float,
    end: float,
    width: float,
) -> Image.Image:
    def draw_arc(draw: ImageDraw.ImageDraw, s: int) -> None:
        draw.arc(scale_box(box, s), start=start, end=end, fill=255, width=max(1, int(width * s)))

    return aa_mask(size, draw_arc)


def linear_gradient(
    size: tuple[int, int],
    stops: list[tuple[float, tuple[int, int, int, int]]],
    angle: float = 160,
) -> Image.Image:
    w, h = size
    theta = math.radians(angle)
    dx, dy = math.cos(theta), math.sin(theta)
    xs = np.linspace(-0.5, 0.5, w, dtype=np.float32)
    ys = np.linspace(-0.5, 0.5, h, dtype=np.float32)
    xv, yv = np.meshgrid(xs, ys)
    t = xv * dx + yv * dy
    t = (t - t.min()) / (t.max() - t.min())
    arr = np.zeros((h, w, 4), dtype=np.float32)
    stops = sorted(stops, key=lambda x: x[0])

    for idx in range(len(stops) - 1):
        p0, c0 = stops[idx]
        p1, c1 = stops[idx + 1]
        if idx == len(stops) - 2:
            sel = (t >= p0) & (t <= p1)
        else:
            sel = (t >= p0) & (t < p1)
        span = max(p1 - p0, 1e-6)
        local = np.clip((t[sel] - p0) / span, 0, 1)[:, None]
        c0a = np.array(c0, dtype=np.float32)
        c1a = np.array(c1, dtype=np.float32)
        arr[sel] = c0a + (c1a - c0a) * local

    arr[t < stops[0][0]] = np.array(stops[0][1], dtype=np.float32)
    arr[t > stops[-1][0]] = np.array(stops[-1][1], dtype=np.float32)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def offset_mask(mask: Image.Image, offset: tuple[int, int]) -> Image.Image:
    dx, dy = offset
    w, h = mask.size
    out = Image.new("L", mask.size, 0)
    src_left = max(0, -dx)
    src_top = max(0, -dy)
    src_right = min(w, w - dx) if dx >= 0 else w
    src_bottom = min(h, h - dy) if dy >= 0 else h
    if src_right <= src_left or src_bottom <= src_top:
        return out
    crop = mask.crop((src_left, src_top, src_right, src_bottom))
    out.paste(crop, (max(0, dx), max(0, dy)))
    return out


def add_shadow(
    image: Image.Image,
    mask: Image.Image,
    color: tuple[int, int, int] = INK,
    alpha: int = 76,
    blur: float = 34,
    offset: tuple[int, int] = (0, 24),
) -> None:
    shifted = offset_mask(mask, offset).filter(ImageFilter.GaussianBlur(blur))
    arr = np.array(shifted, dtype=np.float32)
    arr = np.clip(arr * (alpha / 255), 0, 255).astype(np.uint8)
    layer = Image.new("RGBA", image.size, (*color, 0))
    layer.putalpha(Image.fromarray(arr, "L"))
    image.alpha_composite(layer)


def apply_mask(source: Image.Image, mask: Image.Image) -> Image.Image:
    layer = source.copy()
    alpha = np.array(layer.getchannel("A"), dtype=np.float32)
    mask_arr = np.array(mask, dtype=np.float32) / 255
    layer.putalpha(Image.fromarray(np.clip(alpha * mask_arr, 0, 255).astype(np.uint8), "L"))
    return layer


def fill_gradient(
    image: Image.Image,
    mask: Image.Image,
    stops: list[tuple[float, tuple[int, int, int, int]]],
    angle: float = 160,
) -> None:
    image.alpha_composite(apply_mask(linear_gradient(image.size, stops, angle), mask))


def fill_solid(
    image: Image.Image,
    mask: Image.Image,
    color: tuple[int, int, int],
    alpha: int,
) -> None:
    layer = Image.new("RGBA", image.size, (*color, alpha))
    image.alpha_composite(apply_mask(layer, mask))


def add_outline(
    image: Image.Image,
    mask: Image.Image,
    color: tuple[int, int, int] = WHITE,
    alpha: int = 86,
    width: int = 2,
) -> None:
    size = width * 2 + 1
    outer = mask.filter(ImageFilter.MaxFilter(size))
    inner = mask.filter(ImageFilter.MinFilter(size))
    outline = ImageChops.subtract(outer, inner)
    fill_solid(image, outline, color, alpha)


def add_glass(
    image: Image.Image,
    mask: Image.Image,
    angle: float = 160,
    shadow: bool = True,
    shadow_alpha: int = 70,
    shadow_blur: float = 34,
    shadow_offset: tuple[int, int] = (0, 24),
    outline_alpha: int = 78,
    stops: list[tuple[float, tuple[int, int, int, int]]] | None = None,
) -> None:
    if shadow:
        add_shadow(image, mask, alpha=shadow_alpha, blur=shadow_blur, offset=shadow_offset)
    if stops is None:
        stops = [
            (0.0, rgba(WHITE, 120)),
            (0.36, rgba(INDIGO, 206)),
            (0.72, rgba(TEAL, 146)),
            (1.0, rgba(WHITE, 72)),
        ]
    fill_gradient(image, mask, stops, angle=angle)
    add_outline(image, mask, WHITE, outline_alpha, width=2)


def add_glow_blob(
    image: Image.Image,
    box: tuple[float, float, float, float],
    color: tuple[int, int, int],
    alpha: int,
    blur: float,
) -> None:
    mask = mask_ellipse(image.size, box).filter(ImageFilter.GaussianBlur(blur))
    fill_solid(image, mask, color, alpha)


def bezier(
    p0: tuple[float, float],
    p1: tuple[float, float],
    p2: tuple[float, float],
    p3: tuple[float, float],
    steps: int = 120,
) -> list[tuple[float, float]]:
    points = []
    for i in range(steps + 1):
        t = i / steps
        mt = 1 - t
        x = mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0]
        y = mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1]
        points.append((x, y))
    return points


def draw_curve(
    image: Image.Image,
    points: list[tuple[float, float]],
    width: float,
    alpha_boost: int = 0,
    glow: bool = True,
) -> None:
    mask = mask_line(image.size, points, width)
    if glow:
        fill_solid(image, mask.filter(ImageFilter.GaussianBlur(width * 0.55)), TEAL, 34 + alpha_boost)
        add_shadow(image, mask, alpha=68, blur=width * 0.42, offset=(0, int(width * 0.22)))
    fill_gradient(
        image,
        mask,
        [
            (0.0, rgba(INK, 216)),
            (0.35, rgba(INDIGO, 226)),
            (0.72, rgba(TEAL, 218)),
            (1.0, rgba(WHITE, 120)),
        ],
        angle=160,
    )
    add_outline(image, mask, WHITE, 68, width=max(1, int(width * 0.035)))


def draw_node(
    image: Image.Image,
    center: tuple[float, float],
    radius: float,
    color: tuple[int, int, int] = TEAL,
    alpha: int = 210,
) -> None:
    cx, cy = center
    outer = mask_ellipse(image.size, (cx - radius, cy - radius, cx + radius, cy + radius))
    fill_solid(image, outer.filter(ImageFilter.GaussianBlur(radius * 0.55)), color, 42)
    add_glass(
        image,
        outer,
        shadow_alpha=52,
        shadow_blur=radius * 0.45,
        shadow_offset=(0, int(radius * 0.2)),
        outline_alpha=90,
        stops=[
            (0.0, rgba(WHITE, 132)),
            (0.42, rgba(color, alpha)),
            (1.0, rgba(INDIGO, 142)),
        ],
    )
    inner_r = radius * 0.33
    inner = mask_ellipse(image.size, (cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r))
    fill_solid(image, inner, WHITE, 150)


def draw_sparkle(image: Image.Image, center: tuple[float, float], radius: float, color=TEAL_LIGHT) -> None:
    cx, cy = center
    pts1 = [(cx, cy - radius), (cx + radius * 0.18, cy - radius * 0.18), (cx + radius, cy),
            (cx + radius * 0.18, cy + radius * 0.18), (cx, cy + radius),
            (cx - radius * 0.18, cy + radius * 0.18), (cx - radius, cy),
            (cx - radius * 0.18, cy - radius * 0.18)]
    mask = mask_polygon(image.size, pts1)
    fill_solid(image, mask.filter(ImageFilter.GaussianBlur(radius * 0.25)), color, 42)
    fill_gradient(image, mask, [(0, rgba(WHITE, 170)), (1, rgba(color, 205))], angle=130)


def draw_bars(image: Image.Image, bars: list[tuple[float, float, float, float]], alpha=136) -> None:
    for idx, box in enumerate(bars):
        mask = mask_round_rect(image.size, box, min(box[2] - box[0], box[3] - box[1]) / 2)
        color = TEAL if idx % 2 else INDIGO
        fill_gradient(
            image,
            mask,
            [(0, rgba(WHITE, 118)), (0.6, rgba(color, alpha)), (1, rgba(TEAL_LIGHT, 116))],
            angle=150,
        )


def save_asset(name: str, image: Image.Image) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    png_path = OUT_DIR / f"{name}.png"
    webp_path = OUT_DIR / f"{name}.webp"
    image.save(png_path, "PNG", optimize=True)
    image.save(webp_path, "WEBP", quality=82, method=6, exact=True)


def hero_growth_orbit() -> Image.Image:
    img = canvas((1600, 1600))
    add_glow_blob(img, (230, 250, 1370, 1390), INDIGO, 24, 120)
    add_glow_blob(img, (560, 460, 1380, 1150), TEAL, 26, 95)

    orbit = mask_ellipse_outline(img.size, (245, 390, 1360, 1170), 32, rotation=-18)
    fill_gradient(
        img,
        orbit,
        [(0, rgba(WHITE, 78)), (0.3, rgba(INDIGO, 132)), (0.72, rgba(TEAL, 152)), (1, rgba(WHITE, 66))],
        angle=160,
    )

    back_curve = bezier((390, 1015), (600, 870), (760, 675), (1180, 510), 150)
    draw_curve(img, back_curve, 132, glow=True)
    front_curve = bezier((420, 1000), (665, 885), (780, 620), (1235, 470), 150)
    draw_curve(img, front_curve, 76, alpha_boost=12, glow=True)

    highlight = mask_line(img.size, bezier((455, 940), (650, 835), (800, 625), (1198, 505), 120), 16)
    fill_solid(img, highlight, WHITE, 126)

    for p, r, c in [
        ((338, 766), 58, INDIGO),
        ((503, 450), 42, TEAL),
        ((884, 397), 36, TEAL_LIGHT),
        ((1224, 645), 54, INDIGO),
        ((1035, 1056), 43, TEAL),
        ((625, 1175), 34, INDIGO),
    ]:
        draw_node(img, p, r, c)

    for box, angle in [((650, 725, 790, 865), 20), ((920, 820, 1048, 948), -25), ((710, 532, 800, 622), 0)]:
        mask = mask_round_rect(img.size, box, 34)
        add_glass(img, mask, angle=angle, shadow_alpha=45, shadow_blur=22, outline_alpha=80)
    return img


def service_guidance() -> Image.Image:
    img = canvas((800, 800))
    add_glow_blob(img, (105, 120, 700, 680), INDIGO, 22, 70)
    bubble = mask_round_rect(img.size, (135, 170, 650, 510), 96)
    tail = mask_polygon(img.size, [(240, 492), (180, 618), (345, 514)])
    bubble = ImageChops.lighter(bubble, tail)
    add_glass(img, bubble, shadow_alpha=72, shadow_blur=30, outline_alpha=90)

    compass = mask_ellipse_outline(img.size, (280, 230, 520, 470), 18)
    fill_solid(img, compass.filter(ImageFilter.GaussianBlur(8)), TEAL, 42)
    fill_gradient(img, compass, [(0, rgba(WHITE, 145)), (1, rgba(TEAL, 190))], angle=150)

    needle = mask_polygon(img.size, [(405, 262), (442, 395), (396, 368), (355, 424), (382, 333)])
    fill_gradient(img, needle, [(0, rgba(WHITE, 160)), (0.55, rgba(TEAL, 226)), (1, rgba(INDIGO, 190))])
    add_outline(img, needle, WHITE, 80)

    hand_a = mask_round_rect(img.size, (300, 485, 470, 552), 34)
    hand_b = mask_round_rect(img.size, (405, 462, 555, 532), 34)
    add_glass(img, hand_a, shadow_alpha=34, shadow_blur=14, outline_alpha=76)
    add_glass(img, hand_b, shadow_alpha=34, shadow_blur=14, outline_alpha=76)
    draw_node(img, (610, 222), 30, TEAL_LIGHT)
    draw_node(img, (195, 338), 22, INDIGO)
    return img


def service_course() -> Image.Image:
    img = canvas((800, 800))
    add_glow_blob(img, (95, 150, 700, 690), TEAL, 22, 72)
    left = mask_round_rect(img.size, (130, 330, 402, 590), 36)
    right = mask_round_rect(img.size, (398, 330, 670, 590), 36)
    add_glass(img, left, shadow_alpha=50, shadow_blur=24, outline_alpha=80)
    add_glass(img, right, shadow_alpha=50, shadow_blur=24, outline_alpha=80)
    spine = mask_line(img.size, [(400, 350), (400, 580)], 10)
    fill_solid(img, spine, WHITE, 86)
    draw_bars(img, [(185, 405, 320, 426), (180, 458, 350, 477), (462, 402, 604, 423), (460, 456, 610, 475)], 100)

    cap_top = mask_polygon(img.size, [(280, 245), (405, 180), (560, 246), (420, 315)])
    cap_band = mask_round_rect(img.size, (335, 300, 515, 356), 24)
    add_glass(img, cap_top, shadow_alpha=54, shadow_blur=23, outline_alpha=88)
    add_glass(img, cap_band, shadow_alpha=34, shadow_blur=12, outline_alpha=78)
    tassel = mask_line(img.size, [(532, 250), (584, 306), (570, 370)], 10)
    fill_gradient(img, tassel, [(0, rgba(TEAL_LIGHT, 210)), (1, rgba(INDIGO, 170))])

    curve = bezier((238, 620), (385, 525), (512, 430), (610, 260), 100)
    draw_curve(img, curve, 24, glow=True)
    lens = mask_ellipse_outline(img.size, (535, 178, 682, 325), 18)
    handle = mask_line(img.size, [(642, 300), (700, 360)], 18)
    fill_gradient(img, lens, [(0, rgba(WHITE, 150)), (1, rgba(TEAL, 195))], angle=145)
    fill_gradient(img, handle, [(0, rgba(TEAL, 200)), (1, rgba(INDIGO, 180))], angle=145)
    return img


def service_lectures() -> Image.Image:
    img = canvas((800, 800))
    add_glow_blob(img, (92, 100, 710, 700), INDIGO, 22, 76)
    screen = mask_round_rect(img.size, (150, 130, 650, 375), 38)
    add_glass(img, screen, shadow_alpha=62, shadow_blur=30, outline_alpha=88)
    graph = bezier((210, 302), (304, 260), (370, 310), (455, 226), 80) + bezier((455, 226), (508, 174), (570, 220), (602, 180), 60)
    draw_curve(img, graph, 14, glow=True)

    podium = mask_round_rect(img.size, (298, 438, 515, 655), 32)
    top = mask_round_rect(img.size, (258, 402, 555, 476), 28)
    add_glass(img, podium, shadow_alpha=58, shadow_blur=24, outline_alpha=84)
    add_glass(img, top, shadow_alpha=36, shadow_blur=16, outline_alpha=84)
    mic_stem = mask_line(img.size, [(408, 420), (408, 306)], 13)
    mic = mask_round_rect(img.size, (372, 252, 444, 342), 36)
    fill_gradient(img, mic_stem, [(0, rgba(TEAL, 210)), (1, rgba(INDIGO, 180))], angle=90)
    add_glass(img, mic, shadow_alpha=38, shadow_blur=16, outline_alpha=88)

    for x, y, r in [(168, 650, 26), (230, 675, 18), (585, 650, 24), (646, 685, 18), (106, 610, 16), (700, 604, 17)]:
        draw_node(img, (x, y), r, TEAL if x % 2 else INDIGO)
    return img


def problem_noise_to_method() -> Image.Image:
    img = canvas((1600, 900))
    rng = random.Random(41)
    add_glow_blob(img, (120, 110, 750, 760), INDIGO, 18, 85)
    add_glow_blob(img, (760, 150, 1480, 720), TEAL, 18, 90)

    for _ in range(34):
        x = rng.uniform(140, 640)
        y = rng.uniform(170, 710)
        pts = [(x, y)]
        for _i in range(rng.randint(2, 4)):
            pts.append((pts[-1][0] + rng.uniform(-80, 95), pts[-1][1] + rng.uniform(-70, 70)))
        line = mask_line(img.size, pts, rng.uniform(5, 12))
        fill_solid(img, line.filter(ImageFilter.GaussianBlur(1.5)), INDIGO if rng.random() < 0.6 else TEAL, rng.randint(45, 96))

    for _ in range(15):
        x, y = rng.uniform(170, 630), rng.uniform(185, 690)
        w, h = rng.uniform(42, 98), rng.uniform(30, 70)
        card = mask_round_rect(img.size, (x, y, x + w, y + h), 12)
        add_glass(img, card, shadow_alpha=24, shadow_blur=12, outline_alpha=52)

    fade_path = bezier((610, 570), (790, 535), (930, 420), (1090, 365), 90)
    draw_curve(img, fade_path, 28, glow=True)
    method = bezier((1035, 390), (1145, 372), (1225, 265), (1405, 225), 110)
    draw_curve(img, method, 42, glow=True)
    for p in [(630, 565), (940, 430), (1100, 360), (1405, 225)]:
        draw_node(img, p, 30, TEAL)
    return img


def method_magnifier_gem() -> Image.Image:
    img = canvas((1000, 1000))
    add_glow_blob(img, (170, 170, 850, 800), INDIGO, 24, 90)
    card = mask_round_rect(img.size, (190, 330, 760, 675), 52)
    add_glass(img, card, shadow_alpha=70, shadow_blur=36, outline_alpha=86)
    draw_bars(img, [(260, 412, 555, 438), (260, 485, 480, 512), (260, 558, 605, 584)], 105)
    for cx, cy, r in [(660, 420, 22), (690, 538, 16), (602, 606, 18)]:
        draw_node(img, (cx, cy), r, TEAL_LIGHT)

    lens = mask_ellipse(img.size, (470, 250, 825, 605))
    add_glass(
        img,
        lens,
        shadow_alpha=50,
        shadow_blur=28,
        outline_alpha=94,
        stops=[(0, rgba(WHITE, 72)), (0.52, rgba(TEAL_LIGHT, 60)), (1, rgba(INDIGO, 76))],
    )
    ring = mask_ellipse_outline(img.size, (458, 238, 837, 617), 22)
    fill_gradient(img, ring, [(0, rgba(WHITE, 170)), (0.5, rgba(TEAL, 220)), (1, rgba(INDIGO, 190))])
    handle = mask_line(img.size, [(760, 570), (875, 700)], 32)
    fill_gradient(img, handle, [(0, rgba(TEAL, 220)), (1, rgba(INDIGO, 190))], angle=135)

    gem = mask_polygon(img.size, [(595, 405), (680, 372), (765, 408), (735, 505), (680, 568), (620, 506)])
    fill_gradient(img, gem, [(0, rgba(WHITE, 146)), (0.35, rgba(TEAL_LIGHT, 235)), (1, rgba(POSITIVE, 218))])
    add_outline(img, gem, WHITE, 82)
    check = mask_line(img.size, [(632, 477), (670, 515), (738, 434)], 22)
    fill_solid(img, check, WHITE, 190)
    return img


def process_path_steps() -> Image.Image:
    img = canvas((1600, 900))
    add_glow_blob(img, (250, 160, 1410, 760), TEAL, 16, 95)
    path = bezier((1370, 650), (1120, 705), (990, 455), (780, 520), 90)
    path += bezier((780, 520), (570, 585), (455, 325), (245, 285), 90)
    draw_curve(img, path, 32, glow=True)
    for p, r, c in [
        ((1370, 650), 48, TEAL),
        ((1010, 540), 54, INDIGO),
        ((660, 505), 48, TEAL_LIGHT),
        ((245, 285), 54, TEAL),
    ]:
        draw_node(img, p, r, c)
    for box in [(1170, 548, 1288, 626), (820, 414, 950, 494), (460, 390, 580, 470), (220, 372, 340, 452)]:
        mask = mask_round_rect(img.size, box, 28)
        add_glass(img, mask, shadow_alpha=28, shadow_blur=16, outline_alpha=72)
    return img


def trust_shield_balance() -> Image.Image:
    img = canvas((700, 900))
    add_glow_blob(img, (75, 100, 625, 790), INDIGO, 24, 78)
    shield = mask_polygon(img.size, [(350, 105), (575, 195), (540, 525), (350, 778), (160, 525), (125, 195)])
    add_glass(img, shield, shadow_alpha=80, shadow_blur=36, outline_alpha=94)
    inner = mask_polygon(img.size, [(350, 172), (505, 235), (482, 500), (350, 676), (218, 500), (195, 235)])
    fill_solid(img, inner, WHITE, 26)

    check = mask_line(img.size, [(265, 450), (326, 512), (450, 360)], 34)
    fill_gradient(img, check, [(0, rgba(WHITE, 195)), (1, rgba(TEAL, 230))], angle=130)

    mast = mask_line(img.size, [(350, 275), (350, 575)], 12)
    beam = mask_line(img.size, [(238, 345), (462, 345)], 12)
    fill_solid(img, mast, WHITE, 118)
    fill_solid(img, beam, WHITE, 118)
    for x in (260, 440):
        arm = mask_line(img.size, [(350, 345), (x, 435)], 8)
        pan = mask_arc(img.size, (x - 58, 430, x + 58, 540), 0, 180, 10)
        fill_solid(img, arm, TEAL_LIGHT, 120)
        fill_solid(img, pan, TEAL_LIGHT, 120)
    return img


def quote_mark_deco() -> Image.Image:
    img = canvas((600, 600))
    add_glow_blob(img, (70, 75, 520, 520), INDIGO, 20, 65)
    for dx in (0, 210):
        top = mask_round_rect(img.size, (105 + dx, 128, 245 + dx, 300), 62)
        tail = mask_polygon(img.size, [(160 + dx, 272), (245 + dx, 272), (172 + dx, 452), (100 + dx, 452)])
        mark = ImageChops.lighter(top, tail)
        add_glass(
            img,
            mark,
            shadow_alpha=34,
            shadow_blur=22,
            outline_alpha=58,
            stops=[(0, rgba(WHITE, 86)), (0.52, rgba(INDIGO, 128)), (1, rgba(TEAL, 90))],
        )
    return img


def avatar_placeholder(seed: int = 1) -> Image.Image:
    palettes = [
        (INDIGO, TEAL),
        (INDIGO_DARK, TEAL_LIGHT),
        (INDIGO, POSITIVE),
    ]
    c1, c2 = palettes[(seed - 1) % len(palettes)]
    img = canvas((400, 400))
    bg = mask_ellipse(img.size, (24, 24, 376, 376))
    add_glass(
        img,
        bg,
        shadow_alpha=58,
        shadow_blur=22,
        outline_alpha=86,
        stops=[(0, rgba(WHITE, 96)), (0.45, rgba(c1, 210)), (1, rgba(c2, 172))],
    )
    head = mask_ellipse(img.size, (142, 94, 258, 210))
    shoulders = mask_round_rect(img.size, (92, 230, 308, 342), 78)
    silhouette = ImageChops.lighter(head, shoulders)
    fill_gradient(img, silhouette, [(0, rgba(WHITE, 168)), (1, rgba(INK, 88))], angle=160)
    add_outline(img, silhouette, WHITE, 40, 2)
    return img


def podcast_mic_bubble() -> Image.Image:
    img = canvas((900, 900))
    add_glow_blob(img, (130, 110, 790, 790), INDIGO, 24, 80)
    bubble = mask_round_rect(img.size, (150, 145, 745, 685), 100)
    tail = mask_polygon(img.size, [(610, 650), (735, 780), (655, 635)])
    bubble = ImageChops.lighter(bubble, tail)
    add_glass(img, bubble, shadow_alpha=70, shadow_blur=32, outline_alpha=88)

    mic = mask_round_rect(img.size, (365, 235, 535, 515), 82)
    add_glass(img, mic, shadow_alpha=46, shadow_blur=22, outline_alpha=92)
    for x in [405, 450, 495]:
        slot = mask_round_rect(img.size, (x, 282, x + 14, 438), 7)
        fill_solid(img, slot, WHITE, 92)
    stem = mask_line(img.size, [(450, 515), (450, 640)], 22)
    base = mask_round_rect(img.size, (330, 635, 570, 674), 20)
    fill_gradient(img, stem, [(0, rgba(TEAL, 220)), (1, rgba(INDIGO, 180))])
    add_glass(img, base, shadow_alpha=30, shadow_blur=12, outline_alpha=70)

    bars = []
    for idx, x in enumerate(range(205, 700, 45)):
        h = 36 + (idx % 5) * 18
        bars.append((x, 580 - h, x + 16, 580 + h))
    draw_bars(img, bars, 118)

    ring = mask_ellipse_outline(img.size, (620, 160, 780, 320), 15)
    gap = mask_polygon(img.size, [(705, 185), (802, 145), (764, 250)])
    ring = ImageChops.subtract(ring, gap)
    fill_gradient(img, ring, [(0, rgba(TEAL_LIGHT, 190)), (1, rgba(INDIGO, 160))])
    for p in [(760, 165), (790, 245), (688, 326)]:
        draw_sparkle(img, p, 18, TEAL_LIGHT)
    return img


def ibi_account_card() -> Image.Image:
    img = canvas((900, 900))
    add_glow_blob(img, (115, 120, 800, 780), TEAL, 20, 86)
    phone = mask_round_rect(img.size, (240, 90, 660, 790), 70)
    add_glass(img, phone, shadow_alpha=78, shadow_blur=38, outline_alpha=94)
    panel = mask_round_rect(img.size, (295, 168, 605, 665), 36)
    fill_solid(img, panel, WHITE, 38)
    draw_bars(img, [(330, 225, 440, 248), (330, 282, 548, 305), (330, 610, 570, 633)], 95)

    chart = bezier((330, 500), (380, 430), (425, 540), (492, 410), 70)
    chart += bezier((492, 410), (528, 340), (570, 385), (602, 310), 70)
    draw_curve(img, chart, 16, glow=True)
    for x, y1, y2 in [(365, 400, 480), (425, 360, 450), (505, 390, 505), (560, 310, 420)]:
        line = mask_line(img.size, [(x, y1), (x, y2)], 8)
        fill_solid(img, line, TEAL_LIGHT, 150)

    home = mask_round_rect(img.size, (395, 710, 505, 724), 7)
    fill_solid(img, home, WHITE, 108)
    draw_sparkle(img, (685, 188), 34, TEAL_LIGHT)
    draw_node(img, (220, 660), 34, INDIGO)
    return img


def cta_connect_bubbles() -> Image.Image:
    img = canvas((900, 600))
    add_glow_blob(img, (80, 80, 830, 530), INDIGO, 24, 75)
    left = mask_round_rect(img.size, (110, 165, 520, 395), 72)
    left_tail = mask_polygon(img.size, [(205, 382), (145, 490), (320, 398)])
    right = mask_round_rect(img.size, (385, 105, 790, 335), 72)
    right_tail = mask_polygon(img.size, [(690, 320), (770, 420), (596, 338)])
    add_glass(img, ImageChops.lighter(left, left_tail), shadow_alpha=56, shadow_blur=26, outline_alpha=88)
    add_glass(img, ImageChops.lighter(right, right_tail), shadow_alpha=56, shadow_blur=26, outline_alpha=88)
    bridge = mask_line(img.size, [(390, 305), (455, 260), (515, 285)], 18)
    fill_gradient(img, bridge, [(0, rgba(TEAL, 210)), (1, rgba(WHITE, 145))])
    for p in [(260, 275), (330, 275), (585, 220), (655, 220)]:
        draw_node(img, p, 20, TEAL_LIGHT)
    return img


def bg_mesh_gradient() -> Image.Image:
    img = canvas((2400, 1400))
    blobs = [
        ((300, 210, 1120, 920), INDIGO, 38, 120),
        ((1020, 90, 2100, 980), TEAL, 32, 135),
        ((720, 560, 1900, 1320), INDIGO_DARK, 28, 150),
        ((1350, 430, 2320, 1260), TEAL_LIGHT, 22, 145),
    ]
    for box, color, alpha, blur in blobs:
        add_glow_blob(img, box, color, alpha, blur)
    return img


def draw_floating_shape(kind: int, size: tuple[int, int] = (500, 500)) -> Image.Image:
    img = canvas(size)
    w, h = size
    add_glow_blob(img, (80, 80, w - 80, h - 70), TEAL if kind % 2 else INDIGO, 20, 52)
    if kind == 1:
        mask = mask_ellipse_outline(img.size, (105, 115, 395, 385), 34)
        fill_gradient(img, mask, [(0, rgba(WHITE, 130)), (0.5, rgba(TEAL, 205)), (1, rgba(INDIGO, 160))])
    elif kind == 2:
        mask = mask_polygon(img.size, [(250, 90), (390, 180), (355, 345), (180, 405), (105, 230)])
        add_glass(img, mask, shadow_alpha=46, shadow_blur=24, outline_alpha=84)
    elif kind == 3:
        mask = mask_round_rect(img.size, (115, 155, 385, 335), 70)
        add_glass(img, mask, shadow_alpha=46, shadow_blur=24, outline_alpha=84)
    elif kind == 4:
        mask = mask_polygon(img.size, [(250, 95), (405, 250), (250, 405), (95, 250)])
        add_glass(img, mask, shadow_alpha=46, shadow_blur=24, outline_alpha=84)
    elif kind == 5:
        mask = mask_ellipse(img.size, (125, 110, 375, 360))
        add_glass(img, mask, shadow_alpha=46, shadow_blur=24, outline_alpha=84)
        ring = mask_ellipse_outline(img.size, (85, 250, 410, 410), 18)
        fill_gradient(img, ring, [(0, rgba(TEAL_LIGHT, 185)), (1, rgba(INDIGO, 150))])
    else:
        mask1 = mask_round_rect(img.size, (115, 125, 315, 325), 42)
        mask2 = mask_round_rect(img.size, (210, 210, 390, 390), 42)
        add_glass(img, mask1, shadow_alpha=40, shadow_blur=22, outline_alpha=80)
        add_glass(img, mask2, shadow_alpha=40, shadow_blur=22, outline_alpha=80)
    return img


def floating_shapes() -> Image.Image:
    img = canvas((1200, 800))
    placements = [
        (draw_floating_shape(1, (500, 500)), (30, 120)),
        (draw_floating_shape(2, (500, 500)), (330, 30)),
        (draw_floating_shape(3, (500, 500)), (670, 160)),
        (draw_floating_shape(4, (500, 500)), (210, 380)),
        (draw_floating_shape(5, (500, 500)), (580, 360)),
        (draw_floating_shape(6, (500, 500)), (820, 20)),
    ]
    for shape, pos in placements:
        img.alpha_composite(shape, pos)
    return img


def grain_overlay() -> Image.Image:
    rng = np.random.default_rng(10)
    tile_alpha = rng.integers(0, 12, size=(128, 128), dtype=np.uint8)
    alpha = np.tile(tile_alpha, (8, 8))
    rgb = np.full((1024, 1024, 3), BG, dtype=np.uint8)
    arr = np.dstack([rgb, alpha])
    return Image.fromarray(arr, "RGBA")


def empty_404() -> Image.Image:
    img = canvas((1000, 1000))
    add_glow_blob(img, (160, 150, 850, 790), INDIGO, 22, 88)
    compass = mask_ellipse_outline(img.size, (320, 235, 680, 595), 24)
    fill_gradient(img, compass, [(0, rgba(WHITE, 155)), (0.5, rgba(TEAL, 210)), (1, rgba(INDIGO, 174))])
    needle = mask_polygon(img.size, [(506, 292), (555, 465), (503, 438), (450, 535), (475, 408)])
    add_glass(img, needle, shadow_alpha=30, shadow_blur=12, outline_alpha=80)
    path1 = bezier((220, 720), (340, 650), (420, 775), (520, 690), 80)
    path2 = bezier((592, 640), (680, 568), (720, 730), (815, 660), 80)
    draw_curve(img, path1, 24, glow=True)
    draw_curve(img, path2, 24, glow=True)
    for p in [(220, 720), (520, 690), (592, 640), (815, 660)]:
        draw_node(img, p, 24, TEAL_LIGHT)
    break_gap = mask_line(img.size, [(535, 672), (575, 650)], 18)
    fill_solid(img, break_gap.filter(ImageFilter.GaussianBlur(6)), (0, 0, 0), 0)
    draw_sparkle(img, (555, 664), 22, TEAL_LIGHT)
    return img


ASSETS = {
    "hero-growth-orbit": hero_growth_orbit,
    "service-guidance": service_guidance,
    "service-course": service_course,
    "service-lectures": service_lectures,
    "problem-noise-to-method": problem_noise_to_method,
    "method-magnifier-gem": method_magnifier_gem,
    "process-path-steps": process_path_steps,
    "trust-shield-balance": trust_shield_balance,
    "quote-mark-deco": quote_mark_deco,
    "avatar-placeholder": lambda: avatar_placeholder(1),
    "avatar-placeholder-a": lambda: avatar_placeholder(1),
    "avatar-placeholder-b": lambda: avatar_placeholder(2),
    "avatar-placeholder-c": lambda: avatar_placeholder(3),
    "podcast-mic-bubble": podcast_mic_bubble,
    "ibi-account-card": ibi_account_card,
    "cta-connect-bubbles": cta_connect_bubbles,
    "bg-mesh-gradient": bg_mesh_gradient,
    "floating-shapes": floating_shapes,
    "shape-01": lambda: draw_floating_shape(1),
    "shape-02": lambda: draw_floating_shape(2),
    "shape-03": lambda: draw_floating_shape(3),
    "shape-04": lambda: draw_floating_shape(4),
    "shape-05": lambda: draw_floating_shape(5),
    "shape-06": lambda: draw_floating_shape(6),
    "grain-overlay": grain_overlay,
    "empty-404": empty_404,
}


def main() -> None:
    for name, factory in ASSETS.items():
        image = factory()
        save_asset(name, image)
        print(f"{name}: {image.size[0]}x{image.size[1]}", flush=True)


if __name__ == "__main__":
    main()
