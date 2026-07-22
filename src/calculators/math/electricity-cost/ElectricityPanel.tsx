import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Appliance Energy Tips ───────────────────────────────────────────────────

const ENERGY_TIPS: Record<string, string> = {
  'space-heater': 'Space heaters are energy hogs. Lower your thermostat by 1°F and wear a sweater instead -- saves ~3% on heating costs per degree.',
  'window-ac': 'Clean or replace AC filters monthly. A dirty filter can increase energy consumption by 5-15%. Also, seal gaps around the window unit.',
  'central-ac': 'Set your thermostat to 78°F in summer. Each degree below 78°F adds ~6-8% to cooling costs. Annual HVAC maintenance improves efficiency.',
  'led-bulb': 'LEDs use 75-80% less energy than incandescent bulbs and last 15-25 times longer. Switching all bulbs saves ~$225/year for the average home.',
  'incandescent-bulb': 'Replace with LEDs! A single 60W incandescent running 4 hrs/day costs ~$10/year, while an equivalent LED runs ~$1.50/year.',
  'refrigerator': 'Keep your fridge at 37-40°F and freezer at 0°F. Clean the condenser coils yearly. Full fridges run more efficiently than empty ones.',
  'old-refrigerator': 'Your old fridge may cost $100-200/year more than a new ENERGY STAR model. Recycling it could pay for itself in 2-3 years.',
  'gaming-pc': 'Enable power-saving modes when not gaming. A GPU at idle uses ~50W vs 300+W under load. Consider a laptop for casual gaming -- 65W vs 500W.',
  'laptop': 'Laptops are already 7-8x more efficient than desktops. Unplug at 80% charge to extend battery life, but don\'t worry about "phantom drain" -- it\'s minimal.',
  'tv': 'Turn off the TV when not watching. A 55" LED uses ~120W -- that\'s ~$50/year for 4 hrs/day. OLEDs use less power for dark scenes, more for bright ones.',
  'clothes-dryer': 'Dryers are the second biggest home energy user after HVAC. Clean the lint filter every load, use moisture sensors, and air-dry when possible.',
  'washing-machine': 'Use cold water -- 90% of washer energy goes to heating water. Modern detergents work fine in cold. High-efficiency washers use 40-50% less water.',
  'dishwasher': 'Skip the heated dry cycle (saves 15-50%). Run full loads only. Modern dishwashers use less water than hand-washing -- about 4 gallons vs 8-27.',
  'microwave': 'Microwaves are 3-4x more efficient than ovens for small meals. Use them instead of the stove when possible. One minute in a microwave = ~0.017 kWh.',
  'toaster': 'Toasters are surprisingly efficient for short bursts. Use a toaster oven instead of a full oven for small items -- saves ~50% energy.',
  'coffee-maker': 'Turn off the warming plate after brewing. A 900W coffee maker running 30 min/day costs ~$20/year for the brewing, but the warming plate adds more.',
  'ceiling-fan': 'Ceiling fans cool people, not rooms. Turn them off when leaving. In summer, run counter-clockwise. In winter, reverse to clockwise at low speed.',
  'pool-pump': 'Run your pool pump during off-peak hours. A variable-speed pump can cut energy use by 50-80% vs single-speed. Running 8 hrs/day instead of 12 saves ~33%.',
  'water-heater': 'Water heaters account for ~18% of home energy. Set to 120°F (not 140°F). Insulate the tank and pipes. A heat pump water heater cuts costs by 60%.',
  'ev-charger': 'Charge during off-peak hours if your utility offers time-of-use rates. Level 2 chargers are ~90% efficient vs ~80% for Level 1. Solar + EV = zero fuel cost.',
};

