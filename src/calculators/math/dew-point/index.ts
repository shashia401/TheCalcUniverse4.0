import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DewPointPanel from './DewPointPanel';

function fToC(f: number): number {
  return (f - 32) * 5 / 9;
}

function cToF(c: number): number {
  return (c * 9 / 5) + 32;
}

function dewPoint(Tc: number, RH: number): number {
  const a = 17.27;
  const b = 237.7;
  const safeRH = Math.max(RH, 0.001);
  const gamma = (a * Tc) / (b + Tc) + Math.log(safeRH / 100);
  return (b * gamma) / (a - gamma);
}

function getComfortLevel(dpF: number): { label: string; description: string } {
  if (dpF < 55) return { label: 'Dry and comfortable', description: 'The air feels dry. Very comfortable conditions for most people.' };
  if (dpF < 60) return { label: 'Comfortable', description: 'The air feels comfortable. No humidity issues.' };
  if (dpF < 65) return { label: 'Slightly humid', description: 'The air feels slightly humid. Barely noticeable.' };
  if (dpF < 70) return { label: 'Becoming sticky (humid)', description: 'The air feels noticeably humid and sticky. Some discomfort.' };
  if (dpF < 75) return { label: 'Uncomfortable (oppressive)', description: 'The air feels oppressive. Most people will feel uncomfortable.' };
  if (dpF < 80) return { label: 'Very uncomfortable (miserable)', description: 'The air feels very uncomfortable and miserable. High moisture content.' };
  return { label: 'Extremely oppressive (dangerous)', description: 'Extremely high moisture. Dangerous conditions, especially with high temperatures.' };
}

const dewPointConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'temperature',
      label: 'Temperature (°F)',
      type: 'number',
      placeholder: '75',
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
      helpText: 'The relative humidity percentage (0-100%)',
    },
  ],
  calculate: (values) => {
    const Tf = parseFloat(values.temperature);
    const RH = parseFloat(values.humidity);

    if ([Tf, RH].some(isNaN) || RH < 0 || RH > 100) return [];

    const Tc = fToC(Tf);
    const dpC = dewPoint(Tc, RH);
    const dpF = cToF(dpC);
    const comfort = getComfortLevel(dpF);

    const fmt = (n: number, d = 1) => parseFloat(n.toFixed(d)).toString();

    return [
      {
        id: 'dewPoint',
        label: 'Dew Point',
        value: `${fmt(dpF)}°F / ${fmt(dpC)}°C`,
        highlight: true,
        color: dpF >= 70 ? 'negative' as const : dpF >= 60 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'dewPointF',
        label: 'Dew Point (°F)',
        value: `${fmt(dpF)}°F`,
        color: 'neutral' as const,
      },
      {
        id: 'dewPointC',
        label: 'Dew Point (°C)',
        value: `${fmt(dpC)}°C`,
        color: 'neutral' as const,
      },
      {
        id: 'humidity',
        label: 'Relative Humidity',
        value: `${fmt(RH)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'temperature',
        label: 'Temperature',
        value: `${fmt(Tf)}°F`,
        color: 'neutral' as const,
      },
      {
        id: 'comfortLevel',
        label: 'Comfort Level',
        value: comfort.label,
        color: dpF >= 70 ? 'negative' as const : dpF >= 60 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: '_chartData',
        label: '',
        value: JSON.stringify({
          dewPointF: dpF,
          dewPointC: dpC,
          temperature: Tf,
          humidity: RH,
          comfortLabel: comfort.label,
          comfortDescription: comfort.description,
        }),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DewPointPanel, { values, results });
  },
  educational: {
    formula: 'Td = (b × γ(T,RH)) / (a − γ(T,RH)) where γ = (aT/(b+T)) + ln(RH/100), a = 17.27, b = 237.7',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="20" y="15" width="280" height="155" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="35" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Dew Point Comfort Scale</text><rect x="30" y="50" width="120" height="18" fill="var(--svg-22c55e)" rx="3"/><text x="90" y="63" text-anchor="middle" fill="var(--svg-ffffff)" font-family="Arial,sans-serif" font-size="9">Dry &amp; Comfortable</text><rect x="150" y="50" width="50" height="18" fill="var(--svg-eab308)" rx="3"/><text x="175" y="63" text-anchor="middle" fill="var(--svg-ffffff)" font-family="Arial,sans-serif" font-size="8">Slightly Humid</text><rect x="200" y="50" width="100" height="18" fill="var(--svg-f97316)" rx="3"/><text x="250" y="63" text-anchor="middle" fill="var(--svg-ffffff)" font-family="Arial,sans-serif" font-size="9">Sticky</text><rect x="30" y="75" width="120" height="18" fill="var(--svg-ef4444)" rx="3"/><text x="90" y="88" text-anchor="middle" fill="var(--svg-ffffff)" font-family="Arial,sans-serif" font-size="9">Oppressive</text><rect x="150" y="75" width="140" height="18" fill="var(--svg-dc2626)" rx="3"/><text x="220" y="88" text-anchor="middle" fill="var(--svg-ffffff)" font-family="Arial,sans-serif" font-size="9">Very Uncomfortable</text><text x="30" y="115" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10">&lt; 55 F &emsp; 55-60 &emsp; 60-65 &emsp; 65-70 &emsp; &gt; 70 F</text><text x="30" y="135" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="10">Lower DP = drier</text><text x="220" y="135" text-anchor="end" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="10">Higher DP = more humid</text><line x1="30" y1="155" x2="290" y2="155" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><polygon points="290,155 285,151 285,159" fill="var(--svg-3b82f6)"/><text x="160" y="175" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Dew Point = True measure of air moisture</text></svg>',
      alt: 'Dew point comfort scale chart showing temperature ranges from dry to uncomfortable',
      caption: 'Dew point is an absolute measure of moisture, unlike relative humidity',
    },
    formulaDescription:
      'The Magnus formula is a widely used approximation for calculating the dew point temperature from air temperature and relative humidity. The dew point is the temperature at which air becomes saturated with water vapor and condensation begins. A higher dew point indicates more moisture in the air, directly affecting human comfort. The constants a and b are empirically derived for temperatures above freezing and provide accurate results for typical weather conditions.',
    variables: [
      { symbol: 'T', name: 'Air Temperature', description: 'The current air temperature in degrees Celsius.' },
      { symbol: 'RH', name: 'Relative Humidity', description: 'The relative humidity percentage (0-100).' },
      { symbol: 'γ', name: 'Intermediate Gamma Value', description: 'The combined temperature-humidity parameter.' },
      { symbol: 'a, b', name: 'Magnus Constants', description: 'Empirical constants: a = 17.27, b = 237.7 (for temperatures above 0°C).' },
      { symbol: 'Td', name: 'Dew Point', description: 'The dew point temperature in degrees Celsius.' },
    ],
    howToUse: [
      'Enter the current air temperature in degrees Fahrenheit.',
      'Enter the relative humidity percentage (0-100%).',
      'The calculator converts to Celsius, applies the Magnus formula, and converts the dew point back to Fahrenheit.',
      'Review the comfort level description and HVAC relevance.',
      'A dew point below 55°F is comfortable; above 70°F feels oppressive.',
    ],
    explanation:
      'The dew point is a critical meteorological measure that directly indicates the moisture content of the air. Unlike relative humidity, which changes with temperature, the dew point is an absolute measure of atmospheric moisture. This makes it a more reliable indicator of human comfort. A dew point below 55°F feels dry and comfortable, while a dew point above 70°F feels oppressive. The Magnus formula provides an accurate approximation of the dew point for temperatures above freezing. Understanding the dew point is essential for HVAC system design, agricultural frost prediction, fog forecasting, and assessing mold growth risk in buildings. When the temperature drops to the dew point, fog, dew, or frost will form depending on conditions. Practical example: if the temperature is 85°F and relative humidity is 70%, the Magnus formula gives a dew point of approximately 74°F. This means the air contains as much moisture as air at 74°F would hold at 100% humidity. According to the comfort scale, 74°F is in the "oppressive" range — the air feels very humid and sticky. If the temperature drops to 74°F overnight, fog will form. Edge cases: when the dew point is below 32°F (freezing), frost forms instead of dew. If the temperature is also below freezing, the saturation vapor pressure over ice differs from that over liquid water, so the Magnus constants change (a = 21.875, b = 265.5 for ice). For indoor humidity management, the dew point should ideally be between 45-55°F to prevent both mold growth (which requires dew points above 55°F) and excessive dryness (which can cause respiratory irritation and static electricity). For instrument calibration and industrial applications (e.g., compressed air systems), the dew point is measured directly with a chilled mirror hygrometer. In tropical climates, dew points of 75-80°F are common and can be dangerous when combined with high temperatures because the body cannot cool itself through sweat evaporation.',
    faqs: [
      {
        question: 'Why is dew point better than relative humidity for comfort?',
        answer: 'Relative humidity changes with temperature — warm air can hold more moisture than cold air. A cold day with 100% humidity feels comfortable, but a hot day with 60% humidity can feel oppressive. The dew point is an absolute measure of moisture content and does not change with temperature, making it a much better indicator of how humid the air actually feels.',
      },
      {
        question: 'What is a comfortable dew point?',
        answer: 'Most people find dew points below 60°F comfortable. Between 60-65°F, the air starts to feel slightly humid. Above 70°F, the air feels uncomfortable and oppressive. Above 75°F, conditions become miserable, and above 80°F, they can be dangerous — especially when combined with high temperatures.',
      },
      {
        question: 'Why does the Magnus formula use different constants below freezing?',
        answer: 'The Magnus formula constants a=17.27, b=237.7 are optimized for temperatures above 0°C (32°F). For sub-freezing conditions, different constants (a=21.875, b=265.5) are used because the saturation vapor pressure over ice differs from that over liquid water. This calculator uses the standard constants for conditions typically above freezing.',
      },
      {
        question: 'What is the relationship between dew point and HVAC?',
        answer: 'HVAC systems use dew point to control dehumidification. When the dew point is high, air conditioners must work harder to remove moisture. The recommended indoor dew point for comfort is between 45-55°F (corresponding to 30-50% relative humidity at 70°F). High indoor dew points can lead to mold growth and dust mite proliferation.',
      },
      {
        question: 'How does dew point relate to fog formation?',
        answer: 'Fog forms when the air temperature drops to within about 4°F of the dew point. As the air cools overnight, it approaches the dew point temperature, at which point the air becomes saturated and water vapor begins to condense into tiny suspended water droplets — fog. The type of fog depends on how the cooling occurs: radiation fog forms on clear, calm nights when the ground radiates heat away and cools the air above it; advection fog forms when warm, moist air moves over a cooler surface (common in coastal areas like San Francisco); and upslope fog forms when moist air is forced up a mountainside and cools adiabatically. The most dangerous fog for driving is radiation fog, which often forms in low-lying areas near rivers and lakes just before dawn and can reduce visibility to near zero in patches. Pilots use the "temperature-dew point spread" (the difference between the air temperature and dew point) to forecast fog — when the spread is 4°F or less with light winds and clearing skies, fog is likely to form overnight. For aviation, the dew point is also used to calculate the cloud base height using the formula: cloud base (feet) = (temperature - dew point) × 400, which gives the altitude at which cumulus clouds will form.',
      },
    ],
    citations: [

      { source: 'Wikipedia - Dew Point', url: 'https://en.wikipedia.org/wiki/Dew_point' },
    ],
  },
};

export default dewPointConfig;
