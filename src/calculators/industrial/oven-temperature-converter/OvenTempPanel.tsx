import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function OvenTempPanel({ results }: Props) {
  const resultC = results.find(r => r.id === 'resultC');
  const resultF = results.find(r => r.id === 'resultF');
  const gasMark = results.find(r => r.id === 'gasMark');
  const desc = results.find(r => r.id === 'description');

  if (!resultC || !resultF) return null;

  const cVal = parseFloat(resultC.value) || 0;
  const fVal = parseFloat(resultF.value) || 0;

  // Temperature zones: low (< 160C), medium (160-190C), high (190-230C), very high (> 230C)
  const zoneLabel = cVal < 130 ? 'Very Low' : cVal < 160 ? 'Low' : cVal < 190 ? 'Medium' : cVal < 230 ? 'High' : 'Very High';
  const zoneColors: Record<string, string> = {
    'Very Low': 'from-blue-400 to-blue-300',
    'Low': 'from-blue-500 to-cyan-400',
    'Medium': 'from-amber-400 to-yellow-300',
    'High': 'from-orange-500 to-red-400',
    'Very High': 'from-red-600 to-red-500',
  };
  const zoneBg = zoneColors[zoneLabel] || 'from-slate-400 to-slate-300';

  // Scale: 100F to 500F mapped to 0-100%
  const fPct = Math.min(Math.max(((fVal - 100) / 400) * 100, 0), 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Oven Temperature</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Temperature gauge */}
        <div>
          <div className="flex justify-between text-[9px] font-semibold text-slate-400 mb-1">
            <span>100°F (38°C)</span>
            <span>300°F (149°C)</span>
            <span>500°F (260°C)</span>
          </div>
          <div className="h-4 bg-gradient-to-r from-blue-300 via-amber-300 to-red-400 rounded-full relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-6 bg-slate-800 rounded-full shadow"
              style={{ left: `${fPct}%` }}
            />
          </div>
          <div className="text-center mt-2">
            <span className={`inline-block bg-gradient-to-r ${zoneBg} text-white text-sm font-bold font-mono px-3 py-1 rounded-full`}>
              {resultF.value} / {resultC.value}
            </span>
          </div>
          <div className="text-center mt-1">
            <span className="text-xs font-semibold text-slate-500">{zoneLabel} Heat</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-orange-500 uppercase">F</p>
            <p className="text-sm font-bold font-mono text-orange-700">{resultF.value}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-blue-500 uppercase">C</p>
            <p className="text-sm font-bold font-mono text-blue-700">{resultC.value}</p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-purple-500 uppercase">Gas</p>
            <p className="text-sm font-bold font-mono text-purple-700">{gasMark?.value || 'N/A'}</p>
          </div>
        </div>

        {desc && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-center">
            <p className="text-xs font-semibold text-slate-600">{desc.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
