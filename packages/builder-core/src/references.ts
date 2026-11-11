import {
  conditionDependencies,
  type Condition,
  type FieldSchema,
  type FormSchema,
} from '@schema-form-kit/core';
import { childPath, parentPath, walkFields, type FieldPath } from './tree';

export interface FieldReference {
  /** The field whose condition mentions the target. */
  from: FieldPath;
  /** Which property holds the condition. */
  property: 'visibleWhen' | 'required';
}

/**
 * Resolves the first segment of a condition path written on a field at
 * `scopeParent` to the field it targets, following the runtime rule: inside an
 * array item, sibling names shadow top-level names.
 */
function resolveTarget(
  schema: FormSchema,
  scopeParent: FieldPath,
  dependency: string,
): FieldPath | undefined {
  const head = dependency.split('.')[0] as string;
  if (scopeParent !== '') {
    let siblings: FieldSchema[] = schema.fields;
    for (const name of scopeParent.split('.')) {
      const group = siblings.find((f) => f.name === name);
      siblings = group && group.type === 'array' ? group.fields : [];
    }
    if (siblings.some((f) => f.name === head)) return childPath(scopeParent, head);
  }
  return schema.fields.some((f) => f.name === head) ? head : undefined;
}

/** Every condition that depends on the field at `target`. */
export function findReferences(schema: FormSchema, target: FieldPath): FieldReference[] {
  const refs: FieldReference[] = [];
  walkFields(schema.fields, (field, path) => {
    const scope = parentPath(path);
    const check = (cond: Condition | undefined, property: FieldReference['property']) => {
      if (!cond) return;
      const hits = conditionDependencies(cond).some(
        (dep) => resolveTarget(schema, scope, dep) === target,
      );
      if (hits) refs.push({ from: path, property });
    };
    check(field.visibleWhen, 'visibleWhen');
    if (typeof field.required === 'object') check(field.required, 'required');
  });
  return refs;
}

function renameInCondition(
  cond: Condition,
  shouldRename: (dependency: string) => boolean,
  newName: string,
): Condition {
  if ('all' in cond)
    return { all: cond.all.map((c) => renameInCondition(c, shouldRename, newName)) };
  if ('any' in cond)
    return { any: cond.any.map((c) => renameInCondition(c, shouldRename, newName)) };
  if ('not' in cond) return { not: renameInCondition(cond.not, shouldRename, newName) };
  if (!shouldRename(cond.field)) return cond;
  const rest = cond.field.split('.').slice(1);
  return { ...cond, field: [newName, ...rest].join('.') };
}

/**
 * Rewrites every condition that points at `target` so it uses `newName`.
 * Must be called with the schema *before* the rename, so targets still resolve.
 */
export function renameReferences(
  schema: FormSchema,
  fields: FieldSchema[],
  target: FieldPath,
  newName: string,
  parent: FieldPath = '',
): FieldSchema[] {
  return fields.map((field) => {
    const path = childPath(parent, field.name);
    const shouldRename = (dep: string) => resolveTarget(schema, parent, dep) === target;
    let next: FieldSchema = field;
    if (field.visibleWhen) {
      next = { ...next, visibleWhen: renameInCondition(field.visibleWhen, shouldRename, newName) };
    }
    if (typeof field.required === 'object') {
      next = { ...next, required: renameInCondition(field.required, shouldRename, newName) };
    }
    if (next.type === 'array') {
      next = { ...next, fields: renameReferences(schema, next.fields, target, newName, path) };
    }
    return next;
  });
}
