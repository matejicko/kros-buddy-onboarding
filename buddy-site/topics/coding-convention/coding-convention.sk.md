# Konvencie kódu

**Konvencie kódu** sú dohodnuté pravidlá, *ako* píšeme a formátujeme kód —
pomenúvanie, štruktúra, formátovanie, vzory. Cieľ je jednoduchý: aby kód celého
tímu vyzeral, akoby ho písal jeden človek. Vďaka tomu sa **ľahšie číta,
reviewuje a udržiava** a menej sa hádame o štýle v PR.

Táto téma je **rozcestník** — kde u nás nájdeš pravidlá štýlu, dôležité
architektonické rozhodnutia a tímové dobré praktiky. Odporúčam si **prístupy
vybaviť hneď v prvých dňoch** (najmä k ADR repozitáru, viď nižšie).

## Štýl kódu

Náš **coding style** je verejne na GitHube — pomenúvanie, formátovanie, usporiadanie
`using`-ov, konvencie pre async, testy atď. Keď si nie si istý „ako sa to u nás
píše", toto je prvé miesto, kam sa pozrieš.

**Odkaz:** [KROS coding-style.md](https://github.com/Kros-sk/kros-sk.github.io/blob/master/coding-style.md)

> 💡 Tip: Veľkú časť štýlu (formátovanie, jednoduché pravidlá) ti vie vynútiť
> **editor sám** cez `.editorconfig` a analyzátory priamo pri písaní — nemusíš si
> všetko pamätať. Pravidlá štýlu rieš radšej automaticky než ručne v review.

## ADR – Architecture Decision Records

**ADR (Architecture Decision Record)** je krátky dokument, ktorý zachytáva **jedno
dôležité (architektonické) rozhodnutie**: *aký bol kontext, čo sme sa rozhodli a
aké to má dôsledky*. Vďaka ADR tím o pár mesiacov vie **prečo** sa niečo spravilo
tak, ako sa spravilo — namiesto dohadovania a opätovného otvárania uzavretých tém.

**Odkaz:** [Kros.ADR / Adrs](https://github.com/Kros-sk/Kros.ADR/tree/master/Adrs)

> 🏢 V KROSe: Tento repozitár je **privátny**. Aby si sa k nemu dostal:
> 1. prihlás sa svojím **súkromným GitHub účtom**,
> 2. ozvi sa **Milanovi Martiniakovi** — pridelí ti prístup (access grant) k repozitáru.
>
> Bez prideleného prístupu ti odkaz vyššie ukáže chybu (404 / „not found").

> 💡 Tip: ADR sa týka **rozhodnutí** (napr. „prečo sme zvolili tento prístup"),
> nie formátovania kódu — to patrí do štýlu kódu vyššie.

## Tímové dobré praktiky

Okrem štýlu a ADR máme aj **tímovú wiki** s dobrými praktikami, priebežnými
novinkami a konvenciami — veci, ktoré sa časom ustália a oplatí sa ich mať na
jednom mieste.

**Odkaz:** [Tímová wiki (SharePoint / OneNote)](https://krossk.sharepoint.com/sites/OM/_layouts/15/Doc.aspx?sourcedoc={bd7f3976-568a-42b2-bba6-42ec11e76011}&action=edit&wd=target%28Wiki%202.0.one%7C99bac7e5-2dcc-4274-ba58-f6b26f8b1717%2FProgram%C3%A1torsk%C3%A9%20%22%C5%A1kolenia%22%7C4f6c7737-55d2-41e6-b9ba-36981762d143%2F%29&wdorigin=NavigationUrl)

> 🏢 V KROSe: Otvorí sa cez tvoje KROS (Microsoft 365) konto. Ak ťa odkaz
> nepustí dnu, povedz mentorovi — dorieši ti prístup. Sem sa vracaj priebežne,
> nielen v prvý týždeň — praktiky sa dopĺňajú.
