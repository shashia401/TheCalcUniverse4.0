import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { NOTES, delayMs } from './bpmMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const noteColors = ['bg-blue-700', 'bg-emerald-700', 'bg-amber-700', 'bg-purple-700', 'bg-rose-700', 'bg-cyan-700', 'bg-orange-700', 'bg-pink-700'];

export default function BpmTapperPanel({ values, results }: Props) {
  const bpm = parseFloat(values.bpm);
  const mode = values.mode || 'bpm-to-ms';

  if (mode !== 'bpm-to-ms' || !(bpm > 0) || !results.some((r) => r.id === 'delayMs')) return null;

  // Same table + formula as index.ts (bpmMath), not the formatted result strings.
  const noteResults = NOTES.map((n) => ({ ...n, ms: delayMs(bpm, n.factor) }));
  const maxMs = Math.max(...noteResults.map((n) => n.ms), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Note Delay Grid — {bpm} BPM</span>
      </div>
      <div className="p-5 space-y-1">
        {noteResults.map((note, i) => (
          <HBarRow
            key={note.id}
            label={note.short}
            value={note.ms}
            max={maxMs}
            display={`${note.ms.toFixed(2)} ms`}
            color={noteColors[i % noteColors.length]}
            labelWidth="w-24"
            height="h-5"
            className="py-0.5"
          />
        ))}
      </div>
    </div>
  );
}
