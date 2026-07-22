import { useState, useCallback } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { safeEval } from '../shared/safeEval';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

type HistoryEntry = { expression: string; result: string };

export default function BasicCalcPanel({}: Props) {
  const [display, setDisplay] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const handleButton = useCallback((val: string) => {
    if (justEvaluated) {
      if ('+-×÷'.includes(val)) {
        setDisplay(d => d + val);
      } else {
        setDisplay(val === '=' ? '' : val);
      }
      setJustEvaluated(false);
    } else {
      setDisplay(d => d + val);
    }
  }, [justEvaluated]);

  const handleClear = useCallback(() => {
    setDisplay('');
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay(d => d.slice(0, -1));
  }, []);

  const handleEvaluate = useCallback(() => {
    if (!display.trim()) return;
    try {
      const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      const result = safeEval(sanitized);
      if (!isFinite(result)) {
        setDisplay('Error');
        return;
      }
      const fmt = parseFloat(result.toFixed(10)).toString();
      setHistory(h => [...h, { expression: display, result: fmt }]);
      setDisplay(fmt);
      setJustEvaluated(true);
    } catch {
      setDisplay('Error');
    }
  }, [display]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const buttons = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '−'],
    ['0', '.', '%', '+'],
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Calculator &amp; History Tape</span>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Calculator keypad */}
        <div className="p-4 flex-1">
          {/* Display */}
          <div className="bg-slate-900 text-white rounded-xl p-4 mb-4 min-h-[60px] flex items-center justify-end">
            <span className="text-2xl font-mono font-bold text-right break-all max-w-full">
              {display || '0'}
            </span>
          </div>

          {/* Button grid */}
          <div className="grid grid-cols-4 gap-2">
            {/* First row with C and ⌫ */}
            <button type="button" onClick={handleClear} className="col-span-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-xl text-sm transition-colors">
              C
            </button>
            <button type="button" onClick={handleBackspace} className="col-span-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition-colors">
              ⌫
            </button>
            <button type="button" onClick={handleEvaluate} className="col-span-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              =
            </button>

            {/* Number and operator buttons */}
            {buttons.flat().map((btn) => (
              <button type="button"
                key={btn}
                onClick={() => handleButton(btn)}
                className={`font-bold py-3 rounded-xl text-sm transition-colors ${
                  '+-×÷'.includes(btn)
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                    : btn === '='
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* History Tape */}
        <div className="md:w-56 border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-500">History</span>
            {history.length > 0 && (
              <button type="button" onClick={clearHistory} className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase">
                Clear
              </button>
            )}
          </div>
          <div className="h-64 overflow-y-auto px-3 py-2 space-y-1.5">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No calculations yet</p>
            ) : (
              [...history].reverse().map((entry, i) => (
                <div key={`item-${i}`} className="bg-white rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-[11px] font-mono text-slate-500">{entry.expression}</p>
                  <p className="text-sm font-mono font-bold text-slate-700">= {entry.result}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
