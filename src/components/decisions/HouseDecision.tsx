// "Can I afford this house?" — the decision flow island. One form feeds four linked answers
// (budget, debt-to-income, cash to close, rent vs buy) and a plain-language verdict. All math lives in
// src/lib/houseDecision.ts; this file only collects inputs and shows the result.
//
// SSR: the server renders the default scenario, so the page ships real numbers in its HTML. After
// hydration the URL query (a shared link) and saved scenarios are applied.
import { useEffect, useMemo, useState } from 'react';
import {
  evaluateHouse,
  fmtMoney,
  HOUSE_ASSUMPTIONS,
  HOUSE_DEFAULTS,
  inputsFromQuery,
  queryFromInputs,
  validateHouse,
  type HouseDecision as Decision,
  type HouseInputs,
  type Verdict,
} from '../../lib/houseDecision';

type Raw = Record<keyof HouseInputs, string>;

interface Field {
  key: keyof HouseInputs;
  label: string;
  prefix?: string;
  suffix?: string;
  help?: string;
}

const GROUPS: { title: string; hint: string; fields: Field[] }[] = [
  {
    title: 'Your money',
    hint: 'What a lender looks at first.',
    fields: [
      { key: 'income', label: 'Household income', prefix: '$', suffix: 'per year, before tax' },
      { key: 'debts', label: 'Other monthly debt payments', prefix: '$', suffix: 'car, student loans, cards', help: 'Do not include rent or the new mortgage.' },
      { key: 'savings', label: 'Cash you can use', prefix: '$', suffix: 'savings for down payment, closing and reserves' },
    ],
  },
  {
    title: 'The house',
    hint: 'The one you are thinking about.',
    fields: [
      { key: 'price', label: 'Price', prefix: '$' },
      { key: 'downPct', label: 'Down payment', suffix: '% of price' },
      { key: 'rate', label: 'Mortgage rate', suffix: '% a year' },
      { key: 'years', label: 'Loan term', suffix: 'years' },
      { key: 'taxPct', label: 'Property tax', suffix: '% of price a year' },
      { key: 'insurance', label: 'Homeowner’s insurance', prefix: '$', suffix: 'per year' },
      { key: 'hoa', label: 'HOA dues', prefix: '$', suffix: 'per month (0 if none)' },
    ],
  },
  {
    title: 'Renting instead',
    hint: 'For the rent-versus-buy comparison.',
    fields: [
      { key: 'rent', label: 'Rent you would pay', prefix: '$', suffix: 'per month' },
      { key: 'stay', label: 'Years you expect to stay', suffix: 'years' },
    ],
  },
];

const toRaw = (i: HouseInputs): Raw => Object.fromEntries(Object.entries(i).map(([k, v]) => [k, String(v)])) as Raw;
const fromRaw = (r: Raw): HouseInputs =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.trim() === '' ? NaN : Number(v.replace(/,/g, ''))])) as unknown as HouseInputs;

const VERDICT: Record<Verdict, { title: string; line: string; box: string; badge: string }> = {
  comfortable: {
    title: 'Within your budget',
    line: 'The payment, your total debt and your cash all sit inside the standard lending guidelines.',
    box: 'border-accent-emerald-400/60 bg-accent-emerald-50 dark:bg-emerald-950/30',
    badge: 'bg-accent-emerald-600 text-white',
  },
  tight: {
    title: 'Possible, but tight',
    line: 'You may qualify, but at least one guideline is stretched. Read the reasons below before you commit.',
    box: 'border-accent-amber-400/60 bg-accent-amber-50 dark:bg-amber-950/20',
    badge: 'bg-accent-amber-600 text-white',
  },
  over: {
    title: 'Over budget',
    line: 'At these numbers the purchase is beyond what standard lending guidelines support.',
    box: 'border-accent-rose-400/60 bg-accent-rose-50 dark:bg-rose-950/20',
    badge: 'bg-accent-rose-600 text-white',
  },
};

const inputCls =
  'w-full rounded-lg border border-[var(--border-warm)] bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--surface-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-default)] focus:border-[var(--brand-default)]';
const btnPrimary =
  'rounded-lg bg-[var(--brand-default)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-default)]';
const btnGhost =
  'rounded-lg border border-[var(--border-warm)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:border-[var(--brand-default)] active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-default)]';

const STORAGE_KEY = 'houseDecisionScenarios';
interface Saved { id: number; name: string; inputs: HouseInputs }

