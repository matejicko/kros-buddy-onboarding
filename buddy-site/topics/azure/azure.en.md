# Azure

**Azure** is **Microsoft's cloud system** — instead of running our apps and
databases on our own servers in the office, we **rent them in the cloud**. In
Azure you can "click together" various **resources** — a database, storage, a
message queue, a vault for secrets… — and Azure runs them for you.

> 💡 Tip: Think of Azure as a big datacenter for rent. You say "I want a database
> and some storage", Azure provisions them, and you pay for what you use.

## What is Azure and resources

A **resource** is **one concrete thing you run in Azure** — e.g. one database,
one storage account, one Key Vault. Each resource has a **type**, a **name**, a
**region** (where it physically runs), and a **pricing level (SKU/tier)**.

```
   Azure (cloud)
    ├─ SQL Database        ← application data
    ├─ Storage Account     ← files, images, blob data
    ├─ Service Bus         ← messages between services
    ├─ Key Vault           ← secrets (passwords, keys, certificates)
    └─ App Configuration   ← settings + feature flags
```

Everything an app needs "around itself" (data, files, communication, secrets,
settings) is some **resource** in Azure that you create and configure.

## Resource group

A **resource group** is **a container that logically groups resources that
belong together** — typically everything for one app or one project. It's not a
physical place, it's an **organizational and management wrapper**.

```
   Subscription  (the account — billing, limits)
    └─ Resource group: rg-invoicing
        ├─ App Service        (the app runs here)
        ├─ SQL Database       (data)
        ├─ Service Bus        (messages)
        ├─ Storage Account    (files)
        └─ Key Vault          (secrets)
```

Why you want them nicely grouped:

- **Shared lifecycle** — you can deploy resources in a group together and delete
  them together (delete the group → all resources in it are deleted).
- **Cost overview** — you see what the whole app costs in one place.
- **Access (permissions)** — access can be granted at the level of the whole group.

> 🏢 At KROS: Which resource groups we have, how they're named, and which one your
> project belongs to, your mentor will show you. You don't just "spawn" resources
> anywhere — they always belong to the right group.

## Resource types

A few resources you'll bump into most often:

| Resource | What it's for |
| --- | --- |
| **SQL Server / SQL Database** | Relational database — the app's persistent data (invoices, users…). The SQL Server is a "container" that holds one or more SQL Databases. |
| **Storage Account** | Storage for files and unstructured data — blob (files/images), queue, table. A cheap place for big things that don't fit in SQL. |
| **Service Bus** | Reliable **messaging** between services (topics, queues, subscriptions). Services don't talk directly — they talk via messages. |
| **Key Vault** | A **vault for secrets** — passwords, connection strings, API keys, certificates. Secrets don't belong in code or in git — they belong here. |
| **App Configuration** | Centralized app **settings** + **Feature Manager** (feature flags). |

> 💡 Tip: **Never** hardcode connection strings and passwords into code or into a
> committed `appsettings.json`. They belong in **Key Vault**, from which the app
> loads them.

## Configuration and feature flags

App settings don't have to be "set in concrete" in code — you can change them
centrally in **Azure App Configuration**. Part of it is the **Feature Manager** —
the section where you manage **feature flags**.

A **feature flag** is **a switch that turns a piece of functionality on or off
without deploying new code**. The code with the new feature is already deployed,
but "hidden" behind the flag — you turn it on when you want, for whom you want.

What it's good for:

- **Hiding a feature from a subset of users** — you turn a feature on first for
  just a few companies/testers (beta), and only later for everyone.
- **Safe deployment** — if something breaks, you **switch the feature off** with
  the flag; you don't have to rush out a fix.
- **Gradual rollout** — you enable it group by group, not for everyone at once.

> 🏢 At KROS: We keep feature flags in **`{environment}-settings-config`**, in the
> **Feature Manager** section (`{environment}` is the given environment). A flag is
> usually **conditioned on `companyId`, e-mail, or a combination** — so only a
> specific company or a specific user sees the feature.

**Our naming convention** for a flag = **app/area** + **feature**:

```
   area:    MyDocuments
   feature: ReceivedProformaInvoice
   ────────────────────────────────────────────
   flag name:  MyDocumentsReceivedProformaInvoice
```

> ⚠️ Caution: For the flag to actually work, the **backend** `FeatureFlags` enum
> must have a value with the **exact same name** as the flag. If the names don't
> match (even by a single letter), the code won't find the flag and the feature
> won't turn on.

```csharp
public enum FeatureFlags
{
    // the value name == the flag name in Feature Manager
    MyDocumentsReceivedProformaInvoice,
}

// usage
if (await featureManager.IsEnabledAsync(
        nameof(FeatureFlags.MyDocumentsReceivedProformaInvoice)))
{
    // new feature — runs only for those who have the flag turned on
}
```

## Subscription and limits

A **subscription** is **the account resources run and get billed under**. It has
**limits (quotas)** — how many and what kinds of resources you can have in it.

> ⚠️ Caution: When you **exceed a subscription's limit or budget**, Azure
> **won't let you do certain actions** — e.g. create another resource or scale an
> existing one. That's why resources aren't created "just because", and you
> shouldn't leave expensive things running that you don't need.

Not every resource costs the same — tell apart:

| Cheap / nearly free | Paid / scaled |
| --- | --- |
| Free / Basic tier, Dev/Test | Standard / Premium tier |
| Consumption plan (pay per use) | Dedicated, always running |
| Small, for playing and dev | Powerful, with autoscale and SLA |
| Low limits, but fine for trying | Pricier, but handle production load |

> 💡 Tip: For learning and experimenting, pick the **cheapest (free/basic) tier**.
> Expensive, scaled tiers are for **production**, where you need performance and
> availability — not for experiments. If you're unsure, ask your mentor **before**
> you create anything.

> 🏢 At KROS: Which subscription you work under, what limits it has, and what you
> can/can't create yourself, your mentor will show you. When some Azure action
> fails with a quota/limit message, it isn't necessarily a bug in your code — the
> limit may simply be used up.

You can see all of our company's resources here:
[All Resources in the Azure Portal](https://portal.azure.com/#servicemenu/Microsoft_Azure_Resources/ResourceManager/browseAll).

> ⚠️ Caution: Right at the start, check whether you already have **all the
> necessary permissions** to see these resources at all. If you see nothing (or
> very little) in the list, you're probably still missing access — tell your
> mentor so they can grant it.
