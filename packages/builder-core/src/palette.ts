import type {
  FieldSchema,
  FieldType,
  I18nText,
  Option,
  ValidationRule,
} from '@schema-form-kit/core';

export interface PaletteItem {
  type: FieldType;
  label: I18nText;
  /** Icon key for the UI layer. */
  icon: string;
}

/** Field types offered in the builder, in display order. */
export const palette: PaletteItem[] = [
  { type: 'text', label: { 'zh-TW': '單行文字', en: 'Text' }, icon: 'text' },
  { type: 'textarea', label: { 'zh-TW': '多行文字', en: 'Paragraph' }, icon: 'paragraph' },
  { type: 'email', label: { 'zh-TW': '電子郵件', en: 'Email' }, icon: 'mail' },
  { type: 'number', label: { 'zh-TW': '數字', en: 'Number' }, icon: 'hash' },
  { type: 'date', label: { 'zh-TW': '日期', en: 'Date' }, icon: 'calendar' },
  { type: 'select', label: { 'zh-TW': '下拉選單', en: 'Dropdown' }, icon: 'chevron-down' },
  { type: 'radio', label: { 'zh-TW': '單選', en: 'Single choice' }, icon: 'circle-dot' },
  { type: 'checkbox', label: { 'zh-TW': '多選', en: 'Multiple choice' }, icon: 'square-check' },
  { type: 'switch', label: { 'zh-TW': '開關', en: 'Toggle' }, icon: 'toggle' },
  { type: 'array', label: { 'zh-TW': '重複群組', en: 'Repeatable group' }, icon: 'layers' },
];

export const CHOICE_TYPES: ReadonlySet<FieldType> = new Set(['select', 'radio', 'checkbox']);

/** Which validation rules make sense for each field type. */
export const RULES_BY_TYPE: Record<FieldType, ReadonlyArray<ValidationRule['type']>> = {
  text: ['minLength', 'maxLength', 'pattern', 'custom'],
  email: ['maxLength', 'pattern', 'custom'],
  textarea: ['minLength', 'maxLength', 'pattern', 'custom'],
  number: ['min', 'max', 'custom'],
  date: ['custom'],
  select: ['custom'],
  radio: ['custom'],
  checkbox: ['minItems', 'maxItems', 'custom'],
  switch: ['custom'],
  array: ['minItems', 'maxItems', 'custom'],
};

export function defaultOptions(): Option[] {
  return [
    { label: { 'zh-TW': '選項 1', en: 'Option 1' }, value: 'option1' },
    { label: { 'zh-TW': '選項 2', en: 'Option 2' }, value: 'option2' },
  ];
}

/** Picks `base`, `base_2`, `base_3`… so the name is unique among `taken`. */
export function uniqueName(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const clean = base.replace(/[^A-Za-z0-9_]/g, '_').replace(/^(?=\d)/, '_') || 'field';
  if (!used.has(clean)) return clean;
  let n = 2;
  while (used.has(`${clean}_${n}`)) n += 1;
  return `${clean}_${n}`;
}

/** A new field of `type` with sensible defaults and a name unique among `siblingNames`. */
export function createField(type: FieldType, siblingNames: Iterable<string>): FieldSchema {
  const item = palette.find((p) => p.type === type);
  const name = uniqueName(type, siblingNames);
  const label = item?.label ?? type;

  if (type === 'select' || type === 'radio' || type === 'checkbox') {
    return { name, type, label, options: defaultOptions() };
  }
  if (type === 'array') {
    return {
      name,
      type,
      label,
      itemLabel: { 'zh-TW': '項目', en: 'Item' },
      fields: [{ name: 'text', type: 'text', label: { 'zh-TW': '單行文字', en: 'Text' } }],
    };
  }
  return { name, type, label } as FieldSchema;
}
