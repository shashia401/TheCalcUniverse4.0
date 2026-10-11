import { CalculatorResult } from '../../../types/calculator';
import { parseIsoDate } from '../../../utils/dates';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// Per-day conception probabilities are only quoted where the source states them. Wilcox, Weinberg &
// Baird (NEJM 1995) report about 10% for intercourse five days before ovulation rising to about 33%
// on ovulation day; the days between are shown as that range rather than as invented single figures.
const probabilityFor = (daysBeforeOv: number): string =>
  daysBeforeOv === 0 ? '~33%' : daysBeforeOv === 5 ? '~10%' : '10–33%';

export default function ConceptionPanel({ results }: Props) {
  // Dates come from index.ts (_window), not from re-parsing the formatted result strings.
  let win: { start: Date; end: Date; ov: Date } | null = null;
  try {
    const raw = results.find(r => r.id === '_window')?.value;
    if (raw) {
      const j = JSON.parse(raw) as { start: string; end: string; ovulation: string };
      const start = parseIsoDate(j.start);
      const end = parseIsoDate(j.end);
      const ov = parseIsoDate(j.ovulation);
      if (start && end && ov) win = { start, end, ov };
    }
  } catch {
    win = null;
  }
  if (!win) return null;
  const { start: startDate, end: endDate, ov: ovDate } = win;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate all fertile window dates
  const dates: { date: Date; label: string; isPeak: boolean; isOvulation: boolean; probability: string; daysBeforeOv: number }[] = [];
  for (const d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const isOv = d.getTime() === ovDate.getTime();
    const daysBeforeOv = Math.round((ovDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    const isPeak = daysBeforeOv >= 0 && daysBeforeOv <= 2;
    dates.push({
      date: new Date(d),
      label: isOv ? 'Ovulation Day' : isPeak ? 'Peak Fertility' : 'Fertile',
      isPeak,
      isOvulation: isOv,
      probability: probabilityFor(daysBeforeOv),
      daysBeforeOv,
    });
  }

  const fmtD = (dt: Date) =>
    dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtLong = (dt: Date) =>
    dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fertile Window Calendar</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Date cards: the detail for each day is always visible (no hover-only content) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {dates.map((item) => {
            const isPast = item.date < today;
            const isToday = item.date.getTime() === today.getTime();
            const detail = item.isOvulation
              ? 'Egg released, viable 12–24 h'
              : item.daysBeforeOv > 0
              ? `${item.daysBeforeOv} day${item.daysBeforeOv > 1 ? 's' : ''} before ovulation`
              : '';
            return (
              <div
                key={item.date.getTime()}
                aria-label={`${fmtLong(item.date)}: ${item.label}, conception chance ${item.probability}${detail ? `, ${detail}` : ''}${isToday ? ', today' : ''}`}
                className={`rounded-xl border text-center p-3 ${
                  isToday
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                    : item.isOvulation
                    ? 'border-emerald-300 bg-emerald-50'
                    : item.isPeak
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : isPast
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-[10px] font-bold text-slate-600 uppercase">{fmtD(item.date)}</p>
                <p className={`text-xs font-bold mt-1 ${
                  item.isOvulation ? 'text-emerald-800' : item.isPeak ? 'text-emerald-700' : 'text-slate-600'
                }`}>
                  {isToday ? 'Today' : item.label}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">{item.probability}</p>
                {detail && <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">{detail}</p>}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-700" />
            <span>Ovulation day (~33% per day)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-200" />
            <span>Peak: 2 days before ovulation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white border border-slate-300" />
            <span>Earlier fertile days (from ~10%)</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-600">
          Chances are the probability of conception from intercourse on that day in Wilcox, Weinberg &amp; Baird (NEJM, 1995); the days between the two quoted figures are shown as a range.
        </p>

        {/* Key Facts */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Key Facts</p>
          <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-blue-700 mt-0.5">•</span>
              <span><strong>Sperm survival:</strong> Up to 5 days in fertile-quality cervical mucus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700 mt-0.5">•</span>
              <span><strong>Egg viability:</strong> 12–24 hours after ovulation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700 mt-0.5">•</span>
              <span><strong>Best timing:</strong> The 2 days before ovulation and ovulation day itself</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700 mt-0.5">•</span>
              <span><strong>Each cycle:</strong> Even with well-timed intercourse, the chance of conceiving in one cycle is roughly 20–30% for healthy couples</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700 mt-0.5">•</span>
              <span><strong>Implantation:</strong> 6–12 days after ovulation — earliest positive pregnancy test possible</span>
            </li>
          </ul>
        </div>

        {/* Medical Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Medical Disclaimer</p>
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
