# PR procesy

**Pull request (PR)** je **žiadosť o začlenenie tvojich zmien do hlavnej vetvy
(`master`)**. Nie je to len „tlačidlo na merge" — je to **miesto, kde kolegovia
tvoj kód uvidia, prejdú a schvália** ešte predtým, než sa dostane k ostatným.

> 💡 Tip: PR je rozhovor o kóde, nie formalita. Dobre pripravený PR (malý, jasne
> popísaný, otestovaný) sa rýchlo reviewuje a rýchlo merguje. Veľký a neoverený PR
> zdržuje teba aj reviewerov.

## Čo je pull request

Cieľom PR je dostať zmenu z tvojej **vetvy** do `master` **bezpečne** — t. j.
overenú buildom, testami a ľudským review. Celá cesta vyzerá takto:

```
  master ─▶ vetva ─▶ commity ─▶ testy ─▶ lokálne overenie ─▶ nuke build
                                                                  │
   ┌──────────────────────────────────────────────────────────-─┘
   ▼
  PR draft ─▶ review kolegami ─▶ publish + approve ─▶ PR pipeline + AI review
                                                                  │
   ┌──────────────────────────────────────────────────────────-─┘
   ▼
  merge do mastera ─▶ post-merge pipeline ─▶ deploy na testlab ─▶ manuálna kontrola
```

V tejto téme prejdeme túto cestu **krok po kroku** (1–16). Neboj sa — väčšinu vecí
robíš pri každom PR rovnako a rýchlo si ich osvojíš.

## Príprava vetvy a zmien

**1. Zober si aktuálny `master`.** Skôr než začneš, stiahni si najnovšiu verziu
hlavnej vetvy (`git pull` na `master`), aby si staval na tom najnovšom.

**2. Vytvor si lokálnu vetvu z `master`.** Názov vetvy má **konvenciu**:
**zámer** (čo ideš robiť) + `/` + **vec, ktorú riešiš**, v `kebab-case`.

```
  <zámer>/<vec-v-kebab-case>
   ├─ feature/invoices-export        (nová funkcia)
   ├─ bugfix/wrong-vat-rounding      (oprava chyby)
   ├─ ai/extraction-prompt-tuning    (len definičné súbory pre AI)
   └─ refactor/payment-service-cleanup  (refaktoring bez zmeny správania)
```

> ⚠️ Pozor: Prefix `ai/` použi **len vtedy, keď meníš iba definičné súbory pre AI**
> (napr. prompty či inštrukcie agenta) — **nie** vždy, keď si pri písaní bežného
> kódu pomáhaš AI. Taká vetva je stále `feature/`, `bugfix/` alebo `refactor/`.

**3. Rob zmeny a commituj priebežne** — v rozumných dávkach (jeden commit = jedna
logická zmena), nie všetko v jednom obrovskom commite na konci.

> 💡 Tip: Na generovanie kódu vieš použiť AI modely — ale **znalosť kódu je
> dôležitejšia než rýchlosť**. Najmä keď začínaš v novom repozitári, skús veci
> **napísať sám**; lepšie porozumieš tomu, ako to funguje, a AI potom vieš
> kontrolovať, nie len dôverovať.

> ⚠️ Pozor: Dodržuj **konvencie kódu, ADR a tímové praktiky** — viď tému
> [Konvencie kódu](topic.html?id=coding-convention). Kód, ktorý nesedí so štýlom
> tímu, sa ťažšie reviewuje a často neprejde ani buildom.

## Unit a API testy

**4. Napíš unit testy.** Keď je funkcionalita hotová, **pokry novú logiku
unit testami** v rozumnom rozsahu — nech testy chránia to, čo si pridal/zmenil.

**5. Zváž API testy.** Niektoré PR ich vyžadujú, niektoré nie — ale vždy **musíš
o tom premýšľať**: pokrývajú tvoju zmenu API testy? Zvyčajne ich dávame do
**samostatného PR**, no rozhodnutie je na tebe (a reviewerovi).

- Na nové API testy používame primárne **TeaPie** (`.http` testy) —
  [dokumentácia TeaPie](https://www.teapie.fun/docs/introduction.html).
- V **staršom (legacy)** kóde nájdeš API testy ako **Postman** kolekcie.

> 💡 Tip: Unit test overuje malý kúsok logiky izolovane; API test overuje, že
> endpoint ako celok odpovedá správne. Oba typy sa dopĺňajú.

## Lokálne overenie a build

**6. Otestuj zmeny lokálne.** Toto býva **najzdĺhavejšia časť** — treba si
**rozbehať vlastné prostredie**. Máš dve cesty:

- **Aspire** — rozbehne ti služby cez **Docker**; štartuješ „načisto" (fresh
  prostredie zakaždým). Treba rozumieť, že beží v kontajneroch.
