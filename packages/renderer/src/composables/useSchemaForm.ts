import { computed, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';
import {
  buildInitialValues,
  effectiveValues,
  errorsUnder,
  fieldsOfStep,
  getSteps,
  hasErrors,
  setPath,
  validateForm,
  type CustomValidator,
  type FormErrors,
  type FormSchema,
  type FormValues,
  type Locale,
} from '@schema-form-kit/core';

export interface UseSchemaFormOptions {
  schema: MaybeRefOrGetter<FormSchema>;
  initialValues?: FormValues;
  locale?: MaybeRefOrGetter<Locale>;
  customValidators?: Record<string, CustomValidator>;
}

/**
 * Headless form state: values, live validation, touched tracking and wizard
 * navigation. `<SchemaForm>` is built on top of it; you can use it directly to
 * render a completely custom UI.
 */
export function useSchemaForm(options: UseSchemaFormOptions) {
  const schema = computed(() => toValue(options.schema));
  const locale = computed<Locale>(() => toValue(options.locale) ?? 'zh-TW');

  const values = ref<FormValues>(buildInitialValues(schema.value, options.initialValues));
  const touched = shallowRef(new Set<string>());
  /** Steps on which "next" or "submit" was attempted: all their errors are shown. */
  const attemptedSteps = shallowRef(new Set<number>());
  const stepIndex = ref(0);

  const steps = computed(() => getSteps(schema.value));
  const currentStep = computed(() => steps.value[stepIndex.value] ?? steps.value[0]!);
  const currentFields = computed(() => fieldsOfStep(schema.value, currentStep.value));
  const isFirstStep = computed(() => stepIndex.value === 0);
  const isLastStep = computed(() => stepIndex.value >= steps.value.length - 1);

  /** Values without hidden fields; drives visibility so hiding cascades. */
  const visibleValues = computed<FormValues>(() => effectiveValues(schema.value, values.value));

  const errors = computed<FormErrors>(() =>
    validateForm(schema.value, values.value, {
      locale: locale.value,
      customValidators: options.customValidators,
    }),
  );

  /** Maps a top-level field name to the index of the step that holds it. */
  const stepOfField = computed(() => {
    const map = new Map<string, number>();
    steps.value.forEach((step, index) => step.fields.forEach((name) => map.set(name, index)));
    return map;
  });

  // When the schema changes (e.g. in the playground) keep compatible values.
  watch(schema, (next) => {
    values.value = buildInitialValues(next, values.value);
    if (stepIndex.value >= getSteps(next).length) stepIndex.value = 0;
  });

  function setValue(path: string, value: unknown): void {
    values.value = setPath(values.value, path, value);
  }

  function touch(path: string): void {
    if (touched.value.has(path)) return;
    touched.value = new Set(touched.value).add(path);
  }

  function errorsFor(path: string): string[] {
    const list = errors.value[path];
    if (!list) return [];
    const step = stepOfField.value.get(path.split('.')[0] as string) ?? 0;
    return touched.value.has(path) || attemptedSteps.value.has(step) ? list : [];
  }

  function stepErrors(index: number): FormErrors {
    const names = steps.value[index]?.fields ?? [];
    return Object.assign({}, ...names.map((name) => errorsUnder(errors.value, name))) as FormErrors;
  }

  function attempt(indices: number[]): void {
    const next = new Set(attemptedSteps.value);
    indices.forEach((i) => next.add(i));
    attemptedSteps.value = next;
  }

  /** Validates the current step; moves forward when valid. */
  function next(): boolean {
    attempt([stepIndex.value]);
    if (hasErrors(stepErrors(stepIndex.value))) return false;
    if (!isLastStep.value) stepIndex.value += 1;
    return true;
  }

  function prev(): void {
    if (!isFirstStep.value) stepIndex.value -= 1;
  }

  /** Jumps to a step; only backwards, or forwards over valid steps. */
  function goTo(index: number): boolean {
    if (index < 0 || index >= steps.value.length) return false;
    for (let i = stepIndex.value; i < index; i += 1) {
      attempt([i]);
      if (hasErrors(stepErrors(i))) {
        stepIndex.value = i;
        return false;
      }
    }
    stepIndex.value = index;
    return true;
  }

  /** Validates everything; jumps to the first step with errors. */
  function validate(): boolean {
    attempt(steps.value.map((_, i) => i));
    if (!hasErrors(errors.value)) return true;
    const firstBad = steps.value.findIndex((_, i) => hasErrors(stepErrors(i)));
    if (firstBad >= 0) stepIndex.value = firstBad;
    return false;
  }

  function reset(nextValues: FormValues = {}): void {
    values.value = buildInitialValues(schema.value, nextValues);
    touched.value = new Set();
    attemptedSteps.value = new Set();
    stepIndex.value = 0;
  }

  return {
    schema,
    locale,
    values,
    visibleValues,
    errors,
    steps,
    stepIndex,
    currentStep,
    currentFields,
    isFirstStep,
    isLastStep,
    setValue,
    touch,
    errorsFor,
    stepErrors,
    next,
    prev,
    goTo,
    validate,
    reset,
  };
}

export type SchemaFormState = ReturnType<typeof useSchemaForm>;
