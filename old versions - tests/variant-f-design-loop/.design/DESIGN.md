# Design System: Influ Capital — אדם ויינשטיין

> Source of truth for visual consistency. Per design-loop, this block is consulted before every "page" (route) is generated and is the contract that prevents drift across the single-file SPA.

## 1. Visual Theme & Atmosphere

**Primary vibe:** Modern fintech *product* (2026), not a finance brochure. Clean, confident, generous whitespace, high-contrast typography — the "Modern" + "Professional" descriptors from the skill's Atmosphere table fused: *clean, minimal, generous whitespace, high-contrast type* with *sophisticated, trustworthy, restricted premium palette*.

**Secondary vibe:** Human & credible. Soft warmth in the off-white canvas, calm motion, conversational copy (WhatsApp-first).

**Anti-vibes (explicit):** NOT editorial/newspaper, NOT classic serif (no Frank Ruhl Libre), NOT gamer/neon, NOT generic-finance navy+gold. NOT Inter/Arial/Roboto.

The signature motif: an **iris/indigo "signal"** treated like a product accent (focus rings, pills, the live "WhatsApp dot"), a deep ink hero, and a fresh **mint** used only for proof/data — a disciplined two-accent system.

## 2. Colour Palette & Roles

| Role | Name | Value | Usage |
|------|------|-------|-------|
| Primary | Iris | `#4F46E5` | Primary CTAs, links, active nav, focus |
| Primary Hover | Iris Deep | `#4338CA` | Hover/active of primary |
| Primary Tint | Iris Wash | `#EEF0FE` | Soft fills, chips, hero glow |
| Ink | Ink | `#0C0E1A` | Hero/dark sections bg, headings on light |
| Ink-2 | Ink Slate | `#161A2E` | Dark surface cards |
| Background | Canvas | `#F7F8FB` | Page background (cool soft white) |
| Surface | Surface | `#FFFFFF` | Cards, inputs |
| Text Primary | Graphite | `#15172B` | Headings, body |
| Text Secondary | Slate | `#5B5E72` | Sub-copy, metadata |
| Border | Hairline | `#E7E8F0` | Dividers, card/input borders |
| Accent | Mint | `#19C39A` | Proof badges, success, data pops (sparingly) |
| Accent Tint | Mint Wash | `#E2F7F0` | Success/proof chip backgrounds |
| Focus | Focus | `#4F46E5` | 3px visible focus ring (offset) |

Contrast: Graphite on Canvas ≈ 14:1; white on Iris ≈ 6.2:1; white on Ink ≈ 17:1 — all WCAG AA+.

## 3. Typography

Pairing (Hebrew-capable, modern, distinctive — deliberately NOT serif, NOT Inter):
- **Display / Headings:** `Rubik` (geometric Hebrew sans, weights 500/600/700) — modern, credible, slightly rounded character.
- **Body / UI:** `IBM Plex Sans Hebrew` (weights 400/500/600) — technical warmth, excellent Hebrew, signals product credibility.

| Element | Font | Weight | Size (clamp) | Line height |
|---------|------|--------|------|-------------|
| Display H1 | Rubik | 700 | clamp(2.4rem, 6vw, 4.2rem) | 1.05 |
| H2 | Rubik | 600 | clamp(1.7rem, 3.5vw, 2.6rem) | 1.15 |
| H3 | Rubik | 600 | 1.25rem | 1.25 |
| Eyebrow | IBM Plex Sans Hebrew | 600 | 0.8rem, tracked, uppercase-ish | 1.4 |
| Body | IBM Plex Sans Hebrew | 400 | 1.05rem | 1.7 |
| Small | IBM Plex Sans Hebrew | 400 | 0.875rem | 1.5 |

Body measure capped ~68ch for readability.

## 4. Component Styles

- **Buttons:** Pill-ish radius 12px. Primary = Iris fill, white text, hover → Iris Deep + subtle lift (translateY -1px, soft shadow). Secondary = surface with hairline border. Ghost = text + arrow. WhatsApp = ink outline with mint live-dot.
- **Cards:** Surface white, 1px Hairline border, radius 18px, whisper-soft shadow `0 1px 2px rgba(12,14,26,.04), 0 12px 30px -18px rgba(12,14,26,.18)`. Hover lifts 2px.
- **Navigation:** Sticky frosted bar (`backdrop-blur`, surface/85), logo right (RTL), links, primary CTA. Active route = Iris text + underline pill. Mobile = slide-down sheet.
- **Forms:** 1px Hairline inputs, radius 12px, 14px padding, focus → Iris ring (box-shadow 0 0 0 3px Iris Wash + border Iris). Inline validation text in Slate/red.
- **Sections:** Generous spacing `clamp(4rem, 9vw, 7rem)` vertical. Max width 1120px, gutter 20px.
- **Motion:** 160–220ms ease, reveal-on-scroll fade/translate 12px, fully disabled under `prefers-reduced-motion`.

## 5. Layout Principles

Max content 1120px; comfortable 12-col mental grid; alternating Canvas / Ink / Surface bands for rhythm. Whitespace philosophy: **Generous** (premium, breathing room) — never cramped, never editorial-dense.

## 6. Design System Notes for Generation (copy into every baton)

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, single self-contained RTL Hebrew index.html, vanilla CSS (no Tailwind/build).
- Theme: Light canvas with dramatic Ink dark bands.
- Background: Cool soft white Canvas (#F7F8FB); Surface white (#FFFFFF); Ink dark (#0C0E1A).
- Primary: Iris (#4F46E5) for CTAs/links/active/focus; Mint (#19C39A) accent for proof only.
- Text: Graphite (#15172B) / Slate (#5B5E72).
- Font: Rubik (headings) + IBM Plex Sans Hebrew (body) via Google Fonts.
- Corners: 12px controls, 18px cards.
- Shadows: whisper-soft, layered, low-opacity.
- Spacing: Generous (clamp 4–7rem section padding), 1120px max width.