- **„Starou cestou"** — spustíš (viaceré) projekty priamo z **Visual Studia**.

> ⚠️ Pozor: Pri spúšťaní z Visual Studia **nezabudni presmerovať správy na iný než
> testlab Service Bus** — alebo sa ináč uisti, že **nekradneš správy** ostatným.
> Návod je vo [wiki](https://krossk.sharepoint.com/sites/OM/_layouts/15/Doc.aspx?sourcedoc={bd7f3976-568a-42b2-bba6-42ec11e76011}&action=edit&wd=target%28Wiki%202.0.one%7C99bac7e5-2dcc-4274-ba58-f6b26f8b1717%2FProgram%C3%A1torsk%C3%A9%20%22%C5%A1kolenia%22%7C4f6c7737-55d2-41e6-b9ba-36981762d143%2F%29&wdorigin=NavigationUrl).

**7. Spusti `nuke build --wae`.** Keď všetko lokálne funguje, spusti build cez
**Nuke**. Má **prísnejšie pravidlá než lokálny build** (`--wae` = *warnings as
errors*) — rovnaké ako na PR pipeline. Spusti aj **unit testy aj API testy**.

> ⚠️ Pozor: Tvoja vetva mohla medzitým **zostarnúť oproti `master`**. Ešte pred PR
> sa uisti, že máš **najnovší `master` vo vetve** a že **nie sú merge konflikty**.
> Ak konflikty sú, vyrieš ich **teraz** (nie až keď je PR v review) a `nuke build`
> potom spusti znova.

## Vytvorenie a review PR

**8. Vytvor PR ako draft.** Keď je všetko zelené:

- **Prelinkuj súvisiace work itemy** — task aj jeho rodiča (User Story / Bug).
- Napíš **zmysluplný popis**, ktorý reviewerom pomôže pochopiť, čo a prečo si
  spravil.
- Ešte raz si **prejdi diff** — čo presne meníš.
- Ako PR štruktúrovať, je v **root `readme.md`** repozitára
  [Invoicing](https://dev.azure.com/krossk/Esw/_git/Invoicing).

**9. Pošli PR na review.** Keď si s draftom spokojný, pošli ho do **vyhradenej
skupiny** (ktorá to je, ti povie mentor), nech ho kolegovia prezrú.

**10. Zapracuj pripomienky.** Komentáre a návrhy reviewerov **zváž a podľa potreby
zapracuj**. Po zmenách sa uisti, že **bod 7 stále platí** (build aj testy zelené).

**11. Reviewer publikuje a schváli.** Keď je všetko v poriadku, tvoj reviewer/-i
PR **publikujú a schvália (approve)**.

> 💡 Tip: Čím lepší popis a menší PR, tým menej kôl pripomienok. Review nie je
> útok na teba — je to spoločná kontrola kvality.

## Pipeline, merge a nasadenie

**12. PR pipeline + AI review.** Spustí sa pipeline, ktorá overí **build, unit
testy a API testy** (nula chýb). Zároveň vznikne **AI review** — na jeho návrhy
reaguj rovnako ako v bode 10. Ak pipeline spadne, **oprav príčinu** a zopakuj 10.

**13. Merge do `master`.** Keď je pipeline zelená a na AI review si odpovedal,
môžeš PR **mergnúť do `master`**.

**14. Post-merge pipeline.** Po merge beží **ďalšia pipeline**, ktorá kontroluje
to isté ako PR pipeline. V nešťastnom prípade môže **spadnúť** — vtedy treba
zistiť, čo je zle. Býva to ťažšie, preto **pokojne popros skúsenejšieho kolegu** o
pomoc.

**15. Deploy na testlab.** Po zelenej post-merge pipeline beží **posledná
pipeline**, ktorá zmeny **nasadí na testlab**. Sleduj ju rovnako ako v bode 14.

**16. Hotovo — over a oznám.** Tvoje zmeny sú na **testlabe**. Je dobrým zvykom
si ich tam **manuálne prekliknúť** a **dať vedieť testerom**, že je to nasadené a
**pripravené na testovanie**.

> 🏢 V KROSe: Do ktorej review skupiny PR posielať, ktoré PR vyžadujú API testy a
> ako presne vyzerá testlab, ti upresní mentor. Prvých pár PR pokojne prejdi s ním.
