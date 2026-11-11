# ADR 0001: Keep the form engine framework-agnostic

- Status: Accepted
- Date: 2026-11-05

## Context

A form library has two kinds of logic: deciding _what_ the form means (which
fields are visible or required, whether values are valid, which step is
complete) and deciding _how_ it looks (components, events, styling).

If both live in Vue components, the rules can only be tested by mounting
components, and supporting another framework later means rewriting them.

## Decision

Split the library into two packages:

- `@schema-form-kit/core`: plain TypeScript with no runtime dependencies.
  Schema types, condition evaluation, validation, i18n messages, schema
  checks, initial values and hidden-value pruning.
- `@schema-form-kit/vue`: Vue 3 components and the `useSchemaForm`
  composable. It holds UI state (touched fields, current step) and delegates
  every rule to `core`.

The schema is plain JSON (no functions), so it can be stored in a database,
diffed in Git and produced by the visual builder.

## Consequences

- Most behaviour is covered by fast unit tests in `core` without a DOM.
- A React or Angular renderer only needs to reimplement the UI layer.
- Custom validators are referenced by name in the schema and registered at
  runtime, because functions cannot be serialised to JSON.
- `core` must stay dependency-free; anything framework-specific goes in the
  renderer.
