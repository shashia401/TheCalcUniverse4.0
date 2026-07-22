import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function JwtDebuggerPanel({ results }: Props) {
  const validRow = results.find(r => r.id === 'isValid');
  const headerRow = results.find(r => r.id === 'header');
  const payloadRow = results.find(r => r.id === 'payload');
  const sigRow = results.find(r => r.id === 'signature');

  if (!validRow) return null;

  const isValid = validRow.value.startsWith('Valid');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Token Structure</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className={`text-xs font-bold ${isValid ? 'text-emerald-700' : 'text-red-700'}`}>
            {validRow.value}
          </span>
        </div>

        {/* Token parts visually */}
        <div className="flex items-center gap-1 text-[9px] font-mono">
          {isValid && (
            <>
              <div className="flex-1 rounded bg-blue-100 text-blue-700 px-2 py-3 text-center font-bold text-[10px] overflow-hidden">
                Header
                <div className="text-[8px] font-normal text-blue-500 mt-0.5 truncate">{headerRow?.value?.substring(0, 30)}</div>
              </div>
              <span className="text-slate-300 font-bold">.</span>
              <div className="flex-1 rounded bg-emerald-100 text-emerald-700 px-2 py-3 text-center font-bold text-[10px] overflow-hidden">
                Payload
                <div className="text-[8px] font-normal text-emerald-500 mt-0.5 truncate">{payloadRow?.value?.substring(0, 30)}</div>
              </div>
              <span className="text-slate-300 font-bold">.</span>
              <div className="flex-1 rounded bg-red-100 text-red-700 px-2 py-3 text-center font-bold text-[10px] overflow-hidden">
                Signature
                <div className="text-[8px] font-normal text-red-500 mt-0.5 truncate">{sigRow?.value}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
