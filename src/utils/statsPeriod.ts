import { formatDayIso } from './date';

export type StatsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';

export function statsPeriodRange(period: StatsPeriod): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);

  switch (period) {
    case 'week':
      from.setDate(from.getDate() - 6);
      break;
    case 'month':
      from.setMonth(from.getMonth() - 1);
      break;
    case 'quarter':
      from.setMonth(from.getMonth() - 3);
      break;
    case 'year':
      from.setFullYear(from.getFullYear() - 1);
      break;
    case 'all':
      from.setFullYear(2000, 0, 1);
      break;
  }

  return { from: formatDayIso(from), to: formatDayIso(to) };
}

export function isDateInRange(iso: string, from: string, to: string): boolean {
  return iso >= from && iso <= to;
}
