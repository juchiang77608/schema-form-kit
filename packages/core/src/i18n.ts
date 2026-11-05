import type { I18nText, Locale } from './types';

export const DEFAULT_LOCALE: Locale = 'zh-TW';

export type MessageKey =
  | 'required'
  | 'email'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'minItems'
  | 'maxItems'
  | 'number'
  | 'date'
  | 'option';

export const messages: Record<Locale, Record<MessageKey, string>> = {
  'zh-TW': {
    required: '請填寫「{label}」',
    email: '「{label}」的電子郵件格式不正確',
    minLength: '「{label}」至少需要 {value} 個字',
    maxLength: '「{label}」最多 {value} 個字',
    min: '「{label}」不可小於 {value}',
    max: '「{label}」不可大於 {value}',
    pattern: '「{label}」格式不正確',
    minItems: '「{label}」至少需要 {value} 筆',
    maxItems: '「{label}」最多 {value} 筆',
    number: '「{label}」必須是數字',
    date: '「{label}」的日期格式不正確',
    option: '「{label}」的選項無效',
  },
  en: {
    required: '{label} is required',
    email: '{label} must be a valid email address',
    minLength: '{label} must be at least {value} characters',
    maxLength: '{label} must be at most {value} characters',
    min: '{label} must be at least {value}',
    max: '{label} must be at most {value}',
    pattern: '{label} has an invalid format',
    minItems: '{label} needs at least {value} items',
    maxItems: '{label} allows at most {value} items',
    number: '{label} must be a number',
    date: '{label} must be a valid date',
    option: '{label} has an invalid option',
  },
};

/** Resolves an `I18nText` for a locale, falling back to the other locales. */
export function t(text: I18nText | undefined, locale: Locale = DEFAULT_LOCALE): string {
  if (text === undefined) return '';
  if (typeof text === 'string') return text;
  return text[locale] ?? text[DEFAULT_LOCALE] ?? Object.values(text)[0] ?? '';
}

/** Replaces `{name}` placeholders. Unknown placeholders are left as-is. */
export function format(template: string, params: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
