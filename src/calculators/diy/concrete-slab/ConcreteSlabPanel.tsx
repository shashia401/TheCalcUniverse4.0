import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function ConcreteSlabPanel({ results }: Props) {
  const cubicYards = results.find(r => r.id === 'cubicYards');
  const cubicFeet = results.find(r => r.id === 'cubicFeet');
  const bags60 = results.find(r => r.id === 'bags60');
  const bags80 = results.find(r => r.id === 'bags80');

  if (!cubicYards) return null;

  const ydVal = parseNum(cubicYards.value);
  const bags60Val = bags60 ? parseInt(bags60.value) : 0;
  const bags80Val = bags80 ? parseInt(bags80.value) : 0;
  const maxVal = Math.max(ydVal, bags60Val * 0.03 || 0, bags80Val * 0.04 || 0);

  const bar = (label: string, val: number, max: number, color: string, unit: string) => {
    const pct = max > 0 ? (val / max) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
        <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 12 ? 'min-w-[50px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[10px] font-bold text-white drop-shadow-sm">{val.toFixed(2)} {unit}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Concrete Volume</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Cubic Yards Needed</p>
          <p className="text-3xl font-bold text-emerald-700">{cubicYards.value}</p>
        </div>
        {cubicFeet && bar('Cubic Feet', parseNum(cubicFeet.value), parseNum(cubicFeet.value), 'bg-blue-500', 'ft')}
        {bags60 && bar('60-lb Bags', bags60Val * 0.6, maxVal, 'bg-amber-500', 'bags')}
        {bags80 && bar('80-lb Bags', bags80Val * 0.8, maxVal, 'bg-orange-500', 'bags')}
      </div>
    </div>
  );
}
