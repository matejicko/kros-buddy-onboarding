# Klient-Server

Väčšina toho, čo staviame, sú **dve strany, ktoré sa spolu rozprávajú**: klient
sa niečo pýta, server odpovedá. Keď pochopíš tento rozhovor — kto, čo, kam a s
akým výsledkom posiela — vieš ladiť skoro hocičo.

> 💡 Tip: Najlepší spôsob, ako to „vidieť na vlastné oči", je **inšpektor v
> prehliadači** (téma nižšie). Otvor ho a sleduj, čo presne tvoja appka posiela.

## Klient a server

**Klient** je ten, kto **začína komunikáciu** a niečo si pýta: prehliadač,
mobilná appka, Postman, alebo aj iná služba. **Server** je ten, kto **počúva,
spracuje požiadavku a odpovie** — u nás typicky ASP.NET služba.

```
   KLIENT                                      SERVER
  (prehliadač,        ──── request (žiadosť) ──▶   (ASP.NET
   appka, Postman,                                  služba)
   iná služba)        ◀─── response (odpoveď) ───
```

Komunikujú cez **HTTP**. Žiadosť (request) si tu ukážeme vo formáte **`.http`
súboru** — tak ako ju píšeš v TeaPie / REST klientoch (pozri tému **Knižnice**).
V tomto formáte **prázdny riadok oddeľuje hlavičky od tela**:

```
  POST /api/invoices                ← metóda (čo robím) + endpoint (kam)
  Authorization: Bearer eyJ...      ← hlavičky (headers): meta-info, token...
  Content-Type: application/json
                                    ← prázdny riadok = koniec hlavičiek, začína telo
  { "amount": 100 }                 ← telo (body): dáta, ktoré posielam
```

> 💡 Tip: Ten prázdny riadok nie je „magická" požiadavka HTTP — je to spôsob,
> akým `.http` formát (a aj surový HTTP) oddelí hlavičky od tela. V Postmane či v
> kóde ho nevidíš, lebo telo zadávaš do samostatného poľa/parametra.

A každá **odpoveď (response)** vráti:

```
  201 Created                       ← status kód (ako to dopadlo)
  Content-Type: application/json
  { "id": 42 }                      ← telo: dáta, ktoré dostávam späť
```

- **Metóda** hovorí *čo* chcem: `GET` (čítaj), `POST` (vytvor), `PUT`/`PATCH`
  (uprav), `DELETE` (zmaž).
