# ARCHITECTURE.md — oversub-calc

## Overview

A single static page. There is no server, no build-time data, no persisted
state — every value lives in memory for the duration of the page load.

```
┌─────────────────────────────┐
│ index.html                   │
│  ┌─────────────────────────┐ │
│  │ DOM (inputs, badges,     │ │
│  │ ratio display, warning)  │ │
│  └───────────┬─────────────┘ │
│              │ input events   │
│              ▼                │
│  ┌─────────────────────────┐ │
│  │ inline <script type=     │ │
│  │ module">: value/locked   │ │
│  │ state, render()          │ │
│  └───────────┬─────────────┘ │
│              │ calls solve()  │
│              ▼                │
│  ┌─────────────────────────┐ │
│  │ src/solver.js:            │ │
│  │ solveState(value, locked) │ │
│  │ → { value, conflicts }    │ │
│  └─────────────────────────┘ │
└─────────────────────────────┘
```

## Data flow

1. User types into an editable input → `locked[k] = true`, `value[k] = parsed`.
2. `solve()` calls `solveState()`, which resets unlocked vars to `null` and
   propagates the product/sum rules to a fixed point.
3. `render()` writes the resulting values back into the DOM, applies
   `entered` / `derived` / empty badges, and shows any conflict message.

## Why this shape

The solver is deliberately DOM-free so it can be unit-tested without a browser
or jsdom (see [docs/adr/0001-vanilla-js-no-framework.md](adr/0001-vanilla-js-no-framework.md)
and [docs/adr/0002-extract-solver-for-testability.md](adr/0002-extract-solver-for-testability.md)).
