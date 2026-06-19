// Pure logic is exported for tests; DOM helpers are browser-only.
export const DEFAULT_LANG = "sk";

export function resolveString(strings, key, lang) {
  const entry = strings[key];
  if (!entry) return key;
  return entry[lang] ?? entry[DEFAULT_LANG] ?? key;
}

// --- Browser-only helpers (guarded so Node tests don't touch them) ---
export function getLang() {
  if (typeof localStorage === "undefined") return DEFAULT_LANG;
  return localStorage.getItem("buddy.lang") || DEFAULT_LANG;
}

export function setLang(lang) {
  if (typeof localStorage !== "undefined") localStorage.setItem("buddy.lang", lang);
}

export function applyI18n(root, strings, lang) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = resolveString(strings, el.getAttribute("data-i18n"), lang);
  });
}
