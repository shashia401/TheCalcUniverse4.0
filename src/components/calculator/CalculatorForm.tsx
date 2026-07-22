// THE island — the only hydrated component on a calculator page (client:visible).
//
// It receives only the calculator id (island props must be JSON-serializable;
// CalculatorConfig contains functions and cannot cross the server→client boundary).
// The config is loaded here via the registry's dynamic import, which Vite splits
// into a per-calculator chunk — a page only ever downloads its own logic.

import { useEffect, useState, type HTMLAttributes } from 'react';
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
}

const fieldClasses =
  'w-full rounded-lg border border-[var(--border-warm)] bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--surface-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-default)] focus:border-[var(--brand-default)]';

const resultColorClasses: Record<string, string> = {
  positive: 'text-accent-emerald-600',
  negative: 'text-accent-rose-600',
};

export default function CalculatorForm({ calculatorId, compact = false }: Props) {
  const [config, setConfig] = useState<CalculatorConfig | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<CalculatorResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
      .map((r) => `${r.label}: ${r.value}${r.unit ? ` ${r.unit}` : ''}`)
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

  useEffect(() => {
    let cancelled = false;
    const entry = getCalculatorById(calculatorId);
    if (!entry) return;
    entry.loader().then(({ default: cfg }) => {
      if (cancelled) return;
      const defaults: Record<string, string> = {};
      for (const input of cfg.inputs) {
        defaults[input.id] = String(input.defaultValue ?? '');
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
    (input) => !input.showWhen || input.showWhen(values)
  );

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

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-warm)] rounded-2xl p-6 md:p-8">
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--surface-text-muted)] uppercase tracking-wide">
              Results
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={copyLink}
                title="Copy a link to this exact scenario"
                className="text-xs font-medium text-[var(--brand-default)] rounded px-2 py-1 transition-colors hover:bg-[var(--surface-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)] active:opacity-70"
              >
                {linkCopied ? 'Link copied ✓' : 'Copy link'}
              </button>
              <button
                type="button"
                onClick={copyResults}
                className="text-xs font-medium text-[var(--brand-default)] rounded px-2 py-1 transition-colors hover:bg-[var(--surface-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)] active:opacity-70"
              >
                {copied ? 'Copied ✓' : 'Copy results'}
              </button>
            </div>
          </div>
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
                <p className="text-xs font-medium opacity-75 mb-0.5">{r.label}</p>
                <p className={`text-xl font-bold ${!r.highlight && r.color ? resultColorClasses[r.color] ?? '' : ''}`}>
                  {r.value}
                  {r.unit && <span className="ml-1 text-sm font-normal opacity-75">{r.unit}</span>}
                </p>
                {!compact && r.interpretation && (
                  <p className="text-xs opacity-80 mt-1">{r.interpretation}</p>
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
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-default)]/10 font-mono text-xs font-bold text-[var(--brand-default)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--surface-text)]">{step.label}</p>
                    <p className="font-mono text-sm text-[var(--brand-default)] mt-0.5 overflow-x-auto whitespace-nowrap">
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
  );
}
