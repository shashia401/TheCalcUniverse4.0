import DOMPurify from 'dompurify';
import type { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getResultValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

export default function MarkdownPanel({ values, results }: Props) {
  if (!results.length) return null;

  const rawData = getResultValue(results, '_markdownData');
  if (!rawData) return null;

  let html = '';
  try {
    const parsed = JSON.parse(rawData);
    html = parsed.html || '';
  } catch {
    return null;
  }

  const markdown = values.markdown || '';
  const lineCount = markdown ? markdown.split('\n').length : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-100/50">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-700">
          Live Preview
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        {/* Raw markdown (read-only) */}
        <div className="p-4 bg-slate-50">
          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-2">
            Raw Markdown ({lineCount} lines)
          </div>
          <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto">
            {markdown || (
              <span className="text-slate-400 italic">
                Type markdown in the input field to see it here...
              </span>
            )}
          </pre>
        </div>

        {/* Rendered preview */}
        <div className="p-4">
          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-2">
            Rendered Preview
          </div>
          <div
            className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-blue-600 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-blockquote:border-l-blue-500 overflow-y-auto max-h-96"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
          />
        </div>
      </div>
    </div>
  );
}
