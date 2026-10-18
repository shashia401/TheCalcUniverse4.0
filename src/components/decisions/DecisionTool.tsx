// Generic decision-tool island: renders any DecisionEngine (src/lib/decisionEngine.ts) as one form with a
// sticky verdict beside it, linked step cards below, a shareable link and up to four saved scenarios.
//
// SSR: the server renders the engine's default scenario, so the page ships real numbers in its HTML. After
// hydration the URL query (a shared link) and saved scenarios are applied and data-decision-ready flips to
// "true" (tests and fast typists wait for it).
import { useEffect, useMemo, useState } from 'react';
import { GroupedNumberInput } from '../calculator/GroupedNumberInput';
import type { DecisionEngine, Line, VerdictLevel } from '../../lib/decisionEngine';

const STYLE: Record<VerdictLevel, { box: string; badge: string }> = {
  comfortable: { box: 'border-accent-emerald-400/60 bg-accent-emerald-50 dark:bg-emerald-950/30', badge: 'bg-accent-emerald-600 text-white' },
  tight: { box: 'border-accent-amber-400/60 bg-accent-amber-50 dark:bg-amber-950/20', badge: 'bg-accent-amber-600 text-white' },
  over: { box: 'border-accent-rose-400/60 bg-accent-rose-50 dark:bg-rose-950/20', badge: 'bg-accent-rose-600 text-white' },
};

const TONE: Record<'positive' | 'neutral' | 'negative', string> = {
  positive: 'text-accent-emerald-700 dark:text-accent-emerald-400',
  neutral: 'text-accent-amber-700 dark:text-accent-amber-400',
  negative: 'text-accent-rose-700 dark:text-accent-rose-400',
};

const inputCls =
  'min-h-[44px] w-full rounded-lg border border-[var(--border-warm)] bg-[var(--surface-bg)] px-3 py-2 text-base sm:text-sm text-[var(--surface-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-default)] focus:border-[var(--brand-default)]';
const btnPrimary =
  'rounded-lg bg-[var(--brand-default)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-default)]';
const btnGhost =
  'rounded-lg border border-[var(--border-warm)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:border-[var(--brand-default)] active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-default)]';

function Row({ line }: { line: Line }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-[var(--surface-text-secondary)]">{line.label}</dt>
      <dd className={`shrink-0 whitespace-nowrap text-right ${line.strong ? 'text-base font-bold text-[var(--surface-text)]' : 'text-sm font-semibold text-[var(--surface-text)]'}`}>{line.value}</dd>
    </div>
  );
}

interface Saved<I> { id: number; name: string; inputs: I }

