# Getting started

schema-form-kit turns a JSON description of a form into a working Vue 3 form. The packages are split by responsibility:

| Package                         | What it does                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@schema-form-kit/core`         | Schema types, condition engine, validation, i18n, schema checks. Plain TypeScript, no Vue.      |
| `@schema-form-kit/vue`          | The `<SchemaForm>` component, one component per field type, and the `useSchemaForm` composable. |
| `@schema-form-kit/builder-core` | Editing operations for a form builder: add, move, rename, undo/redo, import/export.             |
| `@schema-form-kit/builder`      | The visual builder UI (`<FormBuilder>`).                                                        |

::: info Not on npm yet
The packages are not published yet. To try them, clone the
[repository](https://github.com/juchiang77608/schema-form-kit) and run `pnpm install && pnpm dev`,
or use the [online playground](https://forms.janicechiang.dev).
:::

## Installation

```bash
pnpm add @schema-form-kit/vue @schema-form-kit/core
```

`vue` 3.5 or newer is a peer dependency.

## Your first form

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SchemaForm } from '@schema-form-kit/vue';
import '@schema-form-kit/vue/styles.css';
import type { FormSchema, FormValues } from '@schema-form-kit/core';

const schema: FormSchema = {
  id: 'contact',
  version: 1,
  title: 'Contact us',
  fields: [
    { name: 'email', type: 'email', label: 'Email', required: true },
    {
      name: 'topic',
      type: 'select',
      label: 'Topic',
      options: [
        { label: 'Sales', value: 'sales' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'detail',
      type: 'textarea',
      label: 'Tell us more',
      required: true,
      visibleWhen: { field: 'topic', op: 'eq', value: 'other' },
    },
  ],
};

const values = ref<FormValues>({});

function save(submitted: FormValues) {
  console.log(submitted);
}
</script>

<template>
  <SchemaForm v-model="values" :schema="schema" locale="en" @submit="save" />
</template>
```

Choose **Other** as the topic to see the extra field appear:

<Demo example="contact" />

## What happens on submit

1. Every visible field is validated. Errors appear under the fields and focus moves to the first one.
2. If the form is valid, `submit` is emitted with the values of **visible** fields only. Answers to
   fields that are hidden by a condition are dropped.
3. If it is not valid, `invalid` is emitted with the errors, keyed by value path.

## Next steps

- [Schema and fields](./schema) lists every field type and option.
- [Conditions](./conditions) shows how to show, hide and require fields.
- [Visual builder](./builder) lets you create schemas without writing JSON.
