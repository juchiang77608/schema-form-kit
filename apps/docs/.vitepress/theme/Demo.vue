<script setup lang="ts">
import { computed, ref } from 'vue';
import { useData } from 'vitepress';
import type { FormValues, Locale } from '@schema-form-kit/core';
import { SchemaForm } from '@schema-form-kit/vue';
import { examples, type ExampleName } from './examples';

const props = defineProps<{ example: ExampleName }>();

const { lang } = useData();
const docsZh = computed(() => lang.value.toLowerCase().startsWith('zh'));
const locale = ref<Locale>(docsZh.value ? 'zh-TW' : 'en');
const values = ref<FormValues>({});
const submitted = ref<FormValues | null>(null);
const resetKey = ref(0);

const example = computed(() => examples[props.example]);
const chrome = computed(() =>
  docsZh.value
    ? {
        live: '即時範例',
        language: '語言',
        reset: '重設',
        submitted: '送出的值',
        current: '目前的值',
      }
    : {
        live: 'Live example',
        language: 'Language',
        reset: 'Reset',
        submitted: 'Submitted values',
        current: 'Current values',
      },
);

function onSubmit(next: FormValues): void {
  submitted.value = next;
}

function reset(): void {
  values.value = {};
  submitted.value = null;
  resetKey.value += 1;
}
</script>

<template>
  <div class="demo vp-raw">
    <div class="demo__bar">
      <span class="demo__label">{{ chrome.live }}</span>
      <label class="demo__control">
        {{ chrome.language }}
        <select v-model="locale">
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
        </select>
      </label>
      <button type="button" class="demo__control demo__reset" @click="reset">
        {{ chrome.reset }}
      </button>
    </div>
    <div class="demo__body">
      <ClientOnly>
        <SchemaForm
          :key="resetKey"
          v-model="values"
          :schema="example.schema"
          :locale="locale"
          :custom-validators="example.customValidators"
          @submit="onSubmit"
        />
      </ClientOnly>
    </div>
    <details class="demo__values">
      <summary>{{ submitted ? chrome.submitted : chrome.current }}</summary>
      <pre>{{ JSON.stringify(submitted ?? values, null, 2) }}</pre>
    </details>
  </div>
</template>
