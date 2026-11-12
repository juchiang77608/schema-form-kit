import { inject, type ComputedRef, type InjectionKey } from 'vue';
import type { I18nText, Locale } from '@schema-form-kit/core';
import type { BuilderState } from './useBuilder';
import { uiText, type UiText } from './messages';

export interface BuilderContext {
  state: BuilderState;
  locale: ComputedRef<Locale>;
  ui: ComputedRef<UiText>;
}

export const BUILDER_CONTEXT: InjectionKey<BuilderContext> = Symbol('schema-form-kit-builder');

export function useBuilderContext(): BuilderContext {
  const ctx = inject(BUILDER_CONTEXT);
  if (!ctx) throw new Error('Builder components must be used inside <FormBuilder>');
  return ctx;
}

export { uiText };

/** Normalises an `I18nText` into an object with both locales, for editing. */
export function toLocales(text: I18nText | undefined): Record<Locale, string> {
  if (text === undefined) return { 'zh-TW': '', en: '' };
  if (typeof text === 'string') return { 'zh-TW': text, en: text };
  return { 'zh-TW': text['zh-TW'] ?? '', en: text.en ?? '' };
}

/** Writes one locale back; empty translations are dropped, and an all-empty text becomes `undefined`. */
export function withLocale(
  text: I18nText | undefined,
  locale: Locale,
  value: string,
): I18nText | undefined {
  const next = { ...toLocales(text), [locale]: value };
  const entries = Object.entries(next).filter(([, v]) => v !== '');
  return entries.length === 0 ? undefined : (Object.fromEntries(entries) as I18nText);
}
