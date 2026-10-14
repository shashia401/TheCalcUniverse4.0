import { CalculatorResult } from '../../../types/calculator';
import { parseSlot } from '../proportion-calculator/proportionMath';
import { ASPECT_PRESETS, simplifyRatio } from './ratioMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function RatioPanel({ values, results }: Props) {
  const simplified = results.find(r => r.id === 'simplified');
  const decimal = results.find(r => r.id === 'decimal');
  const proportionResult = results.find(r => r.id === 'proportionResult');
  const proportionSteps = results.find(r => r.id === 'proportionSteps');
  // Highlight the common aspect ratio that matches the entered A : B (or the chosen preset when A and B are blank).
  const sa = parseSlot(values.a);
  const sb = parseSlot(values.b);
  let selectedKey = ASPECT_PRESETS[values.preset ?? ''] && !sa && !sb ? (values.preset ?? '') : '';
  if (sa && sb && sa !== 'bad' && sb !== 'bad' && sa.n > 0n && sb.n > 0n) {
    const [x, y] = simplifyRatio(sa, sb);
    selectedKey = Object.entries(ASPECT_PRESETS).find(([, p]) => BigInt(p.a) === x && BigInt(p.b) === y)?.[0] ?? '';
  }
  const aspectRatios = ASPECT_PRESETS;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16h16M4 4l16 16" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Ratio &amp; Aspect Ratio Guide</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Simplified ratio */}
        {simplified && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Simplified Ratio</p>
            <p className="text-3xl font-bold text-blue-700 font-mono">{simplified.value}</p>
            {decimal && <p className="text-xs text-slate-500 mt-1">= {decimal.value}</p>}
          </div>
        )}

        {/* Proportion result */}
        {proportionResult && proportionSteps && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Proportion</p>
            <p className="text-sm font-mono font-bold text-emerald-700">{proportionResult.value}</p>
            <p className="text-xs font-mono text-emerald-700 mt-1">{proportionSteps.value}</p>
          </div>
        )}

        {/* Aspect ratio visualization */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Aspect Ratio Visual Reference</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(aspectRatios).map(([key, ar]) => {
              const isSelected = selectedKey === key;
              const ratio = ar.a / ar.b;
              const w = 60;
              const h = w / ratio;
              return (
                <div
                  key={key}
                  className={`rounded-lg border p-2 text-center ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
                >
                  <div className="flex justify-center mb-1">
                    <svg width={w} height={Math.min(h, 50)} viewBox={`0 0 ${w} ${Math.min(h, 50)}`} role="img" aria-label={'Aspect ratio visualization for ' + key + ' ' + ar.label}>
                      <rect x="1" y="1" width={w - 2} height={Math.min(h, 50) - 2} fill={isSelected ? '#dbeafe' : 'white'} stroke={isSelected ? '#3b82f6' : '#94a3b8'} strokeWidth="1.5" rx="2" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">{key}</p>
                  <p className="text-[9px] text-slate-500">{ar.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cross-multiplication explanation */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Cross-Multiplication</p>
          <p className="text-xs text-slate-700 leading-relaxed font-mono">
            A : B = C : D &rarr; A × D = B × C
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Enter A, B, and either C or D. The calculator solves for the missing value automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
