import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function OverweightPanel({ results }: Props) {
  const bmiResult = results.find(r => r.id === 'bmiScore');
  const whtrResult = results.find(r => r.id === 'whtr');
  const riskResult = results.find(r => r.id === 'combinedRisk');

  if (!bmiResult || !whtrResult || !riskResult) return null;

  const bmi = parseFloat(bmiResult.value) || 0;
  const whtr = parseFloat(whtrResult.value) || 0;

  // Color by metric
  const bmiColor = bmi < 25 ? 'emerald' : bmi < 30 ? 'amber' : 'red';
  const whtrColor = whtr < 0.5 ? 'emerald' : whtr < 0.6 ? 'amber' : 'red';

  const [hoverCard, setHoverCard] = useState<string | null>(null);

  const bmiCategory = bmiColor === 'emerald' ? 'Normal Range' : bmiColor === 'amber' ? 'Overweight' : 'Obese';
  const whtrCategory = whtrColor === 'emerald' ? 'Healthy' : whtrColor === 'amber' ? 'Increased Risk' : 'High Risk';

  const bmiDetail = {
    emerald: 'A BMI in the normal range (18.5–24.9) is associated with the lowest risk of chronic disease. Maintain your current weight through balanced nutrition and regular physical activity.',
    amber: 'A BMI in the overweight range (25–29.9) indicates excess body weight. Even modest weight loss of 5–10% can significantly improve health markers like blood pressure and insulin sensitivity.',
    red: 'A BMI in the obese range (30+) substantially increases risk for type 2 diabetes, cardiovascular disease, hypertension, and certain cancers. Consultation with a healthcare provider is recommended.',
  };

  const whtrDetail = {
    emerald: 'A WHtR below 0.5 means your waist circumference is less than half your height — the optimal target for metabolic health. This indicates low levels of harmful visceral fat.',
    amber: 'A WHtR between 0.5 and 0.6 indicates increased cardiometabolic risk. Visceral fat accumulation around organs begins to impact metabolic function.',
    red: 'A WHtR above 0.6 indicates high risk. Excess visceral fat significantly raises the risk of metabolic syndrome, type 2 diabetes, and cardiovascular events.',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Health Risk Dashboard</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Side-by-side BMI + WHtR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* BMI Card */}
          <div
            onMouseEnter={() => setHoverCard('bmi')}
            onMouseLeave={() => setHoverCard(null)}
            className={`rounded-xl border-2 p-5 text-center cursor-pointer transition-all ${
              bmiColor === 'emerald' ? 'border-emerald-200 bg-emerald-50' :
              bmiColor === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
            } ${hoverCard === 'bmi' ? 'ring-2 ring-indigo-300' : ''}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">BMI</p>
            <p className={`text-3xl font-bold ${
              bmiColor === 'emerald' ? 'text-emerald-700' :
              bmiColor === 'amber' ? 'text-amber-700' : 'text-red-700'
            }`}>{bmi.toFixed(1)}</p>
            <p className={`text-xs font-semibold mt-1 ${
              bmiColor === 'emerald' ? 'text-emerald-600' :
              bmiColor === 'amber' ? 'text-amber-600' : 'text-red-600'
            }`}>Body Mass Index</p>
            <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              bmiColor === 'emerald' ? 'bg-emerald-200 text-emerald-800' :
              bmiColor === 'amber' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
            }`}>{bmiCategory}</span>
            <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${
                bmiColor === 'emerald' ? 'bg-emerald-400' :
                bmiColor === 'amber' ? 'bg-amber-400' : 'bg-red-400'
              }`} style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              BMI categories: Underweight &lt;18.5 · Normal 18.5–24.9 · Overweight 25–29.9 · Obese 30+
            </p>

            {/* Hover tooltip */}
            {hoverCard === 'bmi' && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 text-left">
                <div className="flex items-start gap-1.5">
                  <svg className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                    bmiColor === 'emerald' ? 'text-emerald-500' :
                    bmiColor === 'amber' ? 'text-amber-500' : 'text-red-500'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={`text-[10px] leading-relaxed ${
                    bmiColor === 'emerald' ? 'text-emerald-700' :
                    bmiColor === 'amber' ? 'text-amber-700' : 'text-red-700'
                  }`}>{bmiDetail[bmiColor]}</p>
                </div>
              </div>
            )}
          </div>

          {/* WHtR Card */}
          <div
            onMouseEnter={() => setHoverCard('whtr')}
            onMouseLeave={() => setHoverCard(null)}
            className={`rounded-xl border-2 p-5 text-center cursor-pointer transition-all ${
              whtrColor === 'emerald' ? 'border-emerald-200 bg-emerald-50' :
              whtrColor === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
            } ${hoverCard === 'whtr' ? 'ring-2 ring-indigo-300' : ''}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">WHtR</p>
            <p className={`text-3xl font-bold ${
              whtrColor === 'emerald' ? 'text-emerald-700' :
              whtrColor === 'amber' ? 'text-amber-700' : 'text-red-700'
            }`}>{whtr.toFixed(3)}</p>
            <p className={`text-xs font-semibold mt-1 ${
              whtrColor === 'emerald' ? 'text-emerald-600' :
              whtrColor === 'amber' ? 'text-amber-600' : 'text-red-600'
            }`}>Waist-to-Height Ratio</p>
            <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              whtrColor === 'emerald' ? 'bg-emerald-200 text-emerald-800' :
              whtrColor === 'amber' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
            }`}>{whtrCategory}</span>
            <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${
                whtrColor === 'emerald' ? 'bg-emerald-400' :
                whtrColor === 'amber' ? 'bg-amber-400' : 'bg-red-400'
              }`} style={{ width: `${Math.min((whtr / 0.7) * 100, 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              WHtR target: keep your waist less than half your height (&lt;0.5)
            </p>

            {/* Hover tooltip */}
            {hoverCard === 'whtr' && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 text-left">
                <div className="flex items-start gap-1.5">
                  <svg className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                    whtrColor === 'emerald' ? 'text-emerald-500' :
                    whtrColor === 'amber' ? 'text-amber-500' : 'text-red-500'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={`text-[10px] leading-relaxed ${
                    whtrColor === 'emerald' ? 'text-emerald-700' :
                    whtrColor === 'amber' ? 'text-amber-700' : 'text-red-700'
                  }`}>{whtrDetail[whtrColor]}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Risk Narrative */}
        {riskResult && (
          <div className={`rounded-xl border px-5 py-4 ${
            riskResult.color === 'positive' ? 'border-emerald-200 bg-emerald-50' :
            riskResult.color === 'negative' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
          }`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
              riskResult.color === 'positive' ? 'text-emerald-600' :
              riskResult.color === 'negative' ? 'text-red-600' : 'text-amber-600'
            }`}>Combined Risk Assessment</p>
            <p className={`text-xs leading-relaxed ${
              riskResult.color === 'positive' ? 'text-emerald-800' :
              riskResult.color === 'negative' ? 'text-red-800' : 'text-amber-800'
            }`}>{riskResult.value}</p>
          </div>
        )}

        {/* Visceral Fat Explanation */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Why Fat Distribution Matters</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Subcutaneous Fat</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Stored under the skin (pinchable). Produces beneficial hormones like leptin and adiponectin.
                Less metabolically harmful — primarily an energy reserve.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-red-700 mb-1">Visceral Fat</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Stored around internal organs (liver, pancreas). Secretes inflammatory cytokines,
                free fatty acids, and hormones that promote insulin resistance, inflammation,
                and cardiovascular disease. WHtR captures this risk.
              </p>
            </div>
          </div>
        </div>

        {/* Actionable Steps */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Steps to Reduce Cardiovascular Risk</p>
          <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside leading-relaxed">
            <li><strong>Reduce waist circumference</strong> — even 2–4 cm reduction significantly lowers visceral fat and metabolic risk</li>
            <li><strong>Aim for 150+ min/week of moderate aerobic activity</strong> — brisk walking, cycling, swimming specifically target visceral fat</li>
            <li><strong>Prioritize protein and fibre</strong> — increases satiety, preserves lean mass during weight loss, and improves metabolic health</li>
            <li><strong>Limit added sugar and refined carbs</strong> — these specifically promote visceral fat storage via insulin-driven lipogenesis</li>
            <li><strong>Get 7–9 hours of quality sleep</strong> — insufficient sleep elevates cortisol, which drives visceral fat accumulation</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
