# C#

Three concepts you'll see absolutely everywhere in our backend code. For each
we look at **what it is**, **how it's used**, and above all **why** — because
once you understand the reason, you stop writing things "because everyone else does".

## Async methods

### First the problem: what does code do while it waits?

Picture a server handling user requests. Most of the work isn't computation —
it's **waiting**: on the database, on an HTTP call to another service, on disk.
While waiting, a thread either sits idle and blocked, or the runtime can release
it for other work.

> 💡 Tip: A thread is expensive. A server has a limited number of threads in its
> {{term:threadpool|thread pool}}. If every request blocks a thread while waiting,
> the server handles only a few dozen concurrent requests — even though it isn't
> actually computing anything, just waiting.

**Synchronous** (blocking) code holds the thread the whole time, waiting included:

```csharp
// ❌ Blocking: the thread sits idle for all the milliseconds the DB query runs
public Customer GetCustomer(int id)
{
    var customer = _repository.Find(id); // the thread "freezes" here and waits
    return customer;
}
```

### The solution: Task and async/await

{{term:async|async/await}} is how you say "wait for the result, but release the
thread in the meantime". The building block is a {{term:task|Task}} — an object
representing an *in-progress* operation. `Task<T>` additionally carries a future
result of type `T`.

```csharp
// ✅ Non-blocking: at await the method suspends and returns control to the caller;
//    the thread is freed for other work while the DB does its job
public async Task<Customer> GetCustomerAsync(int id)
{
    var customer = await _repository.FindAsync(id);
    return customer;
}
```

### How it works under the hood (and why it matters)

`async`/`await` is NOT "run on another thread". When the code hits `await`:

1. it starts the asynchronous operation (e.g. the DB query),
2. it **suspends** the method and returns a `Task` to the caller,
3. the thread goes back to the pool and serves other requests meanwhile,
4. when the operation finishes, the runtime *resumes* the method after the `await`.

So async does **not** make a single operation faster. It improves
**scalability** — the same number of threads handles far more concurrent waiting
requests.

> 💡 Tip: Remember "async all the way" — if you call an async method, your method
> should also be `async` and `await` the result. Async propagates through the
> whole call chain from top to bottom.

### How it's used in practice

Run independent operations **in parallel** with `Task.WhenAll`, not one by one:

```csharp
// ❌ Sequential: takes the sum of all the times (200 + 200 + 200 = 600 ms)
var a = await _api.GetAAsync();
var b = await _api.GetBAsync();
var c = await _api.GetCAsync();
```

```csharp
// ✅ Parallel: takes the time of the slowest (~200 ms) because they run at once
var taskA = _api.GetAAsync();
var taskB = _api.GetBAsync();
var taskC = _api.GetCAsync();
await Task.WhenAll(taskA, taskB, taskC);
var (a, b, c) = (taskA.Result, taskB.Result, taskC.Result); // .Result is OK here – already done
```

### Common mistakes — do / don't

**Never block async code with `.Result` or `.Wait()`:**

```csharp
// ❌ Can cause a deadlock and blocks the thread anyway
var customer = GetCustomerAsync(id).Result;
```
```csharp
// ✅ Always await
var customer = await GetCustomerAsync(id);
```

**Don't use `async void`** (except event handlers) — it can't be `await`-ed and
you can't catch its exception:

```csharp
public async void SaveAsync() { ... }   // ❌ errors "vanish", the caller can't wait
public async Task SaveAsync() { ... }   // ✅ return a Task
```

**Don't wrap synchronous CPU work in `Task.Run` just to "make it async".** Async
is about waiting on I/O, not about computation. For pure CPU work async solves nothing.

> ⚠️ Caution: Async "spreads" — as soon as you add an `await` somewhere down low,
> you must add `async` to the calling methods too. That's fine and by design;
> don't work around it by blocking with `.Result` (deadlock risk).

## IEnumerable and materialization

### First the concept: laziness

{{term:ienumerable|IEnumerable<T>}} is not a collection holding data — it's a
**recipe** for producing elements one by one. It's {{term:deferred|lazy}}: until
you start iterating it, **nothing** runs.

