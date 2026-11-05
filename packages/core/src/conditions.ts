import { getPath } from './path';
import type { Condition, FieldCondition, FormValues } from './types';

/**
 * Where a condition is evaluated.
 * `scope` is the current array item (if any); paths are resolved against it
 * first so that item fields can depend on their siblings.
 */
export interface ConditionContext {
  root: FormValues;
  scope?: Record<string, unknown>;
}

export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function resolve(field: string, ctx: ConditionContext): unknown {
  if (ctx.scope) {
    const head = field.split('.')[0] as string;
    if (Object.prototype.hasOwnProperty.call(ctx.scope, head)) return getPath(ctx.scope, field);
  }
  return getPath(ctx.root, field);
}

function toComparable(value: unknown): number | string | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
  }
  return undefined;
}

function compare(
  actual: unknown,
  expected: unknown,
  test: (a: number | string, b: number | string) => boolean,
): boolean {
  const a = toComparable(actual);
  const b = toComparable(expected);
  if (a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;
  return test(a, b);
}

function evaluateField(cond: FieldCondition, ctx: ConditionContext): boolean {
  const actual = resolve(cond.field, ctx);
  const expected = cond.value;

  switch (cond.op) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'gt':
      return compare(actual, expected, (a, b) => a > b);
    case 'gte':
      return compare(actual, expected, (a, b) => a >= b);
    case 'lt':
      return compare(actual, expected, (a, b) => a < b);
    case 'lte':
      return compare(actual, expected, (a, b) => a <= b);
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'notIn':
      return Array.isArray(expected) && !expected.includes(actual);
    case 'includes':
      if (Array.isArray(actual)) return actual.includes(expected);
      if (typeof actual === 'string' && typeof expected === 'string')
        return actual.includes(expected);
      return false;
    case 'empty':
      return isEmpty(actual);
    case 'notEmpty':
      return !isEmpty(actual);
    default: {
      const exhaustive: never = cond.op;
      throw new Error(`Unknown operator: ${String(exhaustive)}`);
    }
  }
}

export function evaluateCondition(cond: Condition, ctx: ConditionContext): boolean {
  if ('all' in cond) return cond.all.every((c) => evaluateCondition(c, ctx));
  if ('any' in cond) return cond.any.some((c) => evaluateCondition(c, ctx));
  if ('not' in cond) return !evaluateCondition(cond.not, ctx);
  return evaluateField(cond, ctx);
}

/** Every field path a condition reads (used by schema checks and the builder). */
export function conditionDependencies(cond: Condition): string[] {
  if ('all' in cond) return cond.all.flatMap(conditionDependencies);
  if ('any' in cond) return cond.any.flatMap(conditionDependencies);
  if ('not' in cond) return conditionDependencies(cond.not);
  return [cond.field];
}
