import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function r(results: CalculatorResult[], id: string) {
  return results.find(x => x.id === id);
}

export default function CirclePanel({ results }: Props) {
  const radius = r(results, 'radius');
  const diameter = r(results, 'diameter');
  const circumference = r(results, 'circumference');
  const area = r(results, 'area');
  const reverseStep = r(results, 'reverseStep');

  if (!radius || !diameter || !circumference || !area) return null;

  const rVal = parseFloat(radius.value);
  const svgSize = 360;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const scaleR = Math.min(rVal * 12, 130);
  const displayR = Math.max(scaleR, 44);

  const fmt = (n: number) => parseFloat(n.toFixed(6)).toString();

  /* formula cards */
  const formulaCards = [
    { label: 'Diameter', formula: 'd = 2r', sub: `2 × ${fmt(rVal)}`, result: diameter.value },
    { label: 'Circumference', formula: 'C = 2πr', sub: `2 × π × ${fmt(rVal)}`, result: circumference.value },
    { label: 'Area', formula: 'A = πr²', sub: `π × ${fmt(rVal)}² = π × ${fmt(rVal * rVal)}`, result: area.value },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Circle Diagram &amp; All Measurements</span>
      </div>

      <div className="p-5 space-y-5">
        {/* SVG Circle Diagram + Results */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} role="img" aria-label="Circle diagram showing radius and diameter measurements">
              {/* Circle */}
              <circle cx={cx} cy={cy} r={displayR} fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="3" />
              {/* Center dot */}
              <circle cx={cx} cy={cy} r="5" fill="#3b82f6" />
              {/* Radius line */}
              <line x1={cx} y1={cy} x2={cx + displayR} y2={cy} stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 2" />
              <text x={cx + displayR / 2} y={cy - 10} textAnchor="middle" fill="#ef4444" fontSize="15" fontWeight="bold">
                r = {radius.value}
              </text>
              {/* Diameter line */}
              <line x1={cx - displayR} y1={cy + 30} x2={cx + displayR} y2={cy + 30} stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 2" />
              <text x={cx} y={cy + 50} textAnchor="middle" fill="#10b981" fontSize="15" fontWeight="bold">
                d = {diameter.value}
              </text>
            </svg>
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 w-full">
            <div className={`rounded-lg border px-3 py-2.5 text-center ${radius.highlight ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Radius</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{radius.value}</p>
            </div>
            <div className={`rounded-lg border px-3 py-2.5 text-center ${diameter.highlight ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Diameter</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{diameter.value}</p>
            </div>
            <div className={`rounded-lg border px-3 py-2.5 text-center ${circumference.highlight ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Circumference</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{circumference.value}</p>
            </div>
            <div className={`rounded-lg border px-3 py-2.5 text-center ${area.highlight ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Area</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{area.value}</p>
            </div>
          </div>
        </div>

        {/* Formula application */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Formula in Action</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {formulaCards.map((c, i) => (
              <div key={`item-${i}`} className="rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{c.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700">{c.formula}</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{c.sub}</p>
                <p className="text-base font-bold text-blue-700 mt-1">{c.result}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reverse step */}
        {reverseStep && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
              Reverse Engineering
            </p>
            <p className="text-sm font-mono text-amber-700">{reverseStep.value}</p>
            <p className="text-xs text-amber-600 mt-1">
              The known value was used to work backward and find the radius, then all other measurements.
            </p>
          </div>
        )}

        {/* Educational insight */}
        <div className="rounded-xl border border-purple-200 bg-purple-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-1">Why the Circle is Special</p>
          <p className="text-xs text-purple-800 leading-relaxed">
            The circle has the highest area-to-perimeter ratio of any shape — for a given perimeter, a circle encloses
            the maximum possible area. The ratio of any circle's circumference to its diameter is always π (~3.14159),
            a constant discovered independently by ancient civilizations worldwide. This relationship means that
            knowing just the radius (one measurement) gives you every other property of the circle.
          </p>
        </div>
      </div>
    </div>
  );
}
