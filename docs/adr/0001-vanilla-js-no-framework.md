# 0001 — Vanilla JS, no framework

## Status

Accepted

## Context

The personal-project default (see `~/.claude/personal-CLAUDE.md`) is React 18
+ Vite for personal web apps. This project is a single form with six numeric
inputs, some derived/disabled fields, and a badge/warning display driven by a
small constraint solver — no routing, no component tree of any real depth, no
persisted state.

## Decision

Keep it as plain HTML/CSS/JS, no UI framework. Vite is still used, but only as
a dev server and build tool for ES modules — not paired with React.

## Consequences

- Smaller footprint, no framework runtime to ship.
- DOM updates in `render()` are manual (`el.value = ...`, `classList`), which
  is fine at this size but would not scale gracefully if the UI grows much
  more complex — if that happens, revisit this decision rather than continuing
  to hand-rolled DOM diffing.
