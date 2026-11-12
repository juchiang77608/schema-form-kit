import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import type { FormSchema } from '@schema-form-kit/core';
import { useBuilder } from '../src/useBuilder';

const base = (): FormSchema => ({
  id: 'demo',
  version: 1,
  title: 'Demo',
  fields: [
    { name: 'a', type: 'text', label: 'A' },
    { name: 'b', type: 'text', label: 'B', visibleWhen: { field: 'a', op: 'notEmpty' } },
    { name: 'c', type: 'array', label: 'C', fields: [{ name: 'x', type: 'text', label: 'X' }] },
  ],
});

const names = (s: FormSchema) => s.fields.map((f) => f.name);

describe('useBuilder', () => {
  it('adds a field at a drop position and selects it', () => {
    const b = useBuilder(base());
    const path = b.add('email', { parent: '', index: 1 });
    expect(path).toBe('email');
    expect(names(b.schema.value)).toEqual(['a', 'email', 'b', 'c']);
    expect(b.selected.value).toBe('email');
  });

  it('adds into a group', () => {
    const b = useBuilder(base());
    expect(b.add('number', { parent: 'c', index: 0 })).toBe('c.number');
    const group = b.schema.value.fields[2];
    expect(group?.type === 'array' ? group.fields.map((f) => f.name) : []).toEqual(['number', 'x']);
  });

  it('drops a dragged field after its original position correctly', () => {
    const b = useBuilder(base());
    b.dragging.value = { kind: 'move', path: 'a' };
    b.drop({ parent: '', index: 3 }); // after "c"
    expect(names(b.schema.value)).toEqual(['b', 'c', 'a']);
    expect(b.dragging.value).toBe(null);

    b.dragging.value = { kind: 'new', type: 'date' };
    b.drop({ parent: '', index: 0 });
    expect(names(b.schema.value)).toEqual(['date', 'b', 'c', 'a']);
  });

  it('refuses to move a field into another group', () => {
    const b = useBuilder(base());
    expect(b.move('a', { parent: 'c', index: 0 })).toBe(false);
    expect(b.error.value).toMatch(/same group/);
    expect(names(b.schema.value)).toEqual(['a', 'b', 'c']);
  });

  it('nudges up and down', () => {
    const b = useBuilder(base());
    expect(b.nudge('a', 1)).toBe(true);
    expect(names(b.schema.value)).toEqual(['b', 'a', 'c']);
    expect(b.nudge('a', -1)).toBe(true);
    expect(names(b.schema.value)).toEqual(['a', 'b', 'c']);
    expect(b.nudge('a', -1)).toBe(false);
  });

  it('renames, keeps the selection and reports invalid names', () => {
    const b = useBuilder(base());
    b.selected.value = 'a';
    expect(b.rename('a', 'alpha')).toBe(true);
    expect(b.selected.value).toBe('alpha');
    expect(b.schema.value.fields[1]?.visibleWhen).toEqual({ field: 'alpha', op: 'notEmpty' });
    expect(b.rename('alpha', 'b')).toBe(false);
    expect(b.error.value).toMatch(/already exists/);
  });

  it('coalesces typing in one property into one undo step', () => {
    const b = useBuilder(base());
    for (const label of ['N', 'Na', 'Nam', 'Name']) b.update('a', { label }, 'label');
    expect(b.history.value.past).toHaveLength(1);
    b.undo();
    expect(b.schema.value.fields[0]?.label).toBe('A');
    b.redo();
    expect(b.schema.value.fields[0]?.label).toBe('Name');
  });

  it('clears the selection when the selected field disappears', async () => {
    const b = useBuilder(base());
    b.add('text');
    expect(b.selected.value).toBe('text');
    b.undo();
    await nextTick();
    expect(b.selected.value).toBe(null);
  });

  it('works with steps: adds to the active step and reorders inside it', () => {
    const b = useBuilder(base());
    b.setStepsEnabled(true);
    b.newStep();
    expect(b.activeStep.value?.id).toBe('step');
    b.add('email', { parent: '', index: 0 });
    expect(b.schema.value.steps?.[1]?.fields).toEqual(['email']);
    expect(b.canvasFields.value.map((f) => f.name)).toEqual(['email']);

    b.activeStepId.value = 'step1';
    b.dragging.value = { kind: 'move', path: 'c' };
    b.drop({ parent: '', index: 0 });
    expect(b.schema.value.steps?.[0]?.fields).toEqual(['c', 'a', 'b']);
  });

  it('notifies changes and loads imported JSON', async () => {
    const seen: FormSchema[] = [];
    const b = useBuilder(base(), { onChange: (s) => seen.push(s) });
    b.updateForm({ title: 'Renamed' });
    await nextTick();
    expect(seen.at(-1)?.title).toBe('Renamed');

    const bad = b.load('{');
    expect(bad.ok).toBe(false);
    const good = b.load(JSON.stringify({ id: 'x', version: 1, title: 'X', fields: [] }));
    expect(good.ok).toBe(true);
    expect(b.schema.value.id).toBe('x');
    b.undo();
    expect(b.schema.value.title).toBe('Renamed');
  });
});
