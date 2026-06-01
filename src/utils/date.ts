import type { AppLocale, DateDisplayMode } from '../i18n/translations';

export function formatDayIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDayIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDayForPreferences(
  iso: string,
  locale: AppLocale,
  mode: DateDisplayMode,
): string {
  const d = parseDayIso(iso);
  const intlLocale: Record<AppLocale, string> = {
    ru: 'ru-RU',
    en: 'en-US',
    uk: 'uk-UA',
    kk: 'kk-KZ',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    tr: 'tr-TR',
    zh: 'zh-CN',
  };
  const loc = intlLocale[locale] ?? 'en-US';
  if (mode === 'iso') {
    return iso;
  }
  if (mode === 'short') {
    return d.toLocaleDateString(loc, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString(loc, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** @deprecated use formatDayForPreferences */
export function formatDayHuman(iso: string): string {
  const d = parseDayIso(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
