# Validation

Validation runs in the core package, so the same rules work in the browser and on a server.

## Built-in checks

Before any rule runs, values are checked against the field type: `email` must look like an email
address, `number` must be a number, `date` must be a valid date and choice fields must use one of
their options.

`required` fails on a missing value, `null`, blank text or an empty array. For a `switch`, required
means it must be switched on (useful for "I agree" boxes).

## Rules

Add rules with `validations`:

| `type`                   | Applies to          | Fails when                                   |
| ------------------------ | ------------------- | -------------------------------------------- |
| `minLength`, `maxLength` | text fields         | the text is shorter / longer than `value`    |
| `min`, `max`             | `number`            | the number is below / above `value`          |
| `pattern`                | text fields         | the text does not match the regex in `value` |
| `minItems`, `maxItems`   | `checkbox`, `array` | there are fewer / more items than `value`    |
| `custom`                 | any                 | your function returns a message              |

Rules other than `minItems` and `maxItems` are skipped while the field is empty, so an optional
field with `minLength: 3` accepts an empty answer.

## Messages

Every built-in message exists in 繁體中文 and English and includes the field label. Override one
rule's message with `message`. The placeholders `{label}` and `{value}` are filled in for you.

```json
{
  "type": "pattern",
  "value": "^[a-z0-9_]+$",
  "message": {
    "en": "{label}: use lowercase letters, numbers and _ only",
    "zh-TW": "「{label}」只能使用小寫英文、數字與底線"
  }
}
```

## Custom validators

A `custom` rule refers to a function by name. Register the functions on the form:

```ts
import type { CustomValidator } from '@schema-form-kit/core';

const notReserved: CustomValidator = (value, { params }) => {
  const words = (params.words as string[] | undefined) ?? [];
  return typeof value === 'string' && words.includes(value.toLowerCase())
    ? `"${value}" is reserved`
    : true;
};
```

```vue
<SchemaForm :schema="schema" :custom-validators="{ notReserved }" />
```

```json
{ "type": "custom", "name": "notReserved", "params": { "words": ["admin", "root"] } }
```

The function receives the value and a context with all form `values`, the value `path`, the `field`
definition and the rule's `params`. It returns `true` when the value is valid, or an error message.
Keeping the function out of the JSON means schemas stay serializable while the logic stays in code.

Try `admin` as a username, an age under 18, and submitting without an interest:

<Demo example="validation" />

## When errors appear

The renderer does not shout at users while they type. A field shows its errors after it loses focus
for the first time, and every field in a step shows its errors after the user tries to continue or
submit.

## Validating on a server

```ts
import { validateForm, hasErrors } from '@schema-form-kit/core';

const errors = validateForm(schema, body, { locale: 'en', customValidators: { notReserved } });
if (hasErrors(errors)) {
  // errors: { "username": ["\"admin\" is reserved"], "experiences.0.company": ["Company is required"] }
}
```

Error keys are value paths, so errors inside repeatable groups point at the exact item.
