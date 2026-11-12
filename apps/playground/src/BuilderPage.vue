<script setup lang="ts">
import { ref, watch } from 'vue';
import type { FormSchema, Locale } from '@schema-form-kit/core';
import { FormBuilder } from '@schema-form-kit/builder';
import { presets } from './schemas';
import { clearDraft, loadDraft, saveDraft } from './storage';

const DRAFT_KEY = 'builder';

const locale = ref<Locale>('zh-TW');
const initial = loadDraft<FormSchema>(DRAFT_KEY) ?? structuredClone(presets[0]!.schema);
const schema = ref<FormSchema>(initial);
const builderKey = ref(0);

watch(schema, (value) => saveDraft(DRAFT_KEY, value));

function startFrom(id: string): void {
  const preset = presets.find((p) => p.id === id);
  if (!preset) return;
  clearDraft(DRAFT_KEY);
  schema.value = structuredClone(preset.schema);
  builderKey.value += 1;
}

function startBlank(): void {
  clearDraft(DRAFT_KEY);
  schema.value = {
    id: 'new-form',
    version: 1,
    title: { 'zh-TW': '新表單', en: 'New form' },
    fields: [],
  };
  builderKey.value += 1;
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div>
        <h1>schema-form-kit · Builder</h1>
        <p class="muted">
          {{
            locale === 'en'
              ? 'Drag fields onto the form, edit properties on the right, preview, then export JSON.'
              : '把欄位拖進表單、在右側編輯屬性、預覽，最後匯出 JSON。'
          }}
        </p>
      </div>
      <nav class="links">
        <a href="#/">Playground</a>
        <a href="https://github.com/juchiang77608/schema-form-kit" target="_blank" rel="noreferrer"
          >GitHub</a
        >
      </nav>
    </header>

    <section class="toolbar" aria-label="Builder options">
      <label>
        {{ locale === 'en' ? 'Start from' : '從範例開始' }}
        <select value="" @change="startFrom(($event.target as HTMLSelectElement).value)">
          <option value="" disabled>—</option>
          <option v-for="p in presets" :key="p.id" :value="p.id">
            {{ typeof p.label === 'string' ? p.label : (p.label[locale] ?? p.id) }}
          </option>
        </select>
      </label>
      <label>
        {{ locale === 'en' ? 'Language' : '語言' }}
        <select v-model="locale">
          <option value="zh-TW">繁體中文</option>
          <option value="en">English</option>
        </select>
      </label>
      <button type="button" class="link-button" @click="startBlank">
        {{ locale === 'en' ? 'Blank form' : '空白表單' }}
      </button>
    </section>

    <FormBuilder :key="builderKey" v-model:schema="schema" :locale="locale" />
  </div>
</template>
