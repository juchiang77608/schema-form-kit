# Conditions

Conditions decide whether a field is shown (`visibleWhen`) and whether it is required
(`required`). They are JSON too, so the builder can edit them without code.

## Comparing a field

```json
{ "field": "topic", "op": "eq", "value": "other" }
```

`field` is the name (or dot path) of another field. The operators are:

| `op`          | True when the value…                                                |
| ------------- | ------------------------------------------------------------------- |
| `eq`, `neq`   | equals / does not equal `value`                                     |
| `gt`, `gte`   | is greater than / at least `value` (numbers, or text such as dates) |
| `lt`, `lte`   | is less than / at most `value`                                      |
| `in`, `notIn` | is / is not one of the items in the `value` array                   |
| `includes`    | is an array (a checkbox group) or text that contains `value`        |
| `empty`       | is empty: missing, `null`, blank text or an empty array             |
| `notEmpty`    | is not empty                                                        |

## Combining conditions

Use `all`, `any` and `not`. They nest as deep as you need.

```json
{
  "all": [
    { "field": "country", "op": "eq", "value": "TW" },
    { "not": { "field": "age", "op": "gte", "value": 18 } }
  ]
}
```

## Conditional required

`required` accepts a condition as well as `true`:

```json
{
  "name": "message",
  "type": "textarea",
  "label": "Gift message",
  "visibleWhen": { "field": "gift", "op": "eq", "value": true },
  "required": { "field": "method", "op": "eq", "value": "home" }
}
```

A hidden field is never required, whatever its `required` says.

## Hidden fields cascade

If field B depends on field A and A is hidden, B is hidden too, even if the value A had before it
was hidden would make B's condition true. Conditions are evaluated against _effective values_:
the values with every hidden answer removed, repeated until nothing changes.

The same effective values are used for validation and are what `submit` emits, so a user can never
submit an answer they can no longer see. The reasoning is recorded in
[ADR 0002](https://github.com/juchiang77608/schema-form-kit/blob/main/docs/adr/0002-hidden-fields-cascade.md).

Try it below: choose **Home delivery**, type an address so that **Floor** appears, then switch back
to **Pick up in store**. Both fields disappear and their values are not submitted.

<Demo example="conditions" />

## Using conditions without the renderer

The engine is in the framework-agnostic core, so you can run the same rules on a server:

```ts
import { effectiveValues, evaluateCondition, validateForm } from '@schema-form-kit/core';

evaluateCondition({ field: 'method', op: 'eq', value: 'home' }, { root: values }); // boolean
effectiveValues(schema, values); // values without hidden answers
validateForm(schema, values, { locale: 'en' }); // same errors the form shows
```
