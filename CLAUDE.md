@~/.claude/personal-CLAUDE.md

# oversub-calc

Single-page oversubscription-ratio calculator for network switches. No backend,
no framework — plain HTML/CSS with a small constraint-solver in JS.

- Domain/technical reference: [docs/SKILL.md](docs/SKILL.md)
- System overview: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Decisions: [docs/adr/](docs/adr/)
- Goals/non-goals: [docs/PRD.md](docs/PRD.md)
- Workflow: [CONTRIBUTING.md](CONTRIBUTING.md)

This project does **not** use the React/Vite-PWA/Google-Drive/Vercel-functions
stack described as the personal-project default — it's a static single-file
calculator with no persisted data, so none of that applies. Everything else
(iCloud path handling, doc structure, git workflow) still applies.
