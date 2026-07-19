# 0003 — Stdlib-only Python/tkinter desktop version, alongside the JS version

## Status

Accepted

## Context

The browser version depends on npm (Vite, ESLint, Vitest) for dev tooling and
the build. IT flagged concerns about the npm registry's supply-chain security
posture, making npm-based tooling unsuitable in some environments the
calculator needs to run in. The core requirement — type any known value into
any field, see the rest derived live — has no equivalent in a CLI tool (no
live reactivity) or a static single-shot script, ruling those out as direct
replacements.

## Decision

Add a second, independent implementation in `python/`: a `tkinter` desktop
GUI (ships with standard Python — no `pip install` needed) that reproduces
both calculator modes (free-form solver, optimal port allocator) with the
same live-reactive UX, driven by a hand-ported copy of the solver logic
(`python/solver.py`, mirroring `src/solver.js`). Dev tooling stays
stdlib-only too (`unittest` instead of `pytest`/Vitest) so the Python side
has zero package-manager dependencies of any kind, npm or pip.

The existing JS/npm version in `index.html`/`src/` is kept, not replaced —
the two live side by side so the browser version (with its existing tooling
and docs) remains available where npm isn't a concern, while the Python
version serves environments where it is.

## Consequences

- Two solvers to keep in sync by hand (`src/solver.js` and
  `python/solver.py`, and their respective test suites) — there is no
  codegen or shared source of truth. A change to the product/sum rules or the
  allocator formula must be applied to both, per `CONTRIBUTING.md`.
- The Python version requires a Python built against Tcl/Tk 8.6+; macOS's
  system Python ships Tk 8.5, which has a known blank-window rendering bug on
  modern macOS. `python/README.md` documents the Homebrew `python-tk`
  workaround.
- No web-specific affordances (browser tab, URL, no-install "just open the
  file" story) — the Python version requires the user to have Python 3
  installed and run it as a script (`python3 python/app.py`), and it opens as
  a desktop window instead of a page.
