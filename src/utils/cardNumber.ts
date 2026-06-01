export function cardDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 19);
}

export function formatCardNumber(value: string): string {
  const digits = cardDigits(value);
  if (digits.length > 16) {
    return digits.length > 6 ? `${digits.slice(0, 6)} ${digits.slice(6)}` : digits;
  }
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function normalizeCardNumber(value: string): string {
  return cardDigits(value);
}
