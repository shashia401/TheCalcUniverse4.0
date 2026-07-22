import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function FractionToDecimalPanel({ values, results }: Props) {
  const mode = values.mode || 'ftod';
  const decimalRow = results.find(r => r.id === 'decimal');
  const fractionRow = results.find(r => r.id === 'fraction');
  const simplifiedRow = results.find(r => r.id === 'simplified');
  const percentageRow = results.find(r => r.id === 'percentage');

  if (!results.length) return null;

  // Determine numerator and denominator for visualization
  const vizData = useMemo(() => {
    if (mode === 'ftod') {
      const num = parseFloat(values.numerator || '0');
      const den = parseFloat(values.denominator || '1');
      if (isNaN(num) || isNaN(den) || den <= 0) return null;
      return { numerator: num, denominator: den, label: `${num}/${den}` };
    }
    if (mode === 'mixed') {
      const whole = parseFloat(values.wholeNumber || '0');
      const num = parseFloat(values.numerator || '0');
      const den = parseFloat(values.denominator || '1');
      if (isNaN(num) || isNaN(den) || den <= 0) return null;
      const totalNum = whole * den + num;
      return { numerator: totalNum, denominator: den, label: `${whole} ${num}/${den}` };
    }
    if (mode === 'dtof') {
      // Parse the fraction from the simplified row (preferred) or the raw fraction row
      const source = simplifiedRow || fractionRow;
      if (source) {
        const parts = source.value.split('/');
        if (parts.length === 2) {
          const num = parseFloat(parts[0]);
          const den = parseFloat(parts[1]);
          if (!isNaN(num) && !isNaN(den) && den > 0) {
            return { numerator: num, denominator: den, label: `${num}/${den}` };
          }
        }
      }
      return null;
    }
    return null;
  }, [mode, values, simplifiedRow, fractionRow]);

  const showFractionViz = vizData && vizData.denominator <= 20 && vizData.numerator >= 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Visual Conversion</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Main result */}
        {decimalRow && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
            <p className="text-xs text-slate-500 mb-1">Decimal Value</p>
            <p className="text-3xl font-bold font-mono text-blue-700">{decimalRow.value}</p>
          </div>
        )}
        {fractionRow && !decimalRow && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
            <p className="text-xs text-slate-500 mb-1">Fraction</p>
            <p className="text-3xl font-bold font-mono text-blue-700">{fractionRow.value}</p>
          </div>
        )}

        {/* Fraction Pie Chart */}
        {showFractionViz && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 text-center">
              {vizData.label}
            </p>
            <div className="flex items-center justify-center">
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Filled', value: Math.min(Math.max(vizData.numerator, 0), vizData.denominator) },
                        { name: 'Empty', value: Math.max(vizData.denominator - Math.min(Math.max(vizData.numerator, 0), vizData.denominator), 0) },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={68}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> Filled ({vizData.numerator})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" /> Empty ({vizData.denominator - vizData.numerator})
              </div>
            </div>
          </div>
        )}

        {/* Results grid */}
        <div className="grid grid-cols-2 gap-3">
          {simplifiedRow && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Simplified</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-1">{simplifiedRow.value}</p>
            </div>
          )}
          {percentageRow && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Percentage</p>
              <p className="text-sm font-mono font-bold text-green-700 mt-1">{percentageRow.value}</p>
            </div>
          )}
          {results.find(r => r.id === 'improper') && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Improper Fraction</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-1">{results.find(r => r.id === 'improper')?.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
