# API reference

All packages are written in TypeScript and ship their types. This page lists the public exports;
the source files have doc comments with more detail.

## `@schema-form-kit/core`

### Types

`FormSchema`, `FieldSchema`, `FieldType`, `StepSchema`, `Option`, `I18nText`, `Locale`,
`Condition` (`FieldCondition`, `AllCondition`, `AnyCondition`, `NotCondition`),
`ComparisonOperator`, `ValidationRule`, `FormValues`, `FormErrors`, `CustomValidator`,
`CustomValidatorContext`, `ValidateOptions`. See [Schema and fields](../guide/schema).

### Conditions and fields

| Export                                  | Description                                                                |
| --------------------------------------- | -------------------------------------------------------------------------- |
| `evaluateCondition(condition, ctx)`     | Evaluates a condition. `ctx` is `{ root: values, scope?: item }`.          |
| `conditionDependencies(condition)`      | Field names a condition reads.                                             |
| `isFieldVisible(field, ctx)`            | Whether `visibleWhen` holds.                                               |
| `isFieldRequired(field, ctx)`           | Whether `required` is `true` or its condition holds.                       |
| `visibleFields(fields, ctx)`            | The fields that are visible.                                               |
| `effectiveValues(schema, values)`       | Values with hidden answers removed, cascading. Alias: `pruneHiddenValues`. |
| `buildInitialValues(schema, existing?)` | Values filled with defaults, keeping `existing`.                           |
| `initialItem(fields)`                   | A new item for a repeatable group.                                         |
| `findField(schema, name)`               | A top-level field by name.                                                 |
| `getSteps(schema)`                      | The steps. A form without steps has one implicit step.                     |
| `fieldsOfStep(schema, step)`            | The fields of a step, in order.                                            |
| `isEmpty(value)`                        | `undefined`, `null`, blank text or an empty array.                         |

### Validation

| Export                                          | Description                                       |
| ----------------------------------------------- | ------------------------------------------------- |
| `validateForm(schema, values, options?)`        | Errors for the whole form, keyed by value path.   |
| `validateStep(schema, index, values, options?)` | Errors for one step.                              |
| `validateFields(fields, values, options?)`      | Lower level; does not remove hidden values first. |
| `hasErrors(errors)`                             | Whether there is at least one error.              |
| `errorsUnder(errors, path)`                     | Errors for a path and everything inside it.       |
| `checkSchema(schema)`                           | Static problems in a schema, as `SchemaIssue[]`.  |

### Text and paths

| Export                       | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| `t(text, locale?)`           | Resolves an `I18nText`, falling back to the other locale.     |
| `format(template, params)`   | Fills `{name}` placeholders.                                  |
| `messages`, `DEFAULT_LOCALE` | Built-in validation messages; the default locale (`zh-TW`).   |
| `getPath`, `setPath`         | Read and immutably write a dot path such as `jobs.0.company`. |
| `joinPath`, `splitPath`      | Build and split dot paths.                                    |

## `@schema-form-kit/vue`

| Export                        | Description                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `SchemaForm`                  | The form component. See below.                                                             |
| `useSchemaForm(options)`      | Headless state. See [Customization](../guide/customization#_3-headless-build-your-own-ui). |
| `FieldRenderer`               | Renders one field with its label and errors; for custom layouts.                           |
| `TextField`, `NumberField`, … | The default field components; also `defaultComponents`.                                    |
| `useFormContext()`            | Form state for components rendered inside `<SchemaForm>`.                                  |
| `FieldComponentProps`         | Props of a field component.                                                                |
| `SchemaFormKit`               | Optional plugin: `app.use(SchemaFormKit)` registers `<SchemaForm>` globally.               |

Styles: `import '@schema-form-kit/vue/styles.css'`.

### `<SchemaForm>` props

| Prop               | Type                                    | Default   |
| ------------------ | --------------------------------------- | --------- |
| `schema`           | `FormSchema`                            | required  |
| `v-model`          | `FormValues`                            | `{}`      |
| `locale`           | `'zh-TW' \| 'en'`                       | `'zh-TW'` |
| `customValidators` | `Record<string, CustomValidator>`       | —         |
| `components`       | `Partial<Record<FieldType, Component>>` | —         |
| `hideHeader`       | `boolean`                               | `false`   |

Events, slots and exposed methods are listed under
[Customization](../guide/customization#slots-and-events).

## `@schema-form-kit/builder-core`

Every operation takes a schema and returns a new one; the input is never changed. Fields are
addressed by a name path such as `experiences.company`. Invalid operations throw `BuilderError`.

| Export                                                                            | Description                                                     |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `createEmptySchema(id?)`                                                          | A blank form.                                                   |
| `addField(schema, fieldOrType, { parent?, index?, stepId? })`                     | Adds a field; returns `{ schema, path }`.                       |
| `removeField`, `duplicateField`                                                   | Remove or copy a field.                                         |
| `moveField(schema, path, toIndex)`                                                | Reorders within its group.                                      |
| `moveFieldToStep(schema, name, stepId, index?)`                                   | Moves a top-level field to another step.                        |
| `updateField(schema, path, patch)`                                                | Changes properties other than the name and type.                |
| `renameField(schema, path, newName)`                                              | Renames and updates every condition that refers to the field.   |
| `changeFieldType(schema, path, type)`                                             | Changes the type, keeping what still fits.                      |
| `enableSteps`, `disableSteps`, `addStep`, `updateStep`, `removeStep`, `moveStep`  | Step editing.                                                   |
| `findReferences(schema, path)`                                                    | Conditions that refer to a field.                               |
| `palette`, `createField(type, siblingNames)`, `uniqueName`                        | Field templates for a palette.                                  |
| `RULES_BY_TYPE`, `CHOICE_TYPES`                                                   | Which rules and options each type supports.                     |
| `createHistory`, `commit`, `undo`, `redo`, `canUndo`, `canRedo`                   | Undo/redo history. `commit` can merge edits with `coalesceKey`. |
| `importSchema(json)`, `exportSchema(schema)`                                      | Parse with errors and warnings; pretty-print.                   |
| `getField`, `fieldsAt`, `walkFields`, `splitFieldPath`, `parentPath`, `childPath` | Tree helpers.                                                   |

## `@schema-form-kit/builder`

| Export                         | Description                                                       |
| ------------------------------ | ----------------------------------------------------------------- |
| `FormBuilder`                  | The builder UI. Props: `v-model:schema`, `locale`.                |
| `useBuilder(schema, options?)` | Builder state (selection, drag and drop, history) used by the UI. |
| `uiText`                       | The builder's interface text in each locale.                      |

Styles: `import '@schema-form-kit/builder/styles.css'`.
