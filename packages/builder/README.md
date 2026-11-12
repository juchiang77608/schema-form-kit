# @schema-form-kit/builder

Visual form builder for [schema-form-kit](https://github.com/juchiang77608/schema-form-kit) (Vue 3):
field palette, drag-and-drop canvas, property panel, steps, undo/redo, JSON import/export and live preview.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { FormBuilder } from '@schema-form-kit/builder';
import '@schema-form-kit/vue/styles.css';
import '@schema-form-kit/builder/styles.css';

const schema = ref({ id: 'new-form', version: 1, title: 'New form', fields: [] });
</script>

<template>
  <FormBuilder v-model:schema="schema" locale="en" />
</template>
```

All editing rules live in [`@schema-form-kit/builder-core`](../builder-core); this package is the UI.
Fields can be reordered by dragging or with the ↑ ↓ buttons (keyboard accessible).
