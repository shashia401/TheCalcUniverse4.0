import { CalculatorResult } from '../../../types/calculator';

interface FactorData {
  factor: number;
  exponent: number;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function GCFPanel({ values, results }: Props) {
  const primeData = results.find(r => r.id === '_primeData')?.value;
  const gcf = results.find(r => r.id === 'gcf')?.value || '';
  const euclidSteps = results.find(r => r.id === 'euclidSteps')?.value || '';

  let data: { a: FactorData[]; b: FactorData[]; shared: FactorData[] } | null = null;
  try {
    if (primeData) data = JSON.parse(primeData);
  } catch { /* ignore */ }

  const a = parseInt(values.a) || 0;
  const b = parseInt(values.b) || 0;

  if (!a || !b || results.length === 0 || !data) return null;

  // Build Venn diagram data
  const onlyA = data.a.filter((f) => !data!.shared.find((s) => s.factor === f.factor));
  const onlyB = data.b.filter((f) => !data!.shared.find((s) => s.factor === f.factor));

  const fmtFactors = (factors: FactorData[]) => factors.map((f) => `${f.factor}^${f.exponent}`).join(' · ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">GCF — Venn Diagram &amp; Euclidean Algorithm</span>
      </div>

      <div className="p-5 space-y-4">
        {/* GCF Result */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Greatest Common Factor</p>
          <p className="text-3xl font-bold font-mono text-emerald-700">GCF({a}, {b}) = {gcf}</p>
        </div>

        {/* Venn Diagram */}
        <div className="flex justify-center">
          <svg width="320" height="180" viewBox="0 0 320 180" role="img" aria-label="Venn diagram showing common factors and greatest common factor">
            {/* Left circle (A only) */}
            <circle cx="120" cy="90" r="65" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="2" />
            {/* Right circle (B only) */}
            <circle cx="200" cy="90" r="65" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth="2" />
            {/* Labels */}
            <text x="80" y="90" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3b82f6">{a}</text>
            <text x="240" y="90" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#10b981">{b}</text>
            {/* Factors only in A */}
            <text x="85" y="115" textAnchor="middle" fontSize="9" fill="#64748b">
              {onlyA.map((f) => `${f.factor}^${f.exponent}`).join(', ')}
            </text>
            {/* Factors only in B */}
            <text x="235" y="115" textAnchor="middle" fontSize="9" fill="#64748b">
              {onlyB.map((f) => `${f.factor}^${f.exponent}`).join(', ')}
            </text>
            {/* Shared factors in intersection */}
            <text x="160" y="85" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8b5cf6">
              {data.shared.map((f) => `${f.factor}^${f.exponent}`).join(' · ')}
            </text>
            <text x="160" y="105" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8b5cf6">= {gcf}</text>
          </svg>
        </div>

        {/* Euclidean Algorithm */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Euclidean Algorithm</p>
          <div className="font-mono text-sm text-amber-700 space-y-0.5">
            {euclidSteps.split(' | ').map((step, i) => (
              <p key={`item-${i}`}>{step}</p>
            ))}
          </div>
        </div>

        {/* Prime factorization details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="font-bold text-slate-500 mb-1">Factors of {a}</p>
            <p className="font-mono text-slate-600">{fmtFactors(data.a)}</p>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="font-bold text-slate-500 mb-1">Factors of {b}</p>
            <p className="font-mono text-slate-600">{fmtFactors(data.b)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
