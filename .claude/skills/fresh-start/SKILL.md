---
name: fresh-start
description: >-
  Reset the Buddy onboarding site's CONTENT to a clean slate — remove ALL existing
  topics and quizzes, leaving the engine intact plus one generic Welcome topic — so
  a new mentor or audience (e.g. a frontend mentor who used this repo as a template)
  can build their own topic set from scratch. Use when someone says "reset Buddy",
  "start fresh", "clear all the topics", "wipe the content", "strip it down so I can
  start my own", "blank slate for a new audience", "I forked this and want to begin
  clean", or similar. This is destructive to topic CONTENT only (never the engine,
  scripts, deploy config, or skills) and is fully recoverable from git history.
  After resetting, hand off to the topic-manager skill to add the new topics.
---

# Fresh Start — reset Buddy content to a clean slate

A mentor who took this repo as a template inherits the original author's topics
(e.g. a backend set). This skill wipes that **content** so they can build their own,
while keeping everything that makes the site work.

## What it does (and doesn't)

- **Removes** every topic folder under `buddy-site/topics/`, resets
  `topics/_index.json` to a single generic bilingual **Welcome** topic (no badges),
  and blanks `assets/js/glossary.json` to `{}`.
- **Leaves untouched** the engine (`assets/`, `serve.js`), the validation scripts,
  the deploy config, and the skills themselves.
- **Recoverable:** everything removed stays in git history, so a reset is never a
  one-way door — the original topics can always be retrieved or referenced.

The leftover Welcome topic keeps the site valid/renderable and doubles as a small
structure example to copy.

## Workflow

1. **Confirm — this is destructive.** Tell the mentor plainly: this deletes all
   current topics and quizzes (recoverable from git history) and leaves one
   placeholder Welcome. Get an explicit "yes" before doing anything. If they only
   want to drop a few topics (not all), that's the **topic-manager** skill instead,
   not this one.

2. **Dry run first** (shows exactly what will change, changes nothing):
   ```bash
   node scripts/reset-content.mjs
   ```

3. **Apply** once they've confirmed:
   ```bash
   node scripts/reset-content.mjs --yes
   ```

4. **Validate** the clean state:
   ```bash
   node scripts/validate-topics.mjs
   ```

5. **Hand off.** Point the mentor at next steps: edit `topics/welcome/welcome.sk.md`
   + `welcome.en.md` to suit their audience, then add their own topics with the
   **topic-manager** skill (just ask Claude, e.g. "add a topic on …"). When ready,
   set their deploy target and deploy — see `deploy/DEPLOYMENT.md`. Remind them their
   site is their own Azure Static Web App / URL (separate from anyone else's).

## Guardrails

- Never run `--yes` without an explicit confirmation in the conversation.
- Don't touch secrets (`deploy/targets.json`, `deploy/.swa-token`) — the reset
  script doesn't, and neither should you.
- If the mentor wants to keep some existing topics as references, suggest they do
  that via topic-manager (remove only the ones they don't want) instead of a full
  reset.
