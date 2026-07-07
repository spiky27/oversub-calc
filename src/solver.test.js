import { describe, it, expect } from 'vitest';
import { solveState, close, allVars } from './solver.js';

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
