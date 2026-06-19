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

## Manage topics (preferred: just ask Claude)
This repo ships Claude Code skills — describe what you want and they keep the
structure valid:
- **`topic-manager`** — add / remove / reorder / revise topics and quizzes, then
  validate and deploy (e.g. *"add a topic about X"*, *"reorder the topics"*).
- **`fresh-start`** — wipe all topics back to a clean Welcome scaffold so a new
  mentor/audience can start from scratch.

Manual path (what the skill does under the hood):
1. Create `topics/<id>/<id>.sk.md` and `<id>.en.md` (sub-topics are `##` headings).
2. Add optional `quiz.json` (bilingual) and `match.json` / `diagram.svg`.
3. Register the topic in `topics/_index.json` (set `"status": "ready"` to publish;
   `"draft"` shows a "V príprave" pill). Add the badge id to the topic entry and a
   medal entry in `_index.json`.
4. **Critical:** the `##` heading count/order in both languages must match the
   topic's `subIds`. Verify with `node ../scripts/validate-topics.mjs`, and check
   quizzes with `node ../scripts/check-quiz.mjs <id>`.

## Deploy
Azure Static Web Apps (no build step). From the repo root:
`pwsh deploy/deploy.ps1` (or `-Target <name>` for a specific audience). Full guide:
`../deploy/DEPLOYMENT.md`. `.nojekyll` is included; all paths are relative.
