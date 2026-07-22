import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getResult(results: Props['results'], id: string) {
  return results.find((r) => r.id === id);
}

function GardenBedSVG({ shape }: { shape: string }) {
  const w = 260;
  const h = 120;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: '140px' }} role="img" aria-label="Mulch garden bed diagram">
      <defs>
        <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B4513" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#654321" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="mulchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3728" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#3e2723" stopOpacity="0.5" />
        </linearGradient>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="6" height="6">
          <circle cx="3" cy="3" r="1" fill="#4a3728" opacity="0.3" />
        </pattern>
      </defs>

      {shape === 'circle' ? (
        <>
          <ellipse cx={w / 2} cy={h / 2 + 10} rx={80} ry={40} fill="url(#soilGrad)" />
          <ellipse cx={w / 2} cy={h / 2 + 5} rx={80} ry={35} fill="url(#mulchGrad)" />
          <ellipse cx={w / 2} cy={h / 2 + 5} rx={80} ry={35} fill="url(#dots)" />
          <ellipse cx={w / 2} cy={h / 2 + 10} rx={80} ry={40} fill="none" stroke="#4a3728" strokeWidth={2} />
        </>
      ) : (
        <>
          <rect x={40} y={70} width={180} height={45} rx={3} fill="url(#soilGrad)" />
          <rect x={40} y={60} width={180} height={30} rx={3} fill="url(#mulchGrad)" />
          <rect x={40} y={60} width={180} height={30} rx={3} fill="url(#dots)" />
          <rect x={40} y={70} width={180} height={45} rx={3} fill="none" stroke="#4a3728" strokeWidth={2} />
          <line x1={40} y1={60} x2={220} y2={60} stroke="#2d1f14" strokeWidth={3} />
          <text x={w / 2} y={52} textAnchor="middle" fontSize={11} fill="#4a3728" fontWeight="bold">Mulch Layer</text>
          <text x={w / 2} y={100} textAnchor="middle" fontSize={9} fill="#654321">Soil Base</text>
        </>
      )}
    </svg>
  );
}

function BoxVisualizationSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-24 h-20" role="img" aria-label="Mulch bag 3D visualization">
      <polygon points="60,5 115,25 60,45 5,25" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={1.5} />
      <polygon points="5,25 5,80 60,100 60,45" fill="#bae6fd" stroke="#0ea5e9" strokeWidth={1.5} />
      <polygon points="60,45 60,100 115,80 115,25" fill="#7dd3fc" stroke="#0ea5e9" strokeWidth={1.5} />
      <text x={60} y={85} textAnchor="middle" fontSize={7} fill="#475569" fontWeight="bold">3 ft</text>
      <text x={8} y={55} textAnchor="middle" fontSize={7} fill="#475569" fontWeight="bold" transform="rotate(-90, 8, 55)">3 ft</text>
      <text x={90} y={18} textAnchor="middle" fontSize={7} fill="#475569" fontWeight="bold" transform="rotate(-30, 90, 18)">3 ft</text>
    </svg>
  );
}

export default function MulchPanel({ values, results }: Props) {
  const cyRes = getResult(results, 'cubicYards');
  const bags2Res = getResult(results, 'bags2ft');
  const bags3Res = getResult(results, 'bags3ft');
  const bulkRes = getResult(results, 'bulkScoops');
  const costBagsRes = getResult(results, 'costBags');
  const costBulkRes = getResult(results, 'costBulk');
  const areaRes = getResult(results, 'coverageArea');
  const shape = values.shape || 'rect';

  const hasBagPrice = costBagsRes?.value && !costBagsRes.value.includes('Enter');
  const hasBulkPrice = costBulkRes?.value && !costBulkRes.value.includes('Enter');

  let savingsTip: string | null = null;
  if (hasBagPrice && hasBulkPrice) {
    const bagCost = parseFloat(costBagsRes!.value.replace('$', ''));
    const bulkCost = parseFloat(costBulkRes!.value.replace('$', ''));
    if (!isNaN(bagCost) && !isNaN(bulkCost)) {
      const diff = bagCost - bulkCost;
      if (diff > 0) {
        savingsTip = `Bulk delivery saves $${diff.toFixed(2)} vs. bagged`;
      } else if (diff < 0) {
        savingsTip = `Bagged costs $${Math.abs(diff).toFixed(2)} less than bulk delivery`;
      }
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Mulch & Material Estimate</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 text-center">
          <p className="text-4xl font-black text-blue-700">{cyRes?.value || '0'}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mt-1">Total Mulch Needed</p>
        </div>

        <GardenBedSVG shape={shape} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Bagged Options</p>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm font-medium text-slate-700">2 cu ft Bags</span>
                <span className="text-sm font-bold text-slate-900">{bags2Res?.value || '0'}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm font-medium text-slate-700">3 cu ft Bags</span>
                <span className="text-sm font-bold text-slate-900">{bags3Res?.value || '0'}</span>
              </div>
              {hasBagPrice && (
                <div className="flex justify-between items-center px-4 py-3 bg-amber-50">
                  <span className="text-sm font-medium text-slate-700">Total Cost (2 cu ft)</span>
                  <span className="text-sm font-bold text-amber-800">{costBagsRes?.value}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Bulk Delivery</p>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm font-medium text-slate-700">Scoops Needed</span>
                <span className="text-sm font-bold text-slate-900">{bulkRes?.value || '0'}</span>
              </div>
              {hasBulkPrice && (
                <div className="flex justify-between items-center px-4 py-3 bg-emerald-50">
                  <span className="text-sm font-medium text-slate-700">Total Cost (Bulk)</span>
                  <span className="text-sm font-bold text-emerald-800">{costBulkRes?.value}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {savingsTip && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4">
            <p className="text-sm font-bold text-green-800">Savings Tip</p>
            <p className="text-sm text-green-700 mt-1">{savingsTip}</p>
          </div>
        )}

        <div className="flex items-center gap-4 rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
          <BoxVisualizationSVG />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Visualize This</p>
            <p className="text-sm text-slate-700 mt-1">
              1 cubic yard fills a <strong>3 ft x 3 ft x 3 ft box</strong>
            </p>
            {areaRes && (
              <p className="text-xs text-slate-500 mt-1">
                Covers {areaRes.value} at {values.depth || '2'}" deep
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
