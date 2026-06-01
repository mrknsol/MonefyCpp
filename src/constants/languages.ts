import type { AppLocale } from '../i18n/translations';

export type LanguageOption = {
  code: AppLocale;
  nativeName: string;
};

export const APP_LANGUAGES: LanguageOption[] = [
  { code: 'ru', nativeName: 'Русский' },
  { code: 'en', nativeName: 'English' },
  { code: 'uk', nativeName: 'Українська' },
  { code: 'kk', nativeName: 'Қазақша' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'es', nativeName: 'Español' },
  { code: 'tr', nativeName: 'Türkçe' },
  { code: 'zh', nativeName: '中文' },
];

export function languageNativeName(code: AppLocale): string {
  return APP_LANGUAGES.find(lang => lang.code === code)?.nativeName ?? code;
}

export function isAppLocale(value: string): value is AppLocale {
  return APP_LANGUAGES.some(lang => lang.code === value);
}
