import { CalculatorResult } from '../../../types/calculator';
import { parseLongDivision } from './longDivisionMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COL = 22; // px per dividend digit
const ROW = 22;
const LEFT = 56; // room for the divisor

export default function LongDivisionPanel({ values, results }: Props) {
  const p = parseLongDivision(values.dividend, values.divisor);
  if (p.kind !== 'ok' || results.length === 0) return null;
  const r = p.result;
  const absDivisor = r.divisor < 0n ? -r.divisor : r.divisor;
  const digits = (r.dividend < 0n ? -r.dividend : r.dividend).toString();
  const n = digits.length;

  // Steps before the first non-zero quotient digit are not drawn (the standard tableau starts where the divisor first fits).
  const first = r.steps.findIndex((s) => s.qDigit > 0n);
  const drawn = first === -1 ? [] : r.steps.slice(first);

  const width = LEFT + n * COL + 16;
  const height = 40 + drawn.length * 2 * ROW + 8;
  const xEnd = (col: number) => LEFT + (col + 1) * COL - 4; // right edge of a column
  const absQ = (r.quotient < 0n ? -r.quotient : r.quotient).toString();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Long Division Tableau</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex justify-center overflow-x-auto" tabIndex={0}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="font-mono" role="img"
            aria-label={`Long division of ${absDivisor} into ${digits}: quotient ${absQ}, remainder ${r.remainder < 0n ? -r.remainder : r.remainder}`}>
            {/* quotient digits above the bracket, each over the dividend digit it was found at */}
            {drawn.map((s) => (
              <text key={`q${s.col}`} x={xEnd(s.col)} y={14} fontSize="14" fontWeight="bold" fill="#047857" textAnchor="end">{s.qDigit.toString()}</text>
            ))}
            {/* bracket */}
            <text x={LEFT - 10} y={38} fontSize="14" fontWeight="bold" fill="#1d4ed8" textAnchor="end">{absDivisor.toString()}</text>
            <line x1={LEFT - 6} y1={20} x2={LEFT + n * COL} y2={20} stroke="#334155" strokeWidth="2" />
            <line x1={LEFT - 6} y1={20} x2={LEFT - 6} y2={46} stroke="#334155" strokeWidth="2" />
            {digits.split('').map((d, i) => (
              <text key={`d${i}`} x={xEnd(i)} y={38} fontSize="14" fontWeight="bold" fill="#334155" textAnchor="end">{d}</text>
            ))}
            {/* one "−product / remainder + next digit" pair per step */}
            {drawn.map((s, k) => {
              const y1 = 40 + k * 2 * ROW + ROW;
              const y2 = y1 + ROW;
              const prodText = `−${s.product}`;
              const next = r.steps[s.col + 1];
              return (
                <g key={`s${s.col}`}>
                  <text x={xEnd(s.col)} y={y1} fontSize="13" fill="#475569" textAnchor="end">{prodText}</text>
                  <line x1={xEnd(s.col) - (prodText.length + 0.5) * 8} y1={y1 + 4} x2={xEnd(s.col) + 4} y2={y1 + 4} stroke="#94a3b8" strokeWidth="1" />
                  <text x={xEnd(s.col)} y={y2} fontSize="13" fontWeight="bold" fill="#1e293b" textAnchor="end">{s.remainder.toString()}</text>
                  {next && (
                    <text x={xEnd(s.col + 1)} y={y2} fontSize="13" fill="#6d28d9" textAnchor="end">{digits[s.col + 1]}</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Quotient</p>
            <p className="text-xl font-bold font-mono text-emerald-700 break-all">{r.quotient.toString()}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Remainder</p>
            <p className="text-xl font-bold font-mono text-blue-700 break-all">{r.remainder.toString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Decimal</p>
            <p className="text-xl font-bold font-mono text-slate-700 break-all">{r.remainder === 0n ? r.decimal6 : r.expansion}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 text-center font-mono break-all">
          {r.quotient.toString()} × {r.divisor.toString()} + {r.remainder.toString()} = {(r.quotient * r.divisor + r.remainder).toString()} ✓
        </div>
      </div>
    </div>
  );
}
