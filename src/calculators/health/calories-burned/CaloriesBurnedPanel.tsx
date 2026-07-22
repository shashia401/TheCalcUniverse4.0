import { CalculatorResult } from '../../../types/calculator';
import { ACTIVITIES } from './activities';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function CaloriesBurnedPanel({ results }: Props) {
  const calsResult = results.find(r => r.id === 'caloriesBurned');
  const metResult = results.find(r => r.id === 'metValue');
  const activityLabel = results.find(r => r.id === 'activityLabel');
  const formulaLine = results.find(r => r.id === 'formulaLine');

  if (!calsResult || !metResult || !activityLabel) return null;

  // Find similar activities for comparison
  const currentActivity = ACTIVITIES.flatMap(c => c.items).find(a => a.label === activityLabel.value);

  // Show other activities in the same category
  const sameCategory = ACTIVITIES.find(cat =>
    cat.items.some(a => a.label === activityLabel.value),
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Calorie Burn Reference</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Formula display */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">MET Formula</p>
          <div className="font-mono text-xs text-slate-700 space-y-0.5">
            <p>Calories = MET × Weight (kg) × Time (hours)</p>
            {formulaLine && <p className="text-slate-500">{formulaLine.value}</p>}
            <p className="text-slate-500 text-[10px] pt-1">
              Source: 2011 Compendium of Physical Activities (Arizona State University / NCI)
            </p>
          </div>
        </div>

        {/* Similar activities comparison */}
        {sameCategory && (
          <details className="group rounded-xl border border-slate-200 overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">
              <span>Compare: {sameCategory.category}</span>
              <svg aria-hidden="true" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="border-t border-slate-100">
              {sameCategory.items.map((item) => {
                const cals = (item.met * 70 * 0.5).toFixed(0); // 70kg for 30min
                const isCurrent = item.id === currentActivity?.id;
                return (
                  <div key={item.id} className={`flex items-center justify-between px-5 py-2 border-b border-slate-100 last:border-0 ${isCurrent ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      <span className={`text-xs ${isCurrent ? 'font-bold text-blue-700' : 'text-slate-600'}`}>{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-500'}`}>
                        {item.met.toFixed(1)} MET
                      </span>
                      <span className="text-[10px] text-slate-500 ml-2">~{cals} kcal/30min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* Source attribution */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Important Note</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Calorie burn estimates from MET values are population averages and may vary by ±15–20% for individuals.
            Actual burn depends on fitness level, body composition, exercise efficiency, temperature, terrain,
            and other factors. MET values are from the 2011 Compendium of Physical Activities
            (Ainsworth et al., Medicine &amp; Science in Sports &amp; Exercise). For the most accurate individual calorie
            estimates, use a heart rate monitor or power meter.
          </p>
        </div>
      </div>
    </div>
  );
}
