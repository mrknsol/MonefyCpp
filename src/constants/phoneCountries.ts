import type { AppLocale } from '../i18n/translations';

export type PhoneCountry = {
  code: string;
  dial: string;
  flag: string;
  nameKey: string;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'RU', dial: '+7', flag: '🇷🇺', nameKey: 'countryRU' },
  { code: 'BY', dial: '+375', flag: '🇧🇾', nameKey: 'countryBY' },
  { code: 'KZ', dial: '+7', flag: '🇰🇿', nameKey: 'countryKZ' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', nameKey: 'countryUA' },
  { code: 'US', dial: '+1', flag: '🇺🇸', nameKey: 'countryUS' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', nameKey: 'countryGB' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', nameKey: 'countryDE' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', nameKey: 'countryTR' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', nameKey: 'countryCN' },
];

export function defaultPhoneCountry(locale: AppLocale): PhoneCountry {
  const map: Partial<Record<AppLocale, string>> = {
    ru: 'RU',
    uk: 'UA',
    kk: 'KZ',
    de: 'DE',
    tr: 'TR',
    zh: 'CN',
    en: 'US',
    fr: 'US',
    es: 'US',
  };
  const code = map[locale] ?? 'US';
  return PHONE_COUNTRIES.find(c => c.code === code) ?? PHONE_COUNTRIES[0];
}

export function stripDialCode(phone: string, countries = PHONE_COUNTRIES): string {
  const trimmed = phone.trim();
  const sorted = [...countries].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.dial)) {
      return trimmed.slice(c.dial.length).trim();
    }
  }
  return trimmed.replace(/^\+/, '');
}

export function detectCountryFromPhone(
  phone: string,
  locale: AppLocale,
): PhoneCountry {
  const trimmed = phone.trim();
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.dial)) {
      return c;
    }
  }
  return defaultPhoneCountry(locale);
}

export function formatPhoneWithDial(country: PhoneCountry, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  return `${country.dial}${digits}`;
}
