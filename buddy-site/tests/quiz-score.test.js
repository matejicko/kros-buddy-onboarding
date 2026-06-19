import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreQuiz, sampleQuestions } from "../assets/js/interactives/quiz-score.js";

const questions = [{ answer: 1 }, { answer: 0 }, { answer: 3 }];

test("scoreQuiz counts correct answers", () => {
  assert.deepEqual(scoreQuiz([1, 0, 3], questions),
    { correct: 3, total: 3, passed: true });
});

test("scoreQuiz marks fail below 80%", () => {
  assert.deepEqual(scoreQuiz([1, 9, 9], questions),
    { correct: 1, total: 3, passed: false });
});

test("scoreQuiz treats unanswered (null) as wrong", () => {
  assert.deepEqual(scoreQuiz([1, null, 3], questions),
    { correct: 2, total: 3, passed: false });
});

const bank = Array.from({ length: 20 }, (_, i) => ({ id: i }));

test("sampleQuestions returns n items when n < bank size", () => {
  assert.equal(sampleQuestions(bank, 10).length, 10);
});

test("sampleQuestions returns all items when n >= bank size", () => {
  assert.equal(sampleQuestions(bank, 50).length, 20);
});

test("sampleQuestions returns distinct items (no duplicates)", () => {
  const picked = sampleQuestions(bank, 10);
  assert.equal(new Set(picked.map(q => q.id)).size, 10);
});

test("sampleQuestions does not mutate the input bank", () => {
  const before = bank.map(q => q.id);
  sampleQuestions(bank, 10);
  assert.deepEqual(bank.map(q => q.id), before);
});

test("sampleQuestions is deterministic with an injected rng", () => {
  const rng = () => 0; // always swaps with index 0
  const a = sampleQuestions(bank, 5, rng);
  const b = sampleQuestions(bank, 5, rng);
  assert.deepEqual(a.map(q => q.id), b.map(q => q.id));
});
