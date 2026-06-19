# Buddy — Deployment Guide (for the mentor)

Buddy is a static website (no build step). It is hosted on **Azure Static Web
Apps (SWA)**, free tier. Deployment uploads the `buddy-site/` folder to a stable
URL like `https://<name>.azurestaticapps.net`.

**Student progress is safe across re-deploys.** Progress (check-offs, XP, badges,
chosen language/theme) lives in the student's **browser** under `localStorage`,
bound to the site's URL — not in the deployed files. Pushing new content does
**not** touch it. See "How progress persists" below for the few things that
*would* reset it.

---

## TL;DR — how to deploy

Once the one-time setup is done, deploying is a single step:

- **Just ask Claude:** "deploy Buddy" — Claude runs the script below.
- **Or do it yourself** from the project root (`D:\Projects\Topics\Buddy`):
  ```powershell
  pwsh deploy/deploy.ps1
  ```

The script runs the unit tests first, then publishes `buddy-site/` to the
production URL. That's it.

---

## One-time setup (do this once)

You need an Azure account with an active subscription. Node.js is already
installed. Pick **one** of the two paths below.

### Path A — Azure Portal (no command line)

1. Go to <https://portal.azure.com> → **Create a resource** → search
   **Static Web App** → **Create**.
2. Fill in:
   - **Subscription / Resource group:** your KROS subscription / a resource group
     (create one, e.g. `rg-buddy`).
   - **Name:** `buddy-onboarding` (this becomes part of the URL).
   - **Plan type:** **Free**.
   - **Region:** West Europe (or nearest).
   - **Deployment source:** choose **Other** (we deploy with a token, not from
     GitHub).
3. Click **Review + create** → **Create**. Wait ~1 minute.
4. Open the resource → in the left menu find **Manage deployment token** (or the
   **Overview** page's "Manage deployment token" button) → **copy** the token.
5. Note the site URL on the **Overview** page (the
   `https://….azurestaticapps.net` value). This is the stable URL students use.

### Path B — Azure CLI (faster, scriptable)

From a terminal:
```powershell
az login                                   # opens a browser; sign in with your KROS account
az group create -n rg-buddy -l westeurope  # skip if you already have a resource group
az staticwebapp create -n buddy-onboarding -g rg-buddy --sku Free

# Get the deployment token (this is the secret the deploy script needs):
az staticwebapp secrets list -n buddy-onboarding -g rg-buddy --query "properties.apiKey" -o tsv

# Get the public URL:
az staticwebapp show -n buddy-onboarding -g rg-buddy --query "defaultHostname" -o tsv
```

> Claude can run Path B **with you** — you run `az login` yourself (type
> `! az login` in the Claude prompt so it runs in this session), then ask Claude
> to create the resource and wire up the token.

### Store the deployment token (one of two ways)

The token lets the deploy script publish without an interactive Azure login.
**Treat it like a password.** It is already git-ignored, so it can never be
committed.

- **Simplest — a local file.** Save the token to `deploy/.swa-token` (one line,
  no quotes). The deploy script reads it automatically.
- **Or — an environment variable.** Set `BUDDY_SWA_TOKEN`. To make it permanent,
  add this to your PowerShell profile (`notepad $PROFILE`):
  ```powershell
  $env:BUDDY_SWA_TOKEN = "<paste-token-here>"
  ```

That's the whole one-time setup. From now on, deploying is just
`pwsh deploy/deploy.ps1` (or asking Claude).

---

## Multiple audiences (e.g. backend vs frontend juniors)

Different mentors can run **their own** Buddy site, each with its own topic set
and its own URL — they just deploy to a **different Static Web App**.

> Starting a brand-new audience from this repo? Use the **`fresh-start`** skill
> (or `node scripts/reset-content.mjs --yes`) to clear the inherited topics first,
> then build your own with the `topic-manager` skill.


1. Each mentor creates their own SWA (one-time setup above) and copies its token.
2. Copy `deploy/targets.example.json` to **`deploy/targets.json`** (git-ignored)
   and add one entry per audience:
   ```json
   {
     "backend":  { "token": "swa_xxx", "label": "Buddy — backend juniors" },
     "frontend": { "token": "swa_yyy", "label": "Buddy — frontend juniors" }
   }
   ```
3. Deploy to a chosen audience:
   ```powershell
   pwsh deploy/deploy.ps1 -Target frontend
   pwsh deploy/deploy.ps1 -ListTargets    # show configured targets (no secrets printed)
   ```

With no `-Target`, the script falls back to `$env:BUDDY_SWA_TOKEN` or
`deploy/.swa-token` — so a single-site mentor needs none of this.

> Note: each target is a separate origin, so each has its **own** student
> progress (that's expected — they're different audiences on different URLs).

---

## Updating content, then deploying

1. Add or edit a topic (see `buddy-site/README.md` → "Add a topic"). In short:
   create `topics/<id>/<id>.sk.md` + `<id>.en.md`, optional `quiz.json`, then set
   the topic's `status` to `"ready"` in `topics/_index.json`.
2. Deploy: `pwsh deploy/deploy.ps1` (or ask Claude to deploy).

The site uses `cache-control: no-cache`, so students get the new content on their
next page load — while their progress stays intact.

---

## How progress persists (and what would reset it)

Progress is stored in the browser via `localStorage` under these keys:
`buddy.progress`, `buddy.lang`, `buddy.theme`, `buddy.anim`. It is keyed by the
**site origin** (the `https://….azurestaticapps.net` URL).

**Safe — does NOT reset progress:**
- Re-deploying new or changed content to the same Static Web App. ✅
- Adding topics, fixing text, changing styles. ✅

**Would reset progress (avoid, or do before students start):**
- Changing the site's URL/origin — e.g. **adding a custom domain** later, or
  deleting and recreating the Static Web App under a new name. A new origin = a
  fresh, empty `localStorage`.
- The student clearing their browser data, or using a different browser/device
  (progress is per-browser, there is no server-side account).
- Renaming the `localStorage` keys in code (don't).

> Recommendation: if you plan to use a **custom domain**, set it up **before** the
> student begins, so their progress is created against the final URL.

---

## Optional, for later

- **Custom domain:** SWA → *Custom domains*. Do it early (see above).
- **Lock it down (KROS-internal):** once company-specific topics are added, you
  can require login. SWA supports built-in auth (Microsoft Entra ID / Azure AD) —
  add a `staticwebapp.config.json` route rule requiring `authenticated`. Ask
  Claude to wire this when you need it.
- **Preview deploys:** `pwsh deploy/deploy.ps1 -Env preview` publishes to a
  separate preview URL for testing. Note: a preview URL is a *different origin*,
  so it has its **own** progress, separate from production.

---

## Troubleshooting

- **"No deployment token found."** You haven't stored the token. Create
  `deploy/.swa-token` or set `$env:BUDDY_SWA_TOKEN` (see above).
- **Tests fail / deploy aborts.** The script refuses to deploy if `node --test`
  fails. Fix the failing test first (run `node --test` inside `buddy-site/`).
- **Students see old content.** They may have a cached tab open — a hard refresh
  (Ctrl+F5) fixes it. New loads are already fresh (`no-cache`).
- **`npx` asks to install `@azure/static-web-apps-cli`.** That's normal on first
  run; it downloads the CLI once. Needs internet access.
- **Token leaked / rotate it.** In the Portal use *Manage deployment token →
  Reset*, or `az staticwebapp secrets reset -n buddy-onboarding -g rg-buddy`,
  then update `deploy/.swa-token`.
