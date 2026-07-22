import { CalculatorResult } from '../../../types/calculator';

interface DivisionStep {
  product: number;
  subtraction: number;
  digit?: number;
}

interface DivisionData {
  dividend: number;
  divisor: number;
  steps: DivisionStep[];
  quotient: number;
  remainder: number;
  decimalResult: string;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LongDivisionPanel({ results }: Props) {
  const divisionData = results.find(r => r.id === '_divisionData')?.value;

  if (!divisionData || results.length === 0) return null;

  let data: DivisionData;
  try {
    data = JSON.parse(divisionData);
  } catch {
    return null;
  }

  const { dividend, divisor, steps, quotient, remainder, decimalResult } = data;

  if (steps.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="p-5 text-center text-slate-500">
          Result: {results.find(r => r.id === 'quotient')?.value}
        </div>
      </div>
    );
  }

  const paddingRight = 60;
  const rowHeight = 32;
  const colWidth = 32;
  const digitCount = dividend.toString().length;
  const svgW = paddingRight + digitCount * colWidth + 80;
  const svgH = 60 + steps.length * rowHeight;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Long Division Tableau</span>
      </div>

      <div className="p-5 space-y-4">
        {/* SVG Long Division Bracket */}
        <div className="flex justify-center overflow-x-auto">
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="font-mono" role="img" aria-label="Long division bracket diagram showing divisor, dividend, quotient, and calculation steps">
            {/* Division bracket: divisor on left, dividend inside */}
            <text x="10" y="24" fontSize="14" fontWeight="bold" fill="#3b82f6">{divisor}</text>
            {/* Bracket: horizontal top + vertical left */}
            <line x1="40" y1="8" x2={paddingRight + digitCount * colWidth + 10} y2="8" stroke="#334155" strokeWidth="2" />
            <line x1="40" y1="8" x2="40" y2="20" stroke="#334155" strokeWidth="2" />

            {/* Dividend digits on top inside bracket */}
            {dividend.toString().split('').map((d, i) => (
              <text key={`item-${i}`} x={paddingRight + i * colWidth + 10} y="24" fontSize="14" fontWeight="bold" fill="#334155" textAnchor="middle">
                {d}
              </text>
            ))}

            {/* Quotient above bracket */}
            {quotient.toString().split('').map((d, i) => (
              <text key={`item-${i}`} x={paddingRight + i * colWidth + 10} y={8 - 4} fontSize="14" fontWeight="bold" fill="#10b981" textAnchor="middle">
                {d}
              </text>
            ))}

            {/* Step rows */}
            {steps.map((step, i) => {
              const yBase = 40 + i * rowHeight;
              const startCol = steps.length - 1 - i;

              return (
                <g key={`item-${i}`}>
                  {/* Product (divisor × quotient digit) */}
                  {step.product > 0 && (
                    <text x={paddingRight + startCol * colWidth + 10} y={yBase} fontSize="13" fill="#64748b" textAnchor="middle">
                      −{step.product}
                    </text>
                  )}

                  {/* Subtraction line */}
                  {step.product > 0 && (
                    <line
                      x1={paddingRight + startCol * colWidth - 5}
                      y1={yBase + 4}
                      x2={paddingRight + digitCount * colWidth + 10}
                      y2={yBase + 4}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                  )}

                  {/* Subtraction result */}
                  <text x={paddingRight + startCol * colWidth + 10} y={yBase + 20} fontSize="13" fontWeight="bold" fill="#1e293b" textAnchor="middle">
                    {step.subtraction}
                  </text>

                  {/* Brought down digit */}
                  {i < steps.length - 1 && (
                    <text x={paddingRight + (startCol - 1) * colWidth + 10} y={yBase + 20} fontSize="13" fill="#8b5cf6" textAnchor="middle">
                      {steps[i + 1]?.digit ?? ''}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Result cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Quotient</p>
            <p className="text-xl font-bold font-mono text-emerald-700">{quotient}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Remainder</p>
            <p className="text-xl font-bold font-mono text-blue-700">{remainder}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Decimal</p>
            <p className="text-xl font-bold font-mono text-slate-700">{decimalResult}</p>
          </div>
        </div>

        {/* Verification */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 text-center font-mono">
          {quotient} × {divisor} + {remainder} = {quotient * divisor + remainder}
          {' '}{quotient * divisor + remainder === dividend ? '✓' : ''}
        </div>
      </div>
    </div>
  );
}
