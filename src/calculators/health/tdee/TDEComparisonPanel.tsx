import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function TDEComparisonPanel({ results }: Props) {
  const mifflin = results.find(r => r.id === 'mifflinBMR');
  const harris = results.find(r => r.id === 'harrisBMR');
  const katch = results.find(r => r.id === 'katchBMR');

  if (!mifflin || !harris) return null;

  const parseNum = (s: string) => {
    const m = s.replace(/,/g, '').match(/(\d+)/);
    return m ? parseFloat(m[1]) : 0;
  };

  const mifflinVal = parseNum(mifflin.value);
  const harrisVal = parseNum(harris.value);
  const katchVal = katch ? parseNum(katch.value) : 0;
  const maxVal = Math.max(mifflinVal, harrisVal, katchVal || 0);

  const [hoverInfo, setHoverInfo] = useState<{ label: string; value: number } | null>(null);

  const bar = (label: string, val: number, color: string, isPrimary: boolean) => {
    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
    const barColor = color === 'green' ? 'bg-emerald-500'
      : color === 'amber' ? 'bg-amber-500'
      : 'bg-blue-500';

    return (
      <div
        className={`flex items-center gap-3 py-2 ${isPrimary ? 'bg-amber-50/50 -mx-4 px-4 rounded-lg' : ''}`}
        onMouseEnter={() => setHoverInfo({ label, value: val })}
        onMouseLeave={() => setHoverInfo(null)}
      >
        <span className="text-xs font-semibold text-[var(--surface-text-secondary)] w-32 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: 'var(--surface-bg)' }}>
          <div className={`h-full rounded ${barColor} transition-all flex items-center justify-end pr-1.5 ${pct < 15 ? 'min-w-[40px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[10px] font-bold text-white drop-shadow-sm">{val.toLocaleString()}</span>
          </div>
        </div>
        {isPrimary && (
          <span className="text-[10px] font-bold text-[var(--accent-rust)] uppercase tracking-wider flex-shrink-0">Selected</span>
        )}
      </div>
    );
  };

  const primaryFormula = results.find(r => r.id === 'formulaLabel')?.value || '';

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-warm)', background: 'var(--surface-card)' }}>
      <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: 'var(--border-warm)', background: 'var(--surface-bg)' }}>
        <svg aria-hidden="true" className="w-4 h-4" style={{ color: 'var(--surface-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--surface-text-muted)' }}>BMR Formula Comparison</span>
      </div>

      <div className="p-5 space-y-1">
        {bar('Mifflin-St Jeor', mifflinVal, 'green', primaryFormula === 'Mifflin-St Jeor' || (!katch && primaryFormula.includes('Mifflin')))}
        {bar('Harris-Benedict', harrisVal, 'amber', primaryFormula === 'Harris-Benedict')}
        {katch && bar('Katch-McArdle', katchVal, 'blue', primaryFormula === 'Katch-McArdle')}

        {hoverInfo && (
          <div className="text-xs text-center rounded-lg px-3 py-2 mt-2" style={{ background: 'var(--surface-bg)', color: 'var(--surface-text-secondary)' }}>
            <span className="font-semibold">{hoverInfo.label}</span>
            <span className="mx-1" style={{ color: 'var(--surface-text-muted)' }}>—</span>
            <span className="font-bold" style={{ color: 'var(--surface-text)' }}>{hoverInfo.value.toLocaleString()} kcal/day BMR</span>
          </div>
        )}

        <div className="mt-4 rounded-xl px-4 py-3" style={{ border: '1px solid var(--border-warm)', background: 'var(--surface-bg)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--surface-text-muted)' }}>What Do the Differences Mean?</p>
          <ul className="text-xs space-y-1.5 leading-relaxed" style={{ color: 'var(--surface-text-secondary)' }}>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span><strong style={{ color: 'var(--surface-text)' }}>Mifflin-St Jeor (1990):</strong> Most validated for the general population. TDEE uses this by default.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span><strong style={{ color: 'var(--surface-text)' }}>Harris-Benedict (revised 1984):</strong> Older formula that tends to overestimate BMR by ~5%.</span>
            </li>
            {katch && (
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span><strong style={{ color: 'var(--surface-text)' }}>Katch-McArdle (1996):</strong> Most accurate for lean athletes because it uses lean body mass.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
