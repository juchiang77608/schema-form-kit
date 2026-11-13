# Schema and fields

A form is a plain JSON object of type `FormSchema`. Because it is only data, you can store it in a
database, version it, and edit it with the [visual builder](./builder).

## The form

```ts
interface FormSchema {
  id: string; // used for DOM ids
  version: 1; // schema format version, for future migrations
  title: I18nText;
  description?: I18nText;
  fields: FieldSchema[];
  steps?: StepSchema[]; // turns the form into a wizard
  submitLabel?: I18nText;
}
```

## Common field options

Every field has these options:

| Option         | Type                   | Description                                                       |
| -------------- | ---------------------- | ----------------------------------------------------------------- |
| `name`         | `string`               | Key in the value object. Must be unique among its siblings.       |
| `type`         | `FieldType`            | See the table below.                                              |
| `label`        | `I18nText`             | Shown above the input.                                            |
| `description`  | `I18nText`             | Help text under the label.                                        |
| `placeholder`  | `I18nText`             | Placeholder of text-like inputs.                                  |
| `required`     | `boolean \| Condition` | `true`, or a [condition](./conditions) that makes it needed.      |
| `visibleWhen`  | `Condition`            | Show (and validate) the field only when this holds.               |
| `validations`  | `ValidationRule[]`     | See [Validation](./validation).                                   |
| `defaultValue` | depends on the type    | Initial value.                                                    |
| `colSpan`      | `number`               | Layout hint: columns out of 12. Fields are full width by default. |

## Field types

| `type`                      | Value                     | Extra options                    |
| --------------------------- | ------------------------- | -------------------------------- |
| `text`, `email`, `textarea` | `string`                  | —                                |
| `number`                    | `number`                  | `step`                           |
| `date`                      | `string` (`YYYY-MM-DD`)   | —                                |
| `select`, `radio`           | `string \| number`        | `options` (required)             |
| `checkbox`                  | `Array<string \| number>` | `options` (required)             |
| `switch`                    | `boolean`                 | —                                |
| `array`                     | `Array<object>`           | `fields` (required), `itemLabel` |

Options are `{ label: I18nText, value: string | number }`.

`array` fields are repeatable groups. See [Steps and repeatable groups](./steps-and-groups).

## Translatable text

Every user-facing string is an `I18nText`: either one string, or one string per locale.

```json
{ "label": { "zh-TW": "電子郵件", "en": "Email" } }
```

The built-in locales are `zh-TW` (the default) and `en`. Pass `locale="en"` to `<SchemaForm>` to
switch. Built-in validation messages exist for both locales.

## Checking a schema

Mistakes in a hand-written schema are easy to make. `checkSchema` reports them before you render:

```ts
import { checkSchema } from '@schema-form-kit/core';

const issues = checkSchema(schema);
// [{ path: 'fields.2.visibleWhen', message: 'Unknown field "topc" in condition' }, ...]
```

It finds invalid or duplicate names, conditions that point at fields that do not exist, empty option lists,
invalid regular expressions and steps that reference missing fields. The playground and the
builder run it as you type.
