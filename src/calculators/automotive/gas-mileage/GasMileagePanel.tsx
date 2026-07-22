import type { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function r(id: string, results: CalculatorResult[]): CalculatorResult | undefined {
  return results.find((x) => x.id === id);
}

function parseNumberFromValue(s: string): number {
  const m = /([\d.]+)/.exec(s);
  return m ? parseFloat(m[1]) : 0;
}

function getMpgRating(mpg: number): { label: string; color: string; barColor: string; textColor: string; bgLight: string } {
  if (mpg >= 45) return { label: 'Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', barColor: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-100' };
  if (mpg >= 35) return { label: 'Very Good', color: 'bg-green-100 text-green-800 border-green-300', barColor: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-100' };
  if (mpg >= 25) return { label: 'Good', color: 'bg-lime-100 text-lime-800 border-lime-300', barColor: 'bg-lime-500', textColor: 'text-lime-600', bgLight: 'bg-lime-100' };
  if (mpg >= 15) return { label: 'Fair', color: 'bg-amber-100 text-amber-800 border-amber-300', barColor: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-100' };
  return { label: 'Poor', color: 'bg-red-100 text-red-800 border-red-300', barColor: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-100' };
}

function getL100kmRating(l100km: number): { label: string; color: string; barColor: string; textColor: string; bgLight: string } {
  if (l100km <= 5) return { label: 'Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', barColor: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-100' };
  if (l100km <= 7) return { label: 'Very Good', color: 'bg-green-100 text-green-800 border-green-300', barColor: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-100' };
  if (l100km <= 10) return { label: 'Good', color: 'bg-lime-100 text-lime-800 border-lime-300', barColor: 'bg-lime-500', textColor: 'text-lime-600', bgLight: 'bg-lime-100' };
  if (l100km <= 15) return { label: 'Fair', color: 'bg-amber-100 text-amber-800 border-amber-300', barColor: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-100' };
  return { label: 'Poor', color: 'bg-red-100 text-red-800 border-red-300', barColor: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-100' };
}

export default function GasMileagePanel({ values, results }: Props) {
  const mpgResult = r('mpg', results);
  const l100kmResult = r('l100km', results);
  const mpgImperial = r('mpgImperial', results);
  const distance = r('distance', results);
  const fuelUsed = r('fuelUsed', results);
  const costPerMile = r('costPerMile', results);
  const costPer100 = r('costPer100', results);
  const annualCost = r('annualCost', results);

  if (!mpgResult) return null;

  const fuelUnit = values.fuelUnit || 'gal';
  const isMetric = fuelUnit === 'L';
  const mpgValue = parseNumberFromValue(mpgResult.value);
  const l100kmVal = parseNumberFromValue(l100kmResult?.value || '0');
  const rating = isMetric ? getL100kmRating(l100kmVal) : getMpgRating(mpgValue);
  const hasCost = !!costPerMile;

  const ratingMax = 60;
  const ratingPct = Math.min((mpgValue / ratingMax) * 100, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* ───── Hero MPG Card ───── */}
      <div className={`px-6 py-7 text-center border-b ${rating.bgLight} border-slate-200`}>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          Fuel Economy
        </p>
        <p className="text-4xl font-bold text-slate-800 tracking-tight">{mpgResult.value}</p>

        {/* Rating Badge */}
        <span className={`inline-block mt-2 px-3 py-0.5 rounded-full border text-xs font-bold ${rating.color}`}>
          {rating.label}
        </span>

        {/* Rating Bar */}
        <div className="mt-3 h-2.5 rounded-full bg-slate-200 overflow-hidden max-w-xs mx-auto">
          <div
            className={`h-full rounded-full ${rating.barColor} transition-all`}
            style={{ width: `${ratingPct}%` }}
          />
        </div>
        <div className="flex justify-between max-w-xs mx-auto mt-1 text-[9px] text-slate-500">
          <span>Poor</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </div>

      {/* ───── Conversion Display ───── */}
      <div className="px-6 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Conversion
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">MPG (US)</span>
            <span className="text-sm font-bold text-slate-700">
              {mpgResult.value}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-1">
            <span className="text-xs text-slate-600">L/100km</span>
            <span className="text-sm font-bold text-slate-700">
              {l100kmResult?.value || ''}
            </span>
          </div>
          {mpgImperial && (
            <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-1">
              <span className="text-xs text-slate-600">MPG (Imperial)</span>
              <span className="text-sm font-bold text-slate-700">{mpgImperial.value}</span>
            </div>
          )}
        </div>
      </div>

      {/* ───── Trip Summary ───── */}
      <div className="px-6 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Trip Summary
        </p>
        <div className="grid grid-cols-2 gap-3">
          {distance && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Distance
              </p>
              <p className="text-base font-bold text-slate-700 mt-0.5">{distance.value}</p>
            </div>
          )}
          {fuelUsed && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Fuel Used
              </p>
              <p className="text-base font-bold text-slate-700 mt-0.5">{fuelUsed.value}</p>
            </div>
          )}
        </div>
      </div>

      {/* ───── Cost Analysis ───── */}
      {hasCost && (
        <div className="px-6 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Cost Analysis
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            {costPerMile && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-amber-800">Cost Per Mile</span>
                <span className="text-base font-bold text-amber-900">{costPerMile.value}</span>
              </div>
            )}
            {costPer100 && (
              <div className="flex justify-between items-center border-t border-amber-200 pt-2">
                <span className="text-xs text-amber-800">Per 100 Miles</span>
                <span className="text-base font-bold text-amber-900">{costPer100.value}</span>
              </div>
            )}
            {annualCost && (
              <div className="flex justify-between items-center border-t border-amber-200 pt-2">
                <span className="text-xs text-amber-800">Annual (12k mi)</span>
                <span className="text-base font-bold text-amber-900">{annualCost.value.replace('At 12,000 mi/year: ', '')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── Footer ───── */}
      <div className="px-6 pb-5 pt-4 mt-1">
        <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500">
          {distance?.value || ''} &middot; {fuelUsed?.value || ''} &middot; Rating: {rating.label}
        </div>
      </div>
    </div>
  );
}
