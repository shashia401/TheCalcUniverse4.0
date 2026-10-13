import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { CONTENT_MULTIPLIERS, readingInfo, readingMinutesFor } from './readingMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const SPEEDS = [
  { label: 'Slow (150 wpm)', wpm: 150, color: 'bg-orange-700' },
  { label: 'Average (238 wpm)', wpm: 238, color: 'bg-blue-700' },
  { label: 'Fast (300 wpm)', wpm: 300, color: 'bg-emerald-700' },
  { label: 'Skimming (400 wpm)', wpm: 400, color: 'bg-purple-700' },
];

export default function ReadingTimePanel({ values, results }: Props) {
  const readingTime = results.find((r) => r.id === 'readingTime');
  const breakDetails = results.find((r) => r.id === 'breakDetails');
  // Same pure maths as index.ts, including the content multiplier and breaks (the old bars ignored both).
  const info = readingInfo(values);
  if (!readingTime || !info) return null;

  const rows = [
    { label: `Selected (${info.wpm} wpm)`, wpm: info.wpm, color: 'bg-indigo-700' },
    ...SPEEDS.filter((s) => s.wpm !== info.wpm),
  ].map((s) => ({ ...s, minutes: readingMinutesFor(info.wordCount, s.wpm, CONTENT_MULTIPLIERS[info.contentType], values.includePauses || 'none').totalMinutes }));
  const max = Math.max(...rows.map((r) => r.minutes), 1);
  const fmt = (m: number) => (m < 1 ? '< 1 min' : m < 120 ? `${m.toFixed(1)} min` : `${(m / 60).toFixed(1)} h`);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Reading Time</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-0.5">Estimated Reading Time</p>
          <p className="text-xl font-bold text-indigo-700">{readingTime.value}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold mb-1">Speed Comparison ({info.wordCount.toLocaleString('en-US')} words)</p>
          {rows.map((r) => (
            <HBarRow key={r.label} label={r.label} value={r.minutes} max={max} display={fmt(r.minutes)} color={r.color} labelWidth="w-36" height="h-5" className="py-0.5" />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <InfoCard label="Words" value={info.wordCount.toLocaleString('en-US')} />
          <InfoCard label="Speed" value={`${info.wpm} wpm`} />
          <InfoCard label="Pages" value={info.pages.toLocaleString('en-US')} />
        </div>

        {breakDetails && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center">
            <p className="text-[10px] text-amber-700 uppercase tracking-wide font-semibold">Breaks</p>
            <p className="text-sm font-bold text-amber-800 mt-0.5">{breakDetails.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
      <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-sm font-bold text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}
