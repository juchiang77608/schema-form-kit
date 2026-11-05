<script setup lang="ts">
import { computed } from 'vue';
import {
  getPath,
  isFieldRequired,
  isFieldVisible,
  t,
  type FieldSchema,
} from '@schema-form-kit/core';
import { inputIdFor, useFormContext } from './context';
import { defaultComponents } from './fields';

const props = defineProps<{
  field: FieldSchema;
  path: string;
  /** The array item this field belongs to, if any. */
  scope?: Record<string, unknown>;
}>();

const ctx = useFormContext();

const conditionCtx = computed(() => ({ root: ctx.visibleValues.value, scope: props.scope }));
const visible = computed(() => isFieldVisible(props.field, conditionCtx.value));
const required = computed(() => isFieldRequired(props.field, conditionCtx.value));
const errors = computed(() => ctx.errorsFor(props.path));

const inputId = computed(() => inputIdFor(ctx.schema.value.id, props.path));
const labelId = computed(() => `${inputId.value}-label`);
const descriptionId = computed(() => `${inputId.value}-desc`);
const errorId = computed(() => `${inputId.value}-error`);
const description = computed(() => t(props.field.description, ctx.locale.value));
const describedBy = computed(() => {
  const ids = [
    errors.value.length > 0 ? errorId.value : '',
    description.value ? descriptionId.value : '',
  ].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
});

const component = computed(
  () => ctx.components.value[props.field.type] ?? defaultComponents[props.field.type],
);
const value = computed(() => getPath(ctx.values.value, props.path));
const isGroup = computed(() => ['radio', 'checkbox', 'array'].includes(props.field.type));
const span = computed(() => Math.min(Math.max(props.field.colSpan ?? 12, 1), 12));
</script>

<template>
  <div
    v-if="visible"
    class="sfk-field"
    :class="[`sfk-field--${field.type}`, { 'sfk-field--invalid': errors.length > 0 }]"
    :style="{ gridColumn: `span ${span}` }"
    :data-path="path"
  >
    <label :id="labelId" class="sfk-label" :for="isGroup ? undefined : inputId">
      {{ t(field.label, ctx.locale.value) }}
      <span v-if="required" class="sfk-required" aria-hidden="true">*</span>
    </label>
    <p v-if="description" :id="descriptionId" class="sfk-description">{{ description }}</p>
    <component
      :is="component"
      :field="field"
      :path="path"
      :input-id="inputId"
      :label-id="labelId"
      :described-by="describedBy"
      :invalid="errors.length > 0"
      :required="required"
      :locale="ctx.locale.value"
      :model-value="value"
      @update:model-value="(next: unknown) => ctx.setValue(path, next)"
      @blur="ctx.touch(path)"
    />
    <ul v-if="errors.length > 0" :id="errorId" class="sfk-errors" role="alert">
      <li v-for="error in errors" :key="error">{{ error }}</li>
    </ul>
  </div>
</template>
