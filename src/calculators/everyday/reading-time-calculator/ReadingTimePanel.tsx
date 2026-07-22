import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.-]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function ReadingTimePanel({ results }: Props) {
  const readingTime = results.find(r => r.id === 'readingTime');
  const totalWords = results.find(r => r.id === 'totalWords');
  const readingSpeed = results.find(r => r.id === 'readingSpeed');
  const estimatedPages = results.find(r => r.id === 'estimatedPages');
  const breakDetails = results.find(r => r.id === 'breakDetails');

  if (!readingTime) return null;

  const wordCount = totalWords ? parseNum(totalWords.value) : 0;
  const wpm = readingSpeed ? parseNum(readingSpeed.value) : 200;
  const pages = estimatedPages ? parseNum(estimatedPages.value) : 0;

  // Calculate time for different speeds
  const slowTime = wordCount > 0 && wpm > 0 ? (wordCount / 150) : 0;
  const avgTime = wordCount > 0 && wpm > 0 ? (wordCount / wpm) : 0;
  const fastTime = wordCount > 0 && wpm > 0 ? (wordCount / 250) : 0;
  const skimTime = wordCount > 0 && wpm > 0 ? (wordCount / 400) : 0;

  const maxTime = Math.max(slowTime, avgTime, fastTime, skimTime, 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Reading Time</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Main result */}
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-0.5">Estimated Reading Time</p>
          <p className="text-xl font-bold text-indigo-600">{readingTime.value}</p>
        </div>

        {/* Speed comparison bars */}
        {wordCount > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Speed Comparison ({wordCount.toLocaleString()} words)</p>
            <SpeedBar label="Slow (150 wpm)" minutes={slowTime} max={maxTime} color="bg-orange-400" />
            <SpeedBar label={`Selected (${wpm} wpm)`} minutes={avgTime} max={maxTime} color="bg-blue-500" />
            <SpeedBar label="Fast (250 wpm)" minutes={fastTime} max={maxTime} color="bg-emerald-400" />
            <SpeedBar label="Skimming (400 wpm)" minutes={skimTime} max={maxTime} color="bg-purple-400" />
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-2">
          <InfoCard label="Words" value={totalWords?.value ?? '-'} />
          <InfoCard label="Speed" value={readingSpeed?.value ?? '-'} />
          <InfoCard label="Pages" value={estimatedPages?.value ?? '-'} />
        </div>

        {/* Break info */}
        {breakDetails && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center">
            <p className="text-[10px] text-amber-600 uppercase tracking-wide font-semibold">Breaks</p>
            <p className="text-sm font-bold text-amber-700 mt-0.5">{breakDetails.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SpeedBar({ label, minutes, max, color }: { label: string; minutes: number; max: number; color: string }) {
  const w = max > 0 ? (minutes / max) * 100 : 0;
  const fmtMin = minutes < 1 ? '< 1' : minutes.toFixed(1);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 w-[105px] flex-shrink-0 text-right">{label}</span>
      <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
        <div className={`h-full rounded ${color}`} style={{ width: `${Math.max(w, 2)}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-600 w-10 text-right">{fmtMin} min</span>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-sm font-bold text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}
