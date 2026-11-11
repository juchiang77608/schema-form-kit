import { describe, expect, it } from 'vitest';
import { checkSchema, type FormSchema } from '@schema-form-kit/core';
import {
  BuilderError,
  addField,
  addStep,
  changeFieldType,
  createEmptySchema,
  disableSteps,
  duplicateField,
  enableSteps,
  findReferences,
  getField,
  moveField,
  moveFieldToStep,
  moveStep,
  removeField,
  removeStep,
  renameField,
  updateField,
  updateStep,
} from '../src';

const base = (): FormSchema => ({
  id: 'demo',
  version: 1,
  title: 'Demo',
  fields: [
    { name: 'role', type: 'radio', label: 'Role', options: [{ label: 'A', value: 'a' }] },
    { name: 'note', type: 'text', label: 'Note', visibleWhen: { field: 'role', op: 'eq', value: 'a' } },
    {
      name: 'jobs',
      type: 'array',
      label: 'Jobs',
      visibleWhen: { not: { field: 'role', op: 'empty' } },
      fields: [
        { name: 'current', type: 'switch', label: 'Current' },
        {
          name: 'end',
          type: 'date',
          label: 'End',
          required: { all: [{ field: 'current', op: 'eq', value: false }, { field: 'role', op: 'eq', value: 'a' }] },
        },
      ],
    },
  ],
});

const names = (schema: FormSchema) => schema.fields.map((f) => f.name);

describe('addField', () => {
  it('adds a field with a unique name and defaults', () => {
    let schema = createEmptySchema();
    const first = addField(schema, 'select');
    schema = first.schema;
    const second = addField(schema, 'select');
    expect(first.path).toBe('select');
    expect(second.path).toBe('select_2');
    const field = getField(second.schema, 'select_2');
    expect(field?.type).toBe('select');
    expect(field && 'options' in field ? field.options.length : 0).toBe(2);
    expect(checkSchema(second.schema)).toEqual([]);
  });

  it('inserts at an index and inside groups', () => {
    const atStart = addField(base(), 'text', { index: 0 });
    expect(names(atStart.schema)[0]).toBe('text');

    const nested = addField(base(), 'number', { parent: 'jobs' });
    expect(nested.path).toBe('jobs.number');
    expect(getField(nested.schema, 'jobs.number')?.type).toBe('number');
  });

  it('places new top-level fields into a step', () => {
    let schema = enableSteps(base());
    const added = addStep(schema);
    schema = added.schema;
    const into = addField(schema, 'email', { stepId: 'step1' });
    expect(into.schema.steps?.[0]?.fields).toContain('email');
    const toLast = addField(schema, 'email');
    expect(toLast.schema.steps?.[1]?.fields).toEqual(['email']);
  });

  it('rejects an unknown group', () => {
    expect(() => addField(base(), 'text', { parent: 'nope' })).toThrow(BuilderError);
    expect(() => addField(base(), 'text', { parent: 'note' })).toThrow('not a group');
  });

  it('never mutates the input', () => {
    const schema = base();
    const snapshot = JSON.stringify(schema);
    addField(schema, 'text', { parent: 'jobs' });
    removeField(schema, 'note');
    renameField(schema, 'role', 'kind');
    expect(JSON.stringify(schema)).toBe(snapshot);
  });
});

describe('removeField / duplicateField / moveField', () => {
  it('removes a field and its step entry', () => {
    const schema = removeField(enableSteps(base()), 'note');
    expect(names(schema)).toEqual(['role', 'jobs']);
    expect(schema.steps?.[0]?.fields).toEqual(['role', 'jobs']);
  });

  it('duplicates right after the original', () => {
    const { schema, path } = duplicateField(enableSteps(base()), 'note');
    expect(path).toBe('note_copy');
    expect(names(schema)).toEqual(['role', 'note', 'note_copy', 'jobs']);
    expect(schema.steps?.[0]?.fields).toEqual(['role', 'note', 'note_copy', 'jobs']);
    expect(getField(schema, 'note_copy')?.visibleWhen).toEqual(getField(schema, 'note')?.visibleWhen);
  });

  it('moves among siblings', () => {
    expect(names(moveField(base(), 'jobs', 0))).toEqual(['jobs', 'role', 'note']);
    const nested = moveField(base(), 'jobs.end', 0);
    const jobs = getField(nested, 'jobs');
    expect(jobs?.type === 'array' ? jobs.fields.map((f) => f.name) : []).toEqual(['end', 'current']);
  });

  it('moves a field between steps', () => {
    let schema = addStep(enableSteps(base())).schema;
    schema = moveFieldToStep(schema, 'note', 'step', 0);
    expect(schema.steps?.map((s) => s.fields)).toEqual([['role', 'jobs'], ['note']]);
  });
});

describe('updateField', () => {
  it('patches properties and removes undefined keys', () => {
    let schema = updateField(base(), 'note', { label: 'Remarks', placeholder: 'Type here' });
    expect(getField(schema, 'note')?.label).toBe('Remarks');
    schema = updateField(schema, 'note', { visibleWhen: undefined });
    expect(getField(schema, 'note')).not.toHaveProperty('visibleWhen');
  });

  it('refuses to change name or type', () => {
    expect(() => updateField(base(), 'note', { name: 'x' } as never)).toThrow('renameField');
  });
});

