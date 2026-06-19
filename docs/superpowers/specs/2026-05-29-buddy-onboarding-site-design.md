# Buddy — Junior Onboarding Manual (Website) — Design Spec

**Date:** 2026-05-29
**Author:** grochal@kros.sk (with Claude)
**Status:** Approved design — ready for implementation planning

## 1. Purpose

An interactive, bilingual (SK/EN) website a new junior developer at KROS spends
their **first week** learning from. It teaches the technical concepts in
`Check-list.docx` **from the DevOps section onward** (the first two sections —
*Soft skills* and *Zaúčanie – videá* — are explicitly out of scope).

**Teaching model (agreed):** mostly a self-paced mini-course (option B) with
launchpad/orientation elements (option A) folded in:
- **Universal topics** (async, Git, status codes, DI, …) get full teaching
  content: prose + examples + visuals + quiz.
- **Company-specific topics** (Kros.Framework, KORM, TeaPie, AppHost, products,
  BE UCTO 902 10 skupina, …) get orientation content driven by bullets/links the
  user supplies, surfaced inline as "🏢 V KROSe" callouts.
- A **check-off + progress** layer sits over everything.

**Authoring is iterative:** the site is built topic-by-topic across multiple
sessions. The user reviews each topic; company-specific content is fed by the
user (bullets, links, snippets) and expanded by Claude.

## 2. Goals & non-goals

**Goals**
- Easy to understand, fun to learn from, visually following the KROS brand.
- Bilingual with a top-right SK/EN switch; instant, no reload, persisted.
- Maintainable topic-by-topic with **no build step**.
- Local-first development; free deployment **later** (GitHub Pages / Azure Static
  Web Apps). Deployment is postponed — not part of the initial build.

**Non-goals (YAGNI)**
- No backend, no database, no analytics, no accounts.
- No SEO/i18n URL routing (`/en/` prefixes).
- No streaks, leaderboards, daily nags.
- No embedded live REPL/terminal (juniors use real Visual Studio next week).
- No SSG/framework, no `npm install`.

## 3. Audience & language

- One Slovak-native junior developer, first week on the job.
- **Default language: SK.** EN one click away. Persisted in `localStorage`.
- **SK content rule:** Slovak prose, English technical terms kept in English
  (`async`, `await`, `endpoint`, `Service Bus`, `Feature Flag`, `pull request`).
- **EN content rule:** fully English.
- Brand/product proper nouns (Digi, Omega, Fakturácia, Firma, e-Faktúra,
  Účtovníctvo, Kros.Framework, KORM, TeaPie) stay identical in both languages.

## 4. Tech stack & format

- **Static HTML + CSS + vanilla JS.** No framework, no build step, no
  `node_modules`.
- **Content as Markdown** (one file per topic per language), rendered client-side
  with a dropped-in markdown lib (`marked.js`) + syntax highlighter (`prism.js`),
  both vendored in `assets/vendor/` (no CDN runtime dependency).
- **Markdown loading uses `fetch()`** → requires a static server even locally
  (`file://` will not work). A `serve.cmd` provides a one-command local server.
- **Hosting:** local files for dev now; GitHub Pages or Azure Static Web Apps
  later. Asset paths kept relative for easy static deploy.

## 5. Folder layout

```
buddy-site/
├── index.html                # Hub page
├── topic.html                # Generic topic page (reads ?id=<topic>)
├── assets/
│   ├── css/
│   │   ├── tokens.css        # Colors, fonts, spacing variables
│   │   ├── base.css          # Resets, typography, layout primitives
│   │   └── components.css    # Cards, buttons, quiz, tooltip, progress
│   ├── js/
│   │   ├── app.js            # Bootstrap, routing, language toggle wiring
│   │   ├── i18n.js           # SK/EN switching + persistence (strings.json)
│   │   ├── progress.js       # localStorage progress + XP + badges + confetti
│   │   ├── content.js        # Loads topic markdown, builds side-nav, renders
│   │   ├── glossary.js       # Tooltip rendering from glossary.json
│   │   └── interactives/     # quiz.js, match.js, diagram.js
│   ├── img/                  # Logos, illustrations, icon SVGs, badge SVGs
│   └── vendor/               # marked.js, prism.js (+ prism css)
├── topics/
│   ├── _index.json           # Master list: id, title{sk,en}, icon, order, status
│   ├── <topic>/
│   │   ├── <topic>.sk.md
│   │   ├── <topic>.en.md
│   │   ├── quiz.json         # bilingual questions
│   │   ├── match.json        # optional drag-drop match game data
│   │   └── diagram.svg       # optional clickable diagram (arch/azure/client-server)
│   └── …
├── assets/js/strings.json    # UI chrome strings (SK/EN)
├── assets/js/glossary.json   # shared bilingual glossary
├── README.md                 # run locally, add a topic
└── serve.cmd                 # start local static server (py -m http.server 8000)
```

