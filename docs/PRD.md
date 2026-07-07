# PRD.md — oversub-calc

## Problem

Figuring out a switch's oversubscription ratio (or any one of the six related
numbers) usually means solving the same handful of equations by hand:
`bandwidth = speed × count`, `downlinks + uplinks = total ports`,
`downlink bandwidth = uplink bandwidth × ratio`. Depending on what's known in a
given scenario (a datasheet, a design constraint, a customer ask), a different
subset of variables is the input and a different subset is what you're solving
for.

## Goals

- Let the user type any subset of the six inputs (port speeds, port counts,
  total ports, ratio) and see the rest derived automatically.
- Clearly distinguish values the user typed ("entered") from values the tool
  derived, and let un-typing a value hand control back to the solver.
- Flag over-determined/contradictory input immediately, with a specific
  message naming which rule is violated.
- Zero setup for the end user: a single HTML file, works offline, no login.

## Non-goals

- No persistence — nothing is saved between page loads (no accounts, no
  Google Drive sync, no localStorage as of now).
- No support for asymmetric/multi-tier topologies (e.g. more than one uplink
  speed class) — the model assumes exactly one downlink class and one uplink
  class per switch.
- No mobile-app or PWA packaging — it's a page you open in a browser.

## Success criteria

- All six editable variables can be derived from any valid combination of the
  other four (per the product/sum rules) — verified by `src/solver.test.js`.
- Conflicting input produces a visible, specific warning rather than a wrong
  silent answer.
