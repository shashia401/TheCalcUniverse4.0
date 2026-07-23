// THE island — the only hydrated component on a calculator page (client:visible).
//
// It receives only the calculator id (island props must be JSON-serializable;
// CalculatorConfig contains functions and cannot cross the server→client boundary).
// The config is loaded here via the registry's dynamic import, which Vite splits
// into a per-calculator chunk — a page only ever downloads its own logic.

import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import type { CalculatorConfig, CalculatorResult, InputField } from '../../types/calculator';
import { getCalculatorById } from '../../calculators/registry/index';
import MiniAreaChart from './MiniAreaChart';
import MiniDonut from './MiniDonut';
import MiniGauge from './MiniGauge';

interface Props {
  calculatorId: string;
  /**
   * Compact embed (e.g. the homepage hero): keeps inputs + results + gauge/donut
   * but hides the long "how we got this" steps and the extra panel, so the card
   * stays hero-sized. The full treatment lives on the calculator's own page.
   */
  compact?: boolean;
  /**
   * Restrict which inputs render (by id). Used by the compact hero to show only
   * the fields that affect the headline result (e.g. BMI needs weight + height,
   * not sex/age), keeping the card short. showWhen still applies on top of this.
   */
  visibleInputIds?: string[];
}

const fieldClasses =
  'w-full rounded-lg border border-[var(--border-warm)] bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--surface-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-default)] focus:border-[var(--brand-default)]';

const resultColorClasses: Record<string, string> = {
  // Theme-aware: darker shade on light (AA on white), lighter on dark (AA on dark card)
  positive: 'text-accent-emerald-700 dark:text-accent-emerald-400',
  negative: 'text-accent-rose-700 dark:text-accent-rose-400',
};

const actionBtnCls =
  'text-xs font-medium text-[var(--brand-ink)] rounded px-2 py-1 transition-colors hover:bg-[var(--surface-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)] active:opacity-70';

