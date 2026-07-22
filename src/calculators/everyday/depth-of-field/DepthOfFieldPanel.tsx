import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function DepthOfFieldPanel({ results }: Props) {
  const hyperfocal = results.find(r => r.id === 'hyperfocalDistance');
  const nearLimit = results.find(r => r.id === 'nearLimit');
  const farLimit = results.find(r => r.id === 'farLimit');
  const totalDOF = results.find(r => r.id === 'totalDOF');

  if (!hyperfocal || !nearLimit) return null;

  const isInfinite = farLimit?.value?.includes('Infinite');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Focus Range</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Focus range visualization */}
        <div className="relative h-16 bg-slate-100 rounded-lg overflow-hidden">
          {/* Near-Far zone */}
          {!isInfinite && (
            <div
              className="absolute inset-y-0 bg-blue-200/60 border-l-2 border-r-2 border-blue-500"
              style={{ left: '15%', right: '15%' }}
            />
          )}
          {isInfinite && (
            <div
              className="absolute inset-y-0 bg-blue-200/60 border-l-2 border-blue-500"
              style={{ left: '15%', right: '0' }}
            />
          )}
          {/* Focus point */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full shadow" />
          {/* Labels */}
          <div className="absolute bottom-1 left-2 text-[9px] font-semibold text-slate-600">Near</div>
          <div className="absolute bottom-1 right-2 text-[9px] font-semibold text-slate-600">{isInfinite ? 'Infinity' : 'Far'}</div>
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-600">Focus</div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[9px] font-bold text-amber-500 uppercase">Near Limit</p>
            <p className="text-sm font-bold font-mono text-amber-700">{nearLimit.value}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[9px] font-bold text-amber-500 uppercase">Far Limit</p>
            <p className="text-sm font-bold font-mono text-amber-700">{farLimit?.value || 'Infinity'}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <p className="text-[9px] font-bold text-blue-500 uppercase">Hyperfocal</p>
            <p className="text-sm font-bold font-mono text-blue-700">{hyperfocal.value}</p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
            <p className="text-[9px] font-bold text-purple-500 uppercase">Total DOF</p>
            <p className="text-sm font-bold font-mono text-purple-700">{totalDOF?.value || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
