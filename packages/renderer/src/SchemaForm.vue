<script setup lang="ts">
import { computed, nextTick, provide, ref, watch } from 'vue';
import {
  buildInitialValues,
  pruneHiddenValues,
  t,
  type CustomValidator,
  type FormErrors,
  type FormSchema,
  type FormValues,
  type Locale,
} from '@schema-form-kit/core';
import { FORM_CONTEXT, type FieldComponentMap } from './context';
import { useSchemaForm } from './composables/useSchemaForm';
import FieldRenderer from './FieldRenderer.vue';

const props = withDefaults(
  defineProps<{
    schema: FormSchema;
    modelValue?: FormValues;
    locale?: Locale;
    customValidators?: Record<string, CustomValidator>;
    /** Replace the built-in component for any field type. */
    components?: FieldComponentMap;
    /** Hide the title/description header. */
    hideHeader?: boolean;
  }>(),
  {
    modelValue: undefined,
    locale: 'zh-TW',
    customValidators: undefined,
    components: () => ({}),
    hideHeader: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [values: FormValues];
  /** Fired with visible values only (hidden fields are removed). */
  submit: [values: FormValues];
  invalid: [errors: FormErrors];
  'step-change': [index: number];
}>();

const form = useSchemaForm({
  schema: () => props.schema,
  locale: () => props.locale,
  initialValues: props.modelValue,
  customValidators: props.customValidators,
});

provide(FORM_CONTEXT, {
  schema: form.schema,
  values: form.values,
  visibleValues: form.visibleValues,
  locale: form.locale,
  components: computed(() => props.components),
  setValue: form.setValue,
  touch: form.touch,
  errorsFor: form.errorsFor,
  fieldRenderer: FieldRenderer,
});

// v-model support without feedback loops.
let lastEmitted: FormValues | undefined;
watch(form.values, (values) => {
  lastEmitted = values;
  emit('update:modelValue', values);
});
watch(
  () => props.modelValue,
  (incoming) => {
    if (incoming && incoming !== lastEmitted) {
      form.values.value = buildInitialValues(props.schema, incoming);
    }
  },
);
watch(form.stepIndex, (index) => emit('step-change', index));

const root = ref<HTMLFormElement>();
const multiStep = computed(() => form.steps.value.length > 1);

const labels = computed(() =>
  props.locale === 'en'
    ? { prev: 'Back', next: 'Next', submit: 'Submit', steps: 'Steps' }
    : { prev: '上一步', next: '下一步', submit: '送出', steps: '步驟' },
);
const submitLabel = computed(() =>
  props.schema.submitLabel ? t(props.schema.submitLabel, props.locale) : labels.value.submit,
);

async function focusFirstError(): Promise<void> {
  await nextTick();
  const target = root.value?.querySelector<HTMLElement>(
    '.sfk-field--invalid input, .sfk-field--invalid select, .sfk-field--invalid textarea, .sfk-field--invalid button',
  );
  target?.focus();
}

function onNext(): void {
  if (!form.next()) void focusFirstError();
}

function onSubmit(): void {
  if (multiStep.value && !form.isLastStep.value) {
    onNext();
    return;
  }
  if (form.validate()) {
    emit('submit', pruneHiddenValues(props.schema, form.values.value));
  } else {
    emit('invalid', form.errors.value);
    void focusFirstError();
  }
}

function onStepClick(index: number): void {
  if (!form.goTo(index)) void focusFirstError();
}

defineExpose({
  values: form.values,
  errors: form.errors,
  validate: form.validate,
  reset: form.reset,
  next: form.next,
  prev: form.prev,
  goTo: form.goTo,
  submit: onSubmit,
});
</script>

<template>
  <form ref="root" class="sfk-form" novalidate @submit.prevent="onSubmit">
    <header v-if="!hideHeader" class="sfk-header">
      <slot name="header" :schema="schema">
        <h2 class="sfk-title">{{ t(schema.title, locale) }}</h2>
        <p v-if="schema.description" class="sfk-form-description">
          {{ t(schema.description, locale) }}
        </p>
      </slot>
    </header>

    <nav v-if="multiStep" class="sfk-steps" :aria-label="labels.steps">
      <ol>
        <li
          v-for="(step, index) in form.steps.value"
          :key="step.id"
          class="sfk-step"
          :class="{
            'sfk-step--active': index === form.stepIndex.value,
            'sfk-step--done': index < form.stepIndex.value,
          }"
        >
          <button
            type="button"
            class="sfk-step__button"
            :aria-current="index === form.stepIndex.value ? 'step' : undefined"
            @click="onStepClick(index)"
          >
            <span class="sfk-step__index">{{ index + 1 }}</span>
            <span class="sfk-step__title">{{ t(step.title, locale) }}</span>
          </button>
        </li>
      </ol>
    </nav>

    <section class="sfk-body">
      <p v-if="multiStep && form.currentStep.value.description" class="sfk-step-description">
        {{ t(form.currentStep.value.description, locale) }}
      </p>
      <div class="sfk-grid">
        <FieldRenderer
          v-for="field in form.currentFields.value"
          :key="field.name"
          :field="field"
          :path="field.name"
        />
      </div>
    </section>

    <footer class="sfk-footer">
      <slot
        name="footer"
        :is-first-step="form.isFirstStep.value"
        :is-last-step="form.isLastStep.value"
        :prev="form.prev"
        :next="onNext"
      >
        <button
          v-if="multiStep && !form.isFirstStep.value"
          type="button"
          class="sfk-btn sfk-btn--secondary"
          @click="form.prev"
        >
          {{ labels.prev }}
        </button>
        <button
          v-if="multiStep && !form.isLastStep.value"
          type="button"
          class="sfk-btn sfk-btn--primary"
          @click="onNext"
        >
          {{ labels.next }}
        </button>
        <button v-else type="submit" class="sfk-btn sfk-btn--primary">{{ submitLabel }}</button>
      </slot>
    </footer>
  </form>
</template>
