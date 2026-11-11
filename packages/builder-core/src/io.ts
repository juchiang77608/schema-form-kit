import { checkSchema, type FieldSchema, type FormSchema, type SchemaIssue } from '@schema-form-kit/core';
import { palette } from './palette';

export type ImportResult =
  | { ok: true; schema: FormSchema; warnings: SchemaIssue[] }
  | { ok: false; errors: SchemaIssue[] };

const FIELD_TYPES = new Set(palette.map((p) => p.type));

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isText = (v: unknown): boolean =>
  typeof v === 'string' || (isObject(v) && Object.values(v).every((x) => typeof x === 'string'));

function checkFieldShape(value: unknown, at: string, errors: SchemaIssue[]): void {
  if (!isObject(value)) {
    errors.push({ path: at, message: 'Field must be an object' });
    return;
  }
  if (typeof value.name !== 'string') errors.push({ path: `${at}.name`, message: 'Missing "name"' });
  if (typeof value.type !== 'string' || !FIELD_TYPES.has(value.type as FieldSchema['type'])) {
    errors.push({ path: `${at}.type`, message: `Unknown type "${String(value.type)}"` });
  }
  if (!isText(value.label)) errors.push({ path: `${at}.label`, message: 'Missing "label"' });
  if (value.type === 'array') {
    if (!Array.isArray(value.fields)) {
      errors.push({ path: `${at}.fields`, message: 'A group needs a "fields" array' });
    } else {
      value.fields.forEach((child, i) => checkFieldShape(child, `${at}.fields[${i}]`, errors));
    }
  }
  if (['select', 'radio', 'checkbox'].includes(String(value.type)) && !Array.isArray(value.options)) {
    errors.push({ path: `${at}.options`, message: 'Choice fields need an "options" array' });
  }
}

/**
 * Parses JSON from a file or the clipboard.
 * Structural problems (not a form at all) are errors; semantic problems that
 * `checkSchema` finds are returned as warnings so the user can fix them in the builder.
 */
export function importSchema(json: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (error) {
    return { ok: false, errors: [{ path: '', message: `Invalid JSON: ${(error as Error).message}` }] };
  }

  const errors: SchemaIssue[] = [];
  if (!isObject(data)) return { ok: false, errors: [{ path: '', message: 'Expected an object' }] };
  if (typeof data.id !== 'string' || data.id === '') errors.push({ path: 'id', message: 'Missing "id"' });
  if (data.version !== 1) errors.push({ path: 'version', message: 'Only version 1 is supported' });
  if (!isText(data.title)) errors.push({ path: 'title', message: 'Missing "title"' });
  if (!Array.isArray(data.fields)) {
    errors.push({ path: 'fields', message: '"fields" must be an array' });
  } else {
    data.fields.forEach((f, i) => checkFieldShape(f, `fields[${i}]`, errors));
  }
  if (data.steps !== undefined) {
    if (!Array.isArray(data.steps)) {
      errors.push({ path: 'steps', message: '"steps" must be an array' });
    } else {
      data.steps.forEach((s, i) => {
        if (!isObject(s) || typeof s.id !== 'string' || !Array.isArray(s.fields)) {
          errors.push({ path: `steps[${i}]`, message: 'A step needs "id" and "fields"' });
        }
      });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  const schema = data as unknown as FormSchema;
  return { ok: true, schema, warnings: checkSchema(schema) };
}

export function exportSchema(schema: FormSchema): string {
  return `${JSON.stringify(schema, null, 2)}\n`;
}