export default function CalculatorForm({ calculatorId, compact = false, visibleInputIds }: Props) {
  const [config, setConfig] = useState<CalculatorConfig | null>(null);
  const [catSlug, setCatSlug] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSticky, setShowSticky] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // Saved scenarios for side-by-side comparison (e.g. loan A vs loan B). Local
  // to the session; no backend. Capped so the table stays readable.
  const [scenarios, setScenarios] = useState<{ id: number; results: CalculatorResult[] }[]>([]);
  const scenarioId = useRef(0);
  const addScenario = () => {
    if (!results.length) return;
    setScenarios((prev) => [...prev, { id: ++scenarioId.current, results: results.map((r) => ({ ...r })) }].slice(-4));
  };
  const removeScenario = (id: number) => setScenarios((prev) => prev.filter((s) => s.id !== id));
  const [results, setResults] = useState<CalculatorResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  // Currency: symbol swap only (no FX conversion — the numbers are the same, a UK
  // user just wants £ not $). Persists across calcs via localStorage.
  // ponytail: symbol swap on "$" strings; add real FX only if users ask to convert.
  const [cur, setCur] = useState(() => {
    try { return localStorage.getItem('currency') || '$'; } catch { return '$'; }
  });
  const money = (s: string) => (cur === '$' || !s?.includes('$') ? s : s.split('$').join(cur));

  // Reflect the current inputs in the URL query string so a scenario is shareable.
  // Whitelisted to this calc's input ids; values capped at 64 chars. Canonical stays
  // param-free (set in <head>), so this never creates duplicate-content URLs.
  const syncUrl = (cfg: CalculatorConfig, vals: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    for (const input of cfg.inputs) {
      const v = vals[input.id];
      if (v !== undefined && v !== '') params.set(input.id, String(v).slice(0, 64));
    }
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  };

  const copyLink = () => {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(() => {});
  };

  const copyResults = () => {
    const text = results
      .map((r) => `${r.label}: ${money(r.value)}${r.unit ? ` ${r.unit}` : ''}`)
      .join('\n');
    navigator.clipboard
      .writeText(`${text}\n— calculated at ${window.location.href}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // clipboard unavailable (permissions/http) — button simply does nothing
      });
  };

  const printResult = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // Export the current results as CSV (a small table of label/value/unit).
  const downloadCsv = () => {
    if (!results.length) return;
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = [
      ['Metric', 'Value', 'Unit'],
      ...results.map((r) => [r.label, String(r.value), r.unit ?? '']),
    ];
    const csv = rows.map((row) => row.map((c) => esc(String(c))).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${calculatorId}-results.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Native share sheet on mobile (includes email, messages, etc.); on desktop
  // where the API is absent, fall back to copying the shareable link.
  const shareResult = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      copyLink();
    }
  };

  useEffect(() => {
    let cancelled = false;
    const entry = getCalculatorById(calculatorId);
    if (!entry) return;
    setCatSlug(entry.categorySlug);
    entry.loader().then(({ default: cfg }) => {
      if (cancelled) return;
      // Seed initial values so the form shows a real answer on load. Mirrors the
      // build-time ExampleResult logic (see [calculator]/index.astro) so the live
      // form matches the crawlable example: explicit defaultValue → first select
      // option → a number parsed from a numeric placeholder. Text/textarea inputs
      // (e.g. "paste your JSON") stay empty.
      const defaults: Record<string, string> = {};
      for (const input of cfg.inputs) {
        if (input.defaultValue !== undefined && input.defaultValue !== '') {
          defaults[input.id] = String(input.defaultValue);
        } else if (input.type === 'select' && input.options?.length) {
          defaults[input.id] = input.options[0].value;
        } else if ((input.type === 'number' || input.type === 'percentage') && input.placeholder) {
          const m = input.placeholder.replace(/,/g, '').match(/-?\d+\.?\d*/);
          defaults[input.id] = m ? m[0] : '';
        } else if ((input.type === 'text' || input.type === 'textarea') && input.placeholder) {
          // Seed a sample data list from placeholders like "Enter numbers: 1, 2, 3"
          // (stats/vector calcs) — but NOT paste prompts ("Paste your JSON here").
          const list = input.placeholder.match(/-?\d[\d\s,.\-]*\d/);
          defaults[input.id] = list && (list[0].match(/\d+/g)?.length ?? 0) >= 2 ? list[0].trim() : '';
        } else {
          defaults[input.id] = '';
        }
      }
      // Overlay a shared scenario from the URL (?loanAmount=25000&…) onto defaults.
      let seeded = defaults;
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const ids = new Set(cfg.inputs.map((i) => i.id));
        const fromUrl: Record<string, string> = {};
        params.forEach((v, k) => {
          if (ids.has(k)) fromUrl[k] = v.slice(0, 64);
        });
        if (Object.keys(fromUrl).length) seeded = { ...defaults, ...fromUrl };
      }
      setConfig(cfg);
      setValues(seeded);
      try {
        setResults(cfg.calculate(seeded));
      } catch {
        setResults([]);
      }
      // Progressive enhancement: the static <ExampleResult/> in the page is a
      // no-JS/crawler fallback. Now that the live calculator is available, remove
      // it so JS users don't see the result twice. (Crawlers-without-JS keep it.)
      if (typeof document !== 'undefined') {
        document.querySelectorAll('.seo-fallback').forEach((el) => el.remove());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [calculatorId]);

  // Sticky result bar — appears once the calculator card has scrolled above the
  // viewport, keeping the headline answer + a jump back to the inputs in view.
  // Full page only (not the compact hero embed).
  useEffect(() => {
    if (compact) return;
    const onScroll = () => {
      const el = cardRef.current;
      if (!el) return;
      // Show once the inputs + headline result have scrolled up out of view.
      setShowSticky(el.getBoundingClientRect().top < -240);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [compact]);

  if (!config) {
    // Reserve close to the real form's height so the skeleton→form swap on
    // hydration doesn't cause a layout shift (CWV/CLS). Most calculator forms
    // render 500–650px; min-h keeps the reserve without capping tall ones.
    return <div className="min-h-[540px] rounded-2xl bg-[var(--surface-card)] animate-pulse" aria-hidden="true" />;
  }

  const handleChange = (id: string, value: string) => {
    const next = { ...values, [id]: value };
    setValues(next);
    try {
      setResults(config.calculate(next));
    } catch {
      // invalid intermediate state (e.g. mid-typing) — keep last good results
    }
    syncUrl(config, next);
  };

  const visibleInputs = config.inputs.filter(
    (input) =>
      (!visibleInputIds || visibleInputIds.includes(input.id)) &&
      (!input.showWhen || input.showWhen(values))
  );

  // Deep-link to the full calculator page, carrying the current inputs so the
  // hero scenario continues seamlessly on the dedicated page. Same whitelist +
  // 64-char cap as syncUrl; trailingSlash:'always' means the slash precedes '?'.
  const fullBreakdownHref = () => {
    const params = new URLSearchParams();
    for (const input of config.inputs) {
      const v = values[input.id];
      if (v !== undefined && v !== '') params.set(input.id, String(v).slice(0, 64));
    }
    const qs = params.toString();
    return `/${catSlug}/${calculatorId}/${qs ? `?${qs}` : ''}`;
  };

  const renderField = (input: InputField) => {
    if (input.type === 'custom' && input.component) {
      const Custom = input.component;
      return (
        <Custom
          id={input.id}
          value={values[input.id] ?? ''}
          onChange={(v) => handleChange(input.id, v)}
        />
      );
    }
    if (input.type === 'select') {
      return (
        <select
          id={input.id}
          value={values[input.id] ?? ''}
          onChange={(e) => handleChange(input.id, e.target.value)}
          className={fieldClasses}
        >
          {input.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }
    if (input.type === 'textarea') {
      return (
        <textarea
          id={input.id}
          value={values[input.id] ?? ''}
          placeholder={input.placeholder}
          onChange={(e) => handleChange(input.id, e.target.value)}
          rows={5}
          className={fieldClasses}
        />
      );
    }
    return (
      <input
        id={input.id}
        type={input.type === 'number' || input.type === 'percentage' ? 'number' : input.type === 'date' ? 'date' : 'text'}
        inputMode={input.inputMode as HTMLAttributes<HTMLInputElement>['inputMode']}
        value={values[input.id] ?? ''}
        min={input.min}
        max={input.max}
        step={input.step}
        placeholder={input.placeholder}
        onChange={(e) => handleChange(input.id, e.target.value)}
        className={fieldClasses}
      />
    );
  };

  const activeShape = values.shape || config.shapeTabs?.[0]?.value;
  const stickyResult = results.find((r) => r.highlight) ?? results[0];
  const isMoney = results.some((r) => r.value.includes('$'));

  return (
    <>
    <div ref={cardRef} className="bg-[var(--surface-card)] border border-[var(--border-warm)] rounded-2xl p-6 md:p-8">
      {/* Variant/shape tabs — switch which set of inputs (and formula) applies.
          Writes to values.shape, which each calc's inputs read via showWhen. */}
      {config.shapeTabs && config.shapeTabs.length > 0 && (
        <div role="tablist" aria-label="Options" className="mb-5 flex flex-wrap gap-1.5">
          {config.shapeTabs.map((tab) => {
            const active = activeShape === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleChange('shape', tab.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-default)] ${
                  active
                    ? 'bg-[var(--brand-default)] text-white'
                    : 'border border-[var(--border-warm)] bg-[var(--surface-bg)] text-[var(--surface-text-secondary)] hover:border-[var(--brand-default)] hover:text-[var(--surface-text)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {visibleInputs.map((input) => (
          <div key={input.id}>
            <label
              htmlFor={input.id}
              className="block text-sm font-medium text-[var(--surface-text)] mb-1"
            >
              {input.label}
              {input.unit && (
                <span className="ml-1 text-[var(--surface-text-muted)]">({input.unit})</span>
              )}
            </label>
            {renderField(input)}
            {input.slider && (input.type === 'number' || input.type === 'percentage') && (
              <input
                type="range"
                aria-label={`${input.label} slider`}
                min={input.slider.min}
                max={input.slider.max}
                step={input.slider.step}
                value={Number(values[input.id]) || input.slider.min}
                onChange={(e) => handleChange(input.id, e.target.value)}
                className="mt-2 w-full accent-[var(--brand-default)] cursor-pointer"
              />
            )}
            {input.helpText && (
              <p className="mt-1 text-tiny text-[var(--surface-text-muted)]">{input.helpText}</p>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="border-t border-[var(--border-warm)] pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-[var(--surface-text-muted)] uppercase tracking-wide">
              Results
            </h2>
            {!compact && (
              <div className="flex flex-wrap items-center gap-1 print:hidden">
                <button type="button" onClick={copyLink} title="Copy a link to this exact scenario" className={actionBtnCls}>
                  {linkCopied ? 'Link copied ✓' : 'Copy link'}
                </button>
                <button type="button" onClick={copyResults} className={actionBtnCls}>
                  {copied ? 'Copied ✓' : 'Copy results'}
                </button>
                <button type="button" onClick={printResult} title="Print — or save as PDF" className={actionBtnCls}>
                  Print
                </button>
                <button type="button" onClick={downloadCsv} title="Download results as CSV" className={actionBtnCls}>
                  CSV
                </button>
                <button type="button" onClick={shareResult} title="Share this result" className={actionBtnCls}>
                  Share
                </button>
                <button type="button" onClick={addScenario} title="Save this result to compare side by side" className={actionBtnCls}>
                  + Compare
                </button>
                {isMoney && (
                  <select
                    value={cur}
                    onChange={(e) => { setCur(e.target.value); try { localStorage.setItem('currency', e.target.value); } catch {} }}
                    aria-label="Currency symbol"
                    title="Change currency symbol (no conversion)"
                    className="text-xs font-medium text-[var(--brand-ink)] rounded border border-[var(--border-warm)] bg-transparent px-1.5 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)]"
                  >
                    <option value="$">$ USD</option>
                    <option value="€">€ EUR</option>
                    <option value="£">£ GBP</option>
                    <option value="₹">₹ INR</option>
                    <option value="¥">¥ JPY</option>
                    <option value="C$">C$ CAD</option>
                    <option value="A$">A$ AUD</option>
                  </select>
                )}
              </div>
            )}
          </div>
          {!compact && results.some((r) => r.warning) && (
            <div className="mb-3 space-y-2">
              {results
                .filter((r) => r.warning)
                .map((r) => (
                  <div
                    key={r.id}
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-accent-amber-400/50 bg-accent-amber-50 px-4 py-3 text-sm dark:bg-transparent"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent-amber-600" aria-hidden="true">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
                    </svg>
                    <p className="font-medium text-accent-amber-700">{r.warning}</p>
                  </div>
                ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Compact hero embed shows only the two headline results (e.g. BMI
                Prime + BMI Score); the full breakdown lives on the calc page. */}
            {(compact ? results.slice(0, 2) : results).map((r) => (
              <div
                key={r.id}
                className={`rounded-xl p-4 ${
                  r.highlight
                    ? 'bg-[var(--brand-default)] text-white'
                    : 'bg-[var(--surface-bg)] border border-[var(--border-warm)]'
                }`}
              >
                <p className={`text-xs font-medium mb-0.5 ${r.highlight ? 'text-white/90' : 'text-[var(--surface-text-muted)]'}`}>{r.label}</p>
                <p className={`text-xl font-bold ${!r.highlight && r.color ? resultColorClasses[r.color] ?? '' : ''}`}>
                  {money(r.value)}
                  {r.unit && <span className={`ml-1 text-sm font-normal ${r.highlight ? 'text-white/90' : 'opacity-75'}`}>{r.unit}</span>}
                </p>
                {!compact && r.interpretation && (
                  <p className={`text-xs mt-1 ${r.highlight ? 'text-white/90' : 'text-[var(--surface-text-secondary)]'}`}>{money(r.interpretation)}</p>
                )}
              </div>
            ))}
          </div>

          {/* Living Answer gauge — "where you fall" on the scale, at a glance. */}
          {config.gauge && (() => {
            let g;
            try {
              g = config.gauge(values);
            } catch {
              g = null;
            }
            if (!g) return null;
            return (
              <div className="mt-5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-warm)] p-4">
                <MiniGauge gauge={g} />
              </div>
            );
          })()}

          {/* Living Answer donut — the actual result split, at a glance.
              Compact, so it shows even alongside an extraPanel. */}
          {config.donut && (() => {
            let d;
            try {
              d = config.donut(values);
            } catch {
              d = null;
            }
            if (!d) return null;
            return (
              <div className="mt-5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-warm)] p-4">
                <MiniDonut donut={d} />
              </div>
            );
          })()}

          {/* Living Answer chart — redraws as inputs/sliders change.
              Suppressed when the calc ships its own extraPanel visualization,
              so rich calcs (loan, compound) don't get a duplicate chart. */}
          {config.chart && !config.extraPanel && (() => {
            let data;
            try {
              data = config.chart(values);
            } catch {
              data = null;
            }
            if (!data) return null;
            return (
              <div className="mt-5">
                {data.caption && (
                  <h3 className="text-xs font-semibold text-[var(--surface-text-muted)] uppercase tracking-wide mb-1">
                    Where your money goes
                  </h3>
                )}
                <MiniAreaChart chart={data} />
              </div>
            );
          })()}
        </div>
      )}

      {/* Compact hero: carry these inputs to the full page for the detailed breakdown */}
      {compact && catSlug && (
        <a
          href={fullBreakdownHref()}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-default)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-default)] active:opacity-90"
        >
          See the full breakdown with your numbers
          <span aria-hidden="true">→</span>
        </a>
      )}

      {/* Compare saved scenarios side by side (e.g. loan A vs loan B) */}
      {!compact && scenarios.length > 0 && (
        <div className="mt-6 border-t border-[var(--border-warm)] pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--surface-text-muted)]">
              Compare scenarios ({scenarios.length})
            </h2>
            <button type="button" onClick={() => setScenarios([])} className={actionBtnCls}>
              Clear
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left font-medium text-[var(--surface-text-muted)]">Metric</th>
                  {scenarios.map((sc, i) => (
                    <th key={sc.id} className="p-2 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-semibold text-[var(--surface-text)]">#{i + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeScenario(sc.id)}
                          aria-label={`Remove scenario ${i + 1}`}
                          className="text-[var(--surface-text-muted)] transition-colors hover:text-accent-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border-warm)]">
                    <td className="p-2 text-[var(--surface-text-secondary)]">{r.label}</td>
                    {scenarios.map((sc) => {
                      const m = sc.results.find((x) => x.id === r.id);
                      return (
                        <td key={sc.id} className="p-2 text-right font-mono font-medium text-[var(--surface-text)]">
                          {m ? `${money(m.value)}${m.unit ? ` ${m.unit}` : ''}` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-tiny text-[var(--surface-text-muted)]">
            Change your inputs above, then press “+ Compare” again to add another column.
          </p>
        </div>
      )}

      {/* Live worked solution — the user's own numbers, step by step */}
      {!compact && config.explainSteps && results.length > 0 && (() => {
        let steps;
        try {
          steps = config.explainSteps(values);
        } catch {
          steps = [];
        }
        if (!steps.length) return null;
        return (
          <div className="border-t border-[var(--border-warm)] mt-6 pt-5">
            <h2 className="text-sm font-semibold text-[var(--surface-text-muted)] mb-1 uppercase tracking-wide">
              How we got this — with your numbers
            </h2>
            <p className="text-xs text-[var(--surface-text-muted)] mb-4">
              The same steps you'd write out by hand.
            </p>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-default)]/10 font-mono text-xs font-bold text-[var(--brand-ink)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--surface-text)]">{step.label}</p>
                    <p className="font-mono text-sm text-[var(--brand-ink)] mt-0.5 overflow-x-auto whitespace-nowrap">
                      {step.expr}
                    </p>
                    {step.note && (
                      <p className="text-xs text-[var(--surface-text-muted)] mt-0.5">{step.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        );
      })()}

      {!compact && config.extraPanel && (
        <div className="mt-6">{config.extraPanel(values, results)}</div>
      )}
    </div>

    {/* Sticky result bar — keeps the headline answer in view after you scroll
        past the calculator, with a jump back to the inputs. Portaled to <body>
        so an ancestor's transform/contain can't break position:fixed. */}
    {!compact && showSticky && stickyResult && typeof document !== 'undefined' &&
      createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-warm)] bg-[var(--surface-card)] px-4 py-3 shadow-card-hover print:hidden">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium text-[var(--surface-text-muted)]">{stickyResult.label}: </span>
              <span className="font-bold text-[var(--surface-text)]">
                {money(stickyResult.value)}
                {stickyResult.unit ? ` ${stickyResult.unit}` : ''}
              </span>
            </p>
            <button
              type="button"
              onClick={() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="shrink-0 rounded-lg bg-[var(--brand-default)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-default)]"
            >
              Edit inputs
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
