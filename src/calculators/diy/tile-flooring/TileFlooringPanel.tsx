import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function TileFlooringPanel({ results }: Props) {
  const sqFt = results.find(r => r.id === 'sqFt');
  const tiles = results.find(r => r.id === 'tiles');
  const boxes = results.find(r => r.id === 'boxes');
  const roomArea = results.find(r => r.id === 'roomArea');
  const cost = results.find(r => r.id === 'cost');

  if (!sqFt) return null;

  const sqftVal = parseNum(sqFt.value);
  const roomVal = roomArea ? parseNum(roomArea.value) : 0;
  const maxArea = Math.max(sqftVal, roomVal);

  const bar = (label: string, val: number, color: string) => {
    const pct = maxArea > 0 ? (val / maxArea) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 10 ? 'min-w-[45px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
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
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Tile Estimate</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Total Sq Ft Needed</p>
          <p className="text-3xl font-bold text-blue-700">{sqFt.value}</p>
        </div>
        {roomVal > 0 && bar('Room Area', roomVal, 'bg-slate-400')}
        {bar('Total with Waste', sqftVal, 'bg-blue-500')}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {tiles && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Tiles</p>
              <p className="text-base font-bold text-slate-700">{tiles.value}</p>
            </div>
          )}
          {boxes && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Boxes</p>
              <p className="text-base font-bold text-slate-700">{boxes.value}</p>
            </div>
          )}
        </div>
        {cost && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-800 font-semibold">Estimated Cost</span>
              <span className="text-lg font-bold text-emerald-700">{cost.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
