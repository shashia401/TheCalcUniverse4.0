import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function DrywallPanel({ results }: Props) {
  const sheets = results.find(r => r.id === 'sheets');
  const netArea = results.find(r => r.id === 'netArea');
  const wallArea = results.find(r => r.id === 'wallArea');
  const ceilingArea = results.find(r => r.id === 'ceilingArea');

  if (!sheets) return null;

  const sheetVal = parseInt(sheets.value);
  const netVal = netArea ? parseNum(netArea.value) : 0;
  const wallVal = wallArea ? parseNum(wallArea.value) : 0;
  const ceilVal = ceilingArea && ceilingArea.value !== 'Not included' ? parseNum(ceilingArea.value) : 0;
  const maxArea = Math.max(netVal, wallVal, ceilVal);

  const bar = (label: string, val: number, color: string) => {
    const pct = maxArea > 0 ? (val / maxArea) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 10 ? 'min-w-[40px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[9px] font-bold text-white">{val.toFixed(0)} sq ft</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Drywall Estimate</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Sheets Needed</p>
          <p className="text-3xl font-bold text-blue-700">{sheets.value}</p>
        </div>
        {wallVal > 0 && bar('Wall Area', wallVal, 'bg-blue-500')}
        {ceilVal > 0 && bar('Ceiling Area', ceilVal, 'bg-purple-500')}
        {netVal > 0 && bar('Net Area (w/waste)', netVal, 'bg-emerald-500')}
      </div>
    </div>
  );
}
