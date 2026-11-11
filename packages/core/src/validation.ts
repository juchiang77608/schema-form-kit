import { isEmpty, type ConditionContext } from './conditions';
import { effectiveValues, fieldsOfStep, getSteps, isFieldRequired, isFieldVisible } from './fields';
import { DEFAULT_LOCALE, format, messages, t, type MessageKey } from './i18n';
import { getPath, joinPath } from './path';
import type {
  FieldSchema,
  FormErrors,
  FormSchema,
  FormValues,
  I18nText,
  Locale,
  ValidateOptions,
  ValidationRule,
} from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

interface RuleContext {
  label: string;
  locale: Locale;
}

function msg(
  key: MessageKey,
  ctx: RuleContext,
  params: Record<string, unknown> = {},
  override?: I18nText,
): string {
  const template = override !== undefined ? t(override, ctx.locale) : messages[ctx.locale][key];
  return format(template, { label: ctx.label, ...params });
}

function checkType(field: FieldSchema, value: unknown, rc: RuleContext): string | null {
  switch (field.type) {
    case 'email':
      return typeof value === 'string' && EMAIL_RE.test(value.trim()) ? null : msg('email', rc);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? null : msg('number', rc);
    case 'date':
      return typeof value === 'string' && isValidDate(value) ? null : msg('date', rc);
    case 'select':
    case 'radio':
      return field.options.some((o) => o.value === value) ? null : msg('option', rc);
    case 'checkbox':
      return Array.isArray(value) && value.every((v) => field.options.some((o) => o.value === v))
        ? null
        : msg('option', rc);
    default:
      return null;
  }
}

function lengthOf(value: unknown): number | undefined {
  if (typeof value === 'string') return value.length;
  if (Array.isArray(value)) return value.length;
  return undefined;
}

function checkRule(
  rule: ValidationRule,
  value: unknown,
  rc: RuleContext,
  field: FieldSchema,
  path: string,
  values: FormValues,
  opts: ValidateOptions,
): string | null {
  switch (rule.type) {
    case 'minLength': {
      const len = lengthOf(value);
      return len !== undefined && len < rule.value
        ? msg('minLength', rc, { value: rule.value }, rule.message)
        : null;
    }
    case 'maxLength': {
      const len = lengthOf(value);
      return len !== undefined && len > rule.value
        ? msg('maxLength', rc, { value: rule.value }, rule.message)
        : null;
    }
    case 'min':
      return typeof value === 'number' && value < rule.value
        ? msg('min', rc, { value: rule.value }, rule.message)
        : null;
    case 'max':
      return typeof value === 'number' && value > rule.value
        ? msg('max', rc, { value: rule.value }, rule.message)
        : null;
    case 'pattern':
      return typeof value === 'string' && !new RegExp(rule.value).test(value)
        ? msg('pattern', rc, { value: rule.value }, rule.message)
        : null;
    case 'minItems':
      return Array.isArray(value) && value.length < rule.value
        ? msg('minItems', rc, { value: rule.value }, rule.message)
        : null;
    case 'maxItems':
      return Array.isArray(value) && value.length > rule.value
        ? msg('maxItems', rc, { value: rule.value }, rule.message)
        : null;
    case 'custom': {
      const validator = opts.customValidators?.[rule.name];
      if (!validator) throw new Error(`Custom validator "${rule.name}" is not registered`);
      const result = validator(value, { values, path, field, params: rule.params ?? {} });
      if (result === true) return null;
      return rule.message !== undefined ? msg('pattern', rc, {}, rule.message) : result;
    }
    default: {
      const exhaustive: never = rule;
      throw new Error(`Unknown rule: ${JSON.stringify(exhaustive)}`);
    }
  }
}

const ARRAY_RULES = new Set<ValidationRule['type']>(['minItems', 'maxItems']);

/**
 * Validates one field (and, for arrays, every item) and writes errors into
 * `errors`. Hidden fields are skipped entirely.
 */
function validateFieldInto(
  field: FieldSchema,
  path: string,
  ctx: ConditionContext,
  values: FormValues,
  opts: ValidateOptions,
  errors: FormErrors,
): void {
  if (!isFieldVisible(field, ctx)) return;

  const locale = opts.locale ?? DEFAULT_LOCALE;
  const rc: RuleContext = { label: t(field.label, locale), locale };
  const value = getPath(values, path);
  const fieldErrors: string[] = [];
  const empty =
    field.type === 'switch' ? value !== true && isFieldRequired(field, ctx) : isEmpty(value);

  if (empty) {
    if (isFieldRequired(field, ctx)) fieldErrors.push(msg('required', rc));
    // Array size rules still apply to an empty list; other rules skip empty values.
    for (const rule of field.validations ?? []) {
      if (!ARRAY_RULES.has(rule.type)) continue;
      const error = checkRule(rule, value, rc, field, path, values, opts);
      if (error) fieldErrors.push(error);
    }
  } else {
    const typeError = checkType(field, value, rc);
    if (typeError) {
      fieldErrors.push(typeError);
    } else {
      for (const rule of field.validations ?? []) {
        const error = checkRule(rule, value, rc, field, path, values, opts);
        if (error) fieldErrors.push(error);
      }
    }
  }

  if (fieldErrors.length > 0) errors[path] = fieldErrors;

  if (field.type === 'array' && Array.isArray(value)) {
    value.forEach((item, index) => {
      const scope = (item ?? {}) as Record<string, unknown>;
      for (const child of field.fields) {
        validateFieldInto(
          child,
          joinPath(path, index, child.name),
          { root: ctx.root, scope },
          values,
          opts,
          errors,
        );
      }
    });
  }
}

/**
 * Validates the given top-level fields against `values`.
 * Prefer `validateForm` / `validateStep`, which first drop hidden values so that
 * conditions never depend on answers the user can no longer see.
 */
export function validateFields(
  fields: FieldSchema[],
  values: FormValues,
  opts: ValidateOptions = {},
): FormErrors {
  const errors: FormErrors = {};
  const ctx: ConditionContext = { root: values };
  for (const field of fields) validateFieldInto(field, field.name, ctx, values, opts, errors);
  return errors;
}

export function validateForm(
  schema: FormSchema,
  values: FormValues,
  opts: ValidateOptions = {},
): FormErrors {
  return validateFields(schema.fields, effectiveValues(schema, values), opts);
}

export function validateStep(
  schema: FormSchema,
  stepIndex: number,
  values: FormValues,
  opts: ValidateOptions = {},
): FormErrors {
  const step = getSteps(schema)[stepIndex];
  if (!step) throw new RangeError(`Step ${stepIndex} does not exist`);
  return validateFields(fieldsOfStep(schema, step), effectiveValues(schema, values), opts);
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Errors for `path` itself and everything below it (useful for array items). */
export function errorsUnder(errors: FormErrors, path: string): FormErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([key]) => key === path || key.startsWith(`${path}.`)),
  );
}
