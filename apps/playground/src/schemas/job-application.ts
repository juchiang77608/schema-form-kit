import type { FormSchema } from '@schema-form-kit/core';

export const jobApplication: FormSchema = {
  id: 'job-application',
  version: 1,
  title: { 'zh-TW': '求職申請表', en: 'Job application' },
  description: {
    'zh-TW': '示範重複群組（工作經歷）與群組內的條件欄位。',
    en: 'Shows repeatable groups (experience) with conditions inside each item.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { 'zh-TW': '姓名', en: 'Name' },
      required: true,
      colSpan: 6,
    },
    {
      name: 'email',
      type: 'email',
      label: { 'zh-TW': '電子郵件', en: 'Email' },
      required: true,
      colSpan: 6,
    },
    {
      name: 'position',
      type: 'select',
      label: { 'zh-TW': '應徵職缺', en: 'Position' },
      required: true,
      colSpan: 6,
      options: [
        { label: { 'zh-TW': '前端工程師', en: 'Frontend engineer' }, value: 'frontend' },
        { label: { 'zh-TW': '後端工程師', en: 'Backend engineer' }, value: 'backend' },
        { label: { 'zh-TW': '資深全端工程師', en: 'Senior full-stack engineer' }, value: 'senior-fullstack' },
      ],
    },
    {
      name: 'expectedStart',
      type: 'date',
      label: { 'zh-TW': '可到職日', en: 'Available from' },
      colSpan: 6,
    },
    {
      name: 'portfolio',
      type: 'text',
      label: { 'zh-TW': '作品集網址', en: 'Portfolio URL' },
      placeholder: 'https://',
      description: {
        'zh-TW': '應徵資深職缺時必填。',
        en: 'Required for senior positions.',
      },
      required: { field: 'position', op: 'eq', value: 'senior-fullstack' },
      validations: [
        {
          type: 'pattern',
          value: '^https://',
          message: { 'zh-TW': '網址需以 https:// 開頭', en: 'URL must start with https://' },
        },
      ],
    },
    {
      name: 'experiences',
      type: 'array',
      label: { 'zh-TW': '工作經歷', en: 'Work experience' },
      itemLabel: { 'zh-TW': '經歷', en: 'Experience' },
      required: true,
      validations: [{ type: 'maxItems', value: 5 }],
      fields: [
        {
          name: 'company',
          type: 'text',
          label: { 'zh-TW': '公司', en: 'Company' },
          required: true,
          colSpan: 6,
        },
        {
          name: 'title',
          type: 'text',
          label: { 'zh-TW': '職稱', en: 'Title' },
          required: true,
          colSpan: 6,
        },
        {
          name: 'startDate',
          type: 'date',
          label: { 'zh-TW': '到職日', en: 'Start date' },
          required: true,
          colSpan: 4,
        },
        {
          name: 'current',
          type: 'switch',
          label: { 'zh-TW': '目前任職中', en: 'Current job' },
          colSpan: 4,
        },
        {
          name: 'endDate',
          type: 'date',
          label: { 'zh-TW': '離職日', en: 'End date' },
          required: true,
          colSpan: 4,
          visibleWhen: { field: 'current', op: 'eq', value: false },
        },
      ],
    },
    {
      name: 'yearsOfExperience',
      type: 'number',
      label: { 'zh-TW': '相關年資', en: 'Years of experience' },
      validations: [
        { type: 'min', value: 0 },
        { type: 'max', value: 50 },
      ],
      colSpan: 6,
    },
    {
      name: 'motivation',
      type: 'textarea',
      label: { 'zh-TW': '應徵動機', en: 'Motivation' },
      validations: [{ type: 'maxLength', value: 500 }],
    },
  ],
};
