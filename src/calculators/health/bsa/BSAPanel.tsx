import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function BSAPanel({ results }: Props) {
  const mostellerResult = results.find(r => r.id === 'bsaMosteller');
  const duboisResult = results.find(r => r.id === 'bsaDubois');
  const haycockResult = results.find(r => r.id === 'bsaHaycock');

  if (!mostellerResult || !duboisResult || !haycockResult) return null;

  const mosteller = parseFloat(mostellerResult.value) || 0;
  const dubois = parseFloat(duboisResult.value) || 0;
  const haycock = parseFloat(haycockResult.value) || 0;
  const maxBsa = Math.max(mosteller, dubois, haycock) * 1.2;

  const [hoverInfo, setHoverInfo] = useState<{ label: string; value: string; formula: string } | null>(null);

  const bar = (label: string, value: number, max: number, color: string, formula: string) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <div
        className="space-y-1"
        onMouseEnter={() => setHoverInfo({ label, value: `${value.toFixed(2)} m²`, formula })}
        onMouseLeave={() => setHoverInfo(null)}
      >
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-slate-700">{label}</span>
          <span className="font-bold text-slate-900">{value.toFixed(2)} m²</span>
        </div>
        <div className="h-6 bg-slate-100 rounded-md overflow-hidden">
          <div className={`h-full rounded-md ${color} transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 italic">{formula}</p>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">BSA Formula Comparison</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Formula bars */}
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            {bar('Mosteller (Clinical Standard)', mosteller, maxBsa, 'bg-blue-500', '√(H × W ÷ 3600)')}
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            {bar('Du Bois', dubois, maxBsa, 'bg-slate-400', '0.007184 × W^0.425 × H^0.725')}
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            {bar('Haycock', haycock, maxBsa, 'bg-slate-400', '0.024265 × W^0.5378 × H^0.3964')}
          </div>
        </div>

        {hoverInfo && (
          <div className="text-xs text-center text-slate-600 bg-slate-100 rounded-lg px-3 py-2">
            <span className="font-semibold">{hoverInfo.label}</span>
            <span className="text-slate-400 mx-1">—</span>
            <span className="font-bold text-slate-800">{hoverInfo.value}</span>
            <span className="text-slate-500 ml-1">{hoverInfo.formula}</span>
          </div>
        )}

        {/* Formula Display */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Mosteller Formula</p>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-sm font-mono text-slate-800">
              BSA = √(Height × Weight ÷ 3600)
            </p>
          </div>
        </div>

        {/* BSA Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">BSA Reference</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">1.73</p>
              <p className="text-[10px] text-slate-500">Avg Adult m²</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">1.0</p>
              <p className="text-[10px] text-slate-500">Child m²</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">0.5</p>
              <p className="text-[10px] text-slate-500">Infant m²</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">2.0</p>
              <p className="text-[10px] text-slate-500">Large Adult m²</p>
            </div>
          </div>
        </div>

        {/* Clinical Warning — mandatory un-closeable */}
        <div className="rounded-xl border-2 border-red-400 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-red-700 mb-2">⚠ Clinical Usage — Educational Purposes Only</p>
              <p className="text-xs text-red-600 leading-relaxed">
                <strong>This BSA calculation is for educational reference only.</strong> All clinical dosing
                decisions — including chemotherapy, pediatric medications, and other treatments requiring BSA —
                <strong> must be verified by a licensed pharmacist or physician.</strong> Different institutions
                may use different BSA formulas for different protocols. Using an incorrect BSA value for drug
                dosing can result in underdosing or potentially toxic overdosing. This tool provides estimates
                and is not a substitute for professional clinical judgment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
