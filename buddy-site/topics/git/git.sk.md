# Git

Git je **systém na správu verzií** — pamätá si históriu zmien tvojho kódu, umožní
viacerým ľuďom pracovať naraz a kedykoľvek sa vrátiť späť. Tu sa naučíš, ako Git
naozaj *premýšľa*, nielen zopár príkazov naspamäť.

> 💡 Tip: Keď niečomu nerozumieš, pomôže predstaviť si **kam ktorý príkaz
> presúva zmeny** (working tree → staging → repo → remote). 90 % zmätku
> v Gite zmizne, keď máš v hlave tento obrázok.

## Repozitár, working tree a .gitignore

**Repozitár (repo)** je priečinok so skrytým podpriečinkom `.git`, kde Git drží
**celú históriu** projektu. Vznikne príkazom `git init` alebo `git clone <url>`.

V repe rozlišuj tri „miesta", kde môžu byť tvoje zmeny:

```
 ┌──────────────┐   git add   ┌──────────────┐  git commit  ┌──────────────┐
 │ working tree │ ──────────▶ │ staging area │ ───────────▶ │  local repo  │
 │ (tvoje súbory│             │   (index)    │              │  (.git, hist.)│
 │  na disku)   │ ◀────────── │              │ ◀─────────── │              │
 └──────────────┘ git restore └──────────────┘  git reset   └──────────────┘
```

- **Working tree** = súbory, ktoré reálne vidíš a upravuješ na disku.
- **Staging area (index)** = „odkladisko", kam vyberáš, čo pôjde do najbližšieho
  commitu (cez `git add`).
- **Local repo** = uložená história (commity).

**`.gitignore`** je súbor so zoznamom ciest, ktoré Git **má ignorovať** — nikdy
ich nepridá ani nesleduje. Patrí tam to, čo sa **nemá** verzovať: buildy,
`bin/`, `obj/`, lokálne configy s heslami, `node_modules`, logy.

```gitignore
bin/
obj/
*.user
appsettings.local.json
```

> ⚠️ Pozor: `.gitignore` ignoruje len súbory, ktoré Git **ešte nesleduje**. Ak
> si súbor omylom už commitol, pridanie do `.gitignore` ho neodstráni — musíš ho
> najprv prestať sledovať (`git rm --cached <súbor>`).

## Vetvy (branches) a HEAD

**Vetva (branch)** je len **odľahčený pohyblivý ukazovateľ na commit**. Nie je to
kópia súborov! Keď spravíš commit, vetva, na ktorej stojíš, sa posunie na nový
commit. Preto je vetvenie v Gite lacné a rýchle.

```
        A───B───C        ← master
                 \
                  D───E   ← feature/moja-vetva  (HEAD)
```

**HEAD** je ukazovateľ na to, **kde práve stojíš** — zvyčajne na špičke aktuálnej
vetvy. Keď prepneš vetvu (`git switch`/`git checkout`), HEAD sa presunie.

Na commity v minulosti sa vieš odkázať *relatívne* voči HEAD:

| Zápis | Význam |
|---|---|
| `HEAD` | aktuálny commit |
| `HEAD~1` (alebo `HEAD^`) | o jeden commit späť (rodič) |
| `HEAD~2` | o dva commity späť |
| `HEAD~3` | o tri commity späť |

> ⚠️ Pozor: **Detached HEAD** nastane, keď `checkout`-neš priamo konkrétny commit
> (nie vetvu). HEAD vtedy neukazuje na žiadnu vetvu — commity, ktoré tam spravíš,
> sa ľahko „stratia". Ak chceš pokračovať, založ si vetvu: `git switch -c nova-vetva`.

## Stage, commit, push, pull, fetch

Toto je každodenný kolobeh.

