# Oversubscription Calculator

A single-page calculator for switch oversubscription ratios. Fill in any subset
of downlink/uplink port speeds, counts, total ports, and the oversubscription
ratio — the rest are derived automatically, and conflicting values are flagged.

## Development

```bash
npm install
npm run dev       # start local dev server
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run lint        # lint index.html's inline script and src/
npm run format      # format all files with Prettier
npm test            # run solver unit tests (Vitest)
```

See [docs/SKILL.md](docs/SKILL.md) for how the solver works, and
[CONTRIBUTING.md](CONTRIBUTING.md) for the git workflow.