export default function DecisionTool<I extends { [K in keyof I]: number }, D>({ engine }: { engine: DecisionEngine<I, D> }) {
  type Raw = Record<keyof I, string>;
  const toRaw = (i: I): Raw => Object.fromEntries(Object.entries(i).map(([k, v]) => [k, String(v)])) as Raw;
  const fromRaw = (r: Raw): I =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v).trim() === '' ? NaN : Number(String(v).replace(/,/g, ''))])) as unknown as I;

  const [raw, setRaw] = useState<Raw>(() => toRaw(engine.defaults));
  const [saved, setSaved] = useState<Saved<I>[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.location.search) setRaw(toRaw(engine.fromQuery(window.location.search)));
    try {
      const stored = JSON.parse(localStorage.getItem(engine.storageKey) || '[]');
      if (Array.isArray(stored)) {
        setSaved(stored.filter((s) => s && s.inputs && engine.validate({ ...engine.defaults, ...s.inputs })).slice(0, 4));
      }
    } catch { /* storage blocked or corrupt: start empty */ }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputs = useMemo(() => fromRaw(raw), [raw]);
  const ok = engine.validate(inputs);
  const d = useMemo(() => (ok ? engine.evaluate(inputs) : null), [ok, inputs]);
  const verdict = d ? engine.verdict(d, inputs) : null;
  const steps = d ? engine.steps(d, inputs) : [];

  const set = (key: string, value: string) => {
    const next = { ...raw, [key]: value };
    setRaw(next);
    const parsed = fromRaw(next);
    if (engine.validate(parsed)) window.history.replaceState(null, '', `?${engine.toQuery(parsed)}`);
  };

  const persist = (list: Saved<I>[]) => {
    setSaved(list);
    try { localStorage.setItem(engine.storageKey, JSON.stringify(list)); } catch { /* ignore */ }
  };
  const saveScenario = () => {
    if (!ok) return;
    persist([...saved, { id: Date.now(), name: `Scenario ${String.fromCharCode(65 + (saved.length % 26))}`, inputs }].slice(-4));
  };
  const copyLink = () => {
    if (!ok) return;
    const url = `${window.location.origin}${window.location.pathname}?${engine.toQuery(inputs)}`;
    navigator.clipboard?.writeText(url).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }).catch(() => {});
  };

  const style = verdict ? STYLE[verdict.level] : null;

  return (
    <div data-decision-ready={ready ? 'true' : 'false'} className="space-y-8">
      {/* inputs beside the verdict; the sticky verdict stays inside this grid so it never overlaps what follows */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="space-y-6">
          {engine.groups.map((g) => (
            <fieldset key={g.title} className="rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-card)] p-5">
              <legend className="px-1 text-sm font-bold text-[var(--surface-text)]">{g.title}</legend>
              <p className="-mt-1 mb-3 text-xs text-[var(--surface-text-muted)]">{g.hint}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {g.fields.map((f) => {
                  const bad = Number.isNaN(inputs[f.key as keyof I]);
                  const id = `${engine.idPrefix}-${f.key}`;
                  return (
                    <div key={f.key}>
                      <label htmlFor={id} className="mb-1 block text-sm font-medium text-[var(--surface-text)]">{f.label}</label>
                      <div className="flex items-center gap-2">
                        {f.prefix && <span className="text-sm text-[var(--surface-text-muted)]" aria-hidden="true">{f.prefix}</span>}
                        {f.prefix === '$' ? (
                          <GroupedNumberInput id={id} rawValue={raw[f.key as keyof I]} prefix="$" inputMode="decimal" className={inputCls} onRawChange={(v) => set(f.key, v)} />
                        ) : (
                          <input
                            id={id}
                            type="text"
                            inputMode="decimal"
                            value={raw[f.key as keyof I]}
                            onChange={(e) => set(f.key, e.target.value)}
                            aria-invalid={bad || undefined}
                            className={inputCls}
                          />
                        )}
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
              {engine.invalidMessage}
            </p>
          )}
        </div>

        <div aria-live="polite" className="lg:sticky lg:top-24">
          {verdict && style ? (
            <div className={`rounded-2xl border p-5 ${style.box}`}>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${style.badge}`}>{verdict.title}</span>
              <p className="mt-3 text-sm text-[var(--surface-text)]">{verdict.line}</p>
              <dl className="mt-4 divide-y divide-[var(--border-warm)]">
                {verdict.lines.map((l) => <Row key={l.label} line={l} />)}
              </dl>
              <ul className="mt-4 space-y-1.5 text-sm text-[var(--surface-text)]">
                {verdict.reasons.map((r) => (
                  <li key={r} className="flex gap-2"><span aria-hidden="true">•</span><span>{r}</span></li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2 print:hidden">
                <button type="button" onClick={saveScenario} className={btnPrimary}>Save scenario</button>
                <button type="button" onClick={copyLink} className={btnGhost}>{linkCopied ? 'Link copied ✓' : 'Copy link to this scenario'}</button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border-warm)] p-5 text-sm text-[var(--surface-text-secondary)]">{engine.emptyMessage}</div>
          )}
        </div>
      </div>

      {d && steps.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((s, n) => (
            <section key={s.title} aria-label={s.title} className="rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-card)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--surface-text-muted)]">Step {n + 1}</p>
              <h3 className="mt-0.5 text-lg font-bold text-[var(--surface-text)]">{s.title}</h3>
              <p className="mt-1 text-sm text-[var(--surface-text-secondary)]">{s.answer}</p>
              <dl className="mt-3 divide-y divide-[var(--border-warm)]">
                {s.lines.map((l) => <Row key={l.label} line={l} />)}
              </dl>
              {s.note && <p className={`mt-2 text-xs ${TONE[s.note.tone]}`}>{s.note.text}</p>}
              <a href={s.href} className="mt-3 inline-block text-sm font-medium text-[var(--brand-ink)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)] active:opacity-80">
                {s.linkLabel} →
              </a>
            </section>
          ))}
        </div>
      )}

      <section aria-label="Saved scenarios" className="rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-card)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[var(--surface-text)]">Compare scenarios</h3>
          {saved.length > 0 && <button type="button" onClick={() => persist([])} className="text-sm font-medium text-[var(--brand-ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)]">Clear all</button>}
        </div>
        {saved.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--surface-text-secondary)]">
            Change {engine.compareHint}, press “Save scenario”, and compare up to four side by side. They stay in this browser only.
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
                      <a href={`?${engine.toQuery(s.inputs)}`} className="block text-xs font-normal text-[var(--brand-ink)] hover:underline">Open</a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {engine.compareRows.map((row) => (
                  <tr key={row.label} className="border-t border-[var(--border-warm)]">
                    <th scope="row" className="p-2 text-left font-normal text-[var(--surface-text-secondary)]">{row.label}</th>
                    {saved.map((s) => (
                      <td key={s.id} className="p-2 text-right font-medium text-[var(--surface-text)]">{row.value(engine.evaluate(s.inputs), s.inputs)}</td>
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
