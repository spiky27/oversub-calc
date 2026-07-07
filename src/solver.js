export const EPS = 1e-6;

export const editable = ['Ds', 'Dc', 'Us', 'Uc', 'Tp', 'R'];
export const derivedOnly = ['DB', 'UB'];
export const allVars = editable.concat(derivedOnly);

// product rules: c = a * b
const productRules = [
  ['Dc', 'Ds', 'DB'],
  ['Uc', 'Us', 'UB'],
  ['UB', 'R', 'DB'], // DB = UB * R
];
// sum rule: c = a + b
const sumRules = [['Dc', 'Uc', 'Tp']];

export function close(a, b) {
  return Math.abs(a - b) < Math.max(EPS, Math.abs(a) * 1e-9);
}

// Given locked (user-entered) values, propagates product/sum rules until
// fixed point and reports any values that conflict with their rule.
export function solveState(value, locked) {
  const next = {};
  allVars.forEach((k) => {
    next[k] = locked[k] ? value[k] : null;
  });

  const conflicts = [];
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 20) {
    changed = false;
    iterations++;

    productRules.forEach(([a, b, c]) => {
      const va = next[a],
        vb = next[b],
        vc = next[c];
      const known = [va, vb, vc].filter((v) => v !== null).length;
      if (known === 2) {
        if (va !== null && vb !== null) {
          if (next[c] === null) {
            next[c] = va * vb;
            changed = true;
          }
        } else if (va !== null && vc !== null) {
          if (va !== 0 && next[b] === null) {
            next[b] = vc / va;
            changed = true;
          }
        } else if (vb !== null && vc !== null) {
          if (vb !== 0 && next[a] === null) {
            next[a] = vc / vb;
            changed = true;
          }
        }
      } else if (known === 3) {
        if (!close(va * vb, vc)) {
          conflicts.push(`${a} × ${b} should equal ${c}, but got ${(va * vb).toFixed(3)} vs ${vc}.`);
        }
      }
    });

    sumRules.forEach(([a, b, c]) => {
      const va = next[a],
        vb = next[b],
        vc = next[c];
      const known = [va, vb, vc].filter((v) => v !== null).length;
      if (known === 2) {
        if (va !== null && vb !== null) {
          if (next[c] === null) {
            next[c] = va + vb;
            changed = true;
          }
        } else if (va !== null && vc !== null) {
          if (next[b] === null) {
            next[b] = vc - va;
            changed = true;
          }
        } else if (vb !== null && vc !== null) {
          if (next[a] === null) {
            next[a] = vc - vb;
            changed = true;
          }
        }
      } else if (known === 3) {
        if (!close(va + vb, vc)) {
          conflicts.push(`${a} + ${b} should equal ${c} (total ports), but got ${(va + vb).toFixed(3)} vs ${vc}.`);
        }
      }
    });
  }

  return { value: next, conflicts };
}
