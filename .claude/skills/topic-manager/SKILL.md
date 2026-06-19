---
name: topic-manager
description: >-
  Add, remove, reorder, or revise topics on the Buddy onboarding site (the static
  bilingual SK/EN learning site under buddy-site/), then validate everything and
  deploy it to the mentor's Azure Static Web Apps target. Use this whenever a
  mentor wants to change which topics appear, their order, their content, or wants
  to publish/deploy the Buddy site — including phrasings like "add a topic", "remove
  the X topic", "reorder the topics", "change the topic list", "edit a lesson",
  "fix the quiz", "publish Buddy", or "deploy Buddy (to frontend/backend)". Works for
  ANY audience (backend, frontend, etc.) and ANY topic set — never assume a fixed
  list. Prefer this skill over editing topics/_index.json or running the deploy
  script by hand, because it enforces the subId↔heading alignment and quiz-fairness
  rules that otherwise break the site silently.
---

# Topic Manager

Manage the topics of the **Buddy** onboarding site safely: change the topic list
or content, **validate**, then **deploy** to the right audience's site.

Buddy is a no-build static site (`buddy-site/`): HTML + CSS + vanilla JS ES
modules, with topic content as Markdown and quizzes as JSON. Topics are listed in
a registry (`buddy-site/topics/_index.json`) and rendered client-side. There is
**no build step** — you edit files and deploy the folder as-is.

This skill is **content-agnostic**: the current topics happen to be backend-oriented,
but a frontend mentor (or any other) manages their own set the same way. Never
hard-code or assume a particular topic list.

## The workflow — always these four phases

Work through them in order. Don't skip validation, and confirm before the two
outward/destructive actions (deleting topics, deploying).

1. **Understand** what the mentor wants and which site it applies to.
2. **Change** the topics/content.
3. **Validate** with the two scripts, and fix anything they flag.
4. **Deploy** to the chosen target and verify it's live.

---

## Phase 1 — Understand

Figure out, asking the mentor only if genuinely unclear:

- **Operation(s):** add / remove / reorder / revise content / fix a quiz / just deploy.
- **Which topic(s)** and, for add, roughly what content (the mentor supplies the
  substance for company-specific topics; you can draft universal ones).
- **Which audience/site** this deploys to. If `deploy/targets.json` exists, run
  `pwsh deploy/deploy.ps1 -ListTargets` to see configured targets and pick the
  right one. If there's only the single default token, there's nothing to choose.

Read `buddy-site/topics/_index.json` first to see the current state (ids, orders,
statuses, badges).

## Phase 2 — Change

Each operation has exact mechanics and footguns in
`references/topic-structure.md` — **read it before adding or editing topics.**
The non-negotiable rule, summarized:

> A "ready" topic's `subIds` array in the registry must line up **positionally**
> with the `##` headings in BOTH `<id>.sk.md` and `<id>.en.md` — same **count**
> and same **order**. The renderer maps the i-th heading to `subIds[i]`, so SK and
> EN headings may differ in wording but must match in number and sequence. Get
> this wrong and completion, XP, badges, and confetti break **silently**.

Quick reference for each operation (details in the reference file):

- **Add:** create `topics/<id>/<id>.sk.md` + `<id>.en.md` (an `# H1` title, then
  `##` subtopic headings), derive kebab-case `subIds` from the headings, optionally
  add `quiz.json`, then add a registry entry with `status: "ready"`, an `order`, an
  `icon`, and a `badge` (add the badge definition too if it's new).
- **Remove:** delete `topics/<id>/`, remove its registry entry, and remove its
  badge from the `badges` map **iff** no other topic uses it. (To hide without
  deleting, set `status` to something other than `"ready"` instead.) To wipe
  *all* topics for a clean start (e.g. a new audience), use the **`fresh-start`**
  skill instead of removing them one by one.
- **Reorder:** change the numeric `order` fields only. Keep them unique; clean
  sequential integers are easiest to read.
- **Revise content / fix a quiz:** edit the Markdown or `quiz.json`. If you add or
  remove a `##` heading, update `subIds` to match. For quizzes, follow the
  fairness standard in `references/quiz-standard.md`.

## Phase 3 — Validate (never skip)

Run both checkers from the repo root and fix anything reported as an **ERROR**
(warnings are advisory but usually worth addressing):

```bash
node scripts/validate-topics.mjs        # registry + subId↔heading alignment + JSON
node scripts/check-quiz.mjs             # quiz structure + difficulty/anti-tell audit
node scripts/check-quiz.mjs <topicId>   # just one quiz, when iterating
```

`validate-topics.mjs` catches the silent killers: heading/subId mismatches, invalid
JSON, unknown badge references, duplicate orders. `check-quiz.mjs` reports each
quiz's answer-index spread and the "correct answer is the longest option" tell —
see `references/quiz-standard.md` for what good looks like and how to fix tells.

The deploy script also runs `node --test` (the unit tests) before shipping, so if
those are red, fix them too.

## Phase 4 — Deploy & verify

Deploying is outward-facing — **confirm with the mentor** (and which target) before
running it. Then from the repo root:

```bash
pwsh deploy/deploy.ps1                 # default target (single-site mentor)
pwsh deploy/deploy.ps1 -Target <name>  # a named audience from deploy/targets.json
```

After it reports the URL, verify the change is actually live (don't just trust the
deploy succeeded). See `references/deploy.md` for target setup, live-verification
commands, and the progress-preservation guarantees to reassure the mentor about.

---

## Guardrails

- **Confirm before deleting a topic or deploying.** Both are hard to walk back;
  the rest (adding, editing, reordering) is safe to just do.
- **Don't touch secrets.** `deploy/targets.json` and `deploy/.swa-token` are
  git-ignored tokens — never print, commit, or paste them.
- **Student progress is preserved** across re-deploys (it's browser `localStorage`
  tied to the site URL). The one thing that resets it is changing the site's
  origin/URL — flag that to the mentor if it ever comes up. Details in
  `references/deploy.md`.
- **External links open in a new tab automatically** (the renderer adds
  `target="_blank"` to `http(s)` links). Link to another Buddy topic with a
  relative `topic.html?id=<id>` link instead.

## Reference files

- `references/topic-structure.md` — registry shape, file layout, the subId↔heading
  alignment rule, and content conventions (callouts, diagrams, links, glossary).
  **Read before adding or editing a topic.**
- `references/quiz-standard.md` — quiz JSON shape and the anti-tell fairness
  standard (parallel option lengths, rationale in `explain`, even answer-index
  spread), plus how to interpret and fix `check-quiz.mjs` output.
- `references/deploy.md` — single vs. multi-audience deploy, target setup, live
  verification, and progress-preservation facts.
