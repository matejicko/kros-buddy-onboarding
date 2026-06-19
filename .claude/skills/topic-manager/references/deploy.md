# Deploying Buddy (single & multi-audience)

Buddy deploys to **Azure Static Web Apps** (free tier). No build step — the deploy
script ships `buddy-site/` as-is, after running the unit tests.

## Before deploying

- **Validate first** (Phase 3): `node scripts/validate-topics.mjs` and
  `node scripts/check-quiz.mjs`. The deploy script also runs `node --test` and
  aborts if tests fail.
- **Confirm with the mentor** — deploying is outward-facing. Confirm both that they
  want to publish and **which target** (audience/site).

## Single-site mentor (the default)

```bash
pwsh deploy/deploy.ps1
```

Token resolution order: `-Target` → `$env:BUDDY_SWA_TOKEN` → `deploy/.swa-token`.
A mentor with one site just needs the env var or the `deploy/.swa-token` file (set
up once — see `deploy/DEPLOYMENT.md`), and runs the bare command.

## Multiple audiences (e.g. backend vs frontend)

Each audience is its **own** Static Web App / URL. Configure them once in
`deploy/targets.json` (git-ignored — copy `deploy/targets.example.json`):

```json
{
  "backend":  { "token": "swa_xxx", "label": "Buddy — backend juniors" },
  "frontend": { "token": "swa_yyy", "label": "Buddy — frontend juniors" }
}
```

Then:

```bash
pwsh deploy/deploy.ps1 -ListTargets       # show configured targets (no secrets printed)
pwsh deploy/deploy.ps1 -Target frontend   # deploy to that audience's site
```

`-Env preview` publishes to a separate preview URL of the same app for testing
(its own origin, so its own progress).

> Each target is a different origin, so each audience's student progress is
> independent — that's expected.

## Verify it's actually live

Don't just trust "deploy succeeded" — confirm the change reached the site. The
deploy output prints the URL (e.g. `https://<name>.azurestaticapps.net`). Check the
registry and any changed file over HTTP:

```bash
# topic list + statuses as served
curl -s "https://<name>.azurestaticapps.net/topics/_index.json" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>JSON.parse(d).topics.sort((a,b)=>a.order-b.order).forEach(t=>console.log(t.order+'. '+t.title.en+' ['+t.status+']')))"

# a specific file you changed (200 = served)
curl -s -o /dev/null -w "%{http_code}\n" "https://<name>.azurestaticapps.net/topics/<id>/<id>.sk.md"
```

The site sends `cache-control: no-cache`, so a normal reload shows fresh content.
An already-open tab may need a hard refresh (Ctrl+F5).

## Student progress preservation (reassure the mentor)

Progress (check-offs, XP, badges, language, theme) lives in the student's browser
`localStorage` (`buddy.progress`, `buddy.lang`, `buddy.theme`, `buddy.anim`), keyed
to the **site origin** — not in the deployed files.

- **Safe:** re-deploying content, adding/removing/reordering topics, editing text.
  Progress is untouched.
- **Resets progress:** changing the site's URL/origin (adding a custom domain
  later, or recreating the app under a new name), the student clearing browser data
  or switching browser/device, or renaming the `localStorage` keys in code. If a
  custom domain is ever wanted, set it up **before** students start.

## Secrets — never expose

`deploy/targets.json` and `deploy/.swa-token` hold deployment tokens and are
git-ignored. Never print, echo, commit, or paste them. To rotate a leaked token,
reset it in the Azure Portal (Static Web App → *Manage deployment token → Reset*)
and update the local file.