const DID_YOU_KNOW: Record<string, string> = {
  'space-heater': 'Did you know? A space heater running 8 hours a day for a month uses about as much energy as running a refrigerator for an entire year.',
  'led-bulb': 'Did you know? If every US home replaced just one incandescent bulb with an LED, it would save enough energy to light 3 million homes for a year.',
  'refrigerator': 'Did you know? Your refrigerator is one of the few appliances that runs 24/7. It accounts for about 7-10% of your total home electricity use.',
  'gaming-pc': 'Did you know? A gaming PC running 6 hours/day costs more per year than a refrigerator that runs 24/7. GPUs are power-hungry components.',
  'clothes-dryer': 'Did you know? The clothes dryer is typically the second-largest energy user in a home after the HVAC system -- about 6% of total home energy.',
  'water-heater': 'Did you know? Water heating is typically the second-largest energy expense in your home, accounting for about 18% of your utility bill.',
  'ev-charger': 'Did you know? The average US driver spends ~$1,200/year on gas. Charging an EV at home costs the equivalent of ~$0.50/gallon -- that\'s ~$500/year.',
  'general': 'Did you know? The average US home uses about 886 kWh per month, costing roughly $115 at the national average rate of $0.14/kWh.',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ElectricityPanel({ results }: Props) {
  const costPeriod    = results.find((r) => r.id === 'costPerPeriod');
  const kwhUsed       = results.find((r) => r.id === 'kwhUsed');
  const kwhPerDay     = results.find((r) => r.id === 'kwhPerDay');
  const costPerDay    = results.find((r) => r.id === 'costPerDay');
  const costPerMonth  = results.find((r) => r.id === 'costPerMonth');
  const costPerYear   = results.find((r) => r.id === 'costPerYear');
  const appliance     = results.find((r) => r.id === 'applianceLabel');
  const equivalent    = results.find((r) => r.id === 'equivalentNote');

  if (!costPeriod) return null;

  const applianceValue = appliance?.value || '';

  // Extract the preset key from the appliance label for tips
  let tipKey = '';
  if (applianceValue.includes('Space Heater')) tipKey = 'space-heater';
  else if (applianceValue.includes('Window AC')) tipKey = 'window-ac';
  else if (applianceValue.includes('Central AC')) tipKey = 'central-ac';
  else if (applianceValue.includes('LED Bulb')) tipKey = 'led-bulb';
  else if (applianceValue.includes('Incandescent')) tipKey = 'incandescent-bulb';
  else if (applianceValue.includes('Refrigerator')) tipKey = 'refrigerator';
  else if (applianceValue.includes('Old Refrigerator')) tipKey = 'old-refrigerator';
  else if (applianceValue.includes('Gaming PC')) tipKey = 'gaming-pc';
  else if (applianceValue.includes('Laptop')) tipKey = 'laptop';
  else if (applianceValue.includes('LED TV')) tipKey = 'tv';
  else if (applianceValue.includes('Clothes Dryer')) tipKey = 'clothes-dryer';
  else if (applianceValue.includes('Washing Machine')) tipKey = 'washing-machine';
  else if (applianceValue.includes('Dishwasher')) tipKey = 'dishwasher';
  else if (applianceValue.includes('Microwave')) tipKey = 'microwave';
  else if (applianceValue.includes('Toaster')) tipKey = 'toaster';
  else if (applianceValue.includes('Coffee Maker')) tipKey = 'coffee-maker';
  else if (applianceValue.includes('Ceiling Fan')) tipKey = 'ceiling-fan';
  else if (applianceValue.includes('Pool Pump')) tipKey = 'pool-pump';
  else if (applianceValue.includes('Water Heater')) tipKey = 'water-heater';
  else if (applianceValue.includes('EV')) tipKey = 'ev-charger';

  const tip = tipKey ? ENERGY_TIPS[tipKey] : null;
  const funFact = tipKey ? DID_YOU_KNOW[tipKey] : DID_YOU_KNOW.general;

  // Cost values as numbers for comparison bars
  const parseCost = (s: string | undefined): number => {
    if (!s) return 0;
    const m = /([\d.]+)([KM])?/.exec(s.replace(/[$,]/g, ''));
    if (!m) return 0;
    let n = parseFloat(m[1]);
    if (m[2] === 'K') n *= 1000;
    if (m[2] === 'M') n *= 1_000_000;
    return n;
  };

  const dayCost   = parseCost(costPerDay?.value);
  const monthCost = parseCost(costPerMonth?.value);
  const yearCost  = parseCost(costPerYear?.value);
  const maxBar    = Math.max(yearCost, monthCost, dayCost, 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Energy Cost Analysis
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Main Cost Display */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            {costPeriod.label}
          </p>
          <p className="text-4xl font-bold text-emerald-800">
            {costPeriod.value}
          </p>
          {kwhUsed && (
            <p className="text-sm text-emerald-600 mt-1">
              {kwhUsed.value}
            </p>
          )}
          {appliance && (
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {appliance.value}
            </span>
          )}
        </div>

        {/* Daily/Monthly/Yearly Comparison Bars */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Cost Comparison
          </p>
          <div className="space-y-2">
            {[
              { label: 'Per Day',   cost: dayCost,  barPct: (dayCost / maxBar) * 100, color: 'bg-blue-500' },
              { label: 'Per Month', cost: monthCost, barPct: (monthCost / maxBar) * 100, color: 'bg-amber-500' },
              { label: 'Per Year',  cost: yearCost, barPct: (yearCost / maxBar) * 100, color: 'bg-emerald-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 w-20 text-right shrink-0">
                  {item.label}
                </span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all`}
                    style={{ width: `${Math.max(item.barPct, 3)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-20 font-mono">
                  ${item.cost.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* kWh Breakdown Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Usage Rate Visualization
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="bg-slate-200 rounded-lg p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-slate-500">Daily</p>
                <p className="text-lg font-bold text-slate-700 font-mono">{kwhPerDay?.value || '0 kWh'}</p>
              </div>
            </div>
            <div className="text-slate-300 text-lg font-bold">+</div>
            <div className="flex-1">
              <div className="bg-amber-100 rounded-lg p-3 text-center border border-amber-200">
                <p className="text-[10px] font-bold uppercase text-amber-600">Rate</p>
                <p className="text-lg font-bold text-amber-700 font-mono">× $/kWh</p>
              </div>
            </div>
            <div className="text-slate-300 text-lg font-bold">=</div>
            <div className="flex-1">
              <div className="bg-emerald-100 rounded-lg p-3 text-center border border-emerald-200">
                <p className="text-[10px] font-bold uppercase text-emerald-600">Daily Cost</p>
                <p className="text-lg font-bold text-emerald-700 font-mono">{costPerDay?.value || '$0.00'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Energy Efficiency Tip */}
        {tip && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0 mt-0.5">💡</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                  Energy Saving Tip
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {tip}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* "Did You Know?" Comparative Note */}
        {funFact && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0 mt-0.5">🤔</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">
                  Did You Know?
                </p>
                <p className="text-xs text-purple-800 leading-relaxed">
                  {funFact}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Equivalent Note */}
        {equivalent && equivalent.value && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Comparison
            </p>
            <p className="text-xs text-slate-600">
              {equivalent.value}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
