<script setup lang="ts">
import { computed } from 'vue';
import { t, type Option } from '@schema-form-kit/core';
import type { FieldComponentProps } from '../context';

const props = defineProps<FieldComponentProps>();
const model = defineModel<string | number | ''>({ default: '' });
defineEmits<{ blur: [] }>();

const options = computed<Option[]>(() => ('options' in props.field ? props.field.options : []));
const placeholder = computed(
  () => t(props.field.placeholder, props.locale) || (props.locale === 'en' ? 'Select…' : '請選擇'),
);
</script>

<template>
  <select
    :id="inputId"
    v-model="model"
    class="sfk-input sfk-select"
    :name="path"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
    @blur="$emit('blur')"
  >
    <option value="" disabled>{{ placeholder }}</option>
    <option v-for="option in options" :key="String(option.value)" :value="option.value">
      {{ t(option.label, locale) }}
    </option>
  </select>
</template>
