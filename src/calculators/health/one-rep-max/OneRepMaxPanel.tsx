import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function OneRepMaxPanel({ values, results }: Props) {
  const oneRM = results.find(r => r.id === 'oneRepMax');
  const basedOn = results.find(r => r.id === 'maxBasedOn');
  const epleyLine = results.find(r => r.id === 'epleyLine');
  const brzyckiLine = results.find(r => r.id === 'brzyckiLine');
  const lombardiLine = results.find(r => r.id === 'lombardiLine');

  if (!oneRM || !basedOn || !epleyLine || !brzyckiLine || !lombardiLine) return null;

  const unit = values.unit === 'kg' ? 'kg' : 'lbs';

  const parseNum = (s: string) => {
    const m = s.replace(/,/g, '').match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  };

  const primary = parseNum(oneRM.value);
  const epley = parseNum(epleyLine.value);
  const brzycki = parseNum(brzyckiLine.value);
  const lombardi = parseNum(lombardiLine.value);

  // Percentage breakdown. Zones match the guide below and the educational text.
  const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
  const breakdown = pcts.map(pct => ({
    pct,
    weight: Math.round(primary * pct / 100),
    zone: pct >= 93 ? 'Max Effort' : pct >= 85 ? 'Strength' : pct >= 65 ? 'Hypertrophy' : 'Light / Speed',
  }));

  // -700 backgrounds keep the white value labels at >= 4.5:1.
  const formulas = [
    { key: 'epley', label: 'Epley', val: epley, desc: '1RM = w × (1 + r/30)' },
    { key: 'brzycki', label: 'Brzycki', val: brzycki, desc: '1RM = w × 36 / (37 − r)' },
    { key: 'lombardi', label: 'Lombardi', val: lombardi, desc: '1RM = w × r^0.10' },
  ].map(f => ({ ...f, isPrimary: Math.abs(f.val - primary) < 0.5 }));

  const maxVal = Math.max(epley, brzycki, lombardi);

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
        <div className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-5 py-4 text-white">
          <p className="text-[11px] text-blue-100 mb-1">{basedOn.value}</p>
          <p className="text-2xl font-bold">{oneRM.value}</p>
          <p className="text-[11px] text-blue-100 mt-1">Estimated 1 Rep Max</p>
        </div>

        {/* Formula comparison */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Formula Comparison</p>
          <div role="group" aria-label={`Estimated one rep max by formula, in ${unit}`}>
            {formulas.map((f) => (
              <HBarRow
                key={f.key}
                label={f.isPrimary ? `${f.label} ✓` : f.label}
                labelWidth="w-24"
                height="h-5"
                value={f.val}
                max={maxVal}
                color={f.isPrimary ? 'bg-blue-700' : 'bg-slate-600'}
                display={f.val.toLocaleString()}
              />
            ))}
          </div>
          <ul className="mt-2 space-y-0.5 text-[10px] text-slate-600">
            {formulas.map((f) => (
              <li key={f.key}><span className="font-bold">{f.label}:</span> {f.desc}</li>
            ))}
          </ul>
          <p className="mt-1 text-[10px] text-slate-600">✓ marks the formula you selected.</p>
        </div>

        {/* % Breakdown Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="One-rep max percentage breakdown table">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">% of 1RM</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Weight</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Training Zone</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row, i) => (
                <tr key={row.pct} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-2 font-bold text-slate-700">{row.pct}%</td>
                  <td className="px-3 py-2 text-center font-bold text-slate-900 tabular-nums">{row.weight.toLocaleString()} {unit}</td>
                  <td className="px-3 py-2 text-center text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                      row.zone === 'Max Effort' ? 'bg-red-100 text-red-700'
                      : row.zone === 'Strength' ? 'bg-amber-100 text-amber-800'
                      : row.zone === 'Hypertrophy' ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Training Zone Guide</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span className="text-slate-600">93%+ Max Effort (1–3 reps)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span className="text-slate-600">85–93% Strength (3–6 reps)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="text-slate-600">65–85% Hypertrophy (6–12 reps)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-slate-600">Below 65% Light / Speed work</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
