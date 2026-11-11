import type { ArrayField, FieldSchema, FieldType, FormSchema, StepSchema } from '@schema-form-kit/core';
import { CHOICE_TYPES, RULES_BY_TYPE, createField, defaultOptions, uniqueName } from './palette';
import { renameReferences } from './references';
import {
  childPath,
  fieldsAt,
  getField,
  lastName,
  parentPath,
  replaceFieldsAt,
  type FieldPath,
} from './tree';

/** Thrown for edits that would produce an invalid schema; `message` is safe to show. */
export class BuilderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BuilderError';
  }
}

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function requireField(schema: FormSchema, path: FieldPath): FieldSchema {
  const field = getField(schema, path);
  if (!field) throw new BuilderError(`Field "${path}" does not exist`);
  return field;
}

function clampIndex(index: number | undefined, length: number): number {
  if (index === undefined) return length;
  return Math.max(0, Math.min(index, length));
}

export function createEmptySchema(id = 'untitled-form'): FormSchema {
  return { id, version: 1, title: { 'zh-TW': '未命名表單', en: 'Untitled form' }, fields: [] };
}

// ---------------------------------------------------------------------------
// Steps bookkeeping for top-level fields
// ---------------------------------------------------------------------------

function placeInStep(
  steps: StepSchema[] | undefined,
  name: string,
  stepId: string | undefined,
  afterName?: string,
): StepSchema[] | undefined {
  if (!steps || steps.length === 0) return steps;
  const targetId = stepId ?? (afterName ? steps.find((s) => s.fields.includes(afterName))?.id : undefined);
  const target = steps.find((s) => s.id === targetId) ?? steps[steps.length - 1]!;
  return steps.map((step) => {
    if (step.id !== target.id) return step;
    const fields = [...step.fields];
    const at = afterName ? fields.indexOf(afterName) : -1;
    fields.splice(at >= 0 ? at + 1 : fields.length, 0, name);
    return { ...step, fields };
  });
}

function removeFromSteps(steps: StepSchema[] | undefined, name: string): StepSchema[] | undefined {
  return steps?.map((step) => ({ ...step, fields: step.fields.filter((f) => f !== name) }));
}

function renameInSteps(steps: StepSchema[] | undefined, from: string, to: string): StepSchema[] | undefined {
  return steps?.map((step) => ({ ...step, fields: step.fields.map((f) => (f === from ? to : f)) }));
}

function withSteps(schema: FormSchema, steps: StepSchema[] | undefined): FormSchema {
  if (steps === undefined) {
    const { steps: _omit, ...rest } = schema;
    return rest;
  }
  return { ...schema, steps };
}

// ---------------------------------------------------------------------------
// Field operations
// ---------------------------------------------------------------------------

export interface AddFieldOptions {
  /** Group to add into (`""` or omitted = top level). */
  parent?: FieldPath;
  /** Position among siblings; defaults to the end. */
  index?: number;
  /** For top-level fields of a multi-step form: the step to place it in (defaults to the last step). */
  stepId?: string;
}

export interface AddFieldResult {
  schema: FormSchema;
  /** Path of the new field (its name may have been made unique). */
  path: FieldPath;
}

export function addField(
  schema: FormSchema,
  fieldOrType: FieldSchema | FieldType,
  options: AddFieldOptions = {},
): AddFieldResult {
  const parent = options.parent ?? '';
  const siblings = fieldsAt(schema, parent);
  if (!siblings) {
    throw new BuilderError(
      getField(schema, parent) ? `"${parent}" is not a group` : `Group "${parent}" does not exist`,
    );
  }
  const names = siblings.map((f) => f.name);

  const field: FieldSchema =
    typeof fieldOrType === 'string'
      ? createField(fieldOrType, names)
      : { ...structuredClone(fieldOrType), name: uniqueName(fieldOrType.name, names) };

  const next = replaceFieldsAt(schema, parent, (fields) => {
    const copy = [...fields];
    copy.splice(clampIndex(options.index, copy.length), 0, field);
    return copy;
  });

  const steps = parent === '' ? placeInStep(next.steps, field.name, options.stepId) : next.steps;
  return { schema: withSteps(next, steps), path: childPath(parent, field.name) };
}

