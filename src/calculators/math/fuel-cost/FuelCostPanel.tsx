import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function FuelCostPanel({ values, results }: Props) {
  const totalCost = results.find((r) => r.id === 'totalCost');
  const costPerTrip = results.find((r) => r.id === 'costPerTrip');
  const fuelNeeded = results.find((r) => r.id === 'fuelNeeded');
  const co2 = results.find((r) => r.id === 'co2Emissions');
  const costPerMile = results.find((r) => r.id === 'costPerMile');
  const vehicleType = values.vehicleType || 'gas';
  const isPhev = vehicleType === 'phev';
  const isEv = vehicleType === 'ev';

  if (!totalCost) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Total Cost Hero */}
      <div className="px-6 py-8 text-center bg-gradient-to-br from-emerald-50 to-green-50 border-b border-emerald-200">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
          Total Fuel Cost
        </p>
        <p className="text-4xl font-bold text-emerald-700">{totalCost.value}</p>
        {costPerTrip && (
          <p className="text-xs text-emerald-500 mt-2">
            {costPerTrip.value} per trip
          </p>
        )}
      </div>

      {/* Results Grid */}
      <div className="p-5 grid grid-cols-2 gap-4">
        {fuelNeeded && (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Fuel Needed
            </p>
            <p className="text-lg font-bold text-slate-700 mt-1">{fuelNeeded.value}</p>
          </div>
        )}

        {costPerMile && (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Cost Per Mile
            </p>
            <p className="text-lg font-bold text-slate-700 mt-1">{costPerMile.value}</p>
          </div>
        )}

        {co2 && (
          <div className="rounded-xl border border-slate-200 p-4 col-span-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              CO&#x2082; Emissions
            </p>
            <p className="text-lg font-bold text-slate-700 mt-1">{co2.value}</p>
            <div className="mt-2 h-3 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-neutral-500 transition-all"
                style={{ width: co2.value.startsWith('0') ? '5%' : '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* PHEV Energy Mix */}
      {isPhev && (
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Energy Mix
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shrink-0" />
                <span className="text-xs text-slate-600">Gasoline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shrink-0" />
                <span className="text-xs text-slate-600">Electric</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EV Note */}
      {isEv && (
        <div className="px-5 pb-5">
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">EV Note</p>
            <p className="text-xs text-sky-800 mt-1">
              Zero tailpipe CO&#x2082; emissions. Well-to-wheel emissions depend on your local grid energy mix.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
