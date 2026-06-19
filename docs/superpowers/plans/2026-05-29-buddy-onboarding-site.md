# Buddy Onboarding Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual (SK/EN) static onboarding website engine plus a complete Welcome card and C# topic, proving the full learning experience end-to-end.

**Architecture:** A no-build-step static site (HTML + CSS + vanilla JS ES modules). Pure-logic modules (i18n, progress/XP, content transforms, quiz scoring) are unit-tested with Node's built-in test runner. DOM/visual modules are verified manually in a browser served by a tiny zero-dependency Node static server. Topic content lives in per-topic Markdown files (one per language) rendered client-side. Progress is stored in `localStorage`; XP and badges are *derived* from that state to avoid drift.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla JS (ES modules), `marked` + `prismjs` (vendored, no CDN), Node ≥18 built-in test runner (`node --test`), Node static server (`serve.js`).

**Scope:** This plan delivers the engine + Welcome + C# topic only. Other topics (DevOps, Azure, Architecture, Libraries, Git, PR, Local debugging, Client-Server, Products) are authored in later content sessions that reuse this engine — out of scope here. See spec §11.

**Spec:** `docs/superpowers/specs/2026-05-29-buddy-onboarding-site-design.md`

**Conventions used throughout:**
- All paths are relative to `D:\Projects\Topics\Buddy\buddy-site\` unless noted.
- Run all commands from the `buddy-site/` directory.
- KROS palette (from spec §6): navy `#000A4D`, cyan `#5AD3FF`, purple `#66003C`, blue-grey `#D1DBE8`, beige `#F6B696`.
- Derived-state rule: `localStorage` stores only raw facts (which sub-items checked, quiz results, lang, lastVisited). XP totals and earned badges are computed from that + topic metadata.

---

## Task 0: Repository & folder scaffold

**Files:**
- Create: `buddy-site/.gitignore`
- Create: `buddy-site/.nojekyll` (for future GitHub Pages — serves `_`-prefixed paths)

- [ ] **Step 1: Initialize git repo at project root**

Run from `D:\Projects\Topics\Buddy`:
```bash
git init
git config core.autocrlf true
```
Expected: `Initialized empty Git repository`.

- [ ] **Step 2: Create the folder skeleton**

Run from `D:\Projects\Topics\Buddy`:
```bash
mkdir -p buddy-site/assets/css buddy-site/assets/js/interactives buddy-site/assets/img buddy-site/assets/vendor buddy-site/topics/welcome buddy-site/topics/csharp buddy-site/tests
```

- [ ] **Step 3: Write `.gitignore`**

Create `buddy-site/.gitignore`:
```
# OS / editor
Thumbs.db
.DS_Store
.vscode/
*.log
```

- [ ] **Step 4: Write `.nojekyll`**

Create `buddy-site/.nojekyll` (empty file):
```
```

- [ ] **Step 5: Commit**

```bash
git add buddy-site/.gitignore buddy-site/.nojekyll
git commit -m "chore: scaffold buddy-site folder structure and git repo"
```

---

## Task 1: Design tokens (`tokens.css`)

**Files:**
- Create: `buddy-site/assets/css/tokens.css`

- [ ] **Step 1: Write the tokens file**

Create `buddy-site/assets/css/tokens.css`:
```css
/* KROS brand palette + design tokens (spec §6) */
:root {
  /* Brand */
  --kros-navy: #000A4D;
  --kros-navy-700: #0A1A6B;     /* lighter navy for hover */
  --kros-cyan: #5AD3FF;
  --kros-cyan-600: #2BB4E8;     /* darker cyan for text-on-white contrast */
  --kros-purple: #66003C;
  --kros-blue-grey: #D1DBE8;
  --kros-beige: #F6B696;

  /* Surfaces & ink */
  --bg: #FFFFFF;
  --bg-elev: #F4F7FB;
  --ink: #0A0E27;
  --ink-muted: #5B6577;
  --border: #E2E8F0;

  /* Functional */
  --success: #2BB673;
  --warn: #F2A93B;
  --danger: #E5484D;

  /* Gradient (signature KROS look) */
  --gradient-hero: linear-gradient(135deg, #000A4D 0%, #5AD3FF 100%);

  /* Typography */
  --font-sans: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", Consolas, "Courier New", monospace;
  --fs-h1: 36px;
  --fs-h2: 24px;
  --fs-h3: 18px;
  --fs-body: 16px;
  --fs-small: 14px;

  /* Spacing / shape */
  --radius-card: 16px;
  --radius-pill: 999px;
  --radius-box: 12px;
  --shadow-card: 0 2px 8px rgba(0, 10, 77, 0.08);
  --shadow-card-hover: 0 8px 24px rgba(0, 10, 77, 0.14);
  --space-1: 4px;  --space-2: 8px;  --space-3: 16px;
  --space-4: 24px; --space-5: 32px; --space-6: 48px;
  --header-h: 64px;
  --maxw: 1120px;
}
```

- [ ] **Step 2: Commit**

```bash
git add buddy-site/assets/css/tokens.css
git commit -m "feat: add KROS design tokens"
```

---

## Task 2: Base styles (`base.css`)

**Files:**
- Create: `buddy-site/assets/css/base.css`

- [ ] **Step 1: Write the base stylesheet**

Create `buddy-site/assets/css/base.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  color: var(--ink);
  background: var(--bg);
  line-height: 1.6;
}
h1, h2, h3 { line-height: 1.25; font-weight: 700; color: var(--kros-navy); }
h1 { font-size: var(--fs-h1); margin: 0 0 var(--space-3); }
h2 { font-size: var(--fs-h2); margin: var(--space-5) 0 var(--space-3); }
h3 { font-size: var(--fs-h3); margin: var(--space-4) 0 var(--space-2); }
p  { margin: 0 0 var(--space-3); }
a  { color: var(--kros-cyan-600); text-decoration: none; }
a:hover { text-decoration: underline; }
img { max-width: 100%; }

.container { max-width: var(--maxw); margin: 0 auto; padding: 0 var(--space-4); }

/* Sticky header */
.site-header {
  position: sticky; top: 0; z-index: 50;
  height: var(--header-h);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg); border-bottom: 1px solid var(--border);
  padding: 0 var(--space-4);
}
.site-header .brand { display: flex; align-items: center; gap: var(--space-2);
  font-weight: 700; color: var(--kros-navy); }
.site-header .brand img { height: 28px; }

/* Language toggle */
.lang-toggle { display: inline-flex; gap: var(--space-1); font-size: var(--fs-small); }
.lang-toggle button {
  background: none; border: none; cursor: pointer; padding: 4px 6px;
  color: var(--ink-muted); font: inherit;
}
.lang-toggle button.active {
  color: var(--kros-navy); font-weight: 700; text-decoration: underline;
  text-underline-offset: 4px; text-decoration-color: var(--kros-cyan);
}

/* Hero */
.hero {
  background: var(--gradient-hero); color: #fff;
  padding: var(--space-6) var(--space-4);
}
.hero h1 { color: #fff; }
.hero .tagline { opacity: 0.92; margin-bottom: var(--space-4); }

/* Generic progress bar */
.progress { height: 8px; background: rgba(255,255,255,0.25);
  border-radius: var(--radius-pill); overflow: hidden; }
.progress > span { display: block; height: 100%; background: var(--kros-cyan);
  border-radius: var(--radius-pill); transition: width .3s ease; }
.progress.on-light { background: var(--kros-blue-grey); }

/* Utility */
.muted { color: var(--ink-muted); }
.hidden { display: none !important; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; }
```

- [ ] **Step 2: Commit**

```bash
git add buddy-site/assets/css/base.css
git commit -m "feat: add base layout and typography styles"
```

---

## Task 3: Component styles (`components.css`)

**Files:**
- Create: `buddy-site/assets/css/components.css`

- [ ] **Step 1: Write the component stylesheet**