describe('renameField', () => {
  it('rewrites conditions everywhere, including nested and combined ones', () => {
    const { schema, path } = renameField(base(), 'role', 'kind');
    expect(path).toBe('kind');
    expect(getField(schema, 'note')?.visibleWhen).toEqual({ field: 'kind', op: 'eq', value: 'a' });
    expect(getField(schema, 'jobs')?.visibleWhen).toEqual({ not: { field: 'kind', op: 'empty' } });
    expect(getField(schema, 'jobs.end')?.required).toEqual({
      all: [
        { field: 'current', op: 'eq', value: false },
        { field: 'kind', op: 'eq', value: 'a' },
      ],
    });
    expect(checkSchema(schema)).toEqual([]);
  });

  it('renames a field inside a group and its sibling references only', () => {
    const { schema } = renameField(base(), 'jobs.current', 'isCurrent');
    expect(getField(schema, 'jobs.end')?.required).toEqual({
      all: [
        { field: 'isCurrent', op: 'eq', value: false },
        { field: 'role', op: 'eq', value: 'a' },
      ],
    });
  });

  it('respects shadowing: an item sibling with the same name is not the top-level field', () => {
    const shadow: FormSchema = {
      id: 's',
      version: 1,
      title: 'S',
      fields: [
        { name: 'status', type: 'text', label: 'Status' },
        {
          name: 'items',
          type: 'array',
          label: 'Items',
          fields: [
            { name: 'status', type: 'text', label: 'Item status' },
            { name: 'why', type: 'text', label: 'Why', visibleWhen: { field: 'status', op: 'eq', value: 'x' } },
          ],
        },
        { name: 'outer', type: 'text', label: 'Outer', visibleWhen: { field: 'status', op: 'notEmpty' } },
      ],
    };
    const { schema } = renameField(shadow, 'status', 'state');
    expect(getField(schema, 'outer')?.visibleWhen).toEqual({ field: 'state', op: 'notEmpty' });
    expect(getField(schema, 'items.why')?.visibleWhen).toEqual({ field: 'status', op: 'eq', value: 'x' });
  });

  it('updates steps and validates the new name', () => {
    const { schema } = renameField(enableSteps(base()), 'note', 'remark');
    expect(schema.steps?.[0]?.fields).toEqual(['role', 'remark', 'jobs']);
    expect(() => renameField(base(), 'note', '1bad')).toThrow('not a valid name');
    expect(() => renameField(base(), 'note', 'role')).toThrow('already exists');
    expect(renameField(base(), 'note', 'note').schema).toEqual(base());
  });
});

describe('findReferences', () => {
  it('lists dependent fields for a delete warning', () => {
    expect(findReferences(base(), 'role')).toEqual([
      { from: 'note', property: 'visibleWhen' },
      { from: 'jobs', property: 'visibleWhen' },
      { from: 'jobs.end', property: 'required' },
    ]);
    expect(findReferences(base(), 'jobs.current')).toEqual([{ from: 'jobs.end', property: 'required' }]);
    expect(findReferences(base(), 'note')).toEqual([]);
  });
});

describe('changeFieldType', () => {
  it('adds options when switching to a choice type and keeps compatible rules', () => {
    let schema = updateField(base(), 'note', {
      validations: [
        { type: 'maxLength', value: 10 },
        { type: 'custom', name: 'x' },
      ],
      defaultValue: 'hello',
    });
    schema = changeFieldType(schema, 'note', 'select');
    const field = getField(schema, 'note');
    expect(field?.type).toBe('select');
    expect(field && 'options' in field ? field.options.length : 0).toBe(2);
    expect(field?.validations).toEqual([{ type: 'custom', name: 'x' }]);
    expect(field).not.toHaveProperty('defaultValue');
    expect(field?.visibleWhen).toEqual({ field: 'role', op: 'eq', value: 'a' });
  });

  it('keeps existing options between choice types and drops them otherwise', () => {
    const asCheckbox = changeFieldType(base(), 'role', 'checkbox');
    const role = getField(asCheckbox, 'role');
    expect(role && 'options' in role ? role.options : []).toEqual([{ label: 'A', value: 'a' }]);
    const asText = changeFieldType(base(), 'role', 'text');
    expect(getField(asText, 'role')).not.toHaveProperty('options');
  });

  it('creates a starter field when turning into a group', () => {
    const schema = changeFieldType(base(), 'note', 'array');
    expect(checkSchema(schema)).toEqual([]);
    expect(getField(schema, 'note.text')?.type).toBe('text');
  });
});

describe('steps', () => {
  it('enables steps with every field in step 1 and disables them in step order', () => {
    let schema = enableSteps(base());
    expect(schema.steps).toEqual([{ id: 'step1', title: { 'zh-TW': '步驟 1', en: 'Step 1' }, fields: ['role', 'note', 'jobs'] }]);
    schema = addStep(schema).schema;
    schema = moveFieldToStep(schema, 'role', 'step', 0);
    schema = disableSteps(schema);
    expect(schema).not.toHaveProperty('steps');
    expect(names(schema)).toEqual(['note', 'jobs', 'role']);
  });

  it('removing a step hands its fields to a neighbour', () => {
    let schema = addStep(enableSteps(base())).schema;
    schema = moveFieldToStep(schema, 'jobs', 'step');
    expect(removeStep(schema, 'step').steps).toEqual([
      { id: 'step1', title: { 'zh-TW': '步驟 1', en: 'Step 1' }, fields: ['role', 'note', 'jobs'] },
    ]);
    expect(removeStep(schema, 'step1').steps?.[0]?.fields).toEqual(['role', 'note', 'jobs']);
    expect(removeStep(enableSteps(base()), 'step1')).not.toHaveProperty('steps');
  });

  it('renames and reorders steps', () => {
    let schema = addStep(enableSteps(base()), 'Second').schema;
    schema = updateStep(schema, 'step', { title: 'Details' });
    schema = moveStep(schema, 'step', 0);
    expect(schema.steps?.map((s) => s.title)).toEqual(['Details', { 'zh-TW': '步驟 1', en: 'Step 1' }]);
    expect(checkSchema(schema)).toEqual([]);
  });
});
