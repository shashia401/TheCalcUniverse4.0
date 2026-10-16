import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { parseNumberStrict } from '../../../utils/parseNumber';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface Win {
  cx: number;
  cy: number;
  r: number;
}

/** The part of the line a·x + b·y = c inside a square window, as points (vertical lines handled separately). */
function clipLine(a: number, b: number, c: number, w: Win): { x: number; y: number }[] {
  if (a === 0 && b === 0) return [];
  if (b === 0) {
    const x0 = c / a;
    return Math.abs(x0 - w.cx) <= w.r ? [{ x: x0, y: w.cy - w.r }, { x: x0, y: w.cy + w.r }] : [];
  }
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = w.cx - w.r + (2 * w.r * i) / 120;
    const y = (c - a * x) / b;
    if (Math.abs(y - w.cy) <= w.r) pts.push({ x, y });
  }
  return pts;
}

export default function SystemOfEquationsPanel({ values, results }: Props) {
  const [a1, b1, c1, a2, b2, c2] = ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'].map((k) => parseNumberStrict(values[k]));
  const valid = [a1, b1, c1, a2, b2, c2].every(Number.isFinite);

  const detResult = results.find((r) => r.id === 'determinant');
  const xResult = results.find((r) => r.id === 'x');
  const yResult = results.find((r) => r.id === 'y');
  // The exact solution is passed in a hidden result row, so the plot never re-derives it from rounded text.
  const solution: [number, number] | null = useMemo(() => {
    try {
      const raw = results.find((r) => r.id === '_solution')?.value;
      return raw ? (JSON.parse(raw) as [number, number]) : null;
    } catch {
      return null;
    }
  }, [results]);

  const lines = useMemo(() => {
    if (!valid) return null;
    const w: Win = solution
      ? { cx: solution[0], cy: solution[1], r: Math.max(3, 1.5 * Math.max(Math.abs(solution[0]), Math.abs(solution[1]))) }
      : { cx: 0, cy: 0, r: 6 };
    return [clipLine(a1, b1, c1, w), clipLine(a2, b2, c2, w)];
  }, [valid, solution, a1, b1, c1, a2, b2, c2]);

  if (!valid || !lines) return null;
  const showChart = lines.some((l) => l.length > 1);
  const eq1 = `${a1}x + ${b1}y = ${c1}`;
  const eq2 = `${a2}x + ${b2}y = ${c2}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">System of Equations Graph</span>
      </div>

      <div className="p-5 space-y-4">
        {showChart && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Linear System — Two Lines</p>
            <SvgLineChart
              height={280}
              ariaLabel={`Graph of the lines ${eq1} (blue) and ${eq2} (orange)${solution ? `; they intersect at (${+solution[0].toPrecision(6)}, ${+solution[1].toPrecision(6)})` : '; they do not intersect in exactly one point'}`}
              series={[
                { name: eq1, color: '#2563eb', points: lines[0] },
                { name: eq2, color: '#c2410c', points: lines[1] },
              ]}
              refLines={[{ y: 0, color: '#cbd5e1', dashed: false }, { x: 0, color: '#cbd5e1', dashed: false }]}
              dots={solution ? [{ x: solution[0], y: solution[1], label: `(${+solution[0].toPrecision(5)}, ${+solution[1].toPrecision(5)})`, color: '#7c3aed' }] : []}
            />
            <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-600 inline-block" />
                {eq1}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 inline-block" style={{ background: '#c2410c' }} />
                {eq2}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {detResult && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{detResult.label}</p>
              <p className="text-lg font-mono font-bold text-slate-700 mt-0.5 break-all">{detResult.value}</p>
            </div>
          )}
          {solution && xResult && yResult && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold text-purple-800 uppercase">Solution</p>
              <p className="text-lg font-mono font-bold text-purple-800 mt-0.5 break-all">
                ({xResult.value}, {yResult.value})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
