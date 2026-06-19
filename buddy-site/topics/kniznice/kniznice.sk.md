# Knižnice a služby

V projektoch nepíšeme všetko od nuly — staviame na **knižniciach** (kód, ktorý
zavoláš) a **službách/nástrojoch** okolo. Táto téma je **rýchla referencia**: pri
každej položke nájdeš *na čo je*, *odkaz na dokumentáciu* a *malý príklad použitia*.

Niektoré sú **open-source od KROSu** (KORM, TeaPie — na [GitHube KROSu](https://github.com/Kros-sk)),
iné sú **interné** (Kros.Framework, vyťažovanie — na internom NuGet feede). Verejné
knižnice (xUnit, NSubstitute, Redis) majú vlastnú dokumentáciu.

> 💡 Tip: Verzie všetkých balíkov sú centrálne v `Directory.Packages.props` —
> dobré miesto, keď chceš vidieť, čo projekt vlastne používa.

## Kros.Framework

**Na čo je:** interný **základný framework** KROSu — stavebné bloky pre naše
služby: dátová vrstva (nad KORM), DDD prvky (agregáty, repozitáre), integrácia
CQRS/MediatR, validácia, cache, napojenie na SQL Server / Cosmos atď. Vďaka nemu
vyzerajú naše služby konzistentne a nemusíš opakovane riešiť to isté.

```csharp
// Typicky sa „poskladá" v Program.cs / ServiceCollectionExtensions:
services.AddKorm(configuration);            // dátová vrstva (KORM)
services.AddDistributedCache(configuration); // cache
// + DDD stavebné bloky, CQRS cez MediatR, FluentValidation...
```

Balíky uvidíš ako `Kros.Framework.Core`, `Kros.Framework.SqlServer`,
`Kros.Framework.Cosmos` a ďalšie.

> 🏢 V KROSe: Kros.Framework je **interný** (privátny NuGet feed) — dokumentácia
> a konvencie sú na internej wiki. Čo presne z neho v Invoicing používame a ako,
> ti ukáže mentor. Stavia na open-source základoch [Kros.Libs](https://kros-sk.github.io/Kros.Libs.Documentation/).

## KORM (Kros.KORM)

**Na čo je:** **micro-ORM** od KROSu — mapuje C# triedy na databázové tabuľky a
umožní písať dotazy v LINQ štýle namiesto ručného SQL. Rýchly a jednoduchý.

**Dokumentácia:** [github.com/Kros-sk/Kros.KORM](https://github.com/Kros-sk/Kros.KORM)
· [API docs](https://kros-sk.github.io/docs/Kros.KORM/)

```csharp
// Entita namapovaná na tabuľku (konvenciou, alebo presne cez [Alias])
public class License
{
    public long Id { get; set; }
    public string CompanyName { get; set; }
    public bool IsActive { get; set; }
}

// Čítanie cez injektnutý IDatabase (LINQ-style)
var active = _database.Query<License>().Where(l => l.IsActive).ToList();

// Zápis (upsert) cez IDbSet
IDbSet<License> dbSet = _database.Query<License>().AsDbSet();
dbSet.Upsert(license);
await dbSet.CommitChangesAsync(cancellationToken);
```

> 💡 Tip: KORM je {{term:ienumerable|lenivý}} rovnako ako LINQ — dotaz sa vykoná
> až pri materializácii (`ToList()`, `foreach`). Pozri tému **C#** → materializácia.

## Testovanie: xUnit a NSubstitute

**Na čo sú:** **xUnit** je testovací framework (spúšťa unit testy), **NSubstitute**
je knižnica na **mockovanie** — vyrobí ti „falošnú" implementáciu závislosti, aby
si triedu otestoval izolovane (bez reálnej DB či siete).

**Dokumentácia:** [xunit.net](https://xunit.net/) · [nsubstitute.github.io](https://nsubstitute.github.io/)

```csharp
[Fact]
public async Task ReturnsCustomer_WhenItExists()
{
    var repo = Substitute.For<ICustomerRepository>();   // mock závislosti
    repo.FindAsync(42).Returns(new Customer { Id = 42 }); // nastav správanie
    var service = new CustomerService(repo);

    var result = await service.GetAsync(42);

    Assert.Equal(42, result.Id);
    await repo.Received(1).FindAsync(42);   // over, že sa metóda volala práve raz
}
```

`[Fact]` je test bez parametrov; `[Theory]` + `[InlineData(...)]` spustí ten istý
test s rôznymi vstupmi.

> 💡 Tip: Mockuj **rozhrania** (`ICustomerRepository`), nie konkrétne triedy — to
> je presne dôvod, prečo používame DI (pozri tému **C#** → Dependency Injection).

## API testovanie: Postman a TeaPie

**Na čo sú:** oba testujú **HTTP API**, ale inak. **Postman** je grafický nástroj
na ručné skúšanie endpointov a kolekcie requestov (s *prostrediami* pre rôzne
base URL / tokeny). **TeaPie** je **CLI** framework od KROSu — API testy píšeš ako
`.http` súbory s test direktívami a spúšťaš ich automatizovane (lokálne aj v CI).

**Dokumentácia:** [Postman](https://learning.postman.com/) ·
[TeaPie (GitHub + wiki)](https://github.com/Kros-sk/TeaPie)

```http
### Vytvor firmu
## TEST-EXPECT-STATUS: [200, 201]
## TEST-JSON-HAS-ID-PROPERTY: Temp.IntegrationSubscription.CompanyId
POST {{ApiGatewayBaseUrl}}/companies
Content-Type: application/json

{ "name": "Test s.r.o.", "street": "A. Rudnaya 21" }
```

```bash
teapie test     # spustí .http testy (v CI aj lokálne)
```

> 🏢 V KROSe: TeaPie testy bývajú v priečinkoch `TeaPie/` pri jednotlivých
> službách a bežia cez API Gateway s prednastavenými prostrediami (napr.
> `esw-local`). Postman používaj na rýchle ručné preskúšanie, TeaPie na
> opakovateľné automatické testy.

## Redis (cache)

**Na čo je:** **Redis** je rýchle in-memory úložisko kľúč–hodnota; používame ho
ako **distribuovanú cache** — výsledky/tokeny, ktoré sa oplatí podržať, aby sme
nezaťažovali DB pri každom requeste. Funguje aj naprieč inštanciami služby.

**Dokumentácia:** [redis.io](https://redis.io/docs/) ·
[StackExchange.Redis (.NET klient)](https://stackexchange.github.io/StackExchange.Redis/)

```csharp
// Output caching cez Redis (registrácia v DI)
services.AddStackExchangeRedisOutputCache(options =>
{
    options.Configuration = redisOptions.ConnectionString;
    options.InstanceName = redisOptions.InstanceName;
});

// Distribuovaná cache v handleri
private readonly IDistributedCache _cache;
var cached = await _cache.GetStringAsync(key, cancellationToken);
```

> 💡 Tip: Cache je vždy kompromis — zrýchli čítanie, ale musíš myslieť na
> **invalidáciu** (kedy je uložená hodnota neaktuálna). Necachuj veci, ktoré sa
> menia každú sekundu.

## Vyťažovanie dokumentov (Kros.AI.DataExtraction)

**Na čo je:** **vyťažovanie** = získanie **štruktúrovaných dát z dokumentov**
(napr. z prijatej faktúry vyťažíme dodávateľa, sumu, položky). Robí sa viacerými
kanálmi:

- **LLM** — AI vyťaží dáta z fotky/PDF (využíva napr. Anthropic / Gemini SDK),
- **IsDoc (ISDOC)** — štruktúrovaný XML formát elektronickej faktúry, z ktorého
  sa dáta čítajú priamo,
- **FS** — e-faktúry z **Finančnej správy**.

**Dokumentácia:** interné (balíky `Kros.AI.DataExtraction*`, privátny NuGet feed).

```csharp
using Kros.AI.DataExtraction.Document;

// Výsledok vyťaženia dokumentu (tu z LLM)
public class LlmExtractedDocument : ExtractedDocument
{
    public DocumentType ExtractedDocumentType { get; set; }
    public List<DocumentWithItems.Item> Items { get; set; } = new();
}
```

> 🏢 V KROSe: Toto je jedna z kľúčových domén Invoicingu. Ako presne sú prepojené
> LLM / IsDoc / FS kanály a kedy sa ktorý použije, ti ukáže mentor — detaily sú
> v internej dokumentácii.
