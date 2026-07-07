# SKILL.md — oversub-calc technical reference

## Stack

- Static HTML/CSS/JS. No framework, no backend, no persisted data.
- Vite as the dev server / build tool (`npm run dev`, `npm run build`).
- ESLint (flat config, `eslint-plugin-html`) + Prettier for lint/format.
- Vitest for unit tests against the solver logic.

## File layout

```
index.html        UI markup, styling, and DOM-binding script (imports solver.js)
src/solver.js      Pure constraint-solver: no DOM, fully unit-testable
src/solver.test.js  Vitest unit tests for solver.js
docs/               This documentation set
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

## Solver rules (`src/solver.js`)

- **Product rules**: `Dc × Ds = DB`, `Uc × Us = UB`, `UB × R = DB`.
- **Sum rule**: `Dc + Uc = Tp` (every port is either a downlink or an uplink).
- `solveState(value, locked)` resets all non-locked vars to `null`, then
  iterates the rules to a fixed point (max 20 passes), filling in any variable
  where the other two operands of a rule are known.
- If all three operands of a rule are known and don't agree (within a
  relative/absolute epsilon, see `close()`), it's reported as a conflict
  string rather than silently overwritten.

## Gotchas

- `solveState` is pure — it takes `value`/`locked` maps and returns a new
  `{ value, conflicts }`, it does not mutate its inputs. `index.html`'s inline
  script owns the DOM binding, re-running `solve()` on every input event.
- ESLint's HTML plugin lints the inline `<script type="module">` in
  `index.html` directly — there's no separate JS file to lint for the DOM code,
  so `npm run lint` covers both `src/` and the inline script.
