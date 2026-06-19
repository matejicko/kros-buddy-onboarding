# Buddy — interactive junior onboarding site

Buddy is a **bilingual (SK/EN), interactive onboarding website** for new junior
developers. A mentor curates a set of **topics** (each a short lesson + an optional
hard quiz); the junior works through them in their first week, earning XP and
badges as they go.

It's a **static site — no build step**: HTML + CSS + vanilla JS, topic content in
Markdown, quizzes in JSON. You edit files and deploy the folder as-is.

> **New here / using this as a template?** Jump to
> [For a new mentor](#for-a-new-mentor-using-this-as-a-template).

## Quick start (preview locally)

```bash
node buddy-site/serve.js 8000      # any OS
# or on Windows:  buddy-site\serve.cmd
```
Open <http://localhost:8000>. (Opening the files directly via `file://` won't work
— the Markdown loader uses `fetch`, which needs a server.)

## Managing topics — just ask Claude

This repo ships a Claude Code skill called **`topic-manager`**. You don't hand-edit
the registry; you describe what you want and it does it correctly (and validates):

- *"add a topic about React hooks, after the CSS one"*
- *"remove the KORM topic"*
- *"reorder the topics so Git comes first"*
- *"the Azure quiz is too easy, make it harder"*
- *"deploy Buddy to the frontend site"*

It enforces the one rule that otherwise breaks the site silently — that each
topic's subtopic ids line up with its Markdown headings in **both** languages — and
checks every quiz for fairness. See `.claude/skills/topic-manager/` for the details.

## Validation

Two scripts back the skill (and are worth running before any deploy):

```bash
node scripts/validate-topics.mjs     # registry + content integrity
node scripts/check-quiz.mjs          # quiz structure + difficulty/fairness audit
node --test                          # unit tests (the deploy script runs these too)
```

## Deploying

Buddy is hosted on **Azure Static Web Apps** (free tier). Once your token is set up:

```bash
pwsh deploy/deploy.ps1                 # default site
pwsh deploy/deploy.ps1 -Target <name>  # a specific audience's site
```

Full setup (one-time Azure resource + token), multi-audience targets, and the
student-progress guarantees are in **[`deploy/DEPLOYMENT.md`](deploy/DEPLOYMENT.md)**.

## For a new mentor (using this as a template)

This repo is a **GitHub template** — click **"Use this template"** to get your own
clean, private copy (better than a fork: it's independent and not linked back here).
Then:

1. **Start from a blank slate.** Tell Claude *"reset Buddy / start fresh"* — the
   **`fresh-start`** skill removes all inherited topics and leaves one generic
   Welcome topic to build from. (Equivalent: `node scripts/reset-content.mjs --yes`.
   Everything removed stays in git history, so it's recoverable.)
2. **Add your own topics** with the `topic-manager` skill (see above). The content
   is audience-agnostic — backend, frontend, anything.
3. **Set up your own deploy target** (your own Azure Static Web App) per
   `deploy/DEPLOYMENT.md`, then deploy.

Your site is your own URL with its own student progress — independent of any other
mentor's.

## Repo layout

```
buddy-site/            the site (deployed as-is)
  index.html, topic.html
  assets/              js engine, css, vendored libs, favicon, glossary
  topics/              _index.json registry + one folder per topic (sk/en md + quiz.json)
  serve.js             local preview server
scripts/               validate-topics.mjs, check-quiz.mjs, reset-content.mjs
deploy/                deploy.ps1 + DEPLOYMENT.md (Azure Static Web Apps)
.claude/skills/        topic-manager (manage content) and fresh-start (reset) skills
```

## Notes

- **Student progress is preserved** across re-deploys — it lives in the browser
  (`localStorage`) tied to the site URL, not in the deployed files. The one thing
  that resets it is changing the site's origin/URL. Details in `deploy/DEPLOYMENT.md`.
- **Default language is SK**; Slovak prose keeps English technical terms, English
  content is fully English.