```csharp
// NO filtering runs here – it only describes what SHOULD happen
IEnumerable<int> query = numbers.Where(n =>
{
    Console.WriteLine($"testing {n}"); // prints nothing... yet
    return n > 5;
});
```

### Materialization: when it actually runs

**Materialization** is the moment you iterate the sequence and thereby force it
to evaluate. It's triggered by `foreach`, `ToList()`, `ToArray()`, `Count()`,
`First()`, `Sum()`, and the like.

```csharp
var list = query.ToList(); // ✅ NOW "testing ..." prints and the query runs
```

### Why it matters

**1. Iterating multiple times = executing multiple times.** This is the most
common hidden performance problem ({{term:multiple-enumeration|multiple enumeration}}):

```csharp
// ❌ The query (and maybe a DB call!) runs TWICE
IEnumerable<Order> orders = _db.Orders.Where(o => o.IsActive);
var count = orders.Count();        // 1st pass
var first = orders.First();        // 2nd pass – the whole query again
```
```csharp
// ✅ Materialize once, then work with the ready list
List<Order> orders = _db.Orders.Where(o => o.IsActive).ToList();
var count = orders.Count;          // just a property now, no query
var first = orders[0];
```

**2. Deferred evaluation and changing variables.** Because the query runs at
iteration time, it "sees" the state at the moment of traversal, not of definition:

```csharp
// ❌ Surprise: it filters by the value in effect at foreach time
var threshold = 5;
var q = numbers.Where(n => n > threshold);
threshold = 100;
foreach (var n in q) Console.WriteLine(n); // filters by 100, not 5!
```

**3. Laziness is sometimes an advantage.** If you only need the first few
elements of a huge (or infinite) sequence, laziness saves work:

```csharp
// ✅ Only as many elements as needed are evaluated – not the whole sequence
var firstThree = hugeSequence.Where(x => x.IsValid).Take(3).ToList();
```

### Do / don't — summary

- ✅ **Materialize once** (`ToList`/`ToArray`) if you'll iterate the result
  multiple times or query it repeatedly.
- ❌ **Don't return a "live" `IEnumerable`** from the data layer if the caller
  doesn't expect that iterating re-runs a DB query.
- ✅ **Let laziness work** with `Take`, `First`, `Any` over large sources — there
  a premature `ToList()` wastes memory.
- ❌ **Don't assume** a double traversal is "just a quick read" — with
  LINQ-to-SQL/EF it's another database query.

> 🏢 At KROS: When working with our data layer (KORM/EF) be extra careful about
> multiple enumeration — an `IQueryable` may translate to SQL and every traversal
> is a real query. Your mentor will show you the concrete conventions.

## Dependency Injection

### What it is and why

{{term:di|Dependency Injection}} (DI) means an object does **not create its own
dependencies** — it receives them from outside, typically via the constructor.

```csharp
// ❌ Hard dependency: the class builds a concrete implementation itself
public class OrderService
{
    private readonly SqlOrderRepository _repo = new SqlOrderRepository();
    // can't be tested without a real DB, can't swap the implementation
}
```
```csharp
// ✅ The dependency comes from outside via an interface – swappable and testable
public class OrderService
{
    private readonly IOrderRepository _repo;
    public OrderService(IOrderRepository repo) => _repo = repo;
}
```

**Why we want it:** testability (inject a fake/mock repository in a test), loose
coupling (swap the implementation without touching `OrderService`), and a single
place that decides what gets wired where.

### Service lifetimes

In ASP.NET you register services in the container and choose their lifetime:

```csharp
builder.Services.AddSingleton<ICache, MemoryCache>();   // one instance for the whole app
builder.Services.AddScoped<IOrderRepository, Repo>();   // one per HTTP request
builder.Services.AddTransient<IClock, SystemClock>();   // a new one each time it's requested
```

> ⚠️ Caution: Don't inject a `Scoped` service into a `Singleton` — the singleton
> outlives the request and would "freeze" an invalid scoped dependency inside it
> (a so-called captive dependency).

> 🏢 At KROS: Your mentor will show you the concrete registration conventions and
> recommended lifetimes for our services on a real project.
