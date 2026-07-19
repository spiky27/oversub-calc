# CONTRIBUTING.md

## Workflow

- `main` is the only long-lived branch, always deployable.
- Branch naming: `feat/<short-description>`, `fix/<short-description>`,
  `docs/<short-description>`.
- Conventional Commits: `feat:`, `fix:`, `infra:`, `chore:`, `docs:`,
  `refactor:`, `test:`.
- Before opening a PR, run locally: `npm run lint`, `npm test`.
- Add a `[Unreleased]` entry to `CHANGELOG.md` for any user-visible change.
- Versioning: SemVer. Releases are annotated git tags (`git tag -a`), never
  lightweight.

## What not to touch

- `src/solver.js`'s variable keys (`Ds`, `Dc`, `Us`, `Uc`, `Tp`, `R`, `DB`,
  `UB`) are referenced by matching DOM element `id`s in `index.html` (e.g.
  `#Ds`, `#Ds-badge`). Renaming a key without updating the corresponding
  markup/ids silently breaks that field.
- `productRules` / `sumRules` in `src/solver.js` encode the actual physical
  relationships (bandwidth = speed × count, total ports = downlinks +
  uplinks). Changing them changes what the calculator claims is true —
  treat as a domain decision, not a refactor, and update `docs/SKILL.md` and
  `src/solver.test.js` alongside any change.
- `python/solver.py` is a hand-maintained port of `src/solver.js` — there is
  no codegen or shared source of truth between them (see
  `docs/adr/0003-python-tkinter-desktop-version.md`). Any change to
  `solveState`/`optimizeCounts`'s rules or behavior must be mirrored in
  `solve_state`/`optimize_counts`, with matching updates to
  `python/test_solver.py`, or the two implementations will silently disagree.
