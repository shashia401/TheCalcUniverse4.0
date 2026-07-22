import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface DecayStep {
  step: number;
  time: number;
  amount: number;
}

export default function HalfLifePanel({ values, results }: Props) {
  const solveFor = values.solveFor;

  const N0result = results.find((r) => r.id === 'initialQuantity');
  const Ntresult = results.find((r) => r.id === 'remainingQuantity');
  const t12result = results.find((r) => r.id === 'halfLife');
  const tresult = results.find((r) => r.id === 'timeElapsed');
  const hlResult = results.find((r) => r.id === 'halfLives');
  const pctResult = results.find((r) => r.id === 'percentRemaining');

  if (!N0result || !Ntresult || !t12result || !tresult) return null;

  const N0 = parseFloat(N0result.value);
  const Nt = parseFloat(Ntresult.value);
  const t12 = parseFloat(t12result.value);
  const t = parseFloat(tresult.value);

  if (isNaN(N0) || isNaN(Nt) || isNaN(t12) || isNaN(t)) return null;
  if (!isFinite(t12) || t12 <= 0) return null;

  const fmt = (n: number): string => {
    if (!isFinite(n)) return '—';
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
    return parseFloat(n.toPrecision(8)).toString();
  };

  // Build decay progression with enough steps to cover the elapsed time plus a few more
  const maxHalfLivesToShow = Math.max(Math.ceil(t / t12) + 2, 6);
  const steps: DecayStep[] = [];
  for (let i = 0; i <= maxHalfLivesToShow; i++) {
    const stepTime = i * t12;
    const stepAmount = N0 * Math.pow(0.5, i);
    steps.push({ step: i, time: stepTime, amount: stepAmount });
  }

  // ── Formula application details ──────────────────────────────────────
  const halfLivesElapsed = t / t12;
  const fractionRemaining = Math.pow(0.5, halfLivesElapsed);

  const formulaParts: { lines: string[] } = { lines: [] };

  if (solveFor === 'remainingQuantity') {
    formulaParts.lines = [
      `N(t) = N₀ × (½)^(t / t₁₂⁄₂)`,
      `N(t) = ${fmt(N0)} × (½)^(${fmt(t)} / ${fmt(t12)})`,
      `N(t) = ${fmt(N0)} × (½)^(${fmt(halfLivesElapsed)})`,
      `N(t) = ${fmt(N0)} × ${fmt(fractionRemaining)}`,
      `N(t) = ${fmt(Nt)}`,
    ];
  } else if (solveFor === 'initialQuantity') {
    formulaParts.lines = [
      `N₀ = N(t) ÷ (½)^(t / t₁₂⁄₂)`,
      `N₀ = ${fmt(Nt)} ÷ (½)^(${fmt(t)} / ${fmt(t12)})`,
      `N₀ = ${fmt(Nt)} ÷ (½)^(${fmt(halfLivesElapsed)})`,
      `N₀ = ${fmt(Nt)} ÷ ${fmt(fractionRemaining)}`,
      `N₀ = ${fmt(N0)}`,
    ];
  } else if (solveFor === 'halfLife') {
    const ratio = N0 / Nt;
    const logRatio = Math.log(ratio);
    const ln2 = Math.LN2;
    formulaParts.lines = [
      `t₁₂⁄₂ = t × ln(2) / ln(N₀ / N(t))`,
      `t₁₂⁄₂ = ${fmt(t)} × ln(2) / ln(${fmt(N0)} / ${fmt(Nt)})`,
      `t₁₂⁄₂ = ${fmt(t)} × ${fmt(ln2)} / ln(${fmt(ratio)})`,
      `t₁₂⁄₂ = ${fmt(t)} × ${fmt(ln2)} / ${fmt(logRatio)}`,
      `t₁₂⁄₂ = ${fmt(t12)}`,
    ];
  } else if (solveFor === 'timeElapsed') {
    const ratio = N0 / Nt;
    const logRatio = Math.log(ratio);
    const ln2 = Math.LN2;
    formulaParts.lines = [
      `t = t₁₂⁄₂ × ln(N₀ / N(t)) / ln(2)`,
      `t = ${fmt(t12)} × ln(${fmt(N0)} / ${fmt(Nt)}) / ln(2)`,
      `t = ${fmt(t12)} × ln(${fmt(ratio)}) / ${fmt(ln2)}`,
      `t = ${fmt(t12)} × ${fmt(logRatio)} / ${fmt(ln2)}`,
      `t = ${fmt(t)}`,
    ];
  }

  // ── SVG decay curve ──────────────────────────────────────────────────
  const svgW = 400;
  const svgH = 200;
  const padL = 40;
  const padR = 15;
  const padT = 15;
  const padB = 28;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const curveMaxHalfLives = Math.max(Math.ceil(maxHalfLivesToShow), 5);
  const maxTime = curveMaxHalfLives * t12;
  const numCurvePoints = 120;

  const curvePoints: { x: number; y: number }[] = [];
  for (let i = 0; i <= numCurvePoints; i++) {
    const frac = i / numCurvePoints;
    const curveTime = frac * maxTime;
    const curveAmount = N0 * Math.pow(0.5, curveTime / t12);
    const cx = padL + frac * plotW;
    const cy = padT + plotH - (curveAmount / N0) * plotH;
    curvePoints.push({ x: cx, y: cy });
  }

  const pathD = curvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  // X-axis tick marks (at each half-life)
  const xTicks = Array.from({ length: curveMaxHalfLives + 1 }, (_, i) => ({
    label: i.toString(),
    x: padL + (i / curveMaxHalfLives) * plotW,
  }));

  // Vertical dashed lines at each half-life
  const vLines = xTicks.map((tick) => ({
    x1: tick.x,
    y1: padT,
    x2: tick.x,
    y2: padT + plotH,
  }));

  // Highlight point for the actual (t, Nt) if within chart range
  const showActualPoint = t <= maxTime;
  const actualPointX = padL + (t / maxTime) * plotW;
  const actualPointY = padT + plotH - (Nt / N0) * plotH;

  // Y-axis tick marks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
    label: fmt(N0 * frac),
    y: padT + plotH - frac * plotH,
  }));

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Formula Application Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg
            className="w-4 h-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Step-by-Step Solution
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Formula */}
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-2">
              Radioactive Decay Formula
            </p>
            <p className="text-lg font-bold text-purple-700 font-mono">
              N(t) = N₀ &middot; (½)
              <sup className="text-sm">t / t<sub>1/2</sub></sup>
            </p>
          </div>

          {/* Formula application */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Formula Application
            </p>
            <div className="font-mono text-xs text-slate-700 space-y-1">
              {formulaParts.lines.map((line, i) => (
                <p
                  key={`item-${i}`}
                  className={
                    i === formulaParts.lines.length - 1
                      ? 'text-purple-700 font-bold text-sm mt-1 pt-1 border-t border-slate-200'
                      : ''
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">N₀</p>
              <p className="text-sm font-bold text-slate-700 font-mono">{fmt(N0)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">N(t)</p>
              <p className="text-sm font-bold text-slate-700 font-mono">{fmt(Nt)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">t₁₂⁄₂</p>
              <p className="text-sm font-bold text-slate-700 font-mono">{fmt(t12)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">t</p>
              <p className="text-sm font-bold text-slate-700 font-mono">{fmt(t)}</p>
            </div>
          </div>

          {hlResult && pctResult && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center">
                <p className="text-[10px] font-bold text-blue-500 uppercase">Half-Lives Elapsed</p>
                <p className="text-xl font-bold text-blue-700 font-mono">{fmt(t / t12)}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">
                  Percentage Remaining
                </p>
                <p className="text-xl font-bold text-emerald-700 font-mono">
                  {Number.isFinite(Nt / N0) ? parseFloat(((Nt / N0) * 100).toPrecision(6)) : 'N/A'}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decay Progression Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg
            className="w-4 h-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4h4v16H3V4zm7 4h4v12h-4V8zm7-2h4v14h-4V6z"
            />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Decay Progression
          </span>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className="text-left py-2 pr-4 text-slate-500 font-bold uppercase tracking-wider">
                    Half-Life #
                  </th>
                  <th scope="col" className="text-left py-2 pr-4 text-slate-500 font-bold uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="text-right py-2 text-slate-500 font-bold uppercase tracking-wider">
                    Remaining Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step) => {
                  const isActualTime =
                    step.step > 0 &&
                    step.step < steps.length - 1 &&
                    ((step.time <= t && steps[step.step + 1]?.time > t) ||
                      Math.abs(step.time - t) < t12 * 0.01);

                  return (
                    <tr
                      key={step.step}
                      className={`border-b border-slate-100 last:border-0 ${
                        isActualTime ? 'bg-purple-50' : ''
                      }`}
                    >
                      <td className="py-2 pr-4 text-slate-600">{step.step}</td>
                      <td className="py-2 pr-4 text-slate-600">
                        {fmt(step.time)}
                        {isActualTime && (
                          <span className="ml-2 text-[9px] text-purple-500 font-bold">
                            (t elapsed)
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right text-slate-700 font-bold">
                        {fmt(step.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SVG Decay Curve */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg
            className="w-4 h-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Decay Curve
          </span>
        </div>

        <div className="p-5">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto"
            role="img"
            aria-label="Exponential decay curve showing quantity decreasing over time"
          >
            {/* Y-axis */}
            <line
              x1={padL}
              y1={padT}
              x2={padL}
              y2={padT + plotH}
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* X-axis */}
            <line
              x1={padL}
              y1={padT + plotH}
              x2={padL + plotW}
              y2={padT + plotH}
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* Vertical dashed lines at each half-life */}
            {vLines.map((vl, i) => (
              <line
                key={`vl-${i}`}
                x1={vl.x1}
                y1={vl.y1}
                x2={vl.x2}
                y2={vl.y2}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            ))}

            {/* Y-axis tick marks */}
            {yTicks.map((yt, i) => (
              <g key={`yt-${i}`}>
                <line
                  x1={padL - 4}
                  y1={yt.y}
                  x2={padL}
                  y2={yt.y}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={padL - 6}
                  y={yt.y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  className="text-[9px]"
                >
                  {yt.label}
                </text>
              </g>
            ))}

            {/* X-axis tick marks */}
            {xTicks.map((xt, i) => (
              <g key={`xt-${i}`}>
                <line
                  x1={xt.x}
                  y1={padT + plotH}
                  x2={xt.x}
                  y2={padT + plotH + 4}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={xt.x}
                  y={padT + plotH + 16}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                  className="text-[9px]"
                >
                  {xt.label}
                </text>
              </g>
            ))}

            {/* The decay curve */}
            <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Highlight point at t elapsed */}
            {showActualPoint && (
              <g>
                <circle
                  cx={actualPointX}
                  cy={actualPointY}
                  r="4"
                  fill="#7c3aed"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={actualPointX + 8}
                  y={actualPointY - 4}
                  fill="#5b21b6"
                  fontSize="10"
                  fontWeight="bold"
                  className="text-[10px]"
                >
                  ({fmt(t)}, {fmt(Nt)})
                </text>
              </g>
            )}

            {/* X-axis label */}
            <text
              x={padL + plotW / 2}
              y={svgH - 2}
              textAnchor="middle"
              fill="#475569"
              fontSize="10"
              className="text-[10px]"
            >
              Half-Lives
            </text>

            {/* Y-axis label */}
            <text
              x={6}
              y={padT + plotH / 2}
              textAnchor="middle"
              fill="#475569"
              fontSize="10"
              className="text-[10px]"
              transform={`rotate(-90, 6, ${padT + plotH / 2})`}
            >
              Amount
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
