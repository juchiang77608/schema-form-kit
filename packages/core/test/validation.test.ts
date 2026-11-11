import { describe, expect, it } from 'vitest';
import {
  buildInitialValues,
  errorsUnder,
  effectiveValues,
  hasErrors,
  pruneHiddenValues,
  validateForm,
  validateStep,
  type FormSchema,
} from '../src';

const schema: FormSchema = {
  id: 'job-application',
  version: 1,
  title: { 'zh-TW': '求職申請', en: 'Job application' },
  fields: [
    { name: 'name', type: 'text', label: { 'zh-TW': '姓名', en: 'Name' }, required: true },
    { name: 'email', type: 'email', label: 'Email', required: true },
    {
      name: 'years',
      type: 'number',
      label: { 'zh-TW': '年資', en: 'Years' },
      validations: [
        { type: 'min', value: 0 },
        { type: 'max', value: 50 },
      ],
    },
    {
      name: 'level',
      type: 'select',
      label: { 'zh-TW': '職級', en: 'Level' },
      options: [
        { label: 'Junior', value: 'junior' },
        { label: 'Senior', value: 'senior' },
      ],
    },
    {
      name: 'portfolio',
      type: 'text',
      label: { 'zh-TW': '作品集網址', en: 'Portfolio URL' },
      required: { field: 'level', op: 'eq', value: 'senior' },
      validations: [{ type: 'pattern', value: '^https://' }],
    },
    {
      name: 'referrer',
      type: 'text',
      label: { 'zh-TW': '推薦人', en: 'Referrer' },
      required: true,
      visibleWhen: { field: 'source', op: 'eq', value: 'referral' },
    },
    {
      name: 'source',
      type: 'radio',
      label: { 'zh-TW': '得知管道', en: 'Source' },
      options: [
        { label: 'Web', value: 'web' },
        { label: 'Referral', value: 'referral' },
      ],
    },
    {
      name: 'experiences',
      type: 'array',
      label: { 'zh-TW': '工作經歷', en: 'Experience' },
      validations: [
        { type: 'minItems', value: 1 },
        { type: 'maxItems', value: 3 },
      ],
      fields: [
        {
          name: 'company',
          type: 'text',
          label: { 'zh-TW': '公司', en: 'Company' },
          required: true,
        },
        { name: 'current', type: 'switch', label: { 'zh-TW': '目前任職', en: 'Current' } },
        {
          name: 'endDate',
          type: 'date',
          label: { 'zh-TW': '離職日', en: 'End date' },
          required: { field: 'current', op: 'eq', value: false },
        },
      ],
    },
    {
      name: 'agree',
      type: 'switch',
      label: { 'zh-TW': '同意隱私權政策', en: 'Agree to privacy policy' },
      required: true,
    },
  ],
  steps: [
    { id: 'basic', title: 'Basic', fields: ['name', 'email', 'years', 'level', 'portfolio'] },
    { id: 'more', title: 'More', fields: ['source', 'referrer', 'experiences', 'agree'] },
  ],
};

const valid = () => ({
  ...buildInitialValues(schema),
  name: 'Mei',
  email: 'mei@example.com',
  years: 3,
  level: 'junior',
  source: 'web',
  experiences: [{ company: 'Acme', current: true, endDate: '' }],
  agree: true,
});

describe('buildInitialValues', () => {
  it('fills defaults by type and keeps existing values', () => {
    const values = buildInitialValues(schema, { name: 'Draft', unknown: 1 });
    expect(values.name).toBe('Draft');
    expect(values.years).toBe(null);
    expect(values.experiences).toEqual([]);
    expect(values.agree).toBe(false);
    expect('unknown' in values).toBe(false);
  });
});

