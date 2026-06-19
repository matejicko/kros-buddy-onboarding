# DevOps

This topic is about **how we plan and track work** — that is, **work items** and
**boards** in Azure DevOps.

> 💡 Tip: Think of Azure DevOps Boards as a big shared board of task cards.
> Everyone can see who's working on what, what state it's in, and what's coming next.

## What is a work item

A **work item** is a **tracked unit of work** in Azure DevOps — a task, a bug, a
requirement… It has a **type**, a **title**, a **state**, an **assignee**, a
description, and other fields. Each has a unique **number (ID)**, e.g. `#12345`,
that you can reference (even in a commit or PR).

```
  ┌─────────────────────────────────────┐
  │ #12345  User Story                   │
  │ Add CSV export for invoices          │
  │ State: Active     Assigned: Janko    │
  │ Tags: export, accounting             │
  └─────────────────────────────────────┘
```

A work item moves through **states** during its life, typically:

```
  New  ──▶  Active  ──▶  Resolved  ──▶  Closed
 (new)    (in progress) (done,          (closed)
                         awaiting check)
```

> 🏢 At KROS: The exact types and states depend on the configured process
> (Agile/Scrum/…) and can be customized. Which ones your team uses, your mentor
> will show you.

## Work item hierarchy

Work items aren't "flat" — they're **nested from big goals down to concrete
tasks**. The standard hierarchy:

```
  Epic            e.g. "Electronic invoicing"          (months, a big goal)
   └─ Feature     e.g. "CSV export for invoices"        (weeks, a shippable chunk)
       ├─ User Story  e.g. "User downloads a CSV"        (days, value for the user)
       │   └─ Task    e.g. "Write the CSV serializer"    (hours, a concrete step)
       └─ Bug         e.g. "Wrong diacritics encoding"   (a defect to fix)
```

- **Epic** — a large theme/goal, spanning several features.
- **Feature** — a coherent piece of functionality that can be delivered.
- **User Story** — an increment with value for the user; a **Bug** sits at the
  same level (a defect to fix).
- **Task** — the smallest, concrete development item (what a User Story is made of).

Higher items are **parents** of lower ones (parent–child). That way you can see
which bigger goal a small task belongs to.

## Backlog vs. Sprint (iteration)

- The **backlog** is an **ordered list of ALL the work** still ahead — priority
  top to bottom. It's "what's coming", continuously reordered and topped up.
- A **sprint (iteration)** is a **time box** (e.g. 2 weeks) into which you **pull a
  subset** of backlog items to do **now**.

```
   BACKLOG (priority ↓)            SPRINT 24 (2 weeks)
   ▢ CSV export        ───pull──▶  ▢ CSV export
   ▢ Invoice filter    ───pull──▶  ▢ Invoice filter
   ▢ Bulk payment                   (this is being worked on NOW)
   ▢ Statistics
   ▢ ... (waiting)
```

> 💡 Tip: Backlog = a continuously changing wishlist (priority gets adjusted).
> Sprint = a commitment for a specific period; what's in it is being worked on now.

## Multiple teams

One project usually has **several teams**, and each has **its own board, its own
backlog, and its own sprints**. A work item belongs to a specific team's **area
path**.

```
   PROJECT
   ├─ Team A   → its own board, backlog, iterations
   ├─ Team B   → its own board, backlog, iterations
   └─ Team C   → its own board, backlog, iterations
```

So "the backlog" isn't one universal thing — it always depends on **which team**
you're looking at.

> 🏢 At KROS: Which teams exist, which one you belong to, and how the area paths
> are split, your mentor will show you.

## Board customizations (tags, colors, cycle time, estimation)

Boards can be customized so the work is easier to navigate:

- **Tags** — free labels on work items (e.g. `tech-debt`, `hotfix`, `accounting`)
  that you can filter and group by.
- **Card colors** — color rules (by type, tag, or field) so you spot important
  things at a glance.
- **Cycle time** — an analytics metric: how long a work item took **from started
  to done**. It helps you see throughput and where work "gets stuck".
- **Time estimation** — sizing work for planning: **Story Points** (relative
  effort) or hour-based estimates (Effort / Original Estimate…).

> 🏢 At KROS: Which tags, colors, estimation fields, and metrics your team actually
> uses (and how to fill them in) is a team convention — your mentor will show you.