Create `buddy-site/assets/css/components.css`:
```css
/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  border: 2px solid var(--kros-navy); background: var(--kros-navy); color: #fff;
  border-radius: var(--radius-pill); padding: 10px 22px; cursor: pointer;
  font: inherit; font-weight: 600; transition: box-shadow .2s, background .2s;
}
.btn:hover { background: var(--kros-navy-700);
  box-shadow: 0 0 0 4px rgba(90,211,255,0.35); text-decoration: none; }
.btn.secondary { background: transparent; color: var(--kros-navy); }
.btn.secondary:hover { background: var(--bg-elev); box-shadow: none; }

/* Topic card grid */
.card-grid {
  display: grid; gap: var(--space-4);
  grid-template-columns: repeat(3, 1fr);
  margin: var(--space-5) 0;
}
@media (max-width: 900px) { .card-grid { grid-template-columns: repeat(2,1fr);} }
@media (max-width: 600px) { .card-grid { grid-template-columns: 1fr;} }

.topic-card {
  display: flex; flex-direction: column; gap: var(--space-2);
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius-card); padding: var(--space-5);
  box-shadow: var(--shadow-card); text-decoration: none; color: inherit;
  transition: box-shadow .2s, transform .2s;
}
.topic-card:hover { box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px); text-decoration: none; }
.topic-card .icon {
  width: 56px; height: 56px; border-radius: var(--radius-box);
  background: var(--kros-blue-grey); display: grid; place-items: center;
  font-size: 28px;
}
.topic-card h3 { margin: var(--space-2) 0 0; }
.topic-card .desc { color: var(--ink-muted); font-size: var(--fs-small);
  flex: 1; margin: 0; }
.topic-card .card-progress { display: flex; align-items: center; gap: var(--space-2);
  font-size: var(--fs-small); color: var(--ink-muted); }
.topic-card .card-progress .progress { flex: 1; }
.topic-card .star { color: var(--kros-cyan-600); }
.pill {
  align-self: flex-start; font-size: 12px; font-weight: 600;
  padding: 4px 10px; border-radius: var(--radius-pill);
  background: var(--bg-elev); color: var(--ink-muted);
}
.pill.draft { background: #FFF4E6; color: #9A5B00; }

/* Badges row */
.badges { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: var(--space-4) 0; }
.badge { display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
  width: 96px; text-align: center; font-size: 12px; }
.badge .medal { width: 56px; height: 56px; border-radius: 50%;
  display: grid; place-items: center; font-size: 26px;
  background: var(--kros-purple); color: #fff; }
.badge.locked .medal { background: var(--border); color: var(--ink-muted); filter: grayscale(1); }

/* Topic page layout */
.topic-layout { display: grid; grid-template-columns: 240px 1fr; gap: var(--space-5);
  align-items: start; margin: var(--space-5) 0; }
@media (max-width: 800px) { .topic-layout { grid-template-columns: 1fr; } }
.side-nav { position: sticky; top: calc(var(--header-h) + var(--space-3));
  border-right: 1px solid var(--border); padding-right: var(--space-3); }
.side-nav ol { list-style: none; margin: 0; padding: 0; }
.side-nav li { margin: var(--space-1) 0; }
.side-nav a { display: flex; align-items: center; gap: var(--space-2);
  color: var(--ink-muted); padding: 4px 0; }
.side-nav a.active { color: var(--kros-navy); font-weight: 600; }
.side-nav .dot { width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid var(--kros-blue-grey); flex: none; }
.side-nav .dot.done { background: var(--success); border-color: var(--success); }

/* Sub-topic + check-off */
.subtopic { padding-bottom: var(--space-4); border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-4); }
.checkoff { display: inline-flex; align-items: center; gap: var(--space-2);
  border: 2px solid var(--kros-navy); background: #fff; color: var(--kros-navy);
  border-radius: var(--radius-pill); padding: 6px 16px; cursor: pointer; font: inherit; }
.checkoff.done { background: var(--success); border-color: var(--success); color: #fff; }

/* Callouts */
.callout { border-left: 4px solid var(--kros-cyan); background: var(--bg-elev);
  padding: var(--space-3); border-radius: var(--radius-box); margin: var(--space-3) 0; }
.callout.tip { border-color: var(--kros-cyan); background: #ECF9FF; }
.callout.warn { border-color: var(--kros-beige); background: #FFF3EC; }
.callout.kros { border-color: var(--kros-purple); background: var(--kros-blue-grey); }

/* Code + copy button */
pre { position: relative; background: #0A1A3A; color: #E6EDF7;
  padding: var(--space-3); border-radius: var(--radius-box); overflow: auto; }
pre code { font-family: var(--font-mono); font-size: var(--fs-small); }
.copy-btn { position: absolute; top: 8px; right: 8px; font-size: 12px;
  background: rgba(255,255,255,0.12); color: #fff; border: none;
  border-radius: 6px; padding: 4px 8px; cursor: pointer; }

/* Glossary tooltip */
.term { border-bottom: 1px dashed var(--kros-cyan-600); cursor: help; position: relative; }
.term .tip-box { display: none; position: absolute; bottom: 125%; left: 0;
  width: 240px; background: #fff; color: var(--ink); border: 1px solid var(--border);
  border-left: 4px solid var(--kros-cyan); border-radius: var(--radius-box);
  box-shadow: var(--shadow-card); padding: var(--space-2); font-size: var(--fs-small);
  z-index: 30; }
.term:hover .tip-box, .term:focus .tip-box { display: block; }

/* Quiz */
.quiz { background: var(--bg-elev); border-radius: var(--radius-card);
  padding: var(--space-5); margin: var(--space-5) 0; }
.quiz .q { margin-bottom: var(--space-4); }
.quiz .options { display: grid; gap: var(--space-2); }
.quiz .options label { display: flex; gap: var(--space-2); align-items: center;
  border: 1px solid var(--border); border-radius: var(--radius-box);
  padding: var(--space-2); cursor: pointer; }
.quiz .options label.correct { border-color: var(--success); background: #EAF8F1; }
.quiz .options label.wrong { border-color: var(--danger); background: #FDECEC; }
.quiz .explain { font-size: var(--fs-small); color: var(--ink-muted); margin-top: var(--space-1); }
.quiz .result { font-weight: 700; font-size: var(--fs-h3); }
.quiz .result.pass { color: var(--success); }
.quiz .result.fail { color: var(--danger); }

/* Match game */
.match { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);
  margin: var(--space-4) 0; }
.match .col { display: grid; gap: var(--space-2); }
.match .tile { border: 1px solid var(--border); border-radius: var(--radius-box);
  padding: var(--space-2); background: #fff; cursor: grab; }
.match .slot { border: 2px dashed var(--kros-blue-grey); border-radius: var(--radius-box);
  padding: var(--space-2); min-height: 44px; }
.match .slot.matched { border-style: solid; border-color: var(--success); }

/* Diagram */
.diagram-wrap { display: grid; grid-template-columns: 1fr 280px; gap: var(--space-4); }
@media (max-width: 800px) { .diagram-wrap { grid-template-columns: 1fr; } }
.diagram-wrap svg .hot { cursor: pointer; }
.diagram-wrap svg .hot:hover { opacity: 0.85; }
.diagram-panel { background: var(--bg-elev); border-radius: var(--radius-box);
  padding: var(--space-3); }

/* Confetti canvas */
#confetti { position: fixed; inset: 0; pointer-events: none; z-index: 100; }

/* Footer */
.site-footer { border-top: 1px solid var(--border); margin-top: var(--space-6);
  padding: var(--space-4); color: var(--ink-muted); font-size: var(--fs-small);
  display: flex; flex-wrap: wrap; gap: var(--space-4); justify-content: space-between; }
.site-footer a { color: var(--ink-muted); }
.site-footer button.linklike { background: none; border: none; color: var(--ink-muted);
  text-decoration: underline; cursor: pointer; font: inherit; }
```

- [ ] **Step 2: Commit**

```bash
git add buddy-site/assets/css/components.css
git commit -m "feat: add component styles (cards, quiz, callouts, side-nav)"
```

---

## Task 4: i18n logic module (TDD)

**Files:**
- Create: `buddy-site/assets/js/i18n.js`
- Test: `buddy-site/tests/i18n.test.js`

- [ ] **Step 1: Write the failing test**

Create `buddy-site/tests/i18n.test.js`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveString } from "../assets/js/i18n.js";

const strings = {
  "hub.hero.title": { sk: "Vitaj v KROSe!", en: "Welcome to KROS!" },
  "nav.hub": { sk: "Domov", en: "Hub" },
};

test("resolveString returns the requested language", () => {
  assert.equal(resolveString(strings, "hub.hero.title", "sk"), "Vitaj v KROSe!");
  assert.equal(resolveString(strings, "hub.hero.title", "en"), "Welcome to KROS!");
});

test("resolveString falls back to sk when lang missing", () => {
  assert.equal(resolveString(strings, "nav.hub", "de"), "Domov");
});

