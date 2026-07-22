import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import GasMileagePanel from './GasMileagePanel';

function fmtCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
  const sym = symbols[currency] || '$';
  return `${sym}${amount.toFixed(2)}`;
}

const MPG_CONV = 235.215;
const MI_PER_KM = 0.621371;
const GAL_PER_L = 0.264172;
const L_PER_GAL = 3.78541;
const IMPERIAL_FACTOR = 1.20095;

const gasMileageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Input Method',
      type: 'select',
      defaultValue: 'distance',
      options: [
        { label: 'Two odometer readings', value: 'odometer' },
        { label: 'Trip distance', value: 'distance' },
      ],
      helpText: 'Choose how to enter your trip distance — use odometer readings for maximum accuracy or direct trip distance for quick estimates',
    },
    {
      id: 'odometerStart',
      label: 'Previous Odometer Reading',
      type: 'number',
      step: 0.1,
      min: 0,
      placeholder: 'e.g., 50000',
      showWhen: (v) => v.mode === 'odometer',
      helpText: 'Enter your previous odometer reading from your last fill-up receipt or log',
    },
    {
      id: 'odometerEnd',
      label: 'Current Odometer Reading',
      type: 'number',
      step: 0.1,
      min: 0,
      placeholder: 'e.g., 50500',
      showWhen: (v) => v.mode === 'odometer',
      helpText: 'Enter your current odometer reading — the difference from the start reading gives your trip distance',
    },
    {
      id: 'tripDistance',
      label: 'Trip Distance',
      type: 'number',
      step: 0.1,
      min: 0,
      placeholder: 'e.g., 300',
      defaultValue: '320',
      showWhen: (v) => v.mode === 'distance',
      helpText: 'Enter the distance traveled for this trip in your selected distance unit',
    },
    {
      id: 'distanceUnit',
      label: 'Distance Unit',
      type: 'select',
      defaultValue: 'mi',
      options: [
        { label: 'Miles', value: 'mi' },
        { label: 'Kilometers', value: 'km' },
      ],
      helpText: 'Select miles or kilometers as your distance unit — the calculator converts internally for consistent MPG calculations',
    },
    {
      id: 'fuelAdded',
      label: 'Fuel Added',
      type: 'number',
      step: 0.01,
      min: 0,
      placeholder: 'e.g., 12.5',
      defaultValue: '12.5',
      helpText: 'Enter the amount of fuel added to fill the tank — use the exact amount from your pump receipt for the most accurate calculation',
    },
    {
      id: 'fuelUnit',
      label: 'Fuel Unit',
      type: 'select',
      defaultValue: 'gal',
      options: [
        { label: 'Gallons (US)', value: 'gal' },
        { label: 'Liters', value: 'L' },
      ],
      helpText: 'Select gallons or liters as your fuel unit — results display in the corresponding MPG or L/100km format',
    },
    {
      id: 'pricePerUnit',
      label: 'Price per Gallon/Liter',
      type: 'number',
      step: 0.001,
      min: 0,
      placeholder: 'e.g., 3.50',
      defaultValue: '3.50',
      helpText: 'Enter the fuel price to see cost-per-mile analysis, annual fuel cost projection, and trip expense estimates',
    },
    {
      id: 'priceCurrency',
      label: 'Currency',
      type: 'select',
      defaultValue: 'USD',
      options: [
        { label: '$ (USD)', value: 'USD' },
        { label: '€ (EUR)', value: 'EUR' },
        { label: '£ (GBP)', value: 'GBP' },
      ],
      helpText: 'Select the currency for cost calculations — choose the one matching your local fuel prices',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'odometer';
    const distanceUnit = values.distanceUnit || 'mi';
    const fuelUnit = values.fuelUnit || 'gal';
    const priceCurrency = values.priceCurrency || 'USD';
    const fuelAdded = parseFloat(values.fuelAdded);
    const pricePerUnit = parseFloat(values.pricePerUnit);

    if (isNaN(fuelAdded) || fuelAdded <= 0) return [];

    let distanceRaw = 0;
    if (mode === 'odometer') {
      const start = parseFloat(values.odometerStart);
      const end = parseFloat(values.odometerEnd);
      if (isNaN(start) || isNaN(end)) return [];
      distanceRaw = end - start;
    } else {
      const trip = parseFloat(values.tripDistance);
      if (isNaN(trip)) return [];
      distanceRaw = trip;
    }

    if (distanceRaw <= 0) return [];

    const distanceDisplayUnit = distanceUnit === 'mi' ? 'miles' : 'km';
    const distanceDisplay = `${distanceRaw.toFixed(1)} ${distanceDisplayUnit}`;

    const miles = distanceUnit === 'km' ? distanceRaw * MI_PER_KM : distanceRaw;
    const gallons = fuelUnit === 'L' ? fuelAdded * GAL_PER_L : fuelAdded;

    const mpg = miles / gallons;
    const l100km = MPG_CONV / mpg;

    const fuelDisplay = fuelUnit === 'gal'
      ? `${fuelAdded.toFixed(2)} gallons`
      : `${fuelAdded.toFixed(2)} L`;

    const results: Array<{
      id: string;
      label: string;
      value: string;
      highlight?: boolean;
      color?: 'positive' | 'negative' | 'neutral';
    }> = [];

    const primaryLabel = fuelUnit === 'gal' ? 'Fuel Economy (MPG)' : 'Fuel Economy (L/100km)';
    results.push({
      id: 'fuelEconomy',
      label: primaryLabel,
      value: fuelUnit === 'gal' ? `${mpg.toFixed(1)} MPG` : `${l100km.toFixed(1)} L/100km`,
      highlight: true,
      color: 'positive',
    });
    results.push({
      id: 'mpg',
      label: 'MPG',
      value: `${mpg.toFixed(1)} MPG`,
    });
    results.push({
      id: 'l100km',
      label: 'L/100km',
      value: `${l100km.toFixed(1)} L/100km`,
    });

    if (fuelUnit === 'gal') {
      const mpgImperial = mpg * IMPERIAL_FACTOR;
      results.push({
        id: 'mpgImperial',
        label: 'MPG (Imperial)',
        value: `${mpgImperial.toFixed(1)} MPG (Imp)`,
      });
    }

    results.push({
      id: 'distance',
      label: 'Trip Distance',
      value: distanceDisplay,
    });

    results.push({
      id: 'fuelUsed',
      label: 'Fuel Used',
      value: fuelDisplay,
    });

    if (!isNaN(pricePerUnit) && pricePerUnit > 0) {
      const pricePerGallon = fuelUnit === 'L' ? pricePerUnit * L_PER_GAL : pricePerUnit;
      const costPerMile = distanceRaw > 0 ? (gallons * pricePerGallon) / miles : 0;
      const costPer100 = costPerMile * 100;
      const annualMiles = 12000;
      const annualCost = costPerMile * annualMiles;

      results.push({
        id: 'costPerMile',
        label: 'Cost Per Mile',
        value: `${fmtCurrency(costPerMile, priceCurrency)}/mile`,
      });

      results.push({
        id: 'costPer100',
        label: 'Cost per 100 miles',
        value: fmtCurrency(costPer100, priceCurrency),
      });

      results.push({
        id: 'annualCost',
        label: 'Annual Fuel Cost',
        value: `At 12,000 mi/year: ${fmtCurrency(annualCost, priceCurrency)}`,
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GasMileagePanel, { values, results });
  },
  educational: {
    formula: 'MPG = Miles ÷ Gallons | L/100km = 235.215 ÷ MPG',
    formulaDescription:
      'Fuel economy measures how efficiently a vehicle uses fuel. MPG (miles per gallon) is the US standard calculated by dividing total miles traveled by gallons consumed. L/100km (liters per 100 kilometers) is used internationally and is calculated by dividing 235.215 by the MPG value. Lower L/100km means better efficiency. The imperial gallon (used in the UK and Canada) is 1.201 times larger than the US gallon, so Imperial MPG = US MPG × 1.201. For cost analysis, the cost per mile equals total fuel cost divided by miles driven, and annual fuel cost is estimated at 12,000 miles per year multiplied by the cost per mile.',
    variables: [
      { symbol: 'D', name: 'Distance', description: 'Distance traveled between fill-ups, entered in miles or kilometers depending on your preference.' },
      { symbol: 'F', name: 'Fuel Amount', description: 'Fuel consumed during the trip in gallons or liters, measured at the pump during your fill-up.' },
      { symbol: 'MPG', name: 'Miles Per Gallon', description: 'Distance per unit of fuel. Higher is better. The standard US measure of vehicle fuel efficiency.' },
      { symbol: 'L/100km', name: 'Liters per 100 km', description: 'Fuel needed to travel 100 km. Lower is better. The international standard for fuel consumption.' },
    ],
    howToUse: [
      'Choose between odometer readings or direct trip distance entry for your input method.',
      'Enter your odometer readings (start and end) or the trip distance you traveled.',
      'Enter the exact amount of fuel added from your pump receipt.',
      'Select your preferred distance and fuel units (mi/gal or km/L).',
      'Optionally enter the fuel price for detailed cost-per-mile and annual projection analysis.',
      'Review your fuel economy, unit conversions, cost breakdown, and efficiency rating.',
    ],
    workedExamples: [
      {
        scenario: 'Tom drives 320 miles between fill-ups and pumps 12.5 gallons of regular gas at $3.50/gallon. He wants to track his car\'s fuel economy over time.',
        inputs: { mode: 'distance', tripDistance: '320', distanceUnit: 'mi', fuelAdded: '12.5', fuelUnit: 'gal', pricePerUnit: '3.50' },
        result: '25.6 MPG — 9.2 L/100km — $0.137/mile — $1,641 annual fuel cost',
        insight: 'Tom\'s 25.6 MPG is in the "Good" range for a midsize sedan. At current gas prices, every mile costs about 14 cents. Over a year of typical driving, fuel costs total over $1,600 — a good reminder to keep tires properly inflated and avoid aggressive driving.',
      },
      {
        scenario: 'Elena drives 450 km in Europe and fills 42 liters of diesel at €1.65/L. She wants her fuel economy in both L/100km and MPG to compare with a US-based car review.',
        inputs: { mode: 'distance', tripDistance: '450', distanceUnit: 'km', fuelAdded: '42', fuelUnit: 'L', pricePerUnit: '1.65', priceCurrency: 'EUR' },
        result: '9.3 L/100km — 25.2 MPG — €0.154/km — €1,848 annual fuel cost',
        insight: 'At 9.3 L/100km, Elena\'s diesel car gets reasonable efficiency. The MPG equivalent of 25.2 helps her compare with US reviews. Note that imperial MPG would be 30.3 — a common confusion when reading UK car reviews that use the larger imperial gallon.',
      },
    ],
    proTips: [
      'For the most accurate fuel economy tracking, always fill up at the same pump and let it auto-shutoff. Different pumps may shut off at different levels, skewing your MPG by 2-5%.',
      'Temperature affects fuel density: gasoline pumped on a hot day contains less energy per gallon because it expands. A 20°F temperature difference can change actual fuel volume by about 1%.',
      'Track your MPG over at least 3-5 fill-ups for a reliable average. Single-tank readings can vary by 10% or more due to driving conditions, pump differences, and whether you did mostly highway or city driving.',
      'For hybrid vehicles, MPG displays can be misleading — short trips using mostly electric power show very high MPG, while highway trips may be lower. Track over longer periods for a realistic picture.',
      'When comparing international car specs, always check whether MPG ratings use US or Imperial gallons. A UK review claiming 48 MPG is only about 40 MPG in US gallons — a significant difference.',
    ],
    limitations: [
      'This calculator provides estimates based on the values entered. Real-world fuel economy varies based on driving conditions, speed, weather, terrain, and vehicle load.',
      'The conversion between units uses standard conversion factors and may differ slightly from manufacturer specifications.',
      'For hybrid and electric vehicles, MPG-based calculations do not fully capture energy costs from electricity. For plug-in hybrids, a separate MPGe calculation is more appropriate.',
      'The annual fuel cost projection assumes 12,000 miles of driving at consistent fuel economy and prices — actual costs will vary with driving habits and fuel price fluctuations.',
    ],
    quickReference: [
      { label: '15 MPG (pickup truck)', value: '15.7 L/100km — 18.0 MPG Imp' },
      { label: '20 MPG (older SUV)', value: '11.8 L/100km — 24.0 MPG Imp' },
      { label: '25 MPG (family sedan)', value: '9.4 L/100km — 30.0 MPG Imp' },
      { label: '30 MPG (compact car)', value: '7.8 L/100km — 36.0 MPG Imp' },
      { label: '40 MPG (hybrid)', value: '5.9 L/100km — 48.0 MPG Imp' },
      { label: '50 MPG (Prius)', value: '4.7 L/100km — 60.0 MPG Imp' },
      { label: '100 mi at 25 MPG, $3.50/gal', value: '4 gal — $14.00 trip cost' },
      { label: '500 mi at 30 MPG, $3.50/gal', value: '16.7 gal — $58.33 trip cost' },
    ],
    explanation:
      'Fuel economy is calculated by dividing the distance traveled by the fuel consumed. For accurate results, fill your tank completely, reset your trip odometer, drive normally, then fill up again at the same pump. Use the exact gallons pumped and miles driven. To convert between MPG and L/100km: L/100km = 235.215 ÷ MPG. The imperial gallon (UK/Canada) is 1.201 times larger than the US gallon, so MPG(Imp) = MPG(US) × 1.201. Practical example: you drive 320 miles between fill-ups and pump 12.5 gallons. Your fuel economy is 320 / 12.5 = 25.6 MPG. In L/100km: 235.215 / 25.6 = 9.2 L/100km. In Imperial MPG: 25.6 × 1.201 = 30.7 MPG Imp. At $3.50/gallon, your cost per mile is (12.5 × $3.50) / 320 = $0.137/mile, your annual fuel cost at 12,000 miles/year would be $1,644. Edge cases: for accurate MPG tracking, always use the same pump and fill to the same automatic shutoff point — different pumps may shut off at different levels. Temperature affects fuel density: gasoline pumped on a hot day contains less energy per gallon because it expands. A 20°F temperature difference can change actual fuel volume by about 1%. For hybrid vehicles, MPG calculations can be misleading because the electric motor assists at low speeds, making short trips appear very efficient while highway MPG may be lower. For plug-in hybrids, MPGe (miles per gallon equivalent) is used: 1 gallon of gasoline = 33.7 kWh of electricity. If a PHEV travels 30 miles on electric (using 10 kWh) and 30 miles on gas (using 1 gallon), the effective MPGe = 60 / (10/33.7 + 1) = 60 / 1.297 = 46.3 MPGe. For EVs, efficiency is measured in miles per kWh (typically 3-4 mi/kWh for modern EVs) or kWh/100 miles.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><defs><marker id="ab" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-3b82f6)"/></marker></defs><rect x="40" y="25" width="100" height="60" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="8"/><text x="90" y="50" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="10" font-weight="bold">Distance</text><text x="90" y="65" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="11">320 miles</text><line x1="140" y1="55" x2="180" y2="55" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="160" y="48" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="10">&amp;divide;</text><rect x="180" y="25" width="100" height="60" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="2" rx="8"/><text x="230" y="50" text-anchor="middle" fill="var(--svg-991b1b)" font-size="10" font-weight="bold">Fuel</text><text x="230" y="65" text-anchor="middle" fill="var(--svg-991b1b)" font-size="11">12.5 gal</text><rect x="70" y="100" width="180" height="40" fill="var(--svg-d1fae5)" stroke="var(--svg-059669)" stroke-width="2" rx="8"/><text x="160" y="117" text-anchor="middle" fill="var(--svg-065f46)" font-size="12" font-weight="bold">25.6 MPG</text><text x="160" y="132" text-anchor="middle" fill="var(--svg-065f46)" font-size="10">320 mi &amp;divide; 12.5 gal</text><line x1="90" y1="140" x2="90" y2="155" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="230" y1="140" x2="230" y2="155" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="160" y="170" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">L/100km = 235.215 &amp;divide; 25.6 = 9.2</text><text x="160" y="185" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">Cost: (12.5 &amp;times; $3.50) &amp;divide; 320 = $0.137/mi</text></svg>',
      alt: 'Fuel economy calculation showing distance divided by fuel used equals MPG',
      caption: 'Fuel economy is calculated by dividing the distance traveled by the fuel consumed.',
    },
    faqs: [
      {
        question: 'How do I get the most accurate MPG measurement?',
        answer: 'Fill your tank completely, reset the trip odometer, drive normally for at least 100 miles, then fill up at the same pump. Divide the miles driven by the gallons pumped. Repeat over several tanks for a more accurate average.',
      },
      {
        question: 'What is a good MPG?',
        answer: 'For modern cars: 25-30 MPG is good, 35-40 MPG is very good, and 45+ MPG is excellent. SUVs and trucks typically get 15-25 MPG. Electric vehicles are measured in miles per kWh (typically 3-4 mi/kWh).',
      },
      {
        question: 'Why does my real-world MPG differ from the EPA rating?',
        answer: 'EPA ratings come from standardized lab tests. Real-world driving conditions like traffic, weather, terrain, speed, acceleration patterns, tire pressure, and cargo weight all affect fuel economy. It is normal to see 10-20% lower MPG than the EPA rating.',
      },
      {
        question: 'How do I convert MPG to L/100km?',
        answer: 'Divide 235.215 by the MPG value. For example, 30 MPG = 235.215 ÷ 30 = 7.84 L/100km. The calculator shows both units automatically and also provides the Imperial MPG conversion for UK/Canadian comparisons.',
      },
      {
        question: 'How do I track fuel economy for a plug-in hybrid (PHEV) accurately?',
        answer: 'PHEV tracking is more complex because the vehicle operates in three modes: all-electric, hybrid, and gas-only. The most accurate method is to track total miles driven divided by total gasoline consumed over at least 500-1,000 miles, treating the electric miles as "free" in terms of gas consumption. However, this inflates the apparent MPG. The EPA uses a blended metric: MPGe (miles per gallon equivalent), where 33.7 kWh of electricity is treated as one gallon-equivalent of energy. To calculate true energy cost: record the kWh of electricity consumed from charging plus the gallons of gasoline used. Then compute total energy cost = (kWh × electricity rate) + (gallons × gas price). Divide total miles by total cost for cost-per-mile, which is more useful than MPG for PHEV owners. For short daily commutes within the electric range, a PHEV might achieve 100+ MPGe, while on long highway trips running purely on gas, it achieves only the gas engine\'s MPG (typically 35-45 MPG for a Prius Prime). Many PHEV drivers find that their annual gas consumption is 70-90% less than a conventional car if they charge daily and drive fewer miles than the electric range each day.',
      },
    ],
    citations: [
      { source: 'EPA - Fuel Economy Guide', url: 'https://www.fueleconomy.gov/' },
      { source: 'Wikipedia - Fuel Economy in Automobiles', url: 'https://en.wikipedia.org/wiki/Fuel_economy_in_automobiles' },
    ],
  },
};

export default gasMileageConfig;
