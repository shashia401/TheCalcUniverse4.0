import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function MatrixPanel({ values, results }: Props) {
  const matrixData = results.find(r => r.id === '_matrixData')?.value;
  const inverseData = results.find(r => r.id === '_inverseData')?.value;
  const operation = values.operation || 'determinant';
  const size = parseInt(values.size, 10) || 2;

  let matrix: number[][] = [];
  let inverse: number[][] | null = null;
  try {
    if (matrixData) matrix = JSON.parse(matrixData);
    if (inverseData) inverse = JSON.parse(inverseData);
  } catch { /* ignore */ }

  if (results.length === 0 || matrix.length === 0) return null;

  const fmt = (n: number) => parseFloat(n.toFixed(6)).toString();

  const renderMatrix = (m: number[][], label: string, color: string) => (
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
                    <span key={j} className="w-14 text-right font-bold">{fmt(v)}</span>
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
          {operation === 'determinant' ? 'Determinant' : 'Matrix Inverse'} — Step by Step
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Input Matrix */}
        {renderMatrix(matrix, `Matrix A (${size}×${size})`, '#334155')}

        {operation === 'determinant' && (
          <>
            {/* Determinant calculation steps */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">Calculation</p>
              {size === 2 && (
                <p className="text-sm font-mono text-blue-700">
                  det(A) = ({fmt(matrix[0][0])})({fmt(matrix[1][1])}) − ({fmt(matrix[0][1])})({fmt(matrix[1][0])})
                  {' = '}{fmt(matrix[0][0] * matrix[1][1])} − {fmt(matrix[0][1] * matrix[1][0])}
                  {' = '}{results.find(r => r.id === 'determinant')?.value}
                </p>
              )}
              {size === 3 && (
                <div className="text-sm font-mono text-blue-700 space-y-1">
                  <p>det(A) = a(ei − fh) − b(di − fg) + c(dh − eg)</p>
                  <p>
                    = {fmt(matrix[0][0])}({fmt(matrix[1][1])}·{fmt(matrix[2][2])} − {fmt(matrix[1][2])}·{fmt(matrix[2][1])})
                    {' − '}{fmt(matrix[0][1])}({fmt(matrix[1][0])}·{fmt(matrix[2][2])} − {fmt(matrix[1][2])}·{fmt(matrix[2][0])})
                    {' + '}{fmt(matrix[0][2])}({fmt(matrix[1][0])}·{fmt(matrix[2][1])} − {fmt(matrix[1][1])}·{fmt(matrix[2][0])})
                  </p>
                  <p className="font-bold">= {results.find(r => r.id === 'determinant')?.value}</p>
                </div>
              )}
              {size >= 4 && (
                <p className="text-sm text-blue-700">
                  Laplace expansion along the first row. det(A) = {results.find(r => r.id === 'determinant')?.value}
                </p>
              )}
            </div>

            {/* Determinant result */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">det(A)</p>
              <p className="text-3xl font-bold font-mono text-emerald-700">{results.find(r => r.id === 'determinant')?.value}</p>
            </div>
          </>
        )}

        {operation === 'inverse' && (
          <>
            {inverse ? (
              <>
                {renderMatrix(inverse, 'A⁻¹ (Inverse)', '#10b981')}

                {/* Verification: A × A⁻¹ = I */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Verification</p>
                  <p className="text-xs text-amber-700">
                    A × A⁻¹ should equal the identity matrix I (for a {size}×{size} matrix).
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">LaTeX (for assignments)</p>
                  <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap bg-white rounded p-2 border border-slate-200">
                    {inverse.length > 0 && `A^{-1} = \\begin{pmatrix}\n${inverse.map(row => row.map(v => fmt(v)).join(' & ')).join(' \\\\\n')}\n\\end{pmatrix}`}
                  </pre>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
                <p className="text-sm font-bold text-red-700">Matrix is singular — no inverse exists.</p>
                <p className="text-xs text-red-500 mt-1">The determinant is zero, meaning the rows are linearly dependent.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