- One folder per topic; all its assets co-located → easy to add/PR a single topic.
- `_index.json` is the only file edited to **register** a topic (title both langs,
  icon, order, `status: "draft" | "ready"`).
- Draft topics show a "📝 V príprave" pill on the hub instead of a progress bar,
  so the site can ship early with empty cards.

## 6. Visual identity (KROS-aligned)

**Colors** (`tokens.css`; official KROS brand palette from `Obrázok.png`):
- `--kros-navy: #000A4D` — primary brand (Pantone 2757 C; headings, primary
  buttons, header, hero base, active state)
- `--kros-cyan: #5AD3FF` — bright accent (Invent bledo modrá; links, progress
  fill, highlights, hover glow)
- `--kros-purple: #66003C` — secondary accent (Imidžová purpurová; badges,
  special emphasis)
- `--kros-blue-grey: #D1DBE8` — soft backgrounds, card tints, dividers
  (Korporátna belasá)
- `--kros-beige: #F6B696` — warm accent (Doplnková béžová; friendly highlights,
  warning tint)
- `--ink: #0A0E27` / `--ink-muted: #5B6577` — text (ink derived from navy)
- `--bg: #FFFFFF` / `--bg-elev: #F4F7FB`
- `--success: #2BB673` · `--warn: #F2A93B` · `--danger: #E5484D` (functional
  states; warn can use beige tint for brand cohesion)
- `--gradient-hero: linear-gradient(135deg,#000A4D 0%,#5AD3FF 100%)` (navy→cyan,
  the signature KROS look; used sparingly in hero and topic headers)

**Typography**
- `Inter, "Segoe UI", system-ui, sans-serif`. Scale: H1 36 / H2 24 / H3 18 /
  body 16 / small 14. Headings 700, body 400.
- Code: `"JetBrains Mono", Consolas, monospace`, 14px, Prism-highlighted.

**Components**
- **Topic cards:** white, 16px radius, soft shadow `0 2px 8px rgba(0,10,77,.08)`,
  32px padding, hover lift + slight scale; 56×56 icon tile tinted
  `--kros-blue-grey`; title 20px bold; cyan progress bar + "x / y · %"; ★ when 100%.
- **Buttons:** pill (`radius:999px`), `--kros-navy` fill, white text,
  `padding:10px 22px`, hover lightens toward cyan / adds cyan glow; secondary =
  navy outline + navy text.
- **Tooltips (glossary):** white card, 12px radius, subtle shadow, cyan left accent.
- **Callouts** (markdown blockquote, leading emoji selects style):
  - `> 💡 Tip:` → cyan/blue-grey info box
  - `> ⚠️ Pozor:` → beige warning box
  - `> 🏢 V KROSe:` → company-context box (`--kros-blue-grey` bg, navy/purple accent)
- **Confetti/badge unlock:** ~2s small SVG/canvas burst in navy/cyan/purple
  (no third-party lib).

**Mood:** deep KROS-navy base with bright-cyan accents, airy rounded cards, one
moment of delight per topic. Anti-Duolingo: confetti opt-out, no
streaks/nags/leaderboards.

## 7. Hub page (`index.html`)

- **Sticky header (64px):** KROS logo (→ hub), title, SK|EN toggle (right).
- **Hero (gradient ~200px):** greeting + tagline; overall progress bar
  ("4 / 10 tém"); XP total; **Resume** button → most-recent or first-incomplete
  topic.
- **Topic grid:** 3 col desktop / 2 tablet / 1 mobile. Cards as in §6. Draft cards
  show "📝 V príprave".
- **Badges row:** unlocked in color, locked grayscale + 🔒; click → tooltip
  (earned date / unlock hint).
- **Footer:** light note ("Otázky? Pýtaj sa mentora"), GH repo link, animations
  toggle, reset-progress link.
- **Cards (11):** `0 Vitaj/Welcome`, then 1–10 per the topic map (§11). Welcome is
  first tile and balances the grid.

## 8. Topic page (`topic.html`)

- One shared template; reads `?id=<topic>`, loads `_index.json` entry + the
  active-language markdown.
- **Header:** breadcrumb `← Hub | <Topic>`, SK|EN toggle.
- **Topic header (gradient):** icon + title + one-line summary + topic progress
  ("3 / 5") + XP.
- **Left sticky side-nav:** auto-built from `##` headings; each item shows a
  filled/empty dot per check-off state; "Quiz →" entry at bottom.
- **Content:** markdown-rendered. Each **sub-topic = one `##` heading**. Features:
  - Syntax-highlighted code blocks with copy button.
  - Glossary tooltips via custom syntax `[Term]{.term}` → `glossary.json`.
  - Callouts (§6).
  - Clickable diagram via `[diagram:<name>]` placeholder (Architecture, Azure,
    Client-Server only) → SVG with clickable regions + side-panel explanations.
  - Drag-drop match game via `[match:<name>]` placeholder → `match.json`
    (e.g., status code ↔ meaning; Git command ↔ effect; WI state ↔ meaning).
  - **Check-off button** per sub-topic ("☐ Rozumiem tomu") → toggles, persists,
    fills side-nav dot, +5 XP. Re-clickable.
