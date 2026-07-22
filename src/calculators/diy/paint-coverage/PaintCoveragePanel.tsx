import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function PaintCoveragePanel({ results }: Props) {
  const gallons = results.find(r => r.id === 'gallons');
  const containers = results.find(r => r.id === 'containers');
  const paintableArea = results.find(r => r.id === 'paintableArea');
  const totalWallArea = results.find(r => r.id === 'totalWallArea');

  if (!gallons) return null;

  const galVal = parseNum(gallons.value);
  const contVal = containers ? parseInt(containers.value) : 0;
  const pAreaVal = paintableArea ? parseNum(paintableArea.value) : 0;
  const tAreaVal = totalWallArea ? parseNum(totalWallArea.value) : 0;
  const maxArea = Math.max(pAreaVal, tAreaVal);

  const bar = (label: string, val: number, color: string) => {
    const pct = maxArea > 0 ? (val / maxArea) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 10 ? 'min-w-[45px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[9px] font-bold text-white">{val.toFixed(0)} sq ft</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Paint Coverage</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Paint Needed</p>
          <p className="text-3xl font-bold text-blue-700">{gallons.value}</p>
        </div>
        {tAreaVal > 0 && bar('Total Wall Area', tAreaVal, 'bg-slate-400')}
        {pAreaVal > 0 && bar('Paintable Area', pAreaVal, 'bg-blue-500')}
        {containers && (
          <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2 flex justify-between">
            <span className="text-xs text-slate-600">Buy</span>
            <span className="text-sm font-bold text-slate-700">{containers.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
