<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FormValues, Locale } from '@schema-form-kit/core';
import { SchemaForm } from '@schema-form-kit/vue';
import { examples, type ExampleName } from './examples';

const props = defineProps<{ example: ExampleName }>();

const locale = ref<Locale>('en');
const values = ref<FormValues>({});
const submitted = ref<FormValues | null>(null);
const resetKey = ref(0);

const example = computed(() => examples[props.example]);

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
      <span class="demo__label">Live example</span>
      <label class="demo__control">
        Language
        <select v-model="locale">
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
        </select>
      </label>
      <button type="button" class="demo__control demo__reset" @click="reset">Reset</button>
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
      <summary>{{ submitted ? 'Submitted values' : 'Current values' }}</summary>
      <pre>{{ JSON.stringify(submitted ?? values, null, 2) }}</pre>
    </details>
  </div>
</template>
