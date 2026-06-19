# Azure

**Azure** je **cloudový systém od Microsoftu** — namiesto toho, aby sme appky a
databázy prevádzkovali na vlastných serveroch v kancelárii, **prenajímame si ich
v cloude**. V Azure si vieš „naklikať" rôzne **resources (zdroje)** — databázu,
úložisko, frontu na správy, trezor na heslá… — a Azure ich pre teba prevádzkuje.

> 💡 Tip: Predstav si Azure ako veľké datacentrum na prenájom. Ty si povieš „chcem
> databázu a úložisko", Azure ti ich pripraví a ty platíš za to, čo používaš.

## Čo je Azure a resources

**Resource (zdroj)** je **jedna konkrétna vec, ktorú v Azure prevádzkuješ** —
napr. jedna databáza, jedno úložisko, jeden Key Vault. Každý resource má svoj
**typ**, **názov**, **región** (kde fyzicky beží) a **cenovú úroveň (SKU/tier)**.

```
   Azure (cloud)
    ├─ SQL Database        ← dáta aplikácie
    ├─ Storage Account     ← súbory, obrázky, blob dáta
    ├─ Service Bus         ← správy medzi službami
    ├─ Key Vault           ← tajomstvá (heslá, kľúče, certifikáty)
    └─ App Configuration   ← nastavenia + feature flags
```

Všetko, čo appka potrebuje „okolo seba" (dáta, súbory, komunikáciu, tajomstvá,
nastavenia), je v Azure nejaký **resource**, ktorý si vytvoríš a nakonfiguruješ.

## Resource group

**Resource group (skupina zdrojov)** je **kontajner, ktorý logicky zoskupuje
resources, čo patria k sebe** — typicky všetko pre jednu appku alebo jeden
projekt. Nie je to fyzické miesto, je to **organizačný a správny obal**.

```
   Subscription  (predplatné — účet, fakturácia, limity)
    └─ Resource group: rg-invoicing
        ├─ App Service        (beží tu appka)
        ├─ SQL Database       (dáta)
        ├─ Service Bus        (správy)
        ├─ Storage Account    (súbory)
        └─ Key Vault          (tajomstvá)
```

Prečo to chceš mať pekne v skupine:

- **Spoločný životný cyklus** — resources v skupine vieš naraz nasadiť aj naraz
  zmazať (zmažeš skupinu → zmažú sa všetky resources v nej).
- **Prehľad nákladov** — vidíš, koľko stojí celá appka pokope.
- **Práva (access)** — prístup vieš prideliť na úrovni celej skupiny.

> 🏢 V KROSe: Aké resource groups máme, ako sú pomenované a do ktorej patrí tvoj
> projekt, ti ukáže mentor. Ty si len tak „nevyrábaš" resources kde-tade — vždy
> patria do správnej skupiny.

## Typy resources

Pár resources, na ktoré najčastejšie narazíš:

| Resource | Na čo slúži |
| --- | --- |
| **SQL Server / SQL Database** | Relačná databáza — perzistentné dáta appky (faktúry, používatelia…). SQL Server je „kontajner", v ňom je jedna alebo viac SQL Databases. |
| **Storage Account** | Úložisko na súbory a neštruktúrované dáta — blob (súbory/obrázky), queue, table. Lacné miesto na veľké veci, čo sa nehodia do SQL. |
| **Service Bus** | Spoľahlivé **posielanie správ** medzi službami (topics, queues, subscriptions). Služby spolu nehovoria priamo, ale cez správy. |
| **Key Vault** | **Trezor na tajomstvá** — heslá, connection stringy, API kľúče, certifikáty. Tajomstvá nepatria do kódu ani do gitu — patria sem. |
| **App Configuration** | Centrálne **nastavenia** appky + **Feature Manager** (feature flags). |

> 💡 Tip: Connection stringy a heslá **nikdy** nedávaj natvrdo do kódu ani do
> `appsettings.json` v gite. Patria do **Key Vault**, odkiaľ si ich appka načíta.

## Konfigurácia a feature flags

Nastavenia appky nemusia byť „zabetónované" v kóde — vieš ich meniť centrálne v
**Azure App Configuration**. Jeho súčasťou je **Feature Manager** — sekcia, kde
spravuješ **feature flags**.

