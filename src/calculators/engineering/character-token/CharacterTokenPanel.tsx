import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function CharacterTokenPanel({ results }: Props) {
  const estimatedTokens = results.find(r => r.id === 'estimatedTokens');
  const characterCount = results.find(r => r.id === 'characterCount');
  const wordCount = results.find(r => r.id === 'wordCount');
  const tokenCharRatio = results.find(r => r.id === 'tokenCharRatio');
  const estimatedReadTime = results.find(r => r.id === 'estimatedReadTime');
  const estimatedGenTime = results.find(r => r.id === 'estimatedGenTime');
  const estimatedCost = results.find(r => r.id === 'estimatedCost');
  const tokenizerType = results.find(r => r.id === 'tokenizerType');

  const parseTokens = (r?: CalculatorResult): number => {
    if (!r) return 0;
    return parseInt(r.value.replace(/,/g, ''), 10) || 0;
  };

  const tokenCount = parseTokens(estimatedTokens);
  const charCount = parseFloat(characterCount?.value?.replace(/,/g, '') || '0');
  const contextLimit = 128000;
  const contextPct = Math.min((tokenCount / contextLimit) * 100, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Token &amp; Character Analysis</span>
        <span className="ml-auto text-[10px] font-bold text-slate-500">{tokenizerType?.value || ''}</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Token/Character Comparison Bar */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Token vs Character Count</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-20 text-[10px] font-bold text-indigo-500">Tokens</span>
              <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.min((tokenCount / Math.max(charCount, 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="w-20 text-right text-xs font-mono font-bold text-indigo-700">{estimatedTokens?.value || '0'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 text-[10px] font-bold text-emerald-500">Characters</span>
              <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
              <span className="w-20 text-right text-xs font-mono font-bold text-emerald-700">{characterCount?.value || '0'}</span>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Tokens</p>
            <p className="text-lg font-bold font-mono text-indigo-700">{estimatedTokens?.value || '0'}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Chars</p>
            <p className="text-lg font-bold font-mono text-emerald-700">{characterCount?.value || '0'}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Words</p>
            <p className="text-lg font-bold font-mono text-amber-700">{wordCount?.value || '0'}</p>
          </div>
        </div>

        {/* Context Window Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Context Window Usage</p>
            <span className="text-xs font-mono text-slate-500">{contextPct.toFixed(1)}% of 128K</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1 ${contextPct > 80 ? 'bg-red-400' : contextPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${contextPct}%` }}
            >
              {contextPct > 15 && (
                <span className="text-[9px] font-bold text-white drop-shadow-sm">
                  {contextPct > 80 ? 'High' : contextPct > 50 ? 'Med' : 'Low'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timing & Cost */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Read Time</p>
            <p className="text-xs font-bold font-mono text-slate-700">{estimatedReadTime?.value || '-'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Gen Time</p>
            <p className="text-xs font-bold font-mono text-slate-700">{estimatedGenTime?.value || '-'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Cost (input)</p>
            <p className="text-xs font-bold font-mono text-slate-700">{estimatedCost?.value || '-'}</p>
          </div>
        </div>

        {/* Efficiency metrics */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Efficiency Metrics</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold font-mono text-slate-700">{tokenCharRatio?.value || '—'}</p>
              <p className="text-[10px] text-slate-500">Tokens/Char</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-slate-700">
                {charCount > 0 ? (charCount / Math.max(tokenCount, 1)).toFixed(2) : '—'}
              </p>
              <p className="text-[10px] text-slate-500">Chars/Token</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-slate-700">
                {charCount > 0 ? (tokenCount / Math.max(parseInt(wordCount?.value?.replace(/,/g, '') || '1'), 1)).toFixed(2) : '—'}
              </p>
              <p className="text-[10px] text-slate-500">Tokens/Word</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
