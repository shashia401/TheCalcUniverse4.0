import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import FuelCostPanel from './FuelCostPanel';

const KM_TO_MI = 0.621371;
const L100_TO_MPG = 235.214;
const KML_TO_MPG = 2.35214;
const GAL_TO_L = 3.78541;
const CO2_GAS = 19.6;
const CO2_DIESEL = 22.5;

const fuelCostConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'distance',
      label: 'Distance',
      type: 'number',
      step: 0.1,
      min: 0,
      placeholder: 'e.g., 300',
    },
    {
      id: 'distanceUnit',
      label: 'Distance Unit',
      type: 'select',
      options: [
        { label: 'Miles', value: 'mi' },
        { label: 'Kilometers', value: 'km' },
      ],
    },
    {
      id: 'fuelEfficiency',
      label: 'Fuel Efficiency',
      type: 'number',
      step: 0.1,
      min: 0,
      placeholder: 'e.g., 25',
    },
    {
      id: 'efficiencyUnit',
      label: 'Efficiency Unit',
      type: 'select',
      options: [
        { label: 'MPG (US)', value: 'mpg' },
        { label: 'L/100km', value: 'l100' },
        { label: 'km/L', value: 'kml' },
      ],
    },
    {
      id: 'fuelPrice',
      label: 'Fuel Price',
      type: 'number',
      step: 0.01,
      min: 0,
      placeholder: 'e.g., 3.50',
    },
    {
      id: 'priceUnit',
      label: 'Price Per',
      type: 'select',
      options: [
        { label: '$ per Gallon', value: 'gallon' },
        { label: '$ per Liter', value: 'liter' },
      ],
    },
    {
      id: 'vehicleType',
      label: 'Vehicle Type',
      type: 'select',
      options: [
        { label: 'Gasoline', value: 'gas' },
        { label: 'Diesel', value: 'diesel' },
        { label: 'Electric (EV)', value: 'ev' },
        { label: 'Plug-in Hybrid (PHEV)', value: 'phev' },
      ],
    },
    {
      id: 'evEfficiency',
      label: 'EV Efficiency',
      type: 'number',
      step: 0.1,
      min: 0,
      placeholder: 'e.g., 3.5',
      helpText: 'miles per kWh (for EV/PHEV)',
      showWhen: (v) => v.vehicleType === 'ev' || v.vehicleType === 'phev',
    },
    {
      id: 'evRange',
      label: 'EV Range (miles)',
      type: 'number',
      step: 0.1,
      min: 0,
      placeholder: 'e.g., 40',
      helpText: 'Electric-only range (for PHEV)',
      showWhen: (v) => v.vehicleType === 'phev',
    },
    {
      id: 'electricityRate',
      label: 'Electricity Rate',
      type: 'number',
      step: 0.001,
      min: 0,
      placeholder: 'e.g., 0.13',
      helpText: '$ per kWh',
      showWhen: (v) => v.vehicleType === 'ev' || v.vehicleType === 'phev',
    },
    {
      id: 'roundTrips',
      label: 'Round Trips',
      type: 'number',
      step: 1,
      min: 1,
      placeholder: '1',
    },
  ],
  calculate: (values) => {
    const distance = parseFloat(values.distance);
    const distanceUnit = values.distanceUnit || 'mi';
    const fuelEfficiency = parseFloat(values.fuelEfficiency);
    const efficiencyUnit = values.efficiencyUnit || 'mpg';
    const fuelPrice = parseFloat(values.fuelPrice);
    const priceUnit = values.priceUnit || 'gallon';
    const vehicleType = values.vehicleType || 'gas';
    const evEfficiency = parseFloat(values.evEfficiency);
    const evRange = parseFloat(values.evRange);
    const electricityRate = parseFloat(values.electricityRate);
    const roundTrips = parseFloat(values.roundTrips) || 1;

    if (isNaN(distance) || distance < 0) return [];
    if (roundTrips < 1) return [];

    if (vehicleType === 'gas' || vehicleType === 'diesel') {
      if (isNaN(fuelEfficiency) || fuelEfficiency <= 0) return [];
      if (isNaN(fuelPrice) || fuelPrice < 0) return [];
    }

    if (vehicleType === 'ev' || vehicleType === 'phev') {
      if (isNaN(evEfficiency) || evEfficiency <= 0) return [];
      if (isNaN(electricityRate) || electricityRate < 0) return [];
    }

    if (vehicleType === 'phev') {
      if (isNaN(fuelEfficiency) || fuelEfficiency <= 0) return [];
      if (isNaN(fuelPrice) || fuelPrice < 0) return [];
      if (isNaN(evRange) || evRange < 0) return [];
    }

    const distanceMi = distanceUnit === 'km' ? distance * KM_TO_MI : distance;

    let mpg = 0;
    if (vehicleType === 'gas' || vehicleType === 'diesel' || vehicleType === 'phev') {
      if (efficiencyUnit === 'l100') {
        mpg = fuelEfficiency > 0 ? L100_TO_MPG / fuelEfficiency : 0;
      } else if (efficiencyUnit === 'kml') {
        mpg = fuelEfficiency * KML_TO_MPG;
      } else {
        mpg = fuelEfficiency;
      }
    }

    const pricePerGallon = priceUnit === 'liter' ? fuelPrice * GAL_TO_L : fuelPrice;

    const fmt1 = (n: number) => n.toFixed(1);
    const fmtCurrency = (n: number) => `$${n.toFixed(2)}`;

    let totalCost = 0;
    let fuelNeededValue = '';
    let co2Lbs = 0;
    const co2Factor = vehicleType === 'diesel' ? CO2_DIESEL : CO2_GAS;

    if (vehicleType === 'gas' || vehicleType === 'diesel') {
      const fuelGal = distanceMi / mpg;
      const fuelLiters = fuelGal * GAL_TO_L;
      const cost = fuelGal * pricePerGallon;

      totalCost = cost * roundTrips;
      fuelNeededValue = priceUnit === 'liter'
        ? `${fmt1(fuelLiters)} liters`
        : `${fmt1(fuelGal)} gallons`;
      co2Lbs = fuelGal * co2Factor * roundTrips;
    } else if (vehicleType === 'ev') {
      const kwhNeeded = distanceMi / evEfficiency;
      const cost = kwhNeeded * electricityRate;

      totalCost = cost * roundTrips;
      fuelNeededValue = `${fmt1(kwhNeeded)} kWh`;
      co2Lbs = 0;
    } else if (vehicleType === 'phev') {
      let gasGal = 0;
      let evKwh = 0;

      if (evRange >= distanceMi) {
        evKwh = distanceMi / evEfficiency;
      } else {
        const gasDistance = distanceMi - evRange;
        gasGal = gasDistance / mpg;
        evKwh = evRange / evEfficiency;
      }

      const gasCost = gasGal * pricePerGallon;
      const evCost = evKwh * electricityRate;
      totalCost = (gasCost + evCost) * roundTrips;
      co2Lbs = gasGal * co2Factor * roundTrips;

      if (gasGal > 0 && evKwh > 0) {
        fuelNeededValue = `${fmt1(gasGal)} gallons + ${fmt1(evKwh)} kWh`;
      } else if (gasGal > 0) {
        fuelNeededValue = `${fmt1(gasGal)} gallons`;
      } else {
        fuelNeededValue = `${fmt1(evKwh)} kWh`;
      }
    }

    const costPerTrip = totalCost / roundTrips;
    const costPerMile = distanceMi * roundTrips > 0
      ? totalCost / (distanceMi * roundTrips)
      : 0;

    return [
      {
        id: 'totalCost',
        label: 'Total Fuel Cost',
        value: fmtCurrency(totalCost),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'costPerTrip',
        label: 'Cost Per Trip',
        value: fmtCurrency(costPerTrip),
      },
      {
        id: 'fuelNeeded',
        label: 'Fuel Needed',
        value: fuelNeededValue,
      },
      {
        id: 'co2Emissions',
        label: 'CO₂ Emissions',
        value: co2Lbs > 0 ? `${co2Lbs.toFixed(1)} lbs` : '0 lbs (electric)',
      },
      {
        id: 'costPerMile',
        label: 'Cost Per Mile',
        value: fmtCurrency(costPerMile),
      },
      {
        id: 'tripCount',
        label: 'Trips Calculated',
        value: String(roundTrips),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FuelCostPanel, { values, results });
  },
  educational: {
    formula: 'Total Cost = (Distance ÷ Fuel Efficiency) × Fuel Price × Round Trips',
    formulaDescription:
      'Calculate fuel costs for gasoline, diesel, electric, and plug-in hybrid vehicles with automatic unit conversion and CO₂ emissions estimation.',
    variables: [
      { symbol: 'D', name: 'Distance', description: 'Total travel distance in miles or kilometers.' },
      { symbol: 'FE', name: 'Fuel Efficiency', description: 'Vehicle efficiency in MPG, L/100km, or km/L.' },
      { symbol: 'P', name: 'Fuel Price', description: 'Cost per gallon or liter of fuel / cost per kWh for electricity.' },
      { symbol: 'RT', name: 'Round Trips', description: 'Number of round trips for total cost calculation.' },
    ],
    howToUse: [
      'Enter the distance you plan to travel and select miles or kilometers.',
      "Enter your vehicle's fuel efficiency and select the unit.",
      'Input the current fuel price or electricity rate.',
      'Select your vehicle type (Gas, Diesel, EV, or PHEV).',
      'For EV/PHEV, enter efficiency in miles per kWh and electricity rate.',
      'For PHEV, enter the electric-only range.',
      'Review total cost, fuel needed, CO₂ emissions, and cost breakdown.',
    ],
    explanation:
      'Fuel cost calculations help budget trips and compare vehicle types. For gas/diesel vehicles, the distance is divided by fuel efficiency to compute gallons needed, then multiplied by fuel price. For EVs, distance is divided by efficiency (mi/kWh) and multiplied by the electricity rate. Plug-in hybrids combine both: the electric range covers the first portion, and the gas engine handles the remainder. CO₂ emissions are estimated at 19.6 lbs/gallon for gasoline and 22.5 lbs/gallon for diesel, based on EPA standards. Practical example: a 500-mile road trip in a gas car getting 30 MPG with gas at $3.50/gallon. Fuel needed = 500 / 30 = 16.67 gallons. Fuel cost = 16.67 × $3.50 = $58.33. CO₂ emissions = 16.67 × 19.6 = 326.7 lbs. Compare with an EV getting 3.5 mi/kWh with electricity at $0.14/kWh: energy needed = 500 / 3.5 = 142.9 kWh, cost = 142.9 × $0.14 = $20.00, CO₂ = 0 lbs (tailpipe, though grid emissions vary). Compare with a PHEV with 40 miles electric range: first 40 miles on electric = 40 / 3.5 = 11.4 kWh costing $1.60, remaining 460 miles on gas = 460 / 30 = 15.33 gallons costing $53.67, total cost = $55.27. Edge cases: for trips in extreme cold (below freezing), EV range can drop by 30-40% because battery chemistry slows down and cabin heating consumes significant power. In these conditions, adjust EV efficiency downward by 30% for accurate cost estimates. For diesel vehicles, DEF (diesel exhaust fluid) adds a small additional cost — about $0.02-0.03 per mile. For gasoline direct injection (GDI) engines, actual fuel economy on short trips can be 20-30% worse than the EPA rating because the engine takes longer to reach operating temperature. For towing, fuel economy can drop by 40-60% depending on trailer weight and aerodynamics.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="20" y="30" width="130" height="100" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="8"/><text x="85" y="55" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="11" font-weight="bold">Gasoline Car</text><text x="85" y="70" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="10">30 MPG</text><line x1="30" y1="80" x2="140" y2="80" stroke="var(--svg-d1d5db)" stroke-width="1"/><text x="85" y="95" text-anchor="middle" fill="var(--svg-ef4444)" font-size="12" font-weight="bold">$58.33</text><text x="85" y="110" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">16.7 gal &amp;times; $3.50</text><text x="85" y="123" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">327 lbs CO&amp;sub2;</text><rect x="170" y="30" width="130" height="100" fill="var(--svg-d1fae5)" stroke="var(--svg-059669)" stroke-width="2" rx="8"/><text x="235" y="55" text-anchor="middle" fill="var(--svg-065f46)" font-size="11" font-weight="bold">Electric Vehicle</text><text x="235" y="70" text-anchor="middle" fill="var(--svg-065f46)" font-size="10">3.5 mi/kWh</text><line x1="180" y1="80" x2="290" y2="80" stroke="var(--svg-d1d5db)" stroke-width="1"/><text x="235" y="95" text-anchor="middle" fill="var(--svg-059669)" font-size="12" font-weight="bold">$20.00</text><text x="235" y="110" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">143 kWh &amp;times; $0.14</text><text x="235" y="123" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">0 lbs CO&amp;sub2;</text><line x1="75" y1="155" x2="245" y2="155" stroke="var(--svg-3b82f6)" stroke-width="2" stroke-dasharray="4"/><text x="160" y="148" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="10">500-mile trip comparison</text><text x="160" y="170" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">Savings: $38.33 per trip with EV</text><line x1="75" y1="178" x2="245" y2="178" stroke="var(--svg-3b82f6)" stroke-width="2" stroke-dasharray="4"/></svg>',
      alt: 'Side-by-side comparison of fuel costs for gasoline car and electric vehicle on a 500-mile trip',
      caption: 'Fuel cost comparison: gasoline car at $58.33 vs electric vehicle at $20.00 for a 500-mile trip.',
    },
    faqs: [
      {
        question: 'How do I convert L/100km to MPG?',
        answer: 'Divide 235.214 by the L/100km value. For example, 8 L/100km = 235.214 ÷ 8 = 29.4 MPG. The calculator handles this automatically.',
      },
      {
        question: 'How accurate is the CO₂ estimate?',
        answer: 'The estimate uses EPA standard factors: 19.6 lbs CO₂ per gallon of gasoline and 22.5 lbs per gallon of diesel. Actual emissions vary slightly based on fuel composition, driving conditions, and vehicle maintenance.',
      },
      {
        question: 'How do I calculate fuel costs for a PHEV?',
        answer: "Enter the vehicle's gas MPG, electric-only range, and EV efficiency (mi/kWh). The calculator determines whether your trip fits within the electric range or requires a gas-electric mix. If the trip is shorter than the EV range, it's calculated as pure electric.",
      },
      {
        question: 'What is the average electricity rate for EV charging?',
        answer: 'The US national average residential electricity rate is approximately $0.13/kWh, but rates vary by state from $0.08 to $0.33/kWh. Commercial charging stations may charge higher rates. Check your utility bill for your exact rate.',
      },
      {
        question: 'How do I calculate the break-even point between buying a gas car and an EV?',
        answer: 'To compare total ownership costs, factor in purchase price, fuel/energy costs, maintenance, and resale value. For fuel costs alone: calculate cost per mile for each vehicle. Example: a gas car getting 30 MPG at $3.50/gal costs $0.117/mile. An EV getting 3.5 mi/kWh at $0.14/kWh costs $0.04/mile. The EV saves $0.077/mile in fuel. If the EV costs $10,000 more upfront, the fuel-cost break-even is $10,000 / $0.077 = ~130,000 miles. However, EVs typically have lower maintenance costs (no oil changes, fewer brake replacements due to regenerative braking, no timing belts or exhaust systems) — estimated at $0.06/mile savings versus gas cars. With maintenance savings included, total savings per mile = $0.077 + $0.06 = $0.137/mile, reducing break-even to ~73,000 miles. For PHEVs, the calculation is more complex because the split between electric and gas driving varies by user. A PHEV with 40 miles of electric range driven 80% of miles on electric will achieve fuel and maintenance savings closer to an EV than a gas car. Federal tax credits up to $7,500 and state-level incentives can significantly improve the break-even calculation. Some states also offer reduced registration fees, HOV lane access, and reduced electricity rates for EV charging overnight.',
      },
    ],
    citations: [
      { source: 'U.S. Energy Information Administration - Gasoline Prices', url: 'https://www.eia.gov/petroleum/gasdiesel/' },
      { source: 'Wikipedia - Fuel Economy in Automobiles', url: 'https://en.wikipedia.org/wiki/Fuel_economy_in_automobiles' },
    ],
  },
};

export default fuelCostConfig;
