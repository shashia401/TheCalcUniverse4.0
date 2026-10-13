import { CalculatorResult } from '../../../types/calculator';
import { LIFE_PATH_DESCRIPTIONS } from './numerologyData';
import { lifePathInfo } from './numerologyMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function NumerologyPanel({ values, results }: Props) {
  // Same pure function index.ts uses; the panel never parses result strings.
  const info = lifePathInfo(values);
  if (!info || info === 'invalid' || !results.length) return null;
  const desc = LIFE_PATH_DESCRIPTIONS[String(info.lifePath)];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Number Profile (for entertainment)</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-700 to-purple-700 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">{info.lifePath}</span>
          </div>
          {desc && <p className="text-lg font-bold text-slate-800 mt-2">{desc.title}</p>}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Reduction Steps</p>
          <div className="flex items-center gap-1 text-xs font-mono text-slate-700 flex-wrap">
            {[`${info.monthReduced} + ${info.dayReduced} + ${info.yearReduced} = ${info.sum}`, ...info.sumSteps.slice(1).map(String)].map((step, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">{step}</span>
                {i < arr.length - 1 && <span className="text-slate-600" aria-hidden="true">→</span>}
              </span>
            ))}
          </div>
        </div>

        {desc && (
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Key Strengths</p>
              <div className="flex flex-wrap gap-1">
                {desc.strengths.map((s) => (
                  <span key={s} className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Growth Areas</p>
              <div className="flex flex-wrap gap-1">
                {desc.weaknesses.map((s) => (
                  <span key={s} className="text-[10px] bg-red-200 text-red-900 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        <p className="text-[11px] text-slate-600">Numerology is traditional lore with no scientific basis. Treat it as entertainment.</p>
      </div>
    </div>
  );
}
