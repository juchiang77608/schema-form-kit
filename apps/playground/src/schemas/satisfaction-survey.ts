import type { FormSchema } from '@schema-form-kit/core';

const scale = [1, 2, 3, 4, 5].map((n) => ({ label: String(n), value: n }));

export const satisfactionSurvey: FormSchema = {
  id: 'satisfaction-survey',
  version: 1,
  title: { 'zh-TW': '顧客滿意度問卷', en: 'Customer satisfaction survey' },
  description: {
    'zh-TW': '示範 all / any 組合條件：低分才追問原因。',
    en: 'Shows all / any conditions: follow-up questions only for low scores.',
  },
  submitLabel: { 'zh-TW': '送出問卷', en: 'Send feedback' },
  fields: [
    {
      name: 'overall',
      type: 'radio',
      label: { 'zh-TW': '整體滿意度（1–5）', en: 'Overall satisfaction (1–5)' },
      required: true,
      options: scale,
    },
    {
      name: 'support',
      type: 'radio',
      label: { 'zh-TW': '客服滿意度（1–5）', en: 'Support satisfaction (1–5)' },
      required: true,
      options: scale,
    },
    {
      name: 'issues',
      type: 'checkbox',
      label: { 'zh-TW': '哪些地方需要改進？', en: 'What should we improve?' },
      required: true,
      visibleWhen: {
        any: [
          { field: 'overall', op: 'lte', value: 2 },
          { field: 'support', op: 'lte', value: 2 },
        ],
      },
      options: [
        { label: { 'zh-TW': '回覆速度', en: 'Response time' }, value: 'speed' },
        { label: { 'zh-TW': '說明清楚度', en: 'Clarity' }, value: 'clarity' },
        { label: { 'zh-TW': '價格', en: 'Price' }, value: 'price' },
        { label: { 'zh-TW': '其他', en: 'Other' }, value: 'other' },
      ],
    },
    {
      name: 'otherDetail',
      type: 'textarea',
      label: { 'zh-TW': '請說明「其他」', en: 'Tell us more about "Other"' },
      required: true,
      visibleWhen: {
        all: [
          { field: 'issues', op: 'includes', value: 'other' },
          { not: { field: 'overall', op: 'empty' } },
        ],
      },
      validations: [{ type: 'minLength', value: 5 }],
    },
    {
      name: 'recommend',
      type: 'switch',
      label: { 'zh-TW': '願意推薦給朋友', en: 'Would recommend to a friend' },
    },
    {
      name: 'contactMe',
      type: 'switch',
      label: { 'zh-TW': '希望客服與我聯繫', en: 'Please contact me' },
    },
    {
      name: 'phone',
      type: 'text',
      label: { 'zh-TW': '聯絡電話', en: 'Phone' },
      placeholder: '09xx-xxx-xxx',
      required: true,
      visibleWhen: { field: 'contactMe', op: 'eq', value: true },
      validations: [
        {
          type: 'pattern',
          value: '^09\\d{2}-?\\d{3}-?\\d{3}$',
          message: {
            'zh-TW': '請輸入手機號碼，例如 0912-345-678',
            en: 'Use a mobile number like 0912-345-678',
          },
        },
      ],
    },
  ],
};
