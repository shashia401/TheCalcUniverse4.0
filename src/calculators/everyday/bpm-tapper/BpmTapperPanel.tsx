import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const noteColors = ['bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-purple-400', 'bg-rose-400', 'bg-cyan-400', 'bg-orange-400', 'bg-pink-400'];
const noteLabels = ['Whole', 'Half', 'Quarter', 'Eighth', '16th', 'Dotted 1/4', 'Dotted 1/8', 'Triplet 1/4'];

export default function BpmTapperPanel({ values, results }: Props) {
  const delayRow = results.find(r => r.id === 'delayMs');
  const bpm = parseFloat(values.bpm);
  const mode = values.mode || 'bpm-to-ms';

  if (mode !== 'bpm-to-ms' || !bpm || !delayRow) return null;

  const noteResults = noteLabels.map((label, i) => {
    const id = ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'dotted-quarter', 'dotted-eighth', 'quarter-triplet'][i];
    const row = results.find(r => r.id === `note-${id}`);
    return { label, value: row?.value || '', idx: i };
  });

  const maxMs = Math.max(...noteResults.filter(n => n.value).map(n => parseFloat(n.value) || 0), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Note Delay Grid — {bpm} BPM</span>
      </div>
      <div className="p-5 space-y-2">
        {noteResults.map((note, i) => {
          const msVal = parseFloat(note.value) || 0;
          const pct = maxMs > 0 ? (msVal / maxMs) * 100 : 0;
          return (
            <div key={note.idx} className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-500 w-20 flex-shrink-0">{note.label}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                <div className={`h-full rounded ${noteColors[i % noteColors.length]} transition-all flex items-center justify-end pr-1`} style={{ width: `${Math.max(pct, 2)}%` }}>
                  <span className="text-[9px] font-bold text-white drop-shadow-sm">{note.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
