# ADR 0002: Hidden fields are removed before conditions are evaluated

- Status: Accepted
- Date: 2026-11-05

## Context

Fields can depend on other fields (`visibleWhen`, conditional `required`).
When a user answers a question and the question is later hidden, its value
is still in the form state. Evaluating conditions against that stale value
causes two bugs:

1. A field that depends on the hidden one stays visible
   (survey: score changed from 2 to 5, but "Tell us more about Other" still
   shows because `issues` still contains `"other"`).
2. A hidden answer is submitted even though the user can no longer see it.

Clearing values as soon as a field is hidden would lose input when the user
toggles back and forth.

## Decision

Keep raw values in state, and derive **effective values**: raw values with
hidden fields removed, recomputed until nothing else becomes hidden (a fixed
point, bounded by the number of fields).

- Visibility and conditional `required` are evaluated against effective values.
- `validateForm` / `validateStep` validate effective values.
- `<SchemaForm>` emits effective values on `submit`.

## Consequences

- Toggling a field back restores what the user typed.
- Submitted data only contains answers to visible questions.
- Each evaluation re-runs the pruning pass. Forms are small (tens of fields),
  so the cost is negligible; memoisation can be added if profiling shows a need.
