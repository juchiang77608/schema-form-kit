<script setup lang="ts">
import { uniqueName } from '@schema-form-kit/builder-core';
import type { Option } from '@schema-form-kit/core';
import { toLocales, useBuilderContext, withLocale } from '../context';

const props = defineProps<{ modelValue: Option[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: Option[]] }>();
const { locale, ui } = useBuilderContext();

function replace(index: number, option: Option): void {
  emit(
    'update:modelValue',
    props.modelValue.map((o, i) => (i === index ? option : o)),
  );
}

function setLabel(index: number, text: string): void {
  const option = props.modelValue[index]!;
  replace(index, { ...option, label: withLocale(option.label, locale.value, text) ?? '' });
}

function setValue(index: number, raw: string): void {
  const option = props.modelValue[index]!;
  // Keep numbers numeric (e.g. a 1–5 rating scale).
  const value =
    typeof option.value === 'number' && raw.trim() !== '' && !Number.isNaN(Number(raw))
      ? Number(raw)
      : raw;
  replace(index, { ...option, value });
}

function add(): void {
  const value = uniqueName(
    'option',
    props.modelValue.map((o) => String(o.value)),
  );
  const n = props.modelValue.length + 1;
  emit('update:modelValue', [
    ...props.modelValue,
    { label: { 'zh-TW': `選項 ${n}`, en: `Option ${n}` }, value },
  ]);
}

function remove(index: number): void {
  if (props.modelValue.length <= 1) return;
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== index),
  );
}

function move(index: number, delta: number): void {
  const to = index + delta;
  if (to < 0 || to >= props.modelValue.length) return;
  const list = [...props.modelValue];
  [list[index], list[to]] = [list[to]!, list[index]!];
  emit('update:modelValue', list);
}
</script>

<template>
  <fieldset class="sfb-options">
    <legend>{{ ui.options }}</legend>
    <div v-for="(option, index) in modelValue" :key="index" class="sfb-options__row">
      <input
        class="sfb-input"
        :aria-label="`${ui.optionLabel} ${index + 1}`"
        :value="toLocales(option.label)[locale]"
        @input="setLabel(index, ($event.target as HTMLInputElement).value)"
      />
      <input
        class="sfb-input sfb-input--short"
        :aria-label="`${ui.optionValue} ${index + 1}`"
        :value="String(option.value)"
        @change="setValue(index, ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        class="sfb-icon-btn"
        :aria-label="ui.moveUp"
        :disabled="index === 0"
        @click="move(index, -1)"
      >
        ↑
      </button>
      <button
        type="button"
        class="sfb-icon-btn"
        :aria-label="ui.remove"
        :disabled="modelValue.length <= 1"
        @click="remove(index)"
      >
        ✕
      </button>
    </div>
    <button type="button" class="sfb-btn sfb-btn--ghost" @click="add">+ {{ ui.addOption }}</button>
  </fieldset>
</template>
