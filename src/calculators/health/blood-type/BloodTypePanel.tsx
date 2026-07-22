import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function BloodTypePanel({ values, results }: Props) {
  const aboA = results.find(r => r.id === 'aboA');
  const aboB = results.find(r => r.id === 'aboB');
  const aboAB = results.find(r => r.id === 'aboAB');
  const aboO = results.find(r => r.id === 'aboO');
  const rhPos = results.find(r => r.id === 'rhPositive');
  const rhNeg = results.find(r => r.id === 'rhNegative');
  const combined = results.find(r => r.id === 'combinedHeader');

  if (!combined) return null;

  const parsePct = (s?: string) => {
    if (!s) return 0;
    const m = s.match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  };

  const aPct = parsePct(aboA?.value);
  const bPct = parsePct(aboB?.value);
  const abPct = parsePct(aboAB?.value);
  const oPct = parsePct(aboO?.value);
  const rhPosPct = parsePct(rhPos?.value);
  const rhNegPct = parsePct(rhNeg?.value);

  // ABO colors
  const aboColors: Record<string, string> = {
    A: '#ef4444',
    B: '#3b82f6',
    AB: '#8b5cf6',
    O: '#22c55e',
  };

  // Parse combined probabilities for the table
  const combinedPairs: { label: string; pct: number; abo: string; rh: string }[] = [];
  if (combined?.value) {
    // Format: "Type A+: 18.8% · Type A-: 6.2% · Type B+: 18.8% · Type B-: 6.2%"
    const parts = combined.value.split(' · ');
    parts.forEach(part => {
      const m = part.match(/Type\s+([A-Z]+)([+-]):\s+([\d.]+)%/);
      if (m) {
        combinedPairs.push({
          label: m[1] + m[2],
          pct: parseFloat(m[3]),
          abo: m[1],
          rh: m[2],
        });
      }
    });
  }
  combinedPairs.sort((a, b) => b.pct - a.pct);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Blood Type Inheritance — Visual Summary</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Parent genotypes display */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Parent Blood Types</p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-white border border-slate-200 p-3">
              <p className="text-[11px] font-bold text-slate-500">Parent 1</p>
              <p className="text-lg font-bold text-slate-800">
                Type {values.parent1Blood}{values.parent1Rh === '+' ? '+' : '-'}
              </p>
            </div>
            <div className="rounded-lg bg-white border border-slate-200 p-3">
              <p className="text-[11px] font-bold text-slate-500">Parent 2</p>
              <p className="text-lg font-bold text-slate-800">
                Type {values.parent2Blood}{values.parent2Rh === '+' ? '+' : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* ABO Probability SVG */}
        {(aPct > 0 || bPct > 0 || abPct > 0 || oPct > 0) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">ABO Blood Type Probabilities</p>
            <svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxWidth: '100%', height: 'auto' }}>
              {/* ABO bars */}
              {[
                { key: 'A', pct: aPct, color: aboColors.A, x: 10 },
                { key: 'B', pct: bPct, color: aboColors.B, x: 105 },
                { key: 'AB', pct: abPct, color: aboColors.AB, x: 200 },
                { key: 'O', pct: oPct, color: aboColors.O, x: 295 },
              ].filter(item => item.pct > 0).map((item, i, arr) => {
                const barWidth = Math.max(item.pct * 2.5, 10);
                return (
                  <g key={item.key}>
                    <rect x={item.x} y={25} width={barWidth} height={40} rx={4} fill={item.color} opacity={0.75} />
                    <text x={item.x + barWidth / 2} y={50} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                      {item.pct.toFixed(0)}%
                    </text>
                    <text x={item.x + barWidth / 2} y={80} textAnchor="middle" fill="#333" fontSize={13} fontWeight="bold">
                      {item.key}
                    </text>
                  </g>
                );
              })}
              {/* Scale bar */}
              <line x1={10} y1={95} x2={390} y2={95} stroke="#e2e8f0" strokeWidth={2} />
              <text x={10} y={110} fill="#94a3b8" fontSize={9}>0%</text>
              <text x={390} y={110} textAnchor="end" fill="#94a3b8" fontSize={9}>100%</text>
            </svg>
          </div>
        )}

        {/* Rh Probability SVG */}
        {(rhPosPct > 0 || rhNegPct > 0) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Rh Factor Probabilities</p>
            <svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxWidth: '100%', height: 'auto' }}>
              {/* Rh+ bar */}
              <rect x={10} y={10} width={Math.max(rhPosPct * 2.6, 10)} height={28} rx={4} fill="#ef4444" opacity={0.75} />
              <text x={10 + Math.max(rhPosPct * 2.6, 10) / 2} y={29} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                Rh+ {rhPosPct.toFixed(0)}%
              </text>
              {/* Rh- bar */}
              <rect x={10} y={46} width={Math.max(rhNegPct * 2.6, 10)} height={28} rx={4} fill="#94a3b8" opacity={0.75} />
              <text x={10 + Math.max(rhNegPct * 2.6, 10) / 2} y={65} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                Rh- {rhNegPct.toFixed(0)}%
              </text>
            </svg>
          </div>
        )}

        {/* Combined probabilities table */}
        {combinedPairs.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Combined ABO + Rh Probabilities</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Blood Type</th>
                    <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Probability</th>
                    <th scope="col" className="text-center px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedPairs.map((pair, i) => {
                    const maxPct = combinedPairs[0].pct;
                    const barWidth = maxPct > 0 ? (pair.pct / maxPct) * 100 : 0;
                    return (
                      <tr key={pair.label} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="px-4 py-2.5 font-bold text-slate-700">{pair.label}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900 tabular-nums">{pair.pct.toFixed(1)}%</td>
                        <td className="px-4 py-2.5">
                          <div className="h-4 bg-slate-100 rounded overflow-hidden">
                            <div className="h-full rounded" style={{ width: `${barWidth}%`, backgroundColor: aboColors[pair.abo] || '#3b82f6', opacity: 0.75 }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Punnett Square Explanation */}
        <details className="group rounded-xl border border-slate-200 overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">
            <span>How Punnett Squares Work</span>
            <svg aria-hidden="true" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-100 px-4 py-3 space-y-2">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              A Punnett square maps every possible allele combination from both parents. Each parent contributes
              one ABO allele (A, B, or O) and one Rh allele (R or r). The probabilities shown reflect how many
              of the total possible genotype combinations result in each blood type.
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Note:</strong> These are probabilities based on all possible genotypes. The actual outcome
              depends on the specific underlying genotypes (e.g., AA vs AO for type A), which a simple blood
              type test cannot distinguish.
            </p>
          </div>
        </details>

        {/* Information note */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Inheritance Pattern Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-blue-800">
            <div>
              <p className="font-bold mb-1">ABO System</p>
              <ul className="space-y-1 text-[11px]">
                <li>• A and B are codominant (both expressed in AB)</li>
                <li>• Both A and B dominate over O</li>
                <li>• Type O requires two O alleles (OO)</li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-1">Rh System</p>
              <ul className="space-y-1 text-[11px]">
                <li>• Rh+ (R) is dominant over Rh- (r)</li>
                <li>• Rh- requires two recessive alleles (rr)</li>
                <li>• Rh+ can be RR or Rr genotype</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
