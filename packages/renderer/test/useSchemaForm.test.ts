import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import type { FormSchema } from '@schema-form-kit/core';
import { useSchemaForm } from '../src';

const schema: FormSchema = {
  id: 'trip',
  version: 1,
  title: 'Trip',
  fields: [
    { name: 'city', type: 'text', label: 'City', required: true },
    { name: 'nights', type: 'number', label: 'Nights', required: true, validations: [{ type: 'min', value: 1 }] },
    { name: 'notes', type: 'textarea', label: 'Notes' },
  ],
  steps: [
    { id: 'a', title: 'A', fields: ['city'] },
    { id: 'b', title: 'B', fields: ['nights'] },
    { id: 'c', title: 'C', fields: ['notes'] },
  ],
};

describe('useSchemaForm', () => {
  it('hides errors until a field is touched', () => {
    const form = useSchemaForm({ schema, locale: 'en' });
    expect(form.errors.value.city).toEqual(['City is required']);
    expect(form.errorsFor('city')).toEqual([]);
    form.touch('city');
    expect(form.errorsFor('city')).toEqual(['City is required']);
  });

  it('moves through steps only when each step is valid', () => {
    const form = useSchemaForm({ schema, locale: 'en' });
    expect(form.next()).toBe(false);
    expect(form.stepIndex.value).toBe(0);

    form.setValue('city', 'Tainan');
    expect(form.next()).toBe(true);
    expect(form.stepIndex.value).toBe(1);

    form.prev();
    expect(form.stepIndex.value).toBe(0);
  });

  it('goTo stops at the first invalid step', () => {
    const form = useSchemaForm({ schema, locale: 'en' });
    form.setValue('city', 'Tainan');
    expect(form.goTo(2)).toBe(false);
    expect(form.stepIndex.value).toBe(1);
    expect(form.errorsFor('nights')).toEqual(['Nights is required']);
  });

  it('validate jumps to the first step with errors', () => {
    const form = useSchemaForm({ schema, locale: 'en', initialValues: { city: 'Tainan', nights: 0 } });
    form.goTo(1);
    expect(form.validate()).toBe(false);
    expect(form.stepIndex.value).toBe(1);
    expect(form.errorsFor('nights')).toEqual(['Nights must be at least 1']);
  });

  it('keeps compatible values when the schema changes', () => {
    const current = ref<FormSchema>(schema);
    const form = useSchemaForm({ schema: current, initialValues: { city: 'Hualien' } });
    current.value = { ...schema, fields: schema.fields.slice(0, 1), steps: undefined };
    return Promise.resolve().then(() => {
      expect(form.values.value).toEqual({ city: 'Hualien' });
    });
  });

  it('reset clears values and touched state', () => {
    const form = useSchemaForm({ schema, locale: 'en' });
    form.setValue('city', 'Keelung');
    form.touch('city');
    form.reset();
    expect(form.values.value.city).toBe('');
    expect(form.errorsFor('city')).toEqual([]);
  });
});
