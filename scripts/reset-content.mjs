#!/usr/bin/env node
/**
 * reset-content.mjs — reset Buddy's CONTENT to a clean starter.
 *
 * For a new mentor or audience (e.g. a frontend mentor who used this repo as a
 * template): wipe all existing topics and quizzes so they can build their own
 * set, while leaving the ENGINE untouched (assets/, serve.js, scripts/, deploy/,
 * the skills). Afterwards there is exactly one generic, bilingual "welcome" topic
 * so the site still renders and doubles as a structure example to copy.
 *
 * This only touches topic CONTENT — it does NOT delete the engine, and everything
 * removed stays in git history, so a reset is always recoverable.
 *
 * Usage:
 *   node scripts/reset-content.mjs         # DRY RUN — list what would change
 *   node scripts/reset-content.mjs --yes   # actually apply the reset
 */
import { readdirSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const topicsDir = join(root, "buddy-site", "topics");
const glossaryFile = join(root, "buddy-site", "assets", "js", "glossary.json");
const apply = process.argv.includes("--yes");

const existingTopics = readdirSync(topicsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

// --- the clean starter state ---------------------------------------------
const registry = {
  topics: [
    {
      id: "welcome",
      order: 1,
      status: "ready",
      icon: "👋",
      badge: null,
      title: { sk: "Vitaj", en: "Welcome" },
      desc: {
        sk: "Tvoj štartovací bod — uprav túto tému a pridaj vlastné.",
        en: "Your starting point — edit this topic and add your own.",
      },
      subIds: ["ako-zacat", "ako-nasadit"],
    },
  ],
  badges: {},
};

const welcomeSk = `# Vitaj

Toto je **tvoj štartovací bod**. Buddy je interaktívna stránka, ktorú si
prispôsobíš pre svojich juniorov — vymažeš túto ukážku a pridáš vlastné témy.

## Ako začať

Uprav túto tému (Vitaj) podľa seba a potom pridávaj vlastné témy. Nemusíš nič
ručne upravovať v konfigurácii — stačí povedať Claudovi napr. *„pridaj tému o
…"*, *„presuň poradie tém"* alebo *„zmaž tému …"*. Použije sa skill
**topic-manager**, ktorý sa postará o správnu štruktúru aj o kvíz.

> 💡 Tip: Každá téma má svoj súbor pre slovenčinu (\`*.sk.md\`) a angličtinu
> (\`*.en.md\`). Nadpisy \`##\` sú podtémy. Detaily ti vysvetlí skill.

## Ako nasadiť

Keď máš obsah hotový, nasaď stránku na svoju vlastnú Azure Static Web Apps adresu
podľa **deploy/DEPLOYMENT.md**. Stačí povedať Claudovi *„nasaď Buddyho"*.
`;

const welcomeEn = `# Welcome

This is **your starting point**. Buddy is an interactive site you customize for
your juniors — delete this example and add your own topics.

## Getting started

Edit this Welcome topic, then add your own topics. You don't have to hand-edit any
config — just tell Claude e.g. *"add a topic about …"*, *"reorder the topics"*, or
*"remove the … topic"*. The **topic-manager** skill handles the structure and the
quiz for you.

> 💡 Tip: Each topic has a Slovak file (\`*.sk.md\`) and an English file
> (\`*.en.md\`). The \`##\` headings are subtopics. The skill explains the details.

## Deploying

When your content is ready, deploy the site to your own Azure Static Web Apps URL
following **deploy/DEPLOYMENT.md**. Just tell Claude *"deploy Buddy"*.
`;

// --- report (always) ------------------------------------------------------
console.log(apply ? "Resetting Buddy content…" : "DRY RUN — pass --yes to apply. This would:");
for (const d of existingTopics) console.log(`  - remove  topics/${d}/`);
console.log("  - write   topics/_index.json  (single generic 'welcome' topic, no badges)");
console.log("  - write   topics/welcome/welcome.sk.md + welcome.en.md  (clean placeholder)");
if (existsSync(glossaryFile)) console.log("  - reset   assets/js/glossary.json  ->  {}");
console.log("  (engine, scripts, deploy config, and skills are left untouched; removals stay in git history)");

if (!apply) {
  console.log("\nNothing changed. Re-run with --yes to apply.");
  process.exit(0);
}

// --- apply ----------------------------------------------------------------
for (const d of existingTopics) rmSync(join(topicsDir, d), { recursive: true, force: true });
writeFileSync(join(topicsDir, "_index.json"), JSON.stringify(registry, null, 2) + "\n");
mkdirSync(join(topicsDir, "welcome"), { recursive: true });
writeFileSync(join(topicsDir, "welcome", "welcome.sk.md"), welcomeSk);
writeFileSync(join(topicsDir, "welcome", "welcome.en.md"), welcomeEn);
if (existsSync(glossaryFile)) writeFileSync(glossaryFile, "{}\n");

console.log("\n✓ Reset done. Next:");
console.log("  1. node scripts/validate-topics.mjs   (should pass)");
console.log("  2. Edit topics/welcome/* and add your own topics (ask Claude — topic-manager).");
console.log("  3. Set your deploy target and deploy (see deploy/DEPLOYMENT.md).");
