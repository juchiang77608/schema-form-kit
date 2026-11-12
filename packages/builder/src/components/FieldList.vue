<script setup lang="ts">
import { computed, ref } from 'vue';
import { childPath, palette, type FieldPath } from '@schema-form-kit/builder-core';
import { t, type FieldSchema } from '@schema-form-kit/core';
import { useBuilderContext } from '../context';

defineOptions({ name: 'FieldList' });

const props = defineProps<{
  /** Group these fields belong to (`""` = top level). */
  parent: FieldPath;
  fields: FieldSchema[];
}>();

const { state, locale, ui } = useBuilderContext();
const over = ref<number | null>(null);

const typeLabel = (type: string) =>
  t(palette.find((p) => p.type === type)?.label ?? type, locale.value);
const isSelected = (path: FieldPath) => state.selected.value === path;
const canDropHere = computed(() => {
  const payload = state.dragging.value;
  if (!payload) return false;
  if (payload.kind === 'new') return true;
  // Reordering only within the same group.
  const parent = payload.path.split('.').slice(0, -1).join('.');
  return parent === props.parent;
});

function onDragStart(event: DragEvent, path: FieldPath): void {
  state.dragging.value = { kind: 'move', path };
  event.dataTransfer?.setData('text/plain', path);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}

function onDragOver(event: DragEvent, index: number): void {
  if (!canDropHere.value) return;
  event.preventDefault();
  over.value = index;
}

function onDrop(event: DragEvent, index: number): void {
  event.preventDefault();
  over.value = null;
  if (canDropHere.value) state.drop({ parent: props.parent, index });
  else state.dragging.value = null;
}
</script>

<template>
  <ol class="sfb-list" :class="{ 'sfb-list--nested': parent !== '' }" :data-parent="parent">
    <template v-for="(field, index) in fields" :key="field.name">
      <li
        class="sfb-drop"
        :class="{ 'sfb-drop--over': over === index }"
        :data-drop-index="index"
        aria-hidden="true"
        @dragover="onDragOver($event, index)"
        @dragleave="over = null"
        @drop="onDrop($event, index)"
      />
      <li
        class="sfb-item"
        :class="{ 'sfb-item--selected': isSelected(childPath(parent, field.name)) }"
        :data-path="childPath(parent, field.name)"
        draggable="true"
        @dragstart.stop="onDragStart($event, childPath(parent, field.name))"
        @dragend="state.dragging.value = null"
      >
        <div class="sfb-item__row">
          <button
            type="button"
            class="sfb-item__main"
            :aria-pressed="isSelected(childPath(parent, field.name))"
            @click="state.selected.value = childPath(parent, field.name)"
          >
            <span class="sfb-item__handle" aria-hidden="true">⋮⋮</span>
            <span class="sfb-item__label">
              {{ t(field.label, locale) || field.name }}
              <span v-if="field.required" class="sfb-item__required" aria-hidden="true">*</span>
            </span>
            <span class="sfb-item__meta">
              <code>{{ field.name }}</code> · {{ typeLabel(field.type) }}
              <span v-if="field.visibleWhen" class="sfb-badge">if</span>
            </span>
          </button>
          <div class="sfb-item__actions">
            <button
              type="button"
              class="sfb-icon-btn"
              :aria-label="`${ui.moveUp}: ${t(field.label, locale)}`"
              :disabled="index === 0"
              @click="state.nudge(childPath(parent, field.name), -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="sfb-icon-btn"
              :aria-label="`${ui.moveDown}: ${t(field.label, locale)}`"
              :disabled="index === fields.length - 1"
              @click="state.nudge(childPath(parent, field.name), 1)"
            >
              ↓
            </button>
          </div>
        </div>
        <div v-if="field.type === 'array'" class="sfb-item__children">
          <FieldList :parent="childPath(parent, field.name)" :fields="field.fields" />
          <p v-if="field.fields.length === 0" class="sfb-muted">{{ ui.emptyGroup }}</p>
        </div>
      </li>
    </template>
    <li
      class="sfb-drop sfb-drop--last"
      :class="{ 'sfb-drop--over': over === fields.length, 'sfb-drop--empty': fields.length === 0 }"
      :data-drop-index="fields.length"
      @dragover="onDragOver($event, fields.length)"
      @dragleave="over = null"
      @drop="onDrop($event, fields.length)"
    >
      <span v-if="fields.length === 0 && parent === ''">{{ ui.dropHere }}</span>
    </li>
  </ol>
</template>
