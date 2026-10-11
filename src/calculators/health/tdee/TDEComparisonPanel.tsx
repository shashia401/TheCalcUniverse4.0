import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';

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

  const primaryFormula = results.find(r => r.id === 'formulaLabel')?.value || '';

  // -700 backgrounds keep the white value labels at >= 4.5:1 (shared HBarRow replaces the local bar()).
  const formulas = [
    { label: 'Mifflin-St Jeor', value: parseNum(mifflin.value), color: 'bg-emerald-700' },
    { label: 'Harris-Benedict', value: parseNum(harris.value), color: 'bg-amber-700' },
    ...(katch ? [{ label: 'Katch-McArdle', value: parseNum(katch.value), color: 'bg-blue-700' }] : []),
  ];
  const maxVal = Math.max(...formulas.map(f => f.value));

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-warm)', background: 'var(--surface-card)' }}>
      <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: 'var(--border-warm)', background: 'var(--surface-bg)' }}>
        <svg aria-hidden="true" className="w-4 h-4" style={{ color: 'var(--surface-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--surface-text-muted)' }}>BMR Formula Comparison</span>
      </div>

      <div className="p-5 space-y-1">
        <div role="group" aria-label="Basal metabolic rate by formula, kcal per day">
          {formulas.map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <div className="flex-1">
                <HBarRow
                  label={f.label}
                  value={f.value}
                  max={maxVal}
                  color={f.color}
                  display={f.value.toLocaleString()}
                  height="h-5"
                  className="py-2"
                />
              </div>
              {primaryFormula === f.label && (
                <span className="text-[10px] font-bold text-[var(--accent-rust)] uppercase tracking-wider flex-shrink-0">Selected</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl px-4 py-3" style={{ border: '1px solid var(--border-warm)', background: 'var(--surface-bg)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--surface-text-muted)' }}>What Do the Differences Mean?</p>
          <ul className="text-xs space-y-1.5 leading-relaxed" style={{ color: 'var(--surface-text-secondary)' }}>
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 mt-0.5">•</span>
              <span><strong style={{ color: 'var(--surface-text)' }}>Mifflin-St Jeor (1990):</strong> Most validated for the general population. TDEE uses this by default.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-700 mt-0.5">•</span>
              <span><strong style={{ color: 'var(--surface-text)' }}>Harris-Benedict (revised 1984):</strong> Older formula that usually reads higher than Mifflin-St Jeor and tends to overestimate resting energy expenditure.</span>
            </li>
            {katch && (
              <li className="flex items-start gap-2">
                <span className="text-blue-700 mt-0.5">•</span>
                <span><strong style={{ color: 'var(--surface-text)' }}>Katch-McArdle (1996):</strong> Works from lean body mass, so it suits lean or muscular people whose body fat % is known accurately.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
