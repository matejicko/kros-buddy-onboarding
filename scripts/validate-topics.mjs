#!/usr/bin/env node
/**
 * validate-topics.mjs — integrity check for the Buddy topic registry & content.
 *
 * Why this exists: the #1 way to break the site silently is a mismatch between
 * a topic's registry `subIds` and the `##` headings in its Markdown. The renderer
 * maps the i-th heading to `subIds[i]` POSITIONALLY, so if the counts (or order)
 * drift between SK/EN and the registry, completion/badges/XP break — and nothing
 * throws. This script makes that (and other registry mistakes) loud.
 *
 * Usage:   node scripts/validate-topics.mjs
 * Exit:    0 = no errors (warnings allowed), 1 = at least one error.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// Reuse the renderer's REAL heading parser (skips fenced code blocks) so this
// check can never disagree with what the site actually does at runtime.
import { parseSubtopics } from "../buddy-site/assets/js/content-transforms.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const topicsDir = join(root, "buddy-site", "topics");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;

let reg;
try {
  reg = JSON.parse(readFileSync(join(topicsDir, "_index.json"), "utf8"));
} catch (e) {
  console.error(`FATAL: topics/_index.json is not valid JSON — ${e.message}`);
  process.exit(1);
}

const topics = reg.topics ?? [];
const badges = reg.badges ?? {};

// --- registry-wide checks -------------------------------------------------
const orders = topics.map((t) => t.order);
const dupOrders = [...new Set(orders.filter((o, i) => orders.indexOf(o) !== i))];
if (dupOrders.length) err(`Duplicate order values (topics would sort ambiguously): ${dupOrders.join(", ")}`);

const ids = topics.map((t) => t.id);
const dupIds = [...new Set(ids.filter((o, i) => ids.indexOf(o) !== i))];
if (dupIds.length) err(`Duplicate topic ids: ${dupIds.join(", ")}`);

// --- per-topic checks -----------------------------------------------------
for (const t of topics) {
  const tag = `[${t.id ?? "?"}]`;
  if (!t.id || !kebab.test(t.id)) err(`${tag} id is missing or not kebab-case`);
  if (typeof t.order !== "number") err(`${tag} order must be a number`);
  for (const lang of ["sk", "en"]) {
    if (!t.title?.[lang]) err(`${tag} missing title.${lang}`);
    if (!t.desc?.[lang]) warn(`${tag} missing desc.${lang}`);
  }
  if (t.badge && !badges[t.badge]) err(`${tag} references unknown badge "${t.badge}"`);

  if (!Array.isArray(t.subIds)) {
    err(`${tag} subIds must be an array`);
    continue;
  }
  const dupSub = [...new Set(t.subIds.filter((s, i) => t.subIds.indexOf(s) !== i))];
  if (dupSub.length) err(`${tag} duplicate subIds: ${dupSub.join(", ")}`);
  for (const s of t.subIds) if (!kebab.test(s)) err(`${tag} subId "${s}" is not kebab-case`);

  if (t.status !== "ready") {
    if (t.subIds.length) warn(`${tag} status is "${t.status}" but it already has subIds`);
    continue; // draft/hidden topics ship no content; nothing more to verify
  }

  // A "ready" topic must have both language files, and every heading count must
  // match the registry subIds exactly (positional mapping — order matters too).
  const dir = join(topicsDir, t.id);
  for (const lang of ["sk", "en"]) {
    const f = join(dir, `${t.id}.${lang}.md`);
    if (!existsSync(f)) {
      err(`${tag} is "ready" but ${t.id}.${lang}.md is missing`);
      continue;
    }
    const heads = parseSubtopics(readFileSync(f, "utf8"));
    if (heads.length !== t.subIds.length) {
      err(
        `${tag} ${lang}: ${heads.length} '##' heading(s) but registry has ` +
          `${t.subIds.length} subIds — must match in COUNT and ORDER ` +
          `(headings: ${heads.map((h) => h.title).join(" | ") || "none"})`,
      );
    }
  }

  const quizFile = join(dir, "quiz.json");
  if (existsSync(quizFile)) {
    try {
      JSON.parse(readFileSync(quizFile, "utf8"));
    } catch (e) {
      err(`${tag} quiz.json is not valid JSON — ${e.message}`);
    }
  }
}

// --- orphan badges (warn only) -------------------------------------------
for (const b of Object.keys(badges)) {
  if (!topics.some((t) => t.badge === b)) warn(`Badge "${b}" is defined but no topic uses it`);
}

// --- report ---------------------------------------------------------------
const line = "─".repeat(64);
const readyCount = topics.filter((t) => t.status === "ready").length;
console.log(line);
console.log(`Topic registry validation — ${topics.length} topics (${readyCount} ready)`);
console.log(line);
for (const w of warnings) console.log(`  ⚠ WARN   ${w}`);
for (const e of errors) console.log(`  ✖ ERROR  ${e}`);
if (!errors.length && !warnings.length) console.log("  ✓ All checks passed.");
else if (!errors.length) console.log(`  ✓ No errors (${warnings.length} warning(s) above).`);
console.log(line);
process.exit(errors.length ? 1 : 0);