test("resolveString returns the key itself when key missing", () => {
  assert.equal(resolveString(strings, "does.not.exist", "sk"), "does.not.exist");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `buddy-site/`:
```bash
node --test tests/i18n.test.js
```
Expected: FAIL — `Cannot find module '../assets/js/i18n.js'`.

- [ ] **Step 3: Write the implementation**

Create `buddy-site/assets/js/i18n.js`:
```js
// Pure logic is exported for tests; DOM helpers are browser-only.
export const DEFAULT_LANG = "sk";

export function resolveString(strings, key, lang) {
  const entry = strings[key];
  if (!entry) return key;
  return entry[lang] ?? entry[DEFAULT_LANG] ?? key;
}

// --- Browser-only helpers (guarded so Node tests don't touch them) ---
export function getLang() {
  if (typeof localStorage === "undefined") return DEFAULT_LANG;
  return localStorage.getItem("buddy.lang") || DEFAULT_LANG;
}

export function setLang(lang) {
  if (typeof localStorage !== "undefined") localStorage.setItem("buddy.lang", lang);
}

export function applyI18n(root, strings, lang) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = resolveString(strings, el.getAttribute("data-i18n"), lang);
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test tests/i18n.test.js
```
Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add buddy-site/assets/js/i18n.js buddy-site/tests/i18n.test.js
git commit -m "feat: add i18n string resolution with tests"
```

---

## Task 5: Progress / XP / badges logic module (TDD)

**Files:**
- Create: `buddy-site/assets/js/progress.js`
- Test: `buddy-site/tests/progress.test.js`

- [ ] **Step 1: Write the failing test**

Create `buddy-site/tests/progress.test.js`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultProgress, toggleCheckoff, recordQuiz, computeXp,
  earnedBadges, topicProgress, isTopicComplete,
  XP_CHECKOFF, XP_QUIZ_PASS, XP_TOPIC_BONUS,
} from "../assets/js/progress.js";

const topicsMeta = [
  { id: "csharp", subIds: ["async", "ienumerable", "di"], badge: "csharp-apprentice" },
  { id: "git", subIds: ["branch", "merge"], badge: "git-master" },
];

test("defaultProgress is empty", () => {
  const p = defaultProgress();
  assert.deepEqual(p.topics, {});
  assert.equal(p.lang, "sk");
});

test("toggleCheckoff adds then removes a sub-item", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "csharp", "async");
  assert.deepEqual(p.topics.csharp.completed, ["async"]);
  p = toggleCheckoff(p, "csharp", "async");
  assert.deepEqual(p.topics.csharp.completed, []);
});

test("topicProgress reports done/total/pct", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "csharp", "async");
  const tp = topicProgress(p, "csharp", topicsMeta[0].subIds);
  assert.deepEqual(tp, { done: 1, total: 3, pct: 33 });
});

test("recordQuiz stores pass when >= 80%", () => {
  let p = recordQuiz(defaultProgress(), "git", 4, 5);   // 80%
  assert.equal(p.topics.git.quizPassed, true);
  p = recordQuiz(p, "csharp", 1, 5);                     // 20%
  assert.equal(p.topics.csharp.quizPassed, false);
});

test("computeXp sums check-offs, quiz passes, and full-topic bonus", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "git", "branch");
  p = toggleCheckoff(p, "git", "merge");
  p = recordQuiz(p, "git", 2, 2);  // all subs done + quiz passed => bonus
  const xp = computeXp(p, topicsMeta);
  assert.equal(xp, 2 * XP_CHECKOFF + XP_QUIZ_PASS + XP_TOPIC_BONUS);
});

test("isTopicComplete requires all subs and a passed quiz", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "git", "branch");
  p = toggleCheckoff(p, "git", "merge");
  assert.equal(isTopicComplete(p, topicsMeta[1]), false);
  p = recordQuiz(p, "git", 2, 2);
  assert.equal(isTopicComplete(p, topicsMeta[1]), true);
});

test("earnedBadges lists badges only for complete topics", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "git", "branch");
  p = toggleCheckoff(p, "git", "merge");
  p = recordQuiz(p, "git", 2, 2);
  assert.deepEqual(earnedBadges(p, topicsMeta), ["git-master"]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test tests/progress.test.js
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `buddy-site/assets/js/progress.js`:
```js
export const XP_CHECKOFF = 5;
export const XP_QUIZ_PASS = 25;
export const XP_TOPIC_BONUS = 50;
export const QUIZ_PASS_THRESHOLD = 0.8;
const STORAGE_KEY = "buddy.progress";

export function defaultProgress() {
  return { version: 1, lang: "sk", lastVisited: null, topics: {} };
}

function ensureTopic(p, topicId) {
  if (!p.topics[topicId]) {
    p.topics[topicId] = { completed: [], quizScore: null, quizTotal: null,
      quizPassed: false, completedAt: null };
  }
  return p.topics[topicId];
}

// Returns a new progress object (does not mutate the input).
export function toggleCheckoff(p, topicId, subId) {
  const next = structuredClone(p);
  const t = ensureTopic(next, topicId);
  const i = t.completed.indexOf(subId);
  if (i === -1) t.completed.push(subId); else t.completed.splice(i, 1);
  return next;
}

export function recordQuiz(p, topicId, score, total) {
  const next = structuredClone(p);
  const t = ensureTopic(next, topicId);
  t.quizScore = score; t.quizTotal = total;
  t.quizPassed = total > 0 && score / total >= QUIZ_PASS_THRESHOLD;
  return next;
}

export function topicProgress(p, topicId, subIds) {
  const t = p.topics[topicId];
  const done = t ? t.completed.filter((s) => subIds.includes(s)).length : 0;
  const total = subIds.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}

export function isTopicComplete(p, meta) {
  const t = p.topics[meta.id];
  if (!t) return false;
  const allSubs = meta.subIds.every((s) => t.completed.includes(s));
  return allSubs && t.quizPassed === true;
}

export function computeXp(p, topicsMeta) {
  let xp = 0;
  for (const meta of topicsMeta) {
    const t = p.topics[meta.id];
    if (!t) continue;
    xp += t.completed.filter((s) => meta.subIds.includes(s)).length * XP_CHECKOFF;
    if (t.quizPassed) xp += XP_QUIZ_PASS;
    if (isTopicComplete(p, meta)) xp += XP_TOPIC_BONUS;
  }
  return xp;
}

export function earnedBadges(p, topicsMeta) {
  return topicsMeta.filter((m) => isTopicComplete(p, m)).map((m) => m.badge);
}

// --- Browser-only persistence ---
export function loadProgress() {
  if (typeof localStorage === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultProgress(), ...JSON.parse(raw) } : defaultProgress();
  } catch { return defaultProgress(); }
}

export function saveProgress(p) {
  if (typeof localStorage !== "undefined")
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function resetProgress() {
  if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test tests/progress.test.js
```
Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add buddy-site/assets/js/progress.js buddy-site/tests/progress.test.js
git commit -m "feat: add progress/XP/badge logic with tests"
```

---

## Task 6: Content transform helpers (TDD)

**Files:**
- Create: `buddy-site/assets/js/content-transforms.js`
- Test: `buddy-site/tests/content-transforms.test.js`

These are the pure functions that power the topic renderer: slugify, sub-topic parsing for the side-nav, callout class mapping, and glossary token replacement. The DOM-mounting renderer is built in Task 9.

- [ ] **Step 1: Write the failing test**

Create `buddy-site/tests/content-transforms.test.js`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify, parseSubtopics, calloutClassFor, replaceGlossaryTokens,
} from "../assets/js/content-transforms.js";

test("slugify lowercases, strips diacritics, hyphenates", () => {
  assert.equal(slugify("Backlog vs. Sprint"), "backlog-vs-sprint");
  assert.equal(slugify("Stavy úloh"), "stavy-uloh");
});

test("parseSubtopics extracts ## headings with slug ids", () => {
  const md = "# Title\n\nintro\n\n## Async metódy\ntext\n\n## DI\nmore";
  assert.deepEqual(parseSubtopics(md), [
    { id: "async-metody", title: "Async metódy" },
    { id: "di", title: "DI" },
  ]);
});

test("calloutClassFor maps the leading emoji", () => {
  assert.equal(calloutClassFor("💡 Tip: do this"), "tip");
  assert.equal(calloutClassFor("⚠️ Pozor: careful"), "warn");
  assert.equal(calloutClassFor("🏢 V KROSe: internal"), "kros");
  assert.equal(calloutClassFor("plain quote"), null);
});

test("replaceGlossaryTokens swaps {{term:id|text}} for tooltip spans", () => {
  const glossary = { sb: { term_sk: "Service Bus", def_sk: "Fronta správ.",
    def_en: "Message queue." } };
  const out = replaceGlossaryTokens("Use {{term:sb|Service Bus}} here", glossary, "sk");
  assert.match(out, /<span class="term"/);
  assert.match(out, /Service Bus/);
  assert.match(out, /Fronta správ\./);
});

test("replaceGlossaryTokens leaves unknown terms as plain text", () => {
  const out = replaceGlossaryTokens("Use {{term:xx|Foo}} here", {}, "sk");
  assert.equal(out, "Use Foo here");
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test tests/content-transforms.test.js
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `buddy-site/assets/js/content-transforms.js`:
```js
export function slugify(text) {
  return text
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseSubtopics(md) {
  const out = [];
  for (const line of md.split("\n")) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) out.push({ id: slugify(m[1]), title: m[1] });
  }
  return out;
}

const CALLOUT_MAP = [
  { emoji: "💡", cls: "tip" },
  { emoji: "⚠️", cls: "warn" },
  { emoji: "🏢", cls: "kros" },
];

export function calloutClassFor(blockquoteText) {
  for (const { emoji, cls } of CALLOUT_MAP) {
    if (blockquoteText.trimStart().startsWith(emoji)) return cls;
  }
  return null;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
}

// Replace {{term:id|display}} tokens. Known ids become tooltip spans;
// unknown ids degrade to the plain display text.
export function replaceGlossaryTokens(md, glossary, lang) {
  return md.replace(/\{\{term:([a-z0-9_-]+)\|([^}]+)\}\}/gi, (_, id, display) => {
    const g = glossary[id];
    if (!g) return display;
    const def = g[`def_${lang}`] ?? g.def_sk ?? "";
    return `<span class="term" tabindex="0">${escapeHtml(display)}` +
           `<span class="tip-box">${escapeHtml(def)}</span></span>`;
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test tests/content-transforms.test.js
```
Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add buddy-site/assets/js/content-transforms.js buddy-site/tests/content-transforms.test.js
git commit -m "feat: add content transform helpers with tests"
```

---

## Task 7: Quiz scoring logic (TDD)

**Files:**
- Create: `buddy-site/assets/js/interactives/quiz-score.js`
- Test: `buddy-site/tests/quiz-score.test.js`

Scoring is pure and lives in its own file; the DOM quiz widget (Task 12) imports it.

- [ ] **Step 1: Write the failing test**

Create `buddy-site/tests/quiz-score.test.js`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreQuiz } from "../assets/js/interactives/quiz-score.js";

const questions = [{ answer: 1 }, { answer: 0 }, { answer: 3 }];

test("scoreQuiz counts correct answers", () => {
  assert.deepEqual(scoreQuiz([1, 0, 3], questions),
    { correct: 3, total: 3, passed: true });
});

test("scoreQuiz marks fail below 80%", () => {
  assert.deepEqual(scoreQuiz([1, 9, 9], questions),
    { correct: 1, total: 3, passed: false });
});

test("scoreQuiz treats unanswered (null) as wrong", () => {
  assert.deepEqual(scoreQuiz([1, null, 3], questions),
    { correct: 2, total: 3, passed: false });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test tests/quiz-score.test.js
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `buddy-site/assets/js/interactives/quiz-score.js`:
```js
export const PASS_THRESHOLD = 0.8;

export function scoreQuiz(answers, questions) {
  let correct = 0;
  questions.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
  const total = questions.length;
  return { correct, total, passed: total > 0 && correct / total >= PASS_THRESHOLD };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test tests/quiz-score.test.js
```
Expected: PASS — 3 tests passing.

- [ ] **Step 5: Run the full test suite**

```bash
node --test
```
Expected: PASS — all test files (i18n, progress, content-transforms, quiz-score) green.

- [ ] **Step 6: Commit**

```bash
git add buddy-site/assets/js/interactives/quiz-score.js buddy-site/tests/quiz-score.test.js
git commit -m "feat: add quiz scoring with tests"
```

---

## Task 8: Local static server + vendored libraries + README

**Files:**
- Create: `buddy-site/serve.js`
- Create: `buddy-site/serve.cmd`
- Create: `buddy-site/assets/vendor/marked.min.js`
- Create: `buddy-site/assets/vendor/prism.js`
- Create: `buddy-site/assets/vendor/prism.css`
- Create: `buddy-site/README.md`

- [ ] **Step 1: Write the zero-dependency static server**

Create `buddy-site/serve.js`:
```js
// Minimal static file server (no dependencies). Usage: node serve.js [port]
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.argv[2]) || 8000;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".md": "text/markdown; charset=utf-8", ".ico": "image/x-icon",
};

http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": TYPES[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("404 Not Found");
  }
}).listen(PORT, () => console.log(`Buddy running at http://localhost:${PORT}`));
```

- [ ] **Step 2: Write the Windows launcher**

Create `buddy-site/serve.cmd`:
```bat
@echo off
cd /d "%~dp0"
node serve.js 8000
```

- [ ] **Step 3: Vendor the markdown + syntax libraries**

Download pinned copies into `assets/vendor/` (run from `buddy-site/`):
```bash
curl -L -o assets/vendor/marked.min.js https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js
curl -L -o assets/vendor/prism.js https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js
curl -L -o assets/vendor/prism-csharp.js https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-csharp.min.js
curl -L -o assets/vendor/prism.css https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css
```
Expected: four files downloaded, each non-empty (`ls -l assets/vendor`).

- [ ] **Step 4: Write the README**

Create `buddy-site/README.md`:
```markdown
# Buddy — KROS Junior Onboarding Site

