import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', label: 'USD – US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR – Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP – British Pound' },
  { code: 'JPY', symbol: '¥', label: 'JPY – Japanese Yen' },
  { code: 'CAD', symbol: 'C$', label: 'CAD – Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD – Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', label: 'CHF – Swiss Franc' },
  { code: 'INR', symbol: '₹', label: 'INR – Indian Rupee' },
  { code: 'MXN', symbol: 'MX$', label: 'MXN – Mexican Peso' },
  { code: 'BRL', symbol: 'R$', label: 'BRL – Brazilian Real' },
  { code: 'KRW', symbol: '₩', label: 'KRW – South Korean Won' },
  { code: 'CNY', symbol: '¥', label: 'CNY – Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', label: 'SGD – Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', label: 'HKD – Hong Kong Dollar' },
  { code: 'NOK', symbol: 'kr', label: 'NOK – Norwegian Krone' },
  { code: 'SEK', symbol: 'kr', label: 'SEK – Swedish Krona' },
  { code: 'DKK', symbol: 'kr', label: 'DKK – Danish Krone' },
  { code: 'NZD', symbol: 'NZ$', label: 'NZD – New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R', label: 'ZAR – South African Rand' },
  { code: 'AED', symbol: 'د.إ', label: 'AED – UAE Dirham' },
];

/** Zero-decimal currencies whose values should be formatted without fractional digits. */
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW']);

/**
 * Formats a numeric value as a currency string respecting the given currency's
 * decimal conventions (e.g. JPY/KRW have no fractional digits).
 */
export function formatCurrency(amount: number, code: string, symbol: string): string {
  const fractionDigits = ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2;
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${symbol}${formatted}`;
}

/** Returns true if a currency code uses zero decimal places (e.g. JPY, KRW). */
export function isZeroDecimalCurrency(code: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.has(code);
}

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'tcu_currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const found = CURRENCIES.find((c) => c.code === stored);
        if (found) return found;
      }
      // Attempt browser locale detection
      try {
        const locale = Intl.NumberFormat ? new Intl.NumberFormat().resolvedOptions().locale : '';
        if (locale) {
          const parts = new Intl.NumberFormat(locale, { style: 'currency', currencyDisplay: 'code' }).formatToParts(0);
          const codePart = parts.find((p) => p.type === 'currency');
          if (codePart) {
            const found = CURRENCIES.find((c) => c.code === codePart.value);
            if (found) return found;
          }
        }
      } catch { /* locale detection failed, fall through to default */ }
    } catch { /* ignore */ }
    return CURRENCIES[0];
  });

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try { localStorage.setItem(STORAGE_KEY, c.code); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
