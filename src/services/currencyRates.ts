import AsyncStorage from '@react-native-async-storage/async-storage';

export type RateTrend = 'up' | 'down' | 'flat';

export type CurrencyRate = {
  code: string;
  nameKey: string;
  rate: number;
  rubPerUnit: number;
  trend: RateTrend;
};

const STORAGE_KEY = 'currency_rates_prev';
const MAJOR_CODES = ['USD', 'EUR', 'GBP', 'CNY', 'TRY'] as const;

const FALLBACK_RATES: Record<string, number> = {
  USD: 0.011,
  EUR: 0.01,
  GBP: 0.0087,
  CNY: 0.079,
  TRY: 0.35,
};

async function loadPreviousRates(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

async function saveRates(rates: Record<string, number>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
}

export async function fetchCurrencyRates(): Promise<CurrencyRate[]> {
  let fetched: Record<string, number> = FALLBACK_RATES;

  try {
    const symbols = MAJOR_CODES.join(',');
    const response = await fetch(
      `https://api.exchangerate.host/latest?base=RUB&symbols=${symbols}`,
    );
    if (response.ok) {
      const data = (await response.json()) as { rates?: Record<string, number> };
      if (data.rates) {
        fetched = { ...FALLBACK_RATES, ...data.rates };
      }
    }
  } catch {
    // use fallback
  }

  const previous = await loadPreviousRates();
  const result = MAJOR_CODES.map(code => {
    const rate = fetched[code] ?? FALLBACK_RATES[code];
    const rubPerUnit = 1 / rate;
    const prevRub = previous[code] ? 1 / previous[code] : undefined;
    let trend: RateTrend = 'flat';
    if (prevRub !== undefined) {
      const diff = rubPerUnit - prevRub;
      if (Math.abs(diff) >= 0.01) {
        trend = diff > 0 ? 'up' : 'down';
      }
    }
    return {
      code,
      nameKey: `currency${code}`,
      rate,
      rubPerUnit,
      trend,
    };
  });

  await saveRates(
    MAJOR_CODES.reduce(
      (acc, code) => {
        acc[code] = fetched[code] ?? FALLBACK_RATES[code];
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  return result;
}
