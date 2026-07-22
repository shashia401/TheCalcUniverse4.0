import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ConceptionPanel({ results }: Props) {
  const fertileWindow = results.find(r => r.id === 'fertileWindow');
  const peakFertility = results.find(r => r.id === 'peakFertility');
  const ovulationDate = results.find(r => r.id === 'ovulationDate');

  if (!fertileWindow || !peakFertility || !ovulationDate) return null;

  // Parse dates from result values
  const parseDateFromStr = (s: string): Date | null => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Extract the date range from "Monday, January 1, 2026 → Saturday, January 6, 2026"
  const parts = fertileWindow.value.split('→');
  const startDate = parseDateFromStr(parts[0]?.trim() ?? '');
  const endDate = parseDateFromStr(parts[1]?.trim() ?? '');

  // Extract ovulation date
  const ovDate = parseDateFromStr(ovulationDate.value);
  if (!startDate || !endDate || !ovDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate all fertile window dates
  const dates: { date: Date; label: string; isPeak: boolean; isOvulation: boolean; probability: string; daysBeforeOv: number }[] = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    const isOv = d.getTime() === ovDate.getTime();
    const daysBeforeOv = Math.round((ovDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    const isPeak = daysBeforeOv >= 0 && daysBeforeOv <= 2;

    let prob: string;
    if (daysBeforeOv === 0) prob = '~12%';
    else if (daysBeforeOv === 1) prob = '~24%';
    else if (daysBeforeOv === 2) prob = '~20%';
    else if (daysBeforeOv === 3) prob = '~16%';
    else prob = '~4–11%';

    dates.push({
      date: new Date(d),
      label: isOv ? 'Ovulation Day' : isPeak ? 'Peak Fertility' : 'Fertile',
      isPeak,
      isOvulation: isOv,
      probability: prob,
      daysBeforeOv,
    });
    d.setDate(d.getDate() + 1);
  }

  const fmtD = (dt: Date) =>
    dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fertile Window Calendar</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Date cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {dates.map((item, i) => {
            const isPast = item.date < today;
            const isToday = item.date.getTime() === today.getTime();
            const isHovered = hoverIdx === i;

            return (
              <div
                key={`item-${i}`}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                className={`rounded-xl border text-center p-3 transition-all cursor-pointer ${
                  isToday
                    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
                    : item.isOvulation
                    ? 'border-emerald-300 bg-emerald-50'
                    : item.isPeak
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : isPast
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : 'border-slate-200 bg-white'
                } ${isHovered ? 'ring-2 ring-indigo-300' : ''}`}
              >
                <p className="text-[10px] font-bold text-slate-500 uppercase">{fmtD(item.date)}</p>
                <p className={`text-xs font-bold mt-1 ${
                  item.isOvulation ? 'text-emerald-700' : item.isPeak ? 'text-emerald-600' : 'text-slate-500'
                }`}>
                  {isToday ? 'Today' : item.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.probability}</p>

                {/* Hover tooltip */}
                {isHovered && (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <svg className="w-3 h-3 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{item.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {item.isOvulation && (
                      <div className="flex items-center gap-1 text-[9px] text-emerald-600">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Egg released, viable for 12–24 hours</span>
                      </div>
                    )}
                    {item.isPeak && item.daysBeforeOv > 0 && (
                      <div className="flex items-center gap-1 text-[9px] text-emerald-600">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>{item.daysBeforeOv} day{item.daysBeforeOv > 1 ? 's' : ''} before ovulation — optimal timing</span>
                      </div>
                    )}
                    {item.daysBeforeOv < 0 && (
                      <div className="flex items-center gap-1 text-[9px] text-slate-400">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{Math.abs(item.daysBeforeOv)} day{Math.abs(item.daysBeforeOv) > 1 ? 's' : ''} after ovulation</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span>Ovulation Day (12% chance)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-200" />
            <span>Peak Fertility (20–24% chance)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white border border-slate-300" />
            <span>Fertile (4–16% chance)</span>
          </div>
        </div>

        {/* Key Facts */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Key Facts</p>
          <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span><strong>Sperm survival:</strong> Up to 5 days in fertile-quality cervical mucus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span><strong>Egg viability:</strong> 12–24 hours after ovulation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span><strong>Best timing:</strong> Intercourse 1–2 days before ovulation for highest probability</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span><strong>Each cycle:</strong> Even with perfect timing, maximum conception rate is ~30% per cycle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span><strong>Implantation:</strong> 6–12 days after ovulation — earliest positive pregnancy test possible</span>
            </li>
          </ul>
        </div>

        {/* Medical Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Medical Disclaimer</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            This calculator provides estimates based on average cycle data and may not be accurate for individuals
            with irregular cycles, PCOS, thyroid disorders, or other fertility-affecting conditions. Calendar-based
            methods are less reliable than ovulation predictor kits, basal body temperature tracking, or fertility
            monitoring. If you have been trying to conceive for 12+ months (or 6+ months if 35+), consult a
            reproductive endocrinologist or fertility specialist. This tool is for informational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
