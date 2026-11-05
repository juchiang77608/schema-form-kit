import { evaluateCondition, type ConditionContext } from './conditions';
import type { FieldSchema, FormSchema, FormValues, StepSchema } from './types';

export function isFieldVisible(field: FieldSchema, ctx: ConditionContext): boolean {
  return field.visibleWhen ? evaluateCondition(field.visibleWhen, ctx) : true;
}

export function isFieldRequired(field: FieldSchema, ctx: ConditionContext): boolean {
  if (field.required === undefined || field.required === false) return false;
  if (field.required === true) return true;
  return evaluateCondition(field.required, ctx);
}

export function visibleFields(fields: FieldSchema[], ctx: ConditionContext): FieldSchema[] {
  return fields.filter((field) => isFieldVisible(field, ctx));
}

export function findField(schema: FormSchema, name: string): FieldSchema | undefined {
  return schema.fields.find((field) => field.name === name);
}

/** Returns the steps of a schema; a schema without steps is a single step. */
export function getSteps(schema: FormSchema): StepSchema[] {
  if (schema.steps && schema.steps.length > 0) return schema.steps;
  return [{ id: 'main', title: schema.title, fields: schema.fields.map((f) => f.name) }];
}

export function fieldsOfStep(schema: FormSchema, step: StepSchema): FieldSchema[] {
  return step.fields
    .map((name) => findField(schema, name))
    .filter((field): field is FieldSchema => field !== undefined);
}

function defaultFor(field: FieldSchema): unknown {
  if (field.defaultValue !== undefined) return structuredClone(field.defaultValue);
  switch (field.type) {
    case 'checkbox':
    case 'array':
      return [];
    case 'switch':
      return false;
    case 'number':
      return null;
    default:
      return '';
  }
}

/** Builds a value object for one array item from its field definitions. */
export function initialItem(fields: FieldSchema[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.name, defaultFor(f)]));
}

/**
 * Builds initial values from defaults, then overlays `existing` (e.g. a saved
 * draft) so unknown keys are dropped and missing keys get defaults.
 */
export function buildInitialValues(schema: FormSchema, existing: FormValues = {}): FormValues {
  const values: FormValues = {};
  for (const field of schema.fields) {
    values[field.name] =
      existing[field.name] !== undefined ? existing[field.name] : defaultFor(field);
  }
  return values;
}

function pruneFields(
  fields: FieldSchema[],
  source: Record<string, unknown>,
  root: FormValues,
  scope: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (!isFieldVisible(field, { root, scope })) continue;
    const value = source[field.name];
    if (field.type === 'array' && Array.isArray(value)) {
      out[field.name] = value.map((item) => {
        const itemScope = (item ?? {}) as Record<string, unknown>;
        return pruneFields(field.fields, itemScope, root, itemScope);
      });
    } else {
      out[field.name] = value;
    }
  }
  return out;
}

/**
 * Returns a copy of `values` without hidden fields (also inside array items).
 *
 * Hiding cascades: if a hidden field controls another field, the stale value
 * of the hidden field no longer counts, so the dependent field is hidden too.
 * The pass is repeated until nothing changes.
 */
export function effectiveValues(schema: FormSchema, values: FormValues): FormValues {
  let current = values;
  // Each pass can only remove fields, so the number of fields bounds the loop.
  for (let pass = 0; pass <= countFields(schema.fields); pass += 1) {
    const next = pruneFields(schema.fields, current, current, undefined);
    if (JSON.stringify(next) === JSON.stringify(current)) return next;
    current = next;
  }
  return current;
}

function countFields(fields: FieldSchema[]): number {
  return fields.reduce((n, f) => n + 1 + (f.type === 'array' ? countFields(f.fields) : 0), 0);
}

/** Alias used when submitting: answers to questions the user did not see are dropped. */
export const pruneHiddenValues = effectiveValues;
