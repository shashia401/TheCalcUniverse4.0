import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseGrams(s: string): number {
  const m = s.match(/(\d[\d,]*)/);
  return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
}

export default function FatIntakePanel({ results }: Props) {
  const totalTarget = results.find(r => r.id === 'totalFatTarget');
  const satResult = results.find(r => r.id === 'saturatedFat');
  const monoResult = results.find(r => r.id === 'monounsaturatedFat');
  const polyResult = results.find(r => r.id === 'polyunsaturatedFat');

  if (!totalTarget || !satResult || !monoResult || !polyResult) return null;

  // Parse values for the bar visualization
  const satG = parseGrams(satResult.value.replace('≤ ', ''));
  const monoParts = monoResult.value.split('–');
  const monoLow = parseGrams(monoParts[0] || '');
  const monoHigh = parseGrams(monoParts[1] || '0');
  const polyParts = polyResult.value.split('–');
  const polyLow = parseGrams(polyParts[0] || '');
  const polyHigh = parseGrams(polyParts[1] || '0');
  const monoMid = Math.round((monoLow + monoHigh) / 2);
  const polyMid = Math.round((polyLow + polyHigh) / 2);
  const total = satG + monoMid + polyMid;

  const [hoverFat, setHoverFat] = useState<string | null>(null);

  const bar = (label: string, grams: number, maxG: number, color: string, detail: string, fatKey: string) => {
    const pct = Math.min((grams / maxG) * 100, 100);
    const isHovered = hoverFat === fatKey;
    return (
      <div
        className={`space-y-1 cursor-pointer transition-all ${isHovered ? 'opacity-100' : ''}`}
        onMouseEnter={() => setHoverFat(fatKey)}
        onMouseLeave={() => setHoverFat(null)}
      >
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-slate-700">{label}</span>
          <span className="font-bold text-slate-900">{grams} g</span>
        </div>
        <div className="h-5 bg-slate-100 rounded-md overflow-hidden">
          <div className={`h-full rounded-md ${color} transition-all ${isHovered ? 'brightness-110' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-slate-500">{detail}</p>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fat Breakdown by Type</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Fat type bars */}
        <div className="space-y-4">
          {/* Saturated bar */}
          <div className={`rounded-xl border p-4 transition-all ${
            hoverFat === 'saturated' ? 'border-red-300 bg-red-50' : 'border-red-100 bg-red-50/50'
          }`}>
            {bar(
              'Saturated Fat (Limit)',
              satG,
              total,
              'bg-red-400',
              `AHA recommends ≤ 5–6% of daily calories — linked to increased LDL cholesterol`,
              'saturated'
            )}
            {/* Hover detail */}
            {hoverFat === 'saturated' && (
              <div className="mt-2 pt-2 border-t border-red-200 flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-[10px] text-red-700">
                  <p className="font-semibold">Saturated Fat: {satG}g</p>
                  <p className="text-red-600/80 mt-0.5">Primary sources: butter, red meat, coconut oil, full-fat dairy. AHA recommends limiting to 5-6% of total calories for heart health.</p>
                </div>
              </div>
            )}
          </div>

          {/* Monounsaturated bar */}
          <div className={`rounded-xl border p-4 transition-all ${
            hoverFat === 'mono' ? 'border-emerald-300 bg-emerald-50' : 'border-emerald-100 bg-emerald-50/50'
          }`}>
            {bar(
              'Monounsaturated Fat',
              monoMid,
              total,
              'bg-emerald-500',
              `${monoLow}–${monoHigh} g/day · 10–15% of calories · Olive oil, avocado, nuts`,
              'mono'
            )}
            {/* Hover detail */}
            {hoverFat === 'mono' && (
              <div className="mt-2 pt-2 border-t border-emerald-200 flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="text-[10px] text-emerald-700">
                  <p className="font-semibold">Monounsaturated Fat: {monoLow}–{monoHigh}g/day</p>
                  <p className="text-emerald-600/80 mt-0.5">Heart-healthy fats found in olive oil, avocados, and nuts. Linked to improved cholesterol levels and reduced inflammation.</p>
                </div>
              </div>
            )}
          </div>

          {/* Polyunsaturated bar */}
          <div className={`rounded-xl border p-4 transition-all ${
            hoverFat === 'poly' ? 'border-blue-300 bg-blue-50' : 'border-blue-100 bg-blue-50/50'
          }`}>
            {bar(
              'Polyunsaturated Fat',
              polyMid,
              total,
              'bg-blue-500',
              `${polyLow}–${polyHigh} g/day · 5–10% of calories · Fish, flaxseed, walnuts`,
              'poly'
            )}
            {/* Hover detail */}
            {hoverFat === 'poly' && (
              <div className="mt-2 pt-2 border-t border-blue-200 flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-[10px] text-blue-700">
                  <p className="font-semibold">Polyunsaturated Fat: {polyLow}–{polyHigh}g/day</p>
                  <p className="text-blue-600/80 mt-0.5">Includes essential omega-3 and omega-6 fatty acids. Found in fatty fish, flaxseed, walnuts, and vegetable oils.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AHA Citation */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">American Heart Association Guideline</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            The AHA recommends limiting saturated fat to <strong>5–6% of total daily calories</strong> and reducing
            trans fat intake. Replacing saturated fat with polyunsaturated and monounsaturated fats — rather than
            with refined carbohydrates — is associated with a significant reduction in cardiovascular risk.
          </p>
          <p className="text-xs text-amber-700 mt-2 italic">
            Source: American Heart Association Dietary Guidelines, Circulation (2021).
          </p>
        </div>

        {/* Eat More / Eat Less */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Eat More (Unsaturated)</p>
            <ul className="text-xs text-emerald-800 space-y-1">
              <li>• Olive oil, avocado oil</li>
              <li>• Avocados</li>
              <li>• Almonds, walnuts, cashews</li>
              <li>• Fatty fish (salmon, mackerel, sardines)</li>
              <li>• Chia seeds, flaxseed</li>
            </ul>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">Limit (Saturated)</p>
            <ul className="text-xs text-red-800 space-y-1">
              <li>• Butter, lard, tallow</li>
              <li>• Coconut oil, palm oil</li>
              <li>• Fatty cuts of red meat</li>
              <li>• Full-fat dairy (cream, cheese)</li>
              <li>• Fried/fast foods</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
