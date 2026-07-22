import { TrendingDown } from 'lucide-react';
import type { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CashBackPanel({ values, results }: Props) {
  if (!results || results.length === 0) return null;

  // ---- Derive raw numbers from values for the chart ----
  const vehiclePrice = parseFloat(values.vehiclePrice) || 0;
  const downPayment = parseFloat(values.downPayment) || 0;
  const n = parseFloat(values.loanTermMonths || '60');
  const cashRebate = parseFloat(values.cashRebate) || 0;
  const standardRate = parseFloat(values.standardRate) || 0;
  const promoRate = parseFloat(values.promoRate) || 0;

  const loanAmount = vehiclePrice - downPayment;
  const principalA = Math.max(0, loanAmount - cashRebate);
  const principalB = Math.max(0, loanAmount);

  const calcPayment = (principal: number, annualRatePct: number, months: number): number => {
    if (principal <= 0) return 0;
    const r = annualRatePct / 12 / 100;
    if (r === 0) return principal / months;
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  const monthlyA = calcPayment(principalA, standardRate, n);
  const monthlyB = calcPayment(principalB, promoRate, n);

  const totalInterestA = Math.max(0, monthlyA * n - principalA);
  const totalInterestB = Math.max(0, monthlyB * n - principalB);

  const totalPaidA = monthlyA * n + downPayment;
  const totalPaidB = monthlyB * n + downPayment;

  const aWins = totalPaidA <= totalPaidB;

  // ---- Extract winner info from results ----
  const winnerResult = results[0];
  const winnerLabel = winnerResult?.label ?? '';
  const winnerValue = winnerResult?.value ?? '';

  // ---- SVG stacked bar chart dimensions ----
  const svgWidth = 340;
  const svgHeight = 200;
  const barWidth = 80;
  const barGap = 60;
  const chartBottom = svgHeight - 36;
  const chartTop = 20;
  const chartHeight = chartBottom - chartTop;

  const maxTotal = Math.max(totalPaidA, totalPaidB, 1);

  // Heights for each segment (principal + interest stacked)
  const principalHeightA = (principalA / maxTotal) * chartHeight;
  const interestHeightA = (totalInterestA / maxTotal) * chartHeight;
  const principalHeightB = (principalB / maxTotal) * chartHeight;
  const interestHeightB = (totalInterestB / maxTotal) * chartHeight;

  const totalBarHeightA = principalHeightA + interestHeightA;
  const totalBarHeightB = principalHeightB + interestHeightB;

  const barAx = 50;
  const barBx = barAx + barWidth + barGap;

  // Y positions (bars grow upward from chartBottom)
  const barAInterestY = chartBottom - totalBarHeightA;
  const barAPrincipalY = chartBottom - principalHeightA;

  const barBInterestY = chartBottom - totalBarHeightB;
  const barBPrincipalY = chartBottom - principalHeightB;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingDown size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Cash Back vs. Low Rate — Full Comparison
        </span>
      </div>

      <div className="p-6 space-y-6">

        {/* Winner badge */}
        <div
          className={`rounded-xl border-2 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
            aWins
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-blue-400 bg-blue-50'
          }`}
        >
          <div>
            <span
              className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-1 ${
                aWins
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              Winner
            </span>
            <p
              className={`text-lg font-black ${
                aWins ? 'text-emerald-800' : 'text-blue-800'
              }`}
            >
              {winnerLabel}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-2xl font-black ${
                aWins ? 'text-emerald-700' : 'text-blue-700'
              }`}
            >
              {winnerValue}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">vs. the other option</p>
          </div>
        </div>

        {/* Side-by-side comparison table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Metric
                </th>
                <th scope="col"
                  className={`text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${
                    aWins ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  Option A (Cash Back)
                  {aWins && (
                    <span className="ml-1 inline-block bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black">
                      WINNER
                    </span>
                  )}
                </th>
                <th scope="col"
                  className={`text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${
                    !aWins ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  Option B (Low Rate)
                  {!aWins && (
                    <span className="ml-1 inline-block bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black">
                      WINNER
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-700">Monthly Payment</td>
                <td
                  className={`px-4 py-3 text-right font-bold ${
                    aWins ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'
                  }`}
                >
                  ${fmt(monthlyA)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-bold ${
                    !aWins ? 'text-blue-700 bg-blue-50' : 'text-slate-600'
                  }`}
                >
                  ${fmt(monthlyB)}
                </td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-700">Total Interest</td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    aWins ? 'text-emerald-700 bg-emerald-50' : 'text-orange-600'
                  }`}
                >
                  ${fmt(totalInterestA)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    !aWins ? 'text-blue-700 bg-blue-50' : 'text-orange-600'
                  }`}
                >
                  ${fmt(totalInterestB)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-700">Total Out-of-Pocket</td>
                <td
                  className={`px-4 py-3 text-right font-black text-base ${
                    aWins ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700'
                  }`}
                >
                  ${fmt(totalPaidA)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-black text-base ${
                    !aWins ? 'text-blue-700 bg-blue-50' : 'text-slate-700'
                  }`}
                >
                  ${fmt(totalPaidB)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SVG stacked bar chart */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Total Cost Breakdown — Principal vs. Interest
          </p>
          <div className="flex justify-center">
            <svg
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              aria-label="Stacked bar chart comparing Option A and Option B total costs"
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = chartBottom - frac * chartHeight;
                return (
                  <line
                    key={frac}
                    x1={barAx - 8}
                    y1={y}
                    x2={barBx + barWidth + 8}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={frac === 0 ? undefined : '4 3'}
                  />
                );
              })}

              {/* Option A — Interest segment (top, orange) */}
              {totalBarHeightA > 0 && (
                <rect
                  x={barAx}
                  y={barAInterestY}
                  width={barWidth}
                  height={interestHeightA}
                  fill="#f97316"
                  rx="0"
                />
              )}
              {/* Option A — Principal segment (bottom, blue) */}
              {principalHeightA > 0 && (
                <rect
                  x={barAx}
                  y={barAPrincipalY}
                  width={barWidth}
                  height={principalHeightA}
                  fill="#3b82f6"
                  rx="0"
                />
              )}
              {/* Round top corners of Option A bar */}
              {totalBarHeightA > 0 && (
                <rect
                  x={barAx}
                  y={barAInterestY}
                  width={barWidth}
                  height={6}
                  fill="#f97316"
                  rx="3"
                />
              )}

              {/* Option B — Interest segment (top, orange) */}
              {totalBarHeightB > 0 && (
                <rect
                  x={barBx}
                  y={barBInterestY}
                  width={barWidth}
                  height={interestHeightB}
                  fill="#f97316"
                  rx="0"
                />
              )}
              {/* Option B — Principal segment (bottom, blue) */}
              {principalHeightB > 0 && (
                <rect
                  x={barBx}
                  y={barBPrincipalY}
                  width={barWidth}
                  height={principalHeightB}
                  fill="#3b82f6"
                  rx="0"
                />
              )}
              {/* Round top corners of Option B bar */}
              {totalBarHeightB > 0 && (
                <rect
                  x={barBx}
                  y={barBInterestY}
                  width={barWidth}
                  height={6}
                  fill="#f97316"
                  rx="3"
                />
              )}

              {/* Winner highlight ring */}
              {aWins ? (
                <rect
                  x={barAx - 3}
                  y={barAInterestY - 3}
                  width={barWidth + 6}
                  height={totalBarHeightA + 6}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  rx="4"
                />
              ) : (
                <rect
                  x={barBx - 3}
                  y={barBInterestY - 3}
                  width={barWidth + 6}
                  height={totalBarHeightB + 6}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  rx="4"
                />
              )}

              {/* Dollar labels — interest segment */}
              {interestHeightA > 16 && (
                <text
                  x={barAx + barWidth / 2}
                  y={barAInterestY + interestHeightA / 2 + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  className="fill-white"
                >
                  ${Math.round(totalInterestA).toLocaleString()}
                </text>
              )}
              {interestHeightB > 16 && (
                <text
                  x={barBx + barWidth / 2}
                  y={barBInterestY + interestHeightB / 2 + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  className="fill-white"
                >
                  ${Math.round(totalInterestB).toLocaleString()}
                </text>
              )}

              {/* Dollar labels — principal segment */}
              {principalHeightA > 16 && (
                <text
                  x={barAx + barWidth / 2}
                  y={barAPrincipalY + principalHeightA / 2 + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  className="fill-white"
                >
                  ${Math.round(principalA).toLocaleString()}
                </text>
              )}
              {principalHeightB > 16 && (
                <text
                  x={barBx + barWidth / 2}
                  y={barBPrincipalY + principalHeightB / 2 + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  className="fill-white"
                >
                  ${Math.round(principalB).toLocaleString()}
                </text>
              )}

              {/* Total label above each bar */}
              {totalBarHeightA > 0 && (
                <text
                  x={barAx + barWidth / 2}
                  y={barAInterestY - 7}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill={aWins ? '#065f46' : '#475569'}
                >
                  ${Math.round(totalPaidA).toLocaleString()}
                </text>
              )}
              {totalBarHeightB > 0 && (
                <text
                  x={barBx + barWidth / 2}
                  y={barBInterestY - 7}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill={!aWins ? '#1e40af' : '#475569'}
                >
                  ${Math.round(totalPaidB).toLocaleString()}
                </text>
              )}

              {/* X-axis labels */}
              <text
                x={barAx + barWidth / 2}
                y={chartBottom + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={aWins ? '#065f46' : '#64748b'}
              >
                Option A
              </text>
              <text
                x={barAx + barWidth / 2}
                y={chartBottom + 28}
                textAnchor="middle"
                fontSize="9"
                fill={aWins ? '#065f46' : '#94a3b8'}
              >
                Cash Back
              </text>
              <text
                x={barBx + barWidth / 2}
                y={chartBottom + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={!aWins ? '#1e40af' : '#64748b'}
              >
                Option B
              </text>
              <text
                x={barBx + barWidth / 2}
                y={chartBottom + 28}
                textAnchor="middle"
                fontSize="9"
                fill={!aWins ? '#1e40af' : '#94a3b8'}
              >
                Low Rate
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-xs text-slate-600">Principal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" />
              <span className="text-xs text-slate-600">Interest</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm border-2 border-emerald-500 bg-transparent" />
              <span className="text-xs text-slate-600">Winner</span>
            </div>
          </div>
        </div>

        {/* Key insight callout */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
          <p className="text-xs font-bold text-slate-700 mb-1">Why 0% is not always the winner</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            The cash rebate lowers your loan principal immediately — before any interest accrues. A
            large rebate at a moderate rate can cost less than a small rebate at 0%, especially on
            shorter loan terms. The longer the term, the more the low rate has to work with —
            which is when promotional financing tends to win.
          </p>
        </div>
      </div>
    </div>
  );
}