Bilingual (SK/EN) interactive onboarding manual. Static site, no build step.

## Run locally
```
serve.cmd          REM Windows: starts http://localhost:8000
node serve.js 8000  # any OS
```
Open http://localhost:8000. (Opening files via `file://` will NOT work — the
markdown loader uses `fetch`, which needs a server.)

## Run tests
```
node --test
```

## Add a topic
1. Create `topics/<id>/<id>.sk.md` and `<id>.en.md` (sub-topics are `##` headings).
2. Add optional `quiz.json` (bilingual) and `match.json` / `diagram.svg`.
3. Register the topic in `topics/_index.json` (set `"status": "ready"` to publish;
   `"draft"` shows a "V príprave" pill).
4. Add the badge id to the topic entry and a medal entry in `_index.json`.

## Deploy (later)
Push `buddy-site/` to GitHub Pages or Azure Static Web Apps. `.nojekyll` is
included. All paths are relative.
```

- [ ] **Step 5: Smoke-test the server**

Run from `buddy-site/`:
```bash
node serve.js 8000 &
sleep 1
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/README.md
kill %1
```
Expected: prints `200`.

- [ ] **Step 6: Commit**

```bash
git add buddy-site/serve.js buddy-site/serve.cmd buddy-site/README.md buddy-site/assets/vendor
git commit -m "feat: add local server, vendored libs, and README"
```

---

## Task 9: Topic registry, glossary, and UI strings data

**Files:**
- Create: `buddy-site/topics/_index.json`
- Create: `buddy-site/assets/js/strings.json`
- Create: `buddy-site/assets/js/glossary.json`

- [ ] **Step 1: Write the topic registry**

Create `buddy-site/topics/_index.json`. Welcome + C# are `ready`; the rest are
`draft` so the hub renders all cards from day one.
```json
{
  "topics": [
    { "id": "welcome", "order": 0, "status": "ready", "icon": "👋",
      "badge": null,
      "title": { "sk": "Vitaj", "en": "Welcome" },
      "desc": { "sk": "Ako používať Buddyho a tvoj prvý týždeň.",
                "en": "How to use Buddy and your first week." },
      "subIds": ["ako-to-funguje", "kde-sa-pytat", "tvoj-tyzden"] },

    { "id": "devops", "order": 1, "status": "draft", "icon": "🛠️",
      "badge": "devops-rookie",
      "title": { "sk": "DevOps", "en": "DevOps" },
      "desc": { "sk": "Backlog, work items, pipelines, FFs.",
                "en": "Backlog, work items, pipelines, FFs." }, "subIds": [] },

    { "id": "azure", "order": 2, "status": "draft", "icon": "☁️",
      "badge": "cloud-native",
      "title": { "sk": "Azure", "en": "Azure" },
      "desc": { "sk": "Resources, Key Vault, configy, prostredia.",
                "en": "Resources, Key Vault, configs, environments." }, "subIds": [] },

    { "id": "csharp", "order": 3, "status": "ready", "icon": "#️⃣",
      "badge": "csharp-apprentice",
      "title": { "sk": "C#", "en": "C#" },
      "desc": { "sk": "async, IEnumerable, CQRS, DI a vzory.",
                "en": "async, IEnumerable, CQRS, DI and patterns." },
      "subIds": ["async-metody", "ienumerable-a-materializacia",
                 "dependency-injection"] },

    { "id": "architektura", "order": 4, "status": "draft", "icon": "🏛️",
      "badge": "architecture-aware",
      "title": { "sk": "Architektúra", "en": "Architecture" },
      "desc": { "sk": "Microservices, AppHost, AzFun.",
                "en": "Microservices, AppHost, AzFun." }, "subIds": [] },

    { "id": "kniznice", "order": 5, "status": "draft", "icon": "📦",
      "badge": "library-explorer",
      "title": { "sk": "Knižnice a služby", "en": "Libraries & services" },
      "desc": { "sk": "KORM, TeaPie, XUnit, Redis, Kros.Framework.",
                "en": "KORM, TeaPie, XUnit, Redis, Kros.Framework." }, "subIds": [] },

    { "id": "git", "order": 6, "status": "draft", "icon": "🌿",
      "badge": "git-master",
      "title": { "sk": "Git", "en": "Git" },
      "desc": { "sk": "Vetvy, merge, master, Production, cherry-pick.",
                "en": "Branches, merge, master, Production, cherry-pick." }, "subIds": [] },

    { "id": "pr", "order": 7, "status": "draft", "icon": "🔁",
      "badge": "pr-practitioner",
      "title": { "sk": "PR procesy", "en": "PR processes" },
      "desc": { "sk": "Draft, komentáre, AI review.",
                "en": "Draft, comments, AI review." }, "subIds": [] },

    { "id": "ladenie", "order": 8, "status": "draft", "icon": "🐞",
      "badge": "local-hero",
      "title": { "sk": "Lokálne ladenie", "en": "Local debugging" },
      "desc": { "sk": "AppHost, local configy, consumers.",
                "en": "AppHost, local configs, consumers." }, "subIds": [] },

    { "id": "klient-server", "order": 9, "status": "draft", "icon": "🌐",
      "badge": "network-native",
      "title": { "sk": "Klient-Server", "en": "Client-Server" },
      "desc": { "sk": "Status kódy, endpointy, SignalR, WebAssembly.",
                "en": "Status codes, endpoints, SignalR, WebAssembly." }, "subIds": [] },

    { "id": "produkty", "order": 10, "status": "draft", "icon": "🧾",
      "badge": "kros-insider",
      "title": { "sk": "Produkty", "en": "Products" },
      "desc": { "sk": "Digi, Omega, Fakturácia, e-Faktúra.",
                "en": "Digi, Omega, Fakturácia, e-Faktúra." }, "subIds": [] }
  ],
  "badges": {
    "devops-rookie": { "icon": "🚀", "label": { "sk": "DevOps nováčik", "en": "DevOps Rookie" } },
    "cloud-native": { "icon": "☁️", "label": { "sk": "Cloud Native", "en": "Cloud Native" } },
    "csharp-apprentice": { "icon": "#️⃣", "label": { "sk": "C# učeň", "en": "C# Apprentice" } },
    "architecture-aware": { "icon": "🏛️", "label": { "sk": "Architekt", "en": "Architecture Aware" } },
    "library-explorer": { "icon": "📦", "label": { "sk": "Prieskumník knižníc", "en": "Library Explorer" } },
    "git-master": { "icon": "🌿", "label": { "sk": "Git majster", "en": "Git Master" } },
    "pr-practitioner": { "icon": "🔁", "label": { "sk": "PR praktik", "en": "PR Practitioner" } },
    "local-hero": { "icon": "🐞", "label": { "sk": "Lokálny hrdina", "en": "Local Hero" } },
    "network-native": { "icon": "🌐", "label": { "sk": "Sieťový native", "en": "Network Native" } },
    "kros-insider": { "icon": "🧾", "label": { "sk": "KROS insider", "en": "KROS Insider" } }
  }
}
```

- [ ] **Step 2: Write the UI strings**

Create `buddy-site/assets/js/strings.json`:
```json
{
  "site.title": { "sk": "Buddy — onboarding manuál", "en": "Buddy — onboarding manual" },
  "hub.hero.title": { "sk": "Vitaj v KROSe! 👋", "en": "Welcome to KROS! 👋" },
  "hub.hero.tagline": { "sk": "Tvoj prvý týždeň, jedna stránka.", "en": "Your first week, one page." },
  "hub.resume": { "sk": "Pokračovať", "en": "Continue" },
  "hub.topics": { "sk": "Témy", "en": "Topics" },
  "hub.badges": { "sk": "Tvoje odznaky", "en": "Your badges" },
  "hub.xp": { "sk": "XP", "en": "XP" },
  "hub.progress.topics": { "sk": "tém hotových", "en": "topics done" },
  "card.draft": { "sk": "📝 V príprave", "en": "📝 In progress" },
  "nav.hub": { "sk": "← Domov", "en": "← Hub" },
  "topic.checkoff": { "sk": "Rozumiem tomu", "en": "I understand this" },
  "topic.checkoff.done": { "sk": "Rozumiem ✓", "en": "Understood ✓" },
  "topic.next": { "sk": "Ďalej", "en": "Next" },
  "topic.quiz": { "sk": "Kvíz", "en": "Quiz" },
  "quiz.submit": { "sk": "Vyhodnotiť", "en": "Submit" },
  "quiz.retry": { "sk": "Skúsiť znova", "en": "Try again" },
  "quiz.pass": { "sk": "Super! Prešiel si.", "en": "Great! You passed." },
  "quiz.fail": { "sk": "Skús to ešte raz.", "en": "Give it another try." },
  "footer.help": { "sk": "Otázky? Pýtaj sa svojho mentora.", "en": "Questions? Ask your mentor." },
  "footer.reset": { "sk": "↺ Resetovať pokrok", "en": "↺ Reset progress" },
  "footer.anim": { "sk": "🎉 Animácie", "en": "🎉 Animations" },
  "footer.reset.confirm": { "sk": "Naozaj vymazať všetok pokrok?", "en": "Really erase all progress?" }
}
```

- [ ] **Step 3: Write the starter glossary**

Create `buddy-site/assets/js/glossary.json`:
```json
{
  "async": {
    "term_sk": "async/await", "term_en": "async/await",
    "def_sk": "Spôsob písania neblokujúceho kódu — metóda sa na await pozastaví a vráti riadenie volajúcemu.",
    "def_en": "A way to write non-blocking code — a method suspends at await and returns control to the caller."
  },
  "di": {
    "term_sk": "Dependency Injection", "term_en": "Dependency Injection",
    "def_sk": "Závislosti sa objektu dodajú zvonku (cez konštruktor) namiesto toho, aby si ich vytváral sám.",
    "def_en": "Dependencies are supplied from outside (via the constructor) instead of being created internally."
  },
  "ienumerable": {
    "term_sk": "IEnumerable", "term_en": "IEnumerable",
    "def_sk": "Lenivá sekvencia — vyhodnotí sa až pri iterácii (materializácii cez ToList/foreach).",
    "def_en": "A lazy sequence — evaluated only when iterated (materialized via ToList/foreach)."
  }
}
```

- [ ] **Step 4: Validate JSON parses**

Run from `buddy-site/`:
```bash
node -e "['topics/_index.json','assets/js/strings.json','assets/js/glossary.json'].forEach(f=>{JSON.parse(require('fs').readFileSync(f,'utf8'));console.log('ok',f)})"
```
Expected: `ok topics/_index.json` / `ok assets/js/strings.json` / `ok assets/js/glossary.json`.

- [ ] **Step 5: Commit**

```bash
git add buddy-site/topics/_index.json buddy-site/assets/js/strings.json buddy-site/assets/js/glossary.json
git commit -m "feat: add topic registry, UI strings, and glossary data"
```

---

## Task 10: Confetti module (DOM, manual verify)

**Files:**
- Create: `buddy-site/assets/js/interactives/confetti.js`

- [ ] **Step 1: Write the confetti module**

Create `buddy-site/assets/js/interactives/confetti.js`:
```js
// Tiny canvas confetti, no dependencies. Respects the animations toggle.
const COLORS = ["#000A4D", "#5AD3FF", "#66003C", "#F6B696"];

