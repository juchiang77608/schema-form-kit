<script setup lang="ts">
import { palette, type PaletteItem } from '@schema-form-kit/builder-core';
import { t } from '@schema-form-kit/core';
import { useBuilderContext } from '../context';

const { state, locale, ui } = useBuilderContext();

function onDragStart(event: DragEvent, item: PaletteItem): void {
  state.dragging.value = { kind: 'new', type: item.type };
  // Some browsers only start a drag when data is set.
  event.dataTransfer?.setData('text/plain', item.type);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
  <section class="sfb-panel sfb-palette" :aria-label="ui.fields">
    <h2 class="sfb-panel__title">{{ ui.fields }}</h2>
    <ul class="sfb-palette__list">
      <li v-for="item in palette" :key="item.type">
        <button
          type="button"
          class="sfb-palette__item"
          draggable="true"
          :data-type="item.type"
          @click="state.add(item.type)"
          @dragstart="onDragStart($event, item)"
          @dragend="state.dragging.value = null"
        >
          <span class="sfb-icon" :data-icon="item.icon" aria-hidden="true" />
          {{ t(item.label, locale) }}
        </button>
      </li>
    </ul>
  </section>
</template>
