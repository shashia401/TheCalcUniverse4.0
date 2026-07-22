import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function NumerologyPanel({ results }: Props) {
  const lifePath = results.find(r => r.id === 'lifePathNumber');
  const title = results.find(r => r.id === 'lifePathTitle');
  const strengths = results.find(r => r.id === 'strengths');
  const weaknesses = results.find(r => r.id === 'weaknesses');
  const totalSum = results.find(r => r.id === 'totalSum');

  if (!lifePath) return null;

  const numMatch = lifePath.value.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1]) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Number Profile</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Life Path Number circle */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">{num}</span>
          </div>
          {title && (
            <>
              <p className="text-lg font-bold text-slate-800 mt-2">{title.value}</p>
            </>
          )}
        </div>

        {/* Step visualization */}
        {totalSum && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reduction Steps</p>
            <div className="flex items-center gap-1 text-xs font-mono text-slate-700 flex-wrap">
              {totalSum.value.split('→').map((step, i, arr) => (
                <span key={`item-${i}`} className="flex items-center gap-1">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">{step.trim()}</span>
                  {i < arr.length - 1 && <span className="text-slate-400">→</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths / Weaknesses */}
        <div className="grid grid-cols-1 gap-3">
          {strengths && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Key Strengths</p>
              <div className="flex flex-wrap gap-1">
                {strengths.value.split('•').map((s, i) => (
                  s.trim() ? <span key={`item-${i}`} className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">{s.trim()}</span> : null
                ))}
              </div>
            </div>
          )}
          {weaknesses && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Growth Areas</p>
              <div className="flex flex-wrap gap-1">
                {weaknesses.value.split('•').map((s, i) => (
                  s.trim() ? <span key={`item-${i}`} className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full">{s.trim()}</span> : null
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
