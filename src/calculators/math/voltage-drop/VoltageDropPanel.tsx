import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const WIRE_AWGS = ['14', '12', '10', '8', '6', '4', '2', '1', '1/0', '2/0', '3/0', '4/0'];
const WIRE_HEIGHTS = [36, 42, 48, 54, 58, 62, 66, 68, 72, 76, 78, 82];

export default function VoltageDropPanel({ results }: Props) {
  const recommendedWire = results.find((r) => r.id === 'recommendedWire');
  const vdResult = results.find((r) => r.id === 'voltageDrop');
  const vdPctResult = results.find((r) => r.id === 'voltageDropPercent');
  const statusResult = results.find((r) => r.id === 'status');

  if (!recommendedWire) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Voltage Drop Analysis
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Recommended Wire + Status */}
        <div
          className={`rounded-xl border p-6 text-center ${
            recommendedWire.color === 'positive'
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
              : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
          }`}
        >
          <p className="text-sm text-slate-500 mb-1">{recommendedWire.label}</p>
          <p className="text-3xl font-bold text-slate-800">
            {recommendedWire.value}
          </p>
          {statusResult && (
            <p
              className={`text-xs mt-2 font-medium ${
                statusResult.color === 'positive'
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}
            >
              {statusResult.value}
            </p>
          )}
        </div>

        {/* Voltage Drop Details */}
        <div className="grid grid-cols-2 gap-4">
          {vdResult && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Voltage Drop
              </p>
              <p className="text-xl font-bold text-slate-700 mt-1">
                {vdResult.value}
              </p>
            </div>
          )}
          {vdPctResult && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Voltage Drop %
              </p>
              <p className="text-xl font-bold text-slate-700 mt-1">
                {vdPctResult.value}
              </p>
            </div>
          )}
        </div>

        {/* Wire Gauge Visual Comparison Bar */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            Wire Gauge Comparison
          </p>
          <div className="flex items-end gap-0.5 h-20">
            {WIRE_AWGS.map((g, i) => {
              const fullLabel = g.includes('/') ? g + ' AWG' : g + ' AWG';
              const isSelected = fullLabel === recommendedWire.value;
              return (
                <div
                  key={g}
                  className={`flex-1 rounded-t flex items-end justify-center text-[7px] font-bold pb-1 transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-300 text-slate-500'
                  }`}
                  style={{ height: `${WIRE_HEIGHTS[i]}px` }}
                >
                  {g}
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-slate-500 text-center mt-1">
            Wire sizes from smallest (14 AWG) to largest (4/0 AWG) &mdash; highlighted = recommended
          </p>
        </div>

        {/* NEC Reference Note */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
            NEC Reference
          </p>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            Based on NEC Chapter 9, Table 8 (copper conductors, 75&deg;C).
            Ampacity per NEC Table 310.15(B)(16). Branch circuits: &le;3% drop
            recommended. Feeders: &le;5% drop recommended.
          </p>
        </div>

        {/* Alternative Wire Sizes Table */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 bg-white">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Wire Size Comparison
            </p>
          </div>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th scope="col" className="text-left pb-2 font-semibold">Wire Size</th>
                  <th scope="col" className="text-right pb-2 font-semibold">Resistance</th>
                  <th scope="col" className="text-right pb-2 font-semibold">Ampacity</th>
                </tr>
              </thead>
              <tbody>
                {WIRE_AWGS.map((g, i) => {
                  const fullLabel = g.includes('/') ? g + ' AWG' : g + ' AWG';
                  const isSelected = fullLabel === recommendedWire.value;
                  const res = [3.07, 1.93, 1.21, 0.764, 0.491, 0.308, 0.194, 0.154, 0.122, 0.0967, 0.0766, 0.0608][i];
                  const amp = [15, 20, 30, 50, 65, 85, 115, 130, 150, 175, 200, 230][i];
                  return (
                    <tr
                      key={g}
                      className={`border-b border-slate-100 ${
                        isSelected ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      <td className="py-1.5">{fullLabel}</td>
                      <td className="text-right py-1.5 font-mono">{res.toFixed(3)}</td>
                      <td className="text-right py-1.5 font-mono">{amp} A</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
