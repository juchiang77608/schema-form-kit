# @schema-form-kit/builder-core

Framework-agnostic editing operations for [schema-form-kit](https://github.com/juchiang77608/schema-form-kit)
forms. Every function is pure: it takes a schema and returns a new one.

```ts
import { addField, renameField, createHistory, commit, undo } from '@schema-form-kit/builder-core';

let history = createHistory(schema);
const { schema: withEmail, path } = addField(history.present, 'email', { index: 0 });
history = commit(history, withEmail);

// Renaming rewrites every condition that reads the field.
history = commit(history, renameField(history.present, path, 'contactEmail').schema);
history = undo(history);
```

See [ADR 0003](../../docs/adr/0003-builder-core.md) for the design.
