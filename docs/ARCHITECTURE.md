# ARCHITECTURE.md — oversub-calc

## Overview

Two independent front ends over the same domain logic. Neither has a server,
build-time data, or persisted state — every value lives in memory for the
duration of the page load (browser) or process (desktop).

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│ index.html (browser)         │        │ python/app.py (desktop)        │
│  ┌─────────────────────────┐ │        │  ┌───────────────────────────┐ │
│  │ DOM (inputs, badges,     │ │        │  │ tkinter widgets (Entry,    │ │
│  │ ratio display, warning)  │ │        │  │ Label, two Notebook tabs)  │ │
│  └───────────┬─────────────┘ │        │  └─────────────┬─────────────┘ │
│              │ input events   │        │                │ StringVar     │
│              ▼                │        │                │ trace / write │
│  ┌─────────────────────────┐ │        │                ▼               │
│  │ inline <script type=     │ │        │  ┌───────────────────────────┐ │
│  │ module">: value/locked   │ │        │  │ App / AllocatorApp:        │ │
│  │ state, render()          │ │        │  │ value/locked state,        │ │
│  └───────────┬─────────────┘ │        │  │ render()                   │ │
│              │ calls solve()  │        │  └─────────────┬─────────────┘ │
│              ▼                │        │                │ calls solve()  │
│  ┌─────────────────────────┐ │        │                ▼               │
│  │ src/solver.js:            │ │        │  ┌───────────────────────────┐ │
│  │ solveState / optimizeCounts│        │  │ python/solver.py:           │ │
│  └─────────────────────────┘ │        │  │ solve_state / optimize_counts│
└─────────────────────────────┘        │  └───────────────────────────┘ │
                                         └──────────────────────────────┘
```

`python/solver.py` is a hand-ported mirror of `src/solver.js` — same rule
tables, same variable names, no shared source of truth (see
[docs/adr/0003-python-tkinter-desktop-version.md](adr/0003-python-tkinter-desktop-version.md)).

## Data flow (browser)

1. User types into an editable input → `locked[k] = true`, `value[k] = parsed`.
2. `solve()` calls `solveState()`, which resets unlocked vars to `null` and
   propagates the product/sum rules to a fixed point.
3. `render()` writes the resulting values back into the DOM, applies
   `entered` / `derived` / empty badges, and shows any conflict message.
4. The "Optimal Port Allocator" card runs independently: on every input event
   across its four fields, it calls `optimizeCounts()` directly (no
   locked/derived state — it's a pure forward calculation) and writes `Uc`/
   `Dc`/actual ratio into its own disabled fields.

## Data flow (desktop)

1. `App` (free-form solver tab) mirrors the browser flow: a `StringVar` per
   field, `trace_add('write', ...)` on editable fields calls `solve()` →
   `solve_state()` → `render()`, which updates every `StringVar` and each
   field's entered/derived status label.
2. `AllocatorApp` (optimal allocator tab) mirrors the browser's allocator
   card: `trace_add('write', ...)` on its four inputs calls `optimize_counts()`
   directly and writes the result into disabled `Entry` widgets.
3. Both tabs share no state — they're separate `ttk.Frame`s under one
   `ttk.Notebook`.

## Why this shape

The solver is deliberately DOM/widget-free so it can be unit-tested without a
browser, jsdom, or a display server (see
[docs/adr/0001-vanilla-js-no-framework.md](adr/0001-vanilla-js-no-framework.md),
[docs/adr/0002-extract-solver-for-testability.md](adr/0002-extract-solver-for-testability.md),
and [docs/adr/0003-python-tkinter-desktop-version.md](adr/0003-python-tkinter-desktop-version.md)).
