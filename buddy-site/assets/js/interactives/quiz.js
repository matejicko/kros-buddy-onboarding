import { scoreQuiz } from "./quiz-score.js";

// Renders a quiz into `mount`. Calls onResult({correct,total,passed}) on submit.
export function renderQuiz(mount, quiz, lang, strings, onResult) {
  const questions = quiz.questions;
  mount.innerHTML = `<h2>${strings("topic.quiz")}</h2>`;
  questions.forEach((q, qi) => {
    const loc = q[lang] ?? q.sk;
    const block = document.createElement("div");
    block.className = "q";
    block.innerHTML = `<p><strong>${qi + 1}. ${loc.q}</strong></p>
      <div class="options">${loc.options.map((opt, oi) =>
        `<label data-qi="${qi}" data-oi="${oi}">
           <input type="radio" name="q${qi}" value="${oi}" /> ${opt}</label>`).join("")}</div>
      <p class="explain hidden">${loc.explain}</p>`;
    mount.appendChild(block);
  });
  const submit = document.createElement("button");
  submit.className = "btn"; submit.textContent = strings("quiz.submit");
  const result = document.createElement("p"); result.className = "result";
  mount.append(submit, result);

  submit.addEventListener("click", () => {
    const answers = questions.map((_, qi) => {
      const sel = mount.querySelector(`input[name="q${qi}"]:checked`);
      return sel ? Number(sel.value) : null;
    });
    const score = scoreQuiz(answers, questions);
    questions.forEach((q, qi) => {
      mount.querySelectorAll(`label[data-qi="${qi}"]`).forEach((lbl) => {
        const oi = Number(lbl.getAttribute("data-oi"));
        lbl.classList.toggle("correct", oi === q.answer);
        if (answers[qi] === oi && oi !== q.answer) lbl.classList.add("wrong");
      });
      mount.querySelectorAll(".q")[qi].querySelector(".explain").classList.remove("hidden");
    });
    result.textContent = `${score.correct}/${score.total} — ` +
      strings(score.passed ? "quiz.pass" : "quiz.fail");
    result.className = "result " + (score.passed ? "pass" : "fail");
    onResult(score);
  });
}
