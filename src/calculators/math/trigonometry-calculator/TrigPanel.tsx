import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const DEG = Math.PI / 180;

function toRadians(degrees: number): number {
  return degrees * DEG;
}

function UnitCircle({ angleDeg }: { angleDeg: number }) {
  const cx = 220;
  const cy = 190;
  const r = 130;
  const rad = toRadians(angleDeg);
  const cosVal = Math.cos(rad);
  const sinVal = Math.sin(rad);
  const px = cx + r * cosVal;
  const py = cy - r * sinVal;

  const angleNorm = ((angleDeg % 360) + 360) % 360;
  let quadrant = '';
  if (angleNorm > 0 && angleNorm < 90) quadrant = 'I';
  else if (angleNorm > 90 && angleNorm < 180) quadrant = 'II';
  else if (angleNorm > 180 && angleNorm < 270) quadrant = 'III';
  else if (angleNorm > 270 && angleNorm < 360) quadrant = 'IV';
  else if (angleNorm === 0 || angleNorm === 360) quadrant = '+x axis';
  else if (angleNorm === 90) quadrant = '+y axis';
  else if (angleNorm === 180) quadrant = '-x axis';
  else if (angleNorm === 270) quadrant = '-y axis';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 440 350" className="w-full max-w-[400px]" role="img" aria-label={`Unit circle showing angle ${angleDeg}°`}>
        {/* Grid */}
        <line x1={cx - r - 20} y1={cy} x2={cx + r + 20} y2={cy} stroke="#e2e8f0" strokeWidth={0.5} />
        <line x1={cx} y1={cy - r - 20} x2={cx} y2={cy + r + 20} stroke="#e2e8f0" strokeWidth={0.5} />

        {/* Quadrant labels */}
        <text x={cx + r * 0.65} y={cy - r * 0.55} textAnchor="middle" fontSize={11} fill="#cbd5e1" fontWeight="bold">Q II</text>
        <text x={cx - r * 0.65} y={cy - r * 0.55} textAnchor="middle" fontSize={11} fill="#cbd5e1" fontWeight="bold">Q I</text>
        <text x={cx + r * 0.65} y={cy + r * 0.55} textAnchor="middle" fontSize={11} fill="#cbd5e1" fontWeight="bold">Q III</text>
        <text x={cx - r * 0.65} y={cy + r * 0.55} textAnchor="middle" fontSize={11} fill="#cbd5e1" fontWeight="bold">Q IV</text>

        {/* Unit circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth={1.5} />

        {/* Reference triangle */}
        <polygon points={`${cx},${cy} ${px},${cy} ${px},${py}`} fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 3" />

        {/* Angle arc */}
        <path
          d={(() => {
            const startAngle = 0;
            const endAngle = angleNorm;
            const steps = 40;
            let d = '';
            for (let i = 0; i <= steps; i++) {
              const t = startAngle + (endAngle - startAngle) * (i / steps);
              const a = toRadians(t);
              const x = cx + 25 * Math.cos(a);
              const y = cy - 25 * Math.sin(a);
              d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
            }
            return d;
          })()}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth={2}
        />

        {/* Angle label */}
        <text
          x={cx + 38 * Math.cos(toRadians(angleNorm / 2))}
          y={cy - 38 * Math.sin(toRadians(angleNorm / 2))}
          textAnchor="middle"
          fontSize={12}
          fill="#8b5cf6"
          fontWeight="bold"
        >
          {angleDeg}°
        </text>

        {/* Cos label on x-axis */}
        <text x={cx + r * cosVal * 0.5} y={cy + 18} textAnchor="middle" fontSize={10} fill="#3b82f6" fontWeight="500">
          cos = {cosVal.toFixed(4)}
        </text>

        {/* Sin label on y-axis */}
        <text x={cx + 18} y={cy - r * sinVal * 0.5} textAnchor="start" fontSize={10} fill="#22c55e" fontWeight="500">
          sin = {sinVal.toFixed(4)}
        </text>

        {/* Point on circle */}
        <circle cx={px} cy={py} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />
        <text x={px + (cosVal >= 0 ? 10 : -10)} y={py - 10} textAnchor={cosVal >= 0 ? 'start' : 'end'} fontSize={10} fill="#ef4444" fontWeight="bold">
          ({cosVal.toFixed(3)}, {sinVal.toFixed(3)})
        </text>

        {/* Axis labels */}
        <text x={cx + r + 18} y={cy + 4} textAnchor="start" fontSize={10} fill="#94a3b8">1</text>
        <text x={cx - r - 18} y={cy + 4} textAnchor="end" fontSize={10} fill="#94a3b8">-1</text>
        <text x={cx - 4} y={cy - r - 10} textAnchor="end" fontSize={10} fill="#94a3b8">1</text>
        <text x={cx - 4} y={cy + r + 14} textAnchor="end" fontSize={10} fill="#94a3b8">-1</text>

        {/* Quadrant badge */}
        {quadrant && (
          <text x={cx} y={cy + r + 32} textAnchor="middle" fontSize={11} fill="#64748b">
            Quadrant: <tspan fill="#0f172a" fontWeight="bold">{quadrant}</tspan>
          </text>
        )}

        {/* Legend */}
        <text x={cx} y={cy + r + 52} textAnchor="middle" fontSize={9} fill="#94a3b8">
          Unit circle: radius = 1 &middot; Angle measured from positive x-axis
        </text>
      </svg>
    </div>
  );
}

