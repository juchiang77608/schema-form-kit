<script setup lang="ts">
import { computed } from 'vue';
import { t } from '@schema-form-kit/core';
import type { FieldComponentProps } from '../context';

const props = defineProps<FieldComponentProps>();
const model = defineModel<number | null>({ default: null });
defineEmits<{ blur: [] }>();

const step = computed(() => ('step' in props.field ? props.field.step : undefined));

// An empty input means "no value" (null) rather than 0.
const text = computed({
  get: () => (model.value === null || model.value === undefined ? '' : String(model.value)),
  set: (raw: string) => {
    const trimmed = raw.trim();
    model.value = trimmed === '' ? null : Number(trimmed);
  },
});
</script>

<template>
  <input
    :id="inputId"
    v-model="text"
    class="sfk-input"
    type="number"
    inputmode="decimal"
    :name="path"
    :step="step"
    :placeholder="t(field.placeholder, locale)"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
    @blur="$emit('blur')"
  />
</template>
