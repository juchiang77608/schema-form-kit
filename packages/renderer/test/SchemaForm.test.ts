import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import type { FormSchema } from '@schema-form-kit/core';
import { SchemaForm } from '../src';

const schema: FormSchema = {
  id: 'signup',
  version: 1,
  title: 'Sign up',
  fields: [
    { name: 'name', type: 'text', label: 'Name', required: true },
    {
      name: 'plan',
      type: 'radio',
      label: 'Plan',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Team', value: 'team' },
      ],
      defaultValue: 'free',
    },
    {
      name: 'company',
      type: 'text',
      label: 'Company',
      required: true,
      visibleWhen: { field: 'plan', op: 'eq', value: 'team' },
    },
    {
      name: 'members',
      type: 'array',
      label: 'Members',
      itemLabel: 'Member',
      visibleWhen: { field: 'plan', op: 'eq', value: 'team' },
      fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
    },
  ],
};

const wizard: FormSchema = {
  ...schema,
  id: 'wizard',
  steps: [
    { id: 'who', title: 'Who', fields: ['name'] },
    { id: 'plan', title: 'Plan', fields: ['plan', 'company', 'members'] },
  ],
};

function mountForm(s: FormSchema = schema, props: Record<string, unknown> = {}) {
  return mount(SchemaForm, {
    props: { schema: s, locale: 'en', ...props },
    attachTo: document.body,
  });
}

describe('<SchemaForm>', () => {
  it('renders visible fields with labels linked to inputs', () => {
    const wrapper = mountForm();
    const input = wrapper.find('input[name="name"]');
    expect(input.exists()).toBe(true);
    const label = wrapper.find(`label[for="${input.attributes('id')}"]`);
    expect(label.text()).toContain('Name');
    expect(wrapper.find('input[name="company"]').exists()).toBe(false);
  });

  it('shows errors only after blur or submit', async () => {
    const wrapper = mountForm();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);

    await wrapper.find('input[name="name"]').trigger('blur');
    expect(wrapper.find('[role="alert"]').text()).toBe('Name is required');
    expect(wrapper.find('input[name="name"]').attributes('aria-invalid')).toBe('true');
  });

  it('reveals conditional fields and validates them on submit', async () => {
    const wrapper = mountForm();
    await wrapper.find('input[type="radio"][value="team"]').setValue(true);
    expect(wrapper.find('input[name="company"]').exists()).toBe(true);

    await wrapper.find('input[name="name"]').setValue('Mei');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.emitted('invalid')).toHaveLength(1);
    expect(wrapper.text()).toContain('Company is required');
  });

  it('emits only visible values on a valid submit', async () => {
    const wrapper = mountForm(schema, {
      modelValue: { name: 'Mei', plan: 'free', company: 'Leftover' },
    });
    await wrapper.find('form').trigger('submit');

    const submitted = wrapper.emitted('submit');
    expect(submitted).toHaveLength(1);
    expect(submitted?.[0]?.[0]).toEqual({ name: 'Mei', plan: 'free' });
  });

  it('adds, edits and removes array items', async () => {
    const wrapper = mountForm(schema, {
      modelValue: { name: 'Mei', plan: 'team', company: 'Acme' },
    });

    await wrapper.find('.sfk-array > button.sfk-btn--secondary').trigger('click');
    const email = wrapper.find('input[name="members.0.email"]');
    expect(email.exists()).toBe(true);

    await email.setValue('not-an-email');
    await email.trigger('blur');
    expect(wrapper.text()).toContain('Email must be a valid email address');

    await wrapper.find('.sfk-btn--danger').trigger('click');
    expect(wrapper.find('input[name="members.0.email"]').exists()).toBe(false);
  });

  it('supports v-model', async () => {
    const wrapper = mountForm();
    await wrapper.find('input[name="name"]').setValue('Ann');
    const updates = wrapper.emitted('update:modelValue');
    expect(updates?.at(-1)?.[0]).toMatchObject({ name: 'Ann', plan: 'free' });
  });

  it('blocks the next step until the current one is valid', async () => {
    const wrapper = mountForm(wizard);
    expect(wrapper.findAll('.sfk-step')).toHaveLength(2);
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false);

    await wrapper.find('.sfk-footer .sfk-btn--primary').trigger('click');
    expect(wrapper.text()).toContain('Name is required');
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false);

    await wrapper.find('input[name="name"]').setValue('Mei');
    await wrapper.find('.sfk-footer .sfk-btn--primary').trigger('click');
    expect(wrapper.find('input[type="radio"]').exists()).toBe(true);
    expect(wrapper.emitted('step-change')?.[0]).toEqual([1]);

    await wrapper.find('.sfk-footer .sfk-btn--secondary').trigger('click');
    expect(wrapper.find('input[name="name"]').exists()).toBe(true);
  });

  it('uses a custom component for a field type', async () => {
    const Stars = defineComponent({
      props: {
        modelValue: { type: String, default: '' },
        inputId: { type: String, required: true },
      },
      emits: ['update:modelValue', 'blur'],
      setup(props, { emit }) {
        return () =>
          h(
            'button',
            {
              id: props.inputId,
              type: 'button',
              class: 'stars',
              onClick: () => emit('update:modelValue', '★★★'),
            },
            props.modelValue || 'rate',
          );
      },
    });
    const wrapper = mountForm(
      {
        id: 'c',
        version: 1,
        title: 'C',
        fields: [{ name: 'rating', type: 'text', label: 'Rating' }],
      },
      { components: { text: Stars } },
    );
    await wrapper.find('.stars').trigger('click');
    await nextTick();
    expect(wrapper.find('.stars').text()).toBe('★★★');
  });

  it('hides fields whose controlling field became hidden', async () => {
    const cascade: FormSchema = {
      id: 'cascade',
      version: 1,
      title: 'Cascade',
      fields: [
        { name: 'unhappy', type: 'switch', label: 'Unhappy' },
        {
          name: 'reason',
          type: 'radio',
          label: 'Reason',
          visibleWhen: { field: 'unhappy', op: 'eq', value: true },
          options: [{ label: 'Other', value: 'other' }],
        },
        {
          name: 'detail',
          type: 'text',
          label: 'Detail',
          visibleWhen: { field: 'reason', op: 'eq', value: 'other' },
        },
      ],
    };
    const wrapper = mountForm(cascade, { modelValue: { unhappy: true, reason: 'other' } });
    expect(wrapper.find('input[name="detail"]').exists()).toBe(true);

    await wrapper.find('button[role="switch"]').trigger('click');
    expect(wrapper.find('input[name="detail"]').exists()).toBe(false);
  });

  it('renders zh-TW messages by default', async () => {
    const wrapper = mount(SchemaForm, { props: { schema } });
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('請填寫「Name」');
    expect(wrapper.find('button[type="submit"]').text()).toBe('送出');
  });
});
