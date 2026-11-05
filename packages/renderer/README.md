# @schema-form-kit/vue

Vue 3 renderer for [schema-form-kit](https://github.com/juchiang77608/schema-form-kit).

```ts
import { SchemaForm, useSchemaForm } from '@schema-form-kit/vue';
import '@schema-form-kit/vue/styles.css';
```

- `<SchemaForm>`: props `schema`, `v-model`, `locale`, `customValidators`, `components`; events `submit`, `invalid`, `step-change`.
- `useSchemaForm()`: the same state without any markup, for fully custom UIs.

See the [main README](https://github.com/juchiang77608/schema-form-kit#readme).
