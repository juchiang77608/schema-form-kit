<script setup lang="ts">
import type { FieldComponentProps } from '../context';

defineProps<FieldComponentProps>();
const model = defineModel<string>({ default: '' });
defineEmits<{ blur: [] }>();
</script>

<template>
  <input
    :id="inputId"
    v-model="model"
    class="sfk-input"
    type="date"
    :name="path"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
    @blur="$emit('blur')"
  />
</template>
