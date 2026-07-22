import { type ReactNode } from 'react';

/** Escape a single CSV field value — wraps in quotes if needed. */
function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Convert headers + rows to a CSV string.
 * An optional footer row is appended after a blank separator line.
 */
export function toCsvString(
  headers: string[],
  rows: (string | number)[][],
  footer?: (string | number)[]
): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  if (footer) {
    lines.push('', footer.map(csvEscape).join(','));
  }
  return lines.join('\n');
}

/**
 * Trigger a browser file download of a CSV.
 *
 * @param filename  Download file name (.csv appended automatically if missing).
 * @param headers   Column header labels.
 * @param rows      Data rows.
 * @param footer    Optional summary row (preceded by a blank separator line).
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  footer?: (string | number)[]
): void {
  const csv = toCsvString(headers, rows, footer);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface DownloadCsvButtonProps {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  footer?: (string | number)[];
  children?: ReactNode;
}

/**
 * A pre-styled download-CSV button consistent with the project's UI patterns.
 *
 * ```tsx
 * <DownloadCsvButton
 *   filename="my-data.csv"
 *   headers={['Name', 'Value']}
 *   rows={[['Foo', 42]]}
 * />
 * ```
 */
export function DownloadCsvButton({
  filename,
  headers,
  rows,
  footer,
  children,
}: DownloadCsvButtonProps) {
  return (
    <button
      onClick={() => downloadCsv(filename, headers, rows, footer)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {children ?? 'Download CSV'}
    </button>
  );
}
