# Design Patterns

**A design pattern is a proven, reusable solution to a common problem in code
design.** It isn't a ready-made library or a snippet to copy — it's a *recipe*,
and above all a **shared vocabulary**. When you write "I turned this into a
Builder" in a PR, your colleague instantly knows roughly what it looks like and why.

Patterns help you:
- **name** a solution (team communication),
- avoid reinventing the wheel,
- write code that's **easier to change and test**.

> ⚠️ Caution: A pattern is not the goal. The goal is simple, readable code. Don't
> force a pattern where a plain method would do — that's *overengineering*. Use a
> pattern when it genuinely solves a problem you actually have.

> 💡 Tip: For a deep dive with beautifully illustrated examples, use
> [refactoring.guru](https://refactoring.guru/design-patterns) — a great
> reference for all the classic patterns (including C#).

Not all of the "patterns" below come from the original {{term:gof|GoF}} (*Gang of
Four*) book. **Singleton** and **Builder** are classic GoF patterns; **Pipeline**,
**CQRS**, and **Middlewares** are more like *architectural patterns / idioms* —
but you'll meet them just as often in our backend, so they're worth knowing.

## Singleton

### What it is

**Singleton** guarantees that a class has **exactly one instance** across the
whole application and provides global access to it.

### When and why

Useful for something that logically should exist only once and is expensive to
create: a cache, configuration, a connection pool, a logger.

```csharp
// The classic "textbook" implementation (thread-safe via Lazy<T>)
public sealed class AppCache
{
    private static readonly Lazy<AppCache> _instance = new(() => new AppCache());
    public static AppCache Instance => _instance.Value;
    private AppCache() { }   // private constructor – can't be new-ed from outside
}
```

### How we do it in practice (and how NOT to)

```csharp
// ❌ Manual static singleton called from everywhere – hidden dependency, hard to test
public class OrderService
{
    public void Save() => AppCache.Instance.Set("x", 1); // a "magic" global binding
}
```
```csharp
// ✅ Singleton lifetime via DI – one instance, but the dependency is visible and swappable
services.AddSingleton<IAppCache, AppCache>();

public class OrderService
{
    private readonly IAppCache _cache;
    public OrderService(IAppCache cache) => _cache = cache; // dependency visible, mockable in tests
}
```

> ⚠️ Caution: Singleton is often a "code smell" because it hides dependencies and
> makes testing harder. In modern C# you **almost always** want {{term:di|DI}}
> with a *singleton* lifetime rather than a manual `Instance`. Mind thread-safety
> too — one instance is shared by many requests at once.

## Builder

### What it is

**Builder** separates the *construction* of a complex object from its
representation. Instead of a giant constructor with ten parameters, you assemble
the object **step by step**.

### When and why

When an object has many (especially optional) parameters, or when you want
readable, chained (*fluent*) creation.

```csharp
// ❌ "Telescoping" constructor – what does that fourth true and that null mean?
var report = new Report("Q1", true, false, null, true, 30);
```
```csharp
// ✅ Builder – readable, named steps, easy to extend
var report = new ReportBuilder("Q1")
    .WithCharts()
    .IncludeRawData(false)
    .PageSize(30)
    .Build();
```

You use this pattern in .NET all the time, maybe without realizing it —
`StringBuilder`, or `WebApplication.CreateBuilder(args)` in every ASP.NET project
are builders.

> 💡 Tip: Builder pairs great with *immutable* objects — the steps gather values
> and `Build()` produces the finished, unchangeable result.

## Pipeline architecture

### What it is

A **pipeline** processes data through a **sequence of independent steps**, where
the output of one step is the input of the next. Each step does one thing.

```
input → [ step 1 ] → [ step 2 ] → [ step 3 ] → result
```

### When and why

When processing naturally splits into phases (validate → enrich → transform →
save). The benefit: you test each step independently, and you can **reorder, add,
or remove** steps without touching the others.

```csharp
// Each step is a small, independently testable function/handler
public interface IStep<T> { T Run(T input); }

public class Pipeline<T>
{
    private readonly List<IStep<T>> _steps = new();
    public Pipeline<T> Add(IStep<T> step) { _steps.Add(step); return this; } // fluent
    public T Execute(T input) => _steps.Aggregate(input, (acc, s) => s.Run(acc));
}

// Usage
var result = new Pipeline<Invoice>()
    .Add(new ValidateStep())
    .Add(new EnrichStep())
    .Add(new SaveStep())
    .Execute(invoice);
```

> 💡 Tip: A LINQ chain `data.Where(...).Select(...).OrderBy(...)` is itself a
> pipeline. And ASP.NET middleware (below) is a pipeline for HTTP requests.

## CQRS (single-file)

### What it is

{{term:cqrs|CQRS}} = *Command Query Responsibility Segregation*. It separates
**writes** (commands – change state, return nothing) from **reads** (queries –
return data, change nothing). Each operation is its own class with its own handler.

The "single-file" approach means we keep the request, its handler (and optionally
a validator) **together in one file** per feature — not scattered across layers.

### When and why

Why: reads and writes are **optimized and tested differently**, the code is
organized "feature by feature", and things are easy to find.

```csharp
// CreateOrder.cs – everything for one operation kept together
public record CreateOrder(string Customer, decimal Total) : IRequest<int>; // command

public class CreateOrderHandler : IRequestHandler<CreateOrder, int>
{
    private readonly IOrderRepository _repo;
    public CreateOrderHandler(IOrderRepository repo) => _repo = repo;

    public async Task<int> Handle(CreateOrder cmd, CancellationToken ct)
        => await _repo.AddAsync(new Order(cmd.Customer, cmd.Total), ct);
}
```

```csharp
// ❌ Don't mix: a query that also writes "while reading" is confusing and dangerous
public record GetOrder(int Id) : IRequest<Order>;
// a handler that updates "lastViewed" while reading → a side effect inside a query
```
```csharp
// ✅ A query only reads, a command only changes – clear and predictable
public record GetOrder(int Id) : IRequest<Order>;          // query: reads only
public record TouchOrder(int Id) : IRequest;               // command: changes state
```

> 💡 Tip: In .NET, CQRS is commonly implemented with a library like **MediatR** —
> you send the request to `mediator.Send(...)` and it finds the right handler.

> 🏢 At KROS: Your mentor will show you exactly how we structure commands/queries
> and which library we use on a real project.

## Middlewares

### What it is

A {{term:middleware|middleware}} is a component that sits **in the HTTP request
processing pipeline**. Every request passes through a chain of middlewares on the
way *in* (request) and the response on the way *back* (response). Each middleware
can process, modify, short-circuit, or forward the request.

```
request  → [ Logging ] → [ Auth ] → [ Routing ] → endpoint
response ← [ Logging ] ← [ Auth ] ← [ Routing ] ←
```

### When and why

For **cross-cutting concerns** that apply to many endpoints: logging,
authentication, exception handling, CORS, timing. Instead of copying it into
every endpoint, you solve it in one place.

```csharp
// A custom middleware: measures the processing time of every request
public class TimingMiddleware
{
    private readonly RequestDelegate _next;
    public TimingMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext ctx)
    {
        var sw = Stopwatch.StartNew();
        await _next(ctx);                 // forward to the rest of the pipeline
        sw.Stop();
        ctx.Response.Headers["X-Time-ms"] = sw.ElapsedMilliseconds.ToString();
    }
}

// Registration – CAREFUL: order matters!
app.UseMiddleware<TimingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
```

> ⚠️ Caution: **Middleware order matters.** E.g. authentication must come *before*
> authorization; the exception-handling middleware is usually near the top so it
> catches errors from everything below it. Wrong order = hard-to-find bugs.

> 💡 Tip: Notice that middleware is really the **Pipeline** pattern (above)
> applied to HTTP — patterns are often combined.
