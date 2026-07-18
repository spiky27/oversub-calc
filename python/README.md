# oversub-calc (Python / tkinter)

Same calculator as the root `index.html`, as a desktop app instead of a
browser page. No dependencies beyond the Python standard library — no pip,
no npm.

## Requirements

- Python 3 with tkinter built in.
- macOS's system Python (`/usr/bin/python3`) ships an old Tcl/Tk 8.5, which
  has a known blank-window bug on modern macOS. Use a Python built against
  Tcl/Tk 8.6+ instead, e.g.:

  ```
  brew install python-tk@3.13
  ```

  then run with Homebrew's `python3` (`brew --prefix python@3.13`), not the
  system one.

## Run

```
cd python
python3 app.py
```

## Test

```
cd python
python3 -m unittest -v
```

## Files

- `solver.py` — pure constraint-solver logic (`solve_state`,
  `optimize_counts`), ported from `../src/solver.js`.
- `test_solver.py` — unittest port of `../src/solver.test.js`.
- `app.py` — tkinter GUI: two tabs, "Free-form solver" (type any subset of
  Ds/Dc/Us/Uc/Tp/R, the rest derives live) and "Optimal allocator" (N/R/Us/Ds
  in, optimal Uc/Dc out).
