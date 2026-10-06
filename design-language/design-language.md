# Simple Explainer — Design Language v2 · "Paper Circuit"

**Version:** 2.0.0 · frozen 2026-10-03 · **Status: FROZEN** (specimen variant A picked).
**Reference artifact:** [`specimen.html`](specimen.html) — every rule below is rendered there. **Source of truth for values:** [`tokens.css`](tokens.css). The specimen carries an *inlined copy* (`file://` pages cannot load linked CSS) — edit the master, then update the copy together.

The two standing tests for every rule: (1) *an agent that never saw the inspo images produces the same look from this guide alone*; (2) *nothing here reads as a sibling of the "annotated drafting sheet" genre (the Karpathy-post infographic) or the AI-infographic cluster* — no lettered panel tabs, no grid-paper panel bodies, no leader-bracket annotation apparatus.

---

## 1. Identity & principles

**The look in one sentence:** a printed midcentury page — warm paper, confident flat color, circuit-trace connections, giant type against whisper captions — with one playful gesture per composition.

Borrow the midcentury **attitudes** (curation, experimentation, play), not retro styling (IBM POV).

| Principle | Operationalization |
|---|---|
| **Paper first** | cream is the default ground; warm-gray plate and white are declared alternates; a composition has exactly one ground |
| **Color means category** | accents encode meaning, never decoration; 4 accents; exactly one focal zone per composition |
| **Traces carry flow** | orthogonal circuit traces are the *default* connector; leader lines attach labels only |
| **Size contrast is hierarchy** | giant display against whisper captions; hierarchy comes from type scale, space, and stroke — not from boxes |
| **Depth without shadows** | flat translucent register overlaps; never soft, never hard shadows |
| **One playful gesture, named** | budget 1–2 per composition, chosen from the closed list (§8) — never an undefined "quirky detail" |

---

## 2. Color

### 2.1 Grounds

| Ground | Hex | Use |
|---|---|---|
| paper (cream) | `#F2EDE2` | **default** |
| plate (warm gray) | `#E2DFD9` | the monochrome "plate" voice |
| paper-alt (white) | `#FFFFFF` | dense "sheet" layouts only |

### 2.2 Ink & grayscale register — contrast audited

| Token | Hex | Cream | Plate | White | Use |
|---|---|---|---|---|---|
| ink | `#1F1D1A` | **14.4 AAA** | 12.6 AAA | 16.8 AAA | body text, primary strokes |
| muted-ink | `#6E6A63` | 4.6 AA | 4.0 AA | 5.4 AA | captions/labels ≥ 12px only, **never body** |
| register-strong | `#4A463F` | 8.0 AAA | 7.1 AAA | 9.4 AAA | secondary strokes; usable as small text |
| register-mid | `#8A8478` | 3.2 graphics | 2.8 | 3.7 | secondary structure; graphics & large text only |
| register-faint | `#B5AFA2` | 1.9 fills | 1.6 | 2.2 | overlap layers & fills only |
| grid-line | `#DCD5C6` | — | — | — | hairline grids, dividers on cream |

### 2.3 Accents — rotation: blue → red → mustard → teal

| Token | Hex | Cream | Plate | White | Use |
|---|---|---|---|---|---|
| accent-blue | `#1E4FA8` | **6.6 AA** | 5.8 AA | 7.7 AA | **the anchor** — identity, structure, interaction; AA as text anywhere |
| accent-red | `#D93A2B` | 3.9 large | 3.4 large | 4.6 AA | **the pop** — primary emphasis; text only ≥ 24px bold; otherwise stroke/fill |
| accent-mustard | `#E8A13A` | fill-only | fill-only | 2.2 | coding fills |
| accent-teal | `#2E9EA6` | fill-only | fill-only | 3.2 | coding fills |

(Carbon Blue 60 `#0F62FE` was rejected: 4.28 on cream — too electric and AA-normal-fails. `#1E4FA8` keeps the IBM-blue identity and passes everywhere.)

### 2.4 Text on accent fills (verified)

| Fill | Text to use | Ratio |
|---|---|---|
| blue | white or cream | **7.7 AAA** (never ink — 2.2 ✗) |
| red | white | 4.6 AA (paper only large + bold) |
| mustard | **ink** | 7.7 AAA |
| teal | **ink** | 5.3 AA |

### 2.5 Hard rules