function TrigValueTable({ results }: { results: CalculatorResult[] }) {
  const trigResults = results.filter((r) => ['sin', 'cos', 'tan', 'csc', 'sec', 'cot'].includes(r.id));
  if (trigResults.length === 0) return null;

  const rows = trigResults.map((r) => {
    let colorClass = 'text-slate-700';
    if (r.color === 'positive') colorClass = 'text-emerald-600';
    else if (r.color === 'negative') colorClass = 'text-red-600';
    return { id: r.id, label: r.label, value: r.value, colorClass };
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Function</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className={`px-4 py-2.5 font-bold ${row.id === 'sin' ? 'text-blue-600' : row.id === 'cos' ? 'text-emerald-600' : row.id === 'tan' ? 'text-amber-600' : 'text-slate-500'}`}>
                {row.label.replace(' = 1/sin(θ)', '').replace(' = 1/cos(θ)', '').replace(' = 1/tan(θ)', '').trim() || row.label}
              </td>
              <td className={`px-4 py-2.5 text-right font-semibold ${row.colorClass}`}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrigPanel({ values, results }: Props) {
  if (!results || results.length === 0) return null;

  const hasError = results.some((r) => r.id === 'error');
  if (hasError) return null;

  const isAngleMode = values.mode === 'angle-to-trig';
  const angleVal = parseFloat(values.angle || 'NaN');
  const angleDeg = isNaN(angleVal) ? 0 : angleVal;
  const angleNorm = ((angleDeg % 360) + 360) % 360;

  // For trig-to-angle mode
  const principalResult = results.find((r) => r.id === 'principalAngle');
  const refResult = results.find((r) => r.id === 'referenceAngle');
  const funcResult = results.find((r) => r.id === 'functionUsed');

  const highlightAngle = angleNorm;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {isAngleMode ? 'Unit Circle & Trig Values' : 'Angle Visualization'}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Unit circle */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Unit Circle
          </p>
          {isAngleMode ? (
            <UnitCircle angleDeg={angleNorm} />
          ) : (
            principalResult && (
              <UnitCircle angleDeg={parseFloat(principalResult.value.replace('°', '')) || 0} />
            )
          )}
        </div>

        {/* Trig values table (angle mode) */}
        {isAngleMode && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Trigonometric Values at &theta; = {angleDeg}°
            </p>
            <TrigValueTable results={results} />
          </div>
        )}

        {/* Inverse results (trig-to-angle mode) */}
        {!isAngleMode && principalResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Principal Angle</p>
              <p className="text-lg font-black text-emerald-700">{principalResult.value}</p>
            </div>
            {refResult && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Reference Angle</p>
                <p className="text-lg font-black text-blue-700">{refResult.value}</p>
              </div>
            )}
            {funcResult && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-5 py-3 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inverse Function</p>
                <p className="text-sm font-bold text-slate-700">{funcResult.value}</p>
              </div>
            )}
          </div>
        )}

        {/* Common angles quick reference */}
        {isAngleMode && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Common Angles</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {[
                { angle: '0°', sin: '0', cos: '1', tan: '0' },
                { angle: '30°', sin: '½', cos: '√3/2', tan: '1/√3' },
                { angle: '45°', sin: '√2/2', cos: '√2/2', tan: '1' },
                { angle: '60°', sin: '√3/2', cos: '½', tan: '√3' },
                { angle: '90°', sin: '1', cos: '0', tan: 'undef' },
                { angle: '180°', sin: '0', cos: '-1', tan: '0' },
              ].map((entry) => (
                <div key={entry.angle} className={`rounded-lg px-2 py-2 ${Math.abs(angleNorm - parseFloat(entry.angle)) < 0.5 ? 'ring-2 ring-blue-400 bg-blue-50' : 'bg-white border border-slate-200'}`}>
                  <p className="text-xs font-bold text-slate-700">{entry.angle}</p>
                  <p className="text-[10px] text-slate-500">sin: {entry.sin}</p>
                  <p className="text-[10px] text-slate-500">cos: {entry.cos}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
