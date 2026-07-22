import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function YarnYardagePanel({ results }: Props) {
  const yardRow = results.find(r => r.id === 'yardageNeeded');
  const meterRow = results.find(r => r.id === 'metersNeeded');
  const baseRow = results.find(r => r.id === 'baseYardage');
  const gaugeRow = results.find(r => r.id === 'gaugeAdjustment');

  if (!yardRow) return null;

  const yardVal = parseInt(yardRow.value.replace(/,/g, '')) || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Yardage Estimate</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 text-center">
          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Yarn Needed</p>
          <p className="text-3xl font-bold font-mono text-purple-700">{yardRow.value}</p>
          {meterRow && (
            <p className="text-sm text-purple-400 mt-1">{meterRow.value}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {baseRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Base</p>
              <p className="text-sm font-bold font-mono text-slate-700">{baseRow.value}</p>
            </div>
          )}
          {gaugeRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Gauge Factor</p>
              <p className="text-sm font-bold font-mono text-slate-700">{gaugeRow.value.replace(/.*×\s*/, '')}</p>
            </div>
          )}
        </div>

        {/* Visual bar */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Relative Size</p>
          <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all" style={{ width: `${Math.min((yardVal / 3000) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>Small (200 yd)</span>
            <span>Medium</span>
            <span>Large (2500+ yd)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
