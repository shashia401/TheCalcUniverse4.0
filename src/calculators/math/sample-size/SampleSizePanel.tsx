import { CalculatorResult } from '../../../types/calculator';
import { cochranSampleSize } from './cochran';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface SizeData {
  N: number;
  z: number;
  p: number;
  E: number;
  confidence: number;
  n0: number;
  n: number;
}

export default function SampleSizePanel({ results }: Props) {
  const sizeRow = results.find(r => r.id === 'sampleSize');
  const zRow = results.find(r => r.id === 'zScore');
  const popRow = results.find(r => r.id === 'populationInfo');
  const raw = results.find(r => r.id === '_data');

  if (!sizeRow || !raw) return null;
  let d: SizeData;
  try {
    d = JSON.parse(raw.value) as SizeData;
  } catch {
    return null;
  }
  const { N, z: Z, p, E } = d;

  // Same pure function as the calculator, so the table can never disagree with the headline number.
  const margins = [1, 2, 3, 4, 5, 10];
  const rows = margins.map(m => ({ margin: m, size: cochranSampleSize(N, d.confidence, m / 100, p).n }));
  const fmtNum = (x: number) => parseFloat(x.toFixed(2)).toLocaleString('en-US');

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
          <p className="text-sm text-slate-700 mb-2">Recommended Sample Size</p>
          <p className="text-3xl font-bold text-blue-700">{sizeRow.value}</p>
          <p className="text-xs text-slate-700 mt-1">{zRow?.value} · {popRow?.value}</p>
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
              n₀ = {Z.toFixed(4)}² × {fmtNum(p)} × {fmtNum(1 - p)} / {fmtNum(E)}²
            </p>
            <p className="text-xs font-mono text-slate-600 mt-1">
              n₀ = {fmtNum(d.n0)} (rounded up to {Math.ceil(d.n0 - 1e-9).toLocaleString('en-US')})
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
                  <td key={r.margin} className={`text-right py-1 ${r.margin === parseFloat((E * 100).toFixed(6)) ? 'text-blue-700' : ''}`}>
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