export function animationsEnabled() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem("buddy.anim") !== "off";
}

export function burst() {
  if (!animationsEnabled()) return;
  let canvas = document.getElementById("confetti");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "confetti";
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d");
  canvas.width = innerWidth; canvas.height = innerHeight;
  const pieces = Array.from({ length: 120 }, (_, i) => ({
    x: innerWidth / 2, y: innerHeight / 3,
    vx: (i % 7 - 3) * (1 + (i % 5)), vy: -(4 + (i % 9)),
    color: COLORS[i % COLORS.length], size: 5 + (i % 4), rot: i,
  }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.rot += 0.2;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    }
    if (++frames < 120) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}
```

- [ ] **Step 2: Commit**

```bash
git add buddy-site/assets/js/interactives/confetti.js
git commit -m "feat: add confetti burst module"
```

(Visual verification happens in Task 12 when the quiz triggers it.)

---

## Task 11: Hub page (`index.html` + `app.js`)

**Files:**
- Create: `buddy-site/index.html`
- Create: `buddy-site/assets/js/app.js`

- [ ] **Step 1: Write the hub HTML shell**

Create `buddy-site/index.html`:
```html
<!doctype html>
<html lang="sk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Buddy</title>
  <link rel="stylesheet" href="assets/css/tokens.css" />
  <link rel="stylesheet" href="assets/css/base.css" />
  <link rel="stylesheet" href="assets/css/components.css" />
</head>
<body>
  <header class="site-header">
    <a class="brand" href="index.html"><span>🤝</span><span data-i18n="site.title">Buddy</span></a>
    <nav class="lang-toggle" id="langToggle">
      <button data-lang="sk">SK</button><span>|</span><button data-lang="en">EN</button>
    </nav>
  </header>

  <section class="hero">
    <div class="container">
      <h1 data-i18n="hub.hero.title"></h1>
      <p class="tagline" data-i18n="hub.hero.tagline"></p>
      <div class="progress on-light" style="max-width:320px"><span id="overallBar"></span></div>
      <p class="muted" id="overallText" style="color:#fff;opacity:.9"></p>
      <a class="btn secondary" id="resumeBtn" href="#" style="background:#fff"></a>
    </div>
  </section>

  <main class="container">
    <h2 data-i18n="hub.topics"></h2>
    <div class="card-grid" id="topicGrid"></div>
    <h2 data-i18n="hub.badges"></h2>
    <div class="badges" id="badgeRow"></div>
  </main>

  <footer class="site-footer">
    <span data-i18n="footer.help"></span>
    <span>
      <label><input type="checkbox" id="animToggle" checked /> <span data-i18n="footer.anim"></span></label>
      &nbsp;·&nbsp;
      <button class="linklike" id="resetBtn" data-i18n="footer.reset"></button>
    </span>
  </footer>

  <script type="module" src="assets/js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write the hub controller**

Create `buddy-site/assets/js/app.js`:
```js
import { resolveString, getLang, setLang, applyI18n, DEFAULT_LANG } from "./i18n.js";
import { loadProgress, saveProgress, resetProgress, computeXp,
         earnedBadges, topicProgress, isTopicComplete } from "./progress.js";

let STRINGS = {}, REGISTRY = { topics: [], badges: {} };

async function loadData() {
  STRINGS = await (await fetch("assets/js/strings.json")).json();
  REGISTRY = await (await fetch("topics/_index.json")).json();
}

function topicsMeta() {
  return REGISTRY.topics.filter(t => t.badge).map(t => ({
    id: t.id, subIds: t.subIds, badge: t.badge,
  }));
}

function renderHub(lang) {
  const p = loadProgress();
  applyI18n(document, STRINGS, lang);
  document.documentElement.lang = lang;

  // Topic cards
  const grid = document.getElementById("topicGrid");
  grid.innerHTML = "";
  for (const t of [...REGISTRY.topics].sort((a,b)=>a.order-b.order)) {
    const card = document.createElement("a");
    card.className = "topic-card";
    card.href = `topic.html?id=${t.id}`;
    const complete = t.badge ? isTopicComplete(p, t) : false;
    let footer;
    if (t.status === "draft") {
      footer = `<span class="pill draft">${resolveString(STRINGS,"card.draft",lang)}</span>`;
    } else {
      const tp = topicProgress(p, t.id, t.subIds);
      footer = `<div class="card-progress">
        <div class="progress on-light"><span style="width:${tp.pct}%"></span></div>
        <span>${tp.done}/${tp.total}${complete?' <span class="star">★</span>':''}</span></div>`;
    }
    card.innerHTML = `<div class="icon">${t.icon}</div>
      <h3>${t.title[lang] ?? t.title[DEFAULT_LANG]}</h3>
      <p class="desc">${t.desc[lang] ?? t.desc[DEFAULT_LANG]}</p>${footer}`;
    grid.appendChild(card);
  }

  // Overall progress + XP
  const meta = topicsMeta();
  const readyTopics = REGISTRY.topics.filter(t => t.status === "ready" && t.badge);
  const doneCount = readyTopics.filter(t => isTopicComplete(p, t)).length;
  const xp = computeXp(p, meta);
  document.getElementById("overallBar").style.width =
    readyTopics.length ? `${Math.round(doneCount/readyTopics.length*100)}%` : "0%";
  document.getElementById("overallText").textContent =
    `${doneCount}/${readyTopics.length} ${resolveString(STRINGS,"hub.progress.topics",lang)} · ${resolveString(STRINGS,"hub.xp",lang)} ${xp}`;

  // Resume button -> last visited or first incomplete ready topic
  const resume = p.lastVisited
    || (readyTopics.find(t => !isTopicComplete(p, t)) || readyTopics[0] || {}).id;
  const resumeBtn = document.getElementById("resumeBtn");
  if (resume) { resumeBtn.href = `topic.html?id=${resume}`;
    resumeBtn.textContent = `${resolveString(STRINGS,"hub.resume",lang)} →`; }
  else resumeBtn.classList.add("hidden");

  // Badges
  const earned = earnedBadges(p, meta);
  const row = document.getElementById("badgeRow");
  row.innerHTML = "";
  for (const [id, b] of Object.entries(REGISTRY.badges)) {
    const has = earned.includes(id);
    const el = document.createElement("div");
    el.className = "badge" + (has ? "" : " locked");
    el.innerHTML = `<div class="medal">${has ? b.icon : "🔒"}</div>
      <span>${b.label[lang] ?? b.label[DEFAULT_LANG]}</span>`;
    row.appendChild(el);
  }
}

function wireChrome() {
  document.getElementById("langToggle").addEventListener("click", (e) => {
    const lang = e.target.getAttribute("data-lang");
    if (!lang) return;
    setLang(lang); markActiveLang(lang); renderHub(lang);
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm(resolveString(STRINGS,"footer.reset.confirm",getLang()))) {
      resetProgress(); renderHub(getLang());
    }
  });
  const anim = document.getElementById("animToggle");
  anim.checked = localStorage.getItem("buddy.anim") !== "off";
  anim.addEventListener("change", () =>
    localStorage.setItem("buddy.anim", anim.checked ? "on" : "off"));
}

function markActiveLang(lang) {
  document.querySelectorAll("#langToggle button").forEach(b =>
    b.classList.toggle("active", b.getAttribute("data-lang") === lang));
}

(async function init() {
  await loadData();
  const lang = getLang();
  markActiveLang(lang);
  wireChrome();
  renderHub(lang);
})();
```

- [ ] **Step 3: Manual verification in browser**

Run from `buddy-site/`:
```bash
node serve.js 8000
```
Open http://localhost:8000. Verify:
- 11 cards render; Welcome and C# show a `0/3` progress bar, others show "V príprave".
- SK/EN toggle switches all chrome text and persists across refresh.
- Badges row shows 10 locked medals.
- Hero shows `0/2 tém hotových · XP 0`.

Stop the server (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add buddy-site/index.html buddy-site/assets/js/app.js
git commit -m "feat: add hub page with topic cards, badges, and language toggle"
```

---

## Task 12: Topic page renderer (`topic.html` + `content.js` + `quiz.js`)

**Files:**
- Create: `buddy-site/topic.html`
- Create: `buddy-site/assets/js/content.js`
- Create: `buddy-site/assets/js/interactives/quiz.js`

- [ ] **Step 1: Write the topic HTML shell**

Create `buddy-site/topic.html`:
```html
<!doctype html>
<html lang="sk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Buddy — téma</title>
  <link rel="stylesheet" href="assets/css/tokens.css" />
  <link rel="stylesheet" href="assets/css/base.css" />
  <link rel="stylesheet" href="assets/css/components.css" />
  <link rel="stylesheet" href="assets/vendor/prism.css" />
</head>
<body>
  <header class="site-header">
    <a class="brand" href="index.html"><span data-i18n="nav.hub">← Domov</span></a>
    <nav class="lang-toggle" id="langToggle">
      <button data-lang="sk">SK</button><span>|</span><button data-lang="en">EN</button>
    </nav>
  </header>

  <section class="hero">
    <div class="container">
      <h1 id="topicTitle"></h1>
      <p class="tagline" id="topicSummary"></p>
      <div class="progress" style="max-width:280px"><span id="topicBar"></span></div>
    </div>
  </section>

  <main class="container topic-layout">
    <nav class="side-nav"><ol id="sideNav"></ol></nav>
    <article id="content"></article>
  </main>

  <footer class="site-footer">
    <span data-i18n="footer.help"></span>
  </footer>

  <canvas id="confetti"></canvas>
  <script src="assets/vendor/marked.min.js"></script>
  <script src="assets/vendor/prism.js"></script>
  <script src="assets/vendor/prism-csharp.js"></script>
  <script type="module" src="assets/js/content.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write the quiz widget**

Create `buddy-site/assets/js/interactives/quiz.js`:
```js
import { scoreQuiz } from "./quiz-score.js";

// Renders a quiz into `mount`. Calls onResult({correct,total,passed}) on submit.
export function renderQuiz(mount, quiz, lang, strings, onResult) {
  const questions = quiz.questions;
  mount.innerHTML = `<h2>${strings("topic.quiz")}</h2>`;
  questions.forEach((q, qi) => {
    const loc = q[lang] ?? q.sk;
    const block = document.createElement("div");
    block.className = "q";
    block.innerHTML = `<p><strong>${qi + 1}. ${loc.q}</strong></p>
      <div class="options">${loc.options.map((opt, oi) =>
        `<label data-qi="${qi}" data-oi="${oi}">
           <input type="radio" name="q${qi}" value="${oi}" /> ${opt}</label>`).join("")}</div>
      <p class="explain hidden">${loc.explain}</p>`;
    mount.appendChild(block);
  });
  const submit = document.createElement("button");
  submit.className = "btn"; submit.textContent = strings("quiz.submit");
  const result = document.createElement("p"); result.className = "result";
  mount.append(submit, result);

  submit.addEventListener("click", () => {
    const answers = questions.map((_, qi) => {
      const sel = mount.querySelector(`input[name="q${qi}"]:checked`);
      return sel ? Number(sel.value) : null;
    });
    const score = scoreQuiz(answers, questions);
    questions.forEach((q, qi) => {
      mount.querySelectorAll(`label[data-qi="${qi}"]`).forEach((lbl) => {
        const oi = Number(lbl.getAttribute("data-oi"));
        lbl.classList.toggle("correct", oi === q.answer);
        if (answers[qi] === oi && oi !== q.answer) lbl.classList.add("wrong");
      });
      mount.querySelectorAll(".q")[qi].querySelector(".explain").classList.remove("hidden");
    });
    result.textContent = `${score.correct}/${score.total} — ` +
      strings(score.passed ? "quiz.pass" : "quiz.fail");
    result.className = "result " + (score.passed ? "pass" : "fail");
    onResult(score);
  });
}
```

- [ ] **Step 3: Write the topic renderer**

Create `buddy-site/assets/js/content.js`:
```js
import { resolveString, getLang, setLang, applyI18n, DEFAULT_LANG } from "./i18n.js";
import { loadProgress, saveProgress, toggleCheckoff, recordQuiz,
         topicProgress, isTopicComplete } from "./progress.js";
import { parseSubtopics, replaceGlossaryTokens, calloutClassFor } from "./content-transforms.js";
import { renderQuiz } from "./interactives/quiz.js";
import { burst } from "./interactives/confetti.js";

let STRINGS = {}, REGISTRY = {}, GLOSSARY = {}, TOPIC = null, QUIZ = null;
const topicId = new URLSearchParams(location.search).get("id");
const S = (key) => resolveString(STRINGS, key, getLang());

async function loadData() {
  STRINGS = await (await fetch("assets/js/strings.json")).json();
  GLOSSARY = await (await fetch("assets/js/glossary.json")).json();
  REGISTRY = await (await fetch("topics/_index.json")).json();
  TOPIC = REGISTRY.topics.find(t => t.id === topicId);
  try { QUIZ = await (await fetch(`topics/${topicId}/quiz.json`)).json(); }
  catch { QUIZ = null; }
}

// Convert callout blockquotes (rendered by marked) into styled divs.
function styleCallouts(container) {
  container.querySelectorAll("blockquote").forEach((bq) => {
    const cls = calloutClassFor(bq.textContent);
    if (!cls) return;
    const div = document.createElement("div");
    div.className = `callout ${cls}`;
    div.innerHTML = bq.innerHTML;
    bq.replaceWith(div);
  });
}

function addCopyButtons(container) {
  container.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    const text = (code ?? pre).textContent; // capture before adding the button
    const btn = document.createElement("button");
    btn.className = "copy-btn"; btn.textContent = "copy";
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(text);
      btn.textContent = "✓";
      setTimeout(() => (btn.textContent = "copy"), 1200);
    });
    pre.appendChild(btn);
  });
}

async function render() {
  const lang = getLang();
  document.documentElement.lang = lang;
  applyI18n(document, STRINGS, lang);
  document.querySelectorAll("#langToggle button").forEach(b =>
    b.classList.toggle("active", b.getAttribute("data-lang") === lang));

  document.getElementById("topicTitle").textContent =
    `${TOPIC.icon} ${TOPIC.title[lang] ?? TOPIC.title[DEFAULT_LANG]}`;
  document.getElementById("topicSummary").textContent =
    TOPIC.desc[lang] ?? TOPIC.desc[DEFAULT_LANG];

  // Load + transform markdown
  const md = await (await fetch(`topics/${topicId}/${topicId}.${lang}.md`)).text();
  const withTips = replaceGlossaryTokens(md, GLOSSARY, lang);
  const content = document.getElementById("content");
  content.innerHTML = window.marked.parse(withTips);
  styleCallouts(content);
  addCopyButtons(content);
  if (window.Prism) window.Prism.highlightAllUnder(content);

  // Wrap each ## section in a .subtopic with a check-off button
  const subs = parseSubtopics(md);
  wrapSubtopics(content, subs, lang);
  buildSideNav(subs, lang);
  if (QUIZ) mountQuiz(content, lang);
  updateProgressUI(subs);

  // Mark visited
  const p = loadProgress(); p.lastVisited = topicId; saveProgress(p);
}

function wrapSubtopics(content, subs, lang) {
  const p = loadProgress();
  const completed = (p.topics[topicId]?.completed) ?? [];
  const headings = [...content.querySelectorAll("h2")];
  headings.forEach((h2, i) => {
    const sub = subs[i]; if (!sub) return;
    h2.id = sub.id;
    const wrap = document.createElement("section");
    wrap.className = "subtopic"; wrap.dataset.sub = sub.id;
    const nodes = []; let n = h2;
    do { nodes.push(n); n = n.nextElementSibling; }
    while (n && n.tagName !== "H2");
    h2.replaceWith(wrap); nodes.forEach(node => wrap.appendChild(node));
    const btn = document.createElement("button");
    btn.className = "checkoff" + (completed.includes(sub.id) ? " done" : "");
    btn.textContent = completed.includes(sub.id)
      ? resolveString(STRINGS,"topic.checkoff.done",lang)
      : resolveString(STRINGS,"topic.checkoff",lang);
    btn.addEventListener("click", () => {
      let pr = toggleCheckoff(loadProgress(), topicId, sub.id);
      saveProgress(pr);
      const done = (pr.topics[topicId]?.completed ?? []).includes(sub.id);
      btn.classList.toggle("done", done);
      btn.textContent = done ? resolveString(STRINGS,"topic.checkoff.done",lang)
                             : resolveString(STRINGS,"topic.checkoff",lang);
      const dot = document.querySelector(`#sideNav a[href="#${sub.id}"] .dot`);
      if (dot) dot.classList.toggle("done", done);
      updateProgressUI(subs);
    });
    wrap.appendChild(btn);
  });
}

