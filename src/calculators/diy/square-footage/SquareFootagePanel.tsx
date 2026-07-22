import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function RectangleDiagram() {
  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[200px] mx-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rectangle diagram showing width and length dimensions">
      <rect x="20" y="20" width="160" height="100" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="4" />
      <line x1="20" y1="48" x2="180" y2="48" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 2" />
      <text x="100" y="44" textAnchor="middle" fill="#1e40af" fontSize="11" fontWeight="bold">Width (w)</text>
      <line x1="48" y1="20" x2="48" y2="120" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 2" />
      <text x="52" y="72" textAnchor="start" fill="#1e40af" fontSize="11" fontWeight="bold" transform="rotate(-90,52,72)">Length (l)</text>
    </svg>
  );
}

function CircleDiagram() {
  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[200px] mx-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Circle diagram showing radius">
      <circle cx="100" cy="70" r="55" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <line x1="100" y1="70" x2="155" y2="70" stroke="#ef4444" strokeWidth="2" />
      <circle cx="100" cy="70" r="3" fill="#ef4444" />
      <text x="128" y="66" textAnchor="start" fill="#dc2626" fontSize="11" fontWeight="bold">r</text>
      <line x1="45" y1="70" x2="100" y2="70" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 2" />
      <text x="72" y="88" textAnchor="middle" fill="#1e40af" fontSize="10">Radius</text>
    </svg>
  );
}

function LShapeDiagram() {
  return (
    <svg viewBox="0 0 220 160" className="w-full max-w-[220px] mx-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="L-shaped diagram showing width and length dimensions for both sections">
      {/* Vertical rectangle */}
      <rect x="20" y="15" width="70" height="130" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="3" />
      {/* Horizontal rectangle */}
      <rect x="20" y="95" width="180" height="50" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2" rx="3" />
      {/* Separator dashed line */}
      <line x1="90" y1="95" x2="90" y2="145" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="5 3" />
      <line x1="20" y1="95" x2="200" y2="95" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="5 3" />
      {/* Labels */}
      <text x="55" y="82" textAnchor="middle" fill="#1e40af" fontSize="10" fontWeight="bold">l₁</text>
      <text x="98" y="132" textAnchor="start" fill="#1e40af" fontSize="10" fontWeight="bold">l₂</text>
      <text x="14" y="132" textAnchor="end" fill="#1e40af" fontSize="10" fontWeight="bold">w₁</text>
      <text x="168" y="145" textAnchor="middle" fill="#1e40af" fontSize="10" fontWeight="bold">w₂</text>
      {/* Dimension arrows for w1, w1, l1, l2 */}
      <text x="55" y="14" textAnchor="middle" fill="#1e40af" fontSize="9">Width 1</text>
      <text x="168" y="94" textAnchor="middle" fill="#1e40af" fontSize="9">Width 2</text>
      <text x="7" y="80" textAnchor="middle" fill="#1e40af" fontSize="9" transform="rotate(-90,7,80)">Length 1</text>
      <text x="210" y="120" textAnchor="middle" fill="#1e40af" fontSize="9">Length 2</text>
    </svg>
  );
}

export default function SquareFootagePanel({ values, results }: Props) {
  const sqftRow = results.find(r => r.id === 'sqft');
  const sqmRow = results.find(r => r.id === 'sqm');
  const withWasteRow = results.find(r => r.id === 'withWaste');
  const shapeRow = results.find(r => r.id === 'shape');
  const dimensionsRow = results.find(r => r.id === 'dimensions');
  const totalCostRow = results.find(r => r.id === 'totalCost');

  if (!sqftRow || !sqmRow || !shapeRow) return null;

  const shape = values.shape || 'rectangle';
  const wastage = parseInt(values.wastage || '0');

  const shapeDiagram = shape === 'circle' ? <CircleDiagram /> : shape === 'lshape' ? <LShapeDiagram /> : <RectangleDiagram />;

  // Extract numeric values for display
  const sqftNum = parseFloat(sqftRow.value.replace(/[^0-9.]/g, ''));
  const sqmNum = parseFloat(sqmRow.value.replace(/[^0-9.]/g, ''));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Area Breakdown
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Shape diagram */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          {shapeDiagram}
        </div>

        {/* Big result */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{sqftRow.label}</p>
          <p className="text-3xl font-bold text-blue-700 font-mono">{sqftRow.value}</p>
        </div>

        {/* Sq ft vs sq m comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Square Feet</p>
            <p className="text-lg font-bold text-blue-700 font-mono mt-0.5">
              {sqftNum >= 1000 ? sqftNum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : sqftNum.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Square Meters</p>
            <p className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
              {sqmNum.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Dimensions */}
        {dimensionsRow && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Dimensions</p>
            <p className="text-sm font-mono text-slate-700">{dimensionsRow.value}</p>
          </div>
        )}

        {/* Wastage breakdown */}
        {withWasteRow && wastage > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50">
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">Wastage Breakdown</p>
              <div className="space-y-1.5 text-xs text-amber-800">
                <div className="flex justify-between">
                  <span>Exact area</span>
                  <span className="font-mono font-semibold">{sqftRow.value}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waste factor</span>
                  <span className="font-mono font-semibold">{wastage}%</span>
                </div>
                <div className="border-t border-amber-300 pt-1.5 flex justify-between">
                  <span className="font-semibold">Total with waste</span>
                  <span className="font-mono font-semibold">{withWasteRow.value}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {withWasteRow && wastage === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">With Waste</p>
            <p className="text-sm font-mono text-slate-700">{withWasteRow.value} (no waste applied)</p>
          </div>
        )}

        {/* Cost estimate */}
        {totalCostRow && (
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">{totalCostRow.label}</p>
                <p className="text-2xl font-bold text-emerald-700 font-mono">{totalCostRow.value}</p>
              </div>
            </div>
          </div>
        )}

        {/* Shape identifier */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>{shapeRow.value}</span>
          </span>
        </div>

        {/* Educational note */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Measurement Tip</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Always measure to the nearest ⅛ inch (3 mm) for accuracy. When measuring for flooring,
            measure at multiple points since walls are not always perfectly straight. For irregular
            spaces, break the area into smaller rectangles, calculate each one, and add them together.
            Remember to add a waste factor of 5-15% when ordering materials.
          </p>
        </div>
      </div>
    </div>
  );
}
