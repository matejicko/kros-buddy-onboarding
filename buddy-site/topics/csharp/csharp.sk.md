# C#

Tri koncepty, ktoré v našom backendovom kóde uvidíš úplne všade. Pri každom
sa pozrieme **čo to je**, **ako sa to používa** a hlavne **prečo** — pretože keď
chápeš dôvod, prestaneš písať veci „lebo to tak robia ostatní".

## Async metódy

### Najprv problém: čo robí kód, keď čaká?

Predstav si server, ktorý vybavuje požiadavky používateľov. Väčšina práce nie
je počítanie — je to **čakanie**: na databázu, na HTTP volanie inej služby, na
disk. Kým sa čaká, vlákno (thread) buď stojí nečinne zablokované, alebo ho
runtime môže uvoľniť na inú prácu.

> 💡 Tip: Vlákno je drahé. Server má v {{term:threadpool|thread poole}} obmedzený
> počet vlákien. Ak každá požiadavka zablokuje jedno vlákno na čakaní, server
> zvládne len pár desiatok súčasných požiadaviek — aj keď reálne nič nepočíta,
> len čaká.

**Synchrónny** (blokujúci) kód drží vlákno celý čas vrátane čakania:

```csharp
// ❌ Blokujúce: vlákno stojí celé tie milisekundy, čo beží DB dotaz
public Customer GetCustomer(int id)
{
    var customer = _repository.Find(id); // vlákno tu „zamrzne" a čaká
    return customer;
}
```

### Riešenie: Task a async/await

{{term:async|async/await}} je spôsob, ako napísať „počkaj na výsledok, ale
medzitým uvoľni vlákno". Stavebným kameňom je {{term:task|Task}} — objekt, ktorý
reprezentuje *prebiehajúcu* operáciu. `Task<T>` navyše nesie budúci výsledok typu `T`.

```csharp
// ✅ Neblokujúce: na await sa metóda pozastaví a vráti riadenie volajúcemu;
//    vlákno sa uvoľní na inú prácu, kým DB pracuje
public async Task<Customer> GetCustomerAsync(int id)
{
    var customer = await _repository.FindAsync(id);
    return customer;
}
```

### Ako to funguje pod kapotou (a prečo na tom záleží)

`async`/`await` nie je „spustenie na inom vlákne". Keď kód narazí na `await`:

1. spustí asynchrónnu operáciu (napr. DB dotaz),
2. **pozastaví** metódu a vráti `Task` volajúcemu,
3. vlákno sa vráti do poolu a medzitým obsluhuje iné požiadavky,
4. keď operácia dobehne, runtime metódu *obnoví* a pokračuje za `await`.

Preto async **nezrýchli** jednu operáciu. Zlepšuje **škálovateľnosť** — ten istý
počet vlákien zvládne oveľa viac súčasných čakajúcich požiadaviek.

> 💡 Tip: Pamätaj na pravidlo „async all the way" — ak voláš async metódu,
> tvoja metóda by mala byť tiež `async` a výsledok `await`-ovať. Async sa ťahá
> celým reťazcom volaní zhora nadol.

### Ako sa to používa v praxi

Nezávislé operácie spúšťaj **paralelne** cez `Task.WhenAll`, nie jednu po druhej:

```csharp
// ❌ Sekvenčne: trvá to súčet všetkých časov (200 + 200 + 200 = 600 ms)
var a = await _api.GetAAsync();
var b = await _api.GetBAsync();
var c = await _api.GetCAsync();
```

```csharp
// ✅ Paralelne: trvá to čas najpomalšieho (~200 ms), lebo bežia naraz
var taskA = _api.GetAAsync();
var taskB = _api.GetBAsync();
var taskC = _api.GetCAsync();
await Task.WhenAll(taskA, taskB, taskC);
var (a, b, c) = (taskA.Result, taskB.Result, taskC.Result); // .Result je tu OK – už sú hotové
```

### Časté chyby — rob / nerob

**Nikdy neblokuj async kód cez `.Result` alebo `.Wait()`:**

```csharp
// ❌ Môže spôsobiť deadlock a aj tak blokuje vlákno
var customer = GetCustomerAsync(id).Result;
```
```csharp
// ✅ Vždy await
var customer = await GetCustomerAsync(id);
```

**Nepoužívaj `async void`** (okrem event handlerov) — nedá sa `await`-ovať a
výnimku z nej nezachytíš:

```csharp
public async void SaveAsync() { ... }   // ❌ chyby „zmiznú", volajúci nevie počkať
public async Task SaveAsync() { ... }   // ✅ vráť Task
```

**Neobaľuj synchrónnu CPU prácu do `Task.Run` len aby to „bolo async".** Async
je o čakaní na I/O, nie o výpočtoch. Pre čisté CPU operácie async nič nerieši.

> ⚠️ Pozor: Async sa „šíri" — len čo niekde dolu pridáš `await`, musíš `async`
> doplniť aj do volajúcich metód. To je v poriadku a tak to má byť; neobchádzaj
> to blokovaním cez `.Result` (riziko deadlock).

## IEnumerable a materializácia

### Najprv koncept: lenivosť

{{term:ienumerable|IEnumerable<T>}} nie je kolekcia s dátami — je to **recept**,
ako prvky postupne vyrobiť. Je {{term:deferred|lenivý}}: kým ho nezačneš
prechádzať, nevykoná sa **nič**.