- **End-of-topic quiz:** 3–5 MCQs from `quiz.json`, instant per-question feedback
  (✓/✗ + 1-line explain), final score banner; ≥80% passes → unlocks badge +
  confetti + bonus XP.
- **Next link:** auto-points to next topic by `_index.json` order.

## 9. Internationalization

- Top-right `SK | EN`; active bold+underlined blue; instant swap, no reload; URL
  unchanged; persisted `buddy.lang` (default **SK**).
- UI chrome via `data-i18n="key"` → `strings.json`.
- Prose via per-language markdown files (re-fetched on toggle).
- **Progress/check-offs are language-independent.**
- Glossary + quizzes bilingual (both languages embedded per entry/question).
- Authoring flow per topic: write SK together first (user reviews KROS context),
  Claude generates EN, user skims EN terminology.

## 10. Progress, XP, badges

**localStorage key `buddy.progress`:**
```json
{
  "version": 1, "lang": "sk", "lastVisited": "devops",
  "topics": {
    "devops": { "completed": ["backlog","wi-hierarchy"], "quizScore": 4,
                "quizPassed": true, "completedAt": "2026-06-02T09:14:00Z" }
  },
  "xp": 320, "badges": ["git-master"]
}
```

**XP:** check-off +5; pass quiz (≥80%) +25; full topic (all sub-items + quiz)
+50 bonus & badge. No levels; running total in hero (~800–1000 total).

**Badges (one/topic):** 🚀 DevOps Rookie · ☁ Cloud Native · # C# Apprentice ·
🏛 Architecture Aware · 📦 Library Explorer · 🌿 Git Master · 🔁 PR Practitioner ·
🐞 Local Hero · 🌐 Network Native · 🧾 KROS Insider. Locked = grayscale + 🔒.
Unlock = polite confetti + slide-in + XP tick; optional sound via footer toggle.

**Controls:** footer "↺ Resetovať pokrok" (confirm) for re-use by next junior;
hidden `?debug=1` for complete-all / reset / trigger-confetti during dev.

**Guardrails:** no streaks/nags/leaderboards; confetti opt-out; everything
non-blocking and any-order; all data local-only.

## 11. Topic map & build order

| # | Card | Sub-items | Source |
|---|------|-----------|--------|
| 0 | Vitaj/Welcome | How Buddy works · Where to ask · Your week · Shortcuts | Claude |
| 1 | DevOps | Backlog vs Sprint · WI hierarchy (Epic→Feature→US/Bug→Task) · Stavy úloh · Nástenky/Kód/Pipelines · Pipelines (Kubernetes) · Prostredia · FFs | Mixed |
| 2 | Azure | Prístupové práva · Typy resourcov · KV+config+settings · Prostredia | Mixed |
| 3 | C# | Async metódy · IEnumerable & materializácia · Service Bus (topic/subscription/queue) · Návrhové vzory · CQRS · Middlewares · DI | Mostly Claude |
| 4 | Architektúra | Microservices · Libky/ASP.NET/AzFun/AppHost | Mixed (diagram) |
| 5 | Knižnice & služby | KORM · TeaPie · Postman · XUnit · NSubstitute · Redis · Kros.Framework · Vyťažovanie (LLM, IsDoc, FS) | Heavily user |
| 6 | Git | Vlastná vetva · Merge · Master · Production · Revert/Reset · Cherry-pick | Mostly Claude (match) |
| 7 | PR procesy | Draft · Komentáre · BE UCTO 902 10 skupina · AI review | Mixed |
| 8 | Lokálne ladenie | AppHost vs Local config · Postman (prostredia) · appsettings.local.json · AzFun local.settings.json · Service Bus consumers (non-http) | Heavily user |
| 9 | Klient-Server | Inšpektor (elementy/sieť) · Status kódy (2xx/4xx/5xx) · Endpointy · API gateway · SignalR · WebAssembly | Mostly Claude (match+diagram) |
| 10 | Produkty | Digi · Omega · Fakturácia · Firma · e-Faktúra · Účtovníctvo | Heavily user |

**Build order:**
1. Scaffold + Welcome (working site; topics 1–10 = `draft`).
2. C# (rich draft → user review).
3. Git (+ match game; confirm KROS master/Production model).
4. Klient-Server (+ diagram).
5. Then company-heavy topics as the user feeds content: Libraries, Local
   debugging, Products, DevOps, Azure, PR, Architecture.

Goal: after session 1, a clickable navigable site with one complete topic that
demonstrates the full experience.

## 12. Open items for later

- KROS logo asset (brand SVG/PNG). Palette finalized from `Obrázok.png`.
- Mentor name for footer contact.
- Confirm Python available for `serve.cmd`; else PowerShell static server fallback.
- Deployment target chosen at deploy time (GitHub Pages vs Azure Static Web Apps).
