import { describe, expect, it } from 'vitest';
import { applyEffects, createInitialState, evaluateCondition } from '../src/engine/state';

describe('effects', () => {
  it('sets flags and accumulates relations, fate and gift uses', () => {
    const s = applyEffects(createInitialState(), [
      { flag: 'a', value: true },
      { relation: 'livia:domicia', add: 2 },
      { relation: 'livia:domicia', add: -1 },
      { fate: 'selo', add: 3 },
      { giftUse: 'livia' },
      { giftUse: 'livia', add: 2 },
      { crossover: 'livia-theron' },
    ]);
    expect(s.flags.a).toBe(true);
    expect(s.relations['livia:domicia']).toBe(1);
    expect(s.fate.selo).toBe(3);
    expect(s.giftUses.livia).toBe(3);
    expect(s.crossover).toBe('livia-theron');
  });

  it('records deaths once and does not mutate the input', () => {
    const initial = createInitialState();
    const s = applyEffects(initial, [{ kill: 'mirto' }, { kill: 'mirto' }]);
    expect(s.deaths).toEqual(['mirto']);
    expect(initial.deaths).toEqual([]);
  });
});

describe('numeric flags', () => {
  it('counts with add (missing = 0) and checks ranges', () => {
    const s = applyEffects(createInitialState(), [
      { flag: 'suspeita', add: 1 },
      { flag: 'suspeita', add: 1 },
    ]);
    expect(s.flags.suspeita).toBe(2);
    expect(evaluateCondition(s, { flag: 'suspeita', min: 2 })).toBe(true);
    expect(evaluateCondition(s, { flag: 'suspeita', max: 1 })).toBe(false);
    expect(evaluateCondition(s, { flag: 'missing', max: 0 })).toBe(true);
  });
});

describe('conditions', () => {
  const s = applyEffects(createInitialState(), [
    { flag: 'open', value: true },
    { flag: 'count', value: 2 },
    { relation: 'a:b', add: 2 },
    { kill: 'nerea' },
  ]);

  it('checks flags (truthy and exact value)', () => {
    expect(evaluateCondition(s, { flag: 'open' })).toBe(true);
    expect(evaluateCondition(s, { flag: 'missing' })).toBe(false);
    expect(evaluateCondition(s, { flag: 'count', is: 2 })).toBe(true);
    expect(evaluateCondition(s, { flag: 'count', is: 3 })).toBe(false);
  });

  it('checks ranges, defaulting missing values to 0', () => {
    expect(evaluateCondition(s, { relation: 'a:b', min: 2 })).toBe(true);
    expect(evaluateCondition(s, { relation: 'a:b', max: 1 })).toBe(false);
    expect(evaluateCondition(s, { fate: 'selo', max: 0 })).toBe(true);
    expect(evaluateCondition(s, { giftUses: 'livia', min: 1 })).toBe(false);
  });

  it('checks life, crossover and combinators', () => {
    expect(evaluateCondition(s, { dead: 'nerea' })).toBe(true);
    expect(evaluateCondition(s, { alive: 'mirto' })).toBe(true);
    expect(evaluateCondition(s, { crossover: null })).toBe(true);
    expect(evaluateCondition(s, { all: [{ flag: 'open' }, { dead: 'nerea' }] })).toBe(true);
    expect(evaluateCondition(s, { any: [{ flag: 'missing' }, { alive: 'nerea' }] })).toBe(false);
    expect(evaluateCondition(s, { not: { flag: 'missing' } })).toBe(true);
  });
});
