import { resolveString, getLang, setLang, applyI18n, DEFAULT_LANG } from "./i18n.js";
import { loadProgress, saveProgress, toggleCheckoff, recordQuiz,
         topicProgress, isTopicComplete } from "./progress.js";
import { parseSubtopics, replaceGlossaryTokens, calloutClassFor } from "./content-transforms.js";
import { renderQuiz } from "./interactives/quiz.js";
import { sampleQuestions } from "./interactives/quiz-score.js";
import { burst } from "./interactives/confetti.js";
import { initThemeToggle } from "./theme.js";

let STRINGS = {}, REGISTRY = {}, GLOSSARY = {}, TOPIC = null, QUIZ = null;
const topicId = new URLSearchParams(location.search).get("id");
const S = (key) => resolveString(STRINGS, key, getLang());

async function loadData() {
  STRINGS = await (await fetch("assets/js/strings.json")).json();
  GLOSSARY = await (await fetch("assets/js/glossary.json")).json();
  REGISTRY = await (await fetch("topics/_index.json")).json();
  TOPIC = REGISTRY.topics.find(t => t.id === topicId);
  try { QUIZ = await (await fetch(`topics/${topicId}/quiz.json`)).json(); }
  catch { QUIZ = null; }
}

// Convert callout blockquotes (rendered by marked) into styled divs.
function styleCallouts(container) {
  container.querySelectorAll("blockquote").forEach((bq) => {
    const cls = calloutClassFor(bq.textContent);
    if (!cls) return;
    const div = document.createElement("div");
    div.className = `callout ${cls}`;
    div.innerHTML = bq.innerHTML;
    bq.replaceWith(div);
  });
}

function addCopyButtons(container) {
  container.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    const text = (code ?? pre).textContent; // capture before adding the button
    const btn = document.createElement("button");
    btn.className = "copy-btn"; btn.textContent = "copy";
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(text);
      btn.textContent = "✓";
      setTimeout(() => (btn.textContent = "copy"), 1200);
    });
    pre.appendChild(btn);
  });
}

