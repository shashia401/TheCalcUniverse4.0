// Shared result block for the triangle calculators: side-length bars, a to-scale drawing and three side/angle cards.
// It reads the unrounded solution from the hidden "_triangle" result row instead of re-parsing display strings.

import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { type Tri, fmtAngle, fmtNum8, type AngleUnit } from './triangle';

export function readTriangle(results: CalculatorResult[], id = '_triangle'): Tri | null {
  try {
    const raw = results.find((r) => r.id === id)?.value;
    if (!raw) return null;
    const t = JSON.parse(raw) as Tri;
    return [t.a, t.b, t.c, t.A, t.B, t.C].every(Number.isFinite) ? t : null;
  } catch {
    return null;
  }
}

const SIDE_COLORS = ['#2563eb', '#059669', '#d97706'];

/** Triangle with vertex C at the origin, B on the x-axis (side a), A above: to-scale outline. */
function Drawing({ t }: { t: Tri }) {
  const W = 260;
  const H = 150;
  const pad = 22;
  const C = { x: 0, y: 0 };
  const B = { x: t.a, y: 0 };
  const A = { x: t.b * Math.cos((t.C * Math.PI) / 180), y: t.b * Math.sin((t.C * Math.PI) / 180) };
  const xs = [C.x, B.x, A.x];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = A.y;
  const scale = Math.min((W - 2 * pad) / Math.max(maxX - minX, 1e-12), (H - 2 * pad) / Math.max(maxY, 1e-12));
  const px = (p: { x: number; y: number }) => `${(pad + (p.x - minX) * scale).toFixed(1)},${(H - pad - p.y * scale).toFixed(1)}`;
  const lab = (p: { x: number; y: number }, dx: number, dy: number, s: string) => {
    const [x, y] = px(p).split(',').map(Number);
    return (
      <text x={x + dx} y={y + dy} fontSize="12" fontWeight="700" fill="#334155" textAnchor="middle">
        {s}
      </text>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto" role="img" aria-label={`Triangle drawn to scale: sides a = ${fmtNum8(t.a)}, b = ${fmtNum8(t.b)}, c = ${fmtNum8(t.c)}`}>
      <polygon points={`${px(C)} ${px(B)} ${px(A)}`} fill="#eff6ff" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
      {lab(A, 0, -8, 'A')}
      {lab(B, 10, 14, 'B')}
      {lab(C, -10, 14, 'C')}
    </svg>
  );
}

export default function TriangleSolution({ t, unit, sideNote }: { t: Tri; unit: AngleUnit; sideNote?: [string, string, string] }) {
  const data = [
    { label: 'Side a', value: t.a, color: SIDE_COLORS[0] },
    { label: 'Side b', value: t.b, color: SIDE_COLORS[1] },
    { label: 'Side c', value: t.c, color: SIDE_COLORS[2] },
  ];
  const cards = [
    { s: 'a', side: t.a, ang: t.A, an: 'A', cls: 'border-blue-200 bg-blue-50', txt: 'text-blue-800' },
    { s: 'b', side: t.b, ang: t.B, an: 'B', cls: 'border-emerald-200 bg-emerald-50', txt: 'text-emerald-800' },
    { s: 'c', side: t.c, ang: t.C, an: 'C', cls: 'border-amber-200 bg-amber-50', txt: 'text-amber-800' },
  ];
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Side Lengths</p>
        <SvgBarChart data={data} height={190} ariaLabel={`Bar chart of side lengths: a = ${fmtNum8(t.a)}, b = ${fmtNum8(t.b)}, c = ${fmtNum8(t.c)}`} maxBarWidth={60} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Triangle (to scale)</p>
        <Drawing t={t} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c, i) => (
          <div key={c.s} className={`rounded-lg border p-3 text-center ${c.cls}`}>
            <p className={`text-[10px] font-bold uppercase ${c.txt}`}>{sideNote ? sideNote[i] : `Side ${c.s}`}</p>
            <p className={`text-sm font-mono font-bold ${c.txt} break-all`}>{fmtNum8(c.side)}</p>
            <p className={`text-[11px] ${c.txt}`}>∠{c.an} = {fmtAngle(c.ang, unit)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
