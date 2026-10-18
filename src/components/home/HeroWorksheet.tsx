// The homepage hero's signature: a real worked solution you can edit. Change the loan amount, rate or term
// and every step, and the circled answer, are recomputed. It is the site's promise ("calculators that show
// their work") demonstrated instead of described. Math: the shared `pmt` the loan calculator uses.
import { useMemo, useState } from 'react';
import { pmt } from '../../utils/financial';
import { GroupedNumberInput } from '../calculator/GroupedNumberInput';

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const field =
  'inline-block min-h-[44px] rounded-md border-b-2 border-dashed border-[var(--brand-default)] bg-[var(--surface-bg)] px-2 py-1 text-center font-mono text-base font-bold text-[var(--brand-ink)] transition-colors focus:outline-none focus-visible:border-solid focus-visible:ring-2 focus-visible:ring-[var(--brand-default)]';

export default function HeroWorksheet() {
  const [amount, setAmount] = useState('25000');
  const [rate, setRate] = useState('6.5');
  const [years, setYears] = useState('5');

  const w = useMemo(() => {
    const P = Number(amount.replace(/,/g, ''));
    const apr = Number(rate);
    const yrs = Number(years);
    if (![P, apr, yrs].every(Number.isFinite) || P <= 0 || apr < 0 || apr > 40 || yrs <= 0 || yrs > 40) return null;
    const n = Math.round(yrs * 12);
    const r = apr / 100 / 12;
    const growth = Math.pow(1 + r, n);
    const M = r === 0 ? P / n : pmt(P, r, n);
    return { P, apr, yrs, n, r, growth, M, interest: M * n - P };
  }, [amount, rate, years]);

  const href = w
    ? `/finance/loan-calculator/?${new URLSearchParams({ loanAmount: String(w.P), interestRate: String(w.apr), loanTerm: String(w.yrs), termUnit: 'years' }).toString()}`
    : '/finance/loan-calculator/';

  return (
    <figure className="relative m-0 overflow-hidden rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-card)] shadow-elevation-2">
      {/* notebook margin */}
      <div aria-hidden="true" className="absolute inset-y-0 left-10 w-px bg-[var(--brand-default)] opacity-25" />
      <div
        className="px-6 py-6 pl-14 sm:px-8 sm:pl-16"
        style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 35px, rgba(25,103,210,0.10) 35px, rgba(25,103,210,0.10) 36px)', backgroundPositionY: '12px' }}
      >
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--surface-text-muted)]">Worked example · edit any number</p>

        <p className="mt-4 text-base leading-[2.6rem] text-[var(--surface-text)] sm:text-lg">
          Borrow $<GroupedNumberInput id="hero-amount" rawValue={amount} prefix="$" inputMode="decimal" className={`${field} w-28`} onRawChange={setAmount} /> at{' '}
          <input id="hero-rate" aria-label="Annual interest rate, percent" type="text" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className={`${field} w-16`} />% for{' '}
          <input id="hero-years" aria-label="Loan term, years" type="text" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} className={`${field} w-14`} /> years.
        </p>

        {w ? (
          <div aria-live="polite">
            <ol className="mt-3 space-y-0 font-mono text-[13px] leading-9 text-[var(--surface-text-secondary)] sm:text-sm">
              <li><span className="text-[var(--surface-text-muted)]">r = </span>{w.apr}% ÷ 12 = {(w.r * 100).toFixed(4)}% a month</li>
              <li><span className="text-[var(--surface-text-muted)]">n = </span>{w.yrs} × 12 = {w.n} payments</li>
              <li><span className="text-[var(--surface-text-muted)]">(1 + r)ⁿ = </span>{w.growth.toFixed(4)}</li>
              <li><span className="text-[var(--surface-text-muted)]">M = P × r(1+r)ⁿ ÷ ((1+r)ⁿ − 1)</span></li>
              <li className="flex items-center gap-x-3">
                <span className="relative my-1 ml-3 inline-block px-4 py-1 text-xl font-extrabold text-[var(--surface-text)] sm:text-2xl">
                  ${money(w.M)}
                  <svg aria-hidden="true" viewBox="0 0 140 48" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
                    <ellipse cx="70" cy="24" rx="66" ry="20" fill="none" stroke="var(--brand-default)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" transform="rotate(-2 70 24)" />
                  </svg>
                </span>
                <span className="text-[var(--surface-text-muted)]">a month</span>
              </li>
            </ol>
            <p className="mt-2 font-mono text-[13px] leading-9 text-[var(--surface-text-secondary)] sm:text-sm">
              Over {w.yrs} years you pay ${money(w.interest)} in interest.
            </p>
          </div>
        ) : (
          <p role="alert" className="mt-4 font-mono text-sm text-accent-rose-700 dark:text-accent-rose-400">Enter an amount above zero, a rate from 0 to 40, and a term up to 40 years.</p>
        )}

        <a
          href={href}
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-ink)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-default)] active:opacity-80"
        >
          Open the full Loan Calculator with these numbers <span aria-hidden="true">→</span>
        </a>
      </div>
    </figure>
  );
}