**Feature flag (príznak funkcie)** je **prepínač, ktorým zapneš alebo vypneš
nejakú funkcionalitu bez nasadenia nového kódu**. Kód s novou funkciou už je
nasadený, ale „schovaný" za flagom — zapneš ho až keď chceš a komu chceš.

Načo to je:

- **Skrytie funkcie pred časťou používateľov** — funkciu zapneš najprv len pre
  pár firiem/testerov (beta), až potom pre všetkých.
- **Bezpečné nasadenie** — keď sa niečo pokazí, funkciu **vypneš flagom**, nemusíš
  rýchlo nasadzovať opravu.
- **Postupný rollout** — zapínaš po skupinách, nie všetkým naraz.

> 🏢 V KROSe: Feature flags máme v **`{environment}-settings-config`** v sekcii
> **Feature Manager** (`{environment}` je dané prostredie). Flag je zvyčajne
> **podmienený na `companyId`, e-mail, alebo ich kombináciu** — takže funkciu vidí
> len konkrétna firma alebo konkrétny používateľ.

**Naša konvencia pomenovania** flagu = **app/oblasť (area)** + **funkcia (feature)**:

```
   area:    MyDocuments
   feature: ReceivedProformaInvoice
   ────────────────────────────────────────────
   názov flagu:  MyDocumentsReceivedProformaInvoice
```

> ⚠️ Pozor: Aby flag reálne fungoval, musí na **backende** v enume `FeatureFlags`
> existovať hodnota s **úplne rovnakým názvom**, ako sa flag volá. Ak sa názvy
> nezhodujú (čo i len v jednom písmene), kód flag nenájde a funkcia sa nezapne.

```csharp
public enum FeatureFlags
{
    // názov hodnoty == názov flagu v Feature Manageri
    MyDocumentsReceivedProformaInvoice,
}

// použitie
if (await featureManager.IsEnabledAsync(
        nameof(FeatureFlags.MyDocumentsReceivedProformaInvoice)))
{
    // nová funkcia — beží len pre tých, čo majú flag zapnutý
}
```

## Subscription a limity

**Subscription (predplatné)** je **účet, pod ktorým resources bežia a fakturujú
sa**. Má **limity (quotas)** — koľko a akých resources v ňom môžeš mať.

> ⚠️ Pozor: Keď **prekročíš limit alebo rozpočet** subscription, Azure ti
> **nedovolí spraviť niektoré akcie** — napr. vytvoriť ďalší resource alebo
> škálovať existujúci. Preto sa resources nevyrábajú „len tak" a netreba nechávať
> bežať drahé veci, ktoré nepotrebuješ.

Nie každý resource stojí rovnako — rozlišuj:

| Lacné / takmer zadarmo | Platené / škálované |
| --- | --- |
| Free / Basic tier, Dev/Test | Standard / Premium tier |
| Consumption plan (platíš za použitie) | Dedikovaný, beží stále |
| Malé, na hranie a vývoj | Výkonné, s autoscale a SLA |
| Limity nízke, ale stačia na skúšanie | Drahšie, ale zvládnu produkčnú záťaž |

> 💡 Tip: Na učenie a skúšanie si vyber **najlacnejšiu (free/basic) úroveň**. Drahé,
> škálované tiery sú pre **produkciu**, kde treba výkon a dostupnosť — nie na
> pokusy. Keď si nie si istý, opýtaj sa mentora **predtým**, než niečo vytvoríš.

> 🏢 V KROSe: Pod ktorou subscription pracuješ, aké má limity a čo si môžeš/nemôžeš
> sám vytvárať, ti ukáže mentor. Keď ti nejaká akcia v Azure zlyhá s hláškou o
> kvóte/limite, nie je to nutne tvoja chyba v kóde — môže byť vyčerpaný limit.

Všetky resources našej firmy si pozrieš tu:
[All Resources v Azure Portali](https://portal.azure.com/#servicemenu/Microsoft_Azure_Resources/ResourceManager/browseAll).

> ⚠️ Pozor: Hneď na začiatku si over, či už máš **všetky potrebné oprávnenia
> (permissions)**, aby si tieto resources vôbec videl. Ak v zozname nič (alebo
> málo) nevidíš, pravdepodobne ti ešte chýba prístup — povedz mentorovi, nech ti
> ho doplní.
