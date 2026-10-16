import { CalculatorResult } from '../../../types/calculator';
import { mulFrac } from '../../../utils/rational';
import { fmtExact, parseMatrix } from './matrixMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const parse = (v?: string): string[][] | null => {
  try {
    return v ? (JSON.parse(v) as string[][]) : null;
  } catch {
    return null;
  }
};

export default function MatrixPanel({ values, results }: Props) {
  const operation = values.operation || 'determinant';
  const size = Number(values.size) || 2;
  const matrix = parse(results.find((r) => r.id === '_matrixData')?.value) ?? [];
  const inverse = parse(results.find((r) => r.id === '_inverseData')?.value);
  const rrefM = parse(results.find((r) => r.id === '_rrefData')?.value);
  const exact = parseMatrix(values.matrixA ?? '', size);
  const detText = results.find((r) => r.id === 'determinant')?.value;

  if (results.length === 0 || matrix.length === 0) return null;
  // Products for the 2×2 / 3×3 worked lines, exact (no float rounding in the displayed arithmetic).
  const prod = (i1: number, j1: number, i2: number, j2: number) => (exact ? fmtExact(mulFrac(exact[i1][j1], exact[i2][j2])) : '');
  const tex = (v: string) => v.replace(/^(-?)(\d+)\/(\d+)$/, '$1\\frac{$2}{$3}');

  const renderMatrix = (m: string[][], label: string, color: string) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <div className="flex justify-center">
        <div className="inline-flex flex-col items-center">
          {/* Bracket + rows */}
          <div className="flex">
            <span className="text-2xl text-slate-500 self-stretch flex items-center">[</span>
            <div className="px-3 py-1">
              {m.map((row, i) => (
                <div key={`item-${i}`} className="flex gap-3 justify-center font-mono text-sm" style={{ color }}>
                  {row.map((v, j) => (
                    <span key={j} className="min-w-14 text-right font-bold">{v}</span>
                  ))}
                </div>
              ))}
            </div>
            <span className="text-2xl text-slate-500 self-stretch flex items-center">]</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {operation === 'determinant' ? 'Determinant' : operation === 'inverse' ? 'Matrix Inverse' : 'Rank and RREF'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Input Matrix */}
        {renderMatrix(matrix, `Matrix A (${size}×${size})`, '#334155')}

        {operation === 'determinant' && (
          <>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-800 mb-2">Calculation</p>
              {size === 2 && (
                <p className="text-sm font-mono text-blue-800">
                  det(A) = ({matrix[0][0]})({matrix[1][1]}) − ({matrix[0][1]})({matrix[1][0]})
                  {' = '}{prod(0, 0, 1, 1)} − {prod(0, 1, 1, 0)}
                  {' = '}{detText}
                </p>
              )}
              {size === 3 && (
                <div className="text-sm font-mono text-blue-800 space-y-1">
                  <p>det(A) = a(ei − fh) − b(di − fg) + c(dh − eg)</p>
                  <p>
                    = {matrix[0][0]}({matrix[1][1]}·{matrix[2][2]} − {matrix[1][2]}·{matrix[2][1]})
                    {' − '}({matrix[0][1]})({matrix[1][0]}·{matrix[2][2]} − {matrix[1][2]}·{matrix[2][0]})
                    {' + '}({matrix[0][2]})({matrix[1][0]}·{matrix[2][1]} − {matrix[1][1]}·{matrix[2][0]})
                  </p>
                  <p className="font-bold">= {detText}</p>
                </div>
              )}
              {size >= 4 && (
                <p className="text-sm text-blue-800">
                  Exact Gaussian elimination with row swaps (equal to the Laplace expansion along any row). det(A) = {detText}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">det(A)</p>
              <p className="text-3xl font-bold font-mono text-emerald-800 break-all">{detText}</p>
            </div>
          </>
        )}

        {operation === 'inverse' && (
          <>
            {inverse ? (
              <>
                {renderMatrix(inverse, 'A⁻¹ (Inverse)', '#047857')}

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-2">Verification</p>
                  <p className="text-xs text-amber-800">
                    A × A⁻¹ equals the identity matrix I (for a {size}×{size} matrix). Entries are exact fractions or decimals.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">LaTeX (for assignments)</p>
                  <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap bg-white rounded p-2 border border-slate-200">
                    {`A^{-1} = \\begin{pmatrix}\n${inverse.map((row) => row.map(tex).join(' & ')).join(' \\\\\n')}\n\\end{pmatrix}`}
                  </pre>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
                <p className="text-sm font-bold text-red-700">Matrix is singular — no inverse exists.</p>
                <p className="text-xs text-red-700 mt-1">The determinant is zero, meaning the rows are linearly dependent.</p>
              </div>
            )}
          </>
        )}

        {operation === 'rank' && rrefM && (
          <>
            {renderMatrix(rrefM, 'Reduced row echelon form', '#047857')}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              Rank = {results.find((r) => r.id === 'rank')?.value} (non-zero rows of the RREF); nullity = {results.find((r) => r.id === 'nullity')?.value}.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
