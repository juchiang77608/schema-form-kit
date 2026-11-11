import type { FormSchema } from '@schema-form-kit/core';

export const eventRegistration: FormSchema = {
  id: 'event-registration',
  version: 1,
  title: { 'zh-TW': '技術研討會報名', en: 'Tech conference registration' },
  description: {
    'zh-TW': '三步驟報名表：基本資料 → 參加場次 → 確認。',
    en: 'A three-step form: attendee → sessions → confirm.',
  },
  submitLabel: { 'zh-TW': '完成報名', en: 'Register' },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      label: { 'zh-TW': '姓名', en: 'Full name' },
      required: true,
      colSpan: 6,
      validations: [{ type: 'maxLength', value: 40 }],
    },
    {
      name: 'email',
      type: 'email',
      label: { 'zh-TW': '電子郵件', en: 'Email' },
      placeholder: 'you@example.com',
      required: true,
      colSpan: 6,
    },
    {
      name: 'attendeeType',
      type: 'radio',
      label: { 'zh-TW': '身分', en: 'Attendee type' },
      required: true,
      options: [
        { label: { 'zh-TW': '一般', en: 'General' }, value: 'general' },
        { label: { 'zh-TW': '學生', en: 'Student' }, value: 'student' },
        { label: { 'zh-TW': '講者', en: 'Speaker' }, value: 'speaker' },
      ],
      defaultValue: 'general',
    },
    {
      name: 'school',
      type: 'text',
      label: { 'zh-TW': '學校名稱', en: 'School' },
      description: {
        'zh-TW': '學生票需於報到時出示學生證。',
        en: 'Bring your student ID at check-in.',
      },
      required: true,
      visibleWhen: { field: 'attendeeType', op: 'eq', value: 'student' },
    },
    {
      name: 'talkTitle',
      type: 'text',
      label: { 'zh-TW': '演講題目', en: 'Talk title' },
      required: true,
      visibleWhen: { field: 'attendeeType', op: 'eq', value: 'speaker' },
    },
    {
      name: 'sessions',
      type: 'checkbox',
      label: { 'zh-TW': '參加場次', en: 'Sessions' },
      required: true,
      options: [
        { label: { 'zh-TW': '前端架構', en: 'Frontend architecture' }, value: 'frontend' },
        { label: { 'zh-TW': '雲端與 DevOps', en: 'Cloud & DevOps' }, value: 'cloud' },
        { label: { 'zh-TW': 'AI 應用', en: 'Applied AI' }, value: 'ai' },
        {
          label: { 'zh-TW': '工作坊（需自備筆電）', en: 'Workshop (bring a laptop)' },
          value: 'workshop',
        },
      ],
      validations: [{ type: 'maxItems', value: 3 }],
    },
    {
      name: 'laptopOs',
      type: 'select',
      label: { 'zh-TW': '筆電作業系統', en: 'Laptop OS' },
      required: true,
      visibleWhen: { field: 'sessions', op: 'includes', value: 'workshop' },
      options: [
        { label: 'macOS', value: 'macos' },
        { label: 'Windows', value: 'windows' },
        { label: 'Linux', value: 'linux' },
      ],
    },
    {
      name: 'meal',
      type: 'select',
      label: { 'zh-TW': '餐點', en: 'Meal' },
      options: [
        { label: { 'zh-TW': '葷食', en: 'Regular' }, value: 'regular' },
        { label: { 'zh-TW': '素食', en: 'Vegetarian' }, value: 'vegetarian' },
        { label: { 'zh-TW': '不用餐', en: 'No meal' }, value: 'none' },
      ],
      defaultValue: 'regular',
    },
    {
      name: 'newsletter',
      type: 'switch',
      label: { 'zh-TW': '訂閱活動電子報', en: 'Subscribe to the newsletter' },
    },
    {
      name: 'agree',
      type: 'switch',
      label: { 'zh-TW': '我同意活動個資使用說明', en: 'I accept the privacy notice' },
      required: true,
    },
  ],
  steps: [
    {
      id: 'attendee',
      title: { 'zh-TW': '基本資料', en: 'Attendee' },
      fields: ['fullName', 'email', 'attendeeType', 'school', 'talkTitle'],
    },
    {
      id: 'sessions',
      title: { 'zh-TW': '場次與餐點', en: 'Sessions' },
      fields: ['sessions', 'laptopOs', 'meal'],
    },
    {
      id: 'confirm',
      title: { 'zh-TW': '確認', en: 'Confirm' },
      fields: ['newsletter', 'agree'],
    },
  ],
};
