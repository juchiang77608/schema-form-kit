import { describe, expect, it } from 'vitest';
import { checkSchema, type FormSchema } from '../src';

describe('checkSchema', () => {
  it('accepts a well-formed schema', () => {
    const schema: FormSchema = {
      id: 'ok',
      version: 1,
      title: 'OK',
      fields: [
        { name: 'kind', type: 'radio', label: 'Kind', options: [{ label: 'A', value: 'a' }] },
        {
          name: 'items',
          type: 'array',
          label: 'Items',
          visibleWhen: { field: 'kind', op: 'eq', value: 'a' },
          fields: [
            { name: 'done', type: 'switch', label: 'Done' },
            { name: 'date', type: 'date', label: 'Date', visibleWhen: { field: 'done', op: 'eq', value: true } },
          ],
        },
      ],
      steps: [{ id: 's1', title: 'S1', fields: ['kind', 'items'] }],
    };
    expect(checkSchema(schema)).toEqual([]);
  });

  it('reports common mistakes', () => {
    const schema = {
      id: 'bad',
      version: 1,
      title: 'Bad',
      fields: [
        { name: 'a', type: 'text', label: 'A', visibleWhen: { field: 'ghost', op: 'empty' } },
        { name: 'a', type: 'text', label: 'A again' },
        { name: '1x', type: 'select', label: 'X', options: [] },
        { name: 'self', type: 'text', label: 'S', required: { field: 'self', op: 'empty' } },
        { name: 'p', type: 'text', label: 'P', validations: [{ type: 'pattern', value: '(' }] },
      ],
      steps: [
        { id: 's1', title: 'S1', fields: ['a', 'missing'] },
        { id: 's2', title: 'S2', fields: ['a'] },
      ],
    } as unknown as FormSchema;

    const messages = checkSchema(schema).map((i) => i.message);
    expect(messages).toContain('Unknown field "ghost" in condition');
    expect(messages).toContain('Duplicate field name "a"');
    expect(messages).toContain('Invalid field name "1x"');
    expect(messages).toContain('"1x" needs at least one option');
    expect(messages).toContain('"self" depends on itself');
    expect(messages).toContain('Invalid pattern "("');
    expect(messages).toContain('Unknown field "missing"');
    expect(messages).toContain('"a" is already placed in step "s1"');
    expect(messages).toContain('Field "p" is not placed in any step');
  });
});
