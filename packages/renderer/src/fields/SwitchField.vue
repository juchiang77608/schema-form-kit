<script setup lang="ts">
import type { FieldComponentProps } from '../context';

defineProps<FieldComponentProps>();
const model = defineModel<boolean>({ default: false });
const emit = defineEmits<{ blur: [] }>();

function toggle(): void {
  model.value = !model.value;
  emit('blur');
}
</script>

<template>
  <button
    :id="inputId"
    type="button"
    role="switch"
    class="sfk-switch"
    :class="{ 'sfk-switch--on': model }"
    :aria-checked="model"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
    @click="toggle"
  >
    <span class="sfk-switch__thumb" />
  </button>
</template>
