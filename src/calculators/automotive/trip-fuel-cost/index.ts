import { CalculatorConfig, ExplainStep } from '../../../types/calculator';
import { tripFuel } from './tripMath';
import { createElement } from 'react';
import TripFuelCostPanel from './TripFuelCostPanel';

const tripFuelCostConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'distance',
      label: 'Trip Distance',
      type: 'number',
      placeholder: '500',
      min: 0,
      step: 1,
      inputMode: 'decimal',
      required: true,
      helpText: 'Total distance of your trip. Enter one-way distance for a single direction or the full round-trip distance if returning.',
    },
    {
      id: 'distanceUnit',
      label: 'Distance Unit',
      type: 'select',
      helpText: 'Choose miles or kilometers for your trip distance. The calculator converts it to match the efficiency unit.',
      options: [
        { label: 'Miles', value: 'miles' },
        { label: 'Kilometers', value: 'km' },
      ],
    },
    {
      id: 'fuelEfficiency',
      label: 'Fuel Efficiency',
      type: 'number',
      placeholder: '28',
      min: 0,
      max: 200,
      step: 0.1,
      inputMode: 'decimal',
      required: true,
      helpText: 'Your vehicle\'s fuel economy. For MPG, this is miles per gallon (higher is better). For L/100km, this is liters per 100 km (lower is better).',
    },
    {
      id: 'efficiencyUnit',
      label: 'Efficiency Unit',
      type: 'select',
      helpText: 'MPG (US miles per gallon) is standard in the United States. L/100km (liters per 100 kilometers) is standard in Europe, Canada, Australia, and most of the world.',
      options: [
        { label: 'MPG (miles per gallon)', value: 'mpg' },
        { label: 'L/100km (liters per 100 km)', value: 'l100km' },
      ],
    },
    {
      id: 'fuelPrice',
      label: 'Fuel Price',
      type: 'number',
      placeholder: '3.50',
      prefix: '$',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      required: true,
      helpText: 'Price per US gallon if your efficiency is in MPG, or per liter if it is in L/100km. Check a price app or your local station.',
    },
    {
      id: 'passengers',
      label: 'Number of Passengers',
      type: 'number',
      placeholder: '1',
      unit: 'people',
      min: 1,
      max: 10,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Including yourself (the driver). Splits the total fuel cost equally among all vehicle occupants.',
    },
  ],
  calculate: (values) => {
    const t = tripFuel(values);
    if (!t) return [];
    if ('error' in t) return [{ id: 'error', label: 'Error', value: t.error, color: 'negative' as const }];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'totalCost',
        label: 'Total Fuel Cost',
        value: `$${fmt(t.totalCost)}`,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'perPerson',
        label: `Cost per Person (${t.passengers})`,
        value: `$${fmt(t.costPerPerson)}`,
        color: 'positive',
      },
      {
        id: 'gallonsNeeded',
        label: t.metric ? 'Liters of Fuel Needed' : 'Gallons of Fuel Needed',
        value: `${fmt(t.fuelAmount)} ${t.metric ? 'liters' : 'gallons'}`,
        color: 'neutral',
      },
      {
        id: 'costPer100',
        label: t.metric ? 'Fuel Cost per 100 km' : 'Fuel Cost per 100 Miles',
        value: `$${fmt(t.costPer100)}`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TripFuelCostPanel, { values, results });
  },
  explainSteps: (values) => {
    const t = tripFuel(values);
    if (!t || 'error' in t) return [];
    if (![parseFloat(values.distance), parseFloat(values.fuelEfficiency), parseFloat(values.fuelPrice)].every(Number.isFinite)) return [];
    if (![t.distanceMiles, t.distanceKm, t.fuelAmount, t.totalCost, t.costPerPerson, t.passengers].every(Number.isFinite)) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // three decimals on the fuel amount so that amount × price visibly matches the total
    const fmt3 = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    const distance = parseFloat(values.distance);
    const efficiency = parseFloat(values.fuelEfficiency);
    const price = parseFloat(values.fuelPrice);
    const kmIn = values.distanceUnit === 'km';
    const unit = t.metric ? 'liters' : 'gallons';

    // Distance in the same system as the efficiency figure
    const distStep: ExplainStep = t.metric
      ? {
          label: 'Put the distance in kilometers',
          expr: kmIn ? `Distance = ${fmt(t.distanceKm)} km` : `${fmt(distance)} miles × 1.609344 = ${fmt(t.distanceKm)} km`,
        }
      : {
          label: 'Put the distance in miles',
          expr: kmIn ? `${fmt(distance)} km ÷ 1.609344 = ${fmt(t.distanceMiles)} miles` : `Distance = ${fmt(t.distanceMiles)} miles`,
        };

    return [
      distStep,
      {
        label: `Work out the ${unit} of fuel needed`,
        expr: t.metric
          ? `${fmt(t.distanceKm)} km × ${efficiency} L/100km ÷ 100 = ${fmt3(t.fuelAmount)} liters`
          : `${fmt(t.distanceMiles)} miles ÷ ${efficiency} MPG = ${fmt3(t.fuelAmount)} gallons`,
        note: t.metric
          ? 'With L/100km the fuel price is taken per liter.'
          : 'With MPG the fuel price is taken per US gallon.',
      },
      {
        label: 'Multiply by the fuel price',
        expr: `${fmt3(t.fuelAmount)} ${unit} × $${fmt(price)} per ${t.metric ? 'liter' : 'gallon'} = $${fmt(t.totalCost)}`,
      },
      {
        label: 'Split the cost between everyone in the vehicle',
        expr: `$${fmt(t.totalCost)} ÷ ${t.passengers} ${t.passengers === 1 ? 'person' : 'people'} = $${fmt(t.costPerPerson)} each`,
      },
    ];
  },
  educational: {
    formula: 'Fuel Cost = (Distance ÷ MPG) × Price per Gallon  |  or  (Distance in km × L/100km ÷ 100) × Price per Liter',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="80" y="60" width="280" height="60" fill="var(--svg-3b82f6)" rx="8"/><text x="220" y="90" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Trip Distance: 300 miles</text><rect x="80" y="140" width="130" height="60" fill="var(--svg-22c55e)" rx="8"/><text x="145" y="168" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Efficiency</text><text x="145" y="185" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">25 MPG</text><rect x="230" y="140" width="130" height="60" fill="var(--svg-8b5cf6)" rx="8"/><text x="295" y="168" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Fuel Price</text><text x="295" y="185" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">$3.50/gal</text><rect x="80" y="230" width="280" height="50" fill="var(--svg-ef4444)" rx="8"/><text x="220" y="260" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Fuel Cost = $42.00</text></svg>',
      alt: 'Trip distance, MPG, and fuel price combining into total fuel cost',
      caption: 'Trip fuel cost — 300 miles ÷ 25 MPG = 12 gallons × $3.50 = $42.00',
    },
    formulaDescription:
      'Trip fuel cost is the distance divided by fuel efficiency (gallons needed) multiplied by the fuel price. The calculator supports US units (miles, MPG, price per gallon) and metric units (km, L/100km, price per liter). The fuel price must use the same system as the efficiency you enter: per gallon with MPG, per liter with L/100km. MPG and L/100km are related by L/100km = 235.215 ÷ MPG, which comes from 100 × 3.785 liters per gallon ÷ 1.609 km per mile. For example, a car rated at 8.0 L/100km is equivalent to 235.215 ÷ 8.0 = 29.4 MPG.',
    variables: [
      { symbol: 'Distance', name: 'Trip Distance', description: 'Total distance of the trip. Enter one-way for a single trip or the round-trip total for a return journey. 1 kilometer = 0.621371 miles. Use a mapping tool to get the actual driving distance, which is usually longer than the straight-line distance.' },
      { symbol: 'MPG', name: 'Miles Per Gallon', description: 'US fuel efficiency measure: miles traveled per US gallon. Use your own observed highway MPG for the most realistic estimate rather than the lab rating.' },
      { symbol: 'L/100km', name: 'Liters per 100 Kilometers', description: 'Metric fuel consumption measure (lower is better), standard in Europe, Canada, and Australia. To convert: MPG = 235.215 ÷ (L/100km). A car using 8.0 L/100km gets approximately 29.4 MPG.' },
      { symbol: 'Fuel Price', name: 'Price per Gallon or Liter', description: 'Price per US gallon when your efficiency is in MPG, price per liter when it is in L/100km. Check a price-comparison app or your local station for current prices; prices vary by region and between stations.' },
    ],
    howToUse: [
      'Enter your trip distance and select the unit (miles or km). Use online maps for the actual driving distance.',
      'Enter your vehicle fuel efficiency in MPG or L/100km. Your own observed highway figure is more realistic than the EPA city rating.',
      'Enter the fuel price per gallon if you chose MPG, or per liter if you chose L/100km.',
      'Enter the number of passengers to split the cost. Include yourself: a solo trip is 1 passenger.',
      'Review the cost per 100 miles (or per 100 km) to compare vehicles or routes regardless of trip length.',
      'Use the per-person cost to compare carpooling with other ways of making the trip.',
    ],
    explanation:
      'Fuel cost is one of the most variable travel expenses, and it is the one you control most through vehicle choice and driving habits. At $3.50/gallon with a 30 MPG vehicle, a 500-mile trip uses 16.7 gallons and costs about $58 in fuel. Adding passengers cuts the per-person share quickly: four people sharing that trip pay $14.58 each. Real-world scenarios: a family road trip of 1,000 miles in a minivan averaging 22 MPG at $3.80/gallon costs about $173 in fuel, while the same distance in an RV at 10 MPG costs $380. For a daily 30-mile round-trip commute in a car getting 35 MPG at $3.50/gallon the fuel cost is $3.00 per day, or about $60 per month over 20 work days. An electric car doing 3.5 miles per kWh at $0.14/kWh would cost about $1.20 per day for the same commute, 60% less; over 240 commute days a year that saves about $432 a year, or roughly $2,160 over five years. Fuel is only part of what driving costs: depreciation, maintenance, insurance, and tires add to it, which is why the IRS business mileage rate (72.5 cents per mile in early 2026, 76 cents from July 1, 2026) is far above fuel cost alone.',
    commonUses: [
      'Budgeting fuel expenses for a road trip by entering distance, vehicle MPG, and current fuel prices',
      'Splitting fuel costs among carpool or road trip passengers to calculate each person\'s fair share',
      'Comparing fuel costs between different vehicles (e.g., your sedan vs. a rental SUV) to decide which one to take',
      'Estimating monthly and annual commuting fuel costs to see whether a more fuel-efficient vehicle or an EV would pay for itself',
      'Comparing fuel costs of two possible routes (shorter but slower vs. longer but faster)',
    ],
    faqs: [
      {
        question: 'Should I account for both directions?',
        answer: 'Enter the one-way distance for a one-way trip, or the total round-trip distance for a round trip. The calculator does not double the distance automatically. For a round trip, multiply your one-way distance by 2. For multi-stop trips, add all leg distances together; a mapping app can show the total driving distance for the whole route.',
      },
      {
        question: 'How does driving speed affect trip fuel cost?',
        answer: 'Fuel economy drops quickly above about 50 mph (fueleconomy.gov) because aerodynamic drag grows with the square of speed. As an illustration, if a car gets 30 MPG at 65 mph and 25 MPG at 75 mph, a 500-mile trip burns 16.7 versus 20 gallons, about $11.67 more at $3.50/gallon, while the faster speed saves only about 62 minutes (7.7 hours versus 6.7 hours). Your own car\'s numbers will differ, so test with your own MPG at different speeds.',
      },
      {
        question: 'Is carpooling worth it for short trips?',
        answer: 'Yes, it saves fuel, wear and tear, and parking costs. A 10-mile round-trip commute at 25 MPG costs about $1.40 per day in fuel at $3.50/gallon when driving solo. With 4 people carpooling, the fuel cost per person drops to $0.35 per day. Over a year of commuting (240 work days), that is $336 solo versus $84 carpooling, a difference of $252 per person per year. With 2 people the saving is about $168 per person per year.',
      },
      {
        question: 'How does air conditioning affect fuel cost?',
        answer: 'Running the A/C increases fuel use, more in hot weather and at low speeds. A common rule of thumb is that at highway speeds the A/C uses less fuel than driving with the windows open (because open windows add aerodynamic drag), while at low city speeds open windows are cheaper. Hybrids and EVs are usually less affected because the compressor is electric.',
      },
      {
        question: 'How do I convert between MPG and L/100km?',
        answer: 'Use the fixed conversion factor: L/100km = 235.215 ÷ MPG and MPG = 235.215 ÷ (L/100km). Examples: 30 MPG = 7.84 L/100km. 8.0 L/100km = 29.4 MPG. 25 MPG = 9.41 L/100km. 10 L/100km = 23.5 MPG. These are US gallons (3.785 liters). Imperial (UK) gallons are 4.546 liters, and the factor for Imperial MPG is 282.48; a UK MPG figure is about 20% higher than the US MPG figure for the same vehicle.',
      },
      {
        question: 'Does roof cargo or towing significantly affect fuel cost?',
        answer: 'Yes. A roof-mounted cargo box or even an empty rack adds aerodynamic drag, and the penalty grows with speed, so remove racks you are not using. Towing a trailer has the largest effect and can cut fuel economy dramatically, especially with a large travel trailer. If you are towing, use your observed towing MPG rather than the unladen rating when you enter efficiency here.',
      },
      {
        question: 'Should I use premium fuel to get better MPG?',
        answer: 'Only if the owner manual requires or recommends it. In an engine designed for regular (87 octane), premium gives no fuel-economy or power benefit; it only resists knock, which lets high-compression or turbocharged engines run more aggressive timing. If premium is required, use it. If it is only recommended, regular is usually safe with a small loss of power and efficiency. Enter the price of the fuel you actually buy.',
      },
    ],
    workedExamples: [
      {
        scenario: 'LA to Las Vegas weekend road trip (4 friends) in a car that gets 28 MPG, with gas at $3.50 per gallon. The trip is 270 miles one way.',
        inputs: { distance: '270', distanceUnit: 'miles', fuelEfficiency: '28', efficiencyUnit: 'mpg', fuelPrice: '3.50', passengers: '4' },
        result: '9.64 gallons — $33.75 total — $8.44 per person — $12.50 per 100 miles',
        insight: 'Gallons needed = 270 ÷ 28 = 9.64. Total fuel cost = 9.64 × $3.50 = $33.75. Cost per person (4 passengers) = $33.75 ÷ 4 = $8.44 each. Cost per 100 miles = (100 ÷ 28) × $3.50 = $12.50. A round trip costs $67.50 total, or $16.88 per person. At $5.00 per gallon the one-way trip would be $48.21 total, or $12.05 per person.',
      },
      {
        scenario: 'Cross-country move from NYC to San Francisco in a rental truck that averages 10 MPG, with fuel at $3.80 per gallon over about 2,900 miles.',
        inputs: { distance: '2900', distanceUnit: 'miles', fuelEfficiency: '10', efficiencyUnit: 'mpg', fuelPrice: '3.80', passengers: '1' },
        result: '290 gallons — $1,102.00 total — $38.00 per 100 miles',
        insight: 'Gallons needed = 2,900 ÷ 10 = 290. Total fuel cost = 290 × $3.80 = $1,102.00. This is fuel only; truck rental, tolls, and lodging are extra. A heavily loaded truck may get only 6-8 MPG, which would push the fuel bill to roughly $1,378-$1,837. Compare against a moving-container service before committing to the drive.',
      },
      {
        scenario: 'Suburban daily commute of 45 miles round trip in a 32 MPG car with gas at $3.50 per gallon, 240 commute days a year.',
        inputs: { distance: '45', distanceUnit: 'miles', fuelEfficiency: '32', efficiencyUnit: 'mpg', fuelPrice: '3.50', passengers: '1' },
        result: '1.41 gallons per day — $4.92 per day — about $1,181 per year',
        insight: 'Gallons per day = 45 ÷ 32 = 1.406. Daily fuel cost = 1.406 × $3.50 = $4.92. Annual fuel cost over 240 commute days = $1,181, or about $98 per month. That is 10,800 commute miles a year. A Prius-class car at 52 MPG would burn about $727 of fuel for the same miles, saving $454 a year. An EV using 4 miles per kWh at $0.14/kWh would use about $378 of electricity, saving about $803 a year versus the gas car, or over $4,000 in five years.',
      },
      {
        scenario: 'A European trip priced in metric units: 450 km in a car that uses 6.5 L/100km, with fuel at 1.80 per liter and 3 people sharing.',
        inputs: { distance: '450', distanceUnit: 'km', fuelEfficiency: '6.5', efficiencyUnit: 'l100km', fuelPrice: '1.80', passengers: '3' },
        result: '29.25 liters — 52.65 total — 17.55 per person (in your currency)',
        insight: 'Liters needed = 450 km × 6.5 ÷ 100 = 29.25 L. Total = 29.25 × 1.80 = 52.65, or 17.55 per person. The price here is per liter because the efficiency is in L/100km; cost per 100 km = 6.5 × 1.80 = 11.70.',
      },
    ],
    proTips: [
      'Check tire pressure before every long trip. Under-inflated tires can lower gas mileage by about 0.2% for every 1 psi drop in the average pressure of all tires (fueleconomy.gov). Use the pressure on the door-jamb sticker, not the maximum on the tire sidewall, and check when the tires are cold.',
      'Use cruise control on flat highways to hold a steady speed, but on hilly terrain consider letting the car slow slightly uphill and regain speed downhill instead of forcing a constant speed.',
      'Remove roof racks, cargo boxes, and bike racks when not in use; they add drag, especially at highway speed.',
      'Use a fuel-price app to find cheaper stations on your route. Prices often differ noticeably between stations in the same area, and across state lines.',
      'Plan fuel stops in remote areas. In sparsely populated regions stations can be far apart and some close early, so do not let the tank run low.',
      'Consider the total cost of driving, not just fuel. The IRS business mileage rate (72.5 cents per mile for Jan-Jun 2026 and 76 cents from July 1, 2026) reflects fuel plus depreciation, maintenance, insurance, and tires, and it is a deduction rate, not what a personal trip costs. It is still a useful reminder that fuel is only part of the cost of driving.',
      'For international trips, remember the price is per liter and usually in another currency: enter efficiency in L/100km and the per-liter price so the units match.',
    ],
    limitations: [
      'This calculator assumes a single constant fuel efficiency for the whole trip. Real fuel economy changes with terrain, speed, traffic, load, weather, and the city/highway mix, so use your own observed MPG for the most realistic estimate.',
      'Wind, cold weather, rain or snow, stop-and-go traffic, idling, and detours all increase fuel use and are not modeled; add a contingency for difficult conditions.',
      'The fuel price is a single number. Prices vary along a route, so a trip that crosses regions with different prices will cost somewhat more or less than this estimate.',
      'The passenger split is an equal division of fuel cost only. It does not include tolls, parking, or wear and tear on the vehicle.',
    ],
    quickReference: [
      { label: 'MPG to L/100km (30 MPG)', value: '7.84 L/100km' },
      { label: 'MPG to L/100km (25 MPG)', value: '9.41 L/100km' },
      { label: 'MPG to L/100km (20 MPG)', value: '11.76 L/100km' },
      { label: 'L/100km to MPG (8.0)', value: '29.4 MPG' },
      { label: 'L/100km to MPG (6.0)', value: '39.2 MPG' },
      { label: 'L/100km to MPG (10.0)', value: '23.5 MPG' },
      { label: '1 US gallon = liters', value: '3.785 liters' },
      { label: '1 mile = kilometers', value: '1.609 km' },
      { label: 'IRS business mileage rate (2026)', value: '72.5¢/mile Jan-Jun; 76¢/mile from Jul 1' },
    ],
    citations: [
      { source: 'EPA Fuel Economy', url: 'https://www.fueleconomy.gov/' },
      { source: 'U.S. Energy Information Administration -- Gasoline and Diesel Fuel Update', url: 'https://www.eia.gov/petroleum/gasdiesel/' },
      { source: 'IRS Standard Mileage Rates', url: 'https://www.irs.gov/tax-professionals/standard-mileage-rates' },
    ],
  },
};

export default tripFuelCostConfig;
