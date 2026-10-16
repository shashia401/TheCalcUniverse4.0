import { CalculatorResult } from '../../../types/calculator';
import { DEG, trigAt } from './trigMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function UnitCircle({ angleDeg }: { angleDeg: number }) {
  const cx = 220;
  const cy = 190;
  const r = 130;
  const t = trigAt(angleDeg);
  const n = t.normDeg;
  const cosVal = t.cos;
  const sinVal = t.sin;
  const px = cx + r * cosVal;
  const py = cy - r * sinVal;
  const arc = Array.from({ length: 41 }, (_, i) => {
    const a = (n * (i / 40)) * DEG;
    return `${i === 0 ? 'M' : 'L'} ${(cx + 25 * Math.cos(a)).toFixed(1)} ${(cy - 25 * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  const label = `${+n.toFixed(6)}°`;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 440 350" className="w-full max-w-[400px]" role="img" aria-label={`Unit circle showing angle ${label}, ${t.quadrant}; cos = ${+cosVal.toFixed(4)}, sin = ${+sinVal.toFixed(4)}`}>
        <line x1={cx - r - 20} y1={cy} x2={cx + r + 20} y2={cy} stroke="#e2e8f0" strokeWidth={0.5} />
        <line x1={cx} y1={cy - r - 20} x2={cx} y2={cy + r + 20} stroke="#e2e8f0" strokeWidth={0.5} />

        {/* Quadrants: I top-right, II top-left, III bottom-left, IV bottom-right */}
        <text x={cx + r * 0.65} y={cy - r * 0.55} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight="bold">Q I</text>
        <text x={cx - r * 0.65} y={cy - r * 0.55} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight="bold">Q II</text>
        <text x={cx - r * 0.65} y={cy + r * 0.55} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight="bold">Q III</text>
        <text x={cx + r * 0.65} y={cy + r * 0.55} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight="bold">Q IV</text>

        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth={1.5} />
        <polygon points={`${cx},${cy} ${px},${cy} ${px},${py}`} fill="rgba(37,99,235,0.1)" stroke="#2563eb" strokeWidth={1} strokeDasharray="4 3" />
        <path d={arc} fill="none" stroke="#7c3aed" strokeWidth={2} />
        <text x={cx + 38 * Math.cos((n / 2) * DEG)} y={cy - 38 * Math.sin((n / 2) * DEG)} textAnchor="middle" fontSize={12} fill="#6d28d9" fontWeight="bold">
          {label}
        </text>
        <text x={cx + r * cosVal * 0.5} y={cy + 18} textAnchor="middle" fontSize={10} fill="#1d4ed8" fontWeight="500">
          cos = {+cosVal.toFixed(4)}
        </text>
        <text x={cx + 18} y={cy - r * sinVal * 0.5} textAnchor="start" fontSize={10} fill="#15803d" fontWeight="500">
          sin = {+sinVal.toFixed(4)}
        </text>
        <circle cx={px} cy={py} r={5} fill="#dc2626" stroke="white" strokeWidth={2} />
        <text x={px + (cosVal >= 0 ? 10 : -10)} y={py - 10} textAnchor={cosVal >= 0 ? 'start' : 'end'} fontSize={10} fill="#b91c1c" fontWeight="bold">
          ({+cosVal.toFixed(3)}, {+sinVal.toFixed(3)})
        </text>
        <text x={cx + r + 18} y={cy + 4} textAnchor="start" fontSize={10} fill="#64748b">1</text>
        <text x={cx - r - 18} y={cy + 4} textAnchor="end" fontSize={10} fill="#64748b">-1</text>
        <text x={cx - 4} y={cy - r - 10} textAnchor="end" fontSize={10} fill="#64748b">1</text>
        <text x={cx - 4} y={cy + r + 14} textAnchor="end" fontSize={10} fill="#64748b">-1</text>
        <text x={cx} y={cy + r + 32} textAnchor="middle" fontSize={11} fill="#475569">
          Position: <tspan fill="#0f172a" fontWeight="bold">{t.quadrant}</tspan>
        </text>
        <text x={cx} y={cy + r + 52} textAnchor="middle" fontSize={10} fill="#64748b">
          Unit circle: radius = 1 &middot; Angle measured from positive x-axis
        </text>
      </svg>
    </div>
  );
}

function TrigValueTable({ results }: { results: CalculatorResult[] }) {
  const trigResults = results.filter((r) => ['sin', 'cos', 'tan', 'csc', 'sec', 'cot'].includes(r.id));
  if (trigResults.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Trigonometric function values table">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Function</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Value</th>
          </tr>
        </thead>
        <tbody>
          {trigResults.map((row, i) => (
            <tr key={row.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className={`px-4 py-2.5 font-bold ${row.id === 'sin' ? 'text-blue-700' : row.id === 'cos' ? 'text-emerald-800' : row.id === 'tan' ? 'text-amber-800' : 'text-slate-600'}`}>
                {row.label.replace(' = 1/sin(θ)', '').replace(' = 1/cos(θ)', '').replace(' = 1/tan(θ)', '').trim() || row.label}
              </td>
              <td className={`px-4 py-2.5 text-right font-semibold ${row.color === 'negative' ? 'text-red-700' : row.color === 'positive' ? 'text-emerald-800' : 'text-slate-700'}`}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrigPanel({ values, results }: Props) {
  if (!results || results.length === 0) return null;
  if (results.some((r) => r.id === 'error')) return null;

  const isAngleMode = values.mode === 'angle-to-trig';
  const angleDeg = Number(results.find((r) => r.id === '_angleDeg')?.value);
  if (!Number.isFinite(angleDeg)) return null;

  const principalResult = results.find((r) => r.id === 'principalAngle');
  const refResult = results.find((r) => r.id === 'referenceAngle');
  const funcResult = results.find((r) => r.id === 'functionUsed');
  const exactResult = results.find((r) => r.id === 'exactValues') ?? results.find((r) => r.id === 'exactValue');
  const allResult = results.find((r) => r.id === 'allAngles');
  const angleN = ((angleDeg % 360) + 360) % 360;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {isAngleMode ? 'Unit Circle & Trig Values' : 'Angle Visualization'}
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Unit Circle</p>
          <UnitCircle angleDeg={angleDeg} />
        </div>

        {isAngleMode && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Trigonometric Values at θ = {+angleDeg.toFixed(8)}°</p>
            <TrigValueTable results={results} />
            {exactResult && <p className="mt-3 text-xs font-mono text-slate-700">{exactResult.label}: {exactResult.value}</p>}
          </div>
        )}

        {!isAngleMode && principalResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Principal Angle</p>
              <p className="text-lg font-black text-emerald-800 break-all">{principalResult.value}</p>
            </div>
            {refResult && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Reference Angle</p>
                <p className="text-lg font-black text-blue-800 break-all">{refResult.value}</p>
              </div>
            )}
            {funcResult && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-5 py-3 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Inverse Function</p>
                <p className="text-sm font-bold text-slate-700">{funcResult.value}</p>
                {exactResult && <p className="text-xs font-mono text-slate-700 mt-1">Exact: {exactResult.value}</p>}
                {allResult && <p className="text-xs font-mono text-slate-700 mt-1">{allResult.value}</p>}
              </div>
            )}
          </div>
        )}

        {isAngleMode && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Common Angles</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {[
                { angle: 0, sin: '0', cos: '1' },
                { angle: 30, sin: '1/2', cos: '√3/2' },
                { angle: 45, sin: '√2/2', cos: '√2/2' },
                { angle: 60, sin: '√3/2', cos: '1/2' },
                { angle: 90, sin: '1', cos: '0' },
                { angle: 180, sin: '0', cos: '-1' },
              ].map((entry) => (
                <div key={entry.angle} className={`rounded-lg px-2 py-2 ${Math.abs(angleN - entry.angle) < 1e-9 ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white border border-slate-200'}`}>
                  <p className="text-xs font-bold text-slate-700">{entry.angle}°</p>
                  <p className="text-[10px] text-slate-600">sin: {entry.sin}</p>
                  <p className="text-[10px] text-slate-600">cos: {entry.cos}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
