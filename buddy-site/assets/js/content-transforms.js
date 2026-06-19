export function slugify(text) {
  return text
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseSubtopics(md) {
  const out = [];
  let inFence = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; } // skip fenced code
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) out.push({ id: slugify(m[1]), title: m[1] });
  }
  return out;
}

const CALLOUT_MAP = [
  { emoji: "💡", cls: "tip" },
  { emoji: "⚠️", cls: "warn" },
  { emoji: "🏢", cls: "kros" },
];

export function calloutClassFor(blockquoteText) {
  for (const { emoji, cls } of CALLOUT_MAP) {
    if (blockquoteText.trimStart().startsWith(emoji)) return cls;
  }
  return null;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
}

// Replace {{term:id|display}} tokens. Known ids become tooltip spans;
// unknown ids degrade to the plain display text.
export function replaceGlossaryTokens(md, glossary, lang) {
  return md.replace(/\{\{term:([a-z0-9_-]+)\|([^}]+)\}\}/gi, (_, id, display) => {
    const g = glossary[id];
    if (!g) return display;
    const def = g[`def_${lang}`] ?? g.def_sk ?? "";
    return `<span class="term" tabindex="0">${escapeHtml(display)}` +
           `<span class="tip-box">${escapeHtml(def)}</span></span>`;
  });
}
