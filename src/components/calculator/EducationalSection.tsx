// Server Component — renders the FULL educational content model to static HTML:
// formula (+ description, variables, source), diagram (first-party SVG, gated by
// scripts/check-svg-safety.mjs in CI), how-to, quick reference, common uses,
// explanation, worked examples, FAQs, pro tips, limitations, citations.
// A student should be able to learn the method from this page alone.
//
// Layout: the formula card (the proof) is always visible. Every other section is a native <details>:
// scannable instead of a wall of text, still in the HTML for crawlers, and it works without JavaScript.
// Examples, FAQs and Sources start open because the page's contents links point at them.

import type { ReactNode } from 'react';
import type { EducationalContent } from '../../types/calculator';
import { splitIntoParagraphs } from '../../utils/paragraphSplit';

interface Props {
  content: EducationalContent;
  calculatorTitle: string;
  /**
   * Ids of inputs with type "custom" (e.g. a multi-row debt list) — their raw
   * value is a JSON-encoded string never meant for display, so worked-example
   * previews skip them instead of dumping `debts = [{"name":...}]` as text.
   */
  customInputIds?: Set<string>;
}

const card = 'bg-[var(--surface-card)] border border-[var(--border-warm)] rounded-xl p-6';

function Section({ title, id, open, children }: { title: string; id?: string; open?: boolean; children: ReactNode }) {
  return (
    <details id={id} open={open || undefined} className={`${card} group scroll-mt-20`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-default)] [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-bold">{title}</h2>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-[var(--surface-text-muted)] transition-transform duration-200 group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export default function EducationalSection({ content, calculatorTitle, customInputIds }: Props) {
  return (
    <div className="space-y-4 text-[var(--surface-text)]">

      {/* Formula + variables: the heart of "see the work" */}
      {content.formula && (
        <div className={card}>
          <h2 className="text-lg font-bold mb-3">How {calculatorTitle} Works</h2>
          <p
            className="font-mono text-sm md:text-base bg-[var(--surface-bg)] border border-[var(--border-warm)] rounded-lg px-4 py-3 whitespace-pre-line overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)]"
            tabIndex={0}
            role="region"
            aria-label="Formula"
          >
            {content.formula}
          </p>
          {content.formulaDescription && (
            <div className="mt-3 space-y-3">
              {splitIntoParagraphs(content.formulaDescription).map((para, i) => (
                <p key={i} className="text-[var(--surface-text-secondary)]">{para}</p>
              ))}
            </div>
          )}

          {content.variables && content.variables.length > 0 && (
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {content.variables.map((v) => (
                <div key={v.symbol} className="flex gap-3 text-sm">
                  <dt className="font-mono font-bold text-[var(--brand-ink)] shrink-0 w-10">{v.symbol}</dt>
                  <dd className="text-[var(--surface-text-secondary)]">
                    <span className="font-medium text-[var(--surface-text)]">{v.name}</span>
                    {' — '}{v.description}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {content.formulaSource && (
            <p className="mt-4 text-xs text-[var(--surface-text-muted)] border-t border-[var(--border-warm)] pt-3">
              <span className="font-semibold">Source:</span> {content.formulaSource}
            </p>
          )}
        </div>
      )}

      {/* Diagram: visual understanding, static SVG in the HTML */}
      {content.diagram?.svg && (
        <figure className={card}>
          <div
            role="img"
            aria-label={content.diagram.alt}
            className="mx-auto max-w-xl [&_svg]:w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: content.diagram.svg }}
          />
          {content.diagram.caption && (
            <figcaption className="mt-3 text-xs text-center text-[var(--surface-text-muted)]">
              {content.diagram.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Worked examples: the "show the substitution" moment */}
      {content.workedExamples && content.workedExamples.length > 0 && (
        <Section title="Worked Examples" id="examples" open>
          <div className="space-y-6">
            {content.workedExamples.map((ex, i) => (
              <div key={i} className="border-l-4 border-[var(--brand-default)] pl-4">
                <p className="font-semibold mb-1.5">{ex.scenario}</p>
                {ex.inputs && Object.keys(ex.inputs).length > 0 && (() => {
                  const shown = Object.entries(ex.inputs).filter(([k]) => !customInputIds?.has(k));
                  return shown.length > 0 ? (
                    <p className="font-mono text-xs text-[var(--surface-text-muted)] mb-1.5 break-words [overflow-wrap:anywhere]">
                      {shown.map(([k, v]) => `${k} = ${v}`).join('  ·  ')}
                    </p>
                  ) : null;
                })()}
                <p className="text-[var(--brand-ink)] font-bold font-mono">{ex.result}</p>
                <p className="text-sm text-[var(--surface-text-muted)] mt-1">{ex.insight}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Long-form explanation */}
      {content.explanation && (
        <Section title="Understanding the Result">
          <div className="space-y-3">
            {splitIntoParagraphs(content.explanation).map((para, i) => (
              <p key={i} className="text-[var(--surface-text-secondary)] whitespace-pre-line leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        </Section>
      )}

      {/* How to use */}
      {content.howToUse && content.howToUse.length > 0 && (
        <Section title="How to Use">
          <ol className="space-y-2 list-decimal list-inside">
            {content.howToUse.map((step, i) => (
              <li key={i} className="text-[var(--surface-text-secondary)]">{step}</li>
            ))}
          </ol>
        </Section>
      )}

      {/* Quick reference table */}
      {content.quickReference && content.quickReference.length > 0 && (
        <Section title="Quick Reference">
          <div className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)]" tabIndex={0} role="region" aria-label="Quick reference table">
            <table className="w-full text-sm">
              <tbody>
                {content.quickReference.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--border-warm)] last:border-b-0">
                    <td className="py-2 pr-4 font-mono font-medium">{row.label}</td>
                    <td className="py-2 font-mono text-[var(--surface-text-secondary)]">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* FAQs */}
      {content.faqs && content.faqs.length > 0 && (
        <Section title="Frequently Asked Questions" id="faqs" open>
          <dl className="space-y-4">
            {content.faqs.map((faq, i) => (
              <div key={i}>
                <dt className="font-semibold mb-1">{faq.question}</dt>
                <dd className="text-[var(--surface-text-secondary)]">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {/* Common uses */}
      {content.commonUses && content.commonUses.length > 0 && (
        <Section title="Common Uses">
          <ul className="space-y-2">
            {content.commonUses.map((use, i) => (
              <li key={i} className="text-[var(--surface-text-secondary)] flex gap-2">
                <span className="text-[var(--brand-ink)]">•</span>
                {use}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Pro tips */}
      {content.proTips && content.proTips.length > 0 && (
        <Section title="Pro Tips">
          <ul className="space-y-2">
            {content.proTips.map((tip, i) => (
              <li key={i} className="text-[var(--surface-text-secondary)] flex gap-2">
                <span className="text-[var(--accent-amber)]">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Limitations */}
      {content.limitations && content.limitations.length > 0 && (
        <Section title="Limitations to Know">
          <ul className="space-y-2">
            {content.limitations.map((lim, i) => (
              <li key={i} className="text-[var(--surface-text-secondary)] flex gap-2">
                <span className="text-[var(--surface-text-muted)]">•</span>
                {lim}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Citations */}
      {content.citations && content.citations.length > 0 && (
        <Section title="Sources" id="sources" open>
          <ul className="space-y-1.5 text-sm">
            {content.citations.map((c, i) => (
              <li key={i}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-ink)] hover:underline"
                >
                  {c.title ?? c.source ?? c.url}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

    </div>
  );
}