function buildSideNav(subs, lang) {
  const p = loadProgress();
  const completed = (p.topics[topicId]?.completed) ?? [];
  const ol = document.getElementById("sideNav");
  ol.innerHTML = subs.map(s =>
    `<li><a href="#${s.id}"><span class="dot${completed.includes(s.id)?' done':''}"></span>${s.title}</a></li>`
  ).join("") + (QUIZ ? `<li><a href="#quiz">▸ ${resolveString(STRINGS,"topic.quiz",lang)}</a></li>` : "");
}

function mountQuiz(content, lang) {
  const mount = document.createElement("section");
  mount.className = "quiz"; mount.id = "quiz";
  content.appendChild(mount);
  renderQuiz(mount, QUIZ, lang, S, (score) => {
    const pr = recordQuiz(loadProgress(), topicId, score.correct, score.total);
    saveProgress(pr);
    if (isTopicComplete(pr, { id: topicId, subIds: TOPIC.subIds })) burst();
  });
  appendNextLink(content, lang);
}

function appendNextLink(content, lang) {
  const sorted = [...REGISTRY.topics].sort((a,b)=>a.order-b.order);
  const idx = sorted.findIndex(t => t.id === topicId);
  const next = sorted.slice(idx+1).find(t => t.status === "ready");
  if (!next) return;
  const a = document.createElement("a");
  a.className = "btn"; a.href = `topic.html?id=${next.id}`;
  a.textContent = `${resolveString(STRINGS,"topic.next",lang)} → ${next.title[lang] ?? next.title[DEFAULT_LANG]}`;
  a.style.marginTop = "24px";
  content.appendChild(a);
}

