import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HeatIndexPanel from './HeatIndexPanel';
import { fToC } from '../../../utils/heatIndex';
import { heatInfo } from './heatMath';

const heatIndexConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'temperature',
      label: 'Air Temperature',
      type: 'number',
      placeholder: '90',
      step: 0.1,
      min: -60,
      max: 150,
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the current air temperature. Switch between imperial (°F) and metric (°C) units using the selector below.',
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
      helpText: 'Choose imperial (°F) or metric (°C) for the air temperature. The calculator converts Celsius to Fahrenheit for the NWS formula and shows the result in both units.',
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
      helpText: 'Enter the relative humidity percentage (0-100%). Humidity affects the body\'s ability to cool through sweat evaporation.',
    },
  ],
  calculate: (values) => {
    const h = heatInfo(values);
    if (!h) return [];
    const fmt = (n: number, d = 1) => parseFloat(n.toFixed(d)).toString();
    const hi = h.hiF;
    const userUnit = h.unit === 'C';
    const hiShown = userUnit ? h.hiC : hi;
    const sym = userUnit ? '°C' : '°F';

    return [
      {
        id: 'heatIndex',
        label: 'Heat Index',
        value: `${fmt(hiShown)}${sym}`,
        highlight: true,
        color: hi >= 103 ? 'negative' as const : hi >= 90 ? 'positive' as const : 'neutral' as const,
        interpretation: 'NWS formula: Steadman for mild conditions, Rothfusz regression with the low/high-humidity adjustments from 80°F up. Assumes shade and light wind.',
        warning: h.tempF > 110 ? 'Above the 110°F air temperature covered by the NWS heat index chart - treat the value as indicative only.' : undefined,
      },
      {
        id: 'heatIndexLabel',
        label: 'Feels Like',
        value: `${fmt(hiShown)}${sym} (${h.tier.label})`,
        color: 'neutral' as const,
      },
      ...(userUnit
        ? [{ id: 'heatIndexF', label: 'Heat Index (°F)', value: `${fmt(hi)}°F`, color: 'neutral' as const }]
        : [{ id: 'heatIndexC', label: 'Heat Index (°C)', value: `${fmt(fToC(hi))}°C`, color: 'neutral' as const }]),
      {
        id: 'temperature',
        label: 'Temperature',
        value: `${fmt(h.rawTemp)}${sym}`,
        color: 'neutral' as const,
      },
      {
        id: 'humidity',
        label: 'Relative Humidity',
        value: `${fmt(h.humidity)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'dangerTier',
        label: 'Danger Tier',
        value: h.tier.label,
        color: hi >= 103 ? 'negative' as const : hi >= 90 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'safetyRecommendations',
        label: 'Safety Recommendations',
        value: h.recommendations.join(' | '),
        color: 'neutral' as const,
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
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Heat Index &amp; Apparent Temperature</text><rect x="180" y="55" width="40" height="220" rx="5" fill="none" stroke="var(--svg-cccccc)" stroke-width="2"/><rect x="184" y="75" width="32" height="196" rx="3" fill="url(#hg)"/><circle cx="200" cy="275" r="20" fill="var(--svg-ef4444)" fill-opacity=".3" stroke="var(--svg-ef4444)" stroke-width="2"/><circle cx="200" cy="275" r="8" fill="var(--svg-ef4444)"/><text x="250" y="82" text-anchor="start" font-size="11" fill="var(--svg-ef4444)">Extreme Danger: 125&deg;F or higher</text><text x="250" y="112" text-anchor="start" font-size="11" fill="var(--svg-ef4444)">Danger: 103-124&deg;F</text><text x="250" y="155" text-anchor="start" font-size="11" fill="var(--svg-ef4444)">Extreme Caution: 90-102&deg;F</text><text x="250" y="200" text-anchor="start" font-size="11" fill="var(--svg-22c55e)">Caution: 80-89&deg;F</text><text x="250" y="250" text-anchor="start" font-size="11" fill="var(--svg-3b82f6)">Safe: below 80&deg;F</text><text x="220" y="330" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">HI = f(T, RH) &nbsp;|&nbsp; High humidity reduces sweat evaporation</text><defs><linearGradient id="hg" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#3b82f6"/><stop offset="30%" stop-color="#22c55e"/><stop offset="60%" stop-color="#ef4444"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs></svg>',
      alt: 'Thermometer with gradient from blue (safe) through green and red to purple (extreme danger) showing heat index categories',
      caption: 'The heat index combines temperature and humidity to measure how hot it actually feels',
    },
    formulaDescription:
      'The heat index (apparent temperature) combines air temperature and relative humidity into how hot it feels in shade with light wind. The US National Weather Service computes it in two steps: first Steadman\'s simple formula HI = 0.5 x (T + 61 + 1.2 x (T - 68) + 0.094 x RH); if the average of that value and T is 80°F or more, the full Rothfusz regression (the long polynomial above, a fit to Steadman\'s 1979 model) is used instead, with two corrections: subtract ((13 - RH) / 4) x sqrt((17 - |T - 95|) / 17) when RH is below 13% and T is 80-112°F, and add ((RH - 85) / 10) x ((87 - T) / 5) when RH is above 85% and T is 80-87°F. Temperatures are in °F; Celsius input is converted first.',
    variables: [
      { symbol: 'T', name: 'Air Temperature', description: 'The actual air temperature in degrees Fahrenheit (Celsius input is converted).' },
      { symbol: 'R', name: 'Relative Humidity', description: 'The relative humidity percentage (0-100). Higher RH reduces sweat evaporation, making it feel hotter.' },
      { symbol: 'HI', name: 'Heat Index', description: 'The apparent temperature or "feels like" temperature in °F. This is what the human body perceives.' },
    ],
    howToUse: [
      'Select your preferred temperature unit — imperial (°F) or metric (°C). The calculator auto-converts Celsius values.',
      'Enter the current air temperature in your chosen unit.',
      'Enter the relative humidity percentage (0-100%).',
      'The calculator applies the NWS heat index equation (Steadman simple formula, then the Rothfusz regression with adjustments when it is hot enough) to compute the feels-like temperature.',
      'Review the danger tier and safety recommendations for your heat index value.',
      'Add up to 15°F to the result if you are in full sunshine, as the formula assumes shade and light wind.',
    ],
    explanation:
      'The heat index (also called the apparent temperature) is what the temperature feels like to the human body when relative humidity is combined with the air temperature. When humidity is high, sweat evaporates more slowly, so the body cools less effectively. This can lead to heat-related illnesses ranging from heat cramps to life-threatening heatstroke. The NWS heat index was developed for shady, light-wind conditions - full sunshine can increase the value by up to 15°F. The NWS categories are Caution (80-90°F), Extreme Caution (90-103°F), Danger (103-125°F) and Extreme Danger (125°F and above); below 80°F the heat index is not classified (shown here as Safe). NWS offices issue heat advisories and warnings at local criteria that vary by region and increasingly use the HeatRisk forecast as well. Practical example: at 92°F and 65% relative humidity the heat index is 108.3°F, in the Danger tier: heat cramps and heat exhaustion are likely and heatstroke is probable with continued activity. The regression is a fit to a model, accurate to about +/-1.3°F, and the NWS chart covers air temperatures from 80 to 110°F. For heat stress at work or in sport, where sun, wind and exertion matter, wet-bulb globe temperature (WBGT) is the better measure.',
    workedExamples: [
      {
        scenario: 'A landscaping crew in Houston at 98°F with 65% humidity. What is the heat index and what safety measures should their supervisor implement?',
        inputs: { temperature: '98', tempUnit: 'F', humidity: '65' },
        result: 'Heat index: 128.2°F — Extreme Danger tier. Direct sun: roughly 138–143°F.',
        insight: 'At 98°F and 65% humidity the heat index is 128.2°F, which is in the Extreme Danger tier (125°F or higher), where heatstroke is highly likely with continued exposure. The supervisor should not schedule strenuous outdoor work at midday: move the work to the early morning (starting around 6 AM, before temperatures climb), end by late morning, and provide shade, water and a buddy system with cooling towels. Direct sun would add roughly 10–15°F, pushing the effective value to about 138–143°F, so outdoor work must stop if the site is unshaded.',
      },
      {
        scenario: 'A youth soccer tournament in Atlanta at 92°F with 70% humidity at noon. Should the games proceed?',
        inputs: { temperature: '92', tempUnit: 'F', humidity: '70' },
        result: 'Heat index: 112.2°F — Danger tier. Direct sun: roughly 122–127°F.',
        insight: 'At 112.2°F heat index (Danger tier), youth sports are dangerous. Adding 10–15°F for direct sun brings the effective temperature to roughly 122–127°F. The tournament director should implement mandatory water breaks every 15 minutes, provide cooling tents with misters, and have an athletic trainer on-site with ice baths for rapid cooling if heat illness occurs.',
      },
      {
        scenario: 'An outdoor worker in Phoenix at 105°F with only 15% humidity vs. Miami at 95°F with 80% humidity. Which is more dangerous?',
        inputs: { temperature: '105', tempUnit: 'F', humidity: '15' },
        result: 'Phoenix (105°F, 15% RH): heat index 101.6°F — Extreme Caution. Miami (95°F, 80% RH): heat index 133.8°F — Extreme Danger. Dry heat is more survivable.',
        insight: 'Humidity dominates the heat index. The "dry heat" at 105°F produces a lower heat index than the humid 95°F because the body can cool through sweat evaporation in dry conditions. At 133.8°F, Miami is in the Extreme Danger tier — heatstroke is highly likely. This is why humid heat is more dangerous than dry heat at the same air temperature, and why air conditioning (which dehumidifies) is so valuable in humid climates.',
      },
    ],
    proTips: [
      'Both humidity and temperature matter a great deal above 90°F. Between 90°F and 100°F and 50-70% humidity, a 5-point rise in relative humidity raises the heat index by about 2-7°F, and a 1°F rise in temperature raises it by about 2-4.5°F.',
      'The heat index formula assumes light wind and shade. In full sunshine it can feel up to 15°F hotter than the calculated value.',
      'OSHA/NIOSH acclimatization guidance (the "20% rule"): new workers should do no more than 20% of a normal workload in the heat on day 1 and add no more than 20% per day. Full heat acclimatization takes about 1-2 weeks.',
      'Do not rely on fans alone in very hot weather: the CDC notes that fans may not prevent heat-related illness once air temperatures are in the high 90s°F. Use air conditioning, cool showers, or cool compresses instead.',
      'Check urine color: pale yellow usually means you are well hydrated, dark yellow or amber suggests you need more fluid.',
    ],
    limitations: [
      'When not to use: For workplace heat safety compliance requiring WBGT (Wet-Bulb Globe Temperature) per ISO 7243 or ACGIH standards, use a WBGT meter — the heat index is a screening tool only. For sports medicine decisions involving exertional heat illness risk during intense exercise, WBGT is the gold standard.',
      'The NOAA heat index formula was developed for shady, light wind conditions at sea level. Direct sun adds 10-15°F, and strong exertion or heavy clothing make it feel hotter.',
      'The regression is a fit to Steadman\'s model with an error of roughly +/-1.3°F, and the NWS chart covers air temperatures of 80-110°F. Outside that range, and at extreme humidity, calculated values are less reliable. Below about 80°F the simple Steadman formula is used and the value is not classified into a danger tier.',
      'Heat index does not account for personal factors: age (older adults and infants are more susceptible), medications (antihistamines, diuretics, beta blockers impair thermoregulation), obesity, and acclimatization status.',
      'The formula assumes light clothing and a person at rest. Physical activity substantially increases the body\'s heat load, so the real strain during exercise is higher than the heat index suggests.',
    ],
    quickReference: [
      { label: '80°F + 40% humidity', value: '79.6°F (safe)' },
      { label: '85°F + 60% humidity', value: '89.3°F (caution)' },
      { label: '90°F + 55% humidity', value: '97.0°F (extreme caution)' },
      { label: '92°F + 65% humidity', value: '108.3°F (danger)' },
      { label: '96°F + 60% humidity', value: '116.1°F (danger)' },
      { label: '100°F + 55% humidity', value: '123.6°F (danger)' },
      { label: '102°F + 60% humidity', value: '136.9°F (extreme danger)' },
      { label: '105°F + 20% humidity', value: '104.3°F (danger)' },
    ],
    commonUses: [
      'Outdoor workplace safety — Site supervisors use the heat index (and, where available, WBGT) to plan water, rest, and shade breaks for construction, agriculture, and warehouse workers.',
      'Athletic and school event planning — coaches and school administrators use heat index thresholds to decide whether to modify, postpone, or cancel outdoor practices and games.',
      'Community event safety — festival organizers and emergency management officials monitor heat index forecasts for cooling center and EMS resource planning.',
      'Personal outdoor activity planning — hikers, runners, and outdoor enthusiasts check the heat index to choose appropriate clothing, hydration, and whether to exercise indoors.',
      'Military training risk management — the U.S. military uses WBGT-based flag conditions to set work/rest cycles and hydration requirements during training.',
    ],
    faqs: [
      {
        question: 'Why does humidity make it feel hotter?',
        answer: 'Your body cools itself primarily through the evaporation of sweat. Each gram of sweat that evaporates from your skin removes roughly 580 calories of heat. When humidity is high, the air already contains significant moisture, which slows the evaporation rate. This impairs your bodys primary cooling mechanism, making you feel hotter than the actual air temperature. As relative humidity approaches 100%, evaporation slows to a crawl and sweat drips off without cooling you much.',
      },
      {
        question: 'Does the heat index account for direct sunlight?',
        answer: 'No. The NOAA heat index assumes shady conditions with light wind. Direct sunlight can increase the apparent temperature by up to 15°F because solar radiation adds a radiative heat load to the body. Treat the calculated value as a minimum on sunny days.',
      },
      {
        question: 'What is the difference between heat index and wet-bulb globe temperature?',
        answer: 'The heat index considers only temperature and humidity. The Wet-Bulb Globe Temperature (WBGT) is a more comprehensive measure used by the U.S. military, OSHA guidance, and athletic organizations that also accounts for solar radiation (black globe temperature), wind, and ambient temperature. Outdoors in sunshine, WBGT = 0.7×Tnwb + 0.2×Tg + 0.1×Tdb (natural wet-bulb, globe and dry-bulb temperatures). WBGT is the gold standard for assessing heat stress during physical activity but requires specialized instruments — the heat index is a practical public approximation using commonly available weather data.',
      },
      {
        question: 'When should I call 911 for heat-related illness?',
        answer: 'Call 911 immediately if someone shows signs of heatstroke: hot, red, dry skin (no sweating despite heat); body temperature above 103°F; rapid, strong pulse; confusion, altered mental state, or slurred speech; dizziness or fainting; nausea and vomiting; or loss of consciousness. Heatstroke is life-threatening and needs emergency treatment. While waiting for EMS: move the person to shade or AC, remove excess clothing, apply ice packs to neck, armpits, and groin (major blood vessels near skin surface), and cool with water. Do NOT give fluids if the person is confused or unconscious.',
      },
      {
        question: 'How does the heat index affect children and the elderly differently?',
        answer: 'Infants and children under 4 are at highest risk because they have a higher surface-area-to-body-mass ratio (absorbing more environmental heat), produce more metabolic heat per pound during activity, and have immature thermoregulatory systems. Older adults (65+) are the second highest-risk group because their sweat glands become less effective with age, they often take medications that impair thermoregulation (beta blockers, diuretics, antihistamines), and they may have reduced thirst sensation. For both groups, heat index as low as 90°F can be dangerous. Never leave children or pets in parked cars — the inside of a parked car can heat up by roughly 20°F in the first 10 minutes.',
      },
      {
        question: 'Can you acclimatize to high heat index conditions?',
        answer: 'Yes, the human body undergoes physiological adaptations to heat over 7-14 days of repeated exposure. This includes: a higher sweat rate, earlier onset of sweating at lower core temperatures, reduced sodium concentration in sweat, expanded blood plasma volume, and reduced heart rate at a given workload. OSHA recommends a "20% rule" for new outdoor workers: spend only 20% of day 1 doing heavy work in heat, increasing by 20% per day over 5 days.',
      },
      {
        question: 'Why are nighttime heat index values just as dangerous during a heat wave?',
        answer: 'Nighttime heat index values above 80°F prevent the body from recovering from daytime heat stress, causing a cumulative heat load that becomes increasingly dangerous over consecutive days. Urban heat island effects keep nighttime temperatures 5-10°F higher than surrounding rural areas due to heat stored in concrete and asphalt. For people without AC, use damp sheets (evaporative cooling), cool showers before bed, and a bowl of ice in front of a fan.',
      },
    ],
    citations: [
      { source: 'NWS WPC - The Heat Index Equation', url: 'https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml' },
      { source: 'NOAA - Heat Index', url: 'https://www.weather.gov/ama/heatindex' },
      { source: 'Wikipedia - Heat Index', url: 'https://en.wikipedia.org/wiki/Heat_index' },
      { source: 'OSHA - Heat Illness Prevention', url: 'https://www.osha.gov/heat-exposure' },
    ],
  },
};

export default heatIndexConfig;