// Open external links (http/https) in a new tab; internal nav stays in-tab.
function externalizeLinks(container) {
  container.querySelectorAll("a[href]").forEach((a) => {
    if (/^https?:\/\//i.test(a.getAttribute("href") || "")) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  });
}

async function render() {
  const lang = getLang();
  document.documentElement.lang = lang;
  applyI18n(document, STRINGS, lang);
  document.querySelectorAll("#langToggle button").forEach(b =>
    b.classList.toggle("active", b.getAttribute("data-lang") === lang));

  document.getElementById("topicTitle").textContent =
    `${TOPIC.icon} ${TOPIC.title[lang] ?? TOPIC.title[DEFAULT_LANG]}`;
  document.getElementById("topicSummary").textContent =
    TOPIC.desc[lang] ?? TOPIC.desc[DEFAULT_LANG];

  // Load + transform markdown
  const md = await (await fetch(`topics/${topicId}/${topicId}.${lang}.md`)).text();
  const withTips = replaceGlossaryTokens(md, GLOSSARY, lang);
  const content = document.getElementById("content");
  content.innerHTML = window.marked.parse(withTips);
  styleCallouts(content);
  addCopyButtons(content);
  externalizeLinks(content);
  if (window.Prism) window.Prism.highlightAllUnder(content);

  // Wrap each ## section in a .subtopic with a check-off button
  const subs = parseSubtopics(md);
  wrapSubtopics(content, subs, lang);
  buildSideNav(subs, lang);
  if (QUIZ) mountQuiz(content, lang);
  updateProgressUI(subs);

  // Mark visited
  const p = loadProgress(); p.lastVisited = topicId; saveProgress(p);
}

function wrapSubtopics(content, subs, lang) {
  const p = loadProgress();
  const completed = (p.topics[topicId]?.completed) ?? [];
  const headings = [...content.querySelectorAll("h2")];
  headings.forEach((h2, i) => {
    const sub = subs[i]; if (!sub) return;
    const subId = TOPIC.subIds[i] ?? sub.id; // language-stable id from registry
    h2.id = subId;
    const wrap = document.createElement("section");
    wrap.className = "subtopic"; wrap.dataset.sub = subId;
    const nodes = []; let n = h2;
    do { nodes.push(n); n = n.nextElementSibling; }
    while (n && n.tagName !== "H2");
    h2.replaceWith(wrap); nodes.forEach(node => wrap.appendChild(node));
    const btn = document.createElement("button");
    btn.className = "checkoff" + (completed.includes(subId) ? " done" : "");
    btn.textContent = completed.includes(subId)
      ? resolveString(STRINGS,"topic.checkoff.done",lang)
      : resolveString(STRINGS,"topic.checkoff",lang);
    btn.addEventListener("click", () => {
      let pr = toggleCheckoff(loadProgress(), topicId, subId);
      saveProgress(pr);
      const done = (pr.topics[topicId]?.completed ?? []).includes(subId);
      btn.classList.toggle("done", done);
      btn.textContent = done ? resolveString(STRINGS,"topic.checkoff.done",lang)
                             : resolveString(STRINGS,"topic.checkoff",lang);
      const dot = document.querySelector(`#sideNav a[href="#${subId}"] .dot`);
      if (dot) dot.classList.toggle("done", done);
      updateProgressUI(subs);
    });
    wrap.appendChild(btn);
  });
}

function buildSideNav(subs, lang) {
  const p = loadProgress();
  const completed = (p.topics[topicId]?.completed) ?? [];
  const ol = document.getElementById("sideNav");
  ol.innerHTML = subs.map((s, i) => {
    const subId = TOPIC.subIds[i] ?? s.id;
    return `<li><a href="#${subId}"><span class="dot${completed.includes(subId)?' done':''}"></span>${s.title}</a></li>`;
  }).join("") + (QUIZ ? `<li><a href="#quiz">▸ ${resolveString(STRINGS,"topic.quiz",lang)}</a></li>` : "");
}

function mountQuiz(content, lang) {
  const mount = document.createElement("section");
  mount.className = "quiz"; mount.id = "quiz";
  content.appendChild(mount);
  // Show a random subset (quiz.pick) drawn from the full question bank.
  const picked = sampleQuestions(QUIZ.questions, QUIZ.pick ?? QUIZ.questions.length);
  renderQuiz(mount, { questions: picked }, lang, S, (score) => {
    const pr = recordQuiz(loadProgress(), topicId, score.correct, score.total);
    saveProgress(pr);
    if (isTopicComplete(pr, { id: topicId, subIds: TOPIC.subIds })) burst();
  });
  appendNextLink(content, lang);
}

function appendNextLink(content, lang) {
  const sorted = [...REGISTRY.topics].sort((a,b)=>a.order-b.order);
  const idx = sorted.findIndex(t => t.id === topicId);
  const next = sorted.slice(idx+1).find(t => t.status === "ready");
  if (!next) return;
  const a = document.createElement("a");
  a.className = "btn"; a.href = `topic.html?id=${next.id}`;
  a.textContent = `${resolveString(STRINGS,"topic.next",lang)} → ${next.title[lang] ?? next.title[DEFAULT_LANG]}`;
  a.style.marginTop = "24px";
  content.appendChild(a);
}

function updateProgressUI(subs) {
  const ids = subs.map((s, i) => TOPIC.subIds[i] ?? s.id);
  const tp = topicProgress(loadProgress(), topicId, ids);
  document.getElementById("topicBar").style.width = `${tp.pct}%`;
}

function wireLang() {
  document.getElementById("langToggle").addEventListener("click", (e) => {
    const lang = e.target.getAttribute("data-lang");
    if (!lang) return;
    setLang(lang); render();
  });
}

(async function init() {
  initThemeToggle("themeToggle");
  await loadData();
  if (!TOPIC) { document.getElementById("content").textContent = "Topic not found."; return; }
  wireLang();
  render();
})();
