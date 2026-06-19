# Git

Git is a **version control system** — it remembers the history of your code's
changes, lets many people work at once, and lets you go back at any time. Here
you'll learn how Git actually *thinks*, not just a handful of commands by rote.

> 💡 Tip: When something confuses you, it helps to picture **where each command
> moves your changes** (working tree → staging → repo → remote). 90% of Git
> confusion disappears once you hold that picture in your head.

## Repository, working tree and .gitignore

A **repository (repo)** is a folder with a hidden `.git` subfolder where Git keeps
the **entire history** of the project. It's created by `git init` or
`git clone <url>`.

Inside a repo, distinguish the three "places" your changes can be:

```
 ┌──────────────┐   git add   ┌──────────────┐  git commit  ┌──────────────┐
 │ working tree │ ──────────▶ │ staging area │ ───────────▶ │  local repo  │
 │ (your files  │             │   (index)    │              │ (.git, hist.)│
 │  on disk)    │ ◀────────── │              │ ◀─────────── │              │
 └──────────────┘ git restore └──────────────┘  git reset   └──────────────┘
```

- **Working tree** = the files you actually see and edit on disk.
- **Staging area (index)** = the "holding area" where you pick what goes into the
  next commit (via `git add`).
- **Local repo** = the stored history (commits).

**`.gitignore`** is a file listing paths Git **should ignore** — it never adds or
tracks them. It's where things that **shouldn't** be versioned go: builds,
`bin/`, `obj/`, local configs with secrets, `node_modules`, logs.

```gitignore
bin/
obj/
*.user
appsettings.local.json
```

> ⚠️ Caution: `.gitignore` only ignores files Git **doesn't track yet**. If you
> already committed a file by mistake, adding it to `.gitignore` won't remove it —
> you must first stop tracking it (`git rm --cached <file>`).

## Branches and HEAD

A **branch** is just a **lightweight movable pointer to a commit**. It is not a
copy of the files! When you make a commit, the branch you're standing on moves to
the new commit. That's why branching in Git is cheap and fast.

```
        A───B───C        ← master
                 \
                  D───E   ← feature/my-branch  (HEAD)
```

**HEAD** is the pointer to **where you currently stand** — usually the tip of the
current branch. When you switch branches (`git switch`/`git checkout`), HEAD moves.

You can refer to past commits *relative* to HEAD:

| Notation | Meaning |
|---|---|
| `HEAD` | the current commit |
| `HEAD~1` (or `HEAD^`) | one commit back (the parent) |
| `HEAD~2` | two commits back |
| `HEAD~3` | three commits back |

> ⚠️ Caution: **Detached HEAD** happens when you `checkout` a specific commit
> directly (not a branch). HEAD then points to no branch — commits you make there
> are easily "lost". To continue, create a branch: `git switch -c new-branch`.

## Stage, commit, push, pull, fetch

This is the everyday cycle.

```
 (edits in files)
        │ git add <file>         ← "stage": pick what goes into the commit
        ▼
   staging area
        │ git commit -m "..."    ← writes a snapshot into your LOCAL history
        ▼
   local repo  ── git push ──▶  remote (origin)   ← sends commits to the server
   local repo ◀── git fetch ──  remote (origin)   ← updates origin/* (doesn't merge)
   local repo ◀── git pull ───  remote (origin)   ← fetch + merge origin/<your-branch>
```

- **`git add`** (stage) — selects specific changes into the staging area. Only
  what is staged gets committed.
- **`git commit`** — saves a snapshot of the staged changes into your **local**
  history (nothing goes to the server yet).
- **`git push`** — sends your local commits to the **remote** (origin).
- **`git fetch`** — *downloads* news from the remote and updates the
  **remote-tracking branches** (e.g. `origin/master`), but **doesn't change** your
  working tree or local branch — it just tells you what's new.
- **`git pull`** — `fetch` **+** `merge` in one. Note: the merge takes **exactly
  the remote branch that matches your current one** (its *upstream*, typically
  `origin/<your-branch>`) and merges it into yours. **It does not merge some
  arbitrary branch** — on `master` it merges `origin/master`, on `feature/x` it
  merges `origin/feature/x`.

> 💡 Tip: Which branch is your current branch's "upstream" you can see with
> `git branch -vv`. If you want changes from a **different** branch (e.g. a fresh
> `master`) into yours, that's not `pull` — that's an explicit `git merge
> origin/master` (or a rebase).