- Max 4 accents per composition; exactly one focal zone (G4); red is the pop, blue the anchor — on the plate voice, blue is usually the *only* accent spent.
- Color means category: two categories never share one accent; one category never changes accent mid-composition.
- No gradients as color; flat fills and flat translucency only.
- Never invent hexes outside the token set.

---

## 3. Typography

**Families:** IBM Plex Sans (display, headings, body, labels) · IBM Plex Mono (codes, data, metadata, axis labels). Self-hosted in [`fonts/`](fonts/), OFL license included — **no CDN fonts, ever**. Fallbacks: "Helvetica Neue", Arial / ui-monospace.

### 3.1 Type scale

| Token | Size | Weight | Use |
|---|---|---|---|
| type-1 | 12px | 500 | mono captions, axis labels, overlines |
| type-2 | 14px | 400 | captions, mono data |
| type-3 | 16px | 400 | body |
| type-4 | 20px | 500 | subheading |
| type-5 | 24px | 600 | heading |
| type-6 | 32px | 600 | display M |
| type-7 | 48px | 700 | display L |
| type-8 | 72px | 700 | display XL |
| type-9/10 | 96 / 120px | 700 | giant display (G3) |

Line height: display 1.05, body 1.5. Labels: uppercase, `letter-spacing: 0.08em`, 500. Label color: captions and micro-labels default to muted-ink; part/element labels may use register-strong when they read as content (8.0 AAA on cream).

### 3.2 Case policy

- All-caps allowed for display headings ≤ 4 words (incl. giant type); longer headings are 600 sentence case.
- Labels are always uppercase + tracked; nothing else is (acronyms excepted).

### 3.3 Numerals

- Data, stats, versions, dates, measurements: **always mono** (tabular contexts).
- Giant numerals as composition (G3) may be Sans 700 — they are *image* then, and must carry or point to real meaning (a data point, a step number), never decorate.

### 3.4 Optical correction (the 8-bar craft lesson)

Where two elements must *look* equal, adjust the values so they read equal: hairline strokes on dark grounds get +0.5px; reversed text steps up one weight; layered translucent numerals use stepped opacities (10→22→45%) so overlaps stay legible. Optical integrity is a rule, not an accident.

---

## 4. Line & form

### 4.1 Stroke ladder

| Weight | Token | Use |
|---|---|---|
| 1.5px | hairline | structure, dividers, leaders, chart grids |
| 2.5px | primary | traces, container outlines, node outlines |
| 4px | emphasis | hero flow line — sparingly; ink or the pop |

### 4.2 Dash vocabulary

| Pattern | Meaning |
|---|---|
| `6 4` | secondary flow, projection, "how it moves" |
| `2 4` | context, boundaries, "the world around it" |

Dashed is **never** the primary structure; if a line carries the main argument, it is solid.

### 4.3 Circuit traces (G1 — the default connector)

- Routing **orthogonal**, snapped to the 8px grid; direction changes via rounded 90° elbows, radius **12px** (`--se-elbow-radius`).
- Junctions and terminals: solder dots, radius **4px**, filled ink — the accent dot only when that terminal is the focal.
- Traces carry flow/relationship only — never decoration, never "and then this exists".
- Leader lines (hairline + terminal dot **r = 2px**) **attach labels**; labels never float unanchored. On the plate voice, traces stay ink.

### 4.4 Corners & shadow

- Corners **sharp (0)** by default; pill radius only for badges/chips.
- **No shadows of any kind** — soft or hard. Depth comes from the grayscale register and flat translucency (10–18% ink layers).

---

## 5. Spacing & grid

- Base unit **8px**; ramp `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`. No other spacing values.
- **Divisions of two** (IBM 2x-grid lesson): divide the live area into 2 / 4 / 8 / 16 columns; pick one per composition and keep it; align type to gutters, never to canvas edges.
- **Whitespace = importance:** the focal element has the most clear space (heroes ≥ 200px clear on at least two sides).
- Content max-width 1104px; prose column ≤ 720px; diagram padding ≥ 48px to the composition edge.

---

## 6. Composition grammar

### 6.1 Core gestures (identity — the specimen must show all)

