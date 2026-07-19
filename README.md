# Oversubscription Calculator

A calculator for switch oversubscription ratios, in two forms with identical
logic:

- **Browser** (`index.html`): fill in any subset of downlink/uplink port
  speeds, counts, total ports, and the oversubscription ratio — the rest are
  derived automatically, and conflicting values are flagged. Also includes an
  **Optimal Port Allocator** card: given total ports and a target oversub
  ratio, get the integer uplink/downlink split that maximizes downlinks
  without exceeding that ratio.
- **Desktop** (`python/`): the same two calculators as a stdlib-only
  Python/tkinter app — no npm, no pip, nothing to install beyond Python
  itself. Use this where installing from the npm registry isn't an option.

## Development (browser)

```bash
npm install
npm run dev       # start local dev server
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run lint        # lint index.html's inline script and src/
npm run format      # format all files with Prettier
npm test            # run solver unit tests (Vitest)
```

## Development (desktop / Python)

```bash
cd python
python3 app.py           # run the app
python3 -m unittest -v   # run solver unit tests
```

See [python/README.md](python/README.md) for setup details, including a
macOS system-Python Tk 8.5 gotcha.

See [docs/SKILL.md](docs/SKILL.md) for how the solver works, and
[CONTRIBUTING.md](CONTRIBUTING.md) for the git workflow.
