import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import WindChillPanel from './WindChillPanel';

function fToC(f: number): number {
  return (f - 32) * 5 / 9;
}

function cToF(c: number): number {
  return (c * 9 / 5) + 32;
}

function kmhToMph(kmh: number): number {
  return kmh / 1.60934;
}

function getFrostbiteRisk(windChillF: number): string {
  if (windChillF > -18) return 'Low risk';
  if (windChillF >= -27) return 'Frostbite possible in 30 min';
  if (windChillF >= -39) return 'Frostbite possible in 10 min';
  if (windChillF >= -60) return 'Frostbite possible in 5 min';
  return 'Frostbite in under 2 min';
}

function windChillF(Tf: number, Vmph: number): number {
  if (Tf > 50 || Vmph < 3) return Tf;
  return 35.74 + 0.6215 * Tf - 35.75 * Math.pow(Vmph, 0.16) + 0.4275 * Tf * Math.pow(Vmph, 0.16);
}

const windChillConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'temperature',
      label: 'Air Temperature',
      type: 'number',
      placeholder: '30',
      step: 0.1,
      required: true,
      helpText: 'The current outdoor air temperature',
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
      helpText: 'Select the temperature unit',
    },
    {
      id: 'windSpeed',
      label: 'Wind Speed',
      type: 'number',
      placeholder: '15',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'The current wind speed',
    },
    {
      id: 'speedUnit',
      label: 'Wind Speed Unit',
      type: 'select',
      options: [
        { value: 'mph', label: 'mph (miles per hour)' },
        { value: 'kmh', label: 'km/h (kilometers per hour)' },
      ],
      defaultValue: 'mph',
      required: true,
      helpText: 'Select the wind speed unit',
    },
  ],
  calculate: (values) => {
    const temp = parseFloat(values.temperature);
    const ws = parseFloat(values.windSpeed);
    const tempUnit = values.tempUnit || 'F';
    const speedUnit = values.speedUnit || 'mph';

    if ([temp, ws].some(isNaN) || ws < 0) return [];

    // Convert everything to °F and mph for the formula
    const Tf = tempUnit === 'C' ? cToF(temp) : temp;
    const Vmph = speedUnit === 'kmh' ? kmhToMph(ws) : ws;

    const wcF = windChillF(Tf, Vmph);
    const wcC = fToC(wcF);
    const frostbite = getFrostbiteRisk(wcF);

    const fmt = (n: number, d = 1) => parseFloat(n.toFixed(d)).toString();

    return [
      {
        id: 'windChill',
        label: 'Wind Chill Temperature',
        value: `${fmt(wcF)}°F / ${fmt(wcC)}°C`,
        highlight: true,
        color: wcF <= -18 ? 'negative' as const : 'positive' as const,
      },
      {
        id: 'windChillF',
        label: 'Wind Chill (°F)',
        value: `${fmt(wcF)}°F`,
        color: 'neutral' as const,
      },
      {
        id: 'windChillC',
        label: 'Wind Chill (°C)',
        value: `${fmt(wcC)}°C`,
        color: 'neutral' as const,
      },
      {
        id: 'windSpeedDisplay',
        label: 'Wind Speed',
        value: `${fmt(ws)} ${speedUnit === 'kmh' ? 'km/h' : 'mph'}`,
        color: 'neutral' as const,
      },
      {
        id: 'originalTemp',
        label: 'Original Temperature',
        value: `${fmt(temp)}°${tempUnit}`,
        color: 'neutral' as const,
      },
      {
        id: 'frostbiteRisk',
        label: 'Frostbite Risk',
        value: frostbite,
        color: wcF <= -18 ? 'negative' as const : 'positive' as const,
      },
      {
        id: '_chartData',
        label: '',
        value: JSON.stringify({
          windChillF: wcF,
          windChillC: wcC,
          temperatureF: Tf,
          temperatureC: fToC(Tf),
          windSpeedMph: Vmph,
          originalTemp: temp,
          originalUnit: tempUnit,
          frostbite,
        }),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WindChillPanel, { values, results });
  },
  educational: {
    formula: 'WindChill = 35.74 + 0.6215T − 35.75(V^0.16) + 0.4275T(V^0.16)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Wind Chill Factor</text><text x="220" y="52" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Wind accelerates heat loss from exposed skin</text><line x1="50" y1="280" x2="400" y2="280" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="410" y="284" font-size="12" fill="var(--svg-666666)">Wind Speed</text><line x1="80" y1="280" x2="80" y2="50" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="86" y="48" font-size="12" fill="var(--svg-666666)">&deg;F</text><path d="M80,60 C120,65 160,75 200,90 C240,105 280,125 320,150 C360,175 390,200 400,220" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2" stroke-linecap="round"/><text x="120" y="65" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)">Calm</text><path d="M80,70 C120,90 160,115 200,140 C240,165 280,185 320,205 C360,220 390,235 400,245" fill="none" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="5,3"/><text x="140" y="105" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">Windy</text><path d="M80,85 C120,120 160,155 200,185 C240,210 280,230 320,245 C360,255 390,260 400,265" fill="none" stroke="var(--svg-22c55e)" stroke-width="2" stroke-dasharray="3,4"/><text x="160" y="150" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)">Very Windy</text><text x="80" y="62" text-anchor="end" font-size="11" font-weight="bold" fill="var(--svg-666666)">40&deg;F</text><text x="80" y="130" text-anchor="end" font-size="11" font-weight="bold" fill="var(--svg-666666)">20&deg;F</text><text x="80" y="200" text-anchor="end" font-size="11" font-weight="bold" fill="var(--svg-666666)">0&deg;F</text><text x="80" y="270" text-anchor="end" font-size="11" font-weight="bold" fill="var(--svg-666666)">-20&deg;F</text><text x="220" y="325" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Wind Chill = f(T, V) &nbsp;|&nbsp; Higher wind = colder feeling</text></svg>',
      alt: 'Chart showing three curves for calm, windy, and very windy conditions showing how wind speed lowers the effective temperature',
      caption: 'Wind chill measures how cold it feels when wind is combined with cold air temperature',
    },
    formulaDescription:
      'The National Weather Service (NWS) wind chill formula calculates how cold it feels when wind is combined with cold air. Wind accelerates heat loss from exposed skin, making the air feel significantly colder than the actual temperature. The formula applies only when the temperature is at or below 50°F and wind speed is at least 3 mph.',
    variables: [
      { symbol: 'T', name: 'Air Temperature', description: 'The actual air temperature in degrees Fahrenheit.' },
      { symbol: 'V', name: 'Wind Speed', description: 'The wind speed in miles per hour at 33 feet (standard anemometer height).' },
      { symbol: 'WindChill', name: 'Wind Chill Temperature', description: 'How cold it feels on exposed skin in degrees Fahrenheit.' },
    ],
    howToUse: [
      'Enter the current air temperature and select the unit (°F or °C).',
      'Enter the wind speed and select the unit (mph or km/h).',
      'The calculator applies the NWS wind chill formula and shows the feels-like temperature.',
      'Review the frostbite risk category and safety recommendations.',
    ],
    explanation:
      'Wind chill is based on the rate of heat loss from exposed skin caused by wind and cold. As wind increases, it draws heat away from the body, cooling the skin surface faster. The NWS wind chill formula was developed through research involving human volunteers and face cooling measurements in a controlled wind tunnel. Frostbite can occur in minutes when wind chill temperatures are very low. The risk categories help outdoor workers, athletes, and recreationists make informed decisions about exposure time and protective clothing. Wind chill applies only to people and animals — inanimate objects like car radiators or pipes will not cool below the actual air temperature. Practical example: if the actual temperature is 20°F with a 25 mph wind, the wind chill calculation yields: 35.74 + (0.6215 × 20) - (35.75 × 25^0.16) + (0.4275 × 20 × 25^0.16) = 35.74 + 12.43 - 35.75 × 1.66 + 0.4275 × 20 × 1.66 = 48.17 - 59.35 + 14.19 = 3.0°F. So 20°F feels like 3°F! At this level, frostbite is possible in about 30 minutes of exposure. Edge cases: the NWS formula is valid only when the temperature is at or below 50°F and wind speed is at least 3 mph. If the temperature is 55°F and wind is 20 mph, the wind chill equals the actual temperature (55°F) because the formula does not apply above 50°F. For wind speeds above 50 mph, the additional cooling effect diminishes — the formula asymptotically approaches a limit because the body cannot lose heat faster than the wind can carry it away. For wet skin (sweating or rain), the cooling effect is much more dramatic because water conducts heat 25 times faster than air — this is called hypothermia risk even in 50°F weather with wind and rain. For runners and cyclists, the effective wind speed is the sum of the actual wind and their forward speed, meaning they experience greater wind chill than a stationary person.',
    faqs: [
      {
        question: 'Does wind chill affect inanimate objects?',
        answer: 'No. Wind chill only affects living things that generate their own heat. Cars, pipes, and buildings will only cool to the actual air temperature, though wind can help them reach that temperature faster. Never use wind chill to predict when pipes might freeze — use the actual temperature instead.',
      },
      {
        question: 'Why does the formula only apply below 50°F and above 3 mph?',
        answer: 'The NWS wind chill formula was designed for cold weather conditions. Above 50°F, the wind cooling effect is better described by the heat index. Below 3 mph, wind has negligible additional cooling effect beyond the ambient temperature. In these ranges, the wind chill equals the actual air temperature.',
      },
      {
        question: 'What is the difference between wind chill and the "feels like" temperature?',
        answer: 'Wind chill is specifically the cooling effect of wind on exposed skin in cold weather. The "feels like" temperature (also called the apparent temperature) combines wind chill in winter and heat index in summer. Some weather services use a combined apparent temperature formula that accounts for wind, humidity, and solar radiation.',
      },
      {
        question: 'How quickly can frostbite occur?',
        answer: 'At wind chill values below -18°F, frostbite becomes a concern. At -18°F to -27°F, frostbite is possible in about 30 minutes of exposure. At -28°F to -39°F, it drops to 10 minutes. Below -40°F, frostbite can occur in 5 minutes. Below -60°F, exposed skin can freeze in under 2 minutes. Always cover exposed skin in extreme cold.',
      },
      {
        question: 'How does wind chill affect pets and livestock differently than humans?',
        answer: 'Pets and livestock are affected by wind chill differently depending on their fur, size, and species. Dogs with thick double coats (Huskies, Malamutes) have natural insulation that provides protection down to very low temperatures, but they are still at risk for frostbite on exposed areas like ears, paw pads, and noses. Short-haired breeds and small dogs are much more vulnerable to wind chill because they have less insulation and a higher surface-area-to-volume ratio, meaning they lose heat faster. Cats are generally more cold-tolerant than small dogs but still need shelter. Livestock like cattle and horses grow thicker winter coats that provide significant insulation, but wind chill reduces the effectiveness of that insulation by disrupting the trapped air layer. The Lower Critical Temperature (LCT) for cattle is about 32°F with no wind, but with a 15 mph wind and 20°F temperature, the effective temperature for the animal can drop below freezing, requiring increased feed intake to maintain body temperature — about 1% more feed for each degree below the LCT. For chickens and other poultry, wind chill is particularly dangerous because their combs and wattles are vulnerable to frostbite, and they do not have the same ability to fluff feathers against wind. Windbreaks and proper shelter are essential for all outdoor animals during cold weather.',
      },
    ],
    citations: [

      { source: 'Wikipedia - Wind Chill', url: 'https://en.wikipedia.org/wiki/Wind_chill' },
    ],
  },
};

export default windChillConfig;
