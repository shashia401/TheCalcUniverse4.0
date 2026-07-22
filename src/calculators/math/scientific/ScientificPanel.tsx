import { useState, useCallback } from 'react';
import { safeEval } from '../shared/safeEval';

// ─── Safe math expression evaluator ────────────────────────────────────────
function evaluate(expr: string): { result: number; error?: string } {
  try {
    // Preprocess display characters and factorial expansion only.
    // Everything else (sin, cos, pi, e, ^, etc.) is handled by the shared safe evaluator.
    const sanitized = expr
      .replace(/×/g, '*').replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      // Scientific notation (\d[.\d]*e[+-]?\d+) → (num)*10^(exp)
      // before the bare-e→Math.E look-up so 1e5 becomes 100000, not 13.59
      .replace(/(\d[\d.]*)[eE](\+?-?\d+)/g, '($1)*10^($2)')
      // Handle (n)! where n is a parenthesized expression — evaluate inner, then factorial
      .replace(/\(([^)]+)\)!/g, (_, inner: string) => {
        const val = safeEval(inner);
        if (typeof val !== 'number' || !isFinite(val) || val < 0 || !Number.isInteger(val)) throw new Error('Invalid factorial');
        let f = 1;
        for (let i = 2; i <= val; i++) f *= i;
        return f.toString();
      })
      .replace(/(\d+)!/g, (_, n: string) => {
        let f = 1;
        for (let i = 2; i <= parseInt(n, 10); i++) f *= i;
        return f.toString();
      });

    const result = safeEval(sanitized);
    if (typeof result !== 'number') return { result: 0, error: 'Invalid' };
    if (!isFinite(result)) return { result: 0, error: result > 0 ? 'Infinity' : '-Infinity' };
    return { result };
  } catch (err) {
    return { result: 0, error: (err as Error).message?.includes('nvalid') ? 'Error' : 'Error' };
  }
}

function fmt(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  const s = n.toPrecision(12);
  return parseFloat(s).toString();
}

interface HistoryEntry {
  expression: string;
  result: string;
}

type CalcFn = 'sin' | 'cos' | 'tan' | 'log' | 'ln' | 'sqrt' | 'square' | 'cube' | 'inv' | 'fact';

