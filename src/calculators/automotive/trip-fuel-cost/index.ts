import { CalculatorConfig } from '../../../types/calculator';
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
      helpText: 'Choose miles or kilometers for your trip distance. The calculator auto-converts for mixed units.',
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
      helpText: 'Current price per gallon (if using MPG/miles) or per liter (if using L/100km/km). Check GasBuddy or your local station for current prices.',
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
    const distance = parseFloat(values.distance);
    const distUnit = values.distanceUnit || 'miles';
    const efficiency = parseFloat(values.fuelEfficiency);
    const effUnit = values.efficiencyUnit || 'mpg';
    const fuelPrice = parseFloat(values.fuelPrice);
    const passengers = parseFloat(values.passengers) || 1;

    if ([distance, efficiency, fuelPrice].some(isNaN) || efficiency <= 0) return [];
    if (distance < 0) return [{ id: 'error', label: 'Error', value: 'Distance must be greater than 0', color: 'negative' as const }];

    let distanceMiles: number;
    if (distUnit === 'km') {
      distanceMiles = distance * 0.621371;
    } else {
      distanceMiles = distance;
    }

    let mpg: number;
    if (effUnit === 'l100km') {
      mpg = 235.215 / efficiency;
    } else {
      mpg = efficiency;
    }

    const gallonsNeeded = distanceMiles / mpg;
    const totalCost = gallonsNeeded * fuelPrice;
    const costPerPerson = totalCost / passengers;
    const costPer100Miles = (100 / distanceMiles) * totalCost;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'totalCost',
        label: 'Total Fuel Cost',
        value: `$${fmt(totalCost)}`,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'perPerson',
        label: `Cost per Person (${passengers})`,
        value: `$${fmt(costPerPerson)}`,
        color: 'positive',
      },
      {
        id: 'gallonsNeeded',
        label: 'Gallons of Fuel Needed',
        value: `${fmt(gallonsNeeded)} gallons`,
        color: 'neutral',
      },
      {
        id: 'costPer100',
        label: 'Fuel Cost per 100 Miles',
        value: `$${fmt(costPer100Miles)}`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TripFuelCostPanel, { values, results });
  },
  educational: {
    formula: 'Fuel Cost = (Distance ÷ MPG) × Fuel Price per Gallon',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="80" y="60" width="280" height="60" fill="var(--svg-3b82f6)" rx="8"/><text x="220" y="90" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Trip Distance: 300 miles</text><rect x="80" y="140" width="130" height="60" fill="var(--svg-22c55e)" rx="8"/><text x="145" y="168" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Efficiency</text><text x="145" y="185" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">25 MPG</text><rect x="230" y="140" width="130" height="60" fill="var(--svg-8b5cf6)" rx="8"/><text x="295" y="168" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Fuel Price</text><text x="295" y="185" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">$3.50/gal</text><rect x="80" y="230" width="280" height="50" fill="var(--svg-ef4444)" rx="8"/><text x="220" y="260" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Fuel Cost = $42.00</text></svg>',
      alt: 'Trip distance, MPG, and fuel price combining into total fuel cost',
      caption: 'Trip fuel cost — distance divided by MPG times fuel price per gallon',
    },
    formulaDescription:
      'Trip fuel cost is calculated by dividing distance by fuel efficiency to get gallons needed, then multiplying by the fuel price per gallon. Supports both US (MPG, miles) and metric (L/100km, km) units. The conversion between MPG and L/100km uses the fixed relationship: MPG = 235.215 / L/100km. This constant accounts for the conversion of miles to kilometers (1.609) and gallons to liters (3.785), giving us 235.215 = 100 / (1.609 x 3.785) x 100. For example, a car rated at 8.0 L/100km is equivalent to 235.215 / 8.0 = 29.4 MPG.',
    variables: [
      { symbol: 'Distance', name: 'Trip Distance', description: 'Total distance of the trip. Enter one-way for a single trip or round-trip total for a return journey. 1 kilometer = 0.621371 miles. For cross-country trips, use online mapping tools (Google Maps, Waze) to get accurate driving distance, which may differ from straight-line distance by 10-30%.' },
      { symbol: 'MPG', name: 'Miles Per Gallon', description: 'US fuel efficiency measure. The number of miles your vehicle travels per gallon of fuel consumed. Typical values: compact cars 30-40 MPG highway, midsize sedans 25-35 MPG, small SUVs 22-30 MPG, full-size trucks 15-22 MPG, RVs 8-12 MPG. Your actual highway MPG may differ from the EPA rating by +/-3 MPG depending on driving style and vehicle condition.' },
      { symbol: 'L/100km', name: 'Liters per 100 Kilometers', description: 'Metric fuel consumption measure. Lower is better. Common in Europe, Canada, and Australia. Typical values: compact cars 6-8 L/100km, midsize sedans 7-10 L/100km, SUVs 8-13 L/100km. To convert: MPG = 235.215 / L/100km. A car using 8.0 L/100km gets approximately 29.4 MPG.' },
      { symbol: 'Fuel Price', name: 'Price per Gallon or Liter', description: 'Current fuel price at your local station. US national average gasoline price has ranged from $3.00 to $5.00 per gallon in recent years. Diesel is typically $0.50-$1.00 more per gallon. Fuel prices vary significantly by state (California typically $1.50-$2.00 higher than Texas) and by country (European prices are 2-4x US prices due to higher fuel taxes). For the most accurate estimate, check GasBuddy or a similar app for real-time prices along your route.' },
    ],
    howToUse: [
      'Enter your trip distance and select the unit (miles or km). Use online maps for accurate driving distance.',
      'Enter your vehicle fuel efficiency in MPG or L/100km. Use your actual observed highway MPG, not the EPA city rating.',
      'Enter the current fuel price per gallon (if using miles) or per liter (if using km). Check GasBuddy for prices on your route.',
      'Enter the number of passengers to split the cost. Include yourself -- a solo trip is 1 passenger. Maximum 10 passengers.',
      'Review the cost per 100 miles to compare the fuel efficiency cost of different vehicles or routes.',
      'Use the per-person cost to compare carpooling against public transit, ride-sharing (Uber/Lyft), or flying for trips under 500 miles.',
    ],
    explanation:
      'Fuel cost is one of the most variable travel expenses, and it is the expense you have the most control over through vehicle choice and driving habits. At $3.50/gallon with a 30 MPG vehicle, a 500-mile trip costs about $58 in fuel. Adding passengers dramatically reduces the per-person cost -- carpooling 4 people on that trip brings the cost down to $14.58 each, which is cheaper than most transit options for medium distances. For context: a typical Amtrak ticket for a 500-mile trip costs $60-$120, a regional flight costs $150-$400, and driving solo costs $58 in fuel (plus vehicle depreciation of approximately $0.10-$0.30 per mile, or $50-$150 additional). Real-world scenarios: a family road trip of 1,000 miles in a minivan averaging 22 MPG at $3.80/gallon costs about $173 in fuel. An RV trip at 10 MPG over the same distance costs $380 -- a significant factor in trip budgeting that makes RV travel less economical than it appears at first glance. For shorter commutes, a daily 30-mile round trip in a car getting 35 MPG at $3.50/gallon costs $3.00 per day, or $60 per month (20 work days). An equivalent electric vehicle at $0.14/kWh and 3.5 miles/kWh would cost approximately $1.20 per day -- roughly 60% less. Over a 5-year ownership period, the fuel savings of an EV commuter can exceed $7,000.',
    commonUses: [
      'Budgeting fuel expenses for a road trip or cross-country drive by entering distance, vehicle MPG, and current fuel prices',
      'Splitting fuel costs among carpool or road trip passengers to calculate each person\'s fair share of the fuel bill',
      'Comparing fuel costs between different vehicles (e.g., your sedan vs. a rental SUV) when planning a trip to decide which vehicle to take',
      'Estimating monthly and annual commuting fuel costs to evaluate whether a more fuel-efficient vehicle or EV would pay for itself in fuel savings',
      'Calculating the fuel cost difference between two possible routes (shorter but slower vs. longer but faster highway) to inform route selection',
    ],
    faqs: [
      {
        question: 'Should I account for both directions?',
        answer: 'Enter the one-way distance for a one-way trip, or the total round-trip distance for a round trip. The calculator does not double the distance automatically. For a round trip, simply multiply your one-way distance by 2. For multi-stop trips, add all leg distances together. Pro tip: Google Maps lets you add multiple destinations and shows the total driving distance for the entire route, which you can enter directly.',
      },
      {
        question: 'How does driving speed affect trip fuel cost?',
        answer: 'Fuel efficiency drops significantly above 60-65 mph due to aerodynamic drag, which increases with the square of speed. Driving at 75 mph instead of 65 mph can reduce MPG by 10-15%, increasing trip cost proportionally. For a 500-mile trip in a car rated at 30 MPG highway, the difference between cruising at 65 mph (~30 MPG) and 75 mph (~25 MPG) is approximately $11.67 in fuel at $3.50/gallon -- and the time saved is only about 37 minutes. Using cruise control on flat highways can improve efficiency by 5-10% by eliminating the small speed fluctuations of human throttle control. However, on hilly terrain, cruise control may hurt efficiency by aggressively downshifting to maintain speed on grades -- manual throttle control that allows the car to slow slightly going uphill and regain speed downhill is more efficient.',
      },
      {
        question: 'Is carpooling worth it for short trips?',
        answer: 'Even for short trips, carpooling saves fuel, reduces wear and tear on each car, lowers parking costs, and cuts traffic congestion. The savings add up meaningfully over time: a 10-mile round trip commute at 25 MPG in a solo car costs about $1.40 per day in fuel at $3.50/gallon. With 4 people carpooling, the per-person cost drops to $0.35 per day. Over a year of commuting (240 work days), that is $336 in fuel driving solo vs. $84 carpooling -- a difference of $252 per person per year, not counting reduced parking, maintenance, and depreciation. For 2-person carpooling on the same commute, each person saves approximately $168 per year. Many cities also have HOV (High Occupancy Vehicle) lanes that can reduce commute time by 10-30 minutes per day.',
      },
      {
        question: 'How much does using air conditioning affect my fuel cost?',
        answer: 'Running the AC can reduce fuel economy by 5-25% depending on outside temperature, vehicle size, and engine type. At highway speeds (above 55 mph), the AC is actually more efficient than driving with windows open, because open windows create significant aerodynamic drag that outweighs the AC compressor load. At lower city speeds (under 45 mph), driving with windows down is more efficient than using AC. On a 500-mile highway trip in a midsize sedan at 30 MPG with AC on, expect a fuel economy penalty of approximately 5-8%, adding about $4-$7 to the trip cost at $3.50/gallon. For hybrid and EV vehicles, the AC impact is typically lower (3-5%) because the AC compressor is electrically driven and more efficient than a belt-driven unit.',
      },
      {
        question: 'How do I convert between MPG and L/100km?',
        answer: 'Use the fixed conversion factor: MPG = 235.215 / L/100km. This works in both directions: L/100km = 235.215 / MPG. Examples: 30 MPG = 235.215 / 30 = 7.84 L/100km. 8.0 L/100km = 235.215 / 8.0 = 29.4 MPG. 25 MPG = 9.41 L/100km. 10 L/100km = 23.5 MPG. A quick mental shortcut: divide 235 by the number to get a rough estimate (235 / 8.0 = 29.4). Important: these are US gallons (3.785 liters). Imperial (UK) gallons are 4.546 liters, and the conversion factor for Imperial MPG is 282.48 / L/100km. If you are comparing UK and US fuel economy figures, remember that a UK MPG rating is approximately 20% higher than the US MPG rating for the same vehicle.',
      },
      {
        question: 'Does carrying roof cargo or a trailer significantly affect fuel cost?',
        answer: 'Yes, dramatically. A roof-mounted cargo box can reduce highway fuel economy by 10-25% due to aerodynamic drag, adding $30-$75 to a 1,000-mile trip at $3.50/gallon. Roof racks without a cargo box (just the crossbars) still reduce MPG by 5-8%. Even empty roof racks should be removed when not in use. A rear hitch-mounted cargo carrier has much less aerodynamic impact (2-5% reduction) because it sits in the vehicle\'s wake. Towing a trailer has the largest impact: a small utility trailer reduces MPG by 20-30%, a pop-up camper by 30-40%, and a full-size travel trailer can cut MPG in half (50% reduction). For a truck rated at 20 MPG highway unladen, towing a 5,000-lb travel trailer typically yields 9-12 MPG -- doubling the fuel cost per mile. Always factor the trailer fuel penalty into trip planning.',
      },
      {
        question: 'What is the most fuel-efficient speed for highway driving?',
        answer: 'The "sweet spot" for most vehicles is between 50-60 mph. Below this range, engine efficiency drops because the engine operates at lower load. Above 60 mph, aerodynamic drag (which increases with the square of speed) becomes the dominant factor. The EPA highway test cycle averages 48 mph with a top speed of 60 mph, so the EPA highway rating represents moderate-speed cruising, not 75-80 mph interstate driving. A typical sedan rated at 35 MPG highway (EPA) will achieve approximately 35 MPG at 55-60 mph, 32 MPG at 65 mph, 29 MPG at 75 mph, and 26 MPG at 80 mph. Each 5 mph over 60 mph reduces fuel economy by approximately 7-8%. For hypermiling enthusiasts, driving at 55 mph in a car rated at 35 MPG can achieve 38-40 MPG -- approximately 10-15% better than the EPA rating.',
      },
      {
        question: 'Should I use premium fuel instead of regular to get better MPG?',
        answer: 'Only if your vehicle\'s owner manual specifically requires or recommends premium fuel. Using premium (higher octane) fuel in an engine designed for regular (87 octane) provides NO benefit in fuel economy, power, or engine longevity -- it only costs more. Premium fuel has a higher resistance to knock (pre-ignition), which allows engines with higher compression ratios or turbochargers to run more timing advance without detonation. If your car requires premium (typically European luxury/sport vehicles), using regular can cause knock, reduce power, and potentially cause engine damage. If your car recommends premium (not requires), you can safely use regular at a slight reduction in power and MPG (typically 2-5%). The price premium for premium fuel (typically $0.60-$1.00 per gallon more than regular) almost never pays for itself through efficiency gains, even in engines that can take advantage of it. The exception: some high-performance turbocharged engines achieve 10-15% better fuel economy on premium, which can offset the price difference at certain price spreads.',
      },
    ],
    workedExamples: [
      {
        scenario: 'LA to Las Vegas Weekend Road Trip (4 Friends)',
        inputs: { distance: '270', distanceUnit: 'miles', fuelEfficiency: '28', efficiencyUnit: 'mpg', fuelPrice: '3.50', passengers: '4' },
        result: 'Gallons needed = 270 / 28 = 9.64 gallons. Total fuel cost = 9.64 x $3.50 = $33.75. Cost per person (4 passengers) = $33.75 / 4 = $8.44 each. Cost per 100 miles = $12.50.',
        insight: 'At $8.44 per person one-way, driving is dramatically cheaper than flying (LAX-LAS flights typically cost $60-$150 one-way) and comparable to the bus (Megabus/Flixbus typically $15-$30 one-way). The 4-hour drive compares favorably to flying when you account for airport security time (2 hours), flight time (1 hour), and baggage claim/transport (1 hour) -- total flying time is often 4+ hours. The key variable is the return trip: a round trip costs $67.50 total or $16.88 per person in fuel, still far cheaper than any alternative for 4 people. At current California gas prices (which can reach $5.00/gallon), the same trip would cost $48.20 total or $12.05 per person -- still very economical.',
      },
      {
        scenario: 'Cross-Country Move: NYC to San Francisco in a Rental Truck',
        inputs: { distance: '2900', distanceUnit: 'miles', fuelEfficiency: '10', efficiencyUnit: 'mpg', fuelPrice: '3.80', passengers: '1' },
        result: 'Gallons needed = 2,900 / 10 = 290 gallons. Total fuel cost = 290 x $3.80 = $1,102.00. Cost per 100 miles = $38.00.',
        insight: 'A cross-country move in a rental truck (Penske, U-Haul) is fuel-intensive. The 2,900-mile NYC to SF route at 10 MPG consumes 290 gallons at a cost of over $1,100. This is a major line item in any moving budget, and it is purely the fuel cost -- it does not include the truck rental fee (typically $1,500-$3,000 for a one-way), insurance, tolls ($50-$150), or lodging for the 5-7 day drive. A 26-foot truck loaded to near its weight limit may achieve only 6-8 MPG (instead of the 10 MPG assumed here), which would push the fuel cost to $1,377-$1,835. Consider alternatives: (a) a moving container service (PODS, U-Pack) where the transport is handled by a carrier at fleet fuel efficiency rates, (b) selling large furniture and re-buying at the destination -- the fuel cost alone may exceed the value of some furniture items, or (c) shipping non-essential items via freight (LTL -- less than truckload) and driving only your personal vehicle.',
      },
      {
        scenario: 'Suburban Daily Commute Annual Cost: 45-Mile Round Trip',
        inputs: { distance: '45', distanceUnit: 'miles', fuelEfficiency: '32', efficiencyUnit: 'mpg', fuelPrice: '3.50', passengers: '1' },
        result: 'Gallons per day = 45 / 32 = 1.406 gallons. Daily fuel cost = 1.406 x $3.50 = $4.92. Annual fuel cost (240 commute days) = $4.92 x 240 = $1,180.80. Monthly = $98.40.',
        insight: 'The true annual cost of commuting is often underestimated because the daily fuel cost ($4.92) feels small. But multiplied by 240 work days, it becomes nearly $1,200 per year -- and fuel is only one component. Adding vehicle depreciation at the IRS rate of ~$0.655/mile for the 10,800 annual commute miles yields approximately $7,074 in total vehicle costs for commuting alone. Switching to a hybrid or EV for this commute: a Prius at 52 MPG combined would reduce annual fuel cost to $727 -- a savings of $454 per year. A Tesla Model 3 at 4 miles/kWh and $0.14/kWh home charging would cost approximately $378 per year in electricity -- a savings of $803 per year vs. the 32 MPG gas car. Over a 5-year period, the fuel savings of an EV for this commute exceed $4,000.',
      },
    ],
    proTips: [
      'Check tire pressure before every long trip. Under-inflated tires increase rolling resistance and can reduce MPG by 3-5%. The correct pressure is listed on the sticker in your driver\'s door jamb (NOT the maximum pressure on the tire sidewall). Check pressure when the tires are cold (before driving) for an accurate reading. A typical sedan loses 1-2 PSI per month through normal permeation.',
      'Use cruise control on flat highways but not on hilly terrain. On flat roads, cruise control eliminates the small speed fluctuations of human throttle control that waste fuel -- tests show a 5-10% improvement in MPG. On hills, however, cruise control aggressively applies throttle to maintain speed on the uphill and may downshift unnecessarily, hurting efficiency. On hilly terrain, a technique called "driving with load" (allowing the car to slow slightly uphill and regain speed downhill) is more efficient.',
      'Remove roof racks, cargo boxes, and bike racks when not in use. An empty roof rack reduces highway fuel economy by 5-8% due to aerodynamic drag. A loaded cargo box can reduce MPG by 15-25%. If you need cargo capacity, a rear hitch-mounted carrier has less aero penalty. Over 1,000 highway miles at 30 MPG and $3.50/gallon, removing an empty roof rack saves approximately $7-$11 in fuel -- which adds up over a year of road trips.',
      'Use apps to find the cheapest fuel on your route. GasBuddy, Waze, and Google Maps all show real-time fuel prices at stations along your route. The price difference between the most and least expensive station within a 5-mile radius is often $0.50-$1.00 per gallon. On a 300-mile trip consuming 12 gallons, finding a station at $3.20 instead of $3.80 saves $7.20. For cross-country trips, GasBuddy\'s trip cost calculator can plan your fuel stops at the cheapest stations on your route. Also consider fuel rewards programs: many grocery chains (Kroger, Safeway) offer $0.10-$1.00 per gallon discounts with accumulated points.',
      'Plan fuel stops strategically in rural and remote areas. In the western US (Nevada, Utah, Wyoming, Montana), fuel stations can be 50-100 miles apart. Do not let your tank drop below 1/4 in these areas -- if a station is unexpectedly closed, the next one may be beyond your remaining range. In remote areas of Canada and Australia, stations can be 150-200 miles apart. Carry a 2-5 gallon fuel can for remote travel (but store it outside the passenger compartment in a ventilated area).',
      'Consider the total cost per mile, not just fuel. The IRS standard mileage rate (approximately $0.655/mile in 2026) includes fuel, depreciation, maintenance, insurance, and tires. Fuel represents only about 25-35% of the total cost per mile for a typical vehicle. A trip that costs $58 in fuel actually costs approximately $160-$200 in all-in vehicle costs. This is relevant when deciding whether to drive vs. fly: a 500-mile trip may cost $58 in fuel but $328 in total vehicle costs, making a $200 flight the more economical choice.',
      'For European travel: fuel in most European countries costs 2-4x more than in the US due to higher fuel taxes. France, Germany, and Italy typically have diesel/petrol at EUR 1.50-EUR 2.00 per liter (approximately $6.00-$8.00 per US gallon). Factor this into car rental decisions: renting a diesel vehicle (which typically gets 20-30% better fuel economy than a petrol equivalent) can save significantly on a multi-country road trip. Also note that many European countries require a vignette (toll sticker) for highway use, sold at border crossings and petrol stations for approximately EUR 10-EUR 35 for 10 days of use.',
    ],
    limitations: [
      'This calculator assumes flat terrain and constant-speed highway driving at the vehicle\'s rated highway MPG. Real-world fuel economy on a trip with elevation changes, city driving segments, and varying speeds can differ by 10-25% from the estimate. For mountain driving (e.g., crossing the Rockies or the Alps), fuel consumption can increase by 25-40% due to steep grades. Use your actual observed highway MPG (from your trip computer or manual calculation) rather than the EPA rating for more accurate estimates.',
      'Wind and weather are not accounted for. A strong headwind of 20 mph effectively adds 20 mph to your aerodynamic drag, reducing MPG by 10-20%. Conversely, a tailwind improves MPG by a similar amount. Cold weather reduces fuel economy by 10-20% in gasoline vehicles (cold engines run rich, cold air is denser, and winter fuel blends have lower energy content). Driving in rain or snow adds rolling resistance from water on the road surface, reducing MPG by 5-10%. For trips in severe conditions, add 15-25% to the estimated fuel cost.',
      'City vs. highway split is not modeled. This calculator uses a single fuel efficiency number for the entire trip. Most trips involve a mix of city and highway driving -- a trip that is 20% city and 80% highway will have a blended MPG between the city and highway ratings. If your vehicle is rated at 22 city / 32 highway, a trip with 20% city driving will likely achieve about 29-30 MPG blended, not the full 32 highway rating. For precise estimates, estimate the city mileage percentage and use a weighted average MPG.',
      'Traffic, idling, and detours are not included. Stop-and-go traffic can reduce MPG by 30-50% compared to free-flowing highway driving. A traffic jam adding 1 hour of stop-and-go driving to a trip can increase fuel consumption by 0.5-1.5 gallons (depending on the vehicle and AC usage). Construction detours can add 5-20% to your total distance. Always check traffic conditions (Google Maps, Waze) before departure and factor in a 5-10% contingency for unexpected detours.',
      'Fuel price variation along the route is not modeled. Fuel prices can vary by $0.50-$1.50 per gallon within a single US state and by $2.00-$3.00 per gallon across state lines. A trip from California ($5.00/gallon) to Nevada ($3.50/gallon) will have significantly different fuel costs depending on where you fill up. Fill up in the cheaper state when possible, and use GasBuddy\'s trip planner to identify the cheapest fuel stops on your route.',
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
      { label: 'IRS mileage rate (2026)', value: '~$0.655/mile' },
      { label: 'Typical compact car highway MPG', value: '32-42 MPG' },
      { label: 'Typical midsize sedan highway MPG', value: '28-38 MPG' },
      { label: 'Typical SUV highway MPG', value: '22-30 MPG' },
      { label: 'Typical pickup truck highway MPG', value: '18-25 MPG' },
      { label: 'Typical RV / motorhome MPG', value: '8-12 MPG' },
    ],
    citations: [
      { source: 'EPA Fuel Economy', url: 'https://www.fueleconomy.gov/' },
      { source: 'U.S. Energy Information Administration -- Gasoline and Diesel Fuel Update', url: 'https://www.eia.gov/petroleum/gasdiesel/' },
      { source: 'SAE J2263 -- Road Load Measurement Using Onboard Anemometry and Coastdown Techniques', url: 'https://www.sae.org/standards/content/j2263/' },
      { source: 'IRS Standard Mileage Rates', url: 'https://www.irs.gov/tax-professionals/standard-mileage-rates' },
    ],
  },
};

export default tripFuelCostConfig;
