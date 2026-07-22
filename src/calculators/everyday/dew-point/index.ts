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
      label: 'Air Temperature',
      type: 'number',
      placeholder: '75',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the current air temperature in degrees Fahrenheit. The calculator converts to Celsius for the Magnus formula and back for display.',
      unit: '°F',
    },
    {
      id: 'humidity',
      label: 'Relative Humidity',
      type: 'number',
      placeholder: '60',
      min: 0,
      max: 100,
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the relative humidity percentage (0-100%). The Magnus formula uses this with temperature to calculate the saturation point. Use a hygrometer or check your local weather station for the current value.',
      unit: '%',
    },
  ],
  calculate: (values) => {
    const Tf = parseFloat(values.temperature);
    const RH = parseFloat(values.humidity);

    if (isNaN(Tf) || isNaN(RH) || RH < 0 || RH > 100) return [];

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
      {
        id: 'chartData',
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
      'The Magnus formula is a widely used approximation for calculating the dew point temperature from air temperature and relative humidity. The dew point is the temperature at which air becomes saturated with water vapor and condensation begins (dew or frost forms). A higher dew point indicates more moisture in the air, directly affecting human comfort. The formula derives the saturation vapor pressure curve and solves for the temperature at which the current vapor pressure equals the saturation pressure. The constants a = 17.27 and b = 237.7 are empirically derived for temperatures above freezing; for sub-freezing conditions, different constants apply for saturation over ice rather than liquid water.',
    variables: [
      { symbol: 'T', name: 'Air Temperature', description: 'The current air temperature in degrees Celsius. The formula uses Celsius internally for the Magnus equation.' },
      { symbol: 'RH', name: 'Relative Humidity', description: 'The relative humidity percentage (0-100). At 100% RH, the dew point equals the air temperature.' },
      { symbol: 'γ', name: 'Intermediate Gamma Value', description: 'The combined temperature-humidity parameter. γ = (aT/(b+T)) + ln(RH/100), representing the logarithmic saturation function.' },
      { symbol: 'a, b', name: 'Magnus Constants', description: 'Empirical constants: a = 17.27, b = 237.7. Valid for temperatures above 0°C. Use a = 21.875, b = 265.5 for ice/frost conditions below freezing.' },
      { symbol: 'Td', name: 'Dew Point', description: 'The dew point temperature in degrees Celsius. When air cools to this temperature, water vapor begins condensing into liquid dew.' },
    ],
    howToUse: [
      'Enter the current air temperature in degrees Fahrenheit.',
      'Enter the relative humidity percentage (0-100%).',
      'The calculator converts to Celsius, applies the Magnus formula, and converts the dew point back to Fahrenheit.',
      'Review the comfort level — dew points below 55°F are comfortable, above 70°F feel oppressive.',
      'Use the result for HVAC settings: indoor dew point should ideally be 45-55°F for comfort and mold prevention.',
    ],
    explanation:
      'The dew point is a critical meteorological measure that directly indicates the moisture content of the air. Unlike relative humidity, which changes with temperature (warm air can hold more moisture than cold air), the dew point is an absolute measure of atmospheric moisture. This makes it a more reliable indicator of human comfort than relative humidity alone. A dew point below 55°F feels dry and comfortable; 55-60°F is comfortable; 60-65°F feels slightly humid; 65-70°F becomes sticky; and above 70°F feels oppressive. The Magnus formula provides an accurate approximation of the dew point for temperatures above freezing. Understanding the dew point is essential for HVAC system design (dehumidification control), agricultural frost prediction, fog forecasting, and assessing mold growth risk in buildings. When the temperature drops to the dew point, fog, dew, or frost will form depending on conditions. In instrument calibration, the dew point is measured directly with a chilled mirror hygrometer for precision applications like compressed air quality testing.',
    workedExamples: [
      {
        scenario: 'A homeowner in Chicago notices the windows fogging up on a winter morning. The indoor thermostat reads 70°F and a hygrometer shows 45% humidity. What is the indoor dew point and why are the windows wet?',
        inputs: { temperature: '70', humidity: '45' },
        result: 'Dew point: 47.6°F — comfortable range.',
        insight: 'The indoor dew point is 47.6°F. If the window surface temperature drops below 47.6°F (common on a cold winter day), condensation forms on the glass. To prevent this, the homeowner can either lower indoor humidity (a dehumidifier or increased ventilation) or improve window insulation (storm windows, thermal curtains). This is a classic winter condensation problem — the warm, moist indoor air hits the cold window surface, cools below its dew point, and releases water vapor as liquid.',
      },
      {
        scenario: 'A runner in Miami checks the weather: 88°F with 75% humidity. What is the dew point and how will it affect running performance?',
        inputs: { temperature: '88', humidity: '75' },
        result: 'Dew point: 79°F — Extremely Oppressive. Sweat cannot evaporate effectively.',
        insight: 'A dew point of 79°F is in the "Extremely Oppressive" category. The body cannot cool through sweat evaporation effectively because the air is nearly saturated with moisture. Running performance degrades significantly at dew points above 70°F — studies show marathon times increase by 1-3 minutes per 5°F dew point increase above 65°F. The runner should: slow their pace by at least 30-60 seconds per mile from normal, carry extra water (evaporation is useless, so the body sweats more), run in the early morning when dew points are often lower, and watch for signs of heat exhaustion. At a 79°F dew point, the sweat they produce will simply drip off rather than evaporate — providing no cooling benefit while still depleting body water.',
      },
      {
        scenario: 'An HVAC engineer determines the recommended indoor humidity setting for a building kept at 72°F. The design specification calls for an indoor dew point of 45-55°F. What relative humidity setting achieves this?',
        inputs: { temperature: '72', humidity: '46' },
        result: 'Dew point: 49.5°F — within the recommended 45-55°F HVAC range.',
        insight: 'To maintain a dew point of 45-55°F at an indoor temperature of 72°F, the relative humidity should be set to 40-55% RH. This prevents both mold growth (dew points above 55°F support mold on cool surfaces) and excessive dryness (dew points below 35°F cause respiratory irritation and static electricity). The engineer should program the building\'s humidistat to maintain ~45% RH in winter and ~50% RH in summer, adjusting for outdoor conditions. In humid climates, the AC system must be sized not just for temperature control but for latent heat removal (dehumidification) — oversized AC units short-cycle and fail to remove enough moisture.',
      },
    ],
    proTips: [
      'Dew point is a better comfort metric than relative humidity. A 70°F day at 100% RH feels comfortable (dew point = 70°F, which is borderline sticky), but a 90°F day at 55% RH feels oppressive (dew point = 71°F). Always check the dew point, not the humidity percentage.',
      'For indoor comfort, aim for a dew point of 45-55°F. Below 40°F, dry air irritates mucous membranes and increases static electricity. Above 60°F, mold growth accelerates and dust mites thrive.',
      'Fog forms when the air temperature drops to within 4°F of the dew point. Pilots use the "temperature-dew point spread" to forecast fog — when the spread is 4°F or less with clear skies and light wind, fog is likely overnight. Cloud base (in feet) ≈ (T − Td) × 400.',
      'HVAC systems should be sized for latent heat removal (dehumidification), not just sensible cooling. An oversized AC unit cools too quickly and short-cycles, failing to remove moisture. The result: cold but clammy indoor air with a high dew point — the worst of both worlds.',
      'For agricultural frost prediction: when the dew point is below 32°F and the forecast calls for clear skies and calm winds overnight, frost is likely regardless of whether the air temperature forecast stays above 32°F. The surface radiates heat to space and cools below the air temperature and below the dew point, causing ice crystals to form.',
    ],
    limitations: [
      'When not to use: For sub-freezing conditions (below 0°C/32°F), use frost point calculations with ice-phase Magnus constants (a=21.875, b=265.5) — saturation vapor pressure over ice differs from liquid water. For precision industrial applications requiring ±0.1°C accuracy, use a chilled-mirror dew point hygrometer instead of the Magnus approximation.',
      'The formula assumes standard atmospheric pressure at sea level. At high altitudes, lower atmospheric pressure increases the evaporation rate, resulting in slightly lower actual dew points than calculated. The error is approximately 0.5°C per 1,000 meters of elevation.',
      'Dew point calculations assume equilibrium conditions — in rapidly changing weather (fronts, thunderstorms), the instantaneous dew point may lag behind the actual moisture content as measured by radiosondes.',
      'The comfort scale is subjective and assumes average clothing, moderate activity, and acclimatization to temperate climates. People acclimated to tropical climates may find dew points of 70-75°F tolerable, while those from arid climates may find 60°F uncomfortable.',
      'The dew point is always less than or equal to the air temperature. If your calculated dew point exceeds the temperature, the inputs violate physical laws (relative humidity cannot exceed 100% at equilibrium). This calculator will still produce a numerical result in that scenario using the Magnus approximation.',
    ],
    quickReference: [
      { label: 'DP < 50°F', value: 'Very dry, may feel uncomfortable' },
      { label: 'DP 50-55°F', value: 'Dry and comfortable' },
      { label: 'DP 55-60°F', value: 'Comfortable for most' },
      { label: 'DP 60-65°F', value: 'Slightly humid, sticky' },
      { label: 'DP 65-70°F', value: 'Humid, uncomfortable' },
      { label: 'DP 70-75°F', value: 'Oppressive, sweat won\'t evaporate' },
      { label: 'DP > 75°F', value: 'Dangerous with high temps' },
      { label: 'DP > 80°F', value: 'Highest recorded on Earth' },
    ],
    commonUses: [
      'HVAC design and building management — engineers use dew point to properly size dehumidification systems and to set humidistat controls that prevent both mold growth and excessive dryness in commercial buildings.',
      'Weather forecasting — meteorologists use dew point as a key predictor of fog, frost, thunderstorm potential, and severe weather. Higher dew points mean more atmospheric energy available for storms.',
      'Agriculture and frost protection — farmers monitor dew point forecasts to decide when to run irrigation for frost protection, deploy wind machines, or harvest cold-sensitive crops before a freeze event.',
      'Indoor mold prevention — building inspectors and homeowners track indoor dew point to prevent condensation on cool surfaces (windows, pipes, exterior walls) that leads to mold growth and structural damage.',
      'Industrial compressed air quality — manufacturers use dew point measurements of compressed air to ensure it is dry enough for sensitive processes (paint spraying, pharmaceutical production, electronics assembly).',
    ],
    faqs: [
      {
        question: 'Why is dew point better than relative humidity for comfort?',
        answer: 'Relative humidity changes with temperature — warm air can hold more moisture than cold air. A cold day with 100% humidity can feel comfortable, but a hot day with 60% humidity can feel oppressive. The dew point is an absolute measure of moisture content and does not change when the temperature changes, making it a much better indicator of how humid the air actually feels. For example: 45°F at 100% RH has a dew point of 45°F (dry and comfortable). 90°F at 45% RH has a dew point of 65°F (sticky and humid) — yet the relative humidity number is lower.',
      },
      {
        question: 'What is a comfortable dew point?',
        answer: 'Most people find dew points below 60°F comfortable. Between 60-65°F, the air starts to feel slightly humid. At 65-70°F, it becomes sticky and uncomfortable for many. Above 70°F, the air feels oppressive, and above 75°F, conditions become dangerous when combined with high temperatures because sweat cannot evaporate effectively. The "miserable" threshold for most people is around 72-74°F dew point.',
      },
      {
        question: 'Why does the Magnus formula use different constants below freezing?',
        answer: 'The Magnus formula constants a=17.27, b=237.7 are optimized for saturation vapor pressure over liquid water (dew), for temperatures above 0°C. For sub-freezing conditions, water vapor deposits directly as ice (frost) rather than condensing as liquid. The saturation vapor pressure over ice is lower than over supercooled water at the same temperature, requiring different constants (a=21.875, b=265.5). This calculator uses the standard liquid-water constants, which are appropriate for typical weather conditions above freezing.',
      },
      {
        question: 'What is the relationship between dew point and HVAC?',
        answer: 'HVAC systems use dew point to control dehumidification. When the dew point is high, air conditioners must work harder to remove moisture because cooling the air below its dew point is what causes water to condense on the evaporator coil. The recommended indoor dew point for comfort is 45-55°F (corresponding to 30-50% RH at 70°F). High indoor dew points above 60°F can lead to mold growth and dust mite proliferation. An HVAC system should be sized for both sensible cooling (temperature) and latent cooling (moisture removal) — a unit that is too large will short-cycle and fail to dehumidify adequately.',
      },
      {
        question: 'How does dew point relate to fog formation?',
        answer: 'Fog forms when the air temperature drops to within about 4°F of the dew point. As the air cools overnight, it approaches saturation. When the temperature-dew point spread (the difference between air temperature and dew point) drops below 4°F with light winds and clearing skies, radiation fog is likely to form. There are three types: radiation fog (clear, calm nights — ground radiates heat away), advection fog (warm moist air moves over a cooler surface, common in coastal areas like San Francisco\'s Golden Gate), and upslope fog (moist air forced up a mountainside cools adiabatically). Pilots use the formula: cloud base (feet) = (temperature − dew point in °F) × 400 to estimate where cumulus clouds will form. For driving: radiation fog that forms in low-lying areas near rivers and lakes just before dawn can reduce visibility to near zero in patches — the most dangerous driving condition because it appears suddenly in dips and valleys.',
      },
      {
        question: 'Can the dew point ever be higher than the air temperature?',
        answer: 'No, the dew point can never exceed the air temperature. If water vapor exceeds the saturation point (RH > 100%), the excess moisture condenses out as fog, dew, or precipitation until the air reaches equilibrium at 100% RH — at which point the dew point equals the air temperature. If your calculation produces a dew point higher than the air temperature, it means the inputs violate physical laws (e.g., 120% humidity), or you are using an approximation formula outside its valid range. In practice, supersaturation (RH slightly above 100%) can occur briefly in very clean air lacking condensation nuclei, but this is unstable and rare outside of cloud chambers.',
      },
      {
        question: 'What is the highest dew point ever recorded on Earth?',
        answer: 'The highest reliably recorded dew point is 95°F (35°C), measured in Dhahran, Saudi Arabia, on July 8, 2003, with an air temperature of 108°F — yielding a heat index of approximately 178°F, well into unsurvivable territory. The Persian Gulf region regularly records dew points of 85-90°F during summer, combined with air temperatures exceeding 110°F, creating conditions that are lethal within hours without air conditioning. These extreme dew points occur when hot desert air passes over the warm, shallow waters of the Persian Gulf (water temperatures reach 95°F in summer), picking up enormous amounts of moisture. At a dew point of 95°F, the air contains over 36 grams of water vapor per cubic meter — about three times the moisture content of a typical summer day in New York City. The theoretical maximum dew point on Earth, given ocean temperatures and atmospheric circulation, is estimated at about 97°F at sea level.',
      },
    ],
    citations: [
      { source: 'NOAA - Dew Point Definition', url: 'https://www.weather.gov/ffc/dewpoint' },
      { source: 'Wikipedia - Dew Point', url: 'https://en.wikipedia.org/wiki/Dew_point' },
      { source: 'ASHRAE - Indoor Humidity Guidelines', url: 'https://www.ashrae.org/technical-resources/bookstore' },
    ],
  },
};

export default dewPointConfig;
