export const PASS_THRESHOLD = 0.8;

export function scoreQuiz(answers, questions) {
  let correct = 0;
  questions.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
  const total = questions.length;
  return { correct, total, passed: total > 0 && correct / total >= PASS_THRESHOLD };
}

// Randomly pick `n` distinct questions from a bank (Fisher–Yates shuffle).
// Does not mutate the input. `rng` is injectable for deterministic tests.
export function sampleQuestions(questions, n, rng = Math.random) {
  const pool = questions.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = Math.max(0, Math.min(n, pool.length));
  return pool.slice(0, count);
}
