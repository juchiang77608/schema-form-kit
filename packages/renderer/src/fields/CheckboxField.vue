<script setup lang="ts">
import { computed } from 'vue';
import { t, type Option } from '@schema-form-kit/core';
import type { FieldComponentProps } from '../context';

const props = defineProps<FieldComponentProps>();
const model = defineModel<Array<string | number>>({ default: () => [] });
const emit = defineEmits<{ blur: [] }>();

const options = computed<Option[]>(() => ('options' in props.field ? props.field.options : []));

function toggle(value: string | number, checked: boolean): void {
  const current = model.value ?? [];
  // Keep the order of the options, not the order of clicks.
  const next = new Set(checked ? [...current, value] : current.filter((v) => v !== value));
  model.value = options.value.map((o) => o.value).filter((v) => next.has(v));
  emit('blur');
}
</script>

<template>
  <div
    :id="inputId"
    class="sfk-choices"
    role="group"
    :aria-labelledby="labelId"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
  >
    <label v-for="option in options" :key="String(option.value)" class="sfk-choice">
      <input
        type="checkbox"
        :name="path"
        :value="option.value"
        :checked="(model ?? []).includes(option.value)"
        @change="toggle(option.value, ($event.target as HTMLInputElement).checked)"
      />
      <span>{{ t(option.label, locale) }}</span>
    </label>
  </div>
</template>