export function removeField(schema: FormSchema, path: FieldPath): FormSchema {
  requireField(schema, path);
  const parent = parentPath(path);
  const name = lastName(path);
  const next = replaceFieldsAt(schema, parent, (fields) => fields.filter((f) => f.name !== name));
  return parent === '' ? withSteps(next, removeFromSteps(next.steps, name)) : next;
}

/** Inserts a copy right after the original, with a unique name. */
export function duplicateField(schema: FormSchema, path: FieldPath): AddFieldResult {
  const original = requireField(schema, path);
  const parent = parentPath(path);
  const siblings = fieldsAt(schema, parent)!;
  const index = siblings.findIndex((f) => f.name === original.name);
  const copy: FieldSchema = {
    ...structuredClone(original),
    name: uniqueName(`${original.name}_copy`, siblings.map((f) => f.name)),
  };
  const next = replaceFieldsAt(schema, parent, (fields) => {
    const list = [...fields];
    list.splice(index + 1, 0, copy);
    return list;
  });
  const steps = parent === '' ? placeInStep(next.steps, copy.name, undefined, original.name) : next.steps;
  return { schema: withSteps(next, steps), path: childPath(parent, copy.name) };
}

/** Moves a field to `toIndex` among its siblings. */
export function moveField(schema: FormSchema, path: FieldPath, toIndex: number): FormSchema {
  const field = requireField(schema, path);
  return replaceFieldsAt(schema, parentPath(path), (fields) => {
    const list = fields.filter((f) => f.name !== field.name);
    list.splice(clampIndex(toIndex, list.length), 0, field);
    return list;
  });
}

/** Moves a top-level field into a step at `index` (removing it from its current step). */
export function moveFieldToStep(
  schema: FormSchema,
  name: string,
  stepId: string,
  index?: number,
): FormSchema {
  requireField(schema, name);
  if (!schema.steps?.some((s) => s.id === stepId)) throw new BuilderError(`Step "${stepId}" does not exist`);
  const steps = schema.steps.map((step) => {
    const fields = step.fields.filter((f) => f !== name);
    if (step.id === stepId) fields.splice(clampIndex(index, fields.length), 0, name);
    return { ...step, fields };
  });
  return { ...schema, steps };
}

type FieldPatch = Partial<Omit<FieldSchema, 'name' | 'type'>> & Record<string, unknown>;

/** Updates field properties. Use `renameField` / `changeFieldType` for name and type. */
export function updateField(schema: FormSchema, path: FieldPath, patch: FieldPatch): FormSchema {
  const field = requireField(schema, path);
  if ('name' in patch || 'type' in patch) {
    throw new BuilderError('Use renameField / changeFieldType to change name or type');
  }
  const updated = { ...field, ...patch } as FieldSchema;
  // `undefined` in a patch means "remove the property".
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete (updated as unknown as Record<string, unknown>)[key];
  }
  return replaceFieldsAt(schema, parentPath(path), (fields) =>
    fields.map((f) => (f.name === field.name ? updated : f)),
  );
}

/**
 * Renames a field and rewrites every condition and step that points at it,
 * so the form keeps behaving the same.
 */
export function renameField(schema: FormSchema, path: FieldPath, newName: string): AddFieldResult {
  const field = requireField(schema, path);
  const parent = parentPath(path);
  if (newName === field.name) return { schema, path };
  if (!NAME_RE.test(newName)) {
    throw new BuilderError(`"${newName}" is not a valid name (letters, digits and _; not starting with a digit)`);
  }
  if (fieldsAt(schema, parent)!.some((f) => f.name === newName)) {
    throw new BuilderError(`A field named "${newName}" already exists here`);
  }

  // Rewrite references first, while the old name still resolves.
  const referencesUpdated: FormSchema = {
    ...schema,
    fields: renameReferences(schema, schema.fields, path, newName),
  };
  const renamed = replaceFieldsAt(referencesUpdated, parent, (fields) =>
    fields.map((f) => (f.name === field.name ? ({ ...f, name: newName } as FieldSchema) : f)),
  );
  const steps = parent === '' ? renameInSteps(renamed.steps, field.name, newName) : renamed.steps;
  return { schema: withSteps(renamed, steps), path: childPath(parent, newName) };
}

/**
 * Changes a field's type, keeping what still makes sense: label, description,
 * conditions and compatible validation rules. Options, sub-fields and default
 * values are added or dropped as needed.
 */
