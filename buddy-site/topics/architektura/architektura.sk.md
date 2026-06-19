# Architektúra

**Softvérová architektúra sú rozhodnutia o tom, na aké časti systém rozdelíme a
ako spolu komunikujú.** Neexistuje jedno „správne" riešenie — je to vždy
**kompromis** medzi jednoduchosťou, veľkosťou tímu, škálovaním a tým, ako
nezávisle chceš nasadzovať jednotlivé časti.

Táto téma ťa prevedie hlavnými prístupmi, ktoré u nás uvidíš, a ukáže ti *kedy
ktorý* dáva zmysel. Nepamätaj si definície naspamäť — chápať kompromisy je oveľa
cennejšie.

> 💡 Tip: Na hlbší ponor sú výborné [.NET architektúra od Microsoftu](https://learn.microsoft.com/en-us/dotnet/architecture/)
> a dokumentácia [.NET Aspire](https://aspire.dev/).

## Mikroslužby vs. modulárny monolit

Toto je asi najčastejšia architektonická otázka. Pozrime sa na tri prístupy.

### Klasický monolit

Celá aplikácia je **jeden nasaditeľný celok**, jeden proces, typicky jedna
databáza.

```
        ┌─────────────────────────────────────┐
        │            JEDEN PROCES              │
        │  ┌────────┐ ┌────────┐ ┌──────────┐  │
        │  │ Objedn.│ │ Faktúry│ │ Zákazníci│  │   ← všetko spolu,
        │  │ modul  │ │ modul  │ │  modul   │  │     volajú sa priamo
        │  └────────┘ └────────┘ └──────────┘  │
        └──────────────────┬──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  1 databáza │
                    └─────────────┘
```

- ✅ Jednoduché na vývoj, ladenie aj nasadenie (jeden artefakt).
- ✅ Volania medzi časťami sú obyčajné volania metód — rýchle, transakčné.
- ❌ Časom hrozí „**big ball of mud**": všetko závisí od všetkého, zmena na
  jednom mieste rozbije iné.
- ❌ Škáluješ len celok naraz, nie jednotlivé časti.

### Modulárny monolit

Stále **jeden proces a jeden deploy**, ale vnútri je rozdelený na **moduly
s jasnými hranicami a rozhraniami** (často aj oddelené schémy v DB). Moduly sa
nesmú „prehrabávať" v cudzích vnútornostiach — komunikujú cez definované API.

```
        ┌─────────────────────────────────────┐
        │   JEDEN PROCES (jasné hranice)       │
        │  ┌────────┐   ┌────────┐  ┌────────┐ │
        │  │Objedn. │──▶│ API    │  │Zákazníci│ │   ← cez rozhrania,
        │  │(schéma)│   │ modulu │  │(schéma) │ │     nie do vnútra
        │  └────────┘   └────────┘  └────────┘ │
        └──────────────────┬──────────────────┘
                    ┌──────▼──────┐
                    │  1 databáza │ (oddelené schémy)
                    └─────────────┘
```

- ✅ Jednoduchosť monolitu + poriadok a hranice.
- ✅ Ak sa raz rozhodneš pre mikroslužby, modul sa **ľahko vytrhne** von.
- ❌ Stále jeden deploy a (väčšinou) jedno škálovanie.

### Mikroslužby

Mnoho **malých, nezávisle nasaditeľných služieb**, každá má **vlastnú databázu**
a komunikujú **po sieti** (HTTP alebo cez Service Bus).

```
   ┌──────────┐    HTTP/správy   ┌──────────┐      ┌──────────┐
   │ Objednávky│◀───────────────▶│  Faktúry │      │ Zákazníci│
   │  služba  │                  │  služba  │      │  služba  │
   └────┬─────┘                  └────┬─────┘      └────┬─────┘
     ┌──▼──┐                       ┌──▼──┐           ┌──▼──┐
     │ DB  │                       │ DB  │           │ DB  │   ← každá vlastná
     └─────┘                       └─────┘           └─────┘
```

- ✅ Každú službu **nasadíš a škáluješ samostatne**; tímy pracujú nezávisle.
- ✅ Sloboda v technológiách (jedna služba C#, iná čokoľvek).
- ❌ **Distribuovaný systém = nová trieda problémov**: sieť zlyháva, latencia,
  *eventual consistency* (každá služba má vlastnú DB → dáta sú medzi nimi chvíľu
  **nekonzistentné**, kým sa „časom zladia"; žiadne ľahké transakcie cez služby),
  zložitejšie ladenie a monitoring, viac DevOps réžie.

### Ktorý zvoliť?

| Hľadisko | Monolit / modulárny | Mikroslužby |
|---|---|---|
| Veľkosť tímu | malý–stredný | viac nezávislých tímov |
| Zložitosť prevádzky | nízka | vysoká (orchestrácia, monitoring) |
| Nezávislé nasadenie častí | nie / obmedzene | áno |
| Transakcie naprieč doménami | jednoduché | ťažké (eventual consistency) |
| Škálovanie | celok | po službách |

> 💡 Tip: Bežné a zdravé je **začať modulárnym monolitom** a mikroslužbu vytrhnúť
> až vtedy, keď na to máš konkrétny dôvod (samostatné škálovanie, samostatný tím,
> iný release cyklus). Mikroslužby „lebo je to moderné" sú častý a drahý omyl.

> ⚠️ Pozor: Mikroslužby neriešia zlý návrh — ak zle rozdelíš hranice, dostaneš
> *distribuovaný* big ball of mud, čo je horšie ako monolitický.

## Monorepo

**Monorepo** = jeden git repozitár, v ktorom žije **viacero projektov** (služby,
knižnice, frontend). Opak je *polyrepo* — repo pre každú službu zvlášť.

```
   MONOREPO (1 repo)                 POLYREPO (N repos)
   /repo                             /orders-repo   → Orders
   ├── services/Orders               /invoices-repo → Invoices
   ├── services/Invoices             /shared-repo   → Shared (cez NuGet)
   ├── libs/Shared
   └── frontend/
```

> ⚠️ Pozor: **Monorepo nie je to isté ako monolit!** Monorepo je o *uložení
> kódu*, monolit/mikroslužby o *behu a nasadení*. Pokojne môžeš mať mikroslužby
> v jednom monorepe, alebo monolit roztrúsený po viacerých repách.

- ✅ **Atomická zmena naprieč projektmi** — jeden PR upraví knižnicu aj službu,
  ktorá ju používa. Žiadne čakanie na vydanie NuGet balíka.
- ✅ Zdieľaný kód, jednotné nástroje a štandardy, ľahší refaktoring.
- ❌ Potrebuje šikovné CI (zbuildovať/otestovať len **dotknuté** projekty, nie
  všetko) a repo časom narastie.

> 🏢 V KROSe: Či konkrétny produkt žije v monorepe alebo má repo-na-službu a ako
> sú nastavené pipelines, ti ukáže mentor — líši sa to medzi tímami.

## Service Bus – asynchrónne správy

Doteraz služby komunikovali **synchrónne** (HTTP: zavoláš a čakáš na odpoveď).
Lenže to viaže obe strany — príjemca musí byť online a rýchly. **Service Bus**
(message broker) umožňuje **asynchrónnu** komunikáciu cez **správy**: odosielateľ
správu „pošle a ide ďalej", príjemca ju spracuje, keď stihne.

Prečo to chceme:
- **Oddelenie v čase** — príjemca môže byť práve vypnutý; správa počká.
- **Vyrovnávanie záťaže** (load leveling) — špička sa nazbiera vo fronte a
  spracuje sa postupne.
- **Odolnosť** — pri chybe sa správa **opakuje**, po N pokusoch ide do
  *dead-letter* fronty na neskoršiu analýzu.

### Queue (fronta) — point-to-point

Jedna fronta, **jednu správu dostane práve jeden** príjemca. Viac príjemcov =
*competing consumers* (delia si prácu a škálujú priepustnosť).

```
                          ┌───────── QUEUE ─────────┐
   Producer ──správa──▶   │ ▢ ▢ ▢ ▢ ▢               │ ──▶ Consumer A
                          └─────────────────────────┘ ╲─▶ Consumer B
                                                          (každú správu
                                                           dostane LEN jeden)
```

Použitie: „spracuj túto objednávku", „pošli tento e-mail" — úloha, ktorú má
vykonať práve jeden pracovník.

### Topic + Subscription — publish/subscribe

**Topic** je ako fronta, ale má **viacero subscriptions**. Každá subscription
dostane **vlastnú kópiu** každej (vyhovujúcej) správy. Tak môže na jednu udalosť
reagovať **viacero nezávislých príjemcov**.

```
                                  ┌── Subscription "Fakturácia" ──▶ Consumer 1
   Publisher ──udalosť──▶ TOPIC ──┤
   "OrderCreated"                 ├── Subscription "Sklad" ───────▶ Consumer 2
                                  │
                                  └── Subscription "Notifikácie" ─▶ Consumer 3
   (každá subscription dostane VLASTNÚ kópiu správy; môže mať filter/pravidlo)
```

Použitie: udalosť „Objednávka vytvorená" — fakturácia vystaví faktúru, sklad
zníži zásoby, notifikácie pošlú e-mail. Odosielateľ o príjemcoch **nevie** a je
mu to jedno — pridať ďalšieho je len nová subscription.

| | Queue | Topic + Subscriptions |
|---|---|---|
| Model | point-to-point | publish/subscribe |
| Správu dostane | práve jeden consumer | každá subscription (kópiu) |
| Typické pre | „urob túto úlohu" | „stalo sa toto, nech reaguje kto chce" |

> 💡 Tip: Synchrónne (HTTP) zvoľ, keď **potrebuješ odpoveď hneď**. Asynchrónne
> (Service Bus), keď chceš **oddeliť** odosielateľa a príjemcu, zvládnuť špičky
> alebo nech na jednu udalosť reaguje viac strán.

> 🏢 V KROSe: Používame **Azure Service Bus**. Ako pomenúvame topics/queues,
> ako riešime opakovania a dead-letter, ti ukáže mentor na reálnom projekte.

## Knižnice, služby a Azure Functions

Často sa zamieňa, čo je „len kód" a čo „beží samo". Toto sú tri rôzne veci:

### Knižnica (library / NuGet)

Skompilovaný kód (`.dll`), ktorý **sám o sebe nebeží** — nemá proces ani
endpoint. Iný kód ju **použije** (zavolá jej triedy/metódy). Príklady u nás:
`Kros.Framework`, `KORM`.

```
   [ Tvoja služba ] ──používa──▶ [ Knižnica .dll ]   (knižnica sama nič nespustí)
```

### Služba na ASP.NET

**Dlhobežiaci proces**, ktorý hostuje HTTP endpointy (API) a/alebo workerov na
pozadí. Je **stále zapnutý**, ty riešiš jeho hosting a škálovanie.

```
   Klient ──HTTP──▶ [ ASP.NET služba (beží stále) ] ──▶ DB
```

### Azure Functions

**Serverless** — malé funkcie, ktoré spustí **udalosť (trigger)**: HTTP
požiadavka, správa z queue/topicu, časovač (timer). Host spravuje Azure, funkcia
**škáluje aj na nulu** (keď niet práce, nebeží a neplatíš) a platíš za behy.

```
   [HTTP / správa z Service Bus / timer] ──trigger──▶ [ Azure Function ] ──▶ ...
```

| | Knižnica | ASP.NET služba | Azure Function |
|---|---|---|---|
| Beží sama? | nie | áno, stále | len keď ju niečo spustí |
| Čo ju spustí | nič (volá ju kód) | beží nepretržite | trigger (HTTP/správa/timer) |
| Hosting | — | spravuješ ty | spravuje Azure |
| Škáluje na nulu | — | nie | áno |
| Hodí sa na | zdieľaný kód | stále API, zložitejšiu logiku | udalosťami riadené / nárazové úlohy |

> 💡 Tip: Functions sú skvelé ako „lepidlo" reagujúce na správy zo Service Bus
> alebo na časovač. Stále bežiace API s veľa endpointmi a stavom býva lepšie ako
> ASP.NET služba.

## AppHost a .NET Aspire

Moderná aplikácia má veľa pohyblivých častí: API, frontend, databáza, Redis,
Service Bus, Functions… Rozbehať to **všetko naraz lokálne** býva otrava
(porty, connection stringy, poradie štartu).

**.NET Aspire** je nadstavba na stavanie distribuovaných aplikácií a **AppHost**
je jej srdce — **orchestračný projekt**, ktorý v C# **deklaratívne opisuje, z
čoho sa appka skladá** (tzv. *app model*) a ako sú časti pospájané.

```
        ┌──────────────── AppHost (orchestrátor) ────────────────┐
        │  deklaruje resources a ich väzby (references)          │
        │                                                        │
        │   AddProject<Api>("api") ─WithReference─▶ AddPostgres  │
        │   AddProject<Frontend>  ─WithReference─▶ "api"         │
        │   AddRedis("cache")                                    │
        └───────┬───────────────┬───────────────┬───────────────┘
                ▼               ▼               ▼
          [ API projekt ]  [ Frontend ]   [ Postgres + Redis
                                            ako kontajnery ]
                  └──────── Aspire Dashboard: logy, metriky, traces ───────┘
```

V praxi vyzerá app model takto (zjednodušene):

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// "Resource" = časť systému: DB, cache, projekt, kontajner...
var db = builder.AddPostgres("db").AddDatabase("appdata");

var api = builder.AddProject<Projects.Api>("api")
    .WithReference(db)   // "reference" = závislosť; Aspire vstrekne connection string
    .WaitFor(db);        // a postará sa o správne poradie štartu

builder.AddProject<Projects.Frontend>("web")
    .WithReference(api); // frontend nájde API cez service discovery (logický názov)

builder.Build().Run();
```

Čo ti AppHost dáva:
- **F5 a beží celá appka** — žiadne ručné spúšťanie piatich projektov.
- **Service discovery** — služby sa nájdu podľa **logického názvu** (`"api"`),
  nie cez natvrdo zadané URL a porty.
- **References** — keď službu „referencuješ", Aspire jej **automaticky vstrekne**
  connection string / adresu (žiadne ručné kopírovanie do configov).
- **Observability** — zabudovaný **dashboard** (logy, metriky, traces cez
  OpenTelemetry) na jednom mieste.

> 💡 Tip: AppHost je primárne **vývojárska/orchestračná** vec. Z app modelu vie
> Aspire vygenerovať aj podklady na nasadenie (napr. do Azure Container Apps) —
> nie je to teda runtime závislosť každej jednej služby.

> 🏢 V KROSe: Či a ako používame AppHost/Aspire na lokálny beh a ako máme
> nastavené resources a service discovery, ti ukáže mentor — toto je presne to,
> čo si rozbehneš v prvých dňoch.
