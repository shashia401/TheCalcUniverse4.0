import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SpeedPanel from './SpeedPanel';

const distanceToM = (v: number, u: string): number => {
  switch (u) {
    case 'mi': return v * 1609.344;
    case 'km': return v * 1000;
    case 'm': return v;
    case 'ft': return v * 0.3048;
    default: return v;
  }
};

const timeToS = (v: number, u: string): number => {
  switch (u) {
    case 'hr': return v * 3600;
    case 'min': return v * 60;
    case 'sec': return v;
    default: return v;
  }
};

const fmt = (n: number): string => {
  if (!isFinite(n)) return 'Infinity';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toFixed(6)).toString();
};

const formatPace = (minutesPerUnit: number): string => {
  if (!isFinite(minutesPerUnit) || minutesPerUnit <= 0) return '--:--';
  const totalSec = Math.round(minutesPerUnit * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const speedConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Solve for',
      type: 'select',
      required: true,
      options: [
        { label: 'Speed (S)', value: 'calcSpeed' },
        { label: 'Distance (D)', value: 'calcDistance' },
        { label: 'Time (T)', value: 'calcTime' },
      ],
      helpText: 'Select which value you want to calculate',
    },
    {
      id: 'distance',
      label: 'Distance',
      type: 'number',
      placeholder: 'e.g. 60',
      step: 0.1,
      inputMode: 'decimal',
      required: true,
      showWhen: (v) => v.mode === 'calcSpeed' || v.mode === 'calcTime',
      helpText: 'Enter the distance traveled',
    },
    {
      id: 'distanceUnit',
      label: 'Distance Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'mi', value: 'mi' },
        { label: 'km', value: 'km' },
        { label: 'm', value: 'm' },
        { label: 'ft', value: 'ft' },
      ],
      showWhen: (v) => v.mode !== 'calcDistance',
      helpText: 'Select the unit of distance',
    },
    {
      id: 'time',
      label: 'Time',
      type: 'number',
      placeholder: 'e.g. 1',
      step: 0.1,
      inputMode: 'decimal',
      required: true,
      showWhen: (v) => v.mode === 'calcSpeed' || v.mode === 'calcDistance',
      helpText: 'Enter the time taken',
    },
    {
      id: 'timeUnit',
      label: 'Time Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'Hours', value: 'hr' },
        { label: 'Minutes', value: 'min' },
        { label: 'Seconds', value: 'sec' },
      ],
      showWhen: (v) => v.mode !== 'calcTime',
      helpText: 'Select the unit of time',
    },
    {
      id: 'speed',
      label: 'Speed',
      type: 'number',
      placeholder: 'e.g. 60',
      step: 0.1,
      inputMode: 'decimal',
      required: true,
      showWhen: (v) => v.mode === 'calcDistance' || v.mode === 'calcTime',
      helpText: 'Enter the speed value',
    },
    {
      id: 'speedUnit',
      label: 'Speed Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'mph', value: 'mph' },
        { label: 'km/h', value: 'kmh' },
        { label: 'm/s', value: 'ms' },
        { label: 'knots', value: 'knots' },
      ],
      showWhen: (v) => v.mode === 'calcDistance' || v.mode === 'calcTime',
      helpText: 'Select the unit of speed',
    },
    {
      id: 'timeResultUnit',
      label: 'Time Output Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'Hours', value: 'hr' },
        { label: 'Minutes', value: 'min' },
        { label: 'Seconds', value: 'sec' },
      ],
      showWhen: (v) => v.mode === 'calcTime',
      helpText: 'Select the unit for the calculated time',
    },
    {
      id: 'distanceResultUnit',
      label: 'Distance Output Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'mi', value: 'mi' },
        { label: 'km', value: 'km' },
        { label: 'm', value: 'm' },
        { label: 'ft', value: 'ft' },
      ],
      showWhen: (v) => v.mode === 'calcDistance',
      helpText: 'Select the unit for the calculated distance',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'calcSpeed';

    // Convert input speed to m/s
    const speedToMs = (v: number, u: string): number => {
      switch (u) {
        case 'mph': return v / 2.23694;
        case 'kmh': return v / 3.6;
        case 'ms': return v;
        case 'knots': return v / 1.94384;
        default: return v;
      }
    };


    const timeUnitLabel = (u: string): string => {
      switch (u) {
        case 'hr': return 'hours';
        case 'min': return 'minutes';
        case 'sec': return 'seconds';
        default: return u;
      }
    };

    const distUnitLabel = (u: string): string => {
      switch (u) {
        case 'mi': return 'mi';
        case 'km': return 'km';
        case 'm': return 'm';
        case 'ft': return 'ft';
        default: return u;
      }
    };

    if (mode === 'calcSpeed') {
      const distance = parseFloat(values.distance);
      const time = parseFloat(values.time);
      if (isNaN(distance) || isNaN(time) || time === 0) return [];

      const distM = distanceToM(distance, values.distanceUnit || 'mi');
      const timeS = timeToS(time, values.timeUnit || 'hr');
      const speedMs = distM / timeS;

      // Compute all speed units
      const mph = speedMs * 2.23694;
      const kmh = speedMs * 3.6;
      const ms = speedMs;
      const knots = speedMs * 1.94384;

      // Pace calculations
      const paceMinMile = 60 / mph;
      const paceMinKm = 60 / kmh;

      const results: Array<{ id: string; label: string; value: string; color?: string; highlight?: boolean }> = [
        {
          id: 'result',
          label: 'Speed (S)',
          value: `${fmt(mph)} mph`,
          highlight: true,
          color: 'positive' as const,
        },
        { id: 'speedKmh', label: 'Speed (km/h)', value: `${fmt(kmh)} km/h`, color: 'neutral' as const },
        { id: 'speedMs', label: 'Speed (m/s)', value: `${fmt(ms)} m/s`, color: 'neutral' as const },
        { id: 'speedKnots', label: 'Speed (knots)', value: `${fmt(knots)} kn`, color: 'neutral' as const },
        { id: 'distance', label: 'Distance', value: `${fmt(distance)} ${distUnitLabel(values.distanceUnit || 'mi')}`, color: 'neutral' as const },
        { id: 'time', label: 'Time', value: `${fmt(time)} ${timeUnitLabel(values.timeUnit || 'hr')}`, color: 'neutral' as const },
        { id: 'formula', label: 'Formula', value: 'S = D / T', color: 'neutral' as const },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `S = ${fmt(distM)} m ÷ ${fmt(timeS)} s = ${fmt(ms)} m/s = ${fmt(mph)} mph`,
          color: 'neutral' as const,
        },
      ];

      // Add pace
      if (isFinite(paceMinMile) && paceMinMile > 0) {
        results.push({
          id: 'paceMile',
          label: 'Pace (min/mi)',
          value: formatPace(paceMinMile),
          color: 'neutral' as const,
        });
      }
      if (isFinite(paceMinKm) && paceMinKm > 0) {
        results.push({
          id: 'paceKm',
          label: 'Pace (min/km)',
          value: formatPace(paceMinKm),
          color: 'neutral' as const,
        });
      }

      return results.map(r => ({
        ...r,
        color: (r.color || 'neutral') as 'positive' | 'negative' | 'neutral',
      }));
    }

    if (mode === 'calcDistance') {
      const speed = parseFloat(values.speed);
      const time = parseFloat(values.time);
      if (isNaN(speed) || isNaN(time)) return [];

      const speedMs = speedToMs(speed, values.speedUnit || 'mph');
      const timeS = timeToS(time, values.timeUnit || 'hr');
      const distM = speedMs * timeS;

      const outputUnit = values.distanceResultUnit || 'mi';
      let distOut: number;
      switch (outputUnit) {
        case 'mi': distOut = distM / 1609.344; break;
        case 'km': distOut = distM / 1000; break;
        case 'm': distOut = distM; break;
        case 'ft': distOut = distM / 0.3048; break;
        default: distOut = distM;
      }

      return [
        {
          id: 'result',
          label: 'Distance (D)',
          value: `${fmt(distOut)} ${outputUnit}`,
          highlight: true,
          color: 'positive' as const,
        },
        { id: 'formula', label: 'Formula', value: 'D = S × T', color: 'neutral' as const },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `D = ${fmt(speedMs)} m/s × ${fmt(timeS)} s = ${fmt(distM)} m = ${fmt(distOut)} ${outputUnit}`,
          color: 'neutral' as const,
        },
      ];
    }

    if (mode === 'calcTime') {
      const distance = parseFloat(values.distance);
      const speed = parseFloat(values.speed);
      if (isNaN(distance) || isNaN(speed) || speed === 0) return [];

      const distM = distanceToM(distance, values.distanceUnit || 'mi');
      const speedMs = speedToMs(speed, values.speedUnit || 'mph');
      const timeS = distM / speedMs;

      const outputUnit = values.timeResultUnit || 'hr';
      let timeOut: number;
      switch (outputUnit) {
        case 'hr': timeOut = timeS / 3600; break;
        case 'min': timeOut = timeS / 60; break;
        case 'sec': timeOut = timeS; break;
        default: timeOut = timeS;
      }

      return [
        {
          id: 'result',
          label: 'Time (T)',
          value: `${fmt(timeOut)} ${timeUnitLabel(outputUnit)}`,
          highlight: true,
          color: 'positive' as const,
        },
        { id: 'formula', label: 'Formula', value: 'T = D / S', color: 'neutral' as const },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `T = ${fmt(distM)} m ÷ ${fmt(speedMs)} m/s = ${fmt(timeS)} s = ${fmt(timeOut)} ${timeUnitLabel(outputUnit)}`,
          color: 'neutral' as const,
        },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SpeedPanel, { values, results });
  },
  educational: {
    formula: 'S = D / T  |  D = S × T  |  T = D / S',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><polygon points="160,25 55,175 265,175" fill="rgba(59,130,246,0.08)" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linejoin="round"/><line x1="160" y1="25" x2="160" y2="175" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="5,3"/><line x1="55" y1="175" x2="265" y2="175" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="160" y="75" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="28" font-weight="bold">S</text><text x="108" y="145" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="24" font-weight="bold">D</text><text x="212" y="145" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="24" font-weight="bold">T</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="10">Cover the unknown to get the formula</text></svg>',
      alt: 'Speed formula triangle showing S at top, D and T at bottom',
      caption: 'Speed formula triangle: S = D / T',
    },
    formulaDescription:
      'Speed is distance traveled per unit of time. The formula triangle shows the relationship between speed (S), distance (D), and time (T). Cover the variable you want to solve for. This calculator also converts between mph, km/h, m/s, and knots, and computes pace (min/mile and min/km) for runners and cyclists.',
    variables: [
      { symbol: 'S', name: 'Speed', description: 'Rate of motion — the distance covered divided by the time taken. Common units: mph (miles per hour), km/h (kilometers per hour), m/s (meters per second), and knots (nautical miles per hour).' },
      { symbol: 'D', name: 'Distance', description: 'The total length of the path traveled. Common units: miles (mi), kilometers (km), meters (m), and feet (ft). For circular or return trips, distance is the total path length, not the displacement.' },
      { symbol: 'T', name: 'Time', description: 'The duration of travel. Common units: hours (hr), minutes (min), and seconds (sec). For calculations involving mixed units (e.g., 2 hours 30 minutes), convert everything to a single unit before entering.' },
    ],
    howToUse: [
      'Select what you want to solve for: Speed, Distance, or Time using the mode dropdown.',
      'Enter the two known values along with their units (and the desired output unit when solving for Distance or Time).',
      'View the primary result highlighted at the top, plus all conversions: speed in mph, km/h, m/s, and knots simultaneously.',
      'Runners and cyclists: check the Pace section for min/mile and min/km splits — essential for race planning and training runs.',
      'The steps section shows the full unit conversion chain so you can verify the math or learn the conversion factors.',
    ],
    workedExamples: [
      {
        scenario: 'Sarah is training for her first marathon and wants to know what pace she needs to maintain to finish in under 4 hours. A marathon is 26.2 miles. What average speed and pace does she need?',
        inputs: { mode: 'calcSpeed', distance: '26.2', distanceUnit: 'mi', time: '4', timeUnit: 'hr' },
        result: 'Speed = 6.55 mph (10.541 km/h, 4.712 m/s, 5.693 knots). Pace = 9:10 min/mile (5:42 min/km). Sarah needs to maintain 6.55 mph to finish a 26.2-mile marathon in exactly 4 hours.',
        insight: 'Required speed: 6.55 mph. Pace: approximately 9:10 min/mile. Sarah should target a 9:00-9:10 min/mile pace to finish just under 4 hours (approximately 3:59:30). Most marathon training plans recommend running your long runs 30-90 seconds per mile slower than goal pace, so her training long runs should be at 10:00-10:40 min/mile. The pace required (9:10) is achievable for a dedicated amateur runner with 16-20 weeks of training.',
      },
      {
        scenario: 'Captain Rodriguez is navigating a cargo ship from Los Angeles to Honolulu, a distance of 2,225 nautical miles. The ship cruises at 18 knots. Weather forecasts show a 2-knot head current for the first 500 miles. How long will the total voyage take?',
        inputs: { mode: 'calcTime', distance: '2225', distanceUnit: 'mi', speed: '18', speedUnit: 'knots', timeResultUnit: 'hr' },
        result: 'Time = 123.611111 hours (approximately 5.15 days or 5 days 3 hours 40 minutes). At 18 knots, the ship covers 2,225 nautical miles in about 123.6 hours. With head current, total time increases to ~127 hours.',
        insight: 'At 18 knots (18 nautical miles per hour), 2,225 nautical miles takes about 123.6 hours (5.15 days) in ideal conditions. However, with the head current: first 500 miles at effective 16 knots = 31.25 hours; remaining 1,725 miles at 18 knots = 95.8 hours; total ≈ 127.1 hours (5.3 days). The head current adds about 3.5 hours. Captains use speed-time-distance calculations for fuel planning, ETA communication, and crew shift scheduling.',
      },
      {
        scenario: 'Tom commutes 35 miles to work each way. His average driving speed during rush hour is 28 mph including traffic lights. He starts work at 9:00 AM. What time does he need to leave home, and how much time does he spend commuting per year (250 work days)?',
        inputs: { mode: 'calcTime', distance: '35', distanceUnit: 'mi', speed: '28', speedUnit: 'mph', timeResultUnit: 'min' },
        result: 'Time = 75 minutes (1 hour 15 minutes) each way. Tom must leave by 7:45 AM. Daily round trip = 150 minutes (2.5 hours). Annual commute = 2.5 h x 250 = 625 hours (26 full 24-hour days) per year.',
        insight: 'Each one-way commute takes 75 minutes (1 hour 15 minutes), so Tom needs to leave by 7:45 AM. Daily round trip: 150 minutes (2.5 hours). Annual commute time: 2.5 hours × 250 days = 625 hours (26 full 24-hour days per year). At a more typical highway speed of 60 mph (no traffic), the same commute would be only 35 minutes each way, saving 80 minutes per day — over 333 hours per year. This is why flexible work hours and remote work provide such significant quality-of-life improvements.',
      },
    ],
    proTips: [
      'The pace outputs (min/mile and min/km) are the inverse of speed — as speed increases, pace decreases. A 6 mph speed = 10:00 min/mile pace; 7.5 mph = 8:00 min/mile. Use pace for race planning because it is easier to track with a stopwatch.',
      'For multi-segment trips (e.g., city driving then highway), calculate each segment separately and sum the times. The average speed for the whole trip is total distance / total time — NOT the average of the speeds. Driving 30 miles at 60 mph (30 min) and 30 miles at 30 mph (60 min) gives an average speed of 60 mi / 1.5 hr = 40 mph, not (60+30)/2 = 45 mph.',
      'When using the knots speed unit, remember that 1 knot = 1 nautical mile per hour, and 1 nautical mile = 1.15078 statute miles. This distinction matters for maritime and aviation calculations — entering statute miles with knots as the speed unit will give slightly incorrect results.',
      'For very high speeds (supersonic, spacecraft), the formula still works but consider whether you need to account for relativistic effects. At speeds below about 30 million mph (5% of light speed), classical S = D/T is accurate to within 0.1%.',
    ],
    limitations: [
      'This calculator computes average speed over an entire journey. Real-world travel involves acceleration, deceleration, stops, and varying speeds — the average speed may differ significantly from the instantaneous speed at any given moment.',
      'For driving time estimates, the calculator does not account for traffic congestion, rest stops, fuel stops, construction zones, or weather conditions. Always add buffer time (typically 15-25%) for long road trips.',
      'The pace calculation assumes constant speed throughout. In real running and cycling, pace varies with terrain (hills slow you down more than flats speed you up), wind, temperature, and fatigue — use the calculated pace as a target, not a guarantee.',
      'This calculator uses classical mechanics (S = D/T). For space travel, high-speed rail, or particle physics applications, you may need to account for relativistic time dilation at speeds approaching the speed of light.',
      'Unit conversions use standard conversion factors. Slight rounding differences may occur at extreme precision (beyond 6 decimal places), though this does not affect any practical application.',
    ],
    quickReference: [
      { label: '1 mph to km/h', value: '1.609 km/h' },
      { label: '1 km/h to mph', value: '0.621 mph' },
      { label: '1 mph to m/s', value: '0.447 m/s' },
      { label: '1 knot to mph', value: '1.151 mph' },
      { label: '1 m/s to km/h', value: '3.6 km/h' },
      { label: 'Walking pace', value: '3-4 mph (20:00-15:00 min/mile)' },
      { label: 'Running pace', value: '6-8 mph (10:00-7:30 min/mile)' },
      { label: 'Highway typical', value: '55-70 mph (88-112 km/h)' },
      { label: 'Sound speed (sea level)', value: '767 mph (1,235 km/h)' },
      { label: 'Speed of light', value: '671 million mph (1.08B km/h)' },
    ],
    commonUses: [
      'Running and cycling — calculate required pace to achieve a target race finish time, or determine how long a training route will take',
      'Road trip planning — estimate drive times, fuel stops, and arrival times for long-distance travel with realistic average speeds',
      'Maritime navigation — convert between knots and statute miles for voyage planning, ETA calculations, and fuel consumption estimates',
      'Aviation — compute flight times, ground speed with wind correction, and time-to-destination for flight planning',
      'Emergency response planning — determine ambulance, fire, and police response times based on station location and average urban speeds',
    ],
    faqs: [
      {
        question: 'What is the difference between speed and pace?',
        answer: 'Speed measures distance per unit time (e.g., mph, km/h), while pace measures time per unit distance (e.g., min/mile, min/km). Pace is the inverse of speed and is commonly used in running: a 10:00 min/mile pace equals 6 mph. To convert speed to pace: pace (min/mile) = 60 / speed (mph). Pace is preferred by runners because it is easier to track with a stopwatch — you can check if each mile split is on target without doing math in your head.',
      },
      {
        question: 'How do I convert between speed units?',
        answer: '1 mph = 1.60934 km/h = 0.44704 m/s = 0.868976 knots. To convert mph to km/h, multiply by 1.60934. To convert km/h to m/s, divide by 3.6. 1 knot = 1 nautical mile per hour = 1.15078 statute miles per hour. The most common conversions: 60 mph = 96.6 km/h = 26.8 m/s = 52.1 knots. For a rough estimate, 100 km/h = 62 mph and 10 m/s = 36 km/h.',
      },
      {
        question: 'What are typical running and cycling speeds?',
        answer: 'Walking: 3-4 mph (20:00-15:00 min/mile). Jogging: 5-6 mph (12:00-10:00 min/mile). Running: 6-8 mph (10:00-7:30 min/mile). Elite marathon: ~13 mph (4:37 min/mile). Casual cycling: 10-14 mph (flat road). Pro cycling: 25-28 mph on flat terrain, 40+ mph on descents. Triathlon bike leg: 20-24 mph for competitive amateurs.',
      },
      {
        question: 'What is the difference between average speed and instantaneous speed?',
        answer: 'Average speed = total distance / total time for an entire journey, including stops, slowdowns, and speed changes. Instantaneous speed = the speed at a single moment in time, which your speedometer displays. For a trip with a mix of city (20 mph) and highway (65 mph) driving, the average speed might be 40 mph even though you spent most of the time at 65 — because slow segments disproportionately affect the average. This calculator computes average speed, which is what matters for ETA and trip planning.',
      },
      {
        question: 'Why does my GPS show a different speed than my car speedometer?',
        answer: 'Car speedometers are allowed by regulation to over-read by up to 10% + 4 km/h but must never under-read. A speedometer showing 70 mph may correspond to an actual speed of 64-70 mph. GPS calculates speed from position changes and is typically accurate to within 0.1 mph under good signal conditions. The discrepancy exists because tire wear, tire pressure, and tire size changes all affect the mechanical speedometer reading. GPS speed is generally more accurate but may lag during rapid acceleration or lose accuracy in tunnels and urban canyons.',
      },
      {
        question: 'How do I calculate my marathon finish time?',
        answer: 'Use the formula: Time (hours) = 26.2 / Speed (mph). For example, at 6 mph (10:00 min/mile pace): Time = 26.2 / 6 = 4.367 hours = 4 hours 22 minutes. Alternatively, multiply your pace in minutes by 26.2: at 10:00 min/mile pace, 10 × 26.2 = 262 minutes = 4 hours 22 minutes. Use the calculator\'s calcTime mode: enter distance = 26.2 mi, speed = your target mph, time output = minutes. For half-marathons, use 13.1 miles. For 5K and 10K races, the same principle applies but in kilometers: Time = distance (km) / speed (km/h).',
      },
      {
        question: 'What is a knot and why is it used instead of mph?',
        answer: 'A knot is one nautical mile per hour (1.15078 mph). It is used in maritime and aviation navigation because 1 nautical mile = 1 minute of latitude (1/60th of a degree), making chart reading and celestial navigation much simpler. On a nautical chart, you can measure distance with dividers against the latitude scale — each minute of latitude equals exactly 1 nautical mile. This direct relationship between distance and angular measurement is why knots persist: a ship traveling at 10 knots for 1 hour covers 10 minutes of latitude, which is trivially easy to plot on a chart.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Speed', url: 'https://en.wikipedia.org/wiki/Speed' },
      { source: 'Wolfram MathWorld', title: 'Speed', url: 'https://mathworld.wolfram.com/Speed.html' },
    ],
  },
};

export default speedConfig;
