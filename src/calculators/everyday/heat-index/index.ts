import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HeatIndexPanel from './HeatIndexPanel';

function cToF(c: number): number {
  return (c * 9 / 5) + 32;
}

function heatIndex(Tf: number, RH: number): number {
  if (Tf < 80) return Tf;
  const HI = -42.379
    + 2.04901523 * Tf
    + 10.14333127 * RH
    - 0.22475541 * Tf * RH
    - 0.00683783 * Tf * Tf
    - 0.05481717 * RH * RH
    + 0.00122874 * Tf * Tf * RH
    + 0.00085282 * Tf * RH * RH
    - 0.00000199 * Tf * Tf * RH * RH;
  return HI;
}

function getDangerTier(hi: number): { label: string; color: string } {
  if (hi < 80) return { label: 'Safe', color: '#22c55e' };
  if (hi < 90) return { label: 'Caution', color: '#eab308' };
  if (hi < 103) return { label: 'Extreme Caution', color: '#f97316' };
  if (hi < 125) return { label: 'Danger', color: '#ef4444' };
  return { label: 'Extreme Danger', color: '#7c3aed' };
}

function getSafetyRecommendations(hi: number): string[] {
  if (hi < 80) return ['No heat-related precautions necessary.'];
  if (hi < 90) return [
    'Fatigue possible with prolonged exposure or physical activity.',
    'Stay hydrated and take breaks in the shade or air conditioning.',
  ];
  if (hi < 103) return [
    'Heat cramps and heat exhaustion possible.',
    'Limit strenuous outdoor activities to early morning or evening.',
    'Drink water frequently — do not wait until you are thirsty.',
    'Wear lightweight, light-colored, loose-fitting clothing.',
  ];
  if (hi < 125) return [
    'Heat cramps and heat exhaustion likely. Heatstroke possible.',
    'Avoid outdoor activities during midday heat.',
    'Schedule frequent rest breaks in air-conditioned environments.',
    'Watch for signs of heat exhaustion: heavy sweating, weakness, cold/clammy skin.',
    'Seek medical attention if symptoms worsen or persist.',
  ];
  return [
    'Heatstroke highly likely with continued exposure.',
    'DO NOT engage in outdoor activities.',
    'Stay in air-conditioned environments — fans alone are insufficient.',
    'Monitor for heatstroke symptoms: hot/dry skin, confusion, loss of consciousness.',
    'CALL 911 immediately if heatstroke is suspected.',
    'While waiting for help: move to a cool area, remove excess clothing, cool with water/ice.',
  ];
}

const heatIndexConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'temperature',
      label: 'Air Temperature',
      type: 'number',
      placeholder: '90',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the current air temperature. Switch between imperial (°F) and metric (°C) units using the selector below. The NOAA formula requires temperatures at or above 80°F.',
    },
    {
      id: 'tempUnit',
      label: 'Temperature Unit',
      type: 'select',
      options: [
        { value: 'F', label: '°F (Fahrenheit)' },
        { value: 'C', label: '°C (Celsius)' },
      ],
      defaultValue: 'F',
      required: true,
      helpText: 'Choose imperial (°F) or metric (°C) for the air temperature. The calculator auto-converts Celsius to Fahrenheit for the NOAA formula.',
    },
    {
      id: 'humidity',
      label: 'Relative Humidity (%)',
      type: 'number',
      placeholder: '60',
      min: 0,
      max: 100,
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      showWhen: (v) => parseFloat(v.temperature) >= 80,
      helpText: 'Enter the relative humidity percentage (0-100%). Humidity affects the bodys ability to cool through sweat evaporation.',
    },
  ],
  calculate: (values) => {
    const rawTemp = parseFloat(values.temperature);
    const tempUnit = values.tempUnit || 'F';
    let RH = parseFloat(values.humidity);

    if (isNaN(rawTemp)) return [];
    // When temperature is below 80°F, humidity input is hidden — treat missing humidity as 0
    // When temperature >= 80°F and humidity is missing, reject the calculation
    const Tf = tempUnit === 'C' ? cToF(rawTemp) : rawTemp;
    if (isNaN(RH)) {
      if (Tf >= 80) return [];
      RH = 0;
    }
    if (RH < 0 || RH > 100) return [];

    // Below 80°F, heat index equals actual temperature
    if (Tf < 80) {
      const danger = getDangerTier(Tf);
      const fmt = (n: number, d = 1) => parseFloat(n.toFixed(d)).toString();
      return [
        {
          id: 'heatIndex',
          label: 'Heat Index',
          value: `${fmt(Tf)}°F`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'heatIndexLabel',
          label: 'Feels Like',
          value: `${fmt(Tf)}°F (${danger.label})`,
          color: 'neutral' as const,
        },
        {
          id: 'temperature',
          label: 'Temperature',
          value: `${fmt(rawTemp)}°${tempUnit}`,
          color: 'neutral' as const,
        },
        {
          id: 'humidity',
          label: 'Relative Humidity',
          value: 'N/A',
          color: 'neutral' as const,
        },
        {
          id: 'dangerTier',
          label: 'Danger Tier',
          value: danger.label,
          color: 'positive' as const,
        },
        {
          id: 'safetyRecommendations',
          label: 'Safety Recommendations',
          value: getSafetyRecommendations(Tf).join(' | '),
          color: 'neutral' as const,
        },
        {
          id: '_chartData',
          label: '',
          value: JSON.stringify({
            heatIndex: Tf,
            temperature: Tf,
            humidity: 0,
            dangerTier: danger.label,
            dangerColor: danger.color,
            recommendations: getSafetyRecommendations(Tf),
          }),
        },
      ];
    }

    const hi = heatIndex(Tf, RH);
    const danger = getDangerTier(hi);
    const recommendations = getSafetyRecommendations(hi);

    const fmt = (n: number, d = 1) => parseFloat(n.toFixed(d)).toString();

    return [
      {
        id: 'heatIndex',
        label: 'Heat Index',
        value: `${fmt(hi)}°F`,
        highlight: true,
        color: hi >= 103 ? 'negative' as const : hi >= 90 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'heatIndexLabel',
        label: 'Feels Like',
        value: `${fmt(hi)}°F (${danger.label})`,
        color: 'neutral' as const,
      },
      {
        id: 'temperature',
        label: 'Temperature',
        value: `${fmt(Tf)}°F`,
        color: 'neutral' as const,
      },
      {
        id: 'humidity',
        label: 'Relative Humidity',
        value: `${fmt(RH)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'dangerTier',
        label: 'Danger Tier',
        value: danger.label,
        color: hi >= 125 ? 'negative' as const : hi >= 103 ? 'negative' as const : hi >= 90 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'safetyRecommendations',
        label: 'Safety Recommendations',
        value: recommendations.join(' | '),
        color: 'neutral' as const,
      },
      {
        id: '_chartData',
        label: '',
        value: JSON.stringify({
          heatIndex: hi,
          temperature: Tf,
          humidity: RH,
          dangerTier: danger.label,
          dangerColor: danger.color,
          recommendations,
        }),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HeatIndexPanel, { values, results });
  },
  educational: {
    formula: 'HI = −42.379 + 2.049T + 10.143R − 0.225TR − 0.00684T² − 0.0548R² + 0.00123T²R + 0.000853TR² − 0.00000199T²R²',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Heat Index &amp; Apparent Temperature</text><rect x="180" y="55" width="40" height="220" rx="5" fill="none" stroke="var(--svg-cccccc)" stroke-width="2"/><rect x="184" y="75" width="32" height="196" rx="3" fill="url(#hg)"/><circle cx="200" cy="275" r="20" fill="var(--svg-ef4444)" fill-opacity=".3" stroke="var(--svg-ef4444)" stroke-width="2"/><circle cx="200" cy="275" r="8" fill="var(--svg-ef4444)"/><text x="250" y="82" text-anchor="start" font-size="11" fill="var(--svg-ef4444)">Extreme Danger &gt; 130&deg;F</text><text x="250" y="112" text-anchor="start" font-size="11" fill="var(--svg-ef4444)">Danger: 105-129&deg;F</text><text x="250" y="155" text-anchor="start" font-size="11" fill="var(--svg-ef4444)">Extreme Caution: 90-104&deg;F</text><text x="250" y="200" text-anchor="start" font-size="11" fill="var(--svg-22c55e)">Caution: 80-90&deg;F</text><text x="250" y="250" text-anchor="start" font-size="11" fill="var(--svg-3b82f6)">Safe: below 80&deg;F</text><text x="220" y="330" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">HI = f(T, RH) &nbsp;|&nbsp; High humidity reduces sweat evaporation</text><defs><linearGradient id="hg" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#3b82f6"/><stop offset="30%" stop-color="#22c55e"/><stop offset="60%" stop-color="#ef4444"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs></svg>',
      alt: 'Thermometer with gradient from blue (safe) through green and red to purple (extreme danger) showing heat index categories',
      caption: 'The heat index combines temperature and humidity to measure how hot it actually feels',
    },
    formulaDescription:
      'The National Oceanic and Atmospheric Administration (NOAA) Heat Index formula, also known as the "apparent temperature," combines air temperature and relative humidity to determine how hot it actually feels to the human body. High humidity reduces the evaporation of sweat, impairing the bodys ability to cool itself. The formula was developed by R.G. Steadman in 1979 using a mathematical model of human thermoregulation with 13 variables including clothing, activity level, and sweat rate. NOAA adopted a simplified 2-variable version as a multiple regression fit to Steadman 1979 model for public heat safety warnings. The formula is most accurate between 80°F-110°F and 40%-80% humidity.',
    variables: [
      { symbol: 'T', name: 'Air Temperature', description: 'The actual air temperature in degrees Fahrenheit. The formula requires T ≥ 80°F for heat index computation.' },
      { symbol: 'R', name: 'Relative Humidity', description: 'The relative humidity percentage (0-100). Higher RH reduces sweat evaporation, making it feel hotter.' },
      { symbol: 'HI', name: 'Heat Index', description: 'The apparent temperature or "feels like" temperature in °F. This is what the human body perceives.' },
    ],
    howToUse: [
      'Select your preferred temperature unit — imperial (°F) or metric (°C). The calculator auto-converts Celsius values.',
      'Enter the current air temperature in your chosen unit.',
      'Enter the relative humidity percentage (0-100%). This field appears only when the temperature is at least 80°F, as the NOAA formula requires.',
      'The calculator applies the NOAA heat index formula to compute the feels-like temperature.',
      'Review the danger tier and safety recommendations for your heat index value.',
      'Add 10-15°F to the result if you are in direct sunlight, as the formula assumes shady conditions.',
    ],
    explanation:
      'The heat index (also called the apparent temperature) is what the temperature feels like to the human body when relative humidity is combined with the air temperature. When humidity is high, the evaporation of sweat from the skin slows down, making it harder for the body to cool itself. This can lead to heat-related illnesses ranging from mild heat cramps to life-threatening heatstroke. The NOAA heat index was developed for shady, light wind conditions — direct sunlight can increase the heat index by up to 15°F. The Occupational Safety and Health Administration (OSHA) uses the heat index to issue workplace safety guidelines that require rest breaks, water, and shade at specific thresholds. The National Weather Service issues heat advisories when the heat index reaches 105°F and excessive heat warnings at 110°F. The formula was developed by R.G. Steadman in 1979 using a physiological model that considered 13 variables; the simplified public version uses only temperature and humidity. The concept was invented in the late 20th century as public awareness of heat-related deaths grew. Above 130°F heat index, heatstroke is imminent with any prolonged exposure regardless of hydration or fitness level.',
    workedExamples: [
      {
        scenario: 'A landscaping crew in Houston at 98°F with 65% humidity. What is the heat index and what safety measures should their supervisor implement?',
        inputs: { temperature: '98', tempUnit: 'F', humidity: '65' },
        result: 'Heat index: 121°F — Danger tier. Direct sun: ~135°F.',
        insight: 'At 121°F heat index (Danger tier), OSHA requires outdoor workers to take 15-minute rest breaks in shade every hour, drink 4 cups of water per hour, and use a buddy system. The supervisor should start work at 6 AM and end by noon, with cooling towels and a shade tent. Direct sun would push this to ~135°F effective (Extreme Danger) — outdoor work must stop if the site is unshaded.',
      },
      {
        scenario: 'A youth soccer tournament in Atlanta at 92°F with 70% humidity at noon. Should the games proceed?',
        inputs: { temperature: '92', tempUnit: 'F', humidity: '70' },
        result: 'Heat index: 108°F — Danger tier. Direct sun: ~118°F.',
        insight: 'At 108°F heat index (Danger tier), youth sports are dangerous. The American Academy of Pediatrics recommends canceling practices and games when the heat index exceeds 105°F for children. Adding 10°F for direct sun brings the effective temperature to 118°F. The tournament director should implement mandatory water breaks every 15 minutes, provide cooling tents with misters, and have an athletic trainer on-site with ice baths for rapid cooling if heat illness occurs.',
      },
      {
        scenario: 'An outdoor worker in Phoenix at 105°F with only 15% humidity vs. Miami at 95°F with 80% humidity. Which is more dangerous?',
        inputs: { temperature: '105', tempUnit: 'F', humidity: '15' },
        result: 'Heat index: 100°F — Extreme Caution. Dry heat is more survivable.',
        insight: 'Humidity dominates the heat index. The "dry heat" at 105°F produces a lower heat index than the humid 95°F because the body can cool through sweat evaporation in dry conditions. At 133°F, conditions are in the Extreme Danger tier — heatstroke is highly likely. This is why the American Southwests heat is more survivable than the Southeasts, and why air conditioning (which dehumidifies) is life-saving in humid climates.',
      },
    ],
    proTips: [
      'Humidity matters more than temperature above 90°F. A 5% increase in relative humidity can raise the heat index by 3-7°F, while a 1°F temperature change typically only affects the heat index by about 1-2°F.',
      'The heat index formula assumes light wind and shade. In direct sun, add 10-15°F. On a breezy day with wind above 10 mph, subtract 5-10°F from the calculated value because wind aids evaporative cooling.',
      'OSHA requirement of "rule of 20%": when the heat index exceeds 85°F, new workers should spend only 20% of their first day doing heavy work in heat, increasing by 20% each subsequent day. Full heat acclimatization takes 1-2 weeks.',
      'Do not rely on fans alone when the heat index exceeds 95°F. At high temperatures, fans actually heat the body by convection (like a convection oven). Use air conditioning, cool showers, or cool compresses instead.',
      'Check urine color: pale yellow = well hydrated, dark yellow/amber = dehydrated. By the time you feel thirsty, you are already 1-2% dehydrated, reducing physical work capacity by 10-20%.',
    ],
    limitations: [
      'When not to use: For workplace heat safety compliance requiring WBGT (Wet-Bulb Globe Temperature) per ISO 7243 or ACGIH standards, use a WBGT meter — the heat index is a screening tool only. For sports medicine decisions involving exertional heat illness risk during intense exercise, WBGT is the gold standard.',
      'The NOAA heat index formula was developed for shady, light wind conditions at sea level. Direct sun adds 10-15°F, and high altitude (above 5,000 feet) reduces the effective heat index due to thinner air and faster sweat evaporation.',
      'The formula is validated for temperatures between 80°F and 110°F with humidity between 40% and 80%. Outside these ranges, calculated values become less accurate. Below 80°F, heat index equals the actual temperature.',
      'Heat index does not account for personal factors: age (older adults and infants are more susceptible), medications (antihistamines, diuretics, beta blockers impair thermoregulation), obesity, and acclimatization status.',
      'The formula assumes light clothing and at rest. Physical activity increases metabolic heat production by 5-15 times resting rate, effectively adding 5-15°F to the perceived heat load on the body.',
    ],
    quickReference: [
      { label: '80°F + 40% humidity', value: '80°F (safe)' },
      { label: '85°F + 60% humidity', value: '90°F (caution)' },
      { label: '90°F + 55% humidity', value: '96°F (caution)' },
      { label: '92°F + 65% humidity', value: '105°F (danger)' },
      { label: '96°F + 60% humidity', value: '114°F (danger)' },
      { label: '100°F + 55% humidity', value: '124°F (danger)' },
      { label: '102°F + 60% humidity', value: '133°F (extreme danger)' },
      { label: '105°F + 20% humidity', value: '104°F (extreme caution)' },
    ],
    commonUses: [
      'Outdoor workplace safety — OSHA compliance officers and site supervisors use heat index to schedule mandatory water, rest, and shade breaks for construction, agriculture, and warehouse workers.',
      'Athletic and school event planning — coaches and school administrators use heat index thresholds to decide whether to modify, postpone, or cancel outdoor practices and games.',
      'Community event safety — festival organizers and emergency management officials monitor heat index forecasts for cooling center and EMS resource planning.',
      'Personal outdoor activity planning — hikers, runners, and outdoor enthusiasts check the heat index to choose appropriate clothing, hydration, and whether to exercise indoors.',
      'Military training risk management — the U.S. military uses heat index and WBGT to set work/rest cycles and hydration requirements during basic training and field exercises.',
    ],
    faqs: [
      {
        question: 'Why does humidity make it feel hotter?',
        answer: 'Your body cools itself primarily through the evaporation of sweat. Each gram of sweat that evaporates from your skin removes about 580 calories of heat. When humidity is high, the air already contains significant moisture, which slows the evaporation rate. This impairs your bodys primary cooling mechanism, making you feel hotter than the actual air temperature. At 100% humidity, sweat cannot evaporate at all and simply drips off without providing any cooling benefit.',
      },
      {
        question: 'Does the heat index account for direct sunlight?',
        answer: 'No. The NOAA heat index assumes shady conditions with light wind. Direct sunlight can increase the apparent temperature by up to 15°F because solar radiation adds a radiative heat load to the body. Reflective surfaces like concrete, asphalt, and sand can increase solar radiation exposure by 20-50% beyond the direct sun level. Always add 10-15°F to the calculated heat index for sunny conditions.',
      },
      {
        question: 'What is the difference between heat index and wet-bulb globe temperature?',
        answer: 'The heat index considers only temperature and humidity. The Wet-Bulb Globe Temperature (WBGT) is a more comprehensive measure used by the U.S. military, OSHA, and athletic organizations that also accounts for solar radiation (black globe temperature), wind speed, and ambient temperature. WBGT = 0.7×Tw + 0.2×Tg + 0.1×Td. WBGT is the gold standard for assessing heat stress during physical activity but requires specialized instruments — the heat index is a practical public approximation using commonly available weather data.',
      },
      {
        question: 'When should I call 911 for heat-related illness?',
        answer: 'Call 911 immediately if someone shows signs of heatstroke: hot, red, dry skin (no sweating despite heat); body temperature above 103°F; rapid, strong pulse; confusion, altered mental state, or slurred speech; dizziness or fainting; nausea and vomiting; or loss of consciousness. Heatstroke has a 10-50% mortality rate even with treatment. While waiting for EMS: move the person to shade or AC, remove excess clothing, apply ice packs to neck, armpits, and groin (major blood vessels near skin surface), and cool with water. Do NOT give fluids if the person is confused or unconscious.',
      },
      {
        question: 'How does the heat index affect children and the elderly differently?',
        answer: 'Infants and children under 4 are at highest risk because they have a higher surface-area-to-body-mass ratio (absorbing more environmental heat), produce more metabolic heat per pound during activity, and have immature thermoregulatory systems. Older adults (65+) are the second highest-risk group because their sweat glands become less effective with age, they often take medications that impair thermoregulation (beta blockers, diuretics, antihistamines), and they may have reduced thirst sensation. For both groups, heat index as low as 90°F can be dangerous. Never leave children or pets in parked cars — on a 90°F day, interior temperature reaches 138°F within 60 minutes.',
      },
      {
        question: 'Can you acclimatize to high heat index conditions?',
        answer: 'Yes, the human body undergoes physiological adaptations to heat over 7-14 days of repeated exposure. This includes: increased sweat rate (up to 3 liters/hour vs. 1.5 liters/hour unacclimatized), earlier onset of sweating at lower core temperatures, reduced sodium concentration in sweat, expanded blood plasma volume, and reduced heart rate at a given workload. OSHA recommends a "20% rule" for new outdoor workers: spend only 20% of day 1 doing heavy work in heat, increasing by 20% per day over 5 days.',
      },
      {
        question: 'Why are nighttime heat index values just as dangerous during a heat wave?',
        answer: 'Nighttime heat index values above 80°F prevent the body from recovering from daytime heat stress, causing a cumulative heat load that becomes increasingly dangerous over consecutive days. Heat wave mortality peaks on days 3-5, not day 1, because the body cannot dissipate accumulated heat overnight. Urban heat island effects keep nighttime temperatures 5-10°F higher than surrounding rural areas due to heat stored in concrete and asphalt. For people without AC, use damp sheets (evaporative cooling), cool showers before bed, and a bowl of ice in front of a fan.',
      },
    ],
    citations: [
      { source: 'NOAA - Heat Index', url: 'https://www.weather.gov/ama/heatindex' },
      { source: 'Wikipedia - Heat Index', url: 'https://en.wikipedia.org/wiki/Heat_index' },
      { source: 'OSHA - Heat Illness Prevention', url: 'https://www.osha.gov/heat-exposure' },
    ],
  },
};

export default heatIndexConfig;
