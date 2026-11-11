import { conditionDependencies } from './conditions';
import type { Condition, FieldSchema, FormSchema } from './types';

export interface SchemaIssue {
  path: string;
  message: string;
}

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const CHOICE_TYPES = new Set(['select', 'radio', 'checkbox']);

function checkFields(
  fields: FieldSchema[],
  basePath: string,
  known: Set<string>,
  issues: SchemaIssue[],
): void {
  const seen = new Set<string>();
  fields.forEach((field, index) => {
    const at = `${basePath}[${index}]`;
    if (!NAME_RE.test(field.name)) {
      issues.push({ path: `${at}.name`, message: `Invalid field name "${field.name}"` });
    }
    if (seen.has(field.name)) {
      issues.push({ path: `${at}.name`, message: `Duplicate field name "${field.name}"` });
    }
    seen.add(field.name);

    if (CHOICE_TYPES.has(field.type)) {
      const options = 'options' in field ? field.options : [];
      if (!options || options.length === 0) {
        issues.push({
          path: `${at}.options`,
          message: `"${field.name}" needs at least one option`,
        });
      }
    }

    const checkCondition = (cond: Condition | undefined, key: string): void => {
      if (!cond) return;
      for (const dep of conditionDependencies(cond)) {
        const head = dep.split('.')[0] as string;
        if (!known.has(head)) {
          issues.push({ path: `${at}.${key}`, message: `Unknown field "${dep}" in condition` });
        }
        if (head === field.name) {
          issues.push({ path: `${at}.${key}`, message: `"${field.name}" depends on itself` });
        }
      }
    };
    checkCondition(field.visibleWhen, 'visibleWhen');
    if (typeof field.required === 'object') checkCondition(field.required, 'required');

    for (const rule of field.validations ?? []) {
      if (rule.type === 'pattern') {
        try {
          new RegExp(rule.value);
        } catch {
          issues.push({ path: `${at}.validations`, message: `Invalid pattern "${rule.value}"` });
        }
      }
    }

    if (field.type === 'array') {
      const itemKnown = new Set([...known, ...field.fields.map((f) => f.name)]);
      checkFields(field.fields, `${at}.fields`, itemKnown, issues);
    }
  });
}

/**
 * Static checks for a schema: names, options, condition references, steps.
 * Returns an empty array when the schema is usable.
 */
export function checkSchema(schema: FormSchema): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  if (schema.version !== 1) {
    issues.push({
      path: 'version',
      message: `Unsupported schema version ${String(schema.version)}`,
    });
  }
  const topLevel = new Set(schema.fields.map((f) => f.name));
  checkFields(schema.fields, 'fields', topLevel, issues);

  if (schema.steps) {
    const placed = new Map<string, string>();
    schema.steps.forEach((step, index) => {
      for (const name of step.fields) {
        if (!topLevel.has(name)) {
          issues.push({ path: `steps[${index}].fields`, message: `Unknown field "${name}"` });
        }
        const other = placed.get(name);
        if (other !== undefined) {
          issues.push({
            path: `steps[${index}].fields`,
            message: `"${name}" is already placed in step "${other}"`,
          });
        }
        placed.set(name, step.id);
      }
    });
    for (const name of topLevel) {
      if (!placed.has(name)) {
        issues.push({ path: 'steps', message: `Field "${name}" is not placed in any step` });
      }
    }
  }
  return issues;
}