```
 (úpravy v súboroch)
        │ git add <súbor>        ← „stage": vyber, čo pôjde do commitu
        ▼
   staging area
        │ git commit -m "..."    ← zapíše snapshot do LOKÁLNEJ histórie
        ▼
   local repo  ── git push ──▶  remote (origin)   ← pošle commity na server
   local repo ◀── git fetch ──  remote (origin)   ← aktualizuje origin/* (nemerge-ne)
   local repo ◀── git pull ───  remote (origin)   ← fetch + merge origin/<tvoja-vetva>
```

- **`git add`** (stage) — vyberie konkrétne zmeny do staging area. Commitne sa
  len to, čo je „stage-nuté".
- **`git commit`** — uloží snapshot stage-nutých zmien do **lokálnej** histórie
  (na server zatiaľ nič nejde).
- **`git push`** — pošle tvoje lokálne commity na **remote** (origin).
- **`git fetch`** — *stiahne* novinky z remote a aktualizuje **remote-tracking
  vetvy** (napr. `origin/master`), ale **nezmení** tvoj working tree ani lokálnu
  vetvu — len ti dá vedieť, čo je nové.
- **`git pull`** — `fetch` **+** `merge` v jednom. Pozor: merge zoberie **práve tú
  remote vetvu, ktorá zodpovedá tvojej aktuálnej** (jej *upstream*, typicky
  `origin/<tvoja-vetva>`) a zlúči ju do tej tvojej. **Nezlučuje žiadnu náhodnú
  vetvu** — na `master` zlúči `origin/master`, na `feature/x` zlúči `origin/feature/x`.

> 💡 Tip: Ktorá vetva je „upstream" tvojej aktuálnej, zistíš cez `git branch -vv`.
> Ak chceš do svojej vetvy dostať zmeny z **inej** vetvy (napr. čerstvý `master`),
> to nie je `pull` — to je explicitný `git merge origin/master` (alebo rebase).

> 💡 Tip: `commit` je lokálny — kým nespravíš `push`, kolegovia tvoje zmeny
> nevidia. A `fetch` je „bezpečný náhľad": pozrieš, čo je nové, bez toho, aby si
> si niečo zlúčil do rozrobenej práce.

## Merge vs. rebase

Oba spôsoby spoja prácu z dvoch vetiev, ale **inak vyzerá výsledná história**.

**Merge** vytvorí nový *merge commit*, ktorý spojí obe vetvy. História sa vetví
a zase spája — vidno, čo vzniklo paralelne.

```
   A─B─C────────M   ← master   (M = merge commit)
       \       /
        D─────E     ← feature
```

**Rebase** „prenesie" tvoje commity **nad** špičku druhej vetvy — prepíše ich ako
nové commity. História je **lineárna**, akoby si robil od začiatku na aktuálnom
master.

```
   A─B─C─D'─E'   ← feature po rebase (D', E' sú prepísané commity)
```

| | Merge | Rebase |
|---|---|---|
| História | vetviaca sa, s merge commitom | lineárna, prepísaná |
| Pôvodné commity | zachované | nahradené novými (iné ID) |
| Kedy | spájanie do zdieľanej vetvy | upratanie vlastnej vetvy pred PR |

> ⚠️ Pozor: **Nerebase-uj vetvu, ktorú už niekto iný používa / je na remote a
> pracujú na nej ďalší.** Rebase prepisuje históriu (mení ID commitov) a kolegom
> rozbije ich kópiu. Rebase je bezpečný na **tvojej vlastnej, nezdieľanej** vetve.

## Reset, restore, stash, cherry-pick

Sada nástrojov na „opravu" a presúvanie zmien.

**`git reset`** posúva vetvu (a HEAD) na iný commit. Má tri režimy podľa toho,
čoho sa dotkne:

| Režim | HEAD | staging | working tree |
|---|---|---|---|
| `--soft` | posunie | nechá | nechá |
| `--mixed` (default) | posunie | vyčistí | nechá |
| `--hard` | posunie | vyčistí | **prepíše!** |

