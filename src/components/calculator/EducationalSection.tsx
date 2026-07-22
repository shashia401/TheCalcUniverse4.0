// Server Component — renders the FULL educational content model to static HTML:
// formula (+ description, variables, source), diagram (first-party SVG, gated by
// scripts/check-svg-safety.mjs in CI), how-to, quick reference, common uses,
// explanation, worked examples, FAQs, pro tips, limitations, citations.
// A student should be able to learn the method from this page alone.

import type { EducationalContent } from '../../types/calculator';

interface Props {
  content: EducationalContent;
  calculatorTitle: string;
}

const card = 'bg-[var(--surface-card)] border border-[var(--border-warm)] rounded-xl p-6';

export default function EducationalSection({ content, calculatorTitle }: Props) {
  return (
    <div className="space-y-8 text-[var(--surface-text)]">

      {/* Formula + variables: the heart of "see the work" */}
      {content.formula && (
        <div className={card}>
          <h2 className="text-lg font-bold mb-3">How {calculatorTitle} Works</h2>
          <p className="font-mono text-sm md:text-base bg-[var(--surface-bg)] border border-[var(--border-warm)] rounded-lg px-4 py-3 whitespace-pre-line overflow-x-auto">
            {content.formula}
          </p>
          {content.formulaDescription && (
            <p className="mt-3 text-[var(--surface-text-secondary)]">{content.formulaDescription}</p>
          )}

          {content.variables && content.variables.length > 0 && (
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {content.variables.map((v) => (
                <div key={v.symbol} className="flex gap-3 text-sm">
                  <dt className="font-mono font-bold text-[var(--brand-default)] shrink-0 w-10">{v.symbol}</dt>
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
      {content.diagram && (
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

      {/* How to use */}
      {content.howToUse && content.howToUse.length > 0 && (
        <div className={card}>
          <h2 className="text-lg font-bold mb-4">How to Use</h2>
          <ol className="space-y-2 list-decimal list-inside">
            {content.howToUse.map((step, i) => (
              <li key={i} className="text-[var(--surface-text-secondary)]">{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Quick reference table */}
      {content.quickReference && content.quickReference.length > 0 && (
        <div className={card}>
          <h2 className="text-lg font-bold mb-4">Quick Reference</h2>
          <div className="overflow-x-auto">
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
        </div>
      )}

      {/* Common uses */}
      {content.commonUses && content.commonUses.length > 0 && (
        <div className={card}>
          <h2 className="text-lg font-bold mb-3">Common Uses</h2>
          <ul className="space-y-2">
            {content.commonUses.map((use, i) => (
              <li key={i} className="text-[var(--surface-text-secondary)] flex gap-2">
                <span className="text-[var(--brand-default)]">•</span>
                {use}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Long-form explanation */}
      {content.explanation && (
        <div className={card}>
          <h2 className="text-lg font-bold mb-3">Understanding the Result</h2>
          <p className="text-[var(--surface-text-secondary)] whitespace-pre-line leading-relaxed">
            {content.explanation}
          </p>
        </div>
      )}

      {/* Worked examples: the "show the substitution" moment */}
      {content.workedExamples && content.workedExamples.length > 0 && (
        <div className={card} id="examples">
          <h2 className="text-lg font-bold mb-4">Worked Examples</h2>
          <div className="space-y-6">
            {content.workedExamples.map((ex, i) => (
              <div key={i} className="border-l-4 border-[var(--brand-default)] pl-4">
                <p className="font-semibold mb-1.5">{ex.scenario}</p>
                {ex.inputs && Object.keys(ex.inputs).length > 0 && (
                  <p className="font-mono text-xs text-[var(--surface-text-muted)] mb-1.5">
                    {Object.entries(ex.inputs).map(([k, v]) => `${k} = ${v}`).join('  ·  ')}
                  </p>
                )}
                <p className="text-[var(--brand-default)] font-bold font-mono">{ex.result}</p>
                <p className="text-sm text-[var(--surface-text-muted)] mt-1">{ex.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      {content.faqs && content.faqs.length > 0 && (
        <div className={card} id="faqs">
          <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
          <dl className="space-y-4">
            {content.faqs.map((faq, i) => (
              <div key={i}>
                <dt className="font-semibold mb-1">{faq.question}</dt>
                <dd className="text-[var(--surface-text-secondary)]">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Pro tips */}
      {content.proTips && content.proTips.length > 0 && (
        <div className={card}>
          <h2 className="text-lg font-bold mb-3">Pro Tips</h2>
          <ul className="space-y-2">
            {content.proTips.map((tip, i) => (
              <li key={i} className="text-[var(--surface-text-secondary)] flex gap-2">
                <span className="text-[var(--accent-amber)]">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Limitations */}
      {content.limitations && content.limitations.length > 0 && (
        <div className={card}>
          <h2 className="text-lg font-bold mb-3">Limitations to Know</h2>
          <ul className="space-y-2">
            {content.limitations.map((lim, i) => (
              <li key={i} className="text-[var(--surface-text-secondary)] flex gap-2">
                <span className="text-[var(--surface-text-muted)]">•</span>
                {lim}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Citations */}
      {content.citations && content.citations.length > 0 && (
        <div className={card} id="sources">
          <h2 className="text-lg font-bold mb-3">Sources</h2>
          <ul className="space-y-1.5 text-sm">
            {content.citations.map((c, i) => (
              <li key={i}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-default)] hover:underline"
                >
                  {c.title ?? c.source ?? c.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
