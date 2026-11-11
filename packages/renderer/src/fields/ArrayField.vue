<script setup lang="ts">
import { computed } from 'vue';
import { getPath, initialItem, joinPath, t, type FieldSchema } from '@schema-form-kit/core';
import { useFormContext, type FieldComponentProps } from '../context';

const props = defineProps<FieldComponentProps>();
const model = defineModel<Array<Record<string, unknown>>>({ default: () => [] });
const emit = defineEmits<{ blur: [] }>();

const ctx = useFormContext();
const FieldRenderer = ctx.fieldRenderer;

const itemFields = computed<FieldSchema[]>(() =>
  props.field.type === 'array' ? props.field.fields : [],
);
const itemLabel = computed(() =>
  props.field.type === 'array' && props.field.itemLabel
    ? t(props.field.itemLabel, props.locale)
    : t(props.field.label, props.locale),
);
const items = computed(() => model.value ?? []);
const addLabel = computed(() =>
  props.locale === 'en' ? `Add ${itemLabel.value}` : `新增${itemLabel.value}`,
);
const text = computed(() =>
  props.locale === 'en'
    ? { remove: 'Remove', up: 'Move up', down: 'Move down', empty: 'No items yet' }
    : { remove: '刪除', up: '上移', down: '下移', empty: '尚無資料' },
);

/** The item as conditions see it: hidden values inside the item are removed. */
function scopeOf(index: number, item: Record<string, unknown>): Record<string, unknown> {
  const visible = getPath(ctx.visibleValues.value, joinPath(props.path, index));
  return visible && typeof visible === 'object' ? (visible as Record<string, unknown>) : item;
}

function add(): void {
  model.value = [...items.value, initialItem(itemFields.value)];
  emit('blur');
}

function remove(index: number): void {
  model.value = items.value.filter((_, i) => i !== index);
  emit('blur');
}

function move(index: number, delta: number): void {
  const target = index + delta;
  if (target < 0 || target >= items.value.length) return;
  const next = [...items.value];
  [next[index], next[target]] = [next[target]!, next[index]!];
  model.value = next;
}
</script>

<template>
  <div
    :id="inputId"
    class="sfk-array"
    role="group"
    :aria-labelledby="labelId"
    :aria-describedby="describedBy"
  >
    <p v-if="items.length === 0" class="sfk-array__empty">{{ text.empty }}</p>
    <fieldset v-for="(item, index) in items" :key="index" class="sfk-array__item">
      <legend class="sfk-array__legend">{{ itemLabel }} #{{ index + 1 }}</legend>
      <div class="sfk-grid">
        <component
          :is="FieldRenderer"
          v-for="child in itemFields"
          :key="child.name"
          :field="child"
          :path="joinPath(path, index, child.name)"
          :scope="scopeOf(index, item)"
        />
      </div>
      <div class="sfk-array__actions">
        <button
          type="button"
          class="sfk-btn sfk-btn--ghost"
          :disabled="index === 0"
          @click="move(index, -1)"
        >
          {{ text.up }}
        </button>
        <button
          type="button"
          class="sfk-btn sfk-btn--ghost"
          :disabled="index === items.length - 1"
          @click="move(index, 1)"
        >
          {{ text.down }}
        </button>
        <button type="button" class="sfk-btn sfk-btn--danger" @click="remove(index)">
          {{ text.remove }}
        </button>
      </div>
    </fieldset>
    <button type="button" class="sfk-btn sfk-btn--secondary" @click="add">+ {{ addLabel }}</button>
  </div>
</template>
