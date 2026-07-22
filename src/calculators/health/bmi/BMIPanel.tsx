import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const RANGES = [
  { label: 'Severely Underweight', range: '< 16.0', risk: 'High risk — malnutrition', dot: '#3b82f6' },
  { label: 'Underweight', range: '16.0 – 18.4', risk: 'Moderate risk', dot: '#60a5fa' },
  { label: 'Normal weight', range: '18.5 – 24.9', risk: 'Minimal risk', dot: '#22c55e' },
  { label: 'Overweight', range: '25.0 – 29.9', risk: 'Low–moderate risk', dot: '#eab308' },
  { label: 'Obese Class I', range: '30.0 – 34.9', risk: 'Moderate risk', dot: '#f97316' },
  { label: 'Obese Class II', range: '35.0 – 39.9', risk: 'High risk', dot: '#ef4444' },
  { label: 'Obese Class III', range: '≥ 40.0', risk: 'Very high risk', dot: '#991b1b' },
];

function fmt(n: number) { return n.toFixed(1); }

export default function BMIPanel({ results }: Props) {
  const bmiResult = results.find(r => r.id === 'bmiScore');
  const rangeResult = results.find(r => r.id === 'normalRange');
  const diffResult = results.find(r => r.id === 'weightDiff');
  const primeResult = results.find(r => r.id === 'bmiPrime');

  if (!bmiResult) return null;

  const bmi = parseFloat(bmiResult.value);
  if (isNaN(bmi)) return null;

  // Gauge: map BMI 15→50 to 0→100%
  const pct = Math.min(100, Math.max(0, ((bmi - 15) / 35) * 100));

  return (
    <div>
      {/* BMI GAUGE */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: '1.1rem' }}>📊</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--surface-text-muted)' }}>BMI Scale</span>
        </div>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <div style={{ height: 12, borderRadius: 100, background: 'linear-gradient(90deg,#3b82f6 0%,#22c55e 25%,#eab308 55%,#f97316 75%,#ef4444 100%)', position: 'relative', overflow: 'visible' }}>
            <div style={{ position: 'absolute', top: -6, left: `${pct}%`, width: 24, height: 24, background: '#fff', border: '3px solid var(--text-primary)', borderRadius: '50%', transform: 'translateX(-50%)', transition: 'left 0.8s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.68rem', color: 'var(--surface-text-muted)', padding: '0 2px' }}>
            <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-warm)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {rangeResult?.value ?? '—'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--surface-text-muted)', marginTop: 2, fontWeight: 500 }}>Healthy weight range</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-warm)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {diffResult?.value ?? '—'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--surface-text-muted)', marginTop: 2, fontWeight: 500 }}>{diffResult?.label === 'vs. Ideal' ? 'vs. Ideal weight' : 'To reach normal range'}</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-warm)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {primeResult?.value ?? '—'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--surface-text-muted)', marginTop: 2, fontWeight: 500 }}>BMI Prime</div>
        </div>
      </div>

      {/* REFERENCE TABLE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: '1.1rem' }}>📋</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--surface-text-muted)' }}>BMI Classification Reference</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--surface-text-muted)', borderBottom: '1px solid var(--border-warm)' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--surface-text-muted)', borderBottom: '1px solid var(--border-warm)' }}>BMI Range</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--surface-text-muted)', borderBottom: '1px solid var(--border-warm)' }}>Health risk</th>
              </tr>
            </thead>
            <tbody>
              {RANGES.map((r) => (
                <tr key={r.label}>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border-warm)' }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: r.dot, marginRight: 8, verticalAlign: 'middle' }} />
                    {r.label}
                  </td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border-warm)', color: 'var(--surface-text-muted)' }}>{r.range}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border-warm)', color: 'var(--surface-text-muted)' }}>{r.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--surface-text-muted)', marginTop: 10, lineHeight: 1.4 }}>
          Source: World Health Organization (WHO) BMI Classification, 2004. Asian-adjusted thresholds use a lower overweight cut-off of 23.0.
        </p>
      </div>
    </div>
  );
}
