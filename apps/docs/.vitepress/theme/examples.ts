import type { CustomValidator, FormSchema } from '@schema-form-kit/core';

export interface Example {
  schema: FormSchema;
  customValidators?: Record<string, CustomValidator>;
}

const contact: FormSchema = {
  id: 'contact',
  version: 1,
  title: { en: 'Contact us', 'zh-TW': '聯絡我們' },
  fields: [
    { name: 'email', type: 'email', label: { en: 'Email', 'zh-TW': '電子郵件' }, required: true },
    {
      name: 'topic',
      type: 'select',
      label: { en: 'Topic', 'zh-TW': '主題' },
      options: [
        { label: { en: 'Sales', 'zh-TW': '業務洽詢' }, value: 'sales' },
        { label: { en: 'Other', 'zh-TW': '其他' }, value: 'other' },
      ],
    },
    {
      name: 'detail',
      type: 'textarea',
      label: { en: 'Tell us more', 'zh-TW': '詳細說明' },
      required: true,
      visibleWhen: { field: 'topic', op: 'eq', value: 'other' },
    },
  ],
};

const conditions: FormSchema = {
  id: 'shipping',
  version: 1,
  title: { en: 'Delivery', 'zh-TW': '配送方式' },
  fields: [
    {
      name: 'method',
      type: 'radio',
      label: { en: 'Delivery method', 'zh-TW': '配送方式' },
      required: true,
      options: [
        { label: { en: 'Pick up in store', 'zh-TW': '門市自取' }, value: 'pickup' },
        { label: { en: 'Home delivery', 'zh-TW': '宅配' }, value: 'home' },
      ],
    },
    {
      name: 'address',
      type: 'text',
      label: { en: 'Address', 'zh-TW': '地址' },
      required: true,
      visibleWhen: { field: 'method', op: 'eq', value: 'home' },
    },
    {
      name: 'floor',
      type: 'number',
      label: { en: 'Floor', 'zh-TW': '樓層' },
      visibleWhen: { field: 'address', op: 'notEmpty' },
      description: {
        en: 'Depends on "Address", which depends on "Delivery method".',
        'zh-TW': '依賴「地址」，而「地址」又依賴「配送方式」。',
      },
    },
    {
      name: 'gift',
      type: 'switch',
      label: { en: 'This is a gift', 'zh-TW': '這是禮物' },
    },
    {
      name: 'message',
      type: 'textarea',
      label: { en: 'Gift message', 'zh-TW': '禮物卡片留言' },
      visibleWhen: { field: 'gift', op: 'eq', value: true },
      required: { field: 'method', op: 'eq', value: 'home' },
    },
  ],
};

const validation: FormSchema = {
  id: 'signup',
  version: 1,
  title: { en: 'Create an account', 'zh-TW': '建立帳號' },
  fields: [
    {
      name: 'username',
      type: 'text',
      label: { en: 'Username', 'zh-TW': '使用者名稱' },
      required: true,
      validations: [
        { type: 'minLength', value: 3 },
        {
          type: 'pattern',
          value: '^[a-z0-9_]+$',
          message: {
            en: 'Use lowercase letters, numbers and _ only',
            'zh-TW': '只能使用小寫英文、數字與底線',
          },
        },
        { type: 'custom', name: 'notReserved', params: { words: ['admin', 'root'] } },
      ],
    },
    {
      name: 'age',
      type: 'number',
      label: { en: 'Age', 'zh-TW': '年齡' },
      validations: [
        { type: 'min', value: 18 },
        { type: 'max', value: 120 },
      ],
    },
    {
      name: 'interests',
      type: 'checkbox',
      label: { en: 'Interests', 'zh-TW': '興趣' },
      options: [
        { label: { en: 'Design', 'zh-TW': '設計' }, value: 'design' },
        { label: { en: 'Engineering', 'zh-TW': '工程' }, value: 'engineering' },
        { label: { en: 'Product', 'zh-TW': '產品' }, value: 'product' },
      ],
      validations: [{ type: 'minItems', value: 1 }],
    },
  ],
};

const notReserved: CustomValidator = (value, { params }) => {
  const words = (params.words as string[] | undefined) ?? [];
  return typeof value === 'string' && words.includes(value.toLowerCase())
    ? `"${value}" is reserved`
    : true;
};

const wizard: FormSchema = {
  id: 'application',
  version: 1,
  title: { en: 'Job application', 'zh-TW': '職缺應徵' },
  fields: [
    { name: 'name', type: 'text', label: { en: 'Full name', 'zh-TW': '姓名' }, required: true },
    { name: 'email', type: 'email', label: { en: 'Email', 'zh-TW': '電子郵件' }, required: true },
    {
      name: 'experiences',
      type: 'array',
      label: { en: 'Work experience', 'zh-TW': '工作經歷' },
      itemLabel: { en: 'Job', 'zh-TW': '工作' },
      validations: [{ type: 'minItems', value: 1 }],
      fields: [
        {
          name: 'company',
          type: 'text',
          label: { en: 'Company', 'zh-TW': '公司' },
          required: true,
          colSpan: 6,
        },
        { name: 'start', type: 'date', label: { en: 'Start', 'zh-TW': '開始' }, colSpan: 6 },
        { name: 'current', type: 'switch', label: { en: 'I work here now', 'zh-TW': '目前在職' } },
        {
          name: 'end',
          type: 'date',
          label: { en: 'End', 'zh-TW': '結束' },
          required: true,
          visibleWhen: { field: 'current', op: 'neq', value: true },
        },
      ],
    },
    {
      name: 'agree',
      type: 'switch',
      label: { en: 'I agree to the privacy policy', 'zh-TW': '我同意隱私權政策' },
      required: true,
    },
  ],
  steps: [
    { id: 'about', title: { en: 'About you', 'zh-TW': '基本資料' }, fields: ['name', 'email'] },
    { id: 'work', title: { en: 'Experience', 'zh-TW': '經歷' }, fields: ['experiences'] },
    { id: 'confirm', title: { en: 'Confirm', 'zh-TW': '確認' }, fields: ['agree'] },
  ],
};

export type ExampleName = 'contact' | 'conditions' | 'validation' | 'wizard';

export const examples: Record<ExampleName, Example> = {
  contact: { schema: contact },
  conditions: { schema: conditions },
  validation: { schema: validation, customValidators: { notReserved } },
  wizard: { schema: wizard },
};
