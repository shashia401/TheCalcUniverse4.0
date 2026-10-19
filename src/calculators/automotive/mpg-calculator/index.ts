import { CalculatorConfig, ExplainStep } from '../../../types/calculator';
import { createElement } from 'react';
import MPGPanel from './MPGPanel';
import { fixed2 as fmt } from '../../../lib/format';
import { mpgCalc, MPG_TO_L100KM, PRACTICAL_TANK_FRACTION } from './mpgMath';

const mpgCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      required: true,
      helpText: 'Choose what you want to calculate',
      options: [
        { label: 'MPG from miles driven and fuel used', value: 'mpg' },
        { label: 'Fuel cost for a trip', value: 'tripcost' },
        { label: 'Miles you can drive on a tank', value: 'range' },
        { label: 'Convert MPG to L/100km', value: 'convert' },
      ],
    },
    {
      id: 'milesDriven',
      label: 'Miles Driven',
      type: 'number',
      placeholder: '350',
      unit: 'miles',
      min: 0,
      step: 1,
      inputMode: 'decimal',
      helpText: 'Total miles driven between fill-ups',
    },
    {
      id: 'gallonsUsed',
      label: 'Gallons of Fuel Used',
      type: 'number',
      placeholder: '12.5',
      unit: 'gallons',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Gallons purchased to refill the tank',
    },
    {
      id: 'mpg',
      label: 'Vehicle MPG',
      type: 'number',
      placeholder: '30',
      unit: 'MPG',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Your vehicle fuel economy in miles per gallon',
    },
    {
      id: 'fuelPrice',
      label: 'Fuel Price',
      type: 'number',
      placeholder: '3.50',
      prefix: '$',
      unit: '/gallon',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Price per gallon of fuel',
    },
    {
      id: 'tankSize',
      label: 'Tank Size',
      type: 'number',
      placeholder: '15',
      unit: 'gallons',
      min: 0,
      step: 0.5,
      inputMode: 'decimal',
      helpText: 'Your fuel tank capacity in gallons',
    },
  ],
  calculate: (values) => {
    const c = mpgCalc(values);
    if (!c) return [];
    if (c.error) return [{ id: 'error', label: 'Error', value: c.error, color: 'negative' as const }];

    if (c.mode === 'mpg') {
      return [
        { id: 'mpg', label: 'Fuel Economy', value: `${fmt(c.mpg!)} MPG`, highlight: true, color: 'positive' },
        { id: 'l100km', label: 'In Liters per 100 km', value: `${fmt(c.l100km!)} L/100km`, color: 'neutral' },
        { id: 'kpl', label: 'Kilometers per Liter', value: `${fmt(c.kpl!)} km/L`, color: 'neutral' },
      ];
    }
    if (c.mode === 'tripcost') {
      return [
        { id: 'tripCost', label: 'Trip Fuel Cost', value: `$${fmt(c.tripCost!)}`, highlight: true, color: 'neutral' },
        { id: 'gallons', label: 'Gallons Needed', value: `${fmt(c.gallons!)} gallons`, color: 'neutral' },
        { id: 'costPerMile', label: 'Fuel Cost per Mile', value: `$${fmt(c.costPerMile!)}/mile`, color: 'neutral' },
      ];
    }
    if (c.mode === 'range') {
      return [
        { id: 'range', label: 'Full Tank Range', value: `${fmt(c.range!)} miles`, highlight: true, color: 'positive' },
        { id: 'usable', label: 'Practical Range (90% tank)', value: `${fmt(c.usable!)} miles`, color: 'neutral' },
      ];
    }
    return [
      { id: 'l100km', label: 'Liters per 100 km', value: `${fmt(c.l100km!)} L/100km`, highlight: true, color: 'positive' },
      { id: 'kpl', label: 'Kilometers per Liter', value: `${fmt(c.kpl!)} km/L`, color: 'neutral' },
      { id: 'mpg', label: 'Miles per Gallon', value: `${fmt(c.mpg!)} MPG`, color: 'neutral' },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MPGPanel, { values, results });
  },
  explainSteps: (values) => {
    const c = mpgCalc(values);
    if (!c || c.error) return [];
    if (![c.mpg, c.l100km, c.kpl, c.tripCost, c.gallons, c.costPerMile, c.range, c.usable].every((x) => x === undefined || Number.isFinite(x))) return [];
    const factor = MPG_TO_L100KM.toFixed(4);
    const unitsStep = (mpg: number, l100: number, kpl: number): ExplainStep => ({
      label: 'Your result in every unit',
      expr: `${fmt(mpg)} MPG = ${fmt(l100)} L/100km = ${fmt(kpl)} km/L`,
    });

    if (c.mode === 'mpg') {
      const miles = parseFloat(values.milesDriven);
      const gal = parseFloat(values.gallonsUsed);
      return [
        { label: 'Divide miles driven by gallons used', expr: `MPG = ${miles} miles ÷ ${gal} gallons = ${fmt(c.mpg!)} MPG` },
        {
          label: 'Convert to liters per 100 km',
          expr: `L/100km = ${factor} ÷ ${fmt(c.mpg!)} = ${fmt(c.l100km!)} L/100km`,
          note: `${factor} = 100 × 3.785411784 liters per US gallon ÷ 1.609344 km per mile.`,
        },
        { label: 'Convert to kilometers per liter', expr: `km/L = ${fmt(c.mpg!)} × 1.609344 ÷ 3.785411784 = ${fmt(c.kpl!)} km/L` },
        unitsStep(c.mpg!, c.l100km!, c.kpl!),
      ];
    }
    if (c.mode === 'tripcost') {
      const miles = parseFloat(values.milesDriven);
      const mpg = parseFloat(values.mpg);
      const price = parseFloat(values.fuelPrice);
      return [
        { label: 'Gallons the trip needs', expr: `${miles} miles ÷ ${mpg} MPG = ${c.gallons!.toFixed(3)} gallons` },
        { label: 'Multiply by the fuel price', expr: `${c.gallons!.toFixed(3)} gallons × $${fmt(price)}/gallon = $${fmt(c.tripCost!)}` },
        { label: 'Spread it over the miles', expr: `$${fmt(c.tripCost!)} trip cost ÷ ${miles} miles = $${fmt(c.costPerMile!)}/mile` },
      ];
    }
    if (c.mode === 'range') {
      const tank = parseFloat(values.tankSize);
      const mpg = parseFloat(values.mpg);
      return [
        { label: 'Multiply tank size by fuel economy', expr: `${tank} gallons × ${mpg} MPG = ${fmt(c.range!)} miles on a full tank` },
        { label: 'Keep 10% of the tank in reserve', expr: `${tank} × 0.9 = ${fmt(tank * PRACTICAL_TANK_FRACTION)} gallons usable`, note: 'The practical range figure assumes you refuel with 10% of the tank left.' },
        { label: 'Practical range', expr: `${fmt(tank * PRACTICAL_TANK_FRACTION)} gallons × ${mpg} MPG = ${fmt(c.usable!)} miles (full tank: ${fmt(c.range!)} miles)` },
      ];
    }
    const mpg = parseFloat(values.mpg);
    return [
      { label: 'Build the conversion factor', expr: `100 × 3.785411784 L ÷ 1.609344 km = ${factor}`, note: 'One US gallon is 3.785411784 liters and one mile is 1.609344 km.' },
      { label: 'Divide by your MPG', expr: `L/100km = ${factor} ÷ ${mpg} = ${fmt(c.l100km!)} L/100km` },
      { label: 'Convert to kilometers per liter', expr: `km/L = ${mpg} × 1.609344 ÷ 3.785411784 = ${fmt(c.kpl!)} km/L` },
      unitsStep(c.mpg!, c.l100km!, c.kpl!),
    ];
  },
  educational: {
    formula: 'MPG = Miles Driven ÷ Gallons Used | L/100km = 235.215 ÷ MPG',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="100" width="320" height="160" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" rx="8"/><rect x="80" y="140" width="40" height="100" fill="var(--svg-ef4444)" rx="4"/><rect x="130" y="120" width="40" height="120" fill="var(--svg-f59e0b)" rx="4"/><rect x="180" y="100" width="40" height="140" fill="var(--svg-3b82f6)" rx="4"/><rect x="230" y="80" width="40" height="160" fill="var(--svg-22c55e)" rx="4"/><rect x="280" y="60" width="40" height="180" fill="var(--svg-22c55e)" rx="4"/><text x="100" y="260" text-anchor="middle" font-size="10" fill="var(--svg-666666)">10</text><text x="150" y="260" text-anchor="middle" font-size="10" fill="var(--svg-666666)">20</text><text x="200" y="260" text-anchor="middle" font-size="10" fill="var(--svg-666666)">30</text><text x="250" y="260" text-anchor="middle" font-size="10" fill="var(--svg-666666)">40</text><text x="300" y="260" text-anchor="middle" font-size="10" fill="var(--svg-666666)">50</text><text x="220" y="310" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Fuel Efficiency (MPG)</text></svg>',
      alt: 'Bar chart showing fuel efficiency scale from 10 to 50 MPG',
      caption: 'MPG scale — higher bars represent better fuel efficiency',
    },
    formulaDescription:
      'Miles per gallon (MPG) is the US standard fuel efficiency measure. The conversion factor 235.215 converts between MPG and liters per 100 km (the metric standard). Lower L/100km is better fuel economy.',
    variables: [
      { symbol: 'MPG', name: 'Miles Per Gallon', description: 'Number of miles a vehicle can travel on one gallon of fuel. Higher MPG = better fuel economy. The US standard measure of fuel efficiency.' },
      { symbol: 'L/100km', name: 'Liters per 100 Kilometers', description: 'Metric standard measure of fuel consumption. Lower values are better. A car that gets 30 MPG consumes about 7.8 L/100km.' },
      { symbol: 'KPL', name: 'Kilometers per Liter', description: 'Metric measure of fuel economy. 1 MPG ≈ 0.425 km/L. Used in Japan and several other countries.' },
    ],
    howToUse: [
      'Select the calculation type from the dropdown: MPG, trip cost, range, or unit conversion.',
      'Enter the required values for your selected calculation.',
      'View fuel economy, trip costs, or unit conversions.',
      'Use the range mode to estimate how far you can drive on a full tank (with a 10% reserve).',
    ],
    explanation:
      'Fuel economy is measured in MPG in the United States and most of the Western hemisphere. Europe and most of the world use L/100km (lower is better). To convert: L/100km = 235.215 ÷ MPG. The EPA tests vehicles under standardized conditions, so your real-world MPG often differs from the label. Factors affecting real-world MPG include driving speed (fuel economy falls off quickly above about 50 mph, per fueleconomy.gov), air conditioning use (a noticeable penalty in hot weather), cold weather (roughly 15% lower in city driving at 20°F than at 77°F, and up to 24% on short trips, per fueleconomy.gov), tire pressure (under-inflated tires can lower MPG by about 0.2% for every 1 PSI drop in average pressure, per fueleconomy.gov), cargo weight (an extra 100 pounds can reduce MPG by about 1%, per fueleconomy.gov), and road grade (hilly terrain increases fuel consumption). For hybrid and electric vehicles, driving style has an even larger impact — aggressive acceleration reduces efficiency compared to smooth driving. The trip cost mode helps you budget for road trips: a 1,000 mile trip in a car getting 30 MPG at $3.50 per gallon costs about $117 in fuel. The range mode answers the common question "how far can I go on a tank?" — a 15-gallon tank at 30 MPG gives 450 miles of range, or about 405 miles of practical range leaving a 10% reserve.',
    commonUses: [
      'Measuring your vehicle actual fuel economy by tracking miles driven and gallons used between fill-ups',
      'Estimating fuel cost for an upcoming road trip using your car real MPG and current gas prices',
      'Calculating how far you can drive on a full tank to plan long-distance routes and fuel stops',
      'Converting between MPG and L/100km when comparing US and international vehicle fuel efficiency ratings',
    ],
    workedExamples: [
      {
        scenario: 'Emma fills up her sedan after driving 385 miles and the pump shows 14.2 gallons. With gas at $3.59/gallon in her area, what is her real MPG and cost per mile?',
        inputs: { mode: 'mpg', milesDriven: '385', gallonsUsed: '14.2' },
        result: '27.11 MPG — 8.68 L/100km — $0.13/mile fuel cost',
        insight: 'MPG = 385 / 14.2 = 27.1 MPG. Convert to metric: 235.215 / 27.1 = 8.68 L/100km. At $3.59/gallon, her fuel cost per mile = $3.59 / 27.1 = $0.132/mile. Compared to the EPA combined rating of 30 MPG for her car, she is getting about 10% less — within the expected real-world variance due to city driving and occasional A/C use.',
      },
      {
        scenario: 'The Chen family is planning a 1,200-mile road trip from Chicago to Orlando in their minivan averaging 24 MPG. Gas prices along the route average $3.45/gallon. The minivan has an 18-gallon tank. How much will fuel cost and how many stops will they need?',
        inputs: { mode: 'tripcost', milesDriven: '1200', mpg: '24', fuelPrice: '3.45' },
        result: '$172.50 total fuel cost — 50 gallons needed — ~3 fuel stops at 389-mile intervals',
        insight: 'Gallons needed = 1,200 / 24 = 50 gallons. Total fuel cost = 50 x $3.45 = $172.50. For range planning: Full tank range = 18 x 24 = 432 miles. Practical range (90% tank) = 16.2 x 24 = 389 miles. With 1,200 miles and ~389 miles between fill-ups, they will need about 3 fuel stops. Spacing them approximately every 380-400 miles gives a comfortable buffer. Budget $175 for fuel and plan stops around the 380, 760, and 1,140 mile marks.',
      },
    ],
    proTips: [
      'Track your MPG over multiple fill-ups, not just one. A single tank can vary by 10-15% due to pump shut-off differences, temperature, and driving conditions. Average 5+ tanks for your real baseline. Apps like Fuelly or a simple notes app make this easy.',
      'Speed is a big controllable factor in fuel economy: it usually drops quickly above about 50 mph (fueleconomy.gov), so cruising a little slower on a long highway trip saves fuel for a modest time cost.',
      'Under-inflated tires cost you money silently. Under-inflated tires can lower gas mileage by about 0.2% for every 1 psi drop in the average pressure of all tires (fueleconomy.gov). Most cars on the road have at least one under-inflated tire. Check pressure monthly — it takes 2 minutes and costs nothing at most gas stations.',
      'Use the trip cost mode before road trips to budget accurately. Fuel is often the single largest trip expense after lodging. Knowing the exact cost removes guesswork and lets you split costs fairly if traveling with friends.',
      'When comparing fuel efficiency between US and international vehicles, always use L/100km for an apples-to-apples comparison. The MPG scale is non-linear: improving from 10 to 20 MPG saves 5 gallons per 100 miles. Improving from 30 to 40 MPG saves only 0.83 gallons per 100 miles. The L/100km scale is linear and avoids this "MPG illusion."',
    ],
    limitations: [
      'This calculator provides theoretical fuel economy and cost estimates based on the values entered. Actual MPG varies with driving conditions (city vs. highway mix), weather (cold engines use more fuel, and winter-blend gasoline has slightly less energy per gallon), road grade, vehicle load, and driving style.',
      'The MPG-to-L/100km conversion uses the constant 235.215, which is accurate for US gallons. For Imperial (UK) gallons, the conversion constant is 282.481 instead.',
      'The trip cost mode assumes constant fuel prices along the route; real prices vary by state and station. The range mode uses a simplified 90% practical tank; actual low-fuel warning light behavior varies by manufacturer.',
      'For hybrid and plug-in hybrid vehicles, real-world MPG depends heavily on trip length, battery state of charge, and ambient temperature beyond what this calculator models.',
    ],
    quickReference: [
      { label: 'MPG to L/100km', value: '235.215 / MPG' },
      { label: 'L/100km to MPG', value: '235.215 / (L/100km)' },
      { label: '1 US gallon', value: '3.785 liters' },
      { label: '1 mile', value: '1.609 km' },
      { label: 'Extra 100 lb of cargo', value: '≈ -1% MPG (fueleconomy.gov)' },
      { label: 'Tire pressure', value: '≈ -0.2% MPG per 1 psi low (fueleconomy.gov)' },
      { label: 'Cold weather (20°F, city)', value: '≈ -15% MPG (fueleconomy.gov)' },
    ],
    faqs: [
      {
        question: 'Why is my real-world MPG lower than the EPA estimate?',
        answer: 'EPA estimates are from standardized test conditions. Highway driving at high speed, frequent acceleration, using A/C, cold weather, and carrying extra weight all reduce MPG compared with the EPA estimate, so your own measured MPG can come out lower (or sometimes higher).',
      },
      {
        question: 'How do I measure my actual MPG?',
        answer: 'Fill your tank completely, reset your trip odometer, drive until you need fuel, fill up again, and divide the miles driven by the gallons pumped. This is the most accurate real-world measurement. Keep a log over multiple fill-ups for a more reliable average.',
      },
      {
        question: 'How can I improve my fuel economy?',
        answer: 'Maintain steady speeds using cruise control, keep tires properly inflated, remove excess weight from the trunk, avoid aggressive acceleration and braking, use the recommended grade of motor oil, and combine errands into single trips to avoid cold-engine driving (which is less efficient).',
      },
      {
        question: 'What is the MPG illusion and why does it matter?',
        answer: 'The MPG scale is misleading because it is not linear. Replacing a 10 MPG truck with a 20 MPG truck saves 5 gallons per 100 miles (50 gallons per 1,000 miles). Replacing a 30 MPG sedan with a 60 MPG hybrid saves only 1.67 gallons per 100 miles (16.7 gallons per 1,000 miles). The fuel savings from MPG improvements diminish as MPG increases, even though the numbers look equally impressive. This is why European and Canadian regulators use L/100km — it is linear and avoids this cognitive bias. When prioritizing fuel economy upgrades, focus on the least efficient vehicles first.',
      },
      {
        question: 'Does using premium gas improve MPG?',
        answer: 'Only if your vehicle requires or recommends it. For cars designed for regular (87 octane), premium fuel provides zero benefit to fuel economy or performance. The higher octane rating only prevents engine knock (pre-ignition) in high-compression engines. If your owner\'s manual says "premium recommended" (not "required"), you can use regular without damage — modern engines have knock sensors that adjust timing, though you may lose a little power and see a small MPG drop. If the manual says "premium required," use premium to avoid engine damage. The price difference per gallon almost never justifies using premium in a car designed for regular.',
      },
      {
        question: 'How accurate is my car\'s MPG display?',
        answer: 'Most modern cars with trip computer MPG displays are reasonably accurate but can differ from a manual calculation (miles driven / gallons pumped) by a few percent, because the car computes fuel use from injector data rather than measuring it at the pump. To verify your car\'s display: reset the trip computer, drive a full tank, then compare the displayed MPG to your manual calculation. If the gap is consistently large, mention it at your next service appointment — it may indicate a sensor calibration issue.',
      },
    ],
    citations: [
      { source: 'EPA Fuel Economy', url: 'https://www.fueleconomy.gov/' },

    ],
  },
};

export default mpgCalculatorConfig;
