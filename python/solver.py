import math

EPS = 1e-6

EDITABLE = ['Ds', 'Dc', 'Us', 'Uc', 'Tp', 'R']
DERIVED_ONLY = ['DB', 'UB']
ALL_VARS = EDITABLE + DERIVED_ONLY

# product rules: c = a * b
PRODUCT_RULES = [
    ('Dc', 'Ds', 'DB'),
    ('Uc', 'Us', 'UB'),
    ('UB', 'R', 'DB'),  # DB = UB * R
]
# sum rule: c = a + b
SUM_RULES = [('Dc', 'Uc', 'Tp')]


def close(a, b):
    return abs(a - b) < max(EPS, abs(a) * 1e-9)


def solve_state(value, locked):
    """Given locked (user-entered) values, propagates product/sum rules until
    fixed point and reports any values that conflict with their rule."""
    next_value = {k: (value[k] if locked.get(k) else None) for k in ALL_VARS}

    conflicts = []
    changed = True
    iterations = 0
    while changed and iterations < 20:
        changed = False
        iterations += 1

        for a, b, c in PRODUCT_RULES:
            va, vb, vc = next_value[a], next_value[b], next_value[c]
            known = sum(v is not None for v in (va, vb, vc))
            if known == 2:
                if va is not None and vb is not None:
                    if next_value[c] is None:
                        next_value[c] = va * vb
                        changed = True
                elif va is not None and vc is not None:
                    if va != 0 and next_value[b] is None:
                        next_value[b] = vc / va
                        changed = True
                elif vb is not None and vc is not None:
                    if vb != 0 and next_value[a] is None:
                        next_value[a] = vc / vb
                        changed = True
            elif known == 3:
                if not close(va * vb, vc):
                    conflicts.append(
                        f'{a} × {b} should equal {c}, but got {va * vb:.3f} vs {vc}.'
                    )

        for a, b, c in SUM_RULES:
            va, vb, vc = next_value[a], next_value[b], next_value[c]
            known = sum(v is not None for v in (va, vb, vc))
            if known == 2:
                if va is not None and vb is not None:
                    if next_value[c] is None:
                        next_value[c] = va + vb
                        changed = True
                elif va is not None and vc is not None:
                    if next_value[b] is None:
                        next_value[b] = vc - va
                        changed = True
                elif vb is not None and vc is not None:
                    if next_value[a] is None:
                        next_value[a] = vc - vb
                        changed = True
            elif known == 3:
                if not close(va + vb, vc):
                    conflicts.append(
                        f'{a} + {b} should equal {c} (total ports), but got {va + vb:.3f} vs {vc}.'
                    )

    return next_value, conflicts


def optimize_counts(N, R, Us, Ds):
    """Given total ports N, a target oversub ratio R, and the two port speeds,
    picks integer uplink/downlink counts that split N without ever exceeding
    R (a higher actual ratio is worse). Uc is rounded UP from the continuous
    ideal (N / (1+rho)) so the actual ratio never overshoots the target; this
    trades a slightly lower Dc than the continuous ideal for never degrading
    the ratio. Every port is used (Dc + Uc = N always)."""
    if not (N > 0 and Us > 0 and Ds > 0 and R >= 0):
        return None
    rho = (R * Us) / Ds
    raw_uc = N / (1 + rho)
    Uc = min(max(math.ceil(raw_uc), 1), N)
    Dc = N - Uc
    actual_r = 0 if Dc == 0 else (Dc * Ds) / (Uc * Us)
    return {'Uc': Uc, 'Dc': Dc, 'actualR': actual_r}
