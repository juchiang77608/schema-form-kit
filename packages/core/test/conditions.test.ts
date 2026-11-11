import { describe, expect, it } from 'vitest';
import { conditionDependencies, evaluateCondition, type Condition } from '../src';

const root = {
  role: 'student',
  age: 20,
  ageText: '20',
  tags: ['vue', 'ts'],
  note: '  ',
  address: { city: 'Taipei' },
};

const ev = (cond: Condition, scope?: Record<string, unknown>) =>
  evaluateCondition(cond, { root, scope });

describe('evaluateCondition', () => {
  it('handles equality operators', () => {
    expect(ev({ field: 'role', op: 'eq', value: 'student' })).toBe(true);
    expect(ev({ field: 'role', op: 'neq', value: 'student' })).toBe(false);
  });

  it('compares numbers, including numeric strings', () => {
    expect(ev({ field: 'age', op: 'gte', value: 18 })).toBe(true);
    expect(ev({ field: 'age', op: 'lt', value: 18 })).toBe(false);
    expect(ev({ field: 'ageText', op: 'gt', value: 19 })).toBe(true);
  });

  it('never matches comparisons against missing values', () => {
    expect(ev({ field: 'missing', op: 'gt', value: 0 })).toBe(false);
    expect(ev({ field: 'missing', op: 'lte', value: 0 })).toBe(false);
  });

  it('handles membership operators', () => {
    expect(ev({ field: 'role', op: 'in', value: ['student', 'teacher'] })).toBe(true);
    expect(ev({ field: 'role', op: 'notIn', value: ['student'] })).toBe(false);
    expect(ev({ field: 'tags', op: 'includes', value: 'vue' })).toBe(true);
    expect(ev({ field: 'role', op: 'includes', value: 'stud' })).toBe(true);
  });

  it('treats whitespace-only strings as empty', () => {
    expect(ev({ field: 'note', op: 'empty' })).toBe(true);
    expect(ev({ field: 'tags', op: 'notEmpty' })).toBe(true);
  });

  it('reads nested paths', () => {
    expect(ev({ field: 'address.city', op: 'eq', value: 'Taipei' })).toBe(true);
  });

  it('combines conditions with all / any / not', () => {
    const cond: Condition = {
      all: [
        { field: 'role', op: 'eq', value: 'student' },
        {
          any: [
            { field: 'age', op: 'lt', value: 18 },
            { field: 'tags', op: 'includes', value: 'ts' },
          ],
        },
        { not: { field: 'note', op: 'notEmpty' } },
      ],
    };
    expect(ev(cond)).toBe(true);
  });

  it('resolves against the array item scope before the root', () => {
    const scope = { role: 'intern', current: true };
    expect(ev({ field: 'role', op: 'eq', value: 'intern' }, scope)).toBe(true);
    expect(ev({ field: 'age', op: 'eq', value: 20 }, scope)).toBe(true);
  });
});

describe('conditionDependencies', () => {
  it('lists every referenced field', () => {
    const cond: Condition = {
      any: [{ field: 'a', op: 'empty' }, { not: { field: 'b.c', op: 'eq', value: 1 } }],
    };
    expect(conditionDependencies(cond)).toEqual(['a', 'b.c']);
  });
});
