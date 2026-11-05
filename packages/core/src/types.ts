/**
 * Public schema types for schema-form-kit.
 *
 * A form is described by plain JSON so it can be stored, versioned and edited
 * by the builder without any framework code.
 */

export type FieldType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'array';

export type Locale = 'zh-TW' | 'en';

/** A string that can be translated: either one string, or one per locale. */
export type I18nText = string | Partial<Record<Locale, string>>;

export interface Option {
  label: I18nText;
  value: string | number;
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

export type ComparisonOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'includes'
  | 'empty'
  | 'notEmpty';

/**
 * Compares the value at `field` (a dot path) with `value`.
 * Inside an array item, the path is resolved against the item first,
 * then against the form root.
 */
export interface FieldCondition {
  field: string;
  op: ComparisonOperator;
  value?: unknown;
}

export interface AllCondition {
  all: Condition[];
}

export interface AnyCondition {
  any: Condition[];
}

export interface NotCondition {
  not: Condition;
}

export type Condition = FieldCondition | AllCondition | AnyCondition | NotCondition;

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------

export type ValidationRule =
  | { type: 'minLength'; value: number; message?: I18nText }
  | { type: 'maxLength'; value: number; message?: I18nText }
  | { type: 'min'; value: number; message?: I18nText }
  | { type: 'max'; value: number; message?: I18nText }
  | { type: 'pattern'; value: string; message?: I18nText }
  | { type: 'minItems'; value: number; message?: I18nText }
  | { type: 'maxItems'; value: number; message?: I18nText }
  | { type: 'custom'; name: string; params?: Record<string, unknown>; message?: I18nText };

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

interface BaseField {
  /** Key in the value object. Must be unique among siblings. */
  name: string;
  type: FieldType;
  label: I18nText;
  description?: I18nText;
  placeholder?: I18nText;
  /** `true`, or a condition that makes the field required. */
  required?: boolean | Condition;
  /** When set, the field is only shown (and validated) if the condition holds. */
  visibleWhen?: Condition;
  validations?: ValidationRule[];
  defaultValue?: unknown;
  /** Layout hint: number of columns out of 12. */
  colSpan?: number;
}

export interface TextField extends BaseField {
  type: 'text' | 'email' | 'textarea';
  defaultValue?: string;
}

export interface NumberField extends BaseField {
  type: 'number';
  defaultValue?: number;
  step?: number;
}

export interface DateField extends BaseField {
  type: 'date';
  /** ISO date string, YYYY-MM-DD. */
  defaultValue?: string;
}

export interface ChoiceField extends BaseField {
  type: 'select' | 'radio';
  options: Option[];
  defaultValue?: string | number;
}

export interface CheckboxField extends BaseField {
  type: 'checkbox';
  options: Option[];
  defaultValue?: Array<string | number>;
}

export interface SwitchField extends BaseField {
  type: 'switch';
  defaultValue?: boolean;
}

export interface ArrayField extends BaseField {
  type: 'array';
  /** Fields of a single item. */
  fields: FieldSchema[];
  /** Label for one item, e.g. "Work experience". */
  itemLabel?: I18nText;
  defaultValue?: Array<Record<string, unknown>>;
}

export type FieldSchema =
  | TextField
  | NumberField
  | DateField
  | ChoiceField
  | CheckboxField
  | SwitchField
  | ArrayField;

export interface StepSchema {
  id: string;
  title: I18nText;
  description?: I18nText;
  /** Names of top-level fields shown in this step, in order. */
  fields: string[];
}

export interface FormSchema {
  id: string;
  /** Schema format version, for future migrations. */
  version: 1;
  title: I18nText;
  description?: I18nText;
  fields: FieldSchema[];
  /** When present the form is rendered as a multi-step wizard. */
  steps?: StepSchema[];
  submitLabel?: I18nText;
}

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

export type FormValues = Record<string, unknown>;

/** Errors keyed by value path, e.g. `"experiences.0.company"`. */
export type FormErrors = Record<string, string[]>;

export interface CustomValidatorContext {
  values: FormValues;
  path: string;
  field: FieldSchema;
  params: Record<string, unknown>;
}

/** Returns `true` when valid, or an error message. */
export type CustomValidator = (value: unknown, ctx: CustomValidatorContext) => true | string;

export interface ValidateOptions {
  locale?: Locale;
  customValidators?: Record<string, CustomValidator>;
}
