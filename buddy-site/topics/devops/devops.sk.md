# DevOps

V tejto téme ide o to, **ako plánujeme a sledujeme prácu** — teda o
**work items** a **dosky (boards)** v Azure DevOpse.

> 💡 Tip: Predstav si Azure DevOps Boards ako veľkú zdieľanú nástenku s
> kartičkami úloh. Každý vie, kto na čom robí, v akom je to stave a čo príde ďalej.

## Čo je work item

**Work item** je **sledovaná jednotka práce** v Azure DevOpse — úloha, bug,
požiadavka… Má svoj **typ**, **názov**, **stav**, **priradeného človeka**, popis a
ďalšie polia. Každý má jedinečné **číslo (ID)**, napr. `#12345`, na ktoré sa dá
odkazovať (aj v commite či PR).

```
  ┌─────────────────────────────────────┐
  │ #12345  User Story                   │
  │ Pridať export faktúr do CSV          │
  │ Stav: Active     Priradené: Janko    │
  │ Tagy: export, ucto                   │
  └─────────────────────────────────────┘
```

Work item sa počas života pohybuje cez **stavy**, typicky:

```
  New  ──▶  Active  ──▶  Resolved  ──▶  Closed
 (nové)   (pracuje sa)  (hotové,        (uzavreté)
                         čaká overenie)
```

> 🏢 V KROSe: Presné typy a stavy závisia od nastaveného procesu (Agile/Scrum/…)
> a môžu byť prispôsobené. Aké presne používa tvoj tím, ti ukáže mentor.

## Hierarchia work itemov

Work items nie sú „placka" — sú **vnorené od veľkých cieľov po konkrétne úlohy**.
Štandardná hierarchia:

```
  Epic            napr. „Elektronická fakturácia"        (mesiace, veľký cieľ)
   └─ Feature     napr. „Export faktúr do CSV"           (týždne, ucelený kus)
       ├─ User Story  napr. „Používateľ stiahne CSV"     (dni, hodnota pre usera)
       │   └─ Task    napr. „Napísať CSV serializer"     (hodiny, konkrétny krok)
       └─ Bug         napr. „Zlé kódovanie diakritiky"   (chyba na opravu)
```

- **Epic** — veľká téma/cieľ, zastrešuje viac features.
- **Feature** — ucelený kus funkcionality, ktorý sa dá dodať.
- **User Story** — prírastok s hodnotou pre používateľa; **Bug** je na tej istej
  úrovni (chyba, ktorú treba opraviť).
- **Task** — najmenšia, konkrétna vývojárska úloha (z čoho sa skladá User Story).

Vyššie položky sú **rodičia** nižších (parent–child). Vďaka tomu vidno, ku
ktorému väčšiemu cieľu daná malá úloha patrí.

## Backlog vs. Sprint (iterácia)

- **Backlog** je **zoradený zoznam VŠETKEJ práce**, ktorá nás ešte čaká —
  priorita zhora nadol. Je to „čo príde", priebežne sa prehadzuje a dopĺňa.
- **Sprint (iterácia)** je **časový box** (napr. 2 týždne), do ktorého si z
  backlogu **vyberieš podmnožinu** položiek, ktoré ideš spraviť **teraz**.

```
   BACKLOG (priorita ↓)            SPRINT 24 (2 týždne)
   ▢ Export do CSV     ───pull──▶  ▢ Export do CSV
   ▢ Filter faktúr     ───pull──▶  ▢ Filter faktúr
   ▢ Hromadná platba                (na tomto sa robí TERAZ)
   ▢ Štatistiky
   ▢ ... (čaká)
```

> 💡 Tip: Backlog = priebežne meniaci sa zoznam želaní (priorita sa upravuje).
> Sprint = záväzok na konkrétne obdobie; čo je v ňom, na tom sa pracuje teraz.

## Viaceré tímy

V jednom projekte býva **viac tímov** a každý má **vlastnú dosku, vlastný backlog
a vlastné sprinty**. Work item patrí pod **oblasť (area path)** konkrétneho tímu.

```
   PROJEKT
   ├─ Tím A   → vlastná doska, backlog, iterácie
   ├─ Tím B   → vlastná doska, backlog, iterácie
   └─ Tím C   → vlastná doska, backlog, iterácie
```

Preto „backlog" nie je jeden univerzálny — vždy závisí, na **ktorý tím** sa
práve pozeráš.

> 🏢 V KROSe: Ktoré tímy existujú, pod ktorý patríš ty a ako sú rozdelené oblasti
> (area paths), ti ukáže mentor.

## Prispôsobenia dosky (tagy, farby, cycle time, odhad)

Dosky sa dajú prispôsobiť, aby sa v práci lepšie orientovalo:

- **Tagy (tags)** — voľné štítky na work itemoch (napr. `tech-debt`, `hotfix`,
  `ucto`), podľa ktorých vieš filtrovať a zoskupovať.
- **Farby kariet** — farebné pravidlá (podľa typu, tagu či poľa), aby si dôležité
  veci videl na prvý pohľad.
- **Cycle time** — analytická metrika: ako dlho work item trval **od začatia po
  dokončenie**. Pomáha vidieť priepustnosť a kde sa práca „zasekáva".
- **Odhad času** — sizing práce na plánovanie: **Story Points** (relatívna
  náročnosť) alebo hodinové odhady (Effort / Original Estimate…).

> 🏢 V KROSe: Aké tagy, farby, polia odhadu a metriky tvoj tím reálne používa
> (a ako ich vyplňovať), je tímová konvencia — ukáže ti ju mentor.