describe('validateForm', () => {
  it('accepts valid values', () => {
    expect(validateForm(schema, valid())).toEqual({});
  });

  it('reports required fields with localized messages', () => {
    const errors = validateForm(schema, buildInitialValues(schema));
    expect(errors.name).toEqual(['請填寫「姓名」']);
    expect(validateForm(schema, buildInitialValues(schema), { locale: 'en' }).name).toEqual([
      'Name is required',
    ]);
  });

  it('checks types before rules', () => {
    const errors = validateForm(
      schema,
      { ...valid(), email: 'nope', level: 'cto' },
      { locale: 'en' },
    );
    expect(errors.email).toEqual(['Email must be a valid email address']);
    expect(errors.level).toEqual(['Level has an invalid option']);
  });

  it('applies range rules', () => {
    expect(validateForm(schema, { ...valid(), years: 99 }, { locale: 'en' }).years).toEqual([
      'Years must be at most 50',
    ]);
  });

  it('applies conditional required and skips rules on empty optional values', () => {
    expect(
      validateForm(schema, { ...valid(), level: 'senior' }, { locale: 'en' }).portfolio,
    ).toEqual(['Portfolio URL is required']);
    expect(
      validateForm(schema, { ...valid(), level: 'senior', portfolio: 'http://x' }, { locale: 'en' })
        .portfolio,
    ).toEqual(['Portfolio URL has an invalid format']);
  });

  it('ignores hidden fields even when required', () => {
    expect(validateForm(schema, valid()).referrer).toBeUndefined();
    expect(
      validateForm(schema, { ...valid(), source: 'referral' }, { locale: 'en' }).referrer,
    ).toEqual(['Referrer is required']);
  });

  it('validates array size and item fields with item-scoped conditions', () => {
    const errors = validateForm(
      schema,
      {
        ...valid(),
        experiences: [
          { company: '', current: true, endDate: '' },
          { company: 'B', current: false, endDate: '' },
          { company: 'C', current: false, endDate: '2024-02-30' },
        ],
      },
      { locale: 'en' },
    );
    expect(errors['experiences.0.company']).toEqual(['Company is required']);
    expect(errors['experiences.0.endDate']).toBeUndefined();
    expect(errors['experiences.1.endDate']).toEqual(['End date is required']);
    expect(errors['experiences.2.endDate']).toEqual(['End date must be a valid date']);
    expect(Object.keys(errorsUnder(errors, 'experiences'))).toHaveLength(3);

    expect(
      validateForm(schema, { ...valid(), experiences: [] }, { locale: 'en' }).experiences,
    ).toEqual(['Experience needs at least 1 items']);
  });

  it('requires a required switch to be on', () => {
    expect(validateForm(schema, { ...valid(), agree: false }, { locale: 'en' }).agree).toEqual([
      'Agree to privacy policy is required',
    ]);
  });

  it('runs custom validators and requires them to be registered', () => {
    const custom: FormSchema = {
      id: 'c',
      version: 1,
      title: 'C',
      fields: [
        {
          name: 'code',
          type: 'text',
          label: 'Code',
          validations: [{ type: 'custom', name: 'even', params: { min: 2 } }],
        },
      ],
    };
    const even = (value: unknown, ctx: { params: Record<string, unknown> }) =>
      Number(value) % 2 === 0 && Number(value) >= Number(ctx.params.min) ? true : 'Must be even';
    expect(validateForm(custom, { code: '3' }, { customValidators: { even } }).code).toEqual([
      'Must be even',
    ]);
    expect(hasErrors(validateForm(custom, { code: '4' }, { customValidators: { even } }))).toBe(
      false,
    );
    expect(() => validateForm(custom, { code: '3' })).toThrow('not registered');
  });
});

describe('validateStep', () => {
  it('only validates fields of that step', () => {
    const values = { ...buildInitialValues(schema), name: 'Mei', email: 'mei@example.com' };
    expect(validateStep(schema, 0, values)).toEqual({});
    expect(hasErrors(validateStep(schema, 1, values))).toBe(true);
  });

  it('throws on an unknown step', () => {
    expect(() => validateStep(schema, 5, valid())).toThrow(RangeError);
  });
});

describe('pruneHiddenValues', () => {
  it('drops hidden fields, including inside array items', () => {
    const pruneSchema: FormSchema = {
      id: 'p',
      version: 1,
      title: 'P',
      fields: [
        { name: 'hasPet', type: 'switch', label: 'Has pet' },
        {
          name: 'petName',
          type: 'text',
          label: 'Pet',
          visibleWhen: { field: 'hasPet', op: 'eq', value: true },
        },
        {
          name: 'jobs',
          type: 'array',
          label: 'Jobs',
          fields: [
            { name: 'current', type: 'switch', label: 'Current' },
            {
              name: 'end',
              type: 'date',
              label: 'End',
              visibleWhen: { field: 'current', op: 'eq', value: false },
            },
          ],
        },
      ],
    };
    const values = {
      hasPet: false,
      petName: 'Mochi',
      jobs: [
        { current: true, end: '2020-01-01' },
        { current: false, end: '2021-01-01' },
      ],
      stray: 1,
    };
    expect(pruneHiddenValues(pruneSchema, values)).toEqual({
      hasPet: false,
      jobs: [{ current: true }, { current: false, end: '2021-01-01' }],
    });
  });
});

describe('cascading visibility', () => {
  const cascade: FormSchema = {
    id: 'cascade',
    version: 1,
    title: 'Cascade',
    fields: [
      { name: 'score', type: 'number', label: 'Score' },
      {
        name: 'reasons',
        type: 'checkbox',
        label: 'Reasons',
        visibleWhen: { field: 'score', op: 'lte', value: 2 },
        options: [{ label: 'Other', value: 'other' }],
      },
      {
        name: 'detail',
        type: 'text',
        label: 'Detail',
        required: true,
        visibleWhen: { field: 'reasons', op: 'includes', value: 'other' },
      },
    ],
  };

  it('hides fields that depend on a hidden field with a stale value', () => {
    const stale = { score: 5, reasons: ['other'], detail: '' };
    expect(effectiveValues(cascade, stale)).toEqual({ score: 5 });
    expect(validateForm(cascade, stale)).toEqual({});
  });

  it('keeps the chain when every link is visible', () => {
    const values = { score: 1, reasons: ['other'], detail: '' };
    expect(Object.keys(validateForm(cascade, values, { locale: 'en' }))).toEqual(['detail']);
  });
});
