import type { CalculatorResult } from '../../../types/calculator';
import { Ruler, AlertTriangle, Info } from 'lucide-react';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

function parseInchesFromDisplay(display: string): number {
  const match = display.match(/([\d.]+)'/);
  if (!match) return NaN;
  const ft = parseFloat(match[1]);
  if (isNaN(ft)) return NaN;
  const inMatch = display.match(/'([\d.]+)"/);
  const inc = inMatch ? parseFloat(inMatch[1]) : 0;
  return ft * 12 + inc;
}

export default function HeightPanel({ results }: Props) {
  const predictedHeight = getValue(results, 'predictedHeight');
  const heightRange = getValue(results, 'heightRange');
  const predictedCm = getValue(results, 'predictedCm');
  const motherHeight = getValue(results, 'motherHeight');
  const fatherHeight = getValue(results, 'fatherHeight');
  const gender = getValue(results, 'gender');
  const midParental = getValue(results, 'midParental');

  if (!predictedHeight) return null;

  const motherInches = parseInchesFromDisplay(motherHeight);
  const fatherInches = parseInchesFromDisplay(fatherHeight);
  const predictedInches = parseFloat(midParental);

  // Find the max height for scaling (add a little headroom)
  const maxInches = Math.max(
    ...[motherInches, fatherInches, isFinite(predictedInches) ? predictedInches + 2 : 40].filter(v => isFinite(v))
  ) + 4;
  const scale = (inches: number) => (inches / maxInches) * 200; // max bar height 200px

  const minBarHeight = 40; // minimum bar height for visibility

  const motherBarH = Math.max(isFinite(motherInches) ? scale(motherInches) : 0, minBarHeight);
  const fatherBarH = Math.max(isFinite(fatherInches) ? scale(fatherInches) : 0, minBarHeight);
  const childBarH = Math.max(isFinite(predictedInches) ? scale(predictedInches) : 0, minBarHeight);

  return (
    <div className="space-y-6">
      {/* Height Comparison */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <Ruler size={18} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Height Comparison
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-end justify-center gap-6 sm:gap-10" style={{ height: 240 }}>
            {/* Mother */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Mother
              </div>
              <div
                className="w-16 rounded-t-lg bg-gradient-to-t from-rose-400 to-rose-300 shadow-inner flex items-end justify-center pb-2 transition-all"
                style={{ height: motherBarH }}
              >
                <span className="text-xs font-bold text-white drop-shadow-sm">
                  {motherHeight}
                </span>
              </div>
            </div>

            {/* Father */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Father
              </div>
              <div
                className="w-16 rounded-t-lg bg-gradient-to-t from-blue-400 to-blue-300 shadow-inner flex items-end justify-center pb-2 transition-all"
                style={{ height: fatherBarH }}
              >
                <span className="text-xs font-bold text-white drop-shadow-sm">
                  {fatherHeight}
                </span>
              </div>
            </div>

            {/* Child */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Child ({gender})
              </div>
              <div className="relative flex flex-col items-center">
                {/* Range bracket */}
                <div className="absolute -left-4 top-0 bottom-0 w-3 flex flex-col items-center">
                  <div
                    className="w-0.5 bg-amber-300"
                    style={{ height: '100%' }}
                  />
                  <div className="absolute top-0 left-0 w-2 h-0.5 bg-amber-300" />
                  <div className="absolute bottom-0 left-0 w-2 h-0.5 bg-amber-300" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-1 -translate-x-1/2 text-[10px] font-medium text-amber-500 whitespace-nowrap">
                    ±2"
                  </div>
                </div>
                <div
                  className="w-16 rounded-t-lg bg-gradient-to-t from-emerald-400 to-emerald-300 shadow-inner flex items-end justify-center pb-2 transition-all"
                  style={{ height: childBarH }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {predictedHeight.split(' (')[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            Bars are scaled proportionally to actual height
          </div>
        </div>
      </div>

      {/* Expected Range */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Info size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Expected Range
          </span>
        </div>
        <div className="p-6">
          <div className="relative w-full h-6 bg-slate-100 rounded-full overflow-hidden">
            {/* Range indicator */}
            <div
              className="absolute top-0 h-full bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200 rounded-full"
              style={{
                left: '25%',
                width: '50%',
              }}
            />
            {/* Predicted marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-emerald-600 z-10"
              style={{ left: '50%' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{heightRange.split(' to ')[0]}</span>
            <span className="font-bold text-emerald-700">Predicted</span>
            <span>{heightRange.split(' to ')[1]}</span>
          </div>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-md overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-200 bg-amber-100">
          <AlertTriangle size={18} className="text-amber-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Medical Disclaimer
          </span>
        </div>
        <div className="p-6 text-sm text-amber-800 leading-relaxed space-y-2">
          <p>
            <strong>Important:</strong> This calculator uses the Mid-Parental Height method (also
            known as the Tanner method). It provides only a rough estimate — actual adult height is
            influenced by nutrition, genetics, sleep, and environmental factors.
          </p>
          <p>
            This tool is for educational and informational purposes only. It is not a substitute for
            professional medical advice, diagnosis, or treatment. Always consult a pediatrician or
            healthcare provider for medical concerns about your child's growth and development.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Info size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Measurement Summary
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-slate-100">
          <div className="p-5 text-center">
            <p className="text-sm font-bold text-slate-700">{motherHeight}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
              Mother
            </p>
          </div>
          <div className="p-5 text-center">
            <p className="text-sm font-bold text-slate-700">{fatherHeight}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
              Father
            </p>
          </div>
          <div className="p-5 text-center">
            <p className="text-sm font-bold text-emerald-700">
              {predictedHeight.split(' (')[0]}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
              Predicted
            </p>
          </div>
          <div className="p-5 text-center">
            <p className="text-sm font-bold text-slate-700">{predictedCm} cm</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
              In CM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
