import { describe, it, expect } from 'vitest';
import { solveState, close, allVars, optimizeCounts, EPS } from './solver.js';

function state(locked) {
  const value = {};
  const lockedMap = {};
  allVars.forEach((k) => {
    value[k] = locked[k] ?? null;
    lockedMap[k] = k in locked;
  });
  return { value, lockedMap };
}

describe('close', () => {
  it('treats near-equal floats as equal', () => {
    expect(close(0.1 + 0.2, 0.3)).toBe(true);
  });

  it('treats distinct values as unequal', () => {
    expect(close(1, 2)).toBe(false);
  });
});

describe('solveState', () => {
  it('derives downlink bandwidth from speed × count', () => {
    const { value, lockedMap } = state({ Ds: 10, Dc: 48 });
    const { value: result, conflicts } = solveState(value, lockedMap);
    expect(result.DB).toBe(480);
    expect(conflicts).toHaveLength(0);
  });

  it('derives uplink count from bandwidth ÷ speed', () => {
    const { value, lockedMap } = state({ Us: 100, UB: 800 });
    const { value: result, conflicts } = solveState(value, lockedMap);
    expect(result.Uc).toBe(8);
    expect(conflicts).toHaveLength(0);
  });

  it('derives downlink bandwidth from uplink bandwidth × ratio', () => {
    const { value, lockedMap } = state({ Us: 100, Uc: 4, R: 3 });
    const { value: result } = solveState(value, lockedMap);
    expect(result.UB).toBe(400);
    expect(result.DB).toBe(1200);
  });

  it('derives total ports from downlink + uplink counts', () => {
    const { value, lockedMap } = state({ Dc: 48, Uc: 8 });
    const { value: result } = solveState(value, lockedMap);
    expect(result.Tp).toBe(56);
  });

  it('derives a missing addend from the sum rule', () => {
    const { value, lockedMap } = state({ Tp: 56, Dc: 48 });
    const { value: result } = solveState(value, lockedMap);
    expect(result.Uc).toBe(8);
  });

  it('flags a product conflict when all three values disagree', () => {
    const { value, lockedMap } = state({ Ds: 10, Dc: 48, DB: 100 });
    const { conflicts } = solveState(value, lockedMap);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0]).toMatch(/Dc × Ds should equal DB/);
  });

  it('flags a sum conflict when total ports disagrees with downlinks + uplinks', () => {
    const { value, lockedMap } = state({ Dc: 48, Uc: 8, Tp: 100 });
    const { conflicts } = solveState(value, lockedMap);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0]).toMatch(/Dc \+ Uc should equal Tp/);
  });

  it('leaves under-determined variables null', () => {
    const { value, lockedMap } = state({ Ds: 10 });
    const { value: result, conflicts } = solveState(value, lockedMap);
    expect(result.Dc).toBeNull();
    expect(result.DB).toBeNull();
    expect(conflicts).toHaveLength(0);
  });
});

describe('optimizeCounts', () => {
  // N=32, Us=400G, Uc=400/100 speed ratio -> expected Uc/Dc/actualR per over_sub target.
  const cases = [
    { R: 1, Uc: 7, Dc: 25, actualR: 25 / 28 },
    { R: 2, Uc: 4, Dc: 28, actualR: 1.75 },
    { R: 3, Uc: 3, Dc: 29, actualR: 29 / 12 },
    { R: 4, Uc: 2, Dc: 30, actualR: 3.75 },
    { R: 5, Uc: 2, Dc: 30, actualR: 3.75 },
    { R: 6, Uc: 2, Dc: 30, actualR: 3.75 },
    { R: 7, Uc: 2, Dc: 30, actualR: 3.75 },
    { R: 8, Uc: 1, Dc: 31, actualR: 7.75 },
  ];

  cases.forEach(({ R, Uc, Dc, actualR }) => {
    it(`R=${R} -> Uc=${Uc}, Dc=${Dc}, never exceeding target`, () => {
      const result = optimizeCounts({ N: 32, R, Us: 400, Ds: 100 });
      expect(result.Uc).toBe(Uc);
      expect(result.Dc).toBe(Dc);
      expect(close(result.actualR, actualR)).toBe(true);
      expect(result.actualR).toBeLessThanOrEqual(R + EPS);
      expect(result.Uc + result.Dc).toBe(32);
    });
  });

  it('returns null for non-positive inputs', () => {
    expect(optimizeCounts({ N: 0, R: 4, Us: 400, Ds: 100 })).toBeNull();
    expect(optimizeCounts({ N: 32, R: 4, Us: 0, Ds: 100 })).toBeNull();
    expect(optimizeCounts({ N: 32, R: -1, Us: 400, Ds: 100 })).toBeNull();
  });

  it('clamps Uc to at least 1 when the target ratio is very loose', () => {
    const result = optimizeCounts({ N: 32, R: 1000, Us: 400, Ds: 100 });
    expect(result.Uc).toBe(1);
    expect(result.Dc).toBe(31);
  });

  it('clamps Uc to N when the target ratio is 0 (all uplinks)', () => {
    const result = optimizeCounts({ N: 32, R: 0, Us: 400, Ds: 100 });
    expect(result.Uc).toBe(32);
    expect(result.Dc).toBe(0);
    expect(result.actualR).toBe(0);
  });
});
