export type CardTheme = {
  start: string;
  end: string;
  accent: string;
  text: string;
};

const THEMES: CardTheme[] = [
  { start: '#1A4FD6', end: '#0B2D6B', accent: '#D4AF37', text: '#FFFFFF' },
  { start: '#6B21A8', end: '#3B0764', accent: '#E9D5FF', text: '#FFFFFF' },
  { start: '#047857', end: '#064E3B', accent: '#6EE7B7', text: '#FFFFFF' },
  { start: '#B45309', end: '#78350F', accent: '#FCD34D', text: '#FFFFFF' },
  { start: '#BE123C', end: '#881337', accent: '#FDA4AF', text: '#FFFFFF' },
  { start: '#0E7490', end: '#164E63', accent: '#67E8F9', text: '#FFFFFF' },
  { start: '#4338CA', end: '#312E81', accent: '#A5B4FC', text: '#FFFFFF' },
  { start: '#C2410C', end: '#7C2D12', accent: '#FDBA74', text: '#FFFFFF' },
];

export function cardThemeForNumber(cardNumber: string): CardTheme {
  let hash = 0;
  for (let i = 0; i < cardNumber.length; i++) {
    hash = (hash + cardNumber.charCodeAt(i) * (i + 1)) % THEMES.length;
  }
  return THEMES[hash];
}

export function cardThemeForIndex(index: number): CardTheme {
  return THEMES[index % THEMES.length];
}
