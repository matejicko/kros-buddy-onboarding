# Návrhové vzory

**Návrhový vzor je overené, opakovateľné riešenie bežného problému v dizajne
kódu.** Nie je to hotová knižnica ani kus kódu na skopírovanie — je to *recept*
a hlavne **spoločný slovník**. Keď v PR napíšeš „spravil som z toho Builder",
kolega hneď vie, ako to asi vyzerá a prečo.

Vzory ti pomáhajú:
- **pomenovať** riešenie (komunikácia v tíme),
- vyhnúť sa znovuobjavovaniu kolesa,
- písať kód, ktorý sa **ľahšie mení a testuje**.

> ⚠️ Pozor: Vzor nie je cieľ. Cieľ je jednoduchý, čitateľný kód. Nenasilu
> nezavádzaj vzor tam, kde stačí obyčajná metóda — to je tzv. *overengineering*.
> Vzor použi, keď reálne rieši problém, ktorý máš.

> 💡 Tip: Pre hlboký ponor a krásne ilustrované príklady používaj
> [refactoring.guru](https://refactoring.guru/design-patterns) — je to skvelá
> referencia na všetky klasické vzory (aj v C#).

Nasledujúce „vzory" nie sú všetky z pôvodnej knihy {{term:gof|GoF}} (*Gang of
Four*). **Singleton** a **Builder** sú klasické GoF vzory; **Pipeline**,
**CQRS** a **Middlewares** sú skôr *architektonické vzory / idiómy* — ale v našom
backende ich uvidíš rovnako často, tak ich treba poznať.

## Singleton

### Čo to je

**Singleton** zaručuje, že daná trieda má v celej aplikácii **práve jednu
inštanciu** a poskytuje k nej globálny prístup.

### Kedy a prečo

Hodí sa pre niečo, čoho má logicky existovať len jedna inštancia a je drahé to
vytvárať: cache, konfigurácia, pool pripojení, logger.

```csharp
// Klasická „učebnicová" implementácia (thread-safe cez Lazy<T>)
public sealed class AppCache
{
    private static readonly Lazy<AppCache> _instance = new(() => new AppCache());
    public static AppCache Instance => _instance.Value;
    private AppCache() { }   // privátny konštruktor – zvonku sa nedá new-núť
}
```

### Ako to robíme v praxi (a ako NErobiť)

```csharp
// ❌ Ručný static singleton volaný odvšadiaľ – skrytá závislosť, zlá testovateľnosť
public class OrderService
{
    public void Save() => AppCache.Instance.Set("x", 1); // „magická" globálna väzba
}
```
```csharp
// ✅ Singleton životnosť cez DI – jedna inštancia, ale závislosť je viditeľná a vymeniteľná
services.AddSingleton<IAppCache, AppCache>();

public class OrderService
{
    private readonly IAppCache _cache;
    public OrderService(IAppCache cache) => _cache = cache; // vidno závislosť, v teste podstrčíš fake
}
```

> ⚠️ Pozor: Singleton je často „code smell", lebo skrýva závislosti a sťažuje
> testovanie. V modernom C# **takmer vždy** chceš radšej {{term:di|DI}} so
> životnosťou *singleton* než ručný `Instance`. Pamätaj aj na thread-safety —
> jednu inštanciu zdieľa veľa requestov naraz.

## Builder

### Čo to je

**Builder** oddeľuje *konštrukciu* zloženého objektu od jeho reprezentácie.
Namiesto obrieho konštruktora s desiatimi parametrami skladáš objekt
**krok po kroku**.

### Kedy a prečo

Keď má objekt veľa (najmä voliteľných) parametrov, alebo keď chceš čitateľné,
zreťazené (*fluent*) vytváranie.

```csharp
// ❌ „Teleskopický" konštruktor – čo znamená to štvrté true a ten null?
var report = new Report("Q1", true, false, null, true, 30);
```
```csharp
// ✅ Builder – čitateľné, pomenované kroky, ľahko rozšíriteľné
var report = new ReportBuilder("Q1")
    .WithCharts()
    .IncludeRawData(false)
    .PageSize(30)
    .Build();
```

V .NET tento vzor používaš stále, aj keď si to možno neuvedomuješ —
`StringBuilder`, alebo `WebApplication.CreateBuilder(args)` v každom ASP.NET
projekte sú builders.

> 💡 Tip: Builder sa skvele kombinuje s *immutable* objektmi — kroky nazbierajú
> hodnoty a `Build()` vyrobí hotový nemenný výsledok.

## Pipeline architektúra

### Čo to je

**Pipeline** (rúra) spracúva dáta cez **postupnosť samostatných krokov**, kde
výstup jedného kroku je vstupom ďalšieho. Každý krok robí jednu vec.

```
vstup → [ krok 1 ] → [ krok 2 ] → [ krok 3 ] → výsledok
```

### Kedy a prečo

Keď máš spracovanie, ktoré sa prirodzene delí na fázy (validácia → obohatenie →
transformácia → uloženie). Výhoda: každý krok testuješ samostatne, kroky vieš
**preskladať, pridať alebo vynechať** bez zásahu do ostatných.

```csharp
// Každý krok je malá, samostatne testovateľná funkcia/handler
public interface IStep<T> { T Run(T input); }

public class Pipeline<T>
{
    private readonly List<IStep<T>> _steps = new();
    public Pipeline<T> Add(IStep<T> step) { _steps.Add(step); return this; } // fluent
    public T Execute(T input) => _steps.Aggregate(input, (acc, s) => s.Run(acc));
}

// Použitie
var result = new Pipeline<Invoice>()
    .Add(new ValidateStep())
    .Add(new EnrichStep())
    .Add(new SaveStep())
    .Execute(invoice);
```

> 💡 Tip: LINQ reťazec `data.Where(...).Select(...).OrderBy(...)` je vlastne tiež
> pipeline. A ASP.NET middleware (nižšie) je pipeline pre HTTP požiadavky.

## CQRS (v jednom súbore)

### Čo to je

{{term:cqrs|CQRS}} = *Command Query Responsibility Segregation*. Oddeľuje
**zápisy** (commands – menia stav, nič nevracajú) od **čítaní** (queries –
vracajú dáta, nič nemenia). Každá operácia je samostatná trieda s vlastným
handlerom.

„Single-file" prístup znamená, že request, jeho handler (a prípadne validátor)
držíme **pohromade v jednom súbore** podľa featúry — nie roztrúsené po vrstvách.

### Kedy a prečo

Prečo: oddelené čítanie a zápis sa **inak optimalizujú a inak testujú**, kód je
prehľadný „feature po feature" a ľahko sa hľadá.

```csharp
// CreateOrder.cs – všetko k jednej operácii pohromade
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
// ❌ Nemiešaj: query, ktorá „pri čítaní" aj zapisuje, je mätúca a nebezpečná
public record GetOrder(int Id) : IRequest<Order>;
// handler, ktorý popri čítaní updatne „lastViewed" → vedľajší efekt v query
```
```csharp
// ✅ Query len číta, command len mení – jasné a predvídateľné
public record GetOrder(int Id) : IRequest<Order>;          // query: len číta
public record TouchOrder(int Id) : IRequest;               // command: zmení stav
```

> 💡 Tip: V .NET sa CQRS bežne realizuje s knižnicou typu **MediatR** —
> request pošleš do `mediator.Send(...)` a ono nájde správny handler.

> 🏢 V KROSe: Ako presne štruktúrujeme commands/queries a ktorú knižnicu
> používame, ti ukáže mentor na reálnom projekte.

## Middlewares

### Čo to je

{{term:middleware|Middleware}} je komponent, ktorý sedí **v rúre spracovania HTTP
požiadavky**. Každá požiadavka prejde reťazcom middlewarov *tam* (request) a
odpoveď *naspäť* (response). Každý middleware môže požiadavku spracovať,
upraviť, zastaviť, alebo poslať ďalej.

```
požiadavka → [ Logging ] → [ Auth ] → [ Routing ] → endpoint
odpoveď    ← [ Logging ] ← [ Auth ] ← [ Routing ] ←
```

### Kedy a prečo

Na **prierezové veci** (cross-cutting concerns), ktoré platia pre veľa
endpointov: logovanie, autentifikácia, ošetrenie výnimiek, CORS, meranie času.
Namiesto kopírovania do každého endpointu to vyriešiš na jednom mieste.

```csharp
// Vlastný middleware: zmeria čas spracovania každej požiadavky
public class TimingMiddleware
{
    private readonly RequestDelegate _next;
    public TimingMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext ctx)
    {
        var sw = Stopwatch.StartNew();
        await _next(ctx);                 // pošli ďalej do zvyšku rúry
        sw.Stop();
        ctx.Response.Headers["X-Time-ms"] = sw.ElapsedMilliseconds.ToString();
    }
}

// Registrácia – POZOR: poradie je dôležité!
app.UseMiddleware<TimingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
```

> ⚠️ Pozor: **Na poradí middlewarov záleží.** Napr. autentifikácia musí byť
> *pred* autorizáciou; exception-handling middleware býva čo najvyššie, aby
> zachytil chyby zo všetkého pod ním. Zlé poradie = ťažko hľadateľné bugy.

> 💡 Tip: Všimni si, že middleware je vlastne **Pipeline** (vyššie) aplikovaná na
> HTTP — vzory sa často kombinujú.
