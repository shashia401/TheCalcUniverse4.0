import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ColorConverterPanel({ results }: Props) {
  const hexRow = results.find(r => r.id === 'hex');
  const rgbRow = results.find(r => r.id === 'rgb');
  const hslRow = results.find(r => r.id === 'hsl');

  if (!hexRow) return null;

  const hex = hexRow.value;
  const rgb = rgbRow?.value || '';
  const hsl = hslRow?.value || '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Color Preview</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Color swatch */}
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-2xl border-2 border-slate-200 shadow-lg" style={{ backgroundColor: hex }} />
        </div>

        {/* Color values */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase">HEX</p>
            <p className="text-[11px] font-bold font-mono text-slate-700 truncate">{hex}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase">RGB</p>
            <p className="text-[11px] font-bold font-mono text-slate-700 truncate">{rgb.replace(/^rgb\(|\)$/g, '')}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase">HSL</p>
            <p className="text-[11px] font-bold font-mono text-slate-700 truncate">{hsl.replace(/^hsl\(|\)$/g, '')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
