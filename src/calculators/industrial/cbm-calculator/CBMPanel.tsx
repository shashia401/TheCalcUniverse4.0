interface Props {
  /** Pre-formatted CBM headline (same string calculate() returns) */
  cbmText: string;
  /** Weights in kg, straight from computeCbm(): never parsed back out of formatted strings */
  actual: number;
  dim: number;
  chargeable: number;
  containerText: string;
}

export default function CBMPanel({ cbmText, actual, dim, chargeable, containerText }: Props) {
  const maxWeight = Math.max(actual, dim, chargeable);
  const basis =
    chargeable > actual
      ? 'Dimensional weight (volumetric) — cargo is light for its size'
      : 'Actual weight — cargo is heavy for its size';

  const bar = (label: string, val: number, color: string) => {
    const pct = maxWeight > 0 ? (val / maxWeight) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-700 w-28 flex-shrink-0">{label}</span>
        <div
          className="flex-1 h-5 bg-slate-100 rounded overflow-hidden"
          role="img"
          aria-label={`${label}: ${val.toFixed(2)} kg`}
        >
          <div className={`h-full rounded ${color} flex items-center justify-end pr-1.5 min-w-[64px]`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-xs font-bold text-white whitespace-nowrap">{val.toFixed(2)} kg</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">CBM & Weight</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">CBM</p>
          <p className="text-3xl font-bold text-blue-700">{cbmText}</p>
        </div>
        {bar('Actual Weight', actual, 'bg-blue-700')}
        {bar('Dimensional Weight', dim, 'bg-amber-700')}
        {bar('Chargeable Weight', chargeable, 'bg-red-700')}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-600">{basis}</p>
        </div>
        {containerText && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-600">{containerText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
