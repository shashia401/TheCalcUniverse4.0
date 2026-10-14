import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { fmtRoot, parseNthRoot, radicalSymbol } from './nthRootMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function NthRootPanel({ values, results }: Props) {
  const r = parseNthRoot(values.index, values.radicand);
  if (r.kind !== 'ok' || results.length === 0) return null;
  const { n, x, value } = r;

  const result = fmtRoot(value);
  const radical = radicalSymbol(n);
  const xs = fmtRoot(x);

  // Real nth root curve around the radicand; odd roots are defined for negative t as well.
  const odd = n % 2 === 1;
  const tMax = Math.max(x + 2, 5);
  const tMin = odd && x < 0 ? Math.min(x - 2, -5) : 0;
  const steps = 80;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = tMin + ((tMax - tMin) * i) / steps;
    const y = (t < 0 ? -1 : 1) * Math.pow(Math.abs(t), 1 / n);
    if (Number.isFinite(y)) points.push({ x: t, y });
  }

  // Verification in relative terms (an absolute 0.001 tolerance hid errors for small radicands).
  const back = Math.pow(value, n);
  const ok = Math.abs(back - x) <= 1e-9 * Math.max(1, Math.abs(x));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Root Calculation</span>
      </div>

      <div className="p-5 space-y-4">
        {points.length > 1 && n > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">f(t) = t<sup>1/{n}</sup></p>
            <SvgLineChart
              ariaLabel={`Graph of the ${n}th root function with the point (${xs}, ${result})`}
              height={200}
              series={[{ name: `t^(1/${n})`, points, color: '#2563eb' }]}
              refLines={[{ x: 0, color: '#94a3b8', dashed: false }]}
              dots={[{ x, y: value, label: `(${xs}, ${result})`, color: '#dc2626' }]}
            />
          </div>
        )}

        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Result</p>
          <p className="text-3xl font-bold font-mono text-emerald-700 break-all">
            {radical}{xs} = {result}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">Fractional Exponent Form</p>
          <p className="text-lg font-mono font-bold text-blue-700 text-center break-all">
            {xs}^(1/{n}) = {result}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Verification</p>
          <p className="text-sm font-mono text-slate-700 text-center break-all">
            ({result})<sup>{n}</sup> = {fmtRoot(back)}
            {ok ? ' ✓' : ''}
          </p>
        </div>

        {r.simplified && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Simplified radical</p>
            <p className="text-lg font-mono font-bold text-slate-700">{radical}{xs} = {r.simplified}</p>
          </div>
        )}
      </div>
    </div>
  );
}