function updateProgressUI(subs) {
  const tp = topicProgress(loadProgress(), topicId, subs.map(s=>s.id));
  document.getElementById("topicBar").style.width = `${tp.pct}%`;
}

function wireLang() {
  document.getElementById("langToggle").addEventListener("click", (e) => {
    const lang = e.target.getAttribute("data-lang");
    if (!lang) return;
    setLang(lang); render();
  });
}

(async function init() {
  await loadData();
  if (!TOPIC) { document.getElementById("content").textContent = "Topic not found."; return; }
  wireLang();
  render();
})();
```

- [ ] **Step 4: Manual verification**

Run `node serve.js 8000`, open http://localhost:8000/topic.html?id=csharp (after Task 14 adds content; until then it will show empty content). Defer full visual check to Task 14 Step 4. For now just confirm no console errors on the Welcome topic once Task 13 is done.

- [ ] **Step 5: Commit**

```bash
git add buddy-site/topic.html buddy-site/assets/js/content.js buddy-site/assets/js/interactives/quiz.js
git commit -m "feat: add topic page renderer with check-offs, side-nav, and quiz"
```

---

## Task 13: Welcome topic content

**Files:**
- Create: `buddy-site/topics/welcome/welcome.sk.md`
- Create: `buddy-site/topics/welcome/welcome.en.md`

The Welcome card has no quiz (it's orientation). Its three sub-topics match
`subIds` in `_index.json`: `ako-to-funguje`, `kde-sa-pytat`, `tvoj-tyzden`.

- [ ] **Step 1: Write the Slovak content**

Create `buddy-site/topics/welcome/welcome.sk.md`:
```markdown
# Vitaj v Buddym 👋

Toto je tvoj sprievodca prvým týždňom v KROSe. Choď si vlastným tempom.

## Ako to funguje

Každá téma má niekoľko podtém. Keď niečomu porozumieš, klikni na
**„Rozumiem tomu"** — tým si odškrtneš pokrok a získaš XP.

> 💡 Tip: Nemusíš ísť po poradí. Pokojne skáč medzi témami podľa toho, čo ťa zaujíma.

Na konci väčšiny tém je krátky **kvíz**. Keď ho zvládneš na 80 %+, odomkneš si
odznak danej témy. 🎉

## Kde sa pýtať

Nikdy sa neboj opýtať — to je úplne normálne a očakávané.

> 🏢 V KROSe: Prvé otázky smeruj na svojho mentora. Na technické veci máme aj
> tímové kanály — mentor ti ukáže ktoré.

## Tvoj týždeň

Cieľom prvého týždňa nie je všetko sa naučiť naspamäť, ale **zorientovať sa**:
- pochopiť, ako u nás veci do seba zapadajú,
- vedieť, kde čo hľadať,
- rozbehať si lokálne prostredie.

Prepínať jazyk (SK/EN) môžeš vpravo hore kedykoľvek. Veľa šťastia! 🚀
```

- [ ] **Step 2: Write the English content**

Create `buddy-site/topics/welcome/welcome.en.md`:
```markdown
# Welcome to Buddy 👋

This is your guide to the first week at KROS. Go at your own pace.

## How it works

Each topic has a few sub-topics. When you understand something, click
**"I understand this"** — that checks off your progress and earns XP.

> 💡 Tip: You don't have to go in order. Jump between topics as your curiosity leads.

Most topics end with a short **quiz**. Score 80%+ and you unlock that topic's
badge. 🎉

## Where to ask

Never be afraid to ask — it's completely normal and expected.

> 🏢 At KROS: Send your first questions to your mentor. We also have team
> channels for technical topics — your mentor will point you to them.

## Your week

The goal of week one isn't to memorize everything, but to **get oriented**:
- understand how things fit together here,
- know where to find what,
- get your local environment running.

You can switch language (SK/EN) at the top right anytime. Good luck! 🚀
```

- [ ] **Step 3: Manual verification**

Run `node serve.js 8000`, open http://localhost:8000/topic.html?id=welcome. Verify:
- Three sub-topics render, each with a check-off button.
- The three callouts render styled: tip (cyan), KROS (purple/blue-grey).
- Side-nav lists the three sub-topics; no quiz entry.
- Clicking a check-off fills its side-nav dot and ticks the topic progress bar.
- Refresh: the check stays. Switch to EN: prose changes, check stays.
- A "Ďalej → C#" button appears at the bottom (C# is the next `ready` topic).

- [ ] **Step 4: Commit**

```bash
git add buddy-site/topics/welcome
git commit -m "content: add Welcome topic (SK/EN)"
```

---

## Task 14: C# topic content + quiz (full vertical-slice proof)

**Files:**
- Create: `buddy-site/topics/csharp/csharp.sk.md`
- Create: `buddy-site/topics/csharp/csharp.en.md`
- Create: `buddy-site/topics/csharp/quiz.json`

Sub-topics match `_index.json` `subIds`: `async-metody`,
`ienumerable-a-materializacia`, `dependency-injection`. This is the universal-topic
template the user will later expand with KROS specifics (Service Bus, CQRS,
middlewares) in a content session.

- [ ] **Step 1: Write the Slovak content**

Create `buddy-site/topics/csharp/csharp.sk.md`:
```markdown
# C#

