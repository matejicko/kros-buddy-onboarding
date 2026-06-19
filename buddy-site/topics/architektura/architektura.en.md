# Architecture

**Software architecture is the set of decisions about which parts the system is
split into and how they talk to each other.** There is no single "right" answer —
it's always a **trade-off** between simplicity, team size, scaling, and how
independently you want to deploy the individual parts.

This topic walks you through the main approaches you'll meet here and shows *when*
each one makes sense. Don't memorize definitions — understanding the trade-offs is
far more valuable.

> 💡 Tip: For a deep dive, the [Microsoft .NET architecture guides](https://learn.microsoft.com/en-us/dotnet/architecture/)
> and the [.NET Aspire docs](https://aspire.dev/) are excellent.

## Microservices vs. modular monolith

This is probably the most common architectural question. Let's look at three approaches.

### Classic monolith

The whole application is **one deployable unit**, one process, typically one database.

```
        ┌─────────────────────────────────────┐
        │            ONE PROCESS               │
        │  ┌────────┐ ┌────────┐ ┌──────────┐  │
        │  │ Orders │ │Invoices│ │Customers │  │   ← all together,
        │  │ module │ │ module │ │  module  │  │     call each other directly
        │  └────────┘ └────────┘ └──────────┘  │
        └──────────────────┬──────────────────┘
                           │
                    ┌──────▼──────┐
                    │ 1 database  │
                    └─────────────┘
```

- ✅ Simple to develop, debug, and deploy (one artifact).
- ✅ Calls between parts are plain method calls — fast, transactional.
- ❌ Over time risks a "**big ball of mud**": everything depends on everything; a
  change in one place breaks another.
- ❌ You scale the whole thing at once, not individual parts.

### Modular monolith

Still **one process and one deploy**, but internally split into **modules with
clear boundaries and interfaces** (often separate DB schemas too). Modules must
not reach into each other's internals — they talk through defined APIs.

```
        ┌─────────────────────────────────────┐
        │   ONE PROCESS (clear boundaries)     │
        │  ┌────────┐   ┌────────┐  ┌────────┐ │
        │  │ Orders │──▶│ module │  │Customers│ │   ← via interfaces,
        │  │(schema)│   │  API   │  │(schema) │ │     not into internals
        │  └────────┘   └────────┘  └────────┘ │
        └──────────────────┬──────────────────┘
                    ┌──────▼──────┐
                    │ 1 database  │ (separate schemas)
                    └─────────────┘
```

- ✅ The simplicity of a monolith + order and boundaries.
- ✅ If you later decide on microservices, a module is **easy to extract**.
- ❌ Still one deploy and (mostly) one scaling unit.

### Microservices

Many **small, independently deployable services**, each with **its own database**,
communicating **over the network** (HTTP or via a Service Bus).

```
   ┌──────────┐   HTTP/messages   ┌──────────┐      ┌──────────┐
   │  Orders  │◀────────────────▶│ Invoices │      │Customers │
   │ service  │                  │ service  │      │ service  │
   └────┬─────┘                  └────┬─────┘      └────┬─────┘
     ┌──▼──┐                       ┌──▼──┐           ┌──▼──┐
     │ DB  │                       │ DB  │           │ DB  │   ← each its own
     └─────┘                       └─────┘           └─────┘
```

- ✅ Each service is **deployed and scaled independently**; teams work independently.
- ✅ Freedom of technology (one service C#, another anything).
- ❌ **A distributed system = a new class of problems**: the network fails,
  latency, *eventual consistency* (each service has its own DB → data is briefly
  **inconsistent** across them until it "reconciles over time"; no easy
  transactions across services), harder debugging and monitoring, more DevOps overhead.

### Which to choose?

| Aspect | Monolith / modular | Microservices |
|---|---|---|
| Team size | small–medium | several independent teams |
| Operational complexity | low | high (orchestration, monitoring) |
| Independent deploy of parts | no / limited | yes |
| Transactions across domains | simple | hard (eventual consistency) |
| Scaling | whole app | per service |

> 💡 Tip: A common and healthy path is to **start with a modular monolith** and
> extract a microservice only when you have a concrete reason (independent
> scaling, a separate team, a different release cycle). Microservices "because
> it's modern" are a frequent and expensive mistake.

> ⚠️ Caution: Microservices don't fix bad design — if you draw the boundaries
> wrong, you get a *distributed* big ball of mud, which is worse than a monolithic one.

## Monorepo

A **monorepo** = one git repository that holds **multiple projects** (services,
libraries, frontend). The opposite is a *polyrepo* — a repo per service.

```
   MONOREPO (1 repo)                 POLYREPO (N repos)
   /repo                             /orders-repo   → Orders
   ├── services/Orders               /invoices-repo → Invoices
   ├── services/Invoices             /shared-repo   → Shared (via NuGet)
   ├── libs/Shared
   └── frontend/
```

> ⚠️ Caution: **A monorepo is not the same as a monolith!** A monorepo is about
> *storing code*; monolith/microservices is about *running and deploying*. You can
> happily have microservices in a single monorepo, or a monolith scattered across
> many repos.

- ✅ **Atomic change across projects** — one PR edits a library and the service
  that uses it. No waiting for a NuGet package release.
- ✅ Shared code, unified tooling and standards, easier refactoring.
- ❌ Needs smart CI (build/test only the **affected** projects, not everything)
  and the repo grows over time.

> 🏢 At KROS: Whether a given product lives in a monorepo or has a repo-per-service,
> and how the pipelines are set up, your mentor will show you — it differs between teams.

## Service Bus – asynchronous messaging

So far services talked **synchronously** (HTTP: you call and wait for a response).
But that couples both sides — the receiver must be online and fast. A **Service
Bus** (message broker) enables **asynchronous** communication via **messages**:
the sender "fires and moves on", and the receiver processes the message when it can.

Why we want it:
- **Decoupling in time** — the receiver may be down right now; the message waits.
- **Load leveling** — a spike piles up in the queue and is processed gradually.
- **Resilience** — on failure a message is **retried**, and after N attempts goes
  to a *dead-letter* queue for later analysis.

### Queue — point-to-point

One queue, **a single message is received by exactly one** consumer. Multiple
consumers = *competing consumers* (they split the work and scale throughput).

```
                          ┌───────── QUEUE ─────────┐
   Producer ──message──▶  │ ▢ ▢ ▢ ▢ ▢               │ ──▶ Consumer A
                          └─────────────────────────┘ ╲─▶ Consumer B
                                                          (each message goes
                                                           to ONLY one)
```

Use: "process this order", "send this email" — a task exactly one worker should do.

### Topic + Subscription — publish/subscribe

A **topic** is like a queue, but it has **multiple subscriptions**. Each
subscription gets **its own copy** of every (matching) message. So **several
independent receivers** can react to one event.

```
                                  ┌── Subscription "Invoicing" ───▶ Consumer 1
   Publisher ──event──▶  TOPIC ───┤
   "OrderCreated"                 ├── Subscription "Warehouse" ───▶ Consumer 2
                                  │
                                  └── Subscription "Notifications" ▶ Consumer 3
   (each subscription gets ITS OWN copy of the message; may have a filter/rule)
```

Use: an "Order created" event — invoicing issues an invoice, the warehouse
decrements stock, notifications send an email. The sender **doesn't know** about
the receivers and doesn't care — adding another is just a new subscription.

| | Queue | Topic + Subscriptions |
|---|---|---|
| Model | point-to-point | publish/subscribe |
| A message goes to | exactly one consumer | every subscription (a copy) |
| Typical for | "do this task" | "this happened, whoever cares may react" |

> 💡 Tip: Choose synchronous (HTTP) when you **need an answer right now**. Choose
> asynchronous (Service Bus) when you want to **decouple** sender and receiver,
> absorb spikes, or let multiple parties react to one event.

> 🏢 At KROS: We use **Azure Service Bus**. How we name topics/queues and handle
> retries and dead-lettering, your mentor will show you on a real project.

## Libraries, services, and Azure Functions

People often confuse what is "just code" and what "runs on its own". These are
three different things:

### Library (NuGet)

Compiled code (`.dll`) that **does not run by itself** — it has no process and no
endpoint. Other code **uses** it (calls its classes/methods). Our examples:
`Kros.Framework`, `KORM`.

```
   [ Your service ] ──uses──▶ [ Library .dll ]   (the library starts nothing itself)
```

### ASP.NET service

A **long-running process** that hosts HTTP endpoints (an API) and/or background
workers. It is **always on**; you handle its hosting and scaling.

```
   Client ──HTTP──▶ [ ASP.NET service (always running) ] ──▶ DB
```

### Azure Functions

**Serverless** — small functions started by an **event (trigger)**: an HTTP
request, a queue/topic message, a timer. Azure manages the host, the function
**scales to zero** (when there's no work it doesn't run and you don't pay), and
you pay per execution.

```
   [HTTP / Service Bus message / timer] ──trigger──▶ [ Azure Function ] ──▶ ...
```

| | Library | ASP.NET service | Azure Function |
|---|---|---|---|
| Runs by itself? | no | yes, always | only when triggered |
| What starts it | nothing (code calls it) | runs continuously | a trigger (HTTP/message/timer) |
| Hosting | — | you manage | Azure manages |
| Scales to zero | — | no | yes |
| Good for | shared code | always-on API, richer logic | event-driven / bursty tasks |

> 💡 Tip: Functions are great as "glue" reacting to Service Bus messages or a
> timer. An always-on API with many endpoints and state is usually better as an
> ASP.NET service.

## AppHost and .NET Aspire

A modern app has many moving parts: an API, a frontend, a database, Redis, a
Service Bus, Functions… Running it **all at once locally** is a pain (ports,
connection strings, startup order).

**.NET Aspire** is a stack for building distributed applications, and the
**AppHost** is its heart — an **orchestration project** that in C#
**declaratively describes what the app is made of** (the *app model*) and how the
parts are wired together.

```
        ┌──────────────── AppHost (orchestrator) ────────────────┐
        │  declares resources and their links (references)       │
        │                                                        │
        │   AddProject<Api>("api") ─WithReference─▶ AddPostgres  │
        │   AddProject<Frontend>  ─WithReference─▶ "api"         │
        │   AddRedis("cache")                                    │
        └───────┬───────────────┬───────────────┬───────────────┘
                ▼               ▼               ▼
          [ API project ]  [ Frontend ]   [ Postgres + Redis
                                            as containers ]
                  └──────── Aspire Dashboard: logs, metrics, traces ───────┘
```

In practice the app model looks like this (simplified):

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// A "resource" = a part of the system: DB, cache, project, container...
var db = builder.AddPostgres("db").AddDatabase("appdata");

var api = builder.AddProject<Projects.Api>("api")
    .WithReference(db)   // a "reference" = a dependency; Aspire injects the connection string
    .WaitFor(db);        // and takes care of correct startup order

builder.AddProject<Projects.Frontend>("web")
    .WithReference(api); // the frontend finds the API via service discovery (logical name)

builder.Build().Run();
```

What AppHost gives you:
- **Press F5 and the whole app runs** — no manually starting five projects.
- **Service discovery** — services find each other by **logical name** (`"api"`),
  not by hard-coded URLs and ports.
- **References** — when you reference a service, Aspire **automatically injects**
  its connection string / address (no copying into configs by hand).
- **Observability** — a built-in **dashboard** (logs, metrics, traces via
  OpenTelemetry) in one place.

> 💡 Tip: AppHost is primarily a **development/orchestration** concern. From the
> app model Aspire can also generate deployment assets (e.g. to Azure Container
> Apps) — so it isn't a runtime dependency of each individual service.

> 🏢 At KROS: Whether and how we use AppHost/Aspire for local runs, and how our
> resources and service discovery are set up, your mentor will show you — this is
> exactly what you'll get running in your first days.
