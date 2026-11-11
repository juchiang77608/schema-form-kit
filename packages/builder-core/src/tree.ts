import type { ArrayField, FieldSchema, FormSchema } from '@schema-form-kit/core';

/**
 * A field is addressed by the chain of names from the top level, e.g.
 * `"experiences.company"` is the `company` field inside the `experiences` array.
 * Names (not indices) are used so that an address stays valid when fields move.
 */
export type FieldPath = string;

export function splitFieldPath(path: FieldPath): string[] {
  return path === '' ? [] : path.split('.');
}

export function parentPath(path: FieldPath): FieldPath {
  return splitFieldPath(path).slice(0, -1).join('.');
}

export function lastName(path: FieldPath): string {
  return splitFieldPath(path).at(-1) ?? '';
}

export function childPath(parent: FieldPath, name: string): FieldPath {
  return parent === '' ? name : `${parent}.${name}`;
}

/** Sibling list that holds the field at `parent` level (`""` = top level). */
export function fieldsAt(schema: FormSchema, parent: FieldPath): FieldSchema[] | undefined {
  let list: FieldSchema[] = schema.fields;
  for (const name of splitFieldPath(parent)) {
    const field = list.find((f) => f.name === name);
    if (!field || field.type !== 'array') return undefined;
    list = field.fields;
  }
  return list;
}

export function getField(schema: FormSchema, path: FieldPath): FieldSchema | undefined {
  return fieldsAt(schema, parentPath(path))?.find((f) => f.name === lastName(path));
}

/** Returns a new schema in which the sibling list at `parent` is replaced. */
export function replaceFieldsAt(
  schema: FormSchema,
  parent: FieldPath,
  update: (fields: FieldSchema[]) => FieldSchema[],
): FormSchema {
  const names = splitFieldPath(parent);

  const walk = (fields: FieldSchema[], depth: number): FieldSchema[] => {
    if (depth === names.length) return update(fields);
    const target = names[depth];
    let found = false;
    const next = fields.map((field) => {
      if (field.name !== target) return field;
      if (field.type !== 'array')
        throw new Error(`"${names.slice(0, depth + 1).join('.')}" is not a group`);
      found = true;
      return { ...field, fields: walk(field.fields, depth + 1) } satisfies ArrayField;
    });
    if (!found) throw new Error(`Field "${names.slice(0, depth + 1).join('.')}" does not exist`);
    return next;
  };

  return { ...schema, fields: walk(schema.fields, 0) };
}

/** Visits every field depth-first with its path. */
export function walkFields(
  fields: FieldSchema[],
  visit: (field: FieldSchema, path: FieldPath) => void,
  parent: FieldPath = '',
): void {
  for (const field of fields) {
    const path = childPath(parent, field.name);
    visit(field, path);
    if (field.type === 'array') walkFields(field.fields, visit, path);
  }
}

/** Maps every field (depth-first, children first) to a new field. */
export function mapFields(
  fields: FieldSchema[],
  map: (field: FieldSchema, path: FieldPath) => FieldSchema,
  parent: FieldPath = '',
): FieldSchema[] {
  return fields.map((field) => {
    const path = childPath(parent, field.name);
    const withChildren: FieldSchema =
      field.type === 'array' ? { ...field, fields: mapFields(field.fields, map, path) } : field;
    return map(withChildren, path);
  });
}
