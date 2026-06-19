# Topic structure & content conventions

Everything you need to add or edit a Buddy topic without breaking the site.

## Table of contents
- [File & registry layout](#file--registry-layout)
- [The registry (`_index.json`)](#the-registry-_indexjson)
- [The subId ↔ heading alignment rule (most important)](#the-subid--heading-alignment-rule-most-important)
- [Adding a topic — step by step](#adding-a-topic--step-by-step)
- [Removing a topic](#removing-a-topic)
- [Reordering topics](#reordering-topics)
- [Content conventions (callouts, diagrams, links, glossary)](#content-conventions)

## File & registry layout

```
buddy-site/topics/
├── _index.json              # the registry: topic list + badges (the source of truth)
└── <id>/                    # one folder per topic, named by its kebab-case id
    ├── <id>.sk.md           # Slovak content  (required for a "ready" topic)
    ├── <id>.en.md           # English content (required for a "ready" topic)
    └── quiz.json            # optional quiz
```

A topic's content file is one `# H1` (the title shown at the top) followed by one
`## H2` per **subtopic**. Sub-subsections use `###` and are NOT subtopics. Code
fences ``` ``` are skipped when counting headings, so `##` lines inside an example
don't accidentally become subtopics.

## The registry (`_index.json`)

Two top-level keys: `topics` (array) and `badges` (map). A topic entry:

```json
{ "id": "git", "order": 7, "status": "ready", "icon": "🌿",
  "badge": "git-master",
  "title": { "sk": "Git", "en": "Git" },
  "desc":  { "sk": "…", "en": "…" },
  "subIds": ["repozitar", "vetvy-head", "merge-rebase"] }
```

- `id` — kebab-case, matches the folder name.
- `order` — number used to sort topics in the hub. Must be unique. Sequential
  integers are cleanest, but any numbers work (the site sorts by value).
- `status` — `"ready"` shows it; anything else (e.g. `"draft"`) hides it and means
  no content files are required.
- `icon` — an emoji.
- `badge` — key into the `badges` map (or `null`, as Welcome uses). The badge is
  awarded when the topic is completed.
- `title` / `desc` — both `sk` and `en`.
- `subIds` — the canonical id per subtopic; see the alignment rule below.

A badge entry:

```json
"git-master": { "icon": "🌿", "label": { "sk": "Git majster", "en": "Git Master" } }
```

## The subId ↔ heading alignment rule (most important)

The renderer assigns the i-th `##` heading the id `subIds[i]` — **positional**, not
by slugifying the heading text. Therefore, for every `"ready"` topic:

> `subIds.length` === number of `##` headings in `<id>.sk.md` === number in
> `<id>.en.md`, **and they must be in the same order**.

Because the mapping is positional, the SK and EN headings can be worded
differently (they will be — one's Slovak, one's English); only the **count and
order** must match. If they drift, completion tracking, XP, badges, and the
finish-confetti break with no error. `scripts/validate-topics.mjs` exists to catch
exactly this — always run it.

Derive `subIds` from the SK headings: lowercase, strip diacritics, spaces→hyphens
(e.g. `## Backlog vs. Sprint` → `backlog-vs-sprint`). They just have to be
kebab-case and unique within the topic; the exact text isn't user-visible.

## Adding a topic — step by step

1. **Choose** an `id` (kebab-case), an `icon`, a `badge` key, and an `order` (where
   it should sit in the hub sequence — renumber neighbors if you want clean ints).
2. **Write** `topics/<id>/<id>.sk.md` and `<id>.en.md`: an `# H1` title, then one
   `##` per subtopic. Keep the **same number and order** of `##` in both files.
3. **Derive `subIds`** from the SK `##` headings (kebab-case slugs).
4. **(Optional) quiz** — add `quiz.json` per `references/quiz-standard.md`.
5. **Register** — add the topic entry to `topics` with `status: "ready"`, and if
   the `badge` is new, add it to the `badges` map.
6. **Validate** — `node scripts/validate-topics.mjs` and (if there's a quiz)
   `node scripts/check-quiz.mjs <id>`. Fix every ERROR.

## Removing a topic

1. Delete the folder `topics/<id>/`.
2. Remove the topic's entry from `topics`.
3. Remove its `badge` from the `badges` map **only if** no other topic references
   it (the validator warns about orphan badges, and errors on missing ones).
4. `node scripts/validate-topics.mjs`.

To temporarily hide a topic instead of deleting it, set its `status` to `"draft"`
(or anything ≠ `"ready"`) and leave the files in place. A removed/renamed topic
leaves a harmless stale key in students' saved progress; it won't error.

## Reordering topics

Change only the `order` numbers; keep them unique. Then
`node scripts/validate-topics.mjs`. Think about a sensible learning sequence
(foundations before things that depend on them); the order is purely pedagogical,
the engine just sorts by the number.

**Inserting between two topics** — two equally valid options:
- *Renumber to stay contiguous:* bump every topic at/after the insertion point up
  by one (e.g. inserting at 3 shifts old 3,4,5… to 4,5,6…). Cleanest to read.
- *Use a decimal:* give the new topic e.g. `3.5` so you don't touch any neighbors.
  Handy for a quick insert; tidy up to integers later if you like.

The validator only requires unique numbers, so either is fine — just be consistent.

## Content conventions

These keep new topics visually and behaviorally consistent with the rest.

**Callouts** — a Markdown blockquote whose first line starts with a specific emoji
is styled automatically:
- `> 💡 Tip:` → cyan tip box.
- `> ⚠️ Pozor:` (SK) / `> ⚠️ Caution:` (EN) → warning box.
- `> 🏢 V KROSe:` (SK) / `> 🏢 At KROS:` (EN) → company-context box.
Use the language-appropriate label so EN content reads fully in English.

**Diagrams** — use plain ``` code fences with ASCII art (boxes, arrows). They're
theme-safe (look right in light and dark). When an arrow needs to wrap to a later
line, drop the connector off the **end** of a row, not the middle, so the flow
reads in order.

**Comparison tables** — use GFM Markdown tables; they're styled by `#content table`
CSS. Good for "X vs Y" contrasts.

**Links** — `http(s)` links open in a new tab automatically (the renderer adds
`target="_blank"`). To link to another Buddy topic, use a relative link
`topic.html?id=<otherId>` (stays in the same tab, as in-site navigation should).
URLs with `{`, `}`, or `%28…%29` (e.g. SharePoint/OneNote links) work fine inside
standard `[text](url)` Markdown.

**Glossary tooltips** — `{{term:id|display text}}` renders `display text` with a
tooltip resolved from `buddy-site/assets/js/glossary.json`. Add the `id` there if
you introduce a new term. Optional.

**Bilingual style** — default language is SK. In SK content, write prose in Slovak
but keep English technical terms (e.g. "feature flag", "work item"). EN content is
fully English.
