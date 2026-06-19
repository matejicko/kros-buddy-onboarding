// Light/dark theme handling. Default follows the OS (prefers-color-scheme);
// an explicit user choice is stored in localStorage and wins from then on.
const KEY = "buddy.theme";

export function systemTheme() {
  return (typeof window !== "undefined" && window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
}

export function currentTheme() {
  const stored = (typeof localStorage !== "undefined") ? localStorage.getItem(KEY) : null;
  if (stored === "light" || stored === "dark") return stored;
  // No explicit choice: use whatever the inline boot script applied, else system.
  return document.documentElement.getAttribute("data-theme") || systemTheme();
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function setTheme(theme) {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

// Wire a toggle button: applies the current theme, keeps the button's icon in
// sync, flips on click, and keeps following the OS until the user chooses.
export function initThemeToggle(buttonId) {
  const btn = document.getElementById(buttonId);
  applyTheme(currentTheme());

  const sync = () => {
    if (!btn) return;
    const dark = currentTheme() === "dark";
    btn.textContent = dark ? "☀️" : "🌙";              // icon shows the theme you'll switch TO
    btn.setAttribute("aria-pressed", String(dark));
  };
  sync();

  if (btn) {
    btn.addEventListener("click", () => {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
      sync();
    });
  }

  if (typeof window !== "undefined" && window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (localStorage.getItem(KEY) == null) { applyTheme(e.matches ? "dark" : "light"); sync(); }
    });
  }
}
