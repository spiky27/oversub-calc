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
- Given a total port count and a target oversub ratio, recommend the integer
  uplink/downlink split that maximizes downlink count without letting the
  actual ratio exceed the target — a separate, forward-only calculation from
  the six-variable solver above (see "Optimal port allocator" in
  `docs/SKILL.md`).
- Zero setup for the end user: a single HTML file, works offline, no login —
  and, for environments where installing anything from the npm registry is
  restricted, a stdlib-only Python/tkinter desktop alternative with no
  dependencies at all (`python/`).

## Non-goals

- No persistence — nothing is saved between page loads (no accounts, no
  Google Drive sync, no localStorage as of now).
- No support for asymmetric/multi-tier topologies (e.g. more than one uplink
  speed class) — the model assumes exactly one downlink class and one uplink
  class per switch.
- No mobile-app or PWA packaging — it's a page you open in a browser (or a
  desktop window, for the Python version).
- The Python desktop version is not a packaged/installable app (no PyInstaller
  bundle, no .app) — it's a script you run with `python3 python/app.py`.

## Success criteria

- All six editable variables can be derived from any valid combination of the
  other four (per the product/sum rules) — verified by `src/solver.test.js`
  and `python/test_solver.py`.
- Conflicting input produces a visible, specific warning rather than a wrong
  silent answer.
- The optimal allocator never recommends a split whose actual oversub ratio
  exceeds the user's target ratio — verified by `src/solver.test.js` and
  `python/test_solver.py` against a hand-validated table (N=32, over_sub
  1–8, 400G uplinks, 100G downlinks).
- The Python version's `solve_state`/`optimize_counts` produce identical
  results to the JS version's `solveState`/`optimizeCounts` for the same
  inputs.