/** Deep links into the full calculators, carrying the numbers already entered. */
function toolLinks(i: HouseInputs) {
  const q = (o: Record<string, string | number>) => '?' + new URLSearchParams(Object.entries(o).map(([k, v]) => [k, String(v)])).toString();
  const down = Math.round((i.price * i.downPct) / 100);
  return {
    afford: '/finance/house-affordability-calculator/' + q({ annualIncome: i.income, monthlyDebts: i.debts, downPayment: down, interestRate: i.rate, loanTerm: i.years, propertyTax: i.taxPct, homeInsurance: i.insurance }),
    dti: '/finance/dti-ratio-calculator/',
    closing: '/finance/closing-costs-calculator/' + q({ homePrice: i.price, downPaymentPct: i.downPct, loanTerm: i.years, interestRate: i.rate }),
    rentBuy: '/finance/home-rent-vs-buy-calculator/' + q({ homePrice: i.price, downPaymentPct: i.downPct, interestRate: i.rate, monthlyRent: i.rent, years: i.stay }),
  };
}

const bandTone: Record<string, string> = {
  positive: 'text-accent-emerald-700 dark:text-accent-emerald-400',
  neutral: 'text-accent-amber-700 dark:text-accent-amber-400',
  negative: 'text-accent-rose-700 dark:text-accent-rose-400',
};

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-[var(--surface-text-secondary)]">{label}</dt>
      <dd className={`shrink-0 whitespace-nowrap text-right ${strong ? 'text-base font-bold text-[var(--surface-text)]' : 'text-sm font-semibold text-[var(--surface-text)]'}`}>{value}</dd>
    </div>
  );
}

function StepCard({ n, title, answer, children, href, linkLabel }: { n: number; title: string; answer: string; children: React.ReactNode; href: string; linkLabel: string }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-card)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--surface-text-muted)]">Step {n}</p>
      <h3 className="mt-0.5 text-lg font-bold text-[var(--surface-text)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--surface-text-secondary)]">{answer}</p>
      <dl className="mt-3 divide-y divide-[var(--border-warm)]">{children}</dl>
      <a href={href} className="mt-3 inline-block text-sm font-medium text-[var(--brand-ink)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)] active:opacity-80">
        {linkLabel} →
      </a>
    </section>
  );
}

