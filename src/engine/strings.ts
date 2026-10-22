// Localized text lookup. All player-facing text comes from content/strings/<locale>.json
// (+ content/strings/<locale>/*.json). English is the default; every other locale must have the same keys.

import type { Strings } from './types';

export const DEFAULT_LOCALE = 'en';
/** Locales offered in the options, in display order. */
export const LOCALES = ['en', 'pt-BR'];

export class StringTable {
  constructor(
    private readonly tables: Record<string, Strings>,
    private locale = DEFAULT_LOCALE,
  ) {}

  get current(): string {
    return this.locale;
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  has(key: string): boolean {
    return key in (this.tables[this.locale] ?? {}) || key in (this.tables[DEFAULT_LOCALE] ?? {});
  }

  /** Falls back to the default locale, then to a visible marker so missing keys are easy to spot. */
  t(key: string, vars?: Record<string, string | number>): string {
    let text = this.tables[this.locale]?.[key] ?? this.tables[DEFAULT_LOCALE]?.[key] ?? `⟦${key}⟧`;
    for (const [name, value] of Object.entries(vars ?? {})) text = text.replaceAll(`{${name}}`, String(value));
    return text;
  }
}
