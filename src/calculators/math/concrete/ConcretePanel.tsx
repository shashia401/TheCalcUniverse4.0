import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

/** Map of shape values to display labels for formula hints. */
const SHAPE_FORMULA_LABELS: Record<string, string> = {
  slab: 'V = L × W × D',
  hole: 'V = πr²h',
  column: 'V = πr²h',
  stairs: 'V ≈ L × W × R × N / 2',
};

export default function ConcretePanel({ values, results }: Props) {
  const cubicYards = results.find((r) => r.id === 'cubicYards');
  const cubicFeet = results.find((r) => r.id === 'cubicFeet');
  const bags60lb = results.find((r) => r.id === 'bags60lb');
  const bags80lb = results.find((r) => r.id === 'bags80lb');
  const weightEstimate = results.find((r) => r.id === 'weightEstimate');
  const wastageApplied = results.find((r) => r.id === 'wastageApplied');
  const shape = results.find((r) => r.id === 'shape');

  if (!cubicYards || !bags60lb || !bags80lb) return null;

  const shapeKey = values.shape || 'slab';
  const formulaLabel = SHAPE_FORMULA_LABELS[shapeKey] || '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Concrete Estimation
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Volume Card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{cubicYards.label}</p>
          <p className="text-4xl font-bold text-blue-700">
            {cubicYards.value}
          </p>
          {cubicFeet && (
            <p className="text-sm text-slate-500 mt-1">{cubicFeet.value}</p>
          )}
          {shape && (
            <p className="text-xs text-slate-500 mt-2">
              Shape: {shape.value} {formulaLabel ? `(${formulaLabel})` : ''}
            </p>
          )}
        </div>

        {/* Bag Comparison */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Bag Comparison
          </p>
          <div className="grid grid-cols-2 gap-3">
            <BagCard
              label="60-lb Bags"
              count={bags60lb.value}
              coverage="0.45 cu ft each"
              bg="bg-amber-50"
              border="border-amber-200"
              text="text-amber-700"
            />
            <BagCard
              label="80-lb Bags"
              count={bags80lb.value}
              coverage="0.60 cu ft each"
              bg="bg-emerald-50"
              border="border-emerald-200"
              text="text-emerald-700"
            />
          </div>
        </div>

        {/* Home Depot Ready */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Home Depot Ready
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">80-lb bags needed</span>
              <span className="font-bold text-slate-800">{bags80lb.value} bags</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total weight</span>
              <span className="font-bold text-slate-800">{weightEstimate?.value || '0 lbs'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Pallet estimate</span>
              <span className="font-bold text-slate-800">
                {bags80lb.value ? `${Math.ceil((parseInt(bags80lb.value, 10) || 0) / 42)} pallet${Math.ceil((parseInt(bags80lb.value, 10) || 0) / 42) !== 1 ? 's' : ''} (42 bags/pallet)` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-600">Waste allowance</span>
              <span className="font-bold text-slate-800">{wastageApplied?.value || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Quick Reference
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">1 cu yd</p>
              <p className="text-slate-500">= 27 cu ft</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">80lb bag</p>
              <p className="text-slate-500">~0.6 cu ft</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">60lb bag</p>
              <p className="text-slate-500">~0.45 cu ft</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component ──────────────────────────────────────────────────────────────

function BagCard({
  label,
  count,
  coverage,
  bg,
  border,
  text,
}: {
  label: string;
  count: string;
  coverage: string;
  bg: string;
  border: string;
  text: string;
}) {
  return (
    <div className={`rounded-lg border ${border} ${bg} p-4 text-center`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${text}`}>{count}</p>
      <p className="text-[11px] text-slate-500 mt-1">{coverage}</p>
    </div>
  );
}
