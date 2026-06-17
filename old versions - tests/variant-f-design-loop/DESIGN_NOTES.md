# DESIGN_NOTES — Influ Capital · variant-f-design-loop

Built with the **design-loop** skill (jezweb/claude-skills · frontend plugin) and its sibling skills (`design-system`, `landing-page`, `design-review`). The deliverable is a single self-contained, vanilla, zero-build RTL `index.html`.

---

## How THIS skill drove the work (and what's distinctive)

`design-loop` is not a "draw me a page" skill — it's a **process**: a baton-passing loop where you (1) establish a documented design system, (2) generate one page at a time against it, (3) integrate into shared site structure, (4) **self-review/critique**, and (5) write the next baton — with **cross-page consistency as the #1 rule** ("the #1 risk in multi-page generation is *drift*").

So instead of one-shotting markup, I ran the actual loop and left its artifacts in `.design/`:

- `.design/SITE.md` — project vision, sitemap, terminology rule, rules of engagement (long-term memory).
- `.design/DESIGN.md` — the design system as a **source of truth** (palette roles, type scale, component specs, the copy-paste "DESIGN SYSTEM (REQUIRED)" generation block from the skill's §6).
- `.design/next-prompt.md` — the baton, now `page: _complete` (loop terminated cleanly).

Because the brief mandated a *single* file, I adapted the loop's multi-file sitemap into a **hash-router SPA** inside one `index.html`: each brief "page" is a `<section data-route>`. The loop's consistency rules map perfectly — one shared header/nav/footer markup is reused for every route, so there is literally zero drift by construction. I also translated the skill's Tailwind assumption into **vanilla CSS custom-property tokens** (`:root` = the DESIGN.md), keeping the *design-system thinking* without the build step.

The skill's **"Atmosphere & Vibe" mapping table** is what set the direction: I fused its *Modern* row ("clean, minimal, generous whitespace, high-contrast typography") with its *Professional* row ("sophisticated, trustworthy, subtle shadows, restricted premium palette") — and explicitly rejected its *Editorial* and *Luxury* rows (which lead to serif/magazine looks the brief forbids). That mapping is the single biggest "fingerprint" of design-loop on this build: a disciplined, token-driven, product-grade modern aesthetic rather than a vibe picked by intuition.

**Distinctive vs one-shot design skills:** a one-shot skill optimizes a single beautiful artifact. design-loop optimizes a *system* — documented tokens, reusable shared chrome, an explicit self-review gate, and a paper trail (`.design/`) that another iteration (human or CI) could pick up. The visible result is consistency and restraint, not flourish.

---

## Direction

Modern fintech **product** (2026), not a finance brochure. Confident, credible, human, WhatsApp-first. Deliberately **not** editorial/serif, **not** gamer/neon, **not** generic navy+gold finance.

## Fonts (Hebrew-capable, modern, distinctive)
- **Rubik** — display/headings (geometric Hebrew sans, weights 500/600/700). Modern, credible, slight roundness.
- **IBM Plex Sans Hebrew** — body/UI (400/500/600). Technical warmth that reads "product/credible."
- Deliberately avoids the forbidden defaults: no Frank Ruhl Libre, no Inter/Arial/Roboto, no editorial serif.

## Palette (restricted, premium — two accents only)
| Role | Value |
|------|-------|
| Primary · Iris | `#4F46E5` (CTAs, links, active, focus) |
| Ink (dark bands) | `#0C0E1A` / `#161A2E` |
| Canvas / Surface | `#F7F8FB` / `#FFFFFF` |
| Text | Graphite `#15172B` / Slate `#5B5E72` |
| Accent · Mint | `#19C39A` (proof/success/live-dot only) |
| Hairline border | `#E7E8F0` |

Light canvas with **dramatic Ink dark bands** for rhythm. Mint is rationed to "proof" moments (the live WhatsApp dot, checkmarks) so it never competes with Iris.

## Structure / sections (invented)
Hash-router SPA, 10 routes in one file:
- **Home** — Ink hero with a live **WhatsApp-conversation mock** (the signature element, dramatizing "guidance over WhatsApp") + trust strip → 3-service grid → problem/solution split → IBI account-opening band → testimonials → gradient CTA.
- **ליווי אישי** — 4-step "how it works" timeline + Ink "value-investing strategy" band.
- **קורס 1:1** — video placeholder + 5-module `<details>` syllabus accordion + "why 1:1" cards.
- **הרצאות** — value cards + speaker bio.
- **אודות** — portrait + ID-card grid + story.
- **צור קשר** — validated lead form + contact channels.
- **4 legal docs** — privacy / accessibility / terms+disclosure / cookies, with a shared sub-nav between them.

## 3–5 key decisions
1. **SPA hash-router inside one file** — the only way to honor "single index.html" *and* the loop's multi-page consistency model; shared chrome reused → no drift.
2. **WhatsApp chat mock as hero** — turns the brand's core promise ("מי שמלווה אותך פשוט בוואטסאפ?") into the literal first thing you see; far more on-brand than a generic finance hero.
3. **Two-accent discipline (Iris + Mint)** — straight from the skill's "2–3 colours + neutrals" rule; keeps it premium, not rainbow.
4. **Tokens-as-DESIGN.md** — every value lives in `:root` custom properties, so the accessibility high-contrast/large-text modes are one-line overrides rather than rewrites.
5. **Consent-gated, never-blocked analytics** — GA4 + Clarity load only after opt-in (with placeholder-ID guards so the demo throws nothing); a `loadMarketing()` stub is reserved but never auto-called, exactly as the brief requires.

## Self-review / iteration (the loop's step 4)
Ran the `design-review` checklist + brief-constraint lint after generation and **iterated**:
- **Fixed:** a duplicate `class` attribute on the Ink section (invalid HTML, `.on-ink` button styles weren't applying) → merged into one class.
- **Fixed:** footer copy contained "ייעוץ השקעות" outside the disclosure → reworded to "אין באמור באתר משום המלצה." Verified the term now appears **only once**, as the permitted negation inside the גילוי נאות (terms route).
- **Verified:** 10/10 `<section>` tags balanced; JSON-LD parses; no dead links (the two `#` anchors are phone/email, rewired by JS from `SITE_CONFIG` to `tel:`/`mailto:`); only runtime third-party request is Google Fonts (Clarity/GA conditional on consent); RTL, skip-link, visible focus, `prefers-reduced-motion`, and the low-vision accessibility panel all present.

## Business constraints — coverage
RTL `lang="he" dir="rtl"` · single vanilla file, no build · all pages reachable (hash router) · lead form → `SITE_CONFIG.formEndpoint` · WhatsApp + call from `SITE_CONFIG` · cookie-gated GA4 + Clarity, marketing reserved/not-loaded · keyboard nav, ARIA, visible focus, reduced-motion, low-vision panel (text size / high contrast / link underline, persisted) · SEO: title, description, robots, canonical, OG/Twitter, theme-color, JSON-LD (FinancialService + Person) · central `SITE_CONFIG` with TODO placeholders · terminology rule enforced.
