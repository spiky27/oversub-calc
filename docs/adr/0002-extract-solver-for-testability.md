# 0002 — Extract solver logic into src/solver.js

## Status

Accepted

## Context

The constraint-solving logic (product/sum rule propagation, conflict
detection) originally lived inline inside `index.html`'s `<script>`, coupled
to DOM reads/writes in the same closure. Testing it with Vitest would have
required a DOM environment (jsdom) and reaching into HTML elements just to
exercise pure math.

## Decision

Extract the rule tables and `solveState(value, locked) → { value, conflicts }`
into `src/solver.js`, with no DOM dependency. `index.html` imports it as an ES
module (`<script type="module">`) and keeps only DOM binding (event listeners,
`render()`) inline.

## Consequences

- `src/solver.test.js` runs the solver directly with plain objects — fast, no
  jsdom dependency needed.
- `index.html` now requires a module-capable script tag and relative import
  path (`./src/solver.js`), so it must be served (via `npm run dev` / a static
  server) rather than opened as a bare `file://` URL in browsers that block
  module imports over `file://`.
