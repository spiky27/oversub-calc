# SKILL.md — oversub-calc technical reference

## Stack

Two parallel implementations of the same domain logic, kept in sync by hand:

- **Browser (default)**: static HTML/CSS/JS. No framework, no backend, no
  persisted data. Vite as the dev server / build tool (`npm run dev`,
  `npm run build`). ESLint (flat config, `eslint-plugin-html`) + Prettier for
  lint/format. Vitest for unit tests against the solver logic.
- **Desktop (`python/`)**: stdlib-only Python + tkinter, no pip/npm
  dependencies at all. Added so the calculator works in environments where
  installing from the npm registry is restricted (see
  [docs/adr/0003-python-tkinter-desktop-version.md](adr/0003-python-tkinter-desktop-version.md)).
  `unittest` for tests. See [python/README.md](../python/README.md) for setup
  (including a macOS system-Python Tk 8.5 gotcha).

## File layout

```
index.html              UI markup, styling, and DOM-binding script (imports solver.js)
src/solver.js            Pure constraint-solver + allocator: no DOM, fully unit-testable
src/solver.test.js        Vitest unit tests for solver.js
python/app.py             tkinter GUI: two tabs (free-form solver, optimal allocator)
python/solver.py          Python port of src/solver.js — same logic, same variable names
python/test_solver.py     unittest port of src/solver.test.js
python/README.md          Python-specific run/test instructions
docs/                      This documentation set
```

## Data model

Six user-editable variables and two derived-only variables:

| Var | Meaning                        | Kind      |
|-----|---------------------------------|-----------|
| Ds  | Downlink speed per port (Gbps)  | editable  |
| Dc  | Downlink port count              | editable  |
| Us  | Uplink speed per port (Gbps)     | editable  |
| Uc  | Uplink port count                 | editable  |
| Tp  | Total switch ports                | editable  |
| R   | Oversubscription ratio (:1)        | editable  |
| DB  | Downlink bandwidth (Ds × Dc)        | derived   |
| UB  | Uplink bandwidth (Us × Uc)           | derived   |

Any editable var can be typed directly ("locked") or left blank and derived
from the others. Nothing is ever locked except what the user actually typed —
clearing an input un-locks it and lets it be re-derived or go blank.

## Solver rules (`src/solver.js` / `python/solver.py`)

- **Product rules**: `Dc × Ds = DB`, `Uc × Us = UB`, `UB × R = DB`.
- **Sum rule**: `Dc + Uc = Tp` (every port is either a downlink or an uplink).
- `solveState(value, locked)` (`solve_state` in Python) resets all non-locked
  vars to `null`/`None`, then iterates the rules to a fixed point (max 20
  passes), filling in any variable where the other two operands of a rule are
  known.
- If all three operands of a rule are known and don't agree (within a
  relative/absolute epsilon, see `close()`), it's reported as a conflict
  string rather than silently overwritten.

## Optimal port allocator (`optimizeCounts` / `optimize_counts`)

A second, independent calculation (own UI card/tab, not part of the
`solveState` rule graph): given total ports `N`, a target oversub ratio `R`,
and the two port speeds `Us`/`Ds`, picks the integer `Uc`/`Dc` split that
maximizes downlinks without ever exceeding the target ratio.

- `rho = R × Us / Ds`; continuous ideal is `Uc = N / (1 + rho)`.
- `Uc` is rounded **up** (`Math.ceil` / `math.ceil`) from that ideal, then
  clamped to `[1, N]`, so the actual ratio never overshoots the target — a
  slightly lower `Dc` than the continuous ideal is traded for never degrading
  the ratio.
- `Dc = N - Uc` always, so every port is used (no waste).
- Returns `null`/`None` for non-positive `N`/`Us`/`Ds` or negative `R`.

## Gotchas

- `solveState`/`solve_state` and `optimizeCounts`/`optimize_counts` are
  pure — they take plain values and return new results, they do not mutate
  their inputs. `index.html`'s inline script and `python/app.py`'s `App`
  classes own the DOM/widget binding, re-running solve on every input event.
- ESLint's HTML plugin lints the inline `<script type="module">` in
  `index.html` directly — there's no separate JS file to lint for the DOM code,
  so `npm run lint` covers both `src/` and the inline script.
- `python/solver.py` is a hand-maintained port of `src/solver.js` — there is
  no shared source of truth or codegen between the two. Changing the rules in
  one must be mirrored in the other (see `CONTRIBUTING.md`).
