import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, ArrowRightLeft } from 'lucide-react';

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CAD: '🇨🇦',
  AUD: '🇦🇺', CHF: '🇨🇭', CNY: '🇨🇳', INR: '🇮🇳', MXN: '🇲🇽',
  BRL: '🇧🇷', KRW: '🇰🇷', SGD: '🇸🇬', HKD: '🇭🇰', NOK: '🇳🇴',
  SEK: '🇸🇪', DKK: '🇩🇰', NZD: '🇳🇿', ZAR: '🇿🇦', AED: '🇦🇪',
  SAR: '🇸🇦', THB: '🇹🇭', TRY: '🇹🇷', PLN: '🇵🇱', CZK: '🇨🇿',
  HUF: '🇭🇺', ILS: '🇮🇱', PHP: '🇵🇭', IDR: '🇮🇩', MYR: '🇲🇾',
};

interface CurrencyPanelProps {
  amount: number;
  from: string;
  to: string;
}

interface RateData {
  rate: number;
  inverseRate: number;
  date: string;
  loading: boolean;
  error: string | null;
}

function formatConverted(value: number, currency: string): string {
  if (['JPY', 'KRW', 'IDR', 'HUF', 'CZK'].includes(currency)) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatRate(rate: number): string {
  if (rate >= 100) return rate.toFixed(2);
  if (rate >= 10) return rate.toFixed(4);
  return rate.toFixed(6);
}

export default function CurrencyPanel({ amount, from, to }: CurrencyPanelProps) {
  const [rateData, setRateData] = useState<RateData>({
    rate: 0,
    inverseRate: 0,
    date: '',
    loading: true,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchRate = useCallback(async () => {
    abortRef.current?.abort();

    if (!from || !to || from === to) {
      abortRef.current = null;
      setRateData({ rate: 1, inverseRate: 1, date: new Date().toISOString().split('T')[0], loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setRateData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, { signal: controller.signal });
      if (!res.ok) throw new Error('Rate unavailable');
      const json = await res.json();
      if (controller.signal.aborted) return;
      const rate = json.rates[to];
      if (!rate) throw new Error(`Rate for ${to} not found`);
      setRateData({
        rate,
        inverseRate: 1 / rate,
        date: json.date,
        loading: false,
        error: null,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setRateData((prev) => ({ ...prev, loading: false, error: 'Could not fetch live rate. Please try again.' }));
    }
  }, [from, to]);

  useEffect(() => {
    fetchRate();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchRate]);

  const converted = rateData.rate * amount;

  const fmtAmount = (n: number, ccy: string) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy, minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);
    } catch {
      return `${ccy} ${formatConverted(n, ccy)}`;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Live Exchange Rate</span>
        </div>
        <button type="button"
          onClick={fetchRate}
          disabled={rateData.loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={rateData.loading ? 'animate-spin' : ''} />
          {rateData.loading ? 'Fetching...' : 'Refresh'}
        </button>
      </div>

      <div className="p-6 space-y-5">
        {rateData.error ? (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm font-semibold text-red-600">{rateData.error}</p>
            <button type="button" onClick={fetchRate} className="mt-2 text-xs font-bold text-red-700 underline">Try again</button>
          </div>
        ) : rateData.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="text-blue-400 animate-spin" />
              <p className="text-sm text-slate-500">Fetching live rate from European Central Bank...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-6 py-5 text-center">
                <div className="text-3xl mb-1">{CURRENCY_FLAGS[from] || '🌐'}</div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{from}</p>
                <p className="text-2xl font-black text-slate-800">
                  {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ArrowRightLeft size={18} className="text-blue-600" />
                </div>
              </div>

              <div className="flex-1 rounded-2xl bg-blue-50 border border-blue-200 px-6 py-5 text-center">
                <div className="text-3xl mb-1">{CURRENCY_FLAGS[to] || '🌐'}</div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">{to}</p>
                <p className="text-2xl font-black text-blue-700">{formatConverted(converted, to)}</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Exchange Rate</span>
                <span className="text-sm font-black text-slate-800">
                  1 {from} = {formatRate(rateData.rate)} {to}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Inverse Rate</span>
                <span className="text-sm font-bold text-slate-600">
                  1 {to} = {formatRate(rateData.inverseRate)} {from}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="text-xs font-semibold text-slate-500">Rate Date</span>
                <span className="text-xs text-slate-500">{rateData.date} · ECB Reference Rate</span>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                To convert <strong>{from}</strong> to <strong>{to}</strong>, multiply the amount by the current exchange rate of <strong>{formatRate(rateData.rate)}</strong>.
                {' '}So {fmtAmount(amount, from)} × {formatRate(rateData.rate)} = <strong>{fmtAmount(converted, to)}</strong>.
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                Source: European Central Bank via Frankfurter API · This is the interbank reference rate. Bank and card rates include a spread of 1–3%.
              </p>
            </div>

            {amount > 0 && rateData.rate > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Common Amounts</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[100, 500, 1000, 5000].map((amt) => (
                    <div key={amt} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
                      <p className="text-[10px] text-slate-500">{amt.toLocaleString()} {from}</p>
                      <p className="text-sm font-black text-slate-800">{formatConverted(amt * rateData.rate, to)}</p>
                      <p className="text-[10px] text-slate-500">{to}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
