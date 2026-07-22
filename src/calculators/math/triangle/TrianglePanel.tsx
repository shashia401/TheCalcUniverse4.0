import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

interface VertexCoords {
  x: number;
  y: number;
  label: string;
  angle: number;
  side: number;
}

export default function TrianglePanel({ results }: Props) {
  const typeRow = results.find(r => r.id === 'triangleType');
  const angleA = results.find(r => r.id === 'angleA');
  const angleB = results.find(r => r.id === 'angleB');
  const angleC = results.find(r => r.id === 'angleC');
  const sideA = results.find(r => r.id === 'sideALabel');
  const sideB = results.find(r => r.id === 'sideBLabel');
  const sideC = results.find(r => r.id === 'sideCLabel');
  const areaRow = results.find(r => r.id === 'area');
  const perimRow = results.find(r => r.id === 'perimeter');

  if (!angleA || !angleB || !angleC || !sideA || !sideB || !sideC) return null;

  const a = parseFloat(sideA.value);
  const b = parseFloat(sideB.value);
  const c = parseFloat(sideC.value);
  const angC = parseFloat(angleC.value.replace('°', ''));

  // SVG coordinates: place C at origin, A on x-axis
  const radC = toRad(angC);
  const padding = 60;
  const svgW = 450;
  const svgH = 380;

  // Raw coordinates
  const rawVertices: VertexCoords[] = [
    { x: 0, y: 0, label: 'C', angle: angC, side: a },
    { x: b, y: 0, label: 'A', angle: parseFloat(angleA.value.replace('°', '')), side: c },
    { x: a * Math.cos(radC), y: a * Math.sin(radC), label: 'B', angle: parseFloat(angleB.value.replace('°', '')), side: b },
  ];

  // Find bounding box and scale
  const xs = rawVertices.map(v => v.x);
  const ys = rawVertices.map(v => v.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const scaleX = (svgW - padding * 2) / rangeX;
  const scaleY = (svgH - padding * 2) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  // Center the triangle
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const transform = (v: VertexCoords) => ({
    x: (v.x - centerX) * scale + svgW / 2,
    y: (v.y - centerY) * scale + svgH / 2,
  });

  const pts = rawVertices.map(transform);

  // Midpoints for side labels
  const sideLabels = [
    { x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y, label: `b = ${sideB.value}` },
    { x1: pts[1].x, y1: pts[1].y, x2: pts[2].x, y2: pts[2].y, label: `c = ${sideC.value}` },
    { x1: pts[2].x, y1: pts[2].y, x2: pts[0].x, y2: pts[0].y, label: `a = ${sideA.value}` },
  ];

  const midpoints = sideLabels.map(sl => ({
    x: (sl.x1 + sl.x2) / 2,
    y: (sl.y1 + sl.y2) / 2,
    label: sl.label,
  }));

  // Angle arcs
  const arcRadius = 30;
  const angleArcs = [
    { center: pts[0], start: pts[2], end: pts[1], label: angleC.value },  // C
    { center: pts[1], start: pts[0], end: pts[2], label: angleA.value },  // A
    { center: pts[2], start: pts[1], end: pts[0], label: angleB.value },  // B
  ];

  const pointStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0-4h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Triangle Visualization</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Type badge */}
        {typeRow && (
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
              {typeRow.value}
            </span>
          </div>
        )}

        {/* SVG */}
        <div className="flex justify-center">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xs h-auto" role="img" aria-label="Triangle diagram showing side lengths and angle labels">
            {/* Triangle fill */}
            <polygon points={pointStr} fill="rgba(59, 130, 246, 0.08)" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />

            {/* Side labels at midpoints */}
            {midpoints.map((mp, i) => (
              <text
                key={`side-${i}`}
                x={mp.x}
                y={mp.y - 8}
                textAnchor="middle"
                className="text-[13px]"
                fill="#64748b"
                fontSize="13"
              >
                {mp.label}
              </text>
            ))}

            {/* Vertex labels */}
            {pts.map((p, i) => (
              <g key={`vertex-${i}`}>
                <circle cx={p.x} cy={p.y} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                <text
                  x={p.x}
                  y={p.y - 14}
                  textAnchor="middle"
                  className="text-sm"
                  fill="#1e293b"
                  fontSize="16"
                  fontWeight="bold"
                >
                  {rawVertices[i].label}
                </text>
              </g>
            ))}

            {/* Angle arcs */}
            {angleArcs.map((arc, i) => {
              const dx1 = arc.start.x - arc.center.x;
              const dy1 = arc.start.y - arc.center.y;
              const dx2 = arc.end.x - arc.center.x;
              const dy2 = arc.end.y - arc.center.y;
              const angle1 = Math.atan2(dy1, dx1) * (180 / Math.PI);
              const angle2 = Math.atan2(dy2, dx2) * (180 / Math.PI);

              // SVG arc path
              const startAngle = Math.min(angle1, angle2);
              const sweepAngle = Math.abs(angle2 - angle1);
              const endAngle = startAngle + sweepAngle;

              const sr = toRad(startAngle);
              const er = toRad(endAngle);
              const ax = arc.center.x + arcRadius * Math.cos(sr);
              const ay = arc.center.y + arcRadius * Math.sin(sr);
              const bx = arc.center.x + arcRadius * Math.cos(er);
              const by = arc.center.y + arcRadius * Math.sin(er);
              const largeArc = sweepAngle > 180 ? 1 : 0;

              // Label position (on the arc bisector)
              const midAngle = toRad(startAngle + sweepAngle / 2);
              const labelR = arcRadius + 20;
              const lx = arc.center.x + labelR * Math.cos(midAngle);
              const ly = arc.center.y + labelR * Math.sin(midAngle);

              return (
                <g key={`angle-${i}`}>
                  <path
                    d={`M ${ax.toFixed(1)} ${ay.toFixed(1)} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${bx.toFixed(1)} ${by.toFixed(1)}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    className="text-[11px]"
                    fill="#d97706"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {arc.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Angle and side summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Angles</p>
            <div className="space-y-0.5 text-xs font-mono text-slate-700">
              <p>A = {angleA.value}</p>
              <p>B = {angleB.value}</p>
              <p>C = {angleC.value}</p>
              <p className="border-t border-slate-200 pt-0.5 mt-0.5">Sum = {parseFloat(angleA.value) + parseFloat(angleB.value) + parseFloat(angleC.value)}°</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Sides &amp; Measures</p>
            <div className="space-y-0.5 text-xs font-mono text-slate-700">
              <p>a = {sideA.value}</p>
              <p>b = {sideB.value}</p>
              <p>c = {sideC.value}</p>
              <p className="border-t border-slate-200 pt-0.5 mt-0.5">Perimeter = {perimRow?.value}</p>
              <p>Area = {areaRow?.value}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
