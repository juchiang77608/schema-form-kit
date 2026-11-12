<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { checkSchema, type FormSchema, type Locale, type SchemaIssue } from '@schema-form-kit/core';
import { SchemaForm } from '@schema-form-kit/vue';
import { BUILDER_CONTEXT, uiText } from './context';
import { useBuilder } from './useBuilder';
import FieldList from './components/FieldList.vue';
import FieldPalette from './components/FieldPalette.vue';
import PropertiesPanel from './components/PropertiesPanel.vue';
import StepTabs from './components/StepTabs.vue';

const props = withDefaults(defineProps<{ schema: FormSchema; locale?: Locale }>(), {
  locale: 'zh-TW',
});
const emit = defineEmits<{ 'update:schema': [schema: FormSchema] }>();

const state = useBuilder(props.schema, { onChange: (s) => emit('update:schema', s) });
const locale = computed(() => props.locale);
const ui = computed(() => uiText[props.locale]);
provide(BUILDER_CONTEXT, { state, locale, ui });

const mode = ref<'edit' | 'preview'>('edit');
const issues = computed<SchemaIssue[]>(() => checkSchema(state.schema.value));
const notice = ref('');

const importOpen = ref(false);
const importText = ref('');
const importErrors = ref<SchemaIssue[]>([]);

function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  // Leave native undo to text inputs.
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
  event.preventDefault();
  if (event.shiftKey) state.redo();
  else state.undo();
}

async function exportJson(): Promise<void> {
  const json = state.exportJson();
  try {
    await navigator.clipboard.writeText(json);
    notice.value = ui.value.copied;
  } catch {
    notice.value = '';
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${state.schema.value.id || 'form'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function openImport(): void {
  importText.value = state.exportJson();
  importErrors.value = [];
  importOpen.value = true;
}

function applyImport(): void {
  const result = state.load(importText.value);
  if (result.ok) {
    importOpen.value = false;
    notice.value =
      result.warnings.length > 0
        ? `${ui.value.warnings} ${result.warnings.map((w) => w.message).join('; ')}`
        : '';
  } else {
    importErrors.value = result.errors;
  }
}

defineExpose({ state });
</script>

<template>
  <div class="sfb" @keydown="onKeydown">
    <header class="sfb-toolbar">
      <div class="sfb-toolbar__group" role="group">
        <button
          type="button"
          class="sfb-btn"
          :aria-pressed="mode === 'edit'"
          @click="mode = 'edit'"
        >
          {{ ui.edit }}
        </button>
        <button
          type="button"
          class="sfb-btn"
          :aria-pressed="mode === 'preview'"
          @click="mode = 'preview'"
        >
          {{ ui.preview }}
        </button>
      </div>
      <div class="sfb-toolbar__group">
        <button
          type="button"
          class="sfb-btn"
          data-testid="undo"
          :disabled="!state.canUndo.value"
          @click="state.undo()"
        >
          ↶ {{ ui.undo }}
        </button>
        <button
          type="button"
          class="sfb-btn"
          data-testid="redo"
          :disabled="!state.canRedo.value"
          @click="state.redo()"
        >
          ↷ {{ ui.redo }}
        </button>
      </div>
      <div class="sfb-toolbar__group">
        <button type="button" class="sfb-btn" @click="openImport">{{ ui.import }}</button>
        <button type="button" class="sfb-btn" @click="exportJson">{{ ui.export }}</button>
      </div>
    </header>

    <p v-if="state.error.value" class="sfb-alert sfb-alert--error" role="alert">
      {{ state.error.value }}
    </p>
    <p v-else-if="notice" class="sfb-alert" role="status">{{ notice }}</p>
    <ul v-if="issues.length > 0" class="sfb-alert sfb-alert--warn" role="status">
      <li v-for="issue in issues" :key="issue.path + issue.message">
        <code>{{ issue.path }}</code> {{ issue.message }}
      </li>
    </ul>

    <div v-if="mode === 'edit'" class="sfb-layout">
      <FieldPalette />
      <section class="sfb-panel sfb-canvas" :aria-label="ui.canvas">
        <h2 class="sfb-panel__title">{{ ui.canvas }}</h2>
        <StepTabs />
        <FieldList parent="" :fields="state.canvasFields.value" />
      </section>
      <PropertiesPanel />
    </div>
    <div v-else class="sfb-panel sfb-preview">
      <SchemaForm
        :key="JSON.stringify(state.schema.value)"
        :schema="state.schema.value"
        :locale="locale"
      />
    </div>

    <div v-if="importOpen" class="sfb-dialog-backdrop">
      <div class="sfb-dialog" role="dialog" aria-modal="true" :aria-label="ui.importTitle">
        <h2 class="sfb-panel__title">{{ ui.importTitle }}</h2>
        <textarea v-model="importText" class="sfb-input sfb-dialog__text" spellcheck="false" />
        <ul v-if="importErrors.length > 0" class="sfb-alert sfb-alert--error" role="alert">
          <li v-for="e in importErrors" :key="e.path + e.message">
            <code>{{ e.path }}</code> {{ e.message }}
          </li>
        </ul>
        <div class="sfb-dialog__actions">
          <button type="button" class="sfb-btn" @click="importOpen = false">{{ ui.cancel }}</button>
          <button
            type="button"
            class="sfb-btn sfb-btn--primary"
            data-testid="import-apply"
            @click="applyImport"
          >
            {{ ui.importApply }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