```
# Vrátiť posledný commit, ale ponechať zmeny rozrobené (na úpravu a nový commit):
git reset --soft HEAD~1
```

> ⚠️ Pozor: `git reset --hard` **zahodí neuložené zmeny v working tree** — sú
> nenávratne preč. Používaj ho s rozvahou.

**`git restore`** vracia konkrétne súbory:

```
git restore <súbor>             # zahodí úpravy v súbore (späť na poslednú verziu)
git restore --staged <súbor>    # iba „odstage-uje" (zmena ostane vo working tree)
```

**`git stash`** dočasne **odloží** rozrobené zmeny nabok a vyčistí working tree —
hodí sa, keď musíš rýchlo prepnúť vetvu, ale ešte nechceš commitnúť.

```
git stash          # odlož zmeny nabok
git switch master  # sprav, čo treba
git stash pop      # vráť odložené zmeny späť
```

**`git cherry-pick <commit>`** vezme **jeden konkrétny commit** z inej vetvy a
aplikuje ho na tú tvoju (vytvorí jeho kópiu sem). Hodí sa, keď potrebuješ práve
jednu opravu, nie celú vetvu.

```
        A─B─C        ← master
             \
              D─X─E  ← feature   (chcem len commit X)

git switch master
git cherry-pick X   →   A─B─C─X'  ← master (X' je kópia X)
```

## Git v KROSe (workflow, Production, worktrees)

Takto u nás vyzerá bežný tok práce:

```
  master  ──┬───────────────────────────────▶
            │ 1. odvodíš vetvu z aktuálneho master
            ▼
     feature/moja-vetva  (pracuješ lokálne, commituješ)
            │ 2. git push + vytvoríš Pull Request (PR)
            ▼
        [ PR review ]  3. kolega/AI review schváli
            │
            ▼ 4. merge späť do master
  master  ◀─┘
```

1. **Odvodíš si vetvu z aktuálneho `master`** a pracuješ na nej **lokálne**.
2. Keď si hotový, spravíš `push` a založíš **Pull Request (PR)**.
3. Po **schválení** PR sa tvoja vetva **zlúči (merge) do `master`**.

**Production vetva.** Keď sa povie, že sa „**vetvy oddelili**", znamená to, že sa
vytvorila **kópia aktuálneho `master`** s názvom **`Production`**. Od tej chvíle
`master` žije ďalej (nové featúry), ale `Production` drží to, čo je „vonku".

```
  master ──A─B─C─D─E──▶   (vývoj pokračuje)
                \
   Production ───C        (kópia z času oddelenia)
```

- Na `Production` sa dá dostať oprava **priamo cez `cherry-pick`** konkrétneho
  commitu — **bez schvaľovania PR**. Tak rýchlo dostaneš hotfix „von".
- **Pozor — samotný cherry-pick ešte nič nenasadí!** Zmeny sa do produkcie
  dostanú, **len keď sa Production znova nasadí (re-deploy)**. To **nie je
  automatické** — musí to **spustiť DevOps master**.

> 🏢 V KROSe: Presné názvy vetiev, kto je „DevOps master" a ako prebieha PR review
> (vrátane AI review) ti ukáže mentor. Workflow vyššie je všeobecný rámec.

**Worktrees a práca s AI agentom.** `git worktree` ti umožní mať **viac
pracovných stromov z jedného repa naraz** — každý na inej vetve, v inom
priečinku. Nemusíš prepínať vetvy ani stashovať.

```
git worktree add ../buddy-feature-A feature/A
git worktree add ../buddy-feature-B feature/B
```

> 💡 Tip: Pri práci s AI agentom (napr. **Claude Code**) sú worktrees veľmi
> užitočné — agent môže bežať na **viacerých featúrach paralelne**, každá vo
> vlastnom worktree, bez toho, aby si si navzájom „šliapali" po súboroch či vetve.
