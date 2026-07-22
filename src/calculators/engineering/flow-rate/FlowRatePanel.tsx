import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function FlowRatePanel({ results }: Props) {
  const velocity = results.find(r => r.id === 'velocity');
  const flowGPM = results.find(r => r.id === 'flowGPM');
  const flowLPM = results.find(r => r.id === 'flowLPM');
  const flowCFS = results.find(r => r.id === 'flowCFS');
  const area = results.find(r => r.id === 'area');
  const diameter = results.find(r => r.id === 'diameter');

  if (!results.length) return null;

  const isSafe = velocity ? parseNum(velocity.value) <= 10 : true;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Flow Rate</span>
      </div>
      <div className="p-5 space-y-3">
        {velocity && (
          <div className={`rounded-xl border p-4 text-center ${isSafe ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Flow Velocity</p>
            <p className="text-2xl font-bold text-slate-700">{velocity.value}</p>
            {!isSafe && <p className="text-xs text-amber-600 font-bold mt-1">High velocity — consider larger pipe</p>}
          </div>
        )}
        {flowGPM && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Flow Rate</p>
            <p className="text-2xl font-bold text-blue-700">{flowGPM.value}</p>
          </div>
        )}
        {diameter && (
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Required Pipe Diameter</p>
            <p className="text-2xl font-bold text-purple-700">{diameter.value}</p>
          </div>
        )}
        {flowLPM && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Liters per Minute</span>
            <span className="text-sm font-bold text-slate-700">{flowLPM.value}</span>
          </div>
        )}
        {area && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Cross-Section Area</span>
            <span className="text-sm font-bold text-slate-700">{area.value}</span>
          </div>
        )}
        {flowCFS && !flowGPM && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Flow Rate</span>
            <span className="text-sm font-bold text-slate-700">{flowCFS.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
