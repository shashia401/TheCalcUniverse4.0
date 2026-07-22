import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function GFRPanel({ results }: Props) {
  const egfrResult = results.find(r => r.id === 'egfr');
  const stageResult = results.find(r => r.id === 'ckdStage');

  if (!egfrResult || !stageResult) return null;

  const egfrVal = parseFloat(egfrResult.value);

  // CKD stage color-coded bar visualization
  const stages = [
    { label: 'Stage 1', range: '≥ 90', min: 90, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', desc: 'Normal kidney function', detail: 'Kidneys function normally with eGFR ≥ 90 mL/min/1.73m². No evidence of kidney damage. Continue routine monitoring and maintain a healthy lifestyle.' },
    { label: 'Stage 2', range: '60–89', min: 60, color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', desc: 'Mildly decreased', detail: 'Mild reduction in kidney function with eGFR 60–89. Often asymptomatic. May show signs of kidney damage (protein in urine). Monitor annually.' },
    { label: 'Stage 3a', range: '45–59', min: 45, color: 'bg-amber-400', textColor: 'text-amber-700', bgColor: 'bg-amber-50', desc: 'Mildly to moderately decreased', detail: 'Moderate reduction in kidney function with eGFR 45–59. Increased risk of complications. Monitor kidney function and manage cardiovascular risk factors.' },
    { label: 'Stage 3b', range: '30–44', min: 30, color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', desc: 'Moderately to severely decreased', detail: 'More significant reduction in kidney function with eGFR 30–44. Higher risk of progression. More frequent monitoring and specialist referral recommended.' },
    { label: 'Stage 4', range: '15–29', min: 15, color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', desc: 'Severely decreased', detail: 'Severe reduction in kidney function with eGFR 15–29. Preparation for renal replacement therapy (dialysis or transplant) should begin. Nephrology referral is essential.' },
    { label: 'Stage 5', range: '< 15', min: 0, color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', desc: 'Kidney failure', detail: 'Kidney failure with eGFR < 15. Renal replacement therapy (dialysis or kidney transplant) is typically needed to sustain life. Urgent nephrology care required.' },
  ];

  const [hoverStage, setHoverStage] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">CKD Stage Reference</span>
      </div>

      <div className="p-5 space-y-5">
        {/* eGFR Gauge */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600">eGFR: {egfrResult.value}</p>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
            {stages.map((s) => {
              const w = s.label === 'Stage 5' ? 15 : s.label === 'Stage 4' ? 15 : s.label === 'Stage 3b' ? 15 : s.label === 'Stage 3a' ? 15 : s.label === 'Stage 2' ? 30 : 20;
              const isActive = s.label === 'Stage 5' ? egfrVal < 15 : egfrVal >= s.min;
              const isHovered = hoverStage === s.label;
              return (
                <div
                  key={s.label}
                  onMouseEnter={() => setHoverStage(s.label)}
                  onMouseLeave={() => setHoverStage(null)}
                  className={`h-full cursor-pointer transition-all ${isActive ? s.color : 'bg-slate-200'} ${isHovered ? 'brightness-110' : ''}`}
                  style={{ width: `${w}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>0</span>
            <span>15</span>
            <span>30</span>
            <span>45</span>
            <span>60</span>
            <span>90</span>
            <span>120+</span>
          </div>

          {/* Hover tooltip for gauge */}
          {hoverStage && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[10px]">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-bold text-indigo-700">
                  {stages.find(s => s.label === hoverStage)?.label}: {stages.find(s => s.label === hoverStage)?.range}
                </span>
              </div>
              <p className="text-indigo-600">{(stages.find(s => s.label === hoverStage))?.detail}</p>
            </div>
          )}
        </div>

        {/* Stage Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Stage</th>
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">eGFR Range</th>
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Description</th>
                <th scope="col" className="text-center px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Your Result</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((s) => {
                const isActive = s.label === 'Stage 5' ? egfrVal < 15 : egfrVal >= s.min;
                const isHovered = hoverStage === s.label;
                return (
                  <tr
                    key={s.label}
                    onMouseEnter={() => setHoverStage(s.label)}
                    onMouseLeave={() => setHoverStage(null)}
                    className={`border-b border-slate-100 cursor-pointer transition-all ${isActive ? s.bgColor : ''} ${isHovered ? 'ring-2 ring-indigo-300' : ''}`}
                  >
                    <td className={`px-4 py-2.5 font-bold ${isActive ? s.textColor : 'text-slate-500'}`}>{s.label}</td>
                    <td className={`px-4 py-2.5 ${isActive ? 'text-slate-700' : 'text-slate-500'}`}>{s.range}</td>
                    <td className={`px-4 py-2.5 ${isActive ? 'text-slate-600' : 'text-slate-500'}`}>{s.desc}</td>
                    <td className="px-4 py-2.5 text-center">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                          <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Current
                        </span>
                      ) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 2021 Update Notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">2021 CKD-EPI Update — Race-Free</p>
          <p className="text-xs text-blue-800 leading-relaxed">
            This calculator uses the 2021 CKD-EPI creatinine equation, which removed the race coefficient
            that was present in earlier versions. The NKF and ASN task force recommended this change
            because race-based adjustments perpetuated health disparities. The 2021 equation is now the
            recommended standard for all adults in the United States.
          </p>
        </div>

        {/* Medical Warning Banner */}
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-red-700 mb-1">Clinical Warning — Educational Use Only</p>
              <p className="text-xs text-red-600 leading-relaxed">
                This eGFR estimate is for <strong>educational purposes only</strong>. It does not constitute
                a medical diagnosis. All clinical decisions regarding kidney disease diagnosis, staging, medication
                dosing, or treatment must be made by a licensed healthcare provider using the full clinical
                context including patient history, physical exam, and additional laboratory values. A single
                eGFR value should not be used in isolation for clinical decision-making.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
