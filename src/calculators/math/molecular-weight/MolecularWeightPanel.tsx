import React from 'react';
import type { CalculatorResult } from '../../../types/calculator';
import { findResult as getResult } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ElementBreakdown {
  element: string;
  count: number;
  mass: number;
  percentage: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseBreakdown(json: string | undefined): ElementBreakdown[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

/** Render a chemical formula with proper subscripts. */
function renderFormula(formula: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < formula.length) {
    // Check for unicode subscripts
    if (/[₀₁₂₃₄₅₆₇₈₉]/.test(formula[i])) {
      parts.push(<sub key={key++}>{formula[i]}</sub>);
      i++;
    } else if (/[0-9]/.test(formula[i])) {
      const numStart = i;
      while (i < formula.length && /[0-9]/.test(formula[i])) i++;
      parts.push(<sub key={key++}>{formula.slice(numStart, i)}</sub>);
    } else {
      parts.push(<span key={key++}>{formula[i]}</span>);
      i++;
    }
  }

  return parts;
}

// ─── SVG Donut Chart ───────────────────────────────────────────────────────────

interface Slice {
  element: string;
  percentage: number;
  color: string;
}

const ELEMENT_COLORS: Record<string, string> = {
  H: '#3B82F6', He: '#818CF8', Li: '#A78BFA', C: '#6B7280',
  N: '#8B5CF6', O: '#EF4444', F: '#10B981', Na: '#F59E0B',
  Mg: '#F97316', Al: '#84CC16', Si: '#6366F1', P: '#EC4899',
  S: '#EAB308', Cl: '#22D3EE', K: '#D946EF', Ca: '#0EA5E9',
  Fe: '#F43F5E', Cu: '#D97706', Br: '#8B5CF6', Ag: '#94A3B8',
  I: '#7C3AED', Ba: '#059669', Au: '#F59E0B', Hg: '#DC2626',
  Pb: '#475569',
};

function getColor(element: string): string {
  return ELEMENT_COLORS[element] || '#94A3B8';
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

function DonutChart({ slices }: { slices: Slice[] }) {
  const cx = 80;
  const cy = 80;
  const r = 70;
  const innerR = 40;

  let currentAngle = 0;

  const arcs = slices.map((slice) => {
    const sliceAngle = (slice.percentage / 100) * 360;
    const start = currentAngle;
    const end = currentAngle + sliceAngle;
    currentAngle = end;
    return { ...slice, startAngle: start, endAngle: end };
  });

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Molecular composition donut chart">
      <circle cx={cx} cy={cy} r={r} fill="#F1F5F9" />
      {arcs.map((arc) => (
        <path
          key={arc.element}
          d={describeArc(cx, cy, r, arc.startAngle, arc.endAngle)}
          fill={arc.color}
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />
      ))}
      <circle cx={cx} cy={cy} r={innerR} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth={1} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#475569">100%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#64748B">Mass</text>
      {arcs.map((arc) => {
        if (arc.percentage < 5) return null;
        const midAngle = (arc.startAngle + arc.endAngle) / 2;
        const p = polarToCartesian(cx, cy, r * 0.6, midAngle);
        return (
          <text
            key={`label-${arc.element}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontWeight="bold"
            fill="#FFFFFF"
          >
            {arc.element}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export default function MolecularWeightPanel({ results }: Props) {
  const mwResult = getResult(results, 'molecularWeight');
  const formulaResult = getResult(results, 'formula');
  const breakdownResult = getResult(results, '_elementBreakdown');
  const totalAtomsResult = getResult(results, 'totalAtoms');
  const formulaUnitsResult = getResult(results, 'formulaUnits');

  if (!mwResult || !formulaResult || !breakdownResult) return null;

  const breakdown = parseBreakdown(breakdownResult.value);
  const formula = formulaResult.value;
  const totalAtoms = totalAtomsResult ? totalAtomsResult.value : '0';
  const formulaUnits = formulaUnitsResult ? formulaUnitsResult.value : '';

  const sorted = [...breakdown].sort((a, b) => b.percentage - a.percentage);

  const slices: Slice[] = sorted.map((b) => ({
    element: b.element,
    percentage: parseFloat(b.percentage.toFixed(1)),
    color: getColor(b.element),
  }));

  const barColors = [
    'bg-blue-500', 'bg-red-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-purple-500', 'bg-cyan-500', 'bg-pink-500', 'bg-lime-500',
    'bg-orange-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500',
    'bg-sky-500', 'bg-fuchsia-500', 'bg-violet-500', 'bg-yellow-500',
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Molecular Weight Analysis
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Top Row: Big MW Result + Donut Chart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Large MW Display */}
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Molecular Weight
            </p>
            <p className="text-3xl font-bold font-mono text-emerald-700">
              {mwResult.value}
              <span className="text-base font-medium ml-1">g/mol</span>
            </p>
            <div className="mt-2 flex gap-3 text-[10px] text-slate-500">
              <span>{totalAtoms} atoms total</span>
              {formulaUnits && <span className="text-cyan-600">{formulaUnits}</span>}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Mass Composition
            </p>
            <DonutChart slices={slices} />
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {slices.slice(0, 6).map((s) => (
                <div key={s.element} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                  <span className="text-[9px] font-medium text-slate-600">{s.element} {s.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Formula Display */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Chemical Formula
          </p>
          <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 text-center">
            <code className="text-lg font-bold font-mono text-slate-700">
              {renderFormula(formula)}
            </code>
          </div>
        </div>

        {/* Element Breakdown Table with Mass Proportion Bars */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 bg-white">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Element Breakdown
            </p>
          </div>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th scope="col" className="text-left pb-2 font-semibold">Element</th>
                  <th scope="col" className="text-right pb-2 font-semibold">Count</th>
                  <th scope="col" className="text-right pb-2 font-semibold">Mass (g/mol)</th>
                  <th scope="col" className="text-right pb-2 font-semibold">Percentage</th>
                  <th scope="col" className="pb-2" style={{ width: '40%' }}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b, idx) => {
                  const barColor = barColors[idx % barColors.length];
                  const barWidth = Math.max(b.percentage, 1);
                  return (
                    <tr key={b.element} className="border-b border-slate-100">
                      <td className="py-2 font-semibold text-slate-700">{b.element}</td>
                      <td className="py-2 text-right font-mono text-slate-600">{b.count}</td>
                      <td className="py-2 text-right font-mono text-slate-600">{b.mass.toFixed(3)}</td>
                      <td className="py-2 text-right font-mono text-slate-600">{b.percentage.toFixed(1)}%</td>
                      <td className="py-2">
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className={`${barColor} h-3 rounded-full transition-all`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 font-semibold text-slate-700">
                  <td className="pt-2">Total</td>
                  <td className="pt-2 text-right font-mono">{totalAtoms}</td>
                  <td className="pt-2 text-right font-mono">{mwResult.value}</td>
                  <td className="pt-2 text-right font-mono">100%</td>
                  <td className="pt-2">
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="bg-slate-600 h-3 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Atomic Weight Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 bg-white">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Atomic Weight Reference
            </p>
          </div>
          <div className="p-4">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              The molecular weight is calculated by summing each element&rsquo;s atomic weight multiplied by its count in the formula.
              Atomic weights are standard values from the periodic table (IUPAC).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
