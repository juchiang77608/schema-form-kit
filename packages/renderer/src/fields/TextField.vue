<script setup lang="ts">
import { computed } from 'vue';
import { t } from '@schema-form-kit/core';
import type { FieldComponentProps } from '../context';

const props = defineProps<FieldComponentProps>();
const model = defineModel<string>({ default: '' });
defineEmits<{ blur: [] }>();

const inputType = computed(() => (props.field.type === 'email' ? 'email' : 'text'));
</script>

<template>
  <textarea
    v-if="field.type === 'textarea'"
    :id="inputId"
    v-model="model"
    class="sfk-input sfk-textarea"
    rows="4"
    :name="path"
    :placeholder="t(field.placeholder, locale)"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
    @blur="$emit('blur')"
  />
  <input
    v-else
    :id="inputId"
    v-model="model"
    class="sfk-input"
    :type="inputType"
    :name="path"
    :autocomplete="field.type === 'email' ? 'email' : 'off'"
    :placeholder="t(field.placeholder, locale)"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
    @blur="$emit('blur')"
  />
</template>
