import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const Z_SCORES: Record<string, number> = {
  '90': 1.645,
  '95': 1.96,
  '99': 2.576,
};

export default function SampleSizePanel({ values, results }: Props) {
  const sizeRow = results.find(r => r.id === 'sampleSize');
  const zRow = results.find(r => r.id === 'zScore');
  const popRow = results.find(r => r.id === 'populationInfo');

  if (!sizeRow) return null;

  const N = Math.max(parseInt(values.population) || 0, 1);
  const confidence = values.confidence || '95';
  const E = Math.max((parseFloat(values.margin) || 5), 1) / 100;
  const Z = Z_SCORES[confidence] || 1.96;
  const p = 0.5;

  // Generate margin comparison table
  const margins = [1, 2, 3, 4, 5, 10];
  const rows = margins.map(m => {
    const e = m / 100;
    const nInfinite = (Z * Z * p * (1 - p)) / (e * e);
    const n = Math.ceil(nInfinite / (1 + (nInfinite - 1) / N));
    return { margin: m, size: n };
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Sample Size Analysis</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">Recommended Sample Size</p>
          <p className="text-3xl font-bold text-blue-700">{sizeRow.value}</p>
          <p className="text-xs text-slate-500 mt-1">{zRow?.value} · {popRow?.value}</p>
        </div>

        {/* Formula */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Formula &amp; Calculation</p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Infinite Population Formula</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              n₀ = Z² × p × (1-p) / E²
            </p>
            <p className="text-xs font-mono text-slate-600 mt-1">
              n₀ = {Z}² × 0.5 × 0.5 / {E}²
            </p>
            <p className="text-xs font-mono text-slate-600 mt-1">
              n₀ = {(Z * Z * p * (1 - p) / (E * E)).toFixed(0)}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Finite Population Correction</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              n = n₀ / (1 + (n₀ − 1) / N)
            </p>
            <p className="text-xs font-mono text-slate-600 mt-1">
              n = {sizeRow.value}
            </p>
          </div>
        </div>

        {/* Margin comparison table */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Sample Size by Margin of Error</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th scope="col" className="text-left py-1">Margin</th>
                <th scope="col" className="text-right py-1">±1%</th>
                <th scope="col" className="text-right py-1">±2%</th>
                <th scope="col" className="text-right py-1">±3%</th>
                <th scope="col" className="text-right py-1">±4%</th>
                <th scope="col" className="text-right py-1">±5%</th>
                <th scope="col" className="text-right py-1">±10%</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-slate-700 font-bold">
                <td className="py-1">n</td>
                {rows.map(r => (
                  <td key={r.margin} className={`text-right py-1 ${r.margin === parseFloat(values.margin || '5') ? 'text-blue-700' : ''}`}>
                    {r.size.toLocaleString()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
