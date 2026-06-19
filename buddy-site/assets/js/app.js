import { resolveString, getLang, setLang, applyI18n, DEFAULT_LANG } from "./i18n.js";
import { loadProgress, saveProgress, resetProgress, computeXp,
         earnedBadges, topicProgress, isTopicComplete } from "./progress.js";
import { initThemeToggle } from "./theme.js";

let STRINGS = {}, REGISTRY = { topics: [], badges: {} };

async function loadData() {
  STRINGS = await (await fetch("assets/js/strings.json")).json();
  REGISTRY = await (await fetch("topics/_index.json")).json();
}

function topicsMeta() {
  return REGISTRY.topics.filter(t => t.badge).map(t => ({
    id: t.id, subIds: t.subIds, badge: t.badge,
  }));
}

function renderHub(lang) {
  const p = loadProgress();
  applyI18n(document, STRINGS, lang);
  document.documentElement.lang = lang;

  // Topic cards
  const grid = document.getElementById("topicGrid");
  grid.innerHTML = "";
  for (const t of [...REGISTRY.topics].sort((a,b)=>a.order-b.order)) {
    const card = document.createElement("a");
    card.className = "topic-card";
    card.href = `topic.html?id=${t.id}`;
    const complete = t.badge ? isTopicComplete(p, t) : false;
    let footer;
    if (t.status === "draft") {
      footer = `<span class="pill draft">${resolveString(STRINGS,"card.draft",lang)}</span>`;
    } else {
      const tp = topicProgress(p, t.id, t.subIds);
      footer = `<div class="card-progress">
        <div class="progress on-light"><span style="width:${tp.pct}%"></span></div>
        <span>${tp.done}/${tp.total}${complete?' <span class="star">★</span>':''}</span></div>`;
    }
    card.innerHTML = `<div class="icon">${t.icon}</div>
      <h3>${t.title[lang] ?? t.title[DEFAULT_LANG]}</h3>
      <p class="desc">${t.desc[lang] ?? t.desc[DEFAULT_LANG]}</p>${footer}`;
    grid.appendChild(card);
  }

  // Overall progress + XP
  const meta = topicsMeta();
  const readyTopics = REGISTRY.topics.filter(t => t.status === "ready" && t.badge);
  const doneCount = readyTopics.filter(t => isTopicComplete(p, t)).length;
  const xp = computeXp(p, meta);
  document.getElementById("overallBar").style.width =
    readyTopics.length ? `${Math.round(doneCount/readyTopics.length*100)}%` : "0%";
  document.getElementById("overallText").textContent =
    `${doneCount}/${readyTopics.length} ${resolveString(STRINGS,"hub.progress.topics",lang)} · ${resolveString(STRINGS,"hub.xp",lang)} ${xp}`;

  // Resume button -> last visited or first incomplete ready topic
  const resume = p.lastVisited
    || (readyTopics.find(t => !isTopicComplete(p, t)) || readyTopics[0] || {}).id;
  const resumeBtn = document.getElementById("resumeBtn");
  if (resume) { resumeBtn.href = `topic.html?id=${resume}`;
    resumeBtn.textContent = `${resolveString(STRINGS,"hub.resume",lang)} →`; }
  else resumeBtn.classList.add("hidden");

  // Badges
  const earned = earnedBadges(p, meta);
  const row = document.getElementById("badgeRow");
  row.innerHTML = "";
  for (const [id, b] of Object.entries(REGISTRY.badges)) {
    const has = earned.includes(id);
    const el = document.createElement("div");
    el.className = "badge" + (has ? "" : " locked");
    el.innerHTML = `<div class="medal">${has ? b.icon : "🔒"}</div>
      <span>${b.label[lang] ?? b.label[DEFAULT_LANG]}</span>`;
    row.appendChild(el);
  }
}

function wireChrome() {
  document.getElementById("langToggle").addEventListener("click", (e) => {
    const lang = e.target.getAttribute("data-lang");
    if (!lang) return;
    setLang(lang); markActiveLang(lang); renderHub(lang);
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm(resolveString(STRINGS,"footer.reset.confirm",getLang()))) {
      resetProgress(); renderHub(getLang());
    }
  });
  const anim = document.getElementById("animToggle");
  anim.checked = localStorage.getItem("buddy.anim") !== "off";
  anim.addEventListener("change", () =>
    localStorage.setItem("buddy.anim", anim.checked ? "on" : "off"));
}

function markActiveLang(lang) {
  document.querySelectorAll("#langToggle button").forEach(b =>
    b.classList.toggle("active", b.getAttribute("data-lang") === lang));
}

(async function init() {
  initThemeToggle("themeToggle");
  await loadData();
  const lang = getLang();
  markActiveLang(lang);
  wireChrome();
  renderHub(lang);
})();
