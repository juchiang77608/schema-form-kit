import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import type { FormSchema } from '@schema-form-kit/core';
import { FormBuilder } from '../src';

const schema = (): FormSchema => ({
  id: 'demo',
  version: 1,
  title: 'Demo',
  fields: [
    { name: 'plan', type: 'radio', label: 'Plan', options: [{ label: 'Team', value: 'team' }] },
    {
      name: 'company',
      type: 'text',
      label: 'Company',
      visibleWhen: { field: 'plan', op: 'eq', value: 'team' },
    },
  ],
});

const mountBuilder = () =>
  mount(FormBuilder, { props: { schema: schema(), locale: 'en' }, attachTo: document.body });
const canvasNames = (w: ReturnType<typeof mountBuilder>) =>
  w.findAll('.sfb-canvas > .sfb-list > .sfb-item').map((li) => li.attributes('data-path'));

describe('<FormBuilder>', () => {
  it('renders the fields on the canvas', () => {
    const w = mountBuilder();
    expect(canvasNames(w)).toEqual(['plan', 'company']);
    expect(w.find('.sfb-palette').text()).toContain('Dropdown');
  });

  it('adds a field from the palette, selects it and emits the new schema', async () => {
    const w = mountBuilder();
    await w.find('.sfb-palette__item[data-type="email"]').trigger('click');
    expect(canvasNames(w)).toEqual(['plan', 'company', 'email']);
    expect(w.find('.sfb-item--selected').attributes('data-path')).toBe('email');
    expect((w.find('[data-testid="prop-name"]').element as HTMLInputElement).value).toBe('email');
    await Promise.resolve();
    const emitted = w.emitted('update:schema');
    expect(emitted?.at(-1)?.[0]).toMatchObject({
      fields: [{ name: 'plan' }, { name: 'company' }, { name: 'email' }],
    });
  });

  it('drops a palette field at a position on the canvas', async () => {
    const w = mountBuilder();
    await w
      .find('.sfb-palette__item[data-type="date"]')
      .trigger('dragstart', { dataTransfer: { setData: () => {} } });
    await w.find('.sfb-canvas .sfb-drop[data-drop-index="0"]').trigger('drop');
    expect(canvasNames(w)).toEqual(['date', 'plan', 'company']);
  });

  it('reorders by dragging and with the keyboard buttons', async () => {
    const w = mountBuilder();
    await w
      .find('.sfb-item[data-path="plan"]')
      .trigger('dragstart', { dataTransfer: { setData: () => {} } });
    await w.find('.sfb-canvas .sfb-drop[data-drop-index="2"]').trigger('drop');
    expect(canvasNames(w)).toEqual(['company', 'plan']);

    await w.find('.sfb-item[data-path="plan"] button[aria-label^="Move up"]').trigger('click');
    expect(canvasNames(w)).toEqual(['plan', 'company']);
  });

  it('edits the label of the selected field', async () => {
    const w = mountBuilder();
    await w.find('.sfb-item[data-path="company"] .sfb-item__main').trigger('click');
    await w.find('[data-testid="prop-label"]').setValue('Company name');
    expect(w.find('.sfb-item[data-path="company"]').text()).toContain('Company name');
  });

  it('renames a field and keeps conditions working', async () => {
    const w = mountBuilder();
    await w.find('.sfb-item[data-path="plan"] .sfb-item__main').trigger('click');
    await w.find('[data-testid="prop-name"]').setValue('tier');
    await w
      .find('[data-testid="prop-name"]')
      .element.closest('form')!
      .dispatchEvent(new Event('submit'));
    await w.vm.$nextTick();
    const state = (w.vm as unknown as { state: { schema: { value: FormSchema } } }).state;
    expect(state.schema.value.fields[1]?.visibleWhen).toEqual({
      field: 'tier',
      op: 'eq',
      value: 'team',
    });
    expect(w.find('.sfb-item--selected').attributes('data-path')).toBe('tier');
  });

  it('shows an error for an invalid name and does not change the schema', async () => {
    const w = mountBuilder();
    await w.find('.sfb-item[data-path="plan"] .sfb-item__main').trigger('click');
    await w.find('[data-testid="prop-name"]').setValue('company');
    await w
      .find('[data-testid="prop-name"]')
      .element.closest('form')!
      .dispatchEvent(new Event('submit'));
    await w.vm.$nextTick();
    expect(w.find('[role="alert"]').text()).toContain('already exists');
    expect(canvasNames(w)).toEqual(['plan', 'company']);
  });

  it('undoes and redoes from the toolbar', async () => {
    const w = mountBuilder();
    expect(w.find('[data-testid="undo"]').attributes('disabled')).toBeDefined();
    await w.find('.sfb-palette__item[data-type="text"]').trigger('click');
    await w.find('[data-testid="undo"]').trigger('click');
    expect(canvasNames(w)).toEqual(['plan', 'company']);
    await w.find('[data-testid="redo"]').trigger('click');
    expect(canvasNames(w)).toEqual(['plan', 'company', 'text']);
  });

  it('previews the form with the renderer', async () => {
    const w = mountBuilder();
    const previewButton = w.findAll('.sfb-toolbar button').find((b) => b.text() === 'Preview')!;
    await previewButton.trigger('click');
    expect(w.find('.sfk-form').exists()).toBe(true);
    expect(w.find('input[type="radio"][value="team"]').exists()).toBe(true);
  });

  it('reports import errors and loads valid JSON', async () => {
    const w = mountBuilder();
    const importButton = w.findAll('.sfb-toolbar button').find((b) => b.text() === 'Import JSON')!;
    await importButton.trigger('click');
    await w
      .find('.sfb-dialog textarea')
      .setValue(
        '{"id":"x","version":1,"title":"X","fields":[{"name":"a","type":"slider","label":"A"}]}',
      );
    await w.find('[data-testid="import-apply"]').trigger('click');
    expect(w.find('.sfb-dialog [role="alert"]').text()).toContain('Unknown type "slider"');

    await w
      .find('.sfb-dialog textarea')
      .setValue(
        '{"id":"x","version":1,"title":"X","fields":[{"name":"a","type":"text","label":"A"}]}',
      );
    await w.find('[data-testid="import-apply"]').trigger('click');
    expect(w.find('.sfb-dialog').exists()).toBe(false);
    expect(canvasNames(w)).toEqual(['a']);
  });
});