export default function HouseDecision() {
  const [raw, setRaw] = useState<Raw>(() => toRaw(HOUSE_DEFAULTS));
  const [saved, setSaved] = useState<Saved[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [ready, setReady] = useState(false); // true once the shared link and saved scenarios are applied

  // A shared link seeds the form; saved scenarios come back from this browser.
  useEffect(() => {
    if (window.location.search) setRaw(toRaw(inputsFromQuery(window.location.search)));
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) setSaved(stored.filter((s) => s && s.inputs && validateHouse({ ...HOUSE_DEFAULTS, ...s.inputs })).slice(0, 4));
    } catch { /* storage blocked or corrupt: start empty */ }
    setReady(true);
  }, []);

  const inputs = useMemo(() => fromRaw(raw), [raw]);
  const ok = validateHouse(inputs);
  const d: Decision | null = useMemo(() => (ok ? evaluateHouse(inputs) : null), [ok, inputs]);
  const links = useMemo(() => toolLinks(ok ? inputs : HOUSE_DEFAULTS), [ok, inputs]);

  const set = (key: keyof HouseInputs, value: string) => {
    const next = { ...raw, [key]: value };
    setRaw(next);
    const parsed = fromRaw(next);
    if (validateHouse(parsed)) window.history.replaceState(null, '', `?${queryFromInputs(parsed)}`);
  };

  const persist = (list: Saved[]) => {
    setSaved(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  };
  const saveScenario = () => {
    if (!ok) return;
    const id = Date.now();
    persist([...saved, { id, name: `Scenario ${String.fromCharCode(65 + (saved.length % 26))}`, inputs }].slice(-4));
  };
  const copyLink = () => {
    if (!ok) return;
    const url = `${window.location.origin}${window.location.pathname}?${queryFromInputs(inputs)}`;
    navigator.clipboard?.writeText(url).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }).catch(() => {});
  };

  const A = HOUSE_ASSUMPTIONS;
  const v = d ? VERDICT[d.verdict] : null;

  return (
    <div data-hd-ready={ready ? 'true' : 'false'} className="space-y-8">
    {/* inputs beside the verdict; the sticky verdict stays inside this grid so it never overlaps what follows */}
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      {/* inputs */}
      <div className="space-y-6">
        {GROUPS.map((g) => (
          <fieldset key={g.title} className="rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-card)] p-5">
            <legend className="px-1 text-sm font-bold text-[var(--surface-text)]">{g.title}</legend>
            <p className="-mt-1 mb-3 text-xs text-[var(--surface-text-muted)]">{g.hint}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {g.fields.map((f) => {
                const bad = Number.isNaN(inputs[f.key]);
                return (
                  <div key={f.key}>
                    <label htmlFor={`hd-${f.key}`} className="mb-1 block text-sm font-medium text-[var(--surface-text)]">{f.label}</label>
                    <div className="flex items-center gap-2">
                      {f.prefix && <span className="text-sm text-[var(--surface-text-muted)]" aria-hidden="true">{f.prefix}</span>}
                      <input
                        id={`hd-${f.key}`}
                        type="text"
                        inputMode="decimal"
                        value={raw[f.key]}
                        onChange={(e) => set(f.key, e.target.value)}
                        aria-invalid={bad || undefined}
                        className={inputCls}
                      />
                    </div>
                    {f.suffix && <p className="mt-1 text-tiny text-[var(--surface-text-muted)]">{f.suffix}</p>}
                    {f.help && <p className="text-tiny text-[var(--surface-text-muted)]">{f.help}</p>}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
        {!ok && (
          <p role="alert" className="rounded-xl border border-accent-rose-400/60 bg-accent-rose-50 px-4 py-3 text-sm font-medium text-accent-rose-700 dark:bg-transparent">
            Enter a number in every field. The price, income and rent must be above zero, the down payment under 100%, and the loan term between 5 and 40 years.
          </p>
        )}
      </div>

      {/* verdict */}
      <div aria-live="polite" className="lg:sticky lg:top-24">
        {d && v ? (
          <div className={`rounded-2xl border p-5 ${v.box}`}>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${v.badge}`}>{v.title}</span>
            <p className="mt-3 text-sm text-[var(--surface-text)]">{v.line}</p>
            <dl className="mt-4 divide-y divide-[var(--border-warm)]">
              <Row label="Monthly housing payment" value={fmtMoney(d.housing)} strong />
              <Row label="Most you can afford" value={d.maxPrice === null ? 'No room' : fmtMoney(d.maxPrice)} />
              <Row label="Debt-to-income" value={`${d.backEnd.toFixed(1)}%`} />
              <Row label={d.cashLeft >= 0 ? 'Cash left after closing' : 'Cash short by'} value={fmtMoney(Math.abs(d.cashLeft))} />
            </dl>
            <ul className="mt-4 space-y-1.5 text-sm text-[var(--surface-text)]">
              {d.reasons.map((r) => (
                <li key={r} className="flex gap-2"><span aria-hidden="true">•</span><span>{r}</span></li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <button type="button" onClick={saveScenario} className={btnPrimary}>Save scenario</button>
              <button type="button" onClick={copyLink} className={btnGhost}>{linkCopied ? 'Link copied ✓' : 'Copy link to this scenario'}</button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border-warm)] p-5 text-sm text-[var(--surface-text-secondary)]">
            Fill in the numbers to see whether this house fits.
          </div>
        )}
      </div>

    </div>

      {/* the four linked answers */}
      {d && (
        <div className="grid gap-6 md:grid-cols-2">
          <StepCard
            n={1}
            title="Is the price within budget?"
            answer={d.maxPrice === null ? 'Your debts and insurance leave no room for a housing payment.' : `The 28/36 limits allow up to ${fmtMoney(d.maxPrice)} with this down payment. This house is ${fmtMoney(d.inputs.price)}.`}
            href={links.afford}
            linkLabel="Open the full affordability calculator"
          >
            <Row label="Principal and interest" value={fmtMoney(d.principalAndInterest)} />
            <Row label="Property tax" value={fmtMoney(d.propertyTax)} />
            <Row label="Insurance" value={fmtMoney(d.insurance)} />
            {d.hoa > 0 && <Row label="HOA" value={fmtMoney(d.hoa)} />}
            {d.pmi > 0 && <Row label="Mortgage insurance (under 20% down)" value={fmtMoney(d.pmi)} />}
            <Row label="Total per month" value={fmtMoney(d.housing)} strong />
          </StepCard>

          <StepCard
            n={2}
            title="What will lenders see in your debt?"
            answer={`Housing takes ${d.frontEnd.toFixed(1)}% of your gross income and all debt takes ${d.backEnd.toFixed(1)}%.`}
            href={links.dti}
            linkLabel="Open the debt-to-income calculator"
          >
            <Row label="Housing only (front-end)" value={`${d.frontEnd.toFixed(1)}% · ${d.frontBand.label}`} />
            <Row label="All debt (back-end)" value={`${d.backEnd.toFixed(1)}% · ${d.backBand.label}`} />
            <div className="pt-2">
              <p className={`text-xs ${bandTone[d.backBand.tone]}`}>{d.backBand.note}</p>
            </div>
          </StepCard>

          <StepCard
            n={3}
            title="Do you have the cash to close?"
            answer={d.cashLeft >= 0 ? `Yes: you would keep ${fmtMoney(d.cashLeft)} after closing.` : `Not yet: you are ${fmtMoney(-d.cashLeft)} short once reserves are counted.`}
            href={links.closing}
            linkLabel="See every closing cost line"
          >
            <Row label="Down payment" value={fmtMoney(d.downPayment)} />
            <Row label="Estimated closing costs" value={fmtMoney(d.closing)} />
            <Row label={`${A.reserveMonths} months of payments in reserve`} value={fmtMoney(d.reserves)} />
            <Row label="Total cash needed" value={fmtMoney(d.cashNeeded)} strong />
          </StepCard>

          <StepCard
            n={4}
            title="Is buying better than renting?"
            answer={
              d.breakEvenYear === null
                ? `Not within 30 years at these numbers: renting costs less over ${d.stayYears} ${d.stayYears === 1 ? 'year' : 'years'}.`
                : d.rentVsBuy === 'buy'
                  ? `Buying comes out ahead after year ${d.breakEvenYear}, and you plan to stay ${d.stayYears} ${d.stayYears === 1 ? 'year' : 'years'}.`
                  : `Buying only wins after year ${d.breakEvenYear}; at ${d.stayYears} ${d.stayYears === 1 ? 'year' : 'years'} renting costs less.`
            }
            href={links.rentBuy}
            linkLabel="Open the rent-versus-buy calculator"
          >
            <Row label={`Net cost to buy (${d.stayYears} yr)`} value={fmtMoney(d.netBuyCost)} />
            <Row label={`Net cost to rent (${d.stayYears} yr)`} value={fmtMoney(d.netRentCost)} />
            <Row label="Break-even year" value={d.breakEvenYear === null ? 'Beyond 30 years' : `Year ${d.breakEvenYear}`} strong />
          </StepCard>
        </div>
      )}

      {/* saved scenarios */}
      <section aria-label="Saved scenarios" className="rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-card)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[var(--surface-text)]">Compare scenarios</h3>
          {saved.length > 0 && <button type="button" onClick={() => persist([])} className="text-sm font-medium text-[var(--brand-ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)]">Clear all</button>}
        </div>
        {saved.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--surface-text-secondary)]">
            Change the price, down payment or rate, press “Save scenario”, and compare up to four side by side. They stay in this browser only.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Compared scenarios table">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" className="p-2 text-left font-medium text-[var(--surface-text-muted)]">&nbsp;</th>
                  {saved.map((s) => (
                    <th key={s.id} scope="col" className="p-2 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-semibold text-[var(--surface-text)]">{s.name}</span>
                        <button type="button" onClick={() => persist(saved.filter((x) => x.id !== s.id))} aria-label={`Remove ${s.name}`} className="text-[var(--surface-text-muted)] transition-colors hover:text-accent-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)]">×</button>
                      </span>
                      <a href={`?${queryFromInputs(s.inputs)}`} className="block text-xs font-normal text-[var(--brand-ink)] hover:underline">Open</a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['Price', (x: Decision) => fmtMoney(x.inputs.price)],
                    ['Down payment', (x: Decision) => `${x.inputs.downPct}% · ${fmtMoney(x.downPayment)}`],
                    ['Rate', (x: Decision) => `${x.inputs.rate}%`],
                    ['Monthly payment', (x: Decision) => fmtMoney(x.housing)],
                    ['Debt-to-income', (x: Decision) => `${x.backEnd.toFixed(1)}%`],
                    ['Cash left after closing', (x: Decision) => fmtMoney(x.cashLeft)],
                    ['Break-even vs renting', (x: Decision) => (x.breakEvenYear === null ? 'Beyond 30 years' : `Year ${x.breakEvenYear}`)],
                    ['Verdict', (x: Decision) => VERDICT[x.verdict].title],
                  ] as [string, (x: Decision) => string][]
                ).map(([label, fn]) => (
                  <tr key={label} className="border-t border-[var(--border-warm)]">
                    <th scope="row" className="p-2 text-left font-normal text-[var(--surface-text-secondary)]">{label}</th>
                    {saved.map((s) => (
                      <td key={s.id} className="p-2 text-right font-medium text-[var(--surface-text)]">{fn(evaluateHouse(s.inputs))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
