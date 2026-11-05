<script setup lang="ts">
import { computed } from 'vue';
import { t, type Option } from '@schema-form-kit/core';
import type { FieldComponentProps } from '../context';

const props = defineProps<FieldComponentProps>();
const model = defineModel<string | number | ''>({ default: '' });
const emit = defineEmits<{ blur: [] }>();

const options = computed<Option[]>(() => ('options' in props.field ? props.field.options : []));

function choose(value: string | number): void {
  model.value = value;
  emit('blur');
}
</script>

<template>
  <div
    :id="inputId"
    class="sfk-choices"
    role="radiogroup"
    :aria-labelledby="labelId"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
  >
    <label v-for="option in options" :key="String(option.value)" class="sfk-choice">
      <input
        type="radio"
        :name="path"
        :value="option.value"
        :checked="model === option.value"
        @change="choose(option.value)"
      />
      <span>{{ t(option.label, locale) }}</span>
    </label>
  </div>
</template>
