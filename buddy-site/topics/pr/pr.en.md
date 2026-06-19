# PR processes

A **pull request (PR)** is **a request to integrate your changes into the main
branch (`master`)**. It's not just a "merge button" — it's **the place where
colleagues see, go through, and approve your code** before it reaches everyone
else.

> 💡 Tip: A PR is a conversation about code, not a formality. A well-prepared PR
> (small, clearly described, tested) gets reviewed fast and merged fast. A big,
> unverified PR slows down both you and the reviewers.

## What is a pull request

The goal of a PR is to get a change from your **branch** into `master`
**safely** — i.e. verified by the build, tests, and human review. The whole
journey looks like this:

```
  master ─▶ branch ─▶ commits ─▶ tests ─▶ local check ─▶ nuke build
                                                              │
   ┌─────────────────────────────────────────────────────-──┘
   ▼
  PR draft ─▶ review by colleagues ─▶ publish + approve ─▶ PR pipeline + AI review
                                                              │
   ┌─────────────────────────────────────────────────────-──┘
   ▼
  merge into master ─▶ post-merge pipeline ─▶ deploy to testlab ─▶ manual check
```

In this topic we'll walk this journey **step by step** (1–16). Don't worry — most
of it you do the same way on every PR, and you'll pick it up quickly.

## Preparing the branch and changes

**1. Get the current `master`.** Before you start, pull the latest version of the
main branch (`git pull` on `master`) so you build on the newest state.

**2. Create a local branch from `master`.** The branch name has a **convention**:
the **intention** (what you're about to do) + `/` + the **thing you're solving**,
in `kebab-case`.

```
  <intention>/<thing-in-kebab-case>
   ├─ feature/invoices-export        (a new feature)
   ├─ bugfix/wrong-vat-rounding      (a bug fix)
   ├─ ai/extraction-prompt-tuning    (only AI definition files)
   └─ refactor/payment-service-cleanup  (refactor, no behavior change)
```

> ⚠️ Caution: Use the `ai/` prefix **only when you change just the AI definition
> files** (e.g. prompts or agent instructions) — **not** every time you use AI to
> help write ordinary code. Such a branch is still `feature/`, `bugfix/`, or
> `refactor/`.

**3. Make changes and commit regularly** — in reasonable batches (one commit =
one logical change), not everything in one huge commit at the end.

> 💡 Tip: You can use AI models to generate code — but **knowing the code matters
> more than speed**. Especially when starting in a new repository, try to **write
> things yourself**; you'll understand how it works far better, and then you can
> review the AI instead of just trusting it.

> ⚠️ Caution: Comply with the **coding conventions, ADRs, and team practices** —
> see the [Coding conventions](topic.html?id=coding-convention) topic. Code that
> doesn't match the team's style is harder to review and often won't even pass the
> build.

## Unit and API tests

**4. Write unit tests.** Once the functionality is done, **cover the new logic
with unit tests** to a reasonable extent — let the tests protect what you added or
changed.

**5. Consider API tests.** Some PRs require them, some don't — but you always
**have to think about it**: do API tests cover your change? We usually put them in
a **separate PR**, but the decision is yours (and the reviewer's).

- For new API tests we primarily use **TeaPie** (`.http` tests) —
  [TeaPie documentation](https://www.teapie.fun/docs/introduction.html).
- In **older (legacy)** code you'll find API tests as **Postman** collections.

> 💡 Tip: A unit test verifies a small piece of logic in isolation; an API test
> verifies that an endpoint as a whole responds correctly. The two complement each
> other.

## Local verification and build

**6. Test your changes locally.** This tends to be the **longest part** — you need
to **get your own environment running**. You have two paths:

- **Aspire** — spins up the services via **Docker**; you start "from scratch" (a
  fresh environment each time). You need to understand it runs in containers.
- **The "old way"** — you launch the (multiple) projects directly from **Visual
  Studio**.

> ⚠️ Caution: When launching from Visual Studio, **don't forget to redirect
> messages to a Service Bus other than testlab** — or otherwise make sure you're
> **not stealing other people's messages**. The manual is in the
> [wiki](https://krossk.sharepoint.com/sites/OM/_layouts/15/Doc.aspx?sourcedoc={bd7f3976-568a-42b2-bba6-42ec11e76011}&action=edit&wd=target%28Wiki%202.0.one%7C99bac7e5-2dcc-4274-ba58-f6b26f8b1717%2FProgram%C3%A1torsk%C3%A9%20%22%C5%A1kolenia%22%7C4f6c7737-55d2-41e6-b9ba-36981762d143%2F%29&wdorigin=NavigationUrl).

**7. Run `nuke build --wae`.** When everything works locally, run the build via
**Nuke**. It has **stricter rules than the local build** (`--wae` = *warnings as
errors*) — the same as on the PR pipeline. Run **both unit tests and API tests**.

> ⚠️ Caution: Your branch may have **gone stale against `master`** in the meantime.
> Before the PR, make sure you have the **newest `master` in your branch** and that
> there are **no merge conflicts**. If there are, resolve them **now** (not once
> the PR is in review) and then run `nuke build` again.

## Creating and reviewing the PR

**8. Create the PR as a draft.** When everything is green:

- **Link the related work items** — the task and its parent (User Story / Bug).
- Write a **meaningful description** that helps reviewers understand what you did
  and why.
- Go through the **diff** one more time — exactly what you're changing.
- How to structure the PR is in the repo's **root `readme.md`** —
  [Invoicing](https://dev.azure.com/krossk/Esw/_git/Invoicing).

**9. Send the PR for review.** When you're happy with the draft, send it to the
**dedicated group** (your mentor will tell you which one) for colleagues to review.

**10. Address the feedback.** **Consider and, where needed, implement** the
reviewers' comments and suggestions. After the changes, make sure **step 7 still
holds** (build and tests green).

**11. The reviewer publishes and approves.** When everything is fine, your
reviewer(s) **publish and approve** the PR.

> 💡 Tip: The better the description and the smaller the PR, the fewer rounds of
> comments. Review isn't an attack on you — it's a shared quality check.

## Pipeline, merge and deployment

**12. PR pipeline + AI review.** A pipeline runs to verify the **build, unit
tests, and API tests** (zero issues). An **AI review** is also produced — react to
its suggestions just like in step 10. If the pipeline breaks, **fix the cause** and
repeat step 10.

**13. Merge into `master`.** Once the pipeline is green and you've answered the AI
review, you can **merge the PR into `master`**.

**14. Post-merge pipeline.** After the merge, **another pipeline** runs, checking
the same things as the PR pipeline. In an unfortunate case it can **break** — then
you need to find out what's wrong. This is usually harder, so **don't hesitate to
ask a more experienced colleague** for help.

**15. Deploy to testlab.** After the post-merge pipeline is green, a **final
pipeline** runs that **deploys the changes to testlab**. Watch it the same way as
in step 14.

**16. Done — verify and announce.** Your changes are on **testlab**. It's good
practice to **click through them there manually** and **let the testers know** it's
deployed and **ready to be tested**.

> 🏢 At KROS: Which review group to send PRs to, which PRs require API tests, and
> exactly what testlab looks like, your mentor will clarify. Feel free to go
> through your first few PRs together with them.
