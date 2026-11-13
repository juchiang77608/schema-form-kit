# Customization

There are three levels of customization, from least to most work.

## 1. Theme with CSS variables

Every color, radius and spacing is a CSS variable on `.sfk-form`. Override them anywhere in your
CSS:

```css
.sfk-form {
  --sfk-color-primary: #0f766e;
  --sfk-radius: 4px;
  --sfk-gap: 12px;
}
```

| Variable                       | Default                          |
| ------------------------------ | -------------------------------- |
| `--sfk-font`                   | `inherit`                        |
| `--sfk-color-text`             | `#1f2328`                        |
| `--sfk-color-muted`            | `#59636e`                        |
| `--sfk-color-border`           | `#d1d9e0`                        |
| `--sfk-color-surface`          | `#ffffff`                        |
| `--sfk-color-subtle`           | `#f6f8fa`                        |
| `--sfk-color-primary`          | `#4f46e5`                        |
| `--sfk-color-primary-contrast` | `#ffffff`                        |
| `--sfk-color-danger`           | `#cf222e`                        |
| `--sfk-color-focus`            | the primary color at 35% opacity |
| `--sfk-radius`                 | `8px`                            |
| `--sfk-gap`                    | `16px`                           |
| `--sfk-input-height`           | `40px`                           |

Class names use a `sfk-` prefix (`sfk-field`, `sfk-field--invalid`, `sfk-label`, `sfk-errors`, …) if
you need to go further.

## 2. Replace field components

Pass `components` to use your own component for any field type, for example a date picker from your
design system:

```vue
<SchemaForm :schema="schema" :components="{ date: MyDatePicker }" />
```

The renderer still draws the label, description and errors. Your component receives
`FieldComponentProps` plus `v-model`, and should emit `blur` when the user leaves it so errors can
appear:

```vue
<script setup lang="ts">
import type { FieldComponentProps } from '@schema-form-kit/vue';

defineProps<FieldComponentProps>();
const model = defineModel<string>({ default: '' });
defineEmits<{ blur: [] }>();
</script>

<template>
  <input
    :id="inputId"
    v-model="model"
    type="date"
    :aria-invalid="invalid"
    :aria-required="required"
    :aria-describedby="describedBy"
    @blur="$emit('blur')"
  />
</template>
```

| Prop          | Description                                                    |
| ------------- | -------------------------------------------------------------- |
| `field`       | The field definition. Narrow it with `field.type`.             |
| `path`        | Value path, e.g. `experiences.0.company`.                      |
| `inputId`     | DOM id for the input. The label's `for` points at it.          |
| `labelId`     | DOM id of the label, for groups that use `aria-labelledby`.    |
| `describedBy` | ids of the error and description text, for `aria-describedby`. |
| `invalid`     | Whether the field currently shows errors.                      |
| `required`    | Whether the field is currently required.                       |
| `locale`      | The active locale.                                             |

## 3. Headless: build your own UI

`useSchemaForm` is the state that `<SchemaForm>` is built on. Use it directly to render something
completely different, such as a one-question-at-a-time survey:

```ts
import { useSchemaForm } from '@schema-form-kit/vue';

const form = useSchemaForm({ schema, locale: 'en' });

form.values; // Ref<FormValues>
form.visibleValues; // values with hidden answers removed
form.setValue('email', 'me@example.com');
form.touch('email');
form.errorsFor('email'); // errors to show for one path
form.steps; // steps (a form without steps has one)
form.next(); // validates the current step, then moves on
form.validate(); // validates everything
form.reset();
```

## Slots and events

`<SchemaForm>` has a `header` slot (receives `schema`) and a `footer` slot (receives `isFirstStep`,
`isLastStep`, `prev` and `next`) for custom buttons. Set `hide-header` to remove the title.

| Event               | Payload                               |
| ------------------- | ------------------------------------- |
| `update:modelValue` | all values, as the user types         |
| `submit`            | visible values only, after validation |
| `invalid`           | errors keyed by value path            |
| `step-change`       | the new step index                    |

The component also exposes `values`, `errors`, `validate()`, `reset()`, `next()`, `prev()`,
`goTo(index)` and `submit()` through a template ref.