export function changeFieldType(schema: FormSchema, path: FieldPath, type: FieldType): FormSchema {
  const field = requireField(schema, path);
  if (field.type === type) return schema;

  const allowed = RULES_BY_TYPE[type];
  const { defaultValue: _d, ...base } = field as FieldSchema & { defaultValue?: unknown };
  const common: Record<string, unknown> = { ...base, type };
  delete common.options;
  delete common.fields;
  delete common.itemLabel;
  delete common.step;

  const validations = field.validations?.filter((rule) => allowed.includes(rule.type));
  if (validations && validations.length > 0) common.validations = validations;
  else delete common.validations;

  if (CHOICE_TYPES.has(type)) {
    common.options = 'options' in field && field.options.length > 0 ? field.options : defaultOptions();
  }
  if (type === 'array') {
    common.fields = (createField('array', []) as ArrayField).fields;
    common.itemLabel = { 'zh-TW': '項目', en: 'Item' };
  }

  const next = common as unknown as FieldSchema;
  return replaceFieldsAt(schema, parentPath(path), (fields) =>
    fields.map((f) => (f.name === field.name ? next : f)),
  );
}

// ---------------------------------------------------------------------------
// Step operations
// ---------------------------------------------------------------------------

/** Turns a single-page form into a one-step wizard holding every field. */
export function enableSteps(schema: FormSchema): FormSchema {
  if (schema.steps && schema.steps.length > 0) return schema;
  return {
    ...schema,
    steps: [{ id: 'step1', title: { 'zh-TW': '步驟 1', en: 'Step 1' }, fields: schema.fields.map((f) => f.name) }],
  };
}

/** Back to a single page; field order follows the former step order. */
export function disableSteps(schema: FormSchema): FormSchema {
  if (!schema.steps) return schema;
  const order = schema.steps.flatMap((s) => s.fields);
  const byName = new Map(schema.fields.map((f) => [f.name, f]));
  const ordered = [
    ...order.map((n) => byName.get(n)).filter((f): f is FieldSchema => f !== undefined),
    ...schema.fields.filter((f) => !order.includes(f.name)),
  ];
  return withSteps({ ...schema, fields: ordered }, undefined);
}

export function addStep(schema: FormSchema, title?: StepSchema['title']): { schema: FormSchema; stepId: string } {
  const base = enableSteps(schema);
  const steps = base.steps!;
  const id = uniqueName('step', steps.map((s) => s.id));
  const n = steps.length + 1;
  const step: StepSchema = { id, title: title ?? { 'zh-TW': `步驟 ${n}`, en: `Step ${n}` }, fields: [] };
  return { schema: { ...base, steps: [...steps, step] }, stepId: id };
}

export function updateStep(
  schema: FormSchema,
  stepId: string,
  patch: Partial<Pick<StepSchema, 'title' | 'description'>>,
): FormSchema {
  if (!schema.steps?.some((s) => s.id === stepId)) throw new BuilderError(`Step "${stepId}" does not exist`);
  return { ...schema, steps: schema.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) };
}

/**
 * Removes a step. Its fields move to the previous step (or the next one when
 * the first step is removed). Removing the last remaining step turns steps off.
 */
export function removeStep(schema: FormSchema, stepId: string): FormSchema {
  const steps = schema.steps ?? [];
  const index = steps.findIndex((s) => s.id === stepId);
  if (index < 0) throw new BuilderError(`Step "${stepId}" does not exist`);
  if (steps.length === 1) return disableSteps(schema);

  const removed = steps[index]!;
  const heirIndex = index > 0 ? index - 1 : 1;
  const next = steps
    .map((s, i) => (i === heirIndex ? { ...s, fields: index > 0 ? [...s.fields, ...removed.fields] : [...removed.fields, ...s.fields] } : s))
    .filter((s) => s.id !== stepId);
  return { ...schema, steps: next };
}

export function moveStep(schema: FormSchema, stepId: string, toIndex: number): FormSchema {
  const steps = schema.steps ?? [];
  const step = steps.find((s) => s.id === stepId);
  if (!step) throw new BuilderError(`Step "${stepId}" does not exist`);
  const list = steps.filter((s) => s.id !== stepId);
  list.splice(clampIndex(toIndex, list.length), 0, step);
  return { ...schema, steps: list };
}
