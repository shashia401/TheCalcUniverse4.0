import { CalculatorResult } from '../../../types/calculator';
import { factorize, formatFactorization, parsePositiveSafeInt } from '../../../utils/numberTheory';
import { buildFactorTree, layoutTree } from './factorTree';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PrimeFactorizationPanel({ values, results }: Props) {
  const p = parsePositiveSafeInt(values.number);
  if (p.kind !== 'ok' || p.n < 2 || results.length === 0) return null;
  const n = p.n;
  const factorization = formatFactorization(factorize(n));
  const tree = layoutTree(buildFactorTree(n));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Factor Tree</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex justify-center overflow-auto" tabIndex={0}>
          <svg width={tree.width} height={tree.height} viewBox={`0 0 ${tree.width} ${tree.height}`} role="img" aria-label={`Prime factor tree of ${n}: ${factorization}`}>
            {tree.edges.map((e, i) => (
              <line key={`e${i}`} x1={e.x1} y1={e.y1 + 14} x2={e.x2} y2={e.y2 - 14} stroke="#94a3b8" strokeWidth="1.2" />
            ))}
            {tree.nodes.map((nd, i) => (
              <g key={`n${i}`}>
                <circle cx={nd.x} cy={nd.y} r="17" fill={nd.isPrime ? '#dbeafe' : '#f1f5f9'} stroke={nd.isPrime ? '#2563eb' : '#64748b'} strokeWidth="1.5" />
                <text x={nd.x} y={nd.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={String(nd.value).length > 5 ? 8 : 11} fontWeight="bold" fill={nd.isPrime ? '#1e40af' : '#334155'}>
                  {nd.value}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Prime Factorization</p>
          <p className="text-lg font-mono font-bold text-emerald-700 break-all">{factorization}</p>
          <p className="text-xs text-emerald-700 mt-1 break-all">{n} = {factorization}</p>
        </div>
      </div>
    </div>
  );
}
