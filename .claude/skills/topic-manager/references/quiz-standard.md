# Quiz JSON & the anti-tell fairness standard

Quizzes must make the student **think**, not pattern-match. The mentor cares
specifically that a student can't pass by picking the longest option or by guessing
a fixed position. This file is the standard, plus how to read `check-quiz.mjs`.

## `quiz.json` shape

```json
{
  "pick": 6,
  "questions": [
    {
      "answer": 2,
      "sk": { "q": "Otázka po slovensky?",
        "options": ["A", "B", "Správna", "D"],
        "explain": "Prečo je správna C — vysvetlenie sem, nie do možnosti." },
      "en": { "q": "Question in English?",
        "options": ["A", "B", "Correct", "D"],
        "explain": "Why C is correct — the rationale goes HERE, not in the option." }
    }
  ]
}
```

- `pick` (optional) — show this many questions, drawn at random from the bank each
  attempt. Must be ≤ the number of questions. A bank larger than `pick` (e.g. 12
  questions, `pick: 6`) keeps retries fresh.

**How big?** A good default is a bank of **~12 questions with `pick: 6`** (a big
topic like C# uses 20/`pick: 10`). Keep the bank meaningfully larger than `pick` —
a couple extra at minimum — so a re-attempt isn't the same questions. For a tiny
topic, ~6 questions with `pick: 5` is fine. Match the depth to the topic.
- `answer` — 0-based index of the correct option.
- `sk` / `en` — each has `q`, `options` (same **count** in both languages), and
  `explain`. SK and EN must have the same number of options per question.

## The fairness rules

1. **Parallel option lengths.** Keep all four options about the same length. The
   correct one must not stand out as longest (or shortest). Put any extra
   justification in `explain`, never in the correct option.
2. **Rationale lives in `explain`.** That's what's shown after answering — it
   teaches. Don't smuggle the reasoning into the correct option text.
3. **Spread the answer index.** Across the whole bank, distribute the correct
   `answer` roughly evenly over positions 0–3. Don't park it on one index.
4. **Plausible distractors.** Wrong options should be believable to someone who
   half-knows the material — paraphrase real misconceptions, don't write obvious
   joke answers.
5. **Scenario framing beats recall.** Prefer "X happens — what's the cause/next
   step?" over "What is the definition of X?". Rephrase; don't echo the lesson's
   exact wording.

## JSON gotchas (these have bitten before)

- **Slovak quotation marks break JSON.** A typed `„word"` ending with a straight
  `"` terminates the JSON string early. Inside `quiz.json`, use plain single
  quotes for emphasis (`'word'`), or escape as `\"…\"`. Avoid curly „ " entirely.
  (This is a **JSON-only** hazard — curly quotes are perfectly fine in the `.md`
  content files, which is why the Slovak prose uses them freely. Don't "fix" them
  there.)
- **No stray non-Latin characters.** A mis-typed Cyrillic/Arabic letter that looks
  Latin will slip in unnoticed. `check-quiz.mjs` flags these.
- Keep one question per object; don't forget the `explain` in both languages.

## Reading `check-quiz.mjs` output

Run `node scripts/check-quiz.mjs <topicId>` (or with no arg for all quizzes). For
each quiz it prints:

- **answer-index distribution** — e.g. `3/3/3/3` means the correct answer sits at
  positions 0,1,2,3 three times each. Aim for roughly flat. A line like `6/0/4/2`
  signals you're favoring some positions — move some answers around.
- **"correct = longest" tell** — the share of questions where the correct option
  is the single longest. Random is ≈ `100/optionCount`% (≈25% for 4 options); aim
  for **≤ ~33%**. The script warns above 40%. If it's high, even out lengths or
  shorten the correct option (push detail to `explain`).
- **✖ errors** — answer index out of range, mismatched SK/EN option counts, `pick`
  too large, invalid JSON. These must be fixed.
- **⚠ warnings** — missing `explain`, stray characters, high length tell, skewed
  index. Address unless you have a reason not to.

### How to fix a length tell

You don't need to hand-count. Iterate: tweak option wording, rerun
`node scripts/check-quiz.mjs <id>`, repeat until the tell is ≤ ~33% and the index
distribution is roughly flat. Typical fixes:
- The correct option is longest → trim it (move the "because…" to `explain`) **or**
  pad the distractors with equally specific detail so they're comparable.
- One distractor is conspicuously short/silly → make it a believable near-miss of
  similar length.

## A worked mini-example (good)

```json
{
  "answer": 1,
  "sk": { "q": "Vetva ti zostarla oproti master. Čo spraviť pred PR?",
    "options": [
      "Ignorovať to, master sa pri merge doplní sám",
      "Dotiahnuť najnovší master a vyriešiť konflikty",
      "Vytvoriť úplne novú vetvu a začať odznova",
      "Počkať, nech konflikty vyrieši reviewer"],
    "explain": "Najnovší master dotiahni do vetvy a konflikty vyrieš hneď, nie až v review." },
  "en": { "q": "Your branch went stale against master. What to do before the PR?",
    "options": [
      "Ignore it, master fills itself in on merge",
      "Pull the newest master and resolve conflicts",
      "Create a whole new branch and start over",
      "Wait for the reviewer to resolve conflicts"],
    "explain": "Pull the newest master into the branch and resolve conflicts now, not in review." }
}
```

Options are similar length, the rationale is in `explain`, and the distractors are
plausible mistakes a junior might actually make.
