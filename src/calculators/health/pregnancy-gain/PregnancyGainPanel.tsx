import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const RANGES = [
  { label: 'Underweight', bmiRange: '< 18.5', totalGain: '28–40 lbs', weeklyGain: '1.0–1.3 lbs', color: 'bg-amber-500', detail: 'For women with BMI below 18.5, additional weight gain supports both maternal reserves and fetal development. Close monitoring recommended.' },
  { label: 'Normal Weight', bmiRange: '18.5–24.9', totalGain: '25–35 lbs', weeklyGain: '0.8–1.0 lbs', color: 'bg-emerald-500', detail: 'The standard IOM recommendation for healthy BMI. Most women in this category have uncomplicated pregnancies with appropriate fetal growth.' },
  { label: 'Overweight', bmiRange: '25–29.9', totalGain: '15–25 lbs', weeklyGain: '0.5–0.7 lbs', color: 'bg-orange-500', detail: 'Reduced gain range helps lower risk of gestational diabetes, preeclampsia, and cesarean delivery while still supporting fetal growth.' },
  { label: 'Obese', bmiRange: '≥ 30', totalGain: '11–20 lbs', weeklyGain: '0.4–0.6 lbs', color: 'bg-red-400', detail: 'Lower gain range minimizes pregnancy complications. Individualized medical supervision is strongly recommended for optimal outcomes.' },
];

export default function PregnancyGainPanel({ results }: Props) {
  const bmiCat = results.find(r => r.id === 'bmiCategory');
  const gainStatus = results.find(r => r.id === 'gainStatus');
  const gainSoFar = results.find(r => r.id === 'gainSoFar');

  if (!bmiCat) return null;

  const currentCategory = RANGES.findIndex(r => bmiCat.value.endsWith(r.label));

  const [hoverRow, setHoverRow] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">IOM Weight Gain Guidelines by BMI</span>
      </div>

      <div className="p-5 space-y-5">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pre-Pregnancy BMI</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">BMI Range</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Total Gain (40 wk)</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Weekly (2nd/3rd Tri)</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Your Category</th>
              </tr>
            </thead>
            <tbody>
              {RANGES.map((r, i) => (
                <tr
                  key={r.label}
                  onMouseEnter={() => setHoverRow(i)}
                  onMouseLeave={() => setHoverRow(null)}
                  className={`border-b border-slate-100 last:border-0 cursor-pointer transition-all ${
                    i === currentCategory ? 'bg-blue-50' : hoverRow === i ? 'bg-indigo-50/70' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                      <span className="font-bold text-slate-700">{r.label}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-500">{r.bmiRange}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-700">{r.totalGain}</td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{r.weeklyGain}</td>
                  <td className="px-3 py-2.5 text-center">
                    {i === currentCategory ? (
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold">
                        <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        You
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hover tooltip row detail */}
        {hoverRow !== null && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-indigo-800">{RANGES[hoverRow].label} — IOM Recommendation</p>
              <p className="text-[11px] text-indigo-600 mt-0.5">{RANGES[hoverRow].detail}</p>
              <div className="flex gap-4 mt-1.5">
                <span className="text-[10px] text-indigo-500"><strong>Total:</strong> {RANGES[hoverRow].totalGain}</span>
                <span className="text-[10px] text-indigo-500"><strong>Weekly:</strong> {RANGES[hoverRow].weeklyGain}</span>
                <span className="text-[10px] text-indigo-500"><strong>BMI:</strong> {RANGES[hoverRow].bmiRange}</span>
              </div>
            </div>
          </div>
        )}

        {/* Gain visualization */}
        {gainStatus && gainSoFar && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Your Gain Status</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <span className="text-[11px] text-slate-500">Gain So Far</span>
                <p className="text-sm font-bold text-slate-800">{gainSoFar.value}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500">Status</span>
                <p className={`text-sm font-bold ${
                  gainStatus.value === 'Within Recommended Range' ? 'text-emerald-600'
                  : gainStatus.value === 'Above Recommended Range' ? 'text-red-600'
                  : 'text-amber-600'
                }`}>{gainStatus.value}</p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Medical Disclaimer</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            The IOM weight gain guidelines are clinical recommendations based on pre-pregnancy BMI. Individual variation
            is normal and expected. These guidelines apply to singleton pregnancies in women with healthy pregnancies.
            Always discuss your weight gain goals and progress with your OB/GYN, midwife, or healthcare provider.
            This calculator is for informational purposes only and is not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
