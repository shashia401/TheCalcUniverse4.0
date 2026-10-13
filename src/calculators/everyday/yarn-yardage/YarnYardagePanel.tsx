import { CalculatorResult } from '../../../types/calculator';
import { yarnPlan } from './yarnMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function YarnYardagePanel({ values, results }: Props) {
  // Same pure function index.ts uses; the panel never parses result strings.
  const p = yarnPlan(values);
  if (!p || !results.length) return null;
  const n = (x: number) => Math.round(x).toLocaleString('en-US');
  const custom = p.projectType === 'Custom';
  const SCALE_MAX = 3000;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Yardage Estimate</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 text-center">
          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Yarn Needed (estimate)</p>
          <p className="text-3xl font-bold font-mono text-purple-800">{n(p.yards)} yards</p>
          <p className="text-sm text-purple-800 mt-1">{n(p.meters)} meters</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase">{custom ? 'Base (before waste)' : 'Base'}</p>
            <p className="text-sm font-bold font-mono text-slate-700">{n(p.baseYardage)} yards</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase">{custom ? 'Waste allowance' : 'Row gauge factor'}</p>
            <p className="text-sm font-bold font-mono text-slate-700">{custom ? '+20%' : `× ${p.rowFactor.toFixed(2)}`}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Relative Size</p>
          <div className="h-5 bg-slate-100 rounded-full overflow-hidden" role="img" aria-label={`${n(p.yards)} yards on a 0 to ${SCALE_MAX} yard scale`}>
            <div className="h-full bg-purple-700 rounded-full" style={{ width: `${Math.min((p.yards / SCALE_MAX) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>0 yd</span>
            <span>{SCALE_MAX / 2} yd</span>
            <span>{SCALE_MAX}+ yd</span>
          </div>
        </div>
      </div>
    </div>
  );
}