```csharp
// Tu sa NEVYKONÁ žiadne filtrovanie – len sa popíše, čo sa MÁ stať
IEnumerable<int> query = numbers.Where(n =>
{
    Console.WriteLine($"testujem {n}"); // nevypíše sa nič... zatiaľ
    return n > 5;
});
```

### Materializácia: kedy sa to naozaj vykoná

**Materializácia** je moment, keď sekvenciu prejdeš a tým vynútiš jej
vyhodnotenie. Spúšťajú ju `foreach`, `ToList()`, `ToArray()`, `Count()`,
`First()`, `Sum()` a podobne.

```csharp
var list = query.ToList(); // ✅ TERAZ sa vypíše „testujem ..." a dotaz prebehne
```

### Prečo na tom záleží

**1. Viacnásobné prejdenie = viacnásobné vykonanie.** Toto je najčastejší skrytý
výkonnostný problém ({{term:multiple-enumeration|multiple enumeration}}):

```csharp
// ❌ Dotaz (a možno DB volanie!) sa vykoná DVAKRÁT
IEnumerable<Order> orders = _db.Orders.Where(o => o.IsActive);
var count = orders.Count();        // 1. prejdenie
var first = orders.First();        // 2. prejdenie – znova celý dotaz
```
```csharp
// ✅ Materializuj raz, potom pracuj s hotovým zoznamom
List<Order> orders = _db.Orders.Where(o => o.IsActive).ToList();
var count = orders.Count;          // už len property, žiadny dotaz
var first = orders[0];
```

**2. Odložené vyhodnotenie a meniace sa premenné.** Keďže sa dotaz vykoná až pri
iterácii, „vidí" stav v momente prejdenia, nie definície:

```csharp
// ❌ Prekvapenie: filtruje podľa hodnoty platnej pri foreach
var threshold = 5;
var q = numbers.Where(n => n > threshold);
threshold = 100;
foreach (var n in q) Console.WriteLine(n); // filtruje podľa 100, nie 5!
```

**3. Lenivosť je niekedy výhoda.** Ak chceš spracovať len prvých pár prvkov
z obrovskej (alebo nekonečnej) sekvencie, lenivosť ti ušetrí prácu:

```csharp
// ✅ Vyhodnotí sa len toľko prvkov, koľko treba – nie celá sekvencia
var firstThree = hugeSequence.Where(x => x.IsValid).Take(3).ToList();
```

### Rob / nerob — zhrnutie

- ✅ **Materializuj raz** (`ToList`/`ToArray`), ak budeš výsledok prechádzať
  viackrát alebo sa naň pýtať opakovane.
- ❌ **Nevracaj „živý" `IEnumerable`** z dátovej vrstvy, ak volajúci nečaká, že
  prechod znova spustí DB dotaz.
- ✅ **Nechaj lenivosť pracovať** pri `Take`, `First`, `Any` nad veľkými zdrojmi —
  vtedy je predčasné `ToList()` plytvanie pamäťou.
- ❌ **Nepredpokladaj**, že dvojité prejdenie je „len rýchle prečítanie" — pri
  LINQ-to-SQL/EF je to ďalší dotaz do databázy.

> 🏢 V KROSe: Pri práci s našou dátovou vrstvou (KORM/EF) si daj extra pozor na
> multiple enumeration — `IQueryable` sa môže preložiť na SQL a každé prejdenie
> je reálny dotaz. Konkrétne konvencie ti ukáže mentor.

## Dependency Injection

### Čo to je a prečo

{{term:di|Dependency Injection}} (DI) znamená, že si objekt svoje závislosti
**nevytvára sám**, ale dostane ich zvonku — typicky cez konštruktor.

```csharp
// ❌ Tvrdá závislosť: trieda si sama vyrobí konkrétnu implementáciu
public class OrderService
{
    private readonly SqlOrderRepository _repo = new SqlOrderRepository();
    // nedá sa otestovať bez reálnej DB, nedá sa vymeniť implementácia
}
```
```csharp
// ✅ Závislosť príde zvonku cez interface – vymeniteľná a testovateľná
public class OrderService
{
    private readonly IOrderRepository _repo;
    public OrderService(IOrderRepository repo) => _repo = repo;
}
```

**Prečo to chceme:** testovateľnosť (v teste podstrčíš fake/mock repository),
voľná previazanosť (vymeníš implementáciu bez zásahu do `OrderService`) a jedno
miesto, kde sa rozhoduje, čo sa kam dosadí.

### Životnosti služieb

V ASP.NET registruješ služby do kontajnera a volíš ich životnosť:

```csharp
builder.Services.AddSingleton<ICache, MemoryCache>();   // jedna inštancia na celú aplikáciu
builder.Services.AddScoped<IOrderRepository, Repo>();   // jedna na HTTP request
builder.Services.AddTransient<IClock, SystemClock>();   // nová pri každom vyžiadaní
```

> ⚠️ Pozor: Nevkladaj `Scoped` službu do `Singleton` — singleton žije dlhšie než
> request a „zamrazil" by si v ňom neplatnú scoped závislosť (tzv. captive
> dependency).

> 🏢 V KROSe: Konkrétne konvencie registrácie a odporúčané životnosti pre naše
> služby ti ukáže mentor na reálnom projekte.
