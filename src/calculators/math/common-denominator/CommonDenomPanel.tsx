import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { fracToNumber, makeFrac } from '../../../utils/rational';

// index.ts emits plain numbers when exactly representable, decimal strings otherwise.
type Big = number | string;
interface ConvertedFraction {
  numerator: Big;
  denominator: Big;
  originalNumerator: Big;
  originalDenominator: Big;
  multiplier: Big;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const CHART_COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626', '#db2777', '#0891b2'];

export default function CommonDenomPanel({ results }: Props) {
  const lcd = results.find(r => r.id === 'lcd');
  const convertedRaw = results.find(r => r.id === '_convertedFractions')?.value;
  const workRaw = results.find(r => r.id === 'work')?.value;

  let converted: ConvertedFraction[] = [];
  try {
    if (convertedRaw) converted = JSON.parse(convertedRaw);
  } catch {
    /* ignore */
  }

  const workSteps = workRaw
    ? workRaw.split(' | ').map((s) => {
        const [label, ...rest] = s.split(': ');
        return { label, detail: rest.join(': ') };
      })
    : [];

  if (!lcd || results.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Common Denominator Work</span>
      </div>

      <div className="p-5 space-y-4">
        {/* LCD result */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Least Common Denominator (LCD)</p>
          <p className="text-3xl font-bold font-mono text-emerald-700">{lcd.value}</p>
        </div>

        {/* Fraction comparison: each converted fraction's value (numerator / LCD) */}
        {converted.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Fraction Comparison (Common Denominator)</p>
            <SvgBarChart
              data={converted.map((cf, i) => ({
                label: `${cf.originalNumerator}/${cf.originalDenominator}`,
                value: fracToNumber(makeFrac(BigInt(cf.numerator), BigInt(cf.denominator))),
                color: CHART_COLORS[i % CHART_COLORS.length],
              }))}
              ariaLabel="Bar chart comparing the value of each fraction after conversion to the common denominator"
              height={180}
              format={(v) => v.toFixed(2)}
              maxBarWidth={48}
            />
          </div>
        )}

        {/* Converted fractions table */}
        {converted.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-3">Converted Fractions</p>
            <div className="space-y-2">
              {converted.map((cf, i) => (
                <div key={`item-${i}`} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-blue-700 font-bold min-w-[60px] text-right">
                    {cf.originalNumerator}/{cf.originalDenominator}
                  </span>
                  <svg aria-hidden="true" className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-mono text-emerald-700 font-bold">
                    {cf.numerator}/{cf.denominator}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">
                    (×{cf.multiplier})
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-blue-700 mt-2">
              Each fraction is scaled by multiplying numerator and denominator by (LCD / original denominator).
            </p>
          </div>
        )}

        {/* Step-by-step work */}
        {workSteps.length > 0 && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-3">Step-by-Step LCM Computation</p>
            <div className="space-y-2">
              {workSteps.map((ws, i) => (
                <div key={`item-${i}`} className="flex gap-2">
                  <span className="text-[10px] font-bold text-purple-700 min-w-[48px] shrink-0 mt-0.5">
                    {ws.label}:
                  </span>
                  <span className="text-xs font-mono text-purple-700 leading-relaxed">
                    {ws.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LCD formula card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">LCD Formula</p>
          <p className="text-sm font-mono text-slate-600">LCD = LCM(denominator₁, denominator₂, ..., denominatorₙ)</p>
          <p className="text-xs text-slate-500 mt-1">
            LCM(a, b) = (a × b) / GCD(a, b) &mdash; computed using the Euclidean algorithm for GCD.
          </p>
        </div>
      </div>
    </div>
  );
}
