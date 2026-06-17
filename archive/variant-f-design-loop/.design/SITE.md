# Project Vision — Influ Capital

> Long-term memory for the design-loop. Read before every iteration.

## 1. Core Identity
| Field | Value |
|-------|-------|
| Project | Influ Capital — אדם ויינשטיין |
| Mission | Personal, human, ongoing investment *guidance* (NOT advice) from a licensed investment marketer — booked over WhatsApp. |
| Audience | Israeli investors / professionals, ages 30–40. |
| Voice | Modern, innovative, credible, human — never salesy. |
| Region | Israel — Hebrew, RTL, +972 phone format. |

## 2. Visual Language
- Primary vibe: Modern fintech product (clean, generous whitespace, high-contrast type).
- Secondary vibe: Human & credible (warm canvas, calm motion, WhatsApp-first).
- Anti-vibes: editorial serif, gamer/neon, generic-finance navy+gold.

## 3. Technical Setup
- Output: single `index.html`, vanilla HTML/CSS/JS, hash-router SPA (all "pages" reachable in one file).
- Fonts: Rubik + IBM Plex Sans Hebrew (Google Fonts).
- Dark: dramatic Ink bands within a light theme (not a global dark toggle).

## 4. Live Sitemap (routes inside index.html)
- [x] `#/` בית — hero, trust signals, 3 services, problem/solution, IBI, testimonials, lead CTA
- [x] `#/livui` ליווי השקעות אישי
- [x] `#/course` קורס השקעות ערך 1:1
- [x] `#/lectures` הרצאות לארגונים
- [x] `#/about` אודות
- [x] `#/contact` צור קשר — lead form + WhatsApp/call
- [x] `#/privacy` מדיניות פרטיות
- [x] `#/accessibility` הצהרת נגישות
- [x] `#/terms` תנאי שימוש וגילוי נאות
- [x] `#/cookies` מדיניות עוגיות

## 5. Roadmap — DONE (single-file build, one pass + self-review iterations)

## 6. Terminology Rule
NEVER "יועץ השקעות" / "ייעוץ השקעות" except as explicit negation inside the disclosure. Use "משווק השקעות" / "בעל רישיון שיווק השקעות מטעם הרשות לניירות ערך" / "ליווי השקעות אישי".

## 7. Rules of Engagement
1. One shared header/nav/footer reused across all routes (no drift).
2. All internal links point to real routes.
3. Cookie-gated analytics; marketing category reserved (don't load, don't block).
4. Accessibility: keyboard, ARIA, visible focus, reduced-motion, low-vision widget.
