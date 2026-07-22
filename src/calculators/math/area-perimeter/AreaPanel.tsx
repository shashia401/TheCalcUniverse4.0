import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

/* ------------------------------------------------------------------ */
/*  Utility: find a result row by any of several possible IDs          */
/* ------------------------------------------------------------------ */
function r(results: CalculatorResult[], id: string) {
  return results.find(x => x.id === id);
}

const S = 360;
const C = S / 2;
const TXT = { fontSize: '14', fontWeight: 'bold' as const };

/* ------------------------------------------------------------------ */
/*  Shape diagram – shows the actual dimensions on a 360×360 SVG      */
/* ------------------------------------------------------------------ */
function ShapeDiagram({ shape, d1, d2, d3 }: { shape: string; d1: number; d2: number; d3: number }) {
  /* scale helpers – keep shapes visible for tiny or huge inputs */
  const scale = (v: number, maxPx: number, minPx = 28) => Math.min(Math.max(v * 3, minPx), maxPx);

  switch (shape) {
    /* ===== CIRCLE ===== */
    case 'circle': {
      const r = Math.max(Math.min(d1 * 5, 70), 25);
      return (
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Circle diagram showing radius and diameter">
          <circle cx={C} cy={C - 6} r={r} fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="2.5" />
          <circle cx={C} cy={C - 6} r="4" fill="#3b82f6" />
          {/* Radius */}
          <line x1={C} y1={C - 6} x2={C + r} y2={C - 6} stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
          <text x={C + r / 2} y={C - 14} textAnchor="middle" fill="#ef4444" {...TXT}>r = {d1}</text>
          {/* Diameter */}
          <line x1={C - r} y1={C + 10} x2={C + r} y2={C + 10} stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
          <text x={C} y={C + 24} textAnchor="middle" fill="#10b981" {...TXT}>d = {2 * d1}</text>
        </svg>
      );
    }

    /* ===== RECTANGLE ===== */
    case 'rectangle': {
      const w = scale(d1, 90);
      const h = scale(Math.max(d2, 0.1) || 20, 80);
      const x = C - w / 2, y = C - h / 2 + 10;
      return (
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Rectangle diagram showing width, length, and diagonal">
          <rect x={x} y={y} width={w} height={h} fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="2" rx="2" />
          {/* Width label */}
          <line x1={x} y1={y + h + 6} x2={x + w} y2={y + h + 6} stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
          <text x={x + w / 2} y={y + h + 18} textAnchor="middle" fill="#ef4444" {...TXT}>w = {d2}</text>
          {/* Height label */}
          <line x1={x - 6} y1={y} x2={x - 6} y2={y + h} stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
          <text x={x - 6} y={y + h / 2} textAnchor="end" dominantBaseline="central" fill="#10b981" {...TXT}>l = {d1}</text>
          {/* Diagonal */}
          <line x1={x} y1={y} x2={x + w} y2={y + h} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={x + w / 2 + 4} y={y + h / 2 - 6} textAnchor="start" fill="#94a3b8" fontSize="11">d = √(l²+w²)</text>
          {/* Area inside */}
          <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" fill="#6366f1" fontSize="14" fontStyle="italic">
            A = l × w
          </text>
        </svg>
      );
    }

    /* ===== SQUARE ===== */
    case 'square': {
      const s = Math.max(Math.min(d1 * 5, 90), 30);
      const x = C - s / 2, y = C - s / 2 + 10;
      return (
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Square diagram showing side length and diagonal">
          <rect x={x} y={y} width={s} height={s} fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="2" rx="2" />
          {/* Side label */}
          <line x1={x} y1={y + s + 6} x2={x + s} y2={y + s + 6} stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
          <text x={x + s / 2} y={y + s + 18} textAnchor="middle" fill="#ef4444" {...TXT}>s = {d1}</text>
          {/* Diagonal */}
          <line x1={x} y1={y} x2={x + s} y2={y + s} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Area inside */}
          <text x={x + s / 2} y={y + s / 2} textAnchor="middle" dominantBaseline="central" fill="#6366f1" fontSize="14" fontStyle="italic">
            A = s²
          </text>
        </svg>
      );
    }

    /* ===== TRIANGLE ===== */
    case 'triangle': {
      const base = scale(d1, 100);
      const h = scale(Math.max(d2, 0.1) || 30, 80);
      const tipX = C, tipY = C + 10 - h;
      const bl = C - base / 2, br = C + base / 2, baseY = C + 10;
      return (
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Triangle diagram showing base and height">
          <polygon points={`${tipX},${tipY} ${bl},${baseY} ${br},${baseY}`} fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="2" />
          {/* Height */}
          <line x1={tipX} y1={tipY} x2={tipX} y2={baseY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x={tipX + 5} y={tipY + (baseY - tipY) / 2} textAnchor="start" fill="#ef4444" {...TXT}>h = {d2}</text>
          {/* Base */}
          <line x1={bl} y1={baseY + 6} x2={br} y2={baseY + 6} stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
          <text x={C} y={baseY + 18} textAnchor="middle" fill="#10b981" {...TXT}>b = {d1}</text>
          {/* Area */}
          <text x={C} y={C - 2} textAnchor="middle" fill="#6366f1" fontSize="13" fontStyle="italic">A = ½bh</text>
        </svg>
      );
    }

    /* ===== TRAPEZOID ===== */
    case 'trapezoid': {
      const b1 = Math.min(d1 * 4, 80);
      const b2 = Math.min(d2 * 4, 80);
      const h = scale(Math.max(d3, 0.1) || 20, 70);
      const cy = C + 12;
      const topW = Math.max(b1, 20), botW = Math.max(b2, 20);
      const tx = C - topW / 2, bx = C - botW / 2;
      const points = `${tx},${cy - h} ${tx + topW},${cy - h} ${bx + botW},${cy} ${bx},${cy}`;
      return (
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Trapezoid diagram showing top base, bottom base, and height">
          <polygon points={points} fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="2" />
          {/* Height */}
          <line x1={tx} y1={cy - h} x2={tx} y2={cy} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
          {/* Height label */}
          <text x={tx - 6} y={cy - h / 2} textAnchor="end" dominantBaseline="central" fill="#ef4444" {...TXT}>h = {d3}</text>
          {/* Top base */}
          <line x1={tx} y1={cy - h - 6} x2={tx + topW} y2={cy - h - 6} stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
          <text x={C} y={cy - h - 14} textAnchor="middle" fill="#10b981" {...TXT}>a = {d1}</text>
          {/* Bottom base */}
          <line x1={bx} y1={cy + 6} x2={bx + botW} y2={cy + 6} stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 2" />
          <text x={C} y={cy + 18} textAnchor="middle" fill="#3b82f6" {...TXT}>b = {d2}</text>
        </svg>
      );
    }

    /* ===== PARALLELOGRAM ===== */
    case 'parallelogram': {
      const b = scale(d1, 90), side = scale(d2, 60);
      const h = scale(Math.max(d3, 0.1) || 20, 70);
      const skew = Math.min(side * 0.5, 25);
      const cy = C + 10;
      const x1 = C - b / 2 - skew / 2;
      const pts = `${x1 + skew},${cy - h} ${x1 + b + skew},${cy - h} ${x1 + b},${cy} ${x1},${cy}`;
      return (
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Parallelogram diagram showing base and height">
          <polygon points={pts} fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="2" />
          {/* Height */}
          <line x1={x1 + b} y1={cy} x2={x1 + b} y2={cy - h} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x={x1 + b + 6} y={cy - h / 2} textAnchor="start" dominantBaseline="central" fill="#ef4444" {...TXT}>h = {d3}</text>
          {/* Base */}
          <line x1={x1} y1={cy + 6} x2={x1 + b} y2={cy + 6} stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
          <text x={x1 + b / 2} y={cy + 18} textAnchor="middle" fill="#10b981" {...TXT}>b = {d1}</text>
        </svg>
      );
    }

    /* ===== HEXAGON ===== */
    case 'hexagon': {
      const side = Math.max(Math.min(d1 * 4, 75), 20);
      const pts: number[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        pts.push(C + side * Math.cos(a), C + 6 + side * Math.sin(a));
      }
      return (
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Regular hexagon diagram showing side length">
          <polygon points={pts.join(',')} fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="2" />
          <text x={C} y={C + 6 + side + 12} textAnchor="middle" fill="#ef4444" {...TXT}>s = {d1}</text>
          {/* Apothem (center to midpoint of right side) */}
          <line x1={C} y1={C + 6} x2={pts[2]} y2={(pts[3] + pts[5]) / 2} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x={C + side * 0.4} y={C + 6 - 8} textAnchor="middle" fill="#10b981" fontSize="11">a</text>
        </svg>
      );
    }

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Formula Application – shows the formula with actual values         */
/* ------------------------------------------------------------------ */
function FormulaApplication({
  shape, d1, d2, d3,
}: {
  shape: string; d1: number; d2: number; d3: number;
  perimVal: string | undefined;
}) {
  const pi = Math.PI;
  const fmt = (n: number) => parseFloat(n.toFixed(6)).toString();

  const cards: { label: string; formula: string; substitution: string; result: string }[] = [];

  const addCard = (label: string, formula: string, substitution: string, result: string) => {
    cards.push({ label, formula, substitution, result });
  };

  switch (shape) {
    case 'circle':
      addCard('Area', 'A = πr²', `π × ${d1} × ${d1}`, fmt(pi * d1 * d1));
      addCard('Circumference', 'C = 2πr', `2 × π × ${d1}`, fmt(2 * pi * d1));
      break;
    case 'rectangle':
      addCard('Area', 'A = l × w', `${d1} × ${d2}`, fmt(d1 * d2));
      addCard('Perimeter', 'P = 2(l + w)', `2 × (${d1} + ${d2}) = 2 × ${d1 + d2}`, fmt(2 * (d1 + d2)));
      break;
    case 'square':
      addCard('Area', 'A = s²', `${d1} × ${d1}`, fmt(d1 * d1));
      addCard('Perimeter', 'P = 4s', `4 × ${d1}`, fmt(4 * d1));
      break;
    case 'triangle':
      addCard('Area', 'A = ½bh', `½ × ${d1} × ${d2}`, fmt(0.5 * d1 * d2));
      if (d3 > 0) {
        addCard('Perimeter', 'P = a + b + c', `${d1} + ${d2} + ${d3}`, fmt(d1 + d2 + d3));
      }
      break;
    case 'trapezoid':
      addCard('Area', 'A = ½(a + b)h', `½ × (${d1} + ${d2}) × ${d3} = ½ × ${d1 + d2} × ${d3}`, fmt(0.5 * (d1 + d2) * d3));
      break;
    case 'parallelogram':
      addCard('Area', 'A = b × h', `${d2} × ${d3}`, fmt(d2 * d3));
      addCard('Perimeter', 'P = 2(a + b)', `2 × (${d1} + ${d2}) = 2 × ${d1 + d2}`, fmt(2 * (d1 + d2)));
      break;
    case 'hexagon':
      const hexArea = (3 * Math.sqrt(3) / 2) * d1 * d1;
      addCard('Area', 'A = (3√3/2)s²', `(3√3/2) × ${d1}²`, fmt(hexArea));
      addCard('Perimeter', 'P = 6s', `6 × ${d1}`, fmt(6 * d1));
      break;
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Formula in Action</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {cards.map((c, i) => (
          <div key={`item-${i}`} className="rounded-xl border border-blue-200 bg-blue-50/60 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{c.label}</p>
            <p className="text-sm font-mono font-bold text-slate-700">{c.formula}</p>
            {c.substitution !== '—' && (
              <p className="text-xs font-mono text-slate-500 mt-0.5">{c.substitution}</p>
            )}
            <p className="text-base font-bold text-blue-700 mt-1">{c.result}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shape insight card                                                 */
/* ------------------------------------------------------------------ */
function ShapeInsight({ shape }: { shape: string }) {
  const insights: Record<string, string> = {
    circle: 'Of all shapes with the same perimeter, a circle encloses the maximum area. This is why bubbles form spheres — nature minimizes surface area for a given volume.',
    rectangle: 'A square is the most area-efficient rectangle — for a fixed perimeter, a square maximizes the enclosed area.',
    triangle: 'Triangles are the only rigid polygon — they do not deform under pressure, making them essential in bridges, roofs, and trusses.',
    trapezoid: 'The midsegment (average of the two bases) equals the width of an equivalent rectangle with the same area and height.',
    parallelogram: 'A parallelogram has the same area formula as a rectangle (base × height) because it can be sheared into a rectangle of equal area.',
    hexagon: 'The regular hexagon tiles a plane with no gaps (like a honeycomb). It is the most area-efficient tiling shape that still has straight sides.',
  };

  const text = insights[shape];
  if (!text) return null;

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-1">Why This Matters</p>
      <p className="text-xs text-purple-800 leading-relaxed">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */
export default function AreaPanel({ values, results }: Props) {
  const [zoom, setZoom] = useState(1);
  const shape = values.shape || 'circle';
  const compound = values.compound || 'none';
  const isCompound = compound === 'rectSemi';
  const d1 = parseFloat(
    values.circleRadius || values.rectLength || values.squareSide || values.triBase || values.trapBase1 || values.paraBase || values.hexSide || '0'
  ) || 0;
  const d2 = parseFloat(
    values.rectWidth || values.triHeight || values.trapBase2 || values.paraSide || '0'
  ) || 0;
  const d3 = parseFloat(
    values.triSide || values.trapHeight || values.paraHeight || '0'
  ) || 0;

  if (!results.length) return null;

  const areaRow = r(results, 'area');
  const perimRow = r(results, 'perimeter') || r(results, 'circumference');

  /* Formula reference for all shapes */
  const shapeFormulas: Record<string, { area: string; perimeter: string }> = {
    circle: { area: 'A = πr²', perimeter: 'C = 2πr' },
    rectangle: { area: 'A = l × w', perimeter: 'P = 2(l + w)' },
    triangle: { area: 'A = ½bh', perimeter: 'P = a + b + c' },
    square: { area: 'A = s²', perimeter: 'P = 4s' },
    trapezoid: { area: 'A = ½(a + b)h', perimeter: '—' },
    parallelogram: { area: 'A = b × h', perimeter: 'P = 2(a + b)' },
    hexagon: { area: 'A = (3√3/2)s²', perimeter: 'P = 6s' },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0-4h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {isCompound ? 'Compound Shape: Rectangle + Semicircle' : `${shape.charAt(0).toUpperCase() + shape.slice(1)} Diagram & Formula`}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Shape diagram + result summary */}
        {!isCompound && (
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 relative">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}>
                <ShapeDiagram shape={shape} d1={d1} d2={d2} d3={d3} />
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-white/90 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white text-xs font-bold shadow-sm transition-colors"
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-white/90 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white text-xs font-bold shadow-sm transition-colors"
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  −
                </button>
              </div>
            </div>
            <div className="flex-1 min-w-0 self-stretch flex flex-col justify-center gap-2">
              {areaRow && (
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center sm:text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Area</p>
                  <p className="text-2xl font-bold text-blue-700">{areaRow.value} sq units</p>
                  {perimRow && <p className="text-xs text-slate-500 mt-1">Perimeter: {perimRow.value}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {results.filter(r => !['area', 'perimeter', 'circumference', 'compoundLabel'].includes(r.id)).map(rr => (
                  <div key={rr.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">{rr.label}</p>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{rr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Compound shape info */}
        {isCompound && (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Compound Shape: Rectangle + Semicircle</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Total area = rectangle area + semicircle area. The semicircle sits on top of the rectangle.
                This is useful for windows, archways, and driveways.
              </p>
              <p className="text-xs font-mono text-amber-700 mt-1">A_total = (l × w) + (πr² / 2)</p>
            </div>
            {/* Compound sub-results */}
            {(() => {
              const rectA = r(results, 'rectArea');
              const semiA = r(results, 'semiArea');
              const compR = parseFloat(values.compRadius) || 0;
              if (!rectA || !semiA) return null;
              return (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Rectangle Part</p>
                    <p className="text-sm font-mono font-bold text-blue-700">{rectA.value}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Semicircle Part</p>
                    <p className="text-sm font-mono font-bold text-emerald-700">{semiA.value} (r = {compR})</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Formula application */}
        {!isCompound && d1 > 0 && (
          <FormulaApplication shape={shape} d1={d1} d2={d2} d3={d3} perimVal={perimRow?.value} />
        )}

        {/* Formula reference grid */}
        {!isCompound && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">All Shape Formulas</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.entries(shapeFormulas).map(([key, f]) => (
                <div key={key} className={`rounded-lg border p-2 text-center ${key === shape ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">{key}</p>
                  <p className="text-[10px] font-mono text-slate-700">{f.area}</p>
                  <p className="text-[10px] font-mono text-slate-500">{f.perimeter}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shape insight */}
        {!isCompound && <ShapeInsight shape={shape} />}
      </div>
    </div>
  );
}
