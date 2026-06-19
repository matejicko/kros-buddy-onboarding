# Libraries & services

We don't write everything from scratch — we build on **libraries** (code you call)
and the **services/tools** around them. This topic is a **quick reference**: for
each item you get *what it's for*, *a link to its documentation*, and *a small
usage example*.

Some are **open-source by KROS** (KORM, TeaPie — on [KROS's GitHub](https://github.com/Kros-sk)),
others are **internal** (Kros.Framework, data extraction — on the internal NuGet
feed). Public libraries (xUnit, NSubstitute, Redis) have their own docs.

> 💡 Tip: All package versions are centralized in `Directory.Packages.props` — a
> good place to look when you want to see what the project actually uses.

## Kros.Framework

**What it's for:** KROS's internal **foundation framework** — building blocks for
our services: the data layer (on top of KORM), DDD elements (aggregates,
repositories), CQRS/MediatR integration, validation, caching, hooks into SQL
Server / Cosmos, and more. It makes our services look consistent and saves you
from re-solving the same plumbing.

```csharp
// Typically "assembled" in Program.cs / ServiceCollectionExtensions:
services.AddKorm(configuration);             // data layer (KORM)
services.AddDistributedCache(configuration); // caching
// + DDD building blocks, CQRS via MediatR, FluentValidation...
```

You'll see packages like `Kros.Framework.Core`, `Kros.Framework.SqlServer`,
`Kros.Framework.Cosmos`, and others.

> 🏢 At KROS: Kros.Framework is **internal** (a private NuGet feed) — the docs and
> conventions live on the internal wiki. What exactly we use from it in Invoicing,
> and how, your mentor will show you. It builds on the open-source
> [Kros.Libs](https://kros-sk.github.io/Kros.Libs.Documentation/).

## KORM (Kros.KORM)

**What it's for:** KROS's **micro-ORM** — it maps C# classes to database tables and
lets you write queries in LINQ style instead of hand-written SQL. Fast and simple.

**Docs:** [github.com/Kros-sk/Kros.KORM](https://github.com/Kros-sk/Kros.KORM)
· [API docs](https://kros-sk.github.io/docs/Kros.KORM/)

```csharp
// An entity mapped to a table (by convention, or exactly via [Alias])
public class License
{
    public long Id { get; set; }
    public string CompanyName { get; set; }
    public bool IsActive { get; set; }
}

// Reading via an injected IDatabase (LINQ-style)
var active = _database.Query<License>().Where(l => l.IsActive).ToList();

// Writing (upsert) via IDbSet
IDbSet<License> dbSet = _database.Query<License>().AsDbSet();
dbSet.Upsert(license);
await dbSet.CommitChangesAsync(cancellationToken);
```

> 💡 Tip: KORM is {{term:ienumerable|lazy}} just like LINQ — the query runs only
> on materialization (`ToList()`, `foreach`). See the **C#** topic → materialization.

## Testing: xUnit and NSubstitute

**What they're for:** **xUnit** is a testing framework (runs unit tests),
**NSubstitute** is a **mocking** library — it builds a "fake" implementation of a
dependency so you can test a class in isolation (without a real DB or network).

**Docs:** [xunit.net](https://xunit.net/) · [nsubstitute.github.io](https://nsubstitute.github.io/)

```csharp
[Fact]
public async Task ReturnsCustomer_WhenItExists()
{
    var repo = Substitute.For<ICustomerRepository>();     // mock the dependency
    repo.FindAsync(42).Returns(new Customer { Id = 42 }); // set up behavior
    var service = new CustomerService(repo);

    var result = await service.GetAsync(42);

    Assert.Equal(42, result.Id);
    await repo.Received(1).FindAsync(42);   // verify the method was called exactly once
}
```

`[Fact]` is a parameterless test; `[Theory]` + `[InlineData(...)]` runs the same
test with different inputs.

> 💡 Tip: Mock **interfaces** (`ICustomerRepository`), not concrete classes — that's
> exactly why we use DI (see the **C#** topic → Dependency Injection).

## API testing: Postman and TeaPie

**What they're for:** both test **HTTP APIs**, but differently. **Postman** is a GUI
tool for manually trying endpoints and organizing request collections (with
*environments* for different base URLs / tokens). **TeaPie** is KROS's **CLI**
framework — you write API tests as `.http` files with test directives and run them
automatically (locally and in CI).

**Docs:** [Postman](https://learning.postman.com/) ·
[TeaPie (GitHub + wiki)](https://github.com/Kros-sk/TeaPie)

```http
### Create a company
## TEST-EXPECT-STATUS: [200, 201]
## TEST-JSON-HAS-ID-PROPERTY: Temp.IntegrationSubscription.CompanyId
POST {{ApiGatewayBaseUrl}}/companies
Content-Type: application/json

{ "name": "Test s.r.o.", "street": "A. Rudnaya 21" }
```

```bash
teapie test     # runs the .http tests (in CI and locally)
```

> 🏢 At KROS: TeaPie tests live in `TeaPie/` folders next to each service and run
> through the API Gateway with preset environments (e.g. `esw-local`). Use Postman
> for quick manual checks, TeaPie for repeatable automated tests.

## Redis (cache)

**What it's for:** **Redis** is a fast in-memory key–value store; we use it as a
**distributed cache** — to hold results/tokens worth keeping so we don't hit the DB
on every request. It works across service instances too.

**Docs:** [redis.io](https://redis.io/docs/) ·
[StackExchange.Redis (.NET client)](https://stackexchange.github.io/StackExchange.Redis/)

```csharp
// Output caching via Redis (DI registration)
services.AddStackExchangeRedisOutputCache(options =>
{
    options.Configuration = redisOptions.ConnectionString;
    options.InstanceName = redisOptions.InstanceName;
});

// Distributed cache in a handler
private readonly IDistributedCache _cache;
var cached = await _cache.GetStringAsync(key, cancellationToken);
```

> 💡 Tip: A cache is always a trade-off — it speeds up reads, but you must think
> about **invalidation** (when the stored value is stale). Don't cache things that
> change every second.

## Document data extraction (Kros.AI.DataExtraction)

**What it's for:** **data extraction** ("vyťažovanie") = getting **structured data
out of documents** (e.g. from a received invoice we extract the supplier, amount,
line items). It's done through several channels:

- **LLM** — an AI extracts data from a photo/PDF (uses e.g. the Anthropic / Gemini SDK),
- **IsDoc (ISDOC)** — a structured XML e-invoice format the data is read from directly,
- **FS** — e-invoices from the Slovak Financial Administration (*Finančná správa*).

**Docs:** internal (the `Kros.AI.DataExtraction*` packages, private NuGet feed).

```csharp
using Kros.AI.DataExtraction.Document;

// The result of extracting a document (here from an LLM)
public class LlmExtractedDocument : ExtractedDocument
{
    public DocumentType ExtractedDocumentType { get; set; }
    public List<DocumentWithItems.Item> Items { get; set; } = new();
}
```

> 🏢 At KROS: This is one of Invoicing's core domains. How exactly the LLM / IsDoc /
> FS channels connect and when each is used, your mentor will show you — the details
> are in the internal documentation.
