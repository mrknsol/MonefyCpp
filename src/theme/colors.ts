export type ThemeColors = {
  background: string;
  backgroundDeep: string;
  card: string;
  cardElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentMuted: string;
  brand: string;
  brandSoft: string;
  expense: string;
  income: string;
  topup: string;
  danger: string;
  barTrack: string;
  chip: string;
  chipActive: string;
  heroLine: string;
  decorTeal: string;
  decorAmber: string;
  inverseText: string;
};

/** Warm daylight + deep teal brand (not generic grey template) */
export const lightColors: ThemeColors = {
  background: '#E2E8F0',
  backgroundDeep: '#CBD5E1',
  card: '#FFFFFF',
  cardElevated: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  accent: '#0D9488',
  accentMuted: '#0F766E',
  brand: '#0F766E',
  brandSoft: '#CCFBF1',
  expense: '#DC2626',
  income: '#059669',
  topup: '#7C3AED',
  danger: '#E11D48',
  barTrack: '#E2E8F0',
  chip: '#F1F5F9',
  chipActive: '#0F766E',
  heroLine: '#14B8A6',
  decorTeal: 'rgba(20, 184, 166, 0.35)',
  decorAmber: 'rgba(251, 191, 36, 0.4)',
  inverseText: '#FFFFFF',
};

/** Midnight + mint accents */
export const darkColors: ThemeColors = {
  background: '#0B1120',
  backgroundDeep: '#020617',
  card: '#151F32',
  cardElevated: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#2D3B55',
  borderSubtle: '#1E293B',
  accent: '#2DD4BF',
  accentMuted: '#5EEAD4',
  brand: '#2DD4BF',
  brandSoft: '#134E4A',
  expense: '#FB7185',
  income: '#34D399',
  topup: '#C084FC',
  danger: '#FB7185',
  barTrack: '#334155',
  chip: '#1E293B',
  chipActive: '#0F766E',
  heroLine: '#5EEAD4',
  decorTeal: 'rgba(45, 212, 191, 0.18)',
  decorAmber: 'rgba(251, 191, 36, 0.12)',
  inverseText: '#0F172A',
};
