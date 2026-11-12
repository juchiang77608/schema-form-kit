# ADR 0004: Native drag and drop, with keyboard alternatives

- Status: Accepted
- Date: 2026-11-11

## Context

The visual builder lets users add fields by dragging them from a palette and
reorder fields on the canvas. Options:

1. A drag-and-drop library (SortableJS, vue-draggable-plus, dnd-kit ports).
2. The browser's native HTML5 drag and drop.

Drag and drop alone is not accessible: keyboard and screen-reader users cannot
drag.

## Decision

- Use native HTML5 drag and drop. The builder only needs two gestures (palette
  → canvas, reorder within a group), which the native API covers without a
  dependency.
- Keep the drag payload (`{ kind: 'new', type }` or `{ kind: 'move', path }`)
  in builder state rather than reading it back from `dataTransfer`. Browsers
  hide `dataTransfer` contents during `dragover`, and component tests can
  simulate a drop without a real `DataTransfer`.
- Every drag gesture has a keyboard equivalent: clicking a palette item adds
  the field (to the active step), and ↑ / ↓ buttons on each field reorder it.
- Moving a field between groups (top level ↔ repeatable group) is not
  supported: a field's conditions are scoped to its group, so moving it could
  silently change their meaning. The builder shows a message instead.
- Ctrl/⌘ + Z and Ctrl/⌘ + Shift + Z undo and redo, except while focus is in a
  text input, where the browser's own text undo applies.

## Consequences

- No extra runtime dependency; the builder bundle stays small.
- Touch devices get the click and button alternatives (native drag and drop is
  limited on mobile).
- All reorder logic is in `useBuilder` / `builder-core`, covered by unit tests;
  the components only translate events.
  EOF
  echo ok