> 💡 Tip: `commit` is local — until you `push`, your colleagues don't see your
> changes. And `fetch` is a "safe preview": you look at what's new without merging
> anything into your work in progress.

## Merge vs. rebase

Both combine work from two branches, but **the resulting history looks different**.

**Merge** creates a new *merge commit* that joins the two branches. The history
forks and rejoins — you can see what was done in parallel.

```
   A─B─C────────M   ← master   (M = merge commit)
       \       /
        D─────E     ← feature
```

**Rebase** "replays" your commits **on top of** the other branch's tip — rewriting
them as new commits. The history is **linear**, as if you'd worked on the current
master from the start.

```
   A─B─C─D'─E'   ← feature after rebase (D', E' are rewritten commits)
```

| | Merge | Rebase |
|---|---|---|
| History | forking, with a merge commit | linear, rewritten |
| Original commits | preserved | replaced by new ones (different IDs) |
| When | merging into a shared branch | tidying your own branch before a PR |

> ⚠️ Caution: **Don't rebase a branch someone else is already using / that's on
> the remote with others working on it.** Rebase rewrites history (changes commit
> IDs) and breaks their copy. Rebase is safe on **your own, unshared** branch.

## Reset, restore, stash, cherry-pick

A toolkit for "fixing" and moving changes around.

**`git reset`** moves the branch (and HEAD) to another commit. It has three modes
by what it touches:

| Mode | HEAD | staging | working tree |
|---|---|---|---|
| `--soft` | moves | keeps | keeps |
| `--mixed` (default) | moves | clears | keeps |
| `--hard` | moves | clears | **overwrites!** |

```
# Undo the last commit but keep the changes (to edit and re-commit):
git reset --soft HEAD~1
```

> ⚠️ Caution: `git reset --hard` **discards uncommitted changes in the working
> tree** — they're gone for good. Use it deliberately.

**`git restore`** brings back specific files:

```
git restore <file>             # discard edits in the file (back to last version)
git restore --staged <file>    # only "unstage" (the change stays in the working tree)
```

**`git stash`** temporarily **sets aside** your work in progress and cleans the
working tree — handy when you must quickly switch branches but don't want to
commit yet.

```
git stash          # set changes aside
git switch master  # do what you need
git stash pop      # bring the set-aside changes back
```

**`git cherry-pick <commit>`** takes **one specific commit** from another branch
and applies it to yours (creates a copy of it here). Handy when you need exactly
one fix, not the whole branch.

```
        A─B─C        ← master
             \
              D─X─E  ← feature   (I want only commit X)

git switch master
git cherry-pick X   →   A─B─C─X'  ← master (X' is a copy of X)
```

## Git at KROS (workflow, Production, worktrees)

Here's what the everyday flow looks like for us:

```
  master  ──┬───────────────────────────────▶
            │ 1. you derive a branch from the current master
            ▼
     feature/my-branch  (you work locally, you commit)
            │ 2. git push + open a Pull Request (PR)
            ▼
        [ PR review ]  3. a colleague / AI review approves
            │
            ▼ 4. merge back into master
  master  ◀─┘
```

1. **You derive a branch from the current `master`** and work on it **locally**.
2. When done, you `push` and open a **Pull Request (PR)**.
3. After the PR is **approved**, your branch is **merged into `master`**.

**The Production branch.** When people say the "**branches got separated**", it
means a **copy of the current `master`** was created, named **`Production`**. From
then on `master` lives on (new features), while `Production` holds what's "out there".

```
  master ──A─B─C─D─E──▶   (development continues)
                \
   Production ───C        (copy from the moment of separation)
```

- A fix can reach `Production` **directly via `cherry-pick`** of a specific commit
  — **without PR approval**. That's how you get a hotfix "out" quickly.
- **Caution — a cherry-pick alone deploys nothing!** Changes reach production
  **only when Production is re-deployed**. That is **not automatic** — it must be
  **triggered by the DevOps master**.

> 🏢 At KROS: The exact branch names, who the "DevOps master" is, and how PR review
> works (including AI review) your mentor will show you. The workflow above is the
> general frame.

**Worktrees and working with an AI agent.** `git worktree` lets you have **several
working trees from one repo at once** — each on a different branch, in a different
folder. No need to switch branches or stash.

```
git worktree add ../buddy-feature-A feature/A
git worktree add ../buddy-feature-B feature/B
```

> 💡 Tip: When working with an AI agent (e.g. **Claude Code**), worktrees are very
> useful — the agent can work on **several features in parallel**, each in its own
> worktree, without stepping on each other's files or branch.
