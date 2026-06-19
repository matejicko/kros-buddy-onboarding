# Client-Server

Most of what we build is **two sides talking to each other**: the client asks for
something, the server answers. Once you understand this conversation — who sends
what, where, and with what result — you can debug almost anything.

> 💡 Tip: The best way to *see it with your own eyes* is the **browser inspector**
> (a section below). Open it and watch exactly what your app is sending.

## Client and server

The **client** is the one who **starts the communication** and asks for something:
a browser, a mobile app, Postman, or even another service. The **server** is the
one who **listens, processes the request, and replies** — for us, typically an
ASP.NET service.

```
   CLIENT                                      SERVER
  (browser,           ──── request ─────────▶    (ASP.NET
   app, Postman,                                   service)
   another service)   ◀─── response ─────────
```

They talk over **HTTP**. We'll show the request here in the **`.http` file format**
— the way you write it in TeaPie / REST clients (see the **Libraries** topic). In
this format a **blank line separates the headers from the body**:

```
  POST /api/invoices                ← method (what I'm doing) + endpoint (where)
  Authorization: Bearer eyJ...      ← headers: meta-info, token...
  Content-Type: application/json
                                    ← blank line = end of headers, body begins
  { "amount": 100 }                 ← body: the data I'm sending
```

> 💡 Tip: That blank line isn't some "magic" HTTP requirement — it's how the
> `.http` format (and raw HTTP) separates headers from body. In Postman or in code
> you don't see it, because you type the body into a separate field/parameter.

And every **response** returns:

```
  201 Created                       ← status code (how it went)
  Content-Type: application/json
  { "id": 42 }                      ← body: the data I get back
```

- The **method** says *what* I want: `GET` (read), `POST` (create), `PUT`/`PATCH`
  (update), `DELETE` (delete).
- **Key point:** the client **always starts**, the server only replies. (The
  exception — when the server wants to "push" on its own — is handled by
  **SignalR**, below.)

> 💡 Tip: The server "remembers" nothing about the client between requests — HTTP
> is *stateless*. That's why each request carries e.g. a token in the
> `Authorization` header, so the server knows who's asking.

## Endpoints

An **endpoint** is a specific **address (URL) + method** the server exposes that
does *one thing*.

```
  GET    /api/invoices            → return the list of invoices
  GET    /api/invoices/42         → return invoice with id 42
  POST   /api/invoices            → create a new invoice
  DELETE /api/invoices/42         → delete invoice 42
```

Notice the same path `/api/invoices` does **something different depending on the
method** — an endpoint is *path + method together*. This style (resources + HTTP
methods) is called **REST**.

> 🏢 At KROS: Requests from the client often don't go straight to a specific
> service, but through an **API Gateway** — a single entry point that routes the
> request to the right microservice (and handles e.g. authentication,
> rate-limiting). See the **Architecture** topic. The concrete gateways and routes
> your mentor will show you.

## Status codes

The status code in the response says **how it went**. They split into groups by
the first digit — this is the most important thing to remember:

| Group | Meaning | "Whose fault?" |
|---|---|---|
| **2xx** | success | — |
| **3xx** | redirect | — |
| **4xx** | error on the **client** side (bad request) | yours / the client's |
| **5xx** | error on the **server** side | the server's |

The most common specific codes:

| Code | Name | When |
|---|---|---|
| **200** | OK | all good, here's the data |
| **201** | Created | a new resource was created (after POST) |
| **204** | No Content | OK, but nothing is returned (e.g. after DELETE) |
| **400** | Bad Request | malformed request (missing/wrong data) |
| **401** | Unauthorized | you're not logged in (missing/invalid token) |
| **403** | Forbidden | you're logged in, but **not allowed** to do this |
| **404** | Not Found | the resource/endpoint doesn't exist |
| **409** | Conflict | a state conflict (e.g. a duplicate) |
| **429** | Too Many Requests | too many requests, slow down |
| **500** | Internal Server Error | the server crashed / unhandled exception |
| **502** | Bad Gateway | a gateway/proxy got an invalid response from the service behind it |
| **503** | Service Unavailable | the service is temporarily down (overload, maintenance) |
| **504** | Gateway Timeout | the gateway didn't get a response from the service in time |

> ⚠️ Caution: **401 vs. 403** is often confused. **401** = *I don't know who you
> are* (not logged in). **403** = *I know who you are, but you can't do this*
> (missing permission). Rule of thumb: **4xx → check your request**, **5xx → the
> problem is on the server**.

## Browser inspector

The browser's developer tools (open with **F12**) are your best friend for
debugging client–server communication. The two tabs you'll use most:

- **Network** — you see **every HTTP request** the page makes: its URL, method,
  **status code**, how long it took, the sent headers/body, and the received
  response. When something "doesn't work", this is the first place to look.
- **Elements** — the page's current HTML/DOM and its CSS styles; you can even edit
  them live (locally only, just to try things out).

```
  F12 → Network → click a request:
     Status: 403 Forbidden        ← you immediately see what happened
     Request URL: /api/invoices/42
     Headers / Payload / Response  ← what you sent and what came back
```

> 💡 Tip: When the frontend reports an error, open **Network** and check the status
> code of the specific request. `401`? A login problem. `500`? Check the server
> logs. `404`? Wrong URL/endpoint. It saves you hours of guessing.

## SignalR

In ordinary HTTP the **client always starts** — the server sends nothing on its
own. That's a problem when you want **real-time** updates (notifications, live
data), because the client would have to keep asking "is there anything new yet?".

**SignalR** solves it: it creates a **persistent connection** (over **WebSocket**,
with fallbacks to other techniques) and the server **can send messages to the
client itself**, the moment something happens.

```
  Plain HTTP:   client ── request ──▶ server     (the client must ask)
                client ◀─ response ──  server

  SignalR:      client ◀════ push ═══ server     (the server pushes itself, real-time)
                └─ persistent connection (WebSocket) ─┘
```

It works through so-called **hubs**: the client connects and "subscribes", then
the server calls methods on the connected clients (e.g. "a new invoice was added"
→ it pops into everyone's list immediately).

> 💡 Tip: Use SignalR when data should arrive **on its own and instantly** (chat,
> live notifications, progress of a long operation). For ordinary "click and load",
> plain HTTP is enough.

## WebAssembly

**WebAssembly (WASM)** is a binary format that runs **directly in the browser** at
near-native speed. Important for us: it lets us run **C#/.NET code directly in the
browser** — that's **Blazor WebAssembly**.

```
  Classic web app:   C#/.NET runs on the SERVER → the browser gets HTML
  Blazor WASM:       C#/.NET (via WebAssembly) runs directly in the BROWSER
```

With Blazor WASM the .NET runtime and your app are downloaded into the browser and
run **on the client side** — so you write the logic in C#, not JavaScript.

> 🏢 At KROS: we use WebAssembly mainly for **calculations** — for numeric
> operations we don't want to rely on JavaScript (its arithmetic can be tricky),
> but compute directly in **C#/.NET**, just like on the server. That way a
> calculation gives the same result in the browser as on the backend.

| | Server-side (usual) | Blazor WebAssembly |
|---|---|---|
| Where logic runs | on the server | in the browser (client) |
| Language in the browser | JavaScript | C#/.NET via WASM |
| First load | fast | slower (downloads the runtime) |
| Works offline | no | partially yes |

> 💡 Tip: Don't confuse **WebAssembly** (the technology that lets you run C# in the
> browser) with **SignalR** (real-time server→client communication). They're two
> different things that can even be combined.
