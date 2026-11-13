# Visual builder

The builder creates and edits schemas without writing JSON.
**[Try it online](https://forms.janicechiang.dev/#/builder)**: it starts from an example form, and
your draft is kept in the browser.

## What you can do

- **Add fields** by dragging them from the palette onto the form, or by clicking a palette item.
- **Reorder** by dragging, or with the ↑ / ↓ buttons on each field (keyboard friendly).
- **Edit properties** in the right panel: label, name, help text, placeholder, required, width,
  options and validation rules.
- **Write conditions** for "show when" and "required when" with a form-based editor that supports
  `all`, `any` and nesting. You pick fields from a list, so a condition cannot point at a field that
  does not exist.
- **Rename safely.** Changing a field's name updates every condition that refers to it, including
  conditions inside repeatable groups.
- **Change a field's type.** The label, help text and conditions are kept; rules that do not fit
  the new type are dropped, and options are added or removed as needed.
- **Work with steps.** Turn steps on, add, rename and reorder them, and move fields between them.
- **Undo and redo** every change with the toolbar or Ctrl/⌘ + Z and Ctrl/⌘ + Shift + Z. Typing in a
  text box is grouped into one undo step.
- **Preview** the form exactly as users will see it, then **export** the JSON (copied to the
  clipboard and downloaded) or **import** an existing schema. Broken JSON is rejected, and problems such as a condition that
  points at a missing field are listed so you can fix them in the builder.

## Using the builder in your app

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { FormBuilder } from '@schema-form-kit/builder';
import '@schema-form-kit/vue/styles.css';
import '@schema-form-kit/builder/styles.css';
import type { FormSchema } from '@schema-form-kit/core';

const schema = ref<FormSchema>({ id: 'new-form', version: 1, title: 'New form', fields: [] });
</script>

<template>
  <FormBuilder v-model:schema="schema" locale="en" />
</template>
```

`v-model:schema` is updated after every change, so you can save drafts as the user works. The
builder's own colors are CSS variables with a `--sfb-` prefix.

## Two packages

The builder is split in two, like the form itself:

- `@schema-form-kit/builder-core` holds every editing operation as a pure function from schema to
  schema: `addField`, `moveField`, `renameField`, `changeFieldType`, `addStep` and so on, plus
  undo/redo history and import/export. It has no UI and is fully unit tested, so you could build a
  builder for another framework on top of it.
- `@schema-form-kit/builder` is the Vue UI that calls those operations.

```ts
import { addField, renameField } from '@schema-form-kit/builder-core';

const added = addField(schema, 'email'); // { schema, path } — the name is made unique if needed
const renamed = renameField(added.schema, added.path, 'contactEmail'); // conditions follow
```

Design decisions are recorded in
[ADR 0003](https://github.com/juchiang77608/schema-form-kit/blob/main/docs/adr/0003-builder-core.md)
and
[ADR 0004](https://github.com/juchiang77608/schema-form-kit/blob/main/docs/adr/0004-builder-drag-and-drop.md).
