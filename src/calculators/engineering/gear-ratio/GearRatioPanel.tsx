import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function GearRatioPanel({ results }: Props) {
  const outputRPM = results.find(r => r.id === 'outputRPM');
  const ratio = results.find(r => r.id === 'ratio');
  const type = results.find(r => r.id === 'type');
  const outputTorque = results.find(r => r.id === 'outputTorque');
  const inputRPM = results.find(r => r.id === 'inputRPM');

  if (!results.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Gear Ratio</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Gear Ratio</p>
          <p className="text-3xl font-bold text-blue-700">{ratio?.value || ''}</p>
          {type && <p className="text-xs text-blue-500 mt-1">{type.value}</p>}
        </div>

        {/* Gear visualization with inline SVG */}
        <svg viewBox="0 0 300 100" className="w-full" style={{ maxHeight: 80 }}>
          <circle cx="90" cy="50" r="30" fill="none" stroke="#3b82f6" strokeWidth="3" />
          <circle cx="90" cy="50" r="8" fill="#3b82f6" />
          <line x1="90" y1="20" x2="90" y2="80" stroke="#3b82f6" strokeWidth="2" />
          <line x1="60" y1="50" x2="120" y2="50" stroke="#3b82f6" strokeWidth="2" />
          <text x="90" y="95" textAnchor="middle" fontSize="10" fill="#64748b">Input</text>
          <circle cx="210" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="3" />
          <circle cx="210" cy="50" r="10" fill="#8b5cf6" />
          <line x1="210" y1="10" x2="210" y2="90" stroke="#8b5cf6" strokeWidth="2" />
          <line x1="170" y1="50" x2="250" y2="50" stroke="#8b5cf6" strokeWidth="2" />
          <text x="210" y="97" textAnchor="middle" fontSize="10" fill="#64748b">Output</text>
        </svg>

        <div className="grid grid-cols-2 gap-3">
          {outputRPM && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Output Speed</p>
              <p className="text-lg font-bold text-slate-700">{outputRPM.value}</p>
            </div>
          )}
          {inputRPM && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Input RPM</p>
              <p className="text-lg font-bold text-slate-700">{inputRPM.value}</p>
            </div>
          )}
        </div>
        {outputTorque && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-800 font-semibold">{outputTorque.label}</span>
              <span className="text-lg font-bold text-emerald-700">{outputTorque.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
