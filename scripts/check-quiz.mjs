#!/usr/bin/env node
/**
 * check-quiz.mjs — quiz structure & difficulty checker for Buddy topics.
 *
 * Encodes the house "anti-tell" standard so a quiz can't be solved by pattern
 * instead of understanding:
 *   - the correct answer must NOT usually be the longest option (a length tell);
 *   - the correct answer index must be spread across positions, not parked on one;
 *   - SK and EN must have the same number of options per question;
 *   - the answer index must be in range;
 *   - the rationale belongs in `explain`, not baked into the correct option;
 *   - options shouldn't contain stray non-Latin characters (a past bug).
 *
 * Usage:   node scripts/check-quiz.mjs [topicId]   (no arg = every topic with a quiz)
 * Exit:    0 = no hard errors (warnings allowed), 1 = at least one hard error.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const topicsDir = join(root, "buddy-site", "topics");

const only = process.argv[2];
const ids = only
  ? [only]
  : readdirSync(topicsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(topicsDir, d.name, "quiz.json")))
      .map((d) => d.name);

// First character outside the expected set (ASCII + Latin diacritics + common
// typographic punctuation + arrows), or null. Catches e.g. a stray Cyrillic/Arabic letter.
function strayChar(s) {
  for (const ch of s) {
    const c = ch.codePointAt(0);
    const ok =
      c === 9 || c === 10 || c === 13 ||
      (c >= 0x20 && c <= 0x7e) || // ASCII printable
      (c >= 0xa0 && c <= 0x24f) || // Latin-1 + Latin Extended-A/B (Slovak diacritics)
      (c >= 0x2010 && c <= 0x2027) || // dashes, quotes, ellipsis
      (c >= 0x2030 && c <= 0x205e) || // misc punctuation
      (c >= 0x2190 && c <= 0x21ff); // arrows
    if (!ok) return ch;
  }
  return null;
}

const line = "─".repeat(64);
let hardErrors = 0;

for (const id of ids) {
  const file = join(topicsDir, id, "quiz.json");
  if (!existsSync(file)) {
    console.log(`[${id}] no quiz.json — skipped`);
    continue;
  }
  let quiz;
  try {
    quiz = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.log(line);
    console.log(`✖ [${id}] quiz.json invalid JSON — ${e.message}`);
    hardErrors++;
    continue;
  }

  const qs = quiz.questions ?? [];
  const n = qs.length;
  const issues = [];
  const warns = [];
  const maxOpts = Math.max(2, ...qs.map((q) => q.sk?.options?.length ?? 0));
  const dist = Array(maxOpts).fill(0);
  const sl = { sk: 0, en: 0 };

  if (quiz.pick != null && quiz.pick > n) issues.push(`pick=${quiz.pick} but there are only ${n} questions`);

  qs.forEach((q, i) => {
    const ko = q.sk?.options?.length;
    const eo = q.en?.options?.length;
    for (const lang of ["sk", "en"]) {
      const o = q[lang]?.options;
      if (!Array.isArray(o) || o.length < 2) issues.push(`Q${i} ${lang}: needs at least 2 options`);
    }
    if (ko != null && eo != null && ko !== eo)
      issues.push(`Q${i}: sk has ${ko} options but en has ${eo} (must match)`);
    if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= (ko ?? 0))
      issues.push(`Q${i}: answer index ${q.answer} is out of range (0..${(ko ?? 1) - 1})`);
    else if (q.answer < dist.length) dist[q.answer]++;
    if (!q.sk?.explain || !q.en?.explain)
      warns.push(`Q${i}: missing 'explain' — keep the rationale there, not inside the correct option`);

    for (const lang of ["sk", "en"]) {
      const o = q[lang]?.options;
      if (!Array.isArray(o)) continue;
      const lens = o.map((x) => x.length);
      const max = Math.max(...lens);
      if (typeof q.answer === "number" && lens[q.answer] === max && lens.filter((L) => L === max).length === 1)
        sl[lang]++;
      o.forEach((opt, oi) => {
        const stray = strayChar(opt);
        if (stray) warns.push(`Q${i} ${lang} option ${oi}: stray character "${stray}" (U+${stray.codePointAt(0).toString(16).toUpperCase()})`);
      });
    }
  });

  const pct = (c) => (n ? Math.round((100 * c) / n) : 0);
  console.log(line);
  console.log(`Quiz: ${id}  —  ${n} questions, pick ${quiz.pick ?? n}`);
  console.log(`  answer-index distribution : ${dist.join("/")}  (positions 0..${maxOpts - 1})`);
  console.log(`  "correct = longest" tell  : sk ${sl.sk}/${n} (${pct(sl.sk)}%), en ${sl.en}/${n} (${pct(sl.en)}%)   [random ≈ ${Math.round(100 / maxOpts)}%, aim ≤ ~33%]`);

  if (pct(sl.sk) > 40 || pct(sl.en) > 40)
    warns.push(`length tell is high (>40%) — the correct answer is too often the longest; even out option lengths or move detail to 'explain'`);
  if (n >= 8) {
    const used = dist;
    const skew = Math.max(...used) - Math.min(...used);
    if (skew > Math.ceil(n / 2))
      warns.push(`answer positions look skewed (${used.join("/")}) — spread the correct index more evenly across positions`);
  }

  for (const w of warns) console.log(`  ⚠ ${w}`);
  for (const e of issues) {
    console.log(`  ✖ ${e}`);
    hardErrors++;
  }
  if (!warns.length && !issues.length) console.log("  ✓ structure OK, no tells detected");
}

console.log(line);
process.exit(hardErrors ? 1 : 0);
