import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultProgress, toggleCheckoff, recordQuiz, computeXp,
  earnedBadges, topicProgress, isTopicComplete,
  XP_CHECKOFF, XP_QUIZ_PASS, XP_TOPIC_BONUS,
} from "../assets/js/progress.js";

const topicsMeta = [
  { id: "csharp", subIds: ["async", "ienumerable", "di"], badge: "csharp-apprentice" },
  { id: "git", subIds: ["branch", "merge"], badge: "git-master" },
];

test("defaultProgress is empty", () => {
  const p = defaultProgress();
  assert.deepEqual(p.topics, {});
  assert.equal(p.lang, "sk");
});

test("toggleCheckoff adds then removes a sub-item", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "csharp", "async");
  assert.deepEqual(p.topics.csharp.completed, ["async"]);
  p = toggleCheckoff(p, "csharp", "async");
  assert.deepEqual(p.topics.csharp.completed, []);
});

test("topicProgress reports done/total/pct", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "csharp", "async");
  const tp = topicProgress(p, "csharp", topicsMeta[0].subIds);
  assert.deepEqual(tp, { done: 1, total: 3, pct: 33 });
});

test("recordQuiz stores pass when >= 80%", () => {
  let p = recordQuiz(defaultProgress(), "git", 4, 5);   // 80%
  assert.equal(p.topics.git.quizPassed, true);
  p = recordQuiz(p, "csharp", 1, 5);                     // 20%
  assert.equal(p.topics.csharp.quizPassed, false);
});

test("computeXp sums check-offs, quiz passes, and full-topic bonus", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "git", "branch");
  p = toggleCheckoff(p, "git", "merge");
  p = recordQuiz(p, "git", 2, 2);  // all subs done + quiz passed => bonus
  const xp = computeXp(p, topicsMeta);
  assert.equal(xp, 2 * XP_CHECKOFF + XP_QUIZ_PASS + XP_TOPIC_BONUS);
});

test("isTopicComplete requires all subs and a passed quiz", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "git", "branch");
  p = toggleCheckoff(p, "git", "merge");
  assert.equal(isTopicComplete(p, topicsMeta[1]), false);
  p = recordQuiz(p, "git", 2, 2);
  assert.equal(isTopicComplete(p, topicsMeta[1]), true);
});

test("earnedBadges lists badges only for complete topics", () => {
  let p = defaultProgress();
  p = toggleCheckoff(p, "git", "branch");
  p = toggleCheckoff(p, "git", "merge");
  p = recordQuiz(p, "git", 2, 2);
  assert.deepEqual(earnedBadges(p, topicsMeta), ["git-master"]);
});
