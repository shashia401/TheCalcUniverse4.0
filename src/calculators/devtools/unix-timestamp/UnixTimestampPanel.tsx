import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function UnixTimestampPanel({ results }: Props) {
  // ts-to-date mode results
  const localDate = results.find(r => r.id === 'localDate');
  const utcDate = results.find(r => r.id === 'utcDate');
  const isoString = results.find(r => r.id === 'isoString');
  const milliseconds = results.find(r => r.id === 'milliseconds');

  // date-to-ts mode results
  const seconds = results.find(r => r.id === 'seconds');
  const ms = results.find(r => r.id === 'ms');

  if (!results.length) return null;

  const isTsToDate = !!localDate;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Timestamp</span>
      </div>
      <div className="p-5 space-y-3">
        {isTsToDate ? (
          <>
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Local Date/Time</p>
              <p className="text-lg font-bold text-blue-700">{localDate?.value || ''}</p>
            </div>
            <div className="space-y-1.5">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">UTC</span>
                <span className="text-xs font-mono text-slate-700">{utcDate?.value || ''}</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">ISO 8601</span>
                <span className="text-xs font-mono text-slate-700">{isoString?.value || ''}</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">Milliseconds</span>
                <span className="text-xs font-mono text-slate-700">{milliseconds?.value || ''}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Unix Timestamp</p>
              <p className="text-2xl font-bold font-mono text-blue-700">{seconds?.value || ''}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500">Milliseconds</span>
              <span className="text-xs font-mono text-slate-700">{ms?.value || ''}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
