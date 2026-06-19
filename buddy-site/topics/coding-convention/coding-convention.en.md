# Coding conventions

**Coding conventions** are the agreed rules for *how* we write and format code —
naming, structure, formatting, patterns. The goal is simple: make the whole team's
code look as if one person wrote it. That makes it **easier to read, review, and
maintain**, and we argue less about style in PRs.

This topic is a **launchpad** — where to find our style rules, important
architectural decisions, and team good practices. I recommend **sorting out access
in your first days** (especially to the ADR repository, see below).

## Code style

Our **coding style** is public on GitHub — naming, formatting, ordering of
`using`s, async conventions, tests, and so on. When you're unsure "how we write
this here", this is the first place to look.

**Link:** [KROS coding-style.md](https://github.com/Kros-sk/kros-sk.github.io/blob/master/coding-style.md)

> 💡 Tip: A large part of the style (formatting, simple rules) can be enforced by
> the **editor itself** via `.editorconfig` and analyzers as you type — you don't
> have to memorize everything. Prefer handling style automatically over flagging it
> by hand in review.

## ADR – Architecture Decision Records

An **ADR (Architecture Decision Record)** is a short document capturing **one
important (architectural) decision**: *what the context was, what we decided, and
what the consequences are*. Thanks to ADRs the team, months later, knows **why**
something was done the way it was — instead of guessing and re-opening settled topics.

**Link:** [Kros.ADR / Adrs](https://github.com/Kros-sk/Kros.ADR/tree/master/Adrs)

> 🏢 At KROS: This repository is **private**. To get to it:
> 1. sign in with your **personal GitHub account**,
> 2. reach out to **Milan Martiniak** — he'll grant you access to the repository.
>
> Without a granted access, the link above will show an error (404 / "not found").

> 💡 Tip: ADRs are about **decisions** (e.g. "why we chose this approach"), not
> about code formatting — that belongs to the code style above.

## Team good practices

Besides style and ADRs we also have a **team wiki** with good practices, ongoing
updates, and conventions — things that settle over time and are worth keeping in
one place.

**Link:** [Team wiki (SharePoint / OneNote)](https://krossk.sharepoint.com/sites/OM/_layouts/15/Doc.aspx?sourcedoc={bd7f3976-568a-42b2-bba6-42ec11e76011}&action=edit&wd=target%28Wiki%202.0.one%7C99bac7e5-2dcc-4274-ba58-f6b26f8b1717%2FProgram%C3%A1torsk%C3%A9%20%22%C5%A1kolenia%22%7C4f6c7737-55d2-41e6-b9ba-36981762d143%2F%29&wdorigin=NavigationUrl)

> 🏢 At KROS: It opens with your KROS (Microsoft 365) account. If the link doesn't
> let you in, tell your mentor — they'll sort out access. Come back here regularly,
> not just in your first week — the practices keep growing.
