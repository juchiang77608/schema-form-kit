import { describe, expect, it } from 'vitest';
import { format, t } from '../src';

describe('t', () => {
  it('returns plain strings as-is', () => {
    expect(t('Hello', 'en')).toBe('Hello');
  });

  it('picks the locale and falls back', () => {
    expect(t({ 'zh-TW': '你好', en: 'Hi' }, 'en')).toBe('Hi');
    expect(t({ 'zh-TW': '你好' }, 'en')).toBe('你好');
    expect(t({ en: 'Hi' }, 'zh-TW')).toBe('Hi');
    expect(t(undefined)).toBe('');
  });
});

describe('format', () => {
  it('replaces known placeholders only', () => {
    expect(format('{label} needs {value} {unit}', { label: 'Age', value: 3 })).toBe(
      'Age needs 3 {unit}',
    );
  });
});
