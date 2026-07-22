import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Color Map ───────────────────────────────────────────────────────────────

const VAR_COLORS: Record<string, { bg: string; text: string; border: string; lightBg: string; bar: string }> = {
  voltage:    { bg: 'bg-blue-500',    text: 'text-blue-700',    border: 'border-blue-200',    lightBg: 'bg-blue-50',    bar: 'bg-blue-500' },
  current:    { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', lightBg: 'bg-emerald-50', bar: 'bg-emerald-500' },
  resistance: { bg: 'bg-orange-500',  text: 'text-orange-700',  border: 'border-orange-200',  lightBg: 'bg-orange-50',  bar: 'bg-orange-500' },
  power:      { bg: 'bg-red-500',     text: 'text-red-700',     border: 'border-red-200',     lightBg: 'bg-red-50',     bar: 'bg-red-500' },
};

// ─── SVG Arc Helper for Pie Chart ────────────────────────────────────────────

interface Arc {
  label: string;
  color: string;
  startAngle: number;
  endAngle: number;
  highlighted: boolean;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
  const r1 = polarToCartesian(cx, cy, r, end);
  const r2 = polarToCartesian(cx, cy, r, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${r2.x} ${r2.y} A ${r} ${r} 0 ${large} 1 ${r1.x} ${r1.y} Z`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OhmsLawPanel({ results }: Props) {
  // Extract results
  const voltage    = results.find((r) => r.id === 'voltage');
  const current    = results.find((r) => r.id === 'current');
  const resistance = results.find((r) => r.id === 'resistance');
  const power      = results.find((r) => r.id === 'power');
  const formulas   = results.find((r) => r.id === 'usedFormulas');
  const pieDataRaw = results.find((r) => r.id === 'pieData');

  if (!voltage || !current || !resistance || !power) return null;

  // Parse which vars are known
  let knownVars: string[] = [];
  if (pieDataRaw) {
    try { knownVars = JSON.parse(pieDataRaw.value); } catch { knownVars = []; }
  }

  const valueCards = [
    { id: 'voltage',    label: 'Voltage',    unit: 'V', result: voltage },
    { id: 'current',    label: 'Current',    unit: 'A', result: current },
    { id: 'resistance', label: 'Resistance', unit: 'Ω', result: resistance },
    { id: 'power',      label: 'Power',      unit: 'W', result: power },
  ];

  // Pie chart slices (4 equal quadrants, each 90 degrees)
  const pieArcs: Arc[] = [
    { label: 'V', color: '#3B82F6', startAngle: 0,   endAngle: 90,  highlighted: !!voltage.highlight },
    { label: 'I', color: '#10B981', startAngle: 90,  endAngle: 180, highlighted: !!current.highlight },
    { label: 'R', color: '#F97316', startAngle: 180, endAngle: 270, highlighted: !!resistance.highlight },
    { label: 'P', color: '#EF4444', startAngle: 270, endAngle: 360, highlighted: !!power.highlight },
  ];

  const cx = 80;
  const cy = 80;
  const r  = 70;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Ohm&rsquo;s Law Wheel
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Value Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {valueCards.map((c) => {
            const colors = VAR_COLORS[c.id] || VAR_COLORS.voltage;
            const isKnown = knownVars.includes(c.id === 'voltage' ? 'V' : c.id === 'current' ? 'I' : c.id === 'resistance' ? 'R' : 'P');
            return (
              <div
                key={c.id}
                className={`rounded-xl border p-3 text-center transition-all ${colors.border} ${colors.lightBg} ${isKnown ? '' : 'ring-2 ring-offset-1'}`}
                style={isKnown ? {} : { '--ring-color': colors.bg.replace('bg-', '') } as React.CSSProperties}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                  {c.label} ({c.unit})
                </p>
                <p className={`text-lg font-bold ${colors.text} font-mono`}>
                  {c.result.value}
                </p>
                {isKnown && (
                  <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                    Known
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Pie Chart + Formula Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Ohm&rsquo;s Law Pie Chart
            </p>
            <svg width="160" height="160" viewBox="0 0 160 160" className="mb-2" role="img" aria-label="Ohm's Law pie chart showing relationship between voltage, current, resistance, and power">
              {pieArcs.map((arc) => (
                <path
                  key={arc.label}
                  d={describeArc(cx, cy, r, arc.startAngle, arc.endAngle)}
                  fill={arc.color}
                  opacity={arc.highlighted ? 0.5 : 1}
                  stroke={arc.highlighted ? '#1E293B' : '#FFFFFF'}
                  strokeWidth={arc.highlighted ? 2.5 : 1.5}
                />
              ))}
              <circle cx={cx} cy={cy} r="28" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth={1} />
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#475569">Ohm's</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#475569">Law</text>
              {pieArcs.map((arc) => {
                const midAngle = (arc.startAngle + arc.endAngle) / 2;
                const p = polarToCartesian(cx, cy, 52, midAngle);
                return (
                  <text
                    key={`label-${arc.label}`}
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="18"
                    fontWeight="bold"
                    fill="#FFFFFF"
                  >
                    {arc.label}
                  </text>
                );
              })}
            </svg>
            <div className="flex gap-3 flex-wrap justify-center">
              {pieArcs.map((arc) => (
                <div key={arc.label} className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: arc.color, opacity: arc.highlighted ? 0.5 : 1 }}
                  />
                  <span className={`text-[10px] font-medium ${arc.highlighted ? 'text-slate-900' : 'text-slate-500'}`}>
                    {arc.label} {arc.highlighted ? '(computed)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Formula Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Formula Used
            </p>
            {formulas && (
              <div className="space-y-2">
                {formulas.value.split(', ').map((f, i) => (
                  <div key={`item-${i}`} className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-center">
                    <code className="text-sm font-bold text-slate-700">{f}</code>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
              Given any two values from the Ohm&rsquo;s Law Wheel, the remaining two are calculated automatically.
            </p>
          </div>
        </div>

        {/* Quick Reference Table */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 bg-white">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Quick Reference
            </p>
          </div>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th scope="col" className="text-left pb-2 font-semibold">Known Values</th>
                  <th scope="col" className="text-left pb-2 font-semibold">Formula 1</th>
                  <th scope="col" className="text-left pb-2 font-semibold">Formula 2</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { known: 'V, I', f1: 'R = V / I', f2: 'P = V × I' },
                  { known: 'V, R', f1: 'I = V / R', f2: 'P = V² / R' },
                  { known: 'V, P', f1: 'I = P / V', f2: 'R = V² / P' },
                  { known: 'I, R', f1: 'V = I × R', f2: 'P = I² × R' },
                  { known: 'I, P', f1: 'V = P / I', f2: 'R = P / I²' },
                  { known: 'R, P', f1: 'V = √(P × R)', f2: 'I = √(P / R)' },
                ].map((row, i) => (
                  <tr key={`item-${i}`} className="border-b border-slate-100 text-slate-600">
                    <td className="py-1.5 font-semibold">{row.known}</td>
                    <td className="py-1.5 font-mono">{row.f1}</td>
                    <td className="py-1.5 font-mono">{row.f2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