export default function ScientificPanel() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [memory, setMemory] = useState<number>(0);
  const [hasMemory, setHasMemory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToHistory = useCallback((expr: string, res: string) => {
    setHistory(prev => [{ expression: expr, result: res }, ...prev].slice(0, 10));
  }, []);

  const pressDigit = useCallback((d: string) => {
    setError(null);
    if (justEvaluated) {
      setDisplay(d);
      setExpression(d);
      setJustEvaluated(false);
    } else {
      setDisplay(prev => prev === '0' && d !== '.' ? d : prev + d);
      setExpression(prev => prev + d);
    }
  }, [justEvaluated]);

  const pressOp = useCallback((op: string) => {
    setError(null);
    if (justEvaluated) setJustEvaluated(false);
    setExpression(prev => prev + ` ${op} `);
    setDisplay(op);
  }, [justEvaluated]);

  const pressFunction = useCallback((fn: CalcFn) => {
    setError(null);
    const val = parseFloat(display);
    if (isNaN(val)) return;

    if (fn === 'square') {
      const r = val * val;
      const s = fmt(r);
      setDisplay(s);
      setExpression(`${val}²`);
      setJustEvaluated(true);
    } else if (fn === 'cube') {
      const r = val * val * val;
      const s = fmt(r);
      setDisplay(s);
      setExpression(`${val}³`);
      setJustEvaluated(true);
    } else if (fn === 'inv') {
      if (val === 0) { setError('Cannot divide by zero'); return; }
      const r = 1 / val;
      const s = fmt(r);
      setDisplay(s);
      setExpression(`1÷${val}`);
      setJustEvaluated(true);
    } else if (fn === 'fact') {
      if (val < 0 || !Number.isInteger(val) || val > 170) {
        setError('Invalid for factorial');
        return;
      }
      let f = 1;
      for (let i = 2; i <= val; i++) f *= i;
      const s = fmt(f);
      setDisplay(s);
      setExpression(`${val}!`);
      setJustEvaluated(true);
    } else {
      // sin, cos, tan, log, ln, sqrt
      let r: number;
      let label: string;
      switch (fn) {
        case 'sin': r = Math.sin(val); label = `sin(${val})`; break;
        case 'cos': r = Math.cos(val); label = `cos(${val})`; break;
        case 'tan': r = Math.tan(val); label = `tan(${val})`; break;
        case 'log': r = Math.log10(val); label = `log(${val})`; break;
        case 'ln': r = Math.log(val); label = `ln(${val})`; break;
        case 'sqrt': r = Math.sqrt(val); label = `√(${val})`; break;
        default: return;
      }
      if (!isFinite(r)) { setError('Undefined result'); return; }
      const s = fmt(r);
      setDisplay(s);
      setExpression(label);
      setJustEvaluated(true);
    }
  }, [display]);

  const pressEquals = useCallback(() => {
    setError(null);
    const expr = expression.trim();
    if (!expr) return;

    // Replace display value placeholder for inline evaluation
    const { result, error: evalError } = evaluate(expr);
    if (evalError) {
      setError(evalError);
      return;
    }

    const resultStr = fmt(result);
    setDisplay(resultStr);
    setExpression(expr);
    setJustEvaluated(true);
    addToHistory(expr + ' =', resultStr);
  }, [expression, addToHistory]);

  const pressClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setJustEvaluated(false);
    setError(null);
  }, []);

  const pressClearEntry = useCallback(() => {
    setDisplay('0');
    setError(null);
  }, []);

  const pressBackspace = useCallback(() => {
    if (justEvaluated) { pressClear(); return; }
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    setExpression(prev => prev.length > 0 ? prev.slice(0, -1) : '');
  }, [justEvaluated, pressClear]);

  const pressConstant = useCallback((c: 'π' | 'e') => {
    setError(null);
    if (justEvaluated) {
      setExpression(c);
      setJustEvaluated(false);
    } else {
      setExpression(prev => prev + c);
    }
    setDisplay(c);
  }, [justEvaluated]);

  const pressParen = useCallback((p: '(' | ')') => {
    setError(null);
    setExpression(prev => prev + p);
    setDisplay(p);
  }, []);

  // Memory
  const memAdd = useCallback(() => {
    const val = parseFloat(display);
    if (!isNaN(val)) { setMemory(prev => prev + val); setHasMemory(true); }
  }, [display]);

  const memSub = useCallback(() => {
    const val = parseFloat(display);
    if (!isNaN(val)) { setMemory(prev => prev - val); setHasMemory(true); }
  }, [display]);

  const memRecall = useCallback(() => {
    setError(null);
    const memStr = fmt(memory);
    setDisplay(memStr);
    if (justEvaluated) {
      setExpression(memStr);
      setJustEvaluated(false);
    } else {
      setExpression(prev => prev + memStr);
    }
  }, [memory, justEvaluated]);

  const memClear = useCallback(() => {
    setMemory(0);
    setHasMemory(false);
  }, []);

  // ─── Classes ─────────────────────────────────────────────────────────────
  const btnBase = 'rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 select-none';
  const btnNum = `${btnBase} bg-slate-100 hover:bg-slate-200 text-slate-800`;
  const btnOp = `${btnBase} bg-blue-500 hover:bg-blue-600 text-white`;
  const btnFn = `${btnBase} bg-slate-200 hover:bg-slate-300 text-slate-700`;
  const btnMem = `${btnBase} bg-purple-100 hover:bg-purple-200 text-purple-700`;
  const btnEq = `${btnBase} bg-blue-600 hover:bg-blue-700 text-white`;
  const btnClr = `${btnBase} bg-red-100 hover:bg-red-200 text-red-700`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Scientific Calculator</span>
        </div>
        <div className="flex gap-2">
          {hasMemory && <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">M</span>}
          <button type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${showHistory ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            History ({history.length})
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row">
        {/* Calculator section */}
        <div className="flex-1 p-4 space-y-3">
          {/* Display */}
          <div className="rounded-xl bg-slate-900 px-4 py-3 min-h-[80px]">
            {error ? (
              <p className="text-red-400 text-sm font-mono text-right">{error}</p>
            ) : (
              <>
                <p className="text-slate-500 text-xs font-mono text-right truncate min-h-[16px]">
                  {expression}
                </p>
                <p className="text-white text-2xl font-mono font-bold text-right tracking-wider truncate">
                  {display}
                </p>
              </>
            )}
          </div>

          {/* Memory row */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'MC', action: memClear, cls: btnMem },
              { label: 'MR', action: memRecall, cls: btnMem },
              { label: 'M+', action: memAdd, cls: btnMem },
              { label: 'M−', action: memSub, cls: btnMem },
            ].map(b => (
              <button key={b.label} onClick={b.action} className={`${b.cls} py-2 text-xs`}>
                {b.label}
              </button>
            ))}
          </div>

          {/* Scientific functions row 1 */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: 'sin', fn: 'sin' as CalcFn },
              { label: 'cos', fn: 'cos' as CalcFn },
              { label: 'tan', fn: 'tan' as CalcFn },
              { label: 'log', fn: 'log' as CalcFn },
              { label: 'ln', fn: 'ln' as CalcFn },
            ].map(b => (
              <button key={b.label} onClick={() => pressFunction(b.fn)} className={`${btnFn} py-2 text-xs`}>
                {b.label}
              </button>
            ))}
          </div>

          {/* Scientific functions row 2 */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: '√', fn: 'sqrt' as CalcFn },
              { label: 'x²', fn: 'square' as CalcFn },
              { label: 'x³', fn: 'cube' as CalcFn },
              { label: '1/x', fn: 'inv' as CalcFn },
              { label: 'x!', fn: 'fact' as CalcFn },
            ].map(b => (
              <button key={b.label} onClick={() => pressFunction(b.fn)} className={`${btnFn} py-2 text-xs`}>
                {b.label}
              </button>
            ))}
          </div>

          {/* Main keypad */}
          <div className="grid grid-cols-4 gap-1.5">
            <button type="button" onClick={pressClear} className={`${btnClr} py-3`}>C</button>
            <button type="button" onClick={pressClearEntry} className={`${btnClr} py-3`}>CE</button>
            <button type="button" onClick={pressBackspace} className={`${btnClr} py-3`}>⌫</button>
            <button type="button" onClick={() => pressOp('÷')} className={`${btnOp} py-3`}>÷</button>

            <button type="button" onClick={() => pressDigit('7')} className={`${btnNum} py-3`}>7</button>
            <button type="button" onClick={() => pressDigit('8')} className={`${btnNum} py-3`}>8</button>
            <button type="button" onClick={() => pressDigit('9')} className={`${btnNum} py-3`}>9</button>
            <button type="button" onClick={() => pressOp('×')} className={`${btnOp} py-3`}>×</button>

            <button type="button" onClick={() => pressDigit('4')} className={`${btnNum} py-3`}>4</button>
            <button type="button" onClick={() => pressDigit('5')} className={`${btnNum} py-3`}>5</button>
            <button type="button" onClick={() => pressDigit('6')} className={`${btnNum} py-3`}>6</button>
            <button type="button" onClick={() => pressOp('−')} className={`${btnOp} py-3`}>−</button>

            <button type="button" onClick={() => pressDigit('1')} className={`${btnNum} py-3`}>1</button>
            <button type="button" onClick={() => pressDigit('2')} className={`${btnNum} py-3`}>2</button>
            <button type="button" onClick={() => pressDigit('3')} className={`${btnNum} py-3`}>3</button>
            <button type="button" onClick={() => pressOp('+')} className={`${btnOp} py-3`}>+</button>

            <button type="button" onClick={() => pressConstant('π')} className={`${btnFn} py-3`}>π</button>
            <button type="button" onClick={() => pressDigit('0')} className={`${btnNum} py-3`}>0</button>
            <button type="button" onClick={() => pressDigit('.')} className={`${btnNum} py-3`}>.</button>
            <button type="button" onClick={pressEquals} className={`${btnEq} py-3`}>=</button>
          </div>

          {/* Parentheses row */}
          <div className="grid grid-cols-4 gap-1.5">
            <button type="button" onClick={() => pressParen('(')} className={`${btnFn} py-2 text-xs`}>(</button>
            <button type="button" onClick={() => pressParen(')')} className={`${btnFn} py-2 text-xs`}>)</button>
            <button type="button" onClick={() => pressConstant('e')} className={`${btnFn} py-2 text-xs`}>e</button>
            <button type="button"
              onClick={() => setError(null)}
              className="text-[10px] text-slate-500 hover:text-slate-600 py-2"
            >
              Clear Error
            </button>
          </div>
        </div>

        {/* History tape */}
        {showHistory && (
          <div className="w-full sm:w-56 border-t sm:border-t-0 sm:border-l border-slate-200 bg-slate-50/50">
            <div className="px-4 py-3 border-b border-slate-200">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">History</p>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No calculations yet</p>
              ) : (
                history.map((entry, i) => (
                  <div key={`item-${i}`} className="px-4 py-2.5 border-b border-slate-100 hover:bg-slate-100 transition-colors">
                    <p className="text-[10px] text-slate-500 font-mono">{entry.expression}</p>
                    <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">{entry.result}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