- **Kľúčové:** klient **vždy začína**, server len odpovedá. (Výnimku — keď chce
  server „tlačiť" sám — rieši **SignalR**, nižšie.)

> 💡 Tip: Server o klientovi nič „nepamätá" medzi požiadavkami — HTTP je
> *bezstavové*. Preto sa pri každej žiadosti posiela napr. token v hlavičke
> `Authorization`, aby server vedel, kto sa pýta.

## Endpointy

**Endpoint** je konkrétna **adresa (URL) + metóda**, ktorú server vystavuje a
ktorá robí *jednu vec*.

```
  GET    /api/invoices            → vráť zoznam faktúr
  GET    /api/invoices/42         → vráť faktúru s id 42
  POST   /api/invoices            → vytvor novú faktúru
  DELETE /api/invoices/42         → zmaž faktúru 42
```

Všimni si, že tá istá cesta `/api/invoices` robí **niečo iné podľa metódy** —
endpoint je *cesta + metóda spolu*. Takémuto štýlu (zdroje + HTTP metódy) sa
hovorí **REST**.

> 🏢 V KROSe: Požiadavky z klienta často nejdú rovno na konkrétnu službu, ale cez
> **API Gateway** — jednu vstupnú bránu, ktorá žiadosť nasmeruje na správnu
> mikroslužbu (a rieši napr. autentifikáciu, rate-limiting). Pozri tému
> **Architektúra**. Konkrétne brány a cesty ti ukáže mentor.

## Status kódy

Status kód v odpovedi hovorí **ako to dopadlo**. Delia sa do skupín podľa prvej
číslice — toto je najdôležitejšie zapamätať si:

| Skupina | Význam | „Čia chyba?" |
|---|---|---|
| **2xx** | úspech | — |
| **3xx** | presmerovanie | — |
| **4xx** | chyba na strane **klienta** (zlá žiadosť) | tvoja / klientova |
| **5xx** | chyba na strane **servera** | serverová |

Najčastejšie konkrétne kódy:

| Kód | Názov | Kedy |
|---|---|---|
| **200** | OK | všetko v poriadku, tu sú dáta |
| **201** | Created | úspešne vytvorený nový zdroj (po POST) |
| **204** | No Content | OK, ale nič sa nevracia (napr. po DELETE) |
| **400** | Bad Request | zle poskladaná žiadosť (chýbajúce/zlé dáta) |
| **401** | Unauthorized | nie si prihlásený (chýba/neplatný token) |
| **403** | Forbidden | si prihlásený, ale **nemáš právo** na túto akciu |
| **404** | Not Found | zdroj/endpoint neexistuje |
| **409** | Conflict | konflikt stavu (napr. duplicita) |
| **429** | Too Many Requests | priveľa žiadostí, spomaľ |
| **500** | Internal Server Error | server spadol / neošetrená výnimka |
| **502** | Bad Gateway | brána/proxy dostala neplatnú odpoveď od služby za ňou |
| **503** | Service Unavailable | služba je dočasne nedostupná (preťaženie, údržba) |
| **504** | Gateway Timeout | brána sa nedočkala odpovede od služby včas |

> ⚠️ Pozor: **401 vs. 403** sa často mýli. **401** = *neviem, kto si* (neprihlásený).
> **403** = *viem, kto si, ale sem nesmieš* (chýba oprávnenie). A pravidlo palca:
> **4xx → pozri svoju žiadosť**, **5xx → problém je na serveri**.

## Inšpektor v prehliadači

Vývojárske nástroje prehliadača (otvoríš **F12**) sú tvoj najlepší kamarát pri
ladení komunikácie klient–server. Dve záložky, ktoré budeš používať najviac:

- **Network (Sieť)** — vidíš **každú HTTP žiadosť**, ktorú stránka spraví: jej
  URL, metódu, **status kód**, ako dlho trvala, poslané hlavičky/telo aj prijatú
  odpoveď. Keď niečo „nefunguje", sem sa pozrieš ako prvé.
- **Elements (Elementy)** — aktuálne HTML/DOM stránky a jej CSS štýly; vieš si
  ich aj naživo upraviť (len lokálne, na vyskúšanie).

```
  F12 → Network → klikni na request:
     Status: 403 Forbidden        ← hneď vidíš, čo sa stalo
     Request URL: /api/invoices/42
     Headers / Payload / Response  ← čo si poslal a čo prišlo späť
```

> 💡 Tip: Keď ti frontend hlási chybu, otvor **Network** a pozri status kód
> konkrétnej žiadosti. `401`? Problém s prihlásením. `500`? Pozri logy servera.
> `404`? Zlá URL/endpoint. Ušetrí ti to hodiny hádania.

## SignalR

V bežnom HTTP **klient vždy začína** — server sám od seba nič nepošle. To je
problém, keď chceš **real-time** novinky (notifikácie, živé dáta), lebo klient by
sa musel stále dokola pýtať „je už niečo nové?".

**SignalR** to rieši: vytvorí **trvalé spojenie** (cez **WebSocket**, s
fallbackom na iné techniky) a server **môže klientovi posielať správy sám**, hneď
ako niečo nastane.

```
  Bežné HTTP:   klient ── žiadosť ──▶ server     (klient sa musí pýtať)
                klient ◀─ odpoveď ──  server

  SignalR:      klient ◀════ push ═══ server     (server tlačí sám, real-time)
                └─ trvalé spojenie (WebSocket) ─┘
```

Funguje to cez tzv. **huby**: klient sa pripojí a „odoberá", server potom volá
metódy na pripojených klientoch (napr. „pridaná nová faktúra" → všetkým hneď
naskočí do zoznamu).

> 💡 Tip: SignalR použi, keď dáta majú prísť **samé a okamžite** (chat, živé
> notifikácie, priebeh dlhej operácie). Na bežné „klikni a načítaj" stačí
> normálne HTTP.

## WebAssembly

**WebAssembly (WASM)** je binárny formát, ktorý beží **priamo v prehliadači** a
takmer rýchlosťou natívneho kódu. Dôležité pre nás: vďaka nemu vieme spustiť
**C#/.NET kód priamo v prehliadači** — to je **Blazor WebAssembly**.

```
  Klasická web appka:  C#/.NET beží na SERVERI → prehliadač dostane HTML
  Blazor WASM:         C#/.NET (cez WebAssembly) beží priamo v PREHLIADAČI
```

Pri Blazor WASM sa do prehliadača stiahne .NET runtime a tvoja appka a beží
**na strane klienta** — logiku teda píšeš v C#, nie v JavaScripte.

> 🏢 V KROSe: WebAssembly používame najmä na **výpočty** — nechceme sa pri
> číselných operáciách spoliehať na JavaScript (jeho aritmetika vie byť záludná),
> ale počítať priamo v **C#/.NET**, rovnako ako na serveri. Tým máme istotu, že
> výpočet dá v prehliadači ten istý výsledok ako na backende.

| | Server-side (bežné) | Blazor WebAssembly |
|---|---|---|
| Kde beží logika | na serveri | v prehliadači (klient) |
| Jazyk v prehliadači | JavaScript | C#/.NET cez WASM |
| Prvé načítanie | rýchle | pomalšie (sťahuje runtime) |
| Práca offline | nie | čiastočne áno |

> 💡 Tip: Nezamieňaj **WebAssembly** (technológia, čo umožní spúšťať C# v
> prehliadači) a **SignalR** (real-time komunikácia server→klient). Sú to dve
> rôzne veci, ktoré sa môžu aj kombinovať.
