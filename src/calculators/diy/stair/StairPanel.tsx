import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface StairData {
  numberOfRisers: number;
  actualRiserHeight: number;
  numberOfTreads: number;
  totalRunIn: number;
  stringerLength: number;
  angleDeg: number;
  ibcCompliant: boolean;
  treadDepth: number;
  unitSystem: string;
}

function parseStairData(results: CalculatorResult[]): StairData | null {
  const row = results.find((r) => r.id === '_stairData');
  if (!row) return null;
  try {
    return JSON.parse(row.value) as StairData;
  } catch {
    return null;
  }
}

export default function StairPanel({ results }: Props) {
  const data = parseStairData(results);
  if (!data) return null;

  const numberOfSteps = results.find((r) => r.id === 'numberOfSteps');
  const riserHeight = results.find((r) => r.id === 'riserHeight');
  const treadDepthRes = results.find((r) => r.id === 'treadDepthResult');
  const totalRun = results.find((r) => r.id === 'totalRun');
  const stringerLen = results.find((r) => r.id === 'stringerLength');
  const stringerAngle = results.find((r) => r.id === 'stringerAngle');
  const ibcStatus = results.find((r) => r.id === 'ibcStatus');
  const material = results.find((r) => r.id === 'materialRecommendation');

  const maxSteps = Math.min(data.numberOfRisers, 14);
  const svgW = 340;
  const svgH = 300;
  const pad = 40;
  const plotW = svgW - pad * 2;
  const plotH = svgH - pad * 2;
  const maxRise = data.actualRiserHeight * maxSteps;
  const maxRun = data.treadDepth * (maxSteps - 0);
  const scale = Math.min(plotW / (maxRun || 1), plotH / (maxRise || 1));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Stair Geometry &amp; Stringer Layout
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* IBC Compliance Badge */}
        {ibcStatus && (
          <div
            className={`rounded-xl border p-4 flex items-center gap-3 ${
              data.ibcCompliant
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                data.ibcCompliant ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                data.ibcCompliant ? 'text-emerald-800' : 'text-red-800'
              }`}
            >
              {ibcStatus.value}
            </p>
          </div>
        )}

        {/* SVG Side Profile */}
        <div className="flex justify-center bg-slate-50 rounded-xl border border-slate-200 p-3">
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label="Staircase side profile diagram showing treads and risers">
            {/* Stringer diagonal line */}
            <line
              x1={pad}
              y1={pad + plotH}
              x2={pad + maxRun * scale}
              y2={pad + plotH - maxRise * scale}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            {/* Steps */}
            {Array.from({ length: maxSteps }).map((_, i) => {
              const x0 = pad + i * data.treadDepth * scale;
              const y0 = pad + plotH - i * data.actualRiserHeight * scale;
              return (
                <g key={`step-${i}`}>
                  {/* Tread (horizontal) */}
                  <line
                    x1={x0}
                    y1={y0}
                    x2={x0 + data.treadDepth * scale}
                    y2={y0}
                    stroke="#475569"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Riser (vertical) */}
                  {i < maxSteps - 1 && (
                    <line
                      x1={x0 + data.treadDepth * scale}
                      y1={y0}
                      x2={x0 + data.treadDepth * scale}
                      y2={y0 + data.actualRiserHeight * scale}
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            })}

            {/* Rise bracket */}
            <line
              x1={pad + maxRun * scale + 16}
              y1={pad + plotH}
              x2={pad + maxRun * scale + 16}
              y2={pad + plotH - maxRise * scale}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="3,2"
            />
            <text
              x={pad + maxRun * scale + 22}
              y={(pad + plotH + pad + plotH - maxRise * scale) / 2}
              fill="#ef4444"
              fontSize="11"
              fontWeight="bold"
            >
              Rise
            </text>

            {/* Run bracket */}
            <line
              x1={pad}
              y1={pad + plotH + 12}
              x2={pad + maxRun * scale}
              y2={pad + plotH + 12}
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="3,2"
            />
            <text
              x={(pad + pad + maxRun * scale) / 2}
              y={pad + plotH + 26}
              fill="#3b82f6"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              Run
            </text>
          </svg>
        </div>

        {/* Step Dimensions Table */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Step Dimensions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <DimensionCell label="Steps" value={numberOfSteps?.value || '-'} />
            <DimensionCell
              label="Riser"
              value={riserHeight?.value || '-'}
              highlight={data.ibcCompliant}
            />
            <DimensionCell label="Tread" value={treadDepthRes?.value || '-'} />
            <DimensionCell label="Angle" value={stringerAngle?.value || '-'} />
          </div>
        </div>

        {/* Key Measurements */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
              Total Run
            </p>
            <p className="text-xl font-bold text-blue-700 mt-1">
              {totalRun?.value || '-'}
            </p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500">
              Stringer Length
            </p>
            <p className="text-xl font-bold text-purple-700 mt-1">
              {stringerLen?.value || '-'}
            </p>
          </div>
        </div>

        {/* Lumber Recommendation Card */}
        {material && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
              Material Recommendation
            </p>
            <p className="text-sm font-medium text-amber-800">
              {material.value}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Linear feet of stringer needed:{' '}
              {stringerLen
                ? `${((parseFloat(stringerLen.value.replace(/[^0-9.]/g, '')) || 0) / 12).toFixed(1)} ft`
                : '-'}
            </p>
          </div>
        )}

        {/* Quick Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            IBC Reference
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">Max Riser</p>
              <p className="text-slate-500">7.75"</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">Min Tread</p>
              <p className="text-slate-500">10"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DimensionCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 text-center ${
        highlight !== false
          ? 'bg-white border-slate-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p
        className={`text-sm font-bold font-mono mt-0.5 ${
          highlight !== false ? 'text-slate-700' : 'text-red-600'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
