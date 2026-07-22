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
      inputMode: 'decimal',
      helpText: 'Enter the current outdoor air temperature. Use the unit selector to switch between imperial (°F) and metric (°C).',
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
      helpText: 'Select the unit for the air temperature. The formula uses Fahrenheit — the calculator converts Celsius values automatically.',
    },
    {
      id: 'windSpeed',
      label: 'Wind Speed',
      type: 'number',
      placeholder: '15',
      min: 0,
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      showWhen: (v) => parseFloat(v.temperature) <= 50,
      helpText: 'Enter the current wind speed. The NWS formula requires at least 3 mph — lower speeds have no additional cooling effect.',
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
      showWhen: (v) => parseFloat(v.temperature) <= 50,
      helpText: 'Select imperial (mph) or metric (km/h) for wind speed. The calculator auto-converts metric values to mph for the NWS formula.',
    },
  ],
  calculate: (values) => {
    const temp = parseFloat(values.temperature);
    const ws = parseFloat(values.windSpeed);
    const tempUnit = values.tempUnit || 'F';
    const speedUnit = values.speedUnit || 'mph';

    if (isNaN(temp) || isNaN(ws) || ws < 0) return [];

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
      {
        id: 'chartData',
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
      'The National Weather Service (NWS) wind chill formula calculates how cold it feels when wind is combined with cold air. Wind accelerates heat loss from exposed skin, making the air feel significantly colder than the actual temperature. The formula was developed in 2001, replacing the older Siple-Passel formula after extensive wind tunnel research with human volunteers. The formula applies only when the temperature is at or below 50°F and wind speed is at least 3 mph. Above 50°F, the cooling effect changes character and the heat index formula becomes more relevant. The key insight: wind strips away the thin boundary layer of warm air that surrounds exposed skin, accelerating convective heat loss.',
    variables: [
      { symbol: 'T', name: 'Air Temperature', description: 'The actual air temperature in degrees Fahrenheit. Must be 50°F or below for the formula to apply.' },
      { symbol: 'V', name: 'Wind Speed', description: 'The wind speed in miles per hour at 33 feet (standard anemometer height). Must be at least 3 mph for wind chill effect.' },
      { symbol: 'WindChill', name: 'Wind Chill Temperature', description: 'How cold it feels on exposed skin in degrees Fahrenheit. Lower values indicate faster frostbite risk.' },
    ],
    howToUse: [
      'Select your preferred temperature unit — imperial (°F) or metric (°C). The calculator auto-converts Celsius values.',
      'Enter the current air temperature in your chosen unit.',
      'Select imperial (mph) or metric (km/h) for wind speed, then enter the wind speed value.',
      'The calculator applies the NWS wind chill formula and shows the feels-like temperature in both Fahrenheit and Celsius.',
      'Review the frostbite risk category — this tells you how long exposed skin can safely be exposed.',
    ],
    explanation:
      'Wind chill is based on the rate of heat loss from exposed skin caused by wind and cold. As wind increases, it draws heat away from the body, cooling the skin surface faster. The NWS wind chill formula was developed by scientists at the Defence and Civil Institute of Environmental Medicine in Toronto through research involving human volunteers and face cooling measurements in a controlled wind tunnel. The original concept was invented by Antarctic explorer Paul Siple in the mid-20th century during his expeditions; Siple coined the term "wind chill" in his 1945 doctoral dissertation. Frostbite can occur in minutes when wind chill temperatures are very low. The risk categories help outdoor workers, athletes, and recreationists make informed decisions about exposure time and protective clothing. Wind chill applies only to people and animals — inanimate objects like car radiators or pipes will not cool below the actual air temperature, though wind can accelerate the rate at which they reach ambient temperature. For runners and cyclists, effective wind speed equals actual wind speed plus their forward speed, meaning a cyclist going 15 mph into a 10 mph wind experiences a 25 mph effective wind. For wet skin (sweat or rain), cooling accelerates dramatically because water conducts heat roughly 25 times faster than air — this combination creates a hypothermia risk even in 50°F weather. The NWS discontinued the old wind chill equivalent temperature index in 2001 because it overestimated the cooling effect; the current formula produces warmer (but more accurate) wind chill values than the pre-2001 version.',
    workedExamples: [
      {
        scenario: 'A winter hiker in Colorado at 10°F with a steady 20 mph wind. What does it feel like and is frostbite a concern?',
        inputs: { temperature: '10', tempUnit: 'F', windSpeed: '20', speedUnit: 'mph' },
        result: 'Wind chill: −9°F — frostbite possible in 30 minutes.',
        insight: 'At −9°F wind chill with frostbite possible in 30 minutes, the hiker needs full face protection (balaclava, goggles), insulated gloves, and should schedule rest stops no more than 25 minutes apart. The 10°F temperature feels 19 degrees colder due to wind.',
      },
      {
        scenario: 'A construction worker in Chicago at −5°F with a 15 mph wind. How dangerous are the conditions?',
        inputs: { temperature: '-5', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' },
        result: 'Wind chill: −26°F — frostbite possible in 10 minutes.',
        insight: 'At −26°F, the frostbite time drops to about 10 minutes. OSHA recommends that outdoor workers take warm-up breaks every 30 minutes at this level and wear insulated, waterproof boots. Workers should use the buddy system to check each other for signs of frostbite (white or grayish-yellow skin, numbness) on cheeks, ears, nose, and fingers. Tool handling becomes difficult as dexterity decreases significantly below −10°F wind chill; thick gloves reduce fine motor control, so tasks requiring precision should be minimized.',
      },
      {
        scenario: 'A cross-country skier at 15°F with an 8 mph wind, moving at 8 mph. What is the effective wind chill?',
        inputs: { temperature: '15', tempUnit: 'F', windSpeed: '8', speedUnit: 'mph' },
        result: 'Wind chill: 5°F — effective wind chill ~-1°F due to self-generated wind.',
        insight: 'Even though the 15°F air temperature feels manageable standing still, the skier experiences an effective wind chill near −1°F due to self-generated wind. This is a common danger in endurance sports — the athlete generates enough heat from exertion to stay comfortable but exposed skin (especially ears, nose, and any gaps between goggles and hat) remains at full risk. Layering with a windproof outer shell is essential; the skier should carry an extra insulating layer for stops when metabolic heat production drops.',
      },
    ],
    proTips: [
      'Layer clothing with a windproof outer shell — wind chill only affects exposed skin, so any wind-resistant barrier eliminates the cooling effect on covered areas completely.',
      'The wind chill formula uses wind speed at 33 feet (10 meters) — ground-level wind speeds at face height (5 feet) are roughly 2/3 of the reported value, but the formula conservative enough to use the full reported wind speed.',
      'When combining outdoor exercise with cold wind, your metabolic heat production offsets some of the cooling, but any exposed skin still experiences the full calculated wind chill. Cover your face, ears, and wrists.',
      'For driving safety: wind chill does NOT cause car radiators, batteries, or engine blocks to reach a lower temperature than the ambient air. However, vehicles cool to ambient temperature faster in windy conditions. If the air temperature is 35°F, your radiator coolant will NOT freeze regardless of a −10°F wind chill.',
      'The wind chill effect is strongest at very cold temperatures. The difference between 0°F with no wind and 0°F with 30 mph wind is about 26°F in perceived temperature. The same 30 mph wind at 40°F creates only about a 12°F difference — wind matters more when it is already cold.',
      'Infants and the elderly are more susceptible to wind chill because they produce less metabolic heat and have less subcutaneous fat insulation. For every 5 mph of wind above 10 mph at temperatures below freezing, reduce outdoor exposure time for these groups by roughly 10 minutes from the standard recommendation.',
    ],
    limitations: [
      'When not to use: For determining pipe freeze risk, battery performance, or equipment cold starts, use actual air temperature — not wind chill. Inanimate objects do not experience wind chill; they only cool to ambient temperature faster in wind.',
      'The NWS wind chill formula is only valid for air temperatures at or below 50°F and wind speeds at or above 3 mph. Outside these ranges, the wind chill equals the actual air temperature.',
      'Wind chill does not account for solar radiation. On sunny days with clear skies, the feels-like temperature can be 10-15°F warmer than the calculated wind chill. The formula assumes nighttime/shaded conditions.',
      'The formula does not account for humidity or precipitation. Wet skin (rain, snow melt, sweat) dramatically accelerates heat loss beyond what the formula predicts because water conducts heat ~25 times faster than air.',
      'Wind chill only applies to bare skin. Properly clothed areas experience negligible wind chill effect. A windproof garment essentially eliminates the wind chill for the skin it covers.',
      'The formula assumes a human face (the most exposed body part) at average height (5 feet). Taller individuals may experience slightly different effective wind speeds at face level due to the wind speed gradient near the ground.',
    ],
    quickReference: [
      { label: '40°F + 5 mph wind', value: 'Feels like 36°F (mild)' },
      { label: '30°F + 15 mph wind', value: 'Feels like 19°F (cold)' },
      { label: '20°F + 20 mph wind', value: 'Feels like 4°F (very cold)' },
      { label: '10°F + 25 mph wind', value: 'Feels like −11°F (frostbite in 30 min)' },
      { label: '0°F + 30 mph wind', value: 'Feels like −26°F (frostbite in 10 min)' },
      { label: '−10°F + 20 mph wind', value: 'Feels like −35°F (frostbite in 5 min)' },
      { label: '−20°F + 15 mph wind', value: 'Feels like −45°F (frostbite in <5 min)' },
      { label: 'Wind chill vs objects', value: 'Objects cool to ambient temp only' },
    ],
    commonUses: [
      'Winter outdoor recreation — hikers, skiers, and snowmobilers use wind chill to plan clothing layers and determine safe exposure times for their activity level.',
      'Construction and utility work — job site safety officers use wind chill to schedule warm-up breaks according to OSHA cold stress guidelines, typically starting at wind chills below −18°F.',
      'School recess and bus stop decisions — school districts use wind chill thresholds (typically −10°F to −20°F) to decide whether to delay school, cancel outdoor recess, or keep students indoors.',
      'Livestock and pet care — farmers and pet owners use wind chill to determine when animals need shelter, windbreaks, or supplemental heat to prevent frostbite on ears, combs, wattles, and paw pads.',
      'Marathon and endurance race planning — race directors consult wind chill forecasts to decide whether to delay starts, shorten courses, or require gear checks for participants in cold-weather events.',
    ],
    faqs: [
      {
        question: 'Does wind chill affect inanimate objects?',
        answer: 'No. Wind chill only affects living things that generate their own heat. Cars, pipes, and buildings will only cool to the actual air temperature, though wind can help them reach that temperature faster. Never use wind chill to predict when pipes might freeze — use the actual temperature instead.',
      },
      {
        question: 'Why does the formula only apply below 50°F and above 3 mph?',
        answer: 'The NWS wind chill formula was designed specifically for cold weather conditions based on wind tunnel testing. Above 50°F, the wind cooling effect transitions into what is better described by the heat index or comfort calculations. Below 3 mph, wind has negligible additional cooling effect beyond the ambient temperature — in these ranges, the wind chill is simply the actual air temperature.',
      },
      {
        question: 'What is the difference between wind chill and the "feels like" temperature?',
        answer: 'Wind chill is specifically the cooling effect of wind on exposed skin in cold weather, calculated using only temperature and wind speed. The "feels like" temperature (also called the apparent temperature) is a more general concept that combines wind chill in winter and heat index in summer. Some weather services, like AccuWeather, use a combined RealFeel temperature that accounts for wind, humidity, solar radiation, and precipitation for all temperatures — giving a single year-round "feels like" number.',
      },
      {
        question: 'How quickly can frostbite occur at different wind chill values?',
        answer: 'Frostbite onset time shortens dramatically as wind chill drops: above −18°F the risk is low for short exposures; at −18°F to −27°F, frostbite possible in about 30 minutes; at −28°F to −39°F, it drops to 10 minutes; below −40°F, frostbite can occur in 5 minutes; below −60°F, exposed skin can freeze in under 2 minutes. These times assume bare skin — any covering extends them significantly. The first sign of frostnip (reversible surface freezing) is numbness and a white, waxy appearance of the skin. If you notice these signs, warm the area with body heat (tuck fingers in armpits, cover ears with hands) — do NOT rub frozen skin, as ice crystals in the tissue can cause additional damage.',
      },
      {
        question: 'How does wind chill affect pets and livestock differently than humans?',
        answer: 'Pets and livestock are affected by wind chill differently depending on fur thickness, size, and species. Dogs with thick double coats (Huskies, Malamutes) have natural insulation providing protection down to very low temperatures, but are still at risk for frostbite on ears, paw pads, and noses. Short-haired breeds and small dogs are much more vulnerable due to less insulation and a higher surface-area-to-volume ratio. Livestock like cattle grow thicker winter coats, but wind disrupts the trapped warm air layer — cattle need about 1% more feed for each degree below their Lower Critical Temperature (about 32°F with no wind). Poultry combs and wattles are especially vulnerable; windbreaks are essential for all outdoor animals in cold weather.',
      },
      {
        question: 'How can I calculate effective wind chill when running or cycling?',
        answer: 'When you run or cycle, your forward motion adds to the effective wind speed. The effective wind speed = sqrt(wind² + speed² + 2×wind×speed×cos(θ)), where θ is the angle between your direction and the wind. If running directly into a 10 mph wind at 6 mph, effective wind = 16 mph. Running with the wind at your back at 10 mph into a 10 mph tailwind: effective wind ≈ 4 mph (the wind actually helps). A headwind of 15 mph at running speed 8 mph gives you 23 mph effective wind — equivalent to stationary wind chill but much colder. The wind chill this creates on your face, ears, and any exposed skin is real and dangerous even though your core body temperature may feel fine from exertion.',
      },
      {
        question: 'Can wind chill cause hypothermia even at above-freezing temperatures?',
        answer: 'Yes, absolutely. While the NWS wind chill formula only applies below 50°F, hypothermia can occur at temperatures as high as 50-60°F when combined with wind and wetness. This is the classic "hypothermia weather" scenario in outdoor survival: 50°F with rain and wind. Water conducts heat away from the body approximately 25 times faster than air of the same temperature. If your clothing gets wet and the wind is blowing, evaporative cooling combined with convection can drop your core temperature faster than your body can produce heat through shivering. The condition is called immersion hypothermia when water is involved. For boating, kayaking, and fishing in cool weather (air 40-60°F, water 35-55°F), always dress for the water temperature, not the air temperature — a sudden capsize can be fatal within 30-60 minutes due to cold water immersion, regardless of what the wind chill calculation says.',
      },
    ],
    citations: [
      { source: 'NOAA - Wind Chill', url: 'https://www.weather.gov/safety/cold-wind-chill' },
      { source: 'Wikipedia - Wind Chill', url: 'https://en.wikipedia.org/wiki/Wind_chill' },
      { source: 'OSHA - Cold Stress Guide', url: 'https://www.osha.gov/winter-weather/cold-stress' },
    ],
  },
};

export default windChillConfig;
