export const XP_CHECKOFF = 5;
export const XP_QUIZ_PASS = 25;
export const XP_TOPIC_BONUS = 50;
export const QUIZ_PASS_THRESHOLD = 0.8;
const STORAGE_KEY = "buddy.progress";

export function defaultProgress() {
  return { version: 1, lang: "sk", lastVisited: null, topics: {} };
}

function ensureTopic(p, topicId) {
  if (!p.topics[topicId]) {
    p.topics[topicId] = { completed: [], quizScore: null, quizTotal: null,
      quizPassed: false, completedAt: null };
  }
  return p.topics[topicId];
}

// Returns a new progress object (does not mutate the input).
export function toggleCheckoff(p, topicId, subId) {
  const next = structuredClone(p);
  const t = ensureTopic(next, topicId);
  const i = t.completed.indexOf(subId);
  if (i === -1) t.completed.push(subId); else t.completed.splice(i, 1);
  return next;
}

export function recordQuiz(p, topicId, score, total) {
  const next = structuredClone(p);
  const t = ensureTopic(next, topicId);
  t.quizScore = score; t.quizTotal = total;
  t.quizPassed = total > 0 && score / total >= QUIZ_PASS_THRESHOLD;
  return next;
}

export function topicProgress(p, topicId, subIds) {
  const t = p.topics[topicId];
  const done = t ? t.completed.filter((s) => subIds.includes(s)).length : 0;
  const total = subIds.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}

export function isTopicComplete(p, meta) {
  const t = p.topics[meta.id];
  if (!t) return false;
  const allSubs = meta.subIds.every((s) => t.completed.includes(s));
  return allSubs && t.quizPassed === true;
}

export function computeXp(p, topicsMeta) {
  let xp = 0;
  for (const meta of topicsMeta) {
    const t = p.topics[meta.id];
    if (!t) continue;
    xp += t.completed.filter((s) => meta.subIds.includes(s)).length * XP_CHECKOFF;
    if (t.quizPassed) xp += XP_QUIZ_PASS;
    if (isTopicComplete(p, meta)) xp += XP_TOPIC_BONUS;
  }
  return xp;
}

export function earnedBadges(p, topicsMeta) {
  return topicsMeta.filter((m) => isTopicComplete(p, m)).map((m) => m.badge);
}

// --- Browser-only persistence ---
export function loadProgress() {
  if (typeof localStorage === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultProgress(), ...JSON.parse(raw) } : defaultProgress();
  } catch { return defaultProgress(); }
}

export function saveProgress(p) {
  if (typeof localStorage !== "undefined")
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function resetProgress() {
  if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
}
