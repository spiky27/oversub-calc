# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versioning follows SemVer.

## [Unreleased]

### Added

- Dev tooling: Vite dev server/build, ESLint + Prettier, Vitest.
- `src/solver.js`: constraint-solver logic extracted out of `index.html` for
  unit testing, with tests in `src/solver.test.js`.
- Documentation set: `CLAUDE.md`, `docs/SKILL.md`, `docs/ARCHITECTURE.md`,
  `docs/adr/`, `docs/PRD.md`, `CONTRIBUTING.md`.
- Optimal Port Allocator: given total ports, a target oversub ratio, and the
  two port speeds, `optimizeCounts()` (`src/solver.js`) computes the integer
  uplink/downlink split that maximizes downlinks without exceeding the target
  ratio. New card in `index.html`, alongside the existing free-form solver.
- `python/`: a stdlib-only Python/tkinter desktop version with no npm or pip
  dependencies, reproducing both calculator modes (free-form solver and
  optimal allocator) with live reactivity. Added for environments where the
  npm registry is restricted; kept alongside, not replacing, the browser
  version. See `docs/adr/0003-python-tkinter-desktop-version.md`.
