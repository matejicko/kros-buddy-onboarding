<#
  Buddy -> Azure Static Web Apps deployment.

  Usage:
    pwsh deploy/deploy.ps1                    # deploy to the default target
    pwsh deploy/deploy.ps1 -Env preview       # deploy to a separate "preview" URL
    pwsh deploy/deploy.ps1 -Target frontend   # deploy to a named target (own domain)
    pwsh deploy/deploy.ps1 -ListTargets       # show configured targets (no secrets)

  Multiple audiences (e.g. backend vs frontend juniors) can each ship to their
  OWN Azure Static Web App / domain. Targets live in deploy/targets.json
  (git-ignored), mapping a short name to its deployment token:

      {
        "backend":  { "token": "swa_xxx", "label": "Buddy — backend juniors" },
        "frontend": { "token": "swa_yyy", "label": "Buddy — frontend juniors" }
      }

  The deployment token is resolved in this order:
    1. -Target <name>           -> token from deploy/targets.json
    2. $env:BUDDY_SWA_TOKEN
    3. deploy/.swa-token        (a local, git-ignored single-token file)

  See deploy/DEPLOYMENT.md for the full guide. Tokens are secrets:
  they are never printed and never committed.
#>
[CmdletBinding()]
param(
    [string]$Env = "production",
    [string]$Target,
    [switch]$ListTargets
)

$ErrorActionPreference = "Stop"

$repoRoot   = Split-Path -Parent $PSScriptRoot
$app        = Join-Path $repoRoot "buddy-site"
$targetsFile = Join-Path $PSScriptRoot "targets.json"

function Get-Targets {
    if (Test-Path $targetsFile) {
        try { return (Get-Content $targetsFile -Raw | ConvertFrom-Json) }
        catch { Write-Error "deploy/targets.json is not valid JSON: $($_.Exception.Message)" }
    }
    return $null
}

# -ListTargets: print configured target names + labels (never the tokens).
if ($ListTargets) {
    $t = Get-Targets
    if ($null -eq $t) { Write-Host "No deploy/targets.json found. The default token path will be used."; exit 0 }
    Write-Host "Configured deploy targets:" -ForegroundColor Cyan
    foreach ($name in ($t.PSObject.Properties.Name)) {
        $label = $t.$name.label
        Write-Host ("  {0,-12} {1}" -f $name, ($label ?? ""))
    }
    exit 0
}

if (-not (Test-Path (Join-Path $app "index.html"))) {
    Write-Error "Could not find buddy-site/index.html next to this script. Run from the project."
}

# 1) Resolve the deployment token (never echoed).
$token = $null
$targetLabel = $null
if (-not [string]::IsNullOrWhiteSpace($Target)) {
    $targets = Get-Targets
    if ($null -eq $targets -or -not $targets.PSObject.Properties.Name.Contains($Target)) {
        Write-Error "Target '$Target' not found in deploy/targets.json. Run 'pwsh deploy/deploy.ps1 -ListTargets' to see configured targets."
    }
    $token = $targets.$Target.token
    $targetLabel = $targets.$Target.label
    if ([string]::IsNullOrWhiteSpace($token)) { Write-Error "Target '$Target' has no token in deploy/targets.json." }
}
if ([string]::IsNullOrWhiteSpace($token)) { $token = $env:BUDDY_SWA_TOKEN }
if ([string]::IsNullOrWhiteSpace($token)) {
    $tokenFile = Join-Path $PSScriptRoot ".swa-token"
    if (Test-Path $tokenFile) { $token = (Get-Content $tokenFile -Raw).Trim() }
}
if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Error "No deployment token found. Use -Target <name> (deploy/targets.json), set `$env:BUDDY_SWA_TOKEN, or create deploy/.swa-token. See deploy/DEPLOYMENT.md."
}
if ($targetLabel) { Write-Host "==> Target: $Target ($targetLabel)" -ForegroundColor Cyan }

# 2) Safety gate: the unit tests must pass before anything ships.
Write-Host "==> Running unit tests..." -ForegroundColor Cyan
Push-Location $app
try {
    node --test
    if ($LASTEXITCODE -ne 0) { throw "Unit tests failed - deployment aborted." }
} finally {
    Pop-Location
}

# 3) Deploy the static folder. No build step: we ship buddy-site/ as-is.
Write-Host "==> Deploying buddy-site to Azure Static Web Apps (env: $Env)..." -ForegroundColor Cyan
npx --yes @azure/static-web-apps-cli deploy $app --deployment-token $token --env $Env
if ($LASTEXITCODE -ne 0) { Write-Error "SWA deploy failed (see output above)." }

Write-Host ""
Write-Host "==> Done." -ForegroundColor Green
Write-Host "    Student progress is preserved: it lives in the browser (localStorage)," -ForegroundColor Green
Write-Host "    tied to the stable site URL, and is untouched by re-deploys." -ForegroundColor Green
