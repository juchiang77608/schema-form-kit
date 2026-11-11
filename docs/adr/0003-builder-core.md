# ADR 0003: Builder logic lives in a framework-agnostic package

- Status: Accepted
- Date: 2026-11-10

## Context

The visual builder edits a `FormSchema`: add, remove, move, duplicate and
rename fields, change types, manage steps, undo/redo, import and export.
Several of these edits have non-obvious consequences:

- Renaming a field must rewrite every condition that reads it — including
  conditions nested in `all` / `any` / `not`, and conditions inside array items,
  where a sibling with the same name shadows the top-level field.
- Changing a field's type must add or drop options, sub-fields, default values
  and validation rules that no longer apply.
- Removing a step must hand its fields to a neighbouring step.

If this logic lives in Vue components it can only be tested through the UI,
and drag-and-drop tests are slow and brittle.

## Decision

Add `@schema-form-kit/builder-core`: pure, immutable functions
`(schema, …) → schema` plus a generic undo/redo history. The Vue builder only
maps user gestures to these functions and renders the result.

- Fields are addressed by **name paths** (`"jobs.end"`), not indices, so a
  selection stays valid when fields are reordered.
- Edits that would break the schema throw `BuilderError` with a message the UI
  can show (invalid or duplicate names, unknown fields or steps).
- Deleting a field does **not** silently rewrite conditions; `findReferences`
  lists dependents so the UI can warn first, and `checkSchema` flags leftovers.
- History commits can share a `coalesceKey` so typing a label is one undo step.

## Consequences

- Builder behaviour is covered by fast unit tests (31 at the time of writing).
- The UI layer stays thin; another framework could reuse the same package.
- Every edit allocates a new schema object. Forms are small, so this is cheap,
  and it makes undo/redo and change detection trivial.
