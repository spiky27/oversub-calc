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

// Given total ports N, a target oversub ratio R, and the two port speeds,
// picks integer uplink/downlink counts that split N without ever exceeding
// R (a higher actual ratio is worse). Uc is rounded UP from the continuous
// ideal (N / (1+rho)) so the actual ratio never overshoots the target; this
// trades a slightly lower Dc than the continuous ideal for never degrading
// the ratio. Every port is used (Dc + Uc = N always).
export function optimizeCounts({ N, R, Us, Ds }) {
  if (!(N > 0) || !(Us > 0) || !(Ds > 0) || !(R >= 0)) return null;
  const rho = (R * Us) / Ds;
  const rawUc = N / (1 + rho);
  const Uc = Math.min(Math.max(Math.ceil(rawUc), 1), N);
  const Dc = N - Uc;
  const actualR = Dc === 0 ? 0 : (Dc * Ds) / (Uc * Us);
  return { Uc, Dc, actualR };
}
