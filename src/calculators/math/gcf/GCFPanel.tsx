import { CalculatorResult } from '../../../types/calculator';
import { parsePositiveSafeInt } from '../../../utils/numberTheory';
import { analyzeGcf, fmtFactors } from './gcfMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function GCFPanel({ values, results }: Props) {
  const pa = parsePositiveSafeInt(values.a);
  const pb = parsePositiveSafeInt(values.b);
  if (pa.kind !== 'ok' || pb.kind !== 'ok' || results.length === 0) return null;
  const a = pa.n;
  const b = pb.n;

  const { gcf, euclidSteps, factorsA, factorsB, shared, leftoverA, leftoverB } = analyzeGcf(a, b);
  const sharedText = fmtFactors(shared, ' · ');

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
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Greatest Common Factor</p>
          <p className="text-3xl font-bold font-mono text-emerald-700 break-all">GCF({a}, {b}) = {gcf}</p>
        </div>

        {/* Venn Diagram: the overlap is the GCF, each side holds what is left of that number */}
        <div className="flex justify-center">
          <svg width="320" height="180" viewBox="0 0 320 180" role="img" aria-label={`Venn diagram of the prime factors of ${a} and ${b}; the overlap multiplies to the GCF ${gcf}`}>
            <circle cx="120" cy="90" r="65" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="2" />
            <circle cx="200" cy="90" r="65" fill="rgba(16,185,129,0.1)" stroke="#047857" strokeWidth="2" />
            <text x="80" y="60" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1d4ed8">{a}</text>
            <text x="240" y="60" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#047857">{b}</text>
            <text x="85" y="95" textAnchor="middle" fontSize="9" fill="#475569">{fmtFactors(leftoverA, ', ')}</text>
            <text x="235" y="95" textAnchor="middle" fontSize="9" fill="#475569">{fmtFactors(leftoverB, ', ')}</text>
            <text x="160" y="85" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6d28d9">{sharedText}</text>
            <text x="160" y="105" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6d28d9">= {gcf}</text>
          </svg>
        </div>

        {/* Euclidean Algorithm */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2">Euclidean Algorithm</p>
          <div className="font-mono text-sm text-amber-800 space-y-0.5 break-all">
            {euclidSteps.map((step, i) => (
              <p key={`item-${i}`}>{step}</p>
            ))}
          </div>
        </div>

        {/* Prime factorization details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="font-bold text-slate-600 mb-1">Factors of {a}</p>
            <p className="font-mono text-slate-700 break-all">{fmtFactors(factorsA, ' · ')}</p>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="font-bold text-slate-600 mb-1">Factors of {b}</p>
            <p className="font-mono text-slate-700 break-all">{fmtFactors(factorsB, ' · ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
