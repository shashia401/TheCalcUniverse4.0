import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface DebtRow {
  name: string;
  balance: string;
  rate: string;
  payment: string;
}

const EMPTY_ROW = (): DebtRow => ({ name: '', balance: '', rate: '', payment: '' });

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  errors?: Record<string, string>;
}

export default function DebtInputs({ id, value, onChange, errors }: Props) {
  const [debts, setDebts] = useState<DebtRow[]>(() => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through */ }
    return [EMPTY_ROW()];
  });
  const initialized = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    if (!value || value === '[]') {
      setDebts([EMPTY_ROW()]);
    }
  }, [value]);

  useEffect(() => {
    onChangeRef.current(JSON.stringify(debts));
  }, [debts]);

  const updateRow = useCallback((index: number, field: keyof DebtRow, val: string) => {
    setDebts((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, [field]: val } : r));
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setDebts((prev) => [...prev, EMPTY_ROW()]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setDebts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }, []);

  const baseInput =
    'w-full rounded-lg border text-slate-900 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 bg-white focus-visible:ring-brand-500/40';
  const baseBorder = 'border-slate-200 hover:border-slate-300 focus:border-brand-400 focus:ring-brand-100';

  return (
    <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0" id={id}>
      <legend className="text-sm font-semibold text-slate-700 tracking-tight dark:text-slate-200">
        Your Debts
        <span className="text-slate-500 ml-1 font-normal dark:text-slate-500">*</span>
      </legend>

      <div className="space-y-2">
        {debts.map((row, i) => (
          <div
            key={`debt-${i}`}
            className="flex flex-wrap sm:flex-nowrap items-start gap-1.5 sm:gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50"
          >
            {/* Name */}
            <div className="flex-1 min-w-[80px] sm:min-w-0 basis-full sm:basis-auto">
              <input
                type="text"
                placeholder="Debt name"
                value={row.name}
                onChange={(e) => updateRow(i, 'name', e.target.value)}
                className={`${baseInput} ${baseBorder} px-2.5 py-2 text-xs`}
                autoComplete="off"
              />
            </div>

            {/* Balance */}
            <div className="flex-1 sm:flex-none sm:w-28 min-w-[80px]">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500 text-xs font-medium pointer-events-none select-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Balance"
                  value={row.balance}
                  onChange={(e) => updateRow(i, 'balance', e.target.value)}
                  className={`${baseInput} ${baseBorder} pl-5 py-2 text-xs w-full`}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Rate */}
            <div className="flex-1 sm:flex-none sm:w-24 min-w-[70px]">
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Rate"
                  value={row.rate}
                  onChange={(e) => updateRow(i, 'rate', e.target.value)}
                  className={`${baseInput} ${baseBorder} px-2 py-2 text-xs pr-6 w-full`}
                  autoComplete="off"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 text-xs font-medium pointer-events-none select-none">%</span>
              </div>
            </div>

            {/* Monthly Payment */}
            <div className="flex-1 sm:flex-none sm:w-28 min-w-[80px]">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500 text-xs font-medium pointer-events-none select-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Min. payment/mo"
                  value={row.payment}
                  onChange={(e) => updateRow(i, 'payment', e.target.value)}
                  className={`${baseInput} ${baseBorder} pl-5 py-2 text-xs`}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={debts.length <= 1}
              className="flex-shrink-0 self-center sm:self-start p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Remove debt"
              title="Remove debt"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center justify-center gap-1.5 w-full mt-1 py-2 rounded-lg border border-dashed border-slate-300 bg-white text-sm font-semibold text-brand-600 hover:text-white hover:bg-brand-500 hover:border-brand-500 transition-all duration-200"
      >
        <Plus size={15} strokeWidth={2.5} />
        Add Debt
      </button>

      {errors?.[id] && (
        <p id={`${id}-error`} className="text-xs text-red-500" role="alert">{errors[id]}</p>
      )}
      {!errors?.[id] && <div className="min-h-[1.25rem]" />}
    </fieldset>
  );
}
