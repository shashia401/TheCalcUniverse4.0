import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function OneRepMaxPanel({ results }: Props) {
  const oneRM = results.find(r => r.id === 'oneRepMax');
  const basedOn = results.find(r => r.id === 'maxBasedOn');
  const epleyLine = results.find(r => r.id === 'epleyLine');
  const brzyckiLine = results.find(r => r.id === 'brzyckiLine');
  const lombardiLine = results.find(r => r.id === 'lombardiLine');

  if (!oneRM || !basedOn || !epleyLine || !brzyckiLine || !lombardiLine) return null;

  const parseNum = (s: string) => {
    const m = s.replace(/,/g, '').match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  };

  const primary = parseNum(oneRM.value);
  const epley = parseNum(epleyLine.value);
  const brzycki = parseNum(brzyckiLine.value);
  const lombardi_val = parseNum(lombardiLine.value);

  // Percentage breakdown
  const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
  const breakdown = pcts.map(pct => ({
    pct,
    weight: Math.round(primary * pct / 100),
    zone: pct >= 93 ? 'Max Effort' : pct >= 85 ? 'Strength' : pct >= 65 ? 'Hypertrophy' : 'Power / Recovery',
  }));

  const [hoverFormula, setHoverFormula] = useState<string | null>(null);

  // Formula details
  const formulas = [
    { key: 'epley', label: 'Epley', val: epley, desc: '1RM = w × (1 + r/30)', fullDesc: 'The Epley formula tends to be most accurate for higher rep ranges (5-10 reps). Developed by Boyd Epley, it is one of the most widely used 1RM prediction equations.', isPrimary: Math.abs(epley - primary) < 0.5 },
    { key: 'brzycki', label: 'Brzycki', val: brzycki, desc: '1RM = w × 36/(37 − r)', fullDesc: 'The Brzycki formula is most accurate for moderate rep ranges (3-5 reps). Developed by Matt Brzycki, it tends to give slightly lower estimates than Epley at higher reps.', isPrimary: Math.abs(brzycki - primary) < 0.5 },
    { key: 'lombardi', label: 'Lombardi', val: lombardi_val, desc: '1RM = w × r^0.10', fullDesc: 'The Lombardi formula uses an exponential approach and can produce different results at very high or very low rep ranges. Developed by V. Lombardi for athletic populations.', isPrimary: Math.abs(lombardi_val - primary) < 0.5 },
  ];

  const maxVal = Math.max(epley, brzycki, lombardi_val);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Percentage Breakdown & Formula Comparison</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary */}
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 text-white">
          <p className="text-[11px] opacity-80 mb-1">{basedOn.value}</p>
          <p className="text-2xl font-bold">{oneRM.value}</p>
          <p className="text-[11px] opacity-80 mt-1">Estimated 1 Rep Max</p>
        </div>

        {/* Formula comparison */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Formula Comparison</p>
          {formulas.map((f) => {
            const w = maxVal > 0 ? (f.val / maxVal) * 100 : 0;
            const isHovered = hoverFormula === f.key;
            return (
              <div key={f.key}>
                <div
                  onMouseEnter={() => setHoverFormula(f.key)}
                  onMouseLeave={() => setHoverFormula(null)}
                  className={`flex items-center gap-2 py-1.5 cursor-pointer transition-all ${
                    f.isPrimary ? 'bg-blue-50/50 -mx-4 px-4 rounded-lg' : ''
                  } ${isHovered ? 'bg-indigo-50/70 -mx-4 px-4 rounded-lg' : ''}`}
                >
                  <span className="text-[11px] font-semibold text-slate-600 w-20 flex-shrink-0">{f.label}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                    <div className={`h-full rounded flex items-center justify-end pr-1 transition-all ${isHovered ? 'bg-indigo-500' : 'bg-blue-500'}`} style={{ width: `${Math.max(w, 5)}%` }}>
                      <span className="text-[9px] font-bold text-white drop-shadow-sm">{f.val.toLocaleString()}</span>
                    </div>
                  </div>
                  {f.isPrimary && <span className="text-[9px] font-bold text-blue-600">Selected</span>}
                </div>
                {/* Hover tooltip — inline below bar */}
                {isHovered && (
                  <div className="mt-1 ml-20 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[10px]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-bold text-indigo-700">{f.label} Formula</span>
                    </div>
                    <p className="text-indigo-600 mb-0.5"><strong>Equation:</strong> {f.desc}</p>
                    <p className="text-slate-500">{f.fullDesc}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* % Breakdown Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">% of 1RM</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Weight</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Training Zone</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row, i) => (
                <tr key={row.pct} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-2 font-bold text-slate-700">{row.pct}%</td>
                  <td className="px-3 py-2 text-center font-bold text-slate-900 tabular-nums">{row.weight.toLocaleString()} lbs</td>
                  <td className="px-3 py-2 text-center text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                      row.zone === 'Max Effort' ? 'bg-red-100 text-red-700'
                      : row.zone === 'Strength' ? 'bg-amber-100 text-amber-700'
                      : row.zone === 'Hypertrophy' ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                      {row.zone}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Training zone guide */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Training Zone Guide</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-slate-600">93%+ Max Effort (1–3 reps)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-600">85–93% Strength (3–5 reps)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-600">65–85% Hypertrophy (6–12 reps)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-slate-600">50–65% Power/Recovery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