Tri základné koncepty, ktoré v našom backendovom kóde uvidíš úplne všade.

## Async metódy

{{term:async|async/await}} ti umožní písať neblokujúci kód. Metóda označená
`async` sa na `await` **pozastaví** a vráti riadenie volajúcemu, kým prebieha
napríklad volanie do databázy alebo HTTP request.

```csharp
public async Task<Customer> GetCustomerAsync(int id)
{
    // await uvoľní vlákno, kým DB pracuje
    var customer = await _repository.FindAsync(id);
    return customer;
}
```

> 💡 Tip: Vracaj `Task`/`Task<T>`, nie `void` (okrem event handlerov). `async void`
> sa nedá awaitovať a chyby z neho ťažko odchytíš.

> ⚠️ Pozor: Neblokuj async kód cez `.Result` ani `.Wait()` — vie to spôsobiť
> deadlock. Vždy `await`.

## IEnumerable a materializácia

{{term:ienumerable|IEnumerable}} je **lenivá** sekvencia — kým ju neprejdeš
(nematerializuješ), nič sa nevykoná. Materializácia nastane pri `foreach`,
`ToList()`, `Count()` a podobne.

```csharp
IEnumerable<int> query = numbers.Where(n => n > 5); // ešte sa nič nestalo
var list = query.ToList();                          // teraz sa to vyhodnotí
```

> ⚠️ Pozor: Ak nad tým istým `IEnumerable` iteruješ viackrát, dotaz sa vykoná
> viackrát. Ak to nechceš, materializuj raz do `List`.

## Dependency Injection

{{term:di|Dependency Injection}} (DI) znamená, že si závislosti nevytváraš sám,
ale dostaneš ich **cez konštruktor**. V ASP.NET ich registruješ v kontajneri.

```csharp
public class OrderService
{
    private readonly IOrderRepository _repo;
    public OrderService(IOrderRepository repo) => _repo = repo; // injektnuté
}
```

> 🏢 V KROSe: Konkrétne konvencie registrácie služieb a životnosti (scoped /
> singleton / transient) ti ukáže mentor na našom reálnom projekte.
```

- [ ] **Step 2: Write the English content**

Create `buddy-site/topics/csharp/csharp.en.md`:
```markdown
# C#

Three core concepts you'll see absolutely everywhere in our backend code.

## Async methods

{{term:async|async/await}} lets you write non-blocking code. A method marked
`async` **suspends** at `await` and returns control to the caller while, for
example, a database call or HTTP request is in flight.

```csharp
public async Task<Customer> GetCustomerAsync(int id)
{
    // await frees the thread while the DB works
    var customer = await _repository.FindAsync(id);
    return customer;
}
```

> 💡 Tip: Return `Task`/`Task<T>`, not `void` (except event handlers). `async void`
> can't be awaited and its errors are hard to catch.

> ⚠️ Pozor: Don't block async code with `.Result` or `.Wait()` — it can deadlock.
> Always `await`.

## IEnumerable and materialization

{{term:ienumerable|IEnumerable}} is a **lazy** sequence — nothing runs until you
iterate (materialize) it. Materialization happens at `foreach`, `ToList()`,
`Count()`, and similar.

```csharp
IEnumerable<int> query = numbers.Where(n => n > 5); // nothing happened yet
var list = query.ToList();                          // now it evaluates
```

> ⚠️ Pozor: If you iterate the same `IEnumerable` multiple times, the query runs
> multiple times. If you don't want that, materialize once into a `List`.

## Dependency Injection

{{term:di|Dependency Injection}} (DI) means you don't create dependencies
yourself — you receive them **via the constructor**. In ASP.NET you register them
in the container.

```csharp
public class OrderService
{
    private readonly IOrderRepository _repo;
    public OrderService(IOrderRepository repo) => _repo = repo; // injected
}
```

> 🏢 At KROS: Your mentor will show you the concrete service-registration
> conventions and lifetimes (scoped / singleton / transient) on our real project.
```

- [ ] **Step 3: Write the bilingual quiz**

Create `buddy-site/topics/csharp/quiz.json`:
```json
{
  "questions": [
    {
      "answer": 1,
      "sk": { "q": "Čo robí await vo vnútri async metódy?",
        "options": [
          "Zablokuje vlákno, kým operácia neskončí",
          "Pozastaví metódu a vráti riadenie volajúcemu",
          "Spustí operáciu na novom vlákne navždy",
          "Nič, je to len značka"],
        "explain": "await neblokuje — pozastaví metódu a uvoľní vlákno, kým operácia beží." },
      "en": { "q": "What does await do inside an async method?",
        "options": [
          "Blocks the thread until the operation finishes",
          "Suspends the method and returns control to the caller",
          "Runs the operation on a new thread forever",
          "Nothing, it's just a marker"],
        "explain": "await doesn't block — it suspends the method and frees the thread while the op runs." }
    },
    {
      "answer": 2,
      "sk": { "q": "Kedy sa vyhodnotí IEnumerable dotaz?",
        "options": [
          "Hneď pri jeho definovaní",
          "Nikdy, kým ho neuložíš",
          "Až pri iterácii / materializácii (napr. ToList)",
          "Iba pri prvom spustení aplikácie"],
        "explain": "IEnumerable je lenivý — vyhodnotí sa až pri foreach/ToList/Count." },
      "en": { "q": "When is an IEnumerable query evaluated?",
        "options": [
          "Immediately when defined",
          "Never, until you save it",
          "Only when iterated / materialized (e.g. ToList)",
          "Only on first app start"],
        "explain": "IEnumerable is lazy — it evaluates at foreach/ToList/Count." }
    },
    {
      "answer": 0,
      "sk": { "q": "Ako objekt pri DI typicky dostane svoje závislosti?",
        "options": [
          "Cez konštruktor",
          "Cez globálnu statickú premennú",
          "Vytvorí si ich sám cez new",
          "Načíta ich zo súboru"],
        "explain": "Pri DI prídu závislosti zvonku, najčastejšie cez konštruktor." },
      "en": { "q": "How does an object typically receive its dependencies with DI?",
        "options": [
          "Via the constructor",
          "Via a global static variable",
          "It creates them itself with new",
          "It reads them from a file"],
        "explain": "With DI dependencies come from outside, most often via the constructor." }
    }
  ]
}
```

- [ ] **Step 4: Full vertical-slice verification**

Run `node serve.js 8000`, open http://localhost:8000/topic.html?id=csharp. Verify:
- Three sub-topics render with C#-highlighted code blocks and working copy buttons.
- Glossary terms (async/await, IEnumerable, Dependency Injection) show tooltips on hover.
- Callouts render: tip (cyan), warn (beige), KROS (purple/blue-grey).
- Quiz renders 3 questions; submitting shows per-question correct/wrong + explanations and a score.
- Check off all three sub-topics, then pass the quiz (≥80%) → confetti fires.
- Return to hub: C# card shows `3/3 ★`, hero shows `1/2 tém hotových` with XP, and the **C# Apprentice** badge is unlocked (in color).
- Toggle the footer "Animácie" off on the hub, redo a completion → no confetti.

- [ ] **Step 5: Run the full test suite once more**

```bash
node --test
```
Expected: PASS — all suites green.

- [ ] **Step 6: Commit**

```bash
git add buddy-site/topics/csharp
git commit -m "content: add C# topic with bilingual quiz (vertical-slice proof)"
```

---

## Self-Review Notes (for the implementer)

- **Spec coverage:** Folder layout (Task 0), tokens/visual identity (Tasks 1-3),
  i18n (Task 4), progress/XP/badges (Task 5), content transforms + glossary +
  callouts (Task 6, 9, 12), quiz (Tasks 7, 12, 14), local server (Task 8), hub
  page (Task 11), topic page (Task 12), Welcome (Task 13), C# (Task 14).
  Match-game and clickable-diagram modules are **intentionally deferred** — they
  belong to the Git and Architecture/Client-Server content sessions (spec §11),
  not this vertical slice. The CSS for both is already in place (Task 3) so those
  sessions only add data + a small mount module.
- **Type consistency:** `topicProgress`, `isTopicComplete`, `computeXp`,
  `earnedBadges`, `toggleCheckoff`, `recordQuiz` signatures are identical across
  Task 5 (definition), Task 11 (hub) and Task 12 (topic). `scoreQuiz` shape
  `{correct,total,passed}` is consistent in Tasks 7, 12, 14. Glossary token
  syntax `{{term:id|text}}` is identical in Task 6 (parser), Task 9 (data) and
  Tasks 13-14 (content). Sub-topic ids from `slugify` match the `subIds` arrays
  in `_index.json` (verified: "Async metódy" → `async-metody`, etc.).
- **No placeholders:** every step contains complete code or exact commands.
```
