# @schema-form-kit/core

Framework-agnostic engine behind [schema-form-kit](https://github.com/juchiang77608/schema-form-kit):
schema types, conditions, validation, i18n messages and schema checks. No runtime dependencies.

```ts
import { validateForm, effectiveValues, checkSchema } from '@schema-form-kit/core';

checkSchema(schema);                 // [] when the schema is usable
validateForm(schema, values, { locale: 'en' }); // { "email": ["Email is required"] }
effectiveValues(schema, values);     // values without hidden fields
```

See the [main README](https://github.com/juchiang77608/schema-form-kit#readme).
