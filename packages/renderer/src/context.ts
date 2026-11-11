import { inject, type Component, type ComputedRef, type InjectionKey, type Ref } from 'vue';
import type { FieldSchema, FieldType, FormSchema, FormValues, Locale } from '@schema-form-kit/core';

/** Props every field component receives. Use them to build your own field components. */
export interface FieldComponentProps {
  /** The field definition (narrow it with `field.type`). */
  field: FieldSchema;
  /** Value path, e.g. `"experiences.0.company"`. */
  path: string;
  /** DOM id for the input; the label points at it. */
  inputId: string;
  /** DOM id of the label, for group widgets that use `aria-labelledby`. */
  labelId: string;
  /** id of the element holding the error / description text. */
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  locale: Locale;
}

export type FieldComponentMap = Partial<Record<FieldType, Component>>;

export interface FormContext {
  schema: ComputedRef<FormSchema>;
  values: Ref<FormValues>;
  /** Values with hidden fields removed; conditions are evaluated against these. */
  visibleValues: ComputedRef<FormValues>;
  locale: ComputedRef<Locale>;
  components: ComputedRef<FieldComponentMap>;
  setValue: (path: string, value: unknown) => void;
  touch: (path: string) => void;
  /** Errors to display for a path (empty until touched or a submit was attempted). */
  errorsFor: (path: string) => string[];
  /** Renderer for nested fields; injected to avoid a circular import. */
  fieldRenderer: Component;
}

export const FORM_CONTEXT: InjectionKey<FormContext> = Symbol('schema-form-kit');

export function useFormContext(): FormContext {
  const ctx = inject(FORM_CONTEXT);
  if (!ctx) throw new Error('Field components must be used inside <SchemaForm>');
  return ctx;
}

export function inputIdFor(schemaId: string, path: string): string {
  return `sfk-${schemaId}-${path.replace(/[^A-Za-z0-9_-]/g, '-')}`;
}
