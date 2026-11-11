import { describe, expect, it } from 'vitest';
import {
  addField,
  canRedo,
  canUndo,
  commit,
  createEmptySchema,
  createHistory,
  exportSchema,
  importSchema,
  redo,
  undo,
  updateField,
} from '../src';

describe('history', () => {
  it('undoes and redoes commits', () => {
    let h = createHistory(1);
    h = commit(h, 2);
    h = commit(h, 3);
    expect(canUndo(h)).toBe(true);
    h = undo(h);
    expect(h.present).toBe(2);
    h = undo(h);
    expect(h.present).toBe(1);
    expect(canUndo(h)).toBe(false);
    expect(undo(h)).toBe(h);
    h = redo(h);
    expect(h.present).toBe(2);
    expect(canRedo(h)).toBe(true);
  });

  it('clears the redo stack on a new commit', () => {
    let h = commit(commit(createHistory('a'), 'b'), 'c');
    h = commit(undo(h), 'd');
    expect(canRedo(h)).toBe(false);
    expect(h.past).toEqual(['a', 'b']);
  });

  it('coalesces commits with the same key into one undo step', () => {
    let h = createHistory('');
    for (const text of ['H', 'He', 'Hel', 'Hell', 'Hello']) h = commit(h, text, { coalesceKey: 'label:name' });
    h = commit(h, 'Hello!', { coalesceKey: 'label:email' });
    expect(h.past).toEqual(['', 'Hello']);
    expect(undo(h).present).toBe('Hello');
    expect(undo(undo(h)).present).toBe('');
  });

  it('does not coalesce across an undo', () => {
    let h = commit(createHistory('a'), 'ab', { coalesceKey: 'k' });
    h = undo(h);
    h = commit(h, 'ac', { coalesceKey: 'k' });
    expect(h.past).toEqual(['a']);
  });

  it('ignores no-op commits and respects the limit', () => {
    let h = createHistory(0, 3);
    expect(commit(h, 0)).toBe(h);
    for (let i = 1; i <= 10; i += 1) h = commit(h, i);
    expect(h.past).toEqual([7, 8, 9]);
  });

  it('works with schema edits', () => {
    let h = createHistory(createEmptySchema());
    h = commit(h, addField(h.present, 'text').schema);
    h = commit(h, updateField(h.present, 'text', { label: 'Name' }), { coalesceKey: 'text.label' });
    expect(h.present.fields[0]?.label).toBe('Name');
    expect(undo(h).present.fields[0]?.label).toEqual({ 'zh-TW': '單行文字', en: 'Text' });
    expect(undo(undo(h)).present.fields).toEqual([]);
  });
});

describe('importSchema / exportSchema', () => {
  it('round-trips a schema', () => {
    const schema = addField(createEmptySchema('x'), 'radio').schema;
    const result = importSchema(exportSchema(schema));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.schema).toEqual(schema);
      expect(result.warnings).toEqual([]);
    }
  });

  it('reports invalid JSON and structural errors', () => {
    const bad = importSchema('{ nope');
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors[0]?.message).toMatch(/^Invalid JSON/);

    const shape = importSchema(
      JSON.stringify({
        id: 'x',
        version: 2,
        title: 'X',
        fields: [{ name: 'a', type: 'slider', label: 'A' }, { name: 'b', type: 'select', label: 'B' }, 'oops'],
      }),
    );
    expect(shape.ok).toBe(false);
    if (!shape.ok) {
      expect(shape.errors.map((e) => e.path)).toEqual(['version', 'fields[0].type', 'fields[1].options', 'fields[2]']);
    }
  });

  it('returns semantic problems as warnings', () => {
    const result = importSchema(
      JSON.stringify({
        id: 'x',
        version: 1,
        title: 'X',
        fields: [{ name: 'a', type: 'text', label: 'A', visibleWhen: { field: 'ghost', op: 'empty' } }],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings.map((w) => w.message)).toEqual(['Unknown field "ghost" in condition']);
  });
});