| # | Gesture | Spec |
|---|---|---|
| G1 | Circuit traces | §4.3 — the default connector language |
| G2 | Pattern-as-highlight | a repeated field of ≥ 20 small marks (dots/squares/ticks) in register-mid or a muted fill; single instances swap to the pop to mark the exception; exceptions ≤ 15% of the field; every exception means something |
| G3 | Giant type | display up to 120px; numerals/caps may crop or bleed off edges; hierarchy stays readable — never impair reading order |
| G4 | Register + one focal zone | secondary structure in register grays with flat translucent overlaps (10–18% ink); exactly **one** saturated focal zone per composition |

### 6.2 Optional gestures (per composition)

- **G5 Banded registers:** thick ground bars (8px ink) as sequence stages; objects stand on the bars; dashed open-head arrows step down tier to tier. The ground bars carry the sequence — the dashed arrows between tiers are secondary markers (consistent with §4.2). The process-explainer layout — replaces hub-and-spoke.
- **G6 Drawing-office label grammar:** dimension lines, extension lines, arrowheads, centerline crosses, tick scales — as the *labeling system* for objects and mechanisms, not decoration.
- **G7 Texture:** §7.

### 6.3 General rules

- Sequences read top-down or left-right; numbered badges (pill, mono `01`) mark steps.
- **Legends always** when color, texture, or line-style codes exist.
- Container discipline: a box must earn its place (focal point, grouping, arrow target) — target < 30% of text inside containers.
- **Isomorphism:** remove all text — the structure alone must still communicate the idea.
- Direct labels over legends for charts; one shared scale; hairline grids in grid-line color.

---

## 7. Texture & print craft (opt-in)

- **Grain:** one page-level layer, turbulence-based, opacity ≤ 6% (`--se-texture-grain-opacity`); opt-in per composition; never per element; the video annex re-audits when video returns.
- **Hatch:** diagonal 45°, 8px pitch, paper keyline 2.5px — **texture as color-code only** (states/categories); never decoration.
- **Misregistration:** a deliberate 1–2px accent ghost only as a named playful gesture (G8 budget); never accidental.
- **Gradients: never.**

---

## 8. Playfulness (G8)

Budget **≤ 2 per composition** (a cap, not a floor — zero is fine), chosen from the closed list:

1. the pattern-as-highlight exception (G2 doubles as play when the exception is witty)
2. one oversized arc/swoosh slicing the composition
3. tiny scale figures in a large scene
4. one crooked detail — a tilted element that marks the odd one out
5. slight rotation of display caps (≤ 2°, the poster voice)
6. deliberate misregistration (§7)

A gesture must carry or mark meaning; if in doubt, cut it; never in safety-critical content.

---

## 9. Motion (stub — web reveals only; video deferred)

Entrance `cubic-bezier(0.16, 1, 0.3, 1)` · standard `cubic-bezier(0.33, 1, 0.68, 1)` · micro 200ms / standard 400ms · stagger 100ms · entrances only, one beat at a time; no bounce, no elastic; `prefers-reduced-motion` honored. The video annex returns with the video revision.

---

## 10. Voice bridge

The writing style guide (`skills/explainer-writing/references/STYLEGUIDE.md`) owns language. Tone only here: confident and concrete; curious, never condescending (no "obviously", "simply", "as everyone knows"); dry wit in asides and captions only — never in definitions or safety-critical statements; headings name the idea, not the format.

---

## 11. Do / Don't

**Do (audit questions):**
- Have we removed everything gratuitous?
- Cover the name — is the execution still ours? (identity test)
- Remove all text — does the structure still explain? (isomorphism)
- Is there one pop and one playful gesture — and do both mean something?
- Is every value a token from `tokens.css`?

**Don't (the standing avoid list):**
rainbow metaball hubs · corporate isometric mini-scenes · pastel halo washes · flat-line icon banners · serpentine ribbon timelines · dark-mode glowing wireframes · soft drop shadows · hard offset shadows · Bauhaus-revival tiles as identity · fake-data techno-blueprints · gradient text or backgrounds · decorative color · CDN fonts · lorem ipsum · placeholder content · **lettered panel tabs, grid-paper panel bodies, leader-bracket annotation apparatus** (the annotated-sheet tells).

---

## 12. Version

**v2.0.0 — frozen 2026-10-03.** Specimen: [`specimen.html`](specimen.html) (variant A "Paper Circuit"). Changelog history: none — first frozen v2 release. Future: token removals/renames are breaking; additions minor; nudges from review patch — one version line here, no ceremony.
