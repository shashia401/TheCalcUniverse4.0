import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HeatIndexPanel from './HeatIndexPanel';

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
    'Drink water frequently — don\'t wait until you\'re thirsty.',
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
      label: 'Air Temperature (°F)',
      type: 'number',
      placeholder: '90',
      step: 0.1,
      required: true,
      helpText: 'The current air temperature in degrees Fahrenheit',
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
      helpText: 'The current relative humidity percentage (0-100%)',
    },
  ],
  calculate: (values) => {
    const Tf = parseFloat(values.temperature);
    const RH = parseFloat(values.humidity);

    if ([Tf, RH].some(isNaN) || RH < 0 || RH > 100) return [];

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
      {
        id: 'chartData',
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
      'The National Oceanic and Atmospheric Administration (NOAA) Heat Index formula, also known as the "apparent temperature," combines air temperature and relative humidity to determine how hot it actually feels to the human body. High humidity reduces the evaporation of sweat, impairing the body\'s ability to cool itself. The formula was developed by R.G. Steadman in 1979 and adopted by NOAA for public heat safety warnings.',
    variables: [
      { symbol: 'T', name: 'Air Temperature', description: 'The actual air temperature in degrees Fahrenheit.' },
      { symbol: 'R', name: 'Relative Humidity', description: 'The relative humidity percentage (0-100).' },
      { symbol: 'HI', name: 'Heat Index', description: 'The apparent temperature or "feels like" temperature in °F.' },
    ],
    howToUse: [
      'Enter the current air temperature in degrees Fahrenheit.',
      'Enter the relative humidity percentage (0-100%).',
      'The calculator applies the NOAA heat index formula to compute the feels-like temperature.',
      'Review the danger tier and safety recommendations for your heat index value.',
    ],
    explanation:
      'The heat index (also called the apparent temperature) is what the temperature feels like to the human body when relative humidity is combined with the air temperature. When humidity is high, the evaporation of sweat from the skin slows down, making it harder for the body to cool itself. This can lead to heat-related illnesses ranging from mild heat cramps to life-threatening heatstroke. The NOAA heat index was developed for shady, light wind conditions — direct sunlight can increase the heat index by up to 15°F. The Occupational Safety and Health Administration (OSHA) uses the heat index to issue workplace safety guidelines, and the National Weather Service issues heat advisories and warnings based on heat index thresholds. Practical example: on a summer day with air temperature of 92°F and relative humidity of 65%, the heat index calculation yields approximately 108°F. This falls in the "Danger" tier (103-124°F), meaning heat cramps and heat exhaustion are likely, and heatstroke is possible with prolonged exposure. At this level, OSHA recommends heavy work for no more than 20 minutes per hour with mandatory 15-minute rest breaks in shade or AC. Edge cases: the NOAA formula is valid only when the temperature is at least 80°F and the relative humidity is at least 40%. Below 80°F, the heat index equals the actual temperature because the humidity effect is negligible. For temperatures below 80°F but above 70°F with very high humidity (90%+), you may still feel uncomfortable, but the standard heat index formula was not designed for this range. For wet-bulb globe temperature (WBGT) measurements used by the military and athletic trainers, add 10°F for sunny conditions and account for wind speed. A reading of 90°F at 60% humidity gives a heat index of ~100°F, but in direct sun with no wind, the WBGT could be 105°F or higher. At 100°F with any humidity above 35%, the heat index exceeds 110°F — dangerously close to the heatstroke threshold.',
    faqs: [
      {
        question: 'Why does humidity make it feel hotter?',
        answer: 'Your body cools itself primarily through the evaporation of sweat. When humidity is high, the air already contains significant moisture, which slows the evaporation rate. This impairs your body\'s primary cooling mechanism, making you feel hotter than the actual air temperature. At 100% humidity, sweat cannot evaporate at all.',
      },
      {
        question: 'Does the heat index account for direct sunlight?',
        answer: 'No. The NOAA heat index assumes shady conditions with light wind. Direct sunlight can increase the apparent temperature by up to 15°F. On sunny days, it\'s recommended to add 10-15°F to the calculated heat index for an accurate feels-like temperature.',
      },
      {
        question: 'What is the difference between heat index and wet-bulb globe temperature?',
        answer: 'The heat index considers only temperature and humidity. The Wet-Bulb Globe Temperature (WBGT) is a more comprehensive measure used by the military and athletic organizations that also accounts for solar radiation, wind speed, and cloud cover. WBGT is the gold standard for assessing heat stress during physical activity.',
      },
      {
        question: 'When should I call 911 for heat-related illness?',
        answer: 'Call 911 immediately if someone shows signs of heatstroke: hot, red, dry skin (no sweating); body temperature above 103°F; rapid, strong pulse; confusion, altered mental state; dizziness; nausea; or loss of consciousness. Heatstroke is a medical emergency that can cause permanent organ damage or death.',
      },
      {
        question: 'How does humidity affect the heat index differently at night?',
        answer: 'At night, the heat index can be just as dangerous as during the day, even though air temperatures are lower. When the sun goes down, the air cools, which increases relative humidity if the moisture content stays the same (cooler air holds less moisture, making the same amount of water vapor represent higher relative humidity). This means the feels-like temperature at night can remain high even as the actual temperature drops. For example, if the daytime high was 95°F with 50% humidity (heat index ~102°F) and the nighttime low is 80°F, the relative humidity typically rises to 80-90% because the same moisture content represents a higher percentage at the lower temperature. The heat index at 80°F with 90% humidity is about 86°F — still uncomfortable and potentially dangerous because the body cannot cool itself through sweat evaporation at high humidity. This is why heat advisories often remain in effect through the night during heat waves — the lack of nighttime cooling prevents the body from recovering, compounding heat stress over consecutive days. Urban heat island effects in cities can keep nighttime temperatures 5-10°F higher than surrounding rural areas, further increasing the risk.',
      },
    ],
    citations: [
      { source: 'NOAA - Heat Index', url: 'https://www.weather.gov/ama/heatindex' },
      { source: 'Wikipedia - Heat Index', url: 'https://en.wikipedia.org/wiki/Heat_index' },
    ],
  },
};

export default heatIndexConfig;
