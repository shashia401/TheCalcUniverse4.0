import { CalculatorResult } from '../../../types/calculator';
import { FT_PER_M, dofInfo } from './dofMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function DepthOfFieldPanel({ values, results }: Props) {
  const hyperfocal = results.find((r) => r.id === 'hyperfocalDistance');
  const nearLimit = results.find((r) => r.id === 'nearLimit');
  const farLimit = results.find((r) => r.id === 'farLimit');
  const totalDOF = results.find((r) => r.id === 'totalDOF');
  // Same pure function index.ts uses: positions are drawn to scale from the numbers, not from result strings.
  const d = dofInfo(values);

  if (!hyperfocal || !nearLimit || !d || d.tooClose) return null;

  const isInfinite = d.far === null;
  // Linear scale 0 .. axisMax metres; an infinite far limit runs off the right edge.
  const axisMax = (isInfinite ? d.distance * 2 : (d.far as number)) * 1.15;
  const pct = (m: number) => Math.min(Math.max((m / axisMax) * 100, 0), 100);
  const left = pct(d.near);
  const right = isInfinite ? 100 : pct(d.far as number);
  const unitLabel = d.unit === 'feet' ? 'ft' : 'm';
  const scale = d.unit === 'feet' ? FT_PER_M : 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Focus Range</span>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <div
            role="img"
            aria-label={`Zone of acceptable sharpness from ${(d.near * scale).toFixed(1)} ${unitLabel} to ${isInfinite ? 'infinity' : `${((d.far as number) * scale).toFixed(1)} ${unitLabel}`}, focused at ${(d.distance * scale).toFixed(1)} ${unitLabel}`}
            className="relative h-16 bg-slate-100 rounded-lg overflow-hidden"
          >
            <div
              className="absolute inset-y-0 bg-blue-200 border-l-2 border-blue-700"
              style={{ left: `${left}%`, width: `${Math.max(right - left, 0.5)}%`, borderRightWidth: isInfinite ? 0 : 2, borderRightStyle: 'solid', borderRightColor: '#1d4ed8' }}
            />
            <div className="absolute inset-y-0 w-0.5 bg-emerald-700" style={{ left: `${pct(d.distance)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-slate-600 mt-1">
            <span>0</span>
            <span>Focus at {(d.distance * scale).toFixed(1)} {unitLabel} (green line)</span>
            <span>{isInfinite ? 'to infinity' : `${(axisMax * scale).toFixed(0)} ${unitLabel}`}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[10px] font-bold text-amber-700 uppercase">Near Limit</p>
            <p className="text-sm font-bold font-mono text-amber-800">{nearLimit.value}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[10px] font-bold text-amber-700 uppercase">Far Limit</p>
            <p className="text-sm font-bold font-mono text-amber-800">{farLimit?.value || 'Infinity'}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Hyperfocal</p>
            <p className="text-sm font-bold font-mono text-blue-800">{hyperfocal.value}</p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
            <p className="text-[10px] font-bold text-purple-700 uppercase">Total DOF</p>
            <p className="text-sm font-bold font-mono text-purple-800">{totalDOF?.value || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
