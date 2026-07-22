import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PythagoreanPanel({ values, results }: Props) {
  const mode = values.mode || 'hypotenuse';
  const parsedA = parseFloat(values.a);
  const a = isNaN(parsedA) ? 0 : parsedA;
  const parsedB = parseFloat(values.b);
  const b = isNaN(parsedB) ? 0 : parsedB;
  const parsedC = parseFloat(values.c);
  const c = isNaN(parsedC) ? 0 : parsedC;

  const hypRow = results.find(r => r.id === 'hyp');
  const legARow = results.find(r => r.id === 'leg_a');
  const legBRow = results.find(r => r.id === 'leg_b');

  // Determine the sides for the triangle
  let sideA: number, sideB: number, sideC: number;
  let labelA: string, labelB: string, labelC: string;
  let stepText: string;

  if (mode === 'hypotenuse') {
    sideA = a;
    sideB = b;
    sideC = hypRow ? parseFloat(hypRow.value) : Math.sqrt(a * a + b * b);
    labelA = `a = ${a}`;
    labelB = `b = ${b}`;
    labelC = `c = ${sideC.toFixed(4)}`;
    stepText = `c² = a² + b² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}\nc = √(${a * a + b * b}) = ${sideC.toFixed(4)}`;
  } else if (mode === 'leg_a') {
    sideA = a;
    sideB = c > b ? Math.sqrt(c * c - b * b) : 0;
    sideC = c;
    labelA = `a = ${a}`;
    labelB = `b = ${b}`;
    labelC = `c = ${c}`;
    const legAVal = legARow ? parseFloat(legARow.value) : sideB;
    sideB = legAVal;
    stepText = `a² = c² - b² = ${c}² - ${b}² = ${c * c} - ${b * b} = ${c * c - b * b}\na = √(${c * c - b * b}) = ${legAVal.toFixed(4)}`;
    labelB = `a = ${legAVal.toFixed(4)}`;
  } else {
    sideA = c > a ? Math.sqrt(c * c - a * a) : 0;
    sideB = b;
    sideC = c;
    const legBVal = legBRow ? parseFloat(legBRow.value) : sideA;
    sideA = legBVal;
    labelA = `b = ${legBVal.toFixed(4)}`;
    labelB = `b = ${b}`;
    labelC = `c = ${c}`;
    stepText = `b² = c² - a² = ${c}² - ${a}² = ${c * c} - ${a * a} = ${c * c - a * a}\nb = √(${c * c - a * a}) = ${legBVal.toFixed(4)}`;
  }

  // SVG right triangle
  const svgW = 360;
  const svgH = 340;
  const scale = Math.min(240 / Math.max(sideA || 1, sideB || 1, 1), 240);
  const xA = 20;
  const yA = svgH - 20;
  const xB = xA + (sideB || 1) * scale;
  const yB = yA;
  const xC = xA;
  const yC = yA - (sideA || 1) * scale;

  // Format side lengths for display
  const fmt = (n: number) => parseFloat(n.toFixed(4)).toString();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Right Triangle &amp; Step-by-Step Proof</span>
      </div>

      <div className="p-5 space-y-4">
        {/* SVG Triangle */}
        <div className="flex justify-center">
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label="Right triangle diagram showing side lengths a, b, and c with right angle indicator">
            {/* Right angle indicator */}
            <polyline
              points={`${xA + 20},${yA} ${xA + 20},${yA - 20} ${xA},${yA - 20}`}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Triangle */}
            <polygon
              points={`${xA},${yA} ${xB},${yB} ${xC},${yC}`}
              fill="rgba(59,130,246,0.08)"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Side labels */}
            {/* Side c (hypotenuse) */}
            <text
              x={(xA + xB) / 2 + 14}
              y={(yA + yC) / 2 - 14}
              textAnchor="middle"
              fill="#ef4444"
              fontSize="19"
              fontWeight="bold"
              className="text-[19px]"
              transform={`rotate(45, ${(xA + xB) / 2 + 14}, ${(yA + yC) / 2 - 14})`}
            >
              c
            </text>
            {/* Side b (horizontal) */}
            <text
              x={(xA + xB) / 2}
              y={yA + 30}
              textAnchor="middle"
              fill="#10b981"
              fontSize="19"
              fontWeight="bold"
              className="text-[19px]"
            >
              {mode === 'hypotenuse' ? 'b' : mode === 'leg_a' ? 'b' : 'b'}
            </text>
            {/* Side a (vertical) */}
            <text
              x={xA - 24}
              y={(yA + yC) / 2}
              textAnchor="middle"
              fill="#8b5cf6"
              fontSize="19"
              fontWeight="bold"
              className="text-[19px]"
            >
              a
            </text>
            {/* Vertices */}
            <circle cx={xA} cy={yA} r="5" fill="#3b82f6" />
            <circle cx={xB} cy={yB} r="5" fill="#3b82f6" />
            <circle cx={xC} cy={yC} r="5" fill="#3b82f6" />
          </svg>
        </div>

        {/* Step-by-step */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">
            Step-by-Step Proof
          </p>
          <div className="font-mono text-sm text-blue-700 whitespace-pre-wrap">
            {stepText}
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200">
            <p className="text-xs text-blue-600">
              <strong>Isolate the variable:</strong>{' '}
              {mode === 'hypotenuse'
                ? 'c = √(a² + b²)'
                : `a = √(c² − b²)`}
            </p>
          </div>
        </div>

        {/* SOH CAH TOA Trigonometry Steps (hypotenuse mode only) */}
        {mode === 'hypotenuse' && results.find(r => r.id === 'sohStep') && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-2">
              SOH CAH TOA — Finding Angles
            </p>
            <div className="space-y-2 font-mono text-sm">
              <div className="bg-white rounded-lg border border-purple-200 p-2">
                <p className="text-purple-700">
                  <span className="font-bold text-purple-500">SOH</span> sin(α) = <span className="text-purple-600">O</span>pposite / <span className="text-purple-600">H</span>ypotenuse = a / c = {a} / {results.find(r => r.id === 'hyp')?.value || ''} = {(a / parseFloat(results.find(r => r.id === 'hyp')?.value || '1')).toFixed(4)}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-purple-200 p-2">
                <p className="text-purple-700">
                  <span className="font-bold text-purple-500">CAH</span> cos(α) = <span className="text-purple-600">A</span>djacent / <span className="text-purple-600">H</span>ypotenuse = b / c = {b} / {results.find(r => r.id === 'hyp')?.value || ''} = {(b / parseFloat(results.find(r => r.id === 'hyp')?.value || '1')).toFixed(4)}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-purple-200 p-2">
                <p className="text-purple-700">
                  <span className="font-bold text-purple-500">TOA</span> tan(α) = <span className="text-purple-600">O</span>pposite / <span className="text-purple-600">A</span>djacent = a / b = {a} / {b} = {(a / b).toFixed(4)}
                </p>
              </div>
            </div>
            <p className="text-xs text-purple-500 mt-2">
              α = sin⁻¹({(a / parseFloat(results.find(r => r.id === 'hyp')?.value || '1')).toFixed(4)}) = {results.find(r => r.id === 'angleA')?.value} &nbsp;|&nbsp; β = 90° − α = {results.find(r => r.id === 'angleB')?.value}
            </p>
          </div>
        )}

        {/* Side lengths */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Leg a</p>
            <p className="text-sm font-bold font-mono text-slate-700">{fmt(sideA)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Leg b</p>
            <p className="text-sm font-bold font-mono text-slate-700">{fmt(sideB)}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-red-400 uppercase">Hypotenuse c</p>
            <p className="text-sm font-bold font-mono text-red-700">{fmt(sideC)}</p>
          </div>
        </div>

        {/* Formula reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Pythagorean Theorem</p>
          <p className="text-lg font-mono font-bold text-slate-700 text-center">a² + b² = c²</p>
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
            <div className="p-1 bg-white rounded border border-slate-200">
              <p className="text-slate-500">Hypotenuse</p>
              <p className="font-mono text-slate-600">c = √(a² + b²)</p>
            </div>
            <div className="p-1 bg-white rounded border border-slate-200">
              <p className="text-slate-500">Leg a</p>
              <p className="font-mono text-slate-600">a = √(c² − b²)</p>
            </div>
            <div className="p-1 bg-white rounded border border-slate-200">
              <p className="text-slate-500">Leg b</p>
              <p className="font-mono text-slate-600">b = √(c² − a²)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
