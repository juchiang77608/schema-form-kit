<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  checkSchema,
  t,
  type FormSchema,
  type FormValues,
  type Locale,
} from '@schema-form-kit/core';
import { SchemaForm } from '@schema-form-kit/vue';
import { presets } from './schemas';
import { clearDraft, loadDraft, saveDraft } from './storage';

type Theme = 'default' | 'teal' | 'compact';

const locale = ref<Locale>('zh-TW');
const theme = ref<Theme>('default');
const presetId = ref(presets[0]!.id);
const preset = computed(() => presets.find((p) => p.id === presetId.value) ?? presets[0]!);

const source = ref('');
const parseError = ref('');
const schema = ref<FormSchema>(preset.value.schema);
const values = ref<FormValues>({});
const submitted = ref<FormValues | null>(null);
const formKey = ref(0);

const issues = computed(() => checkSchema(schema.value));

const ui = computed(() =>
  locale.value === 'en'
    ? {
        tagline: 'JSON-driven forms for Vue 3: conditions, validation, wizard steps, i18n.',
        preset: 'Example',
        language: 'Language',
        theme: 'Theme',
        schema: 'Schema (JSON)',
        preview: 'Preview',
        result: 'Submitted value',
        nothing: 'Submit the form to see the result. Hidden fields are removed.',
        reset: 'Reset example',
        valid: 'Schema OK',
        draft: 'Your answers are saved as a draft in this browser.',
        themes: { default: 'Default', teal: 'Teal', compact: 'Compact' },
      }
    : {
        tagline: 'Vue 3 的 JSON 驅動表單：條件邏輯、驗證、多步驟、多語系。',
        preset: '範例',
        language: '語言',
        theme: '主題',
        schema: 'Schema（JSON）',
        preview: '預覽',
        result: '送出結果',
        nothing: '送出表單後會在這裡顯示結果；隱藏欄位不會出現在結果中。',
        reset: '重置範例',
        valid: 'Schema 檢查通過',
        draft: '填寫內容會以草稿形式存在這個瀏覽器。',
        themes: { default: '預設', teal: '青綠', compact: '緊湊' },
      },
);

function loadPreset(): void {
  const saved = loadDraft<{ source: string; values: FormValues }>(presetId.value);
  source.value = saved?.source ?? JSON.stringify(preset.value.schema, null, 2);
  values.value = saved?.values ?? {};
  submitted.value = null;
  applySource();
  formKey.value += 1;
}

function applySource(): void {
  try {
    const parsed = JSON.parse(source.value) as FormSchema;
    if (!parsed || !Array.isArray(parsed.fields)) throw new Error('"fields" must be an array');
    schema.value = parsed;
    parseError.value = '';
  } catch (error) {
    parseError.value = (error as Error).message;
  }
}

function resetPreset(): void {
  clearDraft(presetId.value);
  loadPreset();
}

watch(presetId, loadPreset, { immediate: true });
watch(source, applySource);
watch([source, values], () =>
  saveDraft(presetId.value, { source: source.value, values: values.value }),
);
</script>

<template>
  <div class="app" :class="`theme-${theme}`">
    <header class="topbar">
      <div>
        <h1>schema-form-kit</h1>
        <p class="muted">{{ ui.tagline }}</p>
      </div>
      <nav class="links">
        <a href="#/builder">Builder</a>
        <a href="https://github.com/juchiang77608/schema-form-kit" target="_blank" rel="noreferrer"
          >GitHub</a
        >
        <a href="https://forms-docs.janicechiang.dev" target="_blank" rel="noreferrer">Docs</a>
      </nav>
    </header>

    <section class="toolbar" aria-label="Playground options">
      <label>
        {{ ui.preset }}
        <select v-model="presetId">
          <option v-for="p in presets" :key="p.id" :value="p.id">{{ t(p.label, locale) }}</option>
        </select>
      </label>
      <label>
        {{ ui.language }}
        <select v-model="locale">
          <option value="zh-TW">繁體中文</option>
          <option value="en">English</option>
        </select>
      </label>
      <label>
        {{ ui.theme }}
        <select v-model="theme">
          <option v-for="(name, key) in ui.themes" :key="key" :value="key">{{ name }}</option>
        </select>
      </label>
      <button type="button" class="link-button" @click="resetPreset">{{ ui.reset }}</button>
    </section>

    <main class="layout">
      <section class="panel editor">
        <h2>{{ ui.schema }}</h2>
        <textarea v-model="source" spellcheck="false" aria-label="Schema JSON" />
        <p v-if="parseError" class="status status--error" role="status">JSON: {{ parseError }}</p>
        <ul v-else-if="issues.length > 0" class="status status--warn" role="status">
          <li v-for="issue in issues" :key="issue.path + issue.message">
            <code>{{ issue.path }}</code> {{ issue.message }}
          </li>
        </ul>
        <p v-else class="status status--ok" role="status">✓ {{ ui.valid }}</p>
      </section>

      <section class="panel preview">
        <h2>{{ ui.preview }}</h2>
        <SchemaForm
          :key="formKey"
          v-model="values"
          :schema="schema"
          :locale="locale"
          @submit="submitted = $event"
        />
        <p class="muted small">{{ ui.draft }}</p>
      </section>

      <section class="panel result">
        <h2>{{ ui.result }}</h2>
        <pre v-if="submitted">{{ JSON.stringify(submitted, null, 2) }}</pre>
        <p v-else class="muted">{{ ui.nothing }}</p>
      </section>
    </main>
  </div>
</template>

<style>
:root {
  font-family:
    'Inter',
    'Noto Sans TC',
    system-ui,
    -apple-system,
    'Segoe UI',
    'PingFang TC',
    'Microsoft JhengHei',
    sans-serif;
  color: #1f2328;
  background: #f3f4f6;
}

body {
  margin: 0;
}

.app {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.topbar h1 {
  margin: 0;
  font-size: 1.5rem;
}

.links {
  display: flex;
  gap: 16px;
}

.links a {
  color: #4f46e5;
  font-weight: 600;
}

.muted {
  color: #59636e;
  margin: 4px 0 0;
}

.small {
  font-size: 0.8125rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  margin: 20px 0;
}

.toolbar label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.toolbar select {
  min-height: 36px;
  padding: 4px 8px;
  font: inherit;
  border: 1px solid #d1d9e0;
  border-radius: 6px;
  background: #fff;
}

.link-button {
  min-height: 36px;
  border: none;
  background: none;
  color: #cf222e;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 0.8fr);
  gap: 20px;
  align-items: start;
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #59636e;
}

.editor textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 560px;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  border: 1px solid #d1d9e0;
  border-radius: 8px;
  resize: vertical;
}

.status {
  margin: 12px 0 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8125rem;
}

ul.status {
  padding-left: 28px;
}

.status--ok {
  background: #dafbe1;
  color: #116329;
}

.status--warn {
  background: #fff8c5;
  color: #6a4b00;
}

.status--error {
  background: #ffebe9;
  color: #a40e26;
}

.result pre {
  margin: 0;
  padding: 12px;
  background: #0d1117;
  color: #e6edf3;
  border-radius: 8px;
  font-size: 12px;
  overflow: auto;
}

/* Themes are plain CSS variable overrides. */
.theme-teal .sfk-form {
  --sfk-color-primary: #0f766e;
  --sfk-radius: 4px;
}

.theme-compact .sfk-form {
  --sfk-color-primary: #1f2328;
  --sfk-gap: 10px;
  --sfk-input-height: 32px;
  --sfk-radius: 2px;
  font-size: 0.875rem;
}
</style>
