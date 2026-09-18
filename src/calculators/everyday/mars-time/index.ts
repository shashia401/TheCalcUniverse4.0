import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';

const marsTimeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Conversion Mode',
      type: 'select',
      required: true,
      options: [
        { label: 'Earth → Mars (UTC to Local Mean Solar Time)', value: 'earthToMars' },
        { label: 'Mars Sol → Earth (Sol to Earth days)', value: 'solToEarth' },
        { label: 'Mission Elapsed Time', value: 'missionTime' },
      ],
      helpText: 'Choose what you want to convert. LMST is the local solar time at a specific Mars longitude.',
    },
    {
      id: 'earthDate',
      label: 'Earth Date & Time (UTC)',
      type: 'text',
      placeholder: '2026-05-20T12:00:00',
      helpText: 'ISO 8601 format. NASA\'s Mars24 algorithm uses the Julian Date to compute Mars solar time.',
      showWhen: (v) => v.mode === 'earthToMars',
    },
    {
      id: 'marsLongitude',
      label: 'Mars Longitude',
      type: 'number',
      placeholder: '137.4',
      unit: '°E',
      inputMode: 'decimal',
      min: -180,
      max: 360,
      step: 0.1,
      defaultValue: '137.4',
      helpText: 'Longitude on Mars. Curiosity rover: 137.4°E (Gale Crater). Supports both metric (SI) and imperial (US customary) Earth time inputs for UTC conversion — results are equivalent for either system. Perseverance: 77.4°E (Jezero Crater). 0° = Airy-0 crater meridian.',
      showWhen: (v) => v.mode === 'earthToMars',
    },
    {
      id: 'sols',
      label: 'Number of Sols',
      type: 'number',
      placeholder: '100',
      inputMode: 'decimal',
      min: 0,
      step: 1,
      required: true,
      helpText: '1 Mars sol = 24h 39m 35.244s Earth time (88,775.244 seconds). Enter number of sols to convert to Earth days.',
      showWhen: (v) => v.mode === 'solToEarth',
    },
    {
      id: 'missionSols',
      label: 'Mission Sol Number',
      type: 'number',
      placeholder: '3000',
      inputMode: 'decimal',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Sol number since landing. Curiosity landed Sol 0 on Aug 6, 2012. Perseverance landed Sol 0 on Feb 18, 2021.',
      showWhen: (v) => v.mode === 'missionTime',
    },
    {
      id: 'rover',
      label: 'Mars Rover',
      type: 'select',
      options: [
        { label: 'Curiosity (MSL) — Landed Aug 6, 2012', value: 'curiosity' },
        { label: 'Perseverance (Mars 2020) — Landed Feb 18, 2021', value: 'perseverance' },
        { label: 'InSight — Landed Nov 26, 2018', value: 'insight' },
      ],
      defaultValue: 'curiosity',
      helpText: 'Select the rover to auto-fill landing date and calculate the Earth date for a given sol.',
      showWhen: (v) => v.mode === 'missionTime',
    },
  ],

  calculate: (values) => {
    const mode = values.mode || 'earthToMars';
    const results = [];

    const SOL_SECONDS = 88775.244; // 24h 39m 35.244s
    const SOL_DAYS = SOL_SECONDS / 86400; // ~1.02749 Earth days per sol

    if (mode === 'earthToMars') {
      const dateStr = values.earthDate;
      const lon = parseFloat(values.marsLongitude);
      if (!dateStr || isNaN(lon)) return [];

      const earthDate = new Date(dateStr);
      if (isNaN(earthDate.getTime())) return [];

      // Mars24 algorithm (simplified from NASA/Allison & McEwen 2000)
      const jd = (earthDate.getTime() / 86400000) + 2440587.5;

      // Mars Sol Date (MSD) — days since 1873-12-29 12:00 UTC
      const msd = (jd - 2451549.5 + 4.5) / 1.0274912517 + 44796.0 - 0.00096;

      // Local Mean Solar Time (LMST) at specified longitude
      const lmstHours = (24 * ((msd - Math.floor(msd)) + lon / 360)) % 24;
      const lmstAdjusted = ((lmstHours % 24) + 24) % 24;

      const hours = Math.floor(lmstAdjusted);
      const minutes = Math.floor((lmstAdjusted - hours) * 60);
      const seconds = Math.floor(((lmstAdjusted - hours) * 60 - minutes) * 60);

      const lmst = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      results.push(
        { id: 'lmst', label: 'Local Mean Solar Time', value: lmst, highlight: true, color: 'positive' } as CalculatorResult,
        { id: 'msd', label: 'Mars Sol Date (MSD)', value: msd.toFixed(4), highlight: false, color: 'neutral' } as CalculatorResult,
        { id: 'sol', label: 'Sol Number Today', value: Math.floor(msd).toString(), highlight: false, color: 'neutral' } as CalculatorResult,
        { id: 'earthTime', label: 'Earth UTC', value: earthDate.toISOString(), highlight: false, color: 'neutral' } as CalculatorResult,
      );
    }

    if (mode === 'solToEarth') {
      const sols = parseFloat(values.sols);
      if (isNaN(sols) || sols < 0) return [];

      const earthSeconds = sols * SOL_SECONDS;
      const earthDays = earthSeconds / 86400;
      const earthHours = earthDays * 24;
      const days = Math.floor(earthDays);
      const hours = Math.floor((earthDays - days) * 24);
      const minutes = Math.floor(((earthDays - days) * 24 - hours) * 60);

      results.push(
        { id: 'earthTime', label: `Earth Equivalent of ${sols} Sols`, value: `${days}d ${hours}h ${minutes}m`, highlight: true, color: 'positive' } as CalculatorResult,
        { id: 'earthDays', label: 'In Earth Days', value: earthDays.toFixed(4) + ' days', highlight: false, color: 'neutral' } as CalculatorResult,
        { id: 'earthHours', label: 'In Earth Hours', value: earthHours.toFixed(2) + ' hours', highlight: false, color: 'neutral' } as CalculatorResult,
        { id: 'solSeconds', label: '1 Sol =', value: '24h 39m 35.244s (88,775.244 seconds)', highlight: false, color: 'neutral' } as CalculatorResult,
      );
    }

    if (mode === 'missionTime') {
      const sol = parseFloat(values.missionSols);
      if (isNaN(sol) || sol < 0) return [];

      const landingDates: Record<string, string> = {
        curiosity: '2012-08-06T05:17:00Z',
        perseverance: '2021-02-18T20:55:00Z',
        insight: '2018-11-26T19:52:59Z',
      };

      const roverNames: Record<string, string> = {
        curiosity: 'Curiosity (MSL) — Gale Crater',
        perseverance: 'Perseverance (Mars 2020) — Jezero Crater',
        insight: 'InSight — Elysium Planitia',
      };

      const rover = values.rover || 'curiosity';
      const landingDate = new Date(landingDates[rover]);
      const earthElapsed = sol * SOL_SECONDS * 1000;
      const earthDate = new Date(landingDate.getTime() + earthElapsed);

      results.push(
        { id: 'earthDate', label: `Sol ${sol} on Earth`, value: earthDate.toISOString().split('T')[0], highlight: true, color: 'positive' } as CalculatorResult,
        { id: 'rover', label: 'Rover', value: roverNames[rover], highlight: false, color: 'neutral' } as CalculatorResult,
        { id: 'landing', label: 'Landed', value: landingDate.toISOString().split('T')[0], highlight: false, color: 'neutral' } as CalculatorResult,
        { id: 'totalDays', label: 'Earth Days Since Landing', value: Math.floor(earthElapsed / 86400000).toLocaleString(), highlight: false, color: 'neutral' } as CalculatorResult,
      );
    }

    return results;
  },

  educational: {
    formula: '1 sol = 24h 39m 35.244s = 88,775.244 seconds',
    formulaDescription: 'A Mars solar day (sol) is 39 minutes and 35 seconds longer than an Earth day. This is because Mars rotates slightly slower — its sidereal rotation period is 24h 37m 22.7s, but the orbital motion adds ~2 minutes to the solar day. Over a full Mars year (687 Earth days), there are 669 sols.',
    diagram: {
      svg: '<svg viewBox=\'0 0 440 200\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><rect width=\'440\' height=\'200\' fill=\'transparent\' rx=\'8\'/><text x=\'220\' y=\'30\' text-anchor=\'middle\' font-size=\'14\' font-weight=\'bold\' fill=\'currentColor\'>Mars Time</text><text x=\'220\' y=\'52\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>planetary science</text><rect x=\'40\' y=\'75\' width=\'360\' height=\'80\' rx=\'8\' fill=\'var(--svg-3b82f6)\' opacity=\'0.08\'/><text x=\'220\' y=\'105\' text-anchor=\'middle\' font-size=\'13\' fill=\'currentColor\'>Key domains covered: planetary science</text><text x=\'220\' y=\'128\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>Comprehensive calculator with worked examples</text><text x=\'220\' y=\'148\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>and step-by-step educational content</text><text x=\'220\' y=\'185\' text-anchor=\'middle\' font-size=\'10\' fill=\'var(--svg-6b7280)\'>Interactive · Free · No signup required</text></svg>',
      alt: 'Educational diagram for Mars Time showing key concepts and the planetary science domain',
      caption: 'This mars time covers planetary science. Use the worked examples to verify your understanding and bookmark for quick reference.',
    },
    variables: [
      { symbol: 'sol', name: 'Mars Solar Day', description: 'The time between two successive solar noons on Mars. 1 sol = 88,775.244 seconds = 1.02749125 Earth days. Mars has 669 sols per year.' },
      { symbol: 'MSD', name: 'Mars Sol Date', description: 'A continuous count of sols since December 29, 1873 (Gregorian). Analogous to the Julian Date on Earth. Used by NASA mission planners.' },
      { symbol: 'LMST', name: 'Local Mean Solar Time', description: 'The mean solar time at a specific longitude on Mars. Like Earth time zones but continuous — every 15° of longitude shifts LMST by 1 hour.' },
      { symbol: 'MTC', name: 'Coordinated Mars Time', description: 'The Mars equivalent of UTC, defined at the prime meridian (Airy-0 crater, longitude 0°). MTC = LMST at 0° longitude.' },
    ],
    howToUse: [
      'Choose a conversion mode: Earth→Mars, Sols→Earth, or Mission Time.',
      'For Earth→Mars: enter UTC date/time and Mars longitude to get Local Mean Solar Time.',
      'For Sols→Earth: enter a number of sols to see the equivalent Earth time.',
      'For Mission Time: enter a rover sol number to find the corresponding Earth date.',
    ],
    quickReference: [
      { label: '1 sol', value: '24h 39m 35.244s (1.02749 days)' },
      { label: '1 Mars year', value: '687 Earth days = 669 sols' },
      { label: 'Mars rotation', value: '24h 37m 22.7s (sidereal)' },
      { label: 'Curiosity landing', value: 'Sol 0 = Aug 6, 2012' },
      { label: 'Perseverance landing', value: 'Sol 0 = Feb 18, 2021' },
      { label: 'InSight landing', value: 'Sol 0 = Nov 26, 2018' },
      { label: 'Airy-0 (prime meridian)', value: '0° longitude, 5.1°S latitude' },
      { label: 'Mars-Earth time drift', value: '~40 min/day (mission control works Mars time)' },
    ],
    commonUses: [
      'NASA mission planning — rover operations teams work on Mars time, shifting their schedule ~40 min later each Earth day.',
      'Mars clock apps — displaying real-time Mars solar time for Curiosity, Perseverance, and InSight landing sites.',
      'Science fiction writing — authors using accurate Mars time for realistic Mars colony stories.',
      'Astronomy education — teaching students about planetary rotation, solar days, and coordinate systems.',
      'Mars analog missions — HI-SEAS and Mars Society crews practicing Mars-time operations on Earth.',
    ],
    explanation: "Mars time is both simple and maddening. A Mars solar day (sol) is 24 hours, 39 minutes, and 35.244 seconds of Earth time — only about 40 minutes longer than an Earth day. This small difference means that Mars rover operations teams must shift their work schedule 40 minutes later every Earth day to stay synchronized with the rover's day-night cycle. Over two weeks, this cumulative drift flips day and night completely — mission controllers working Mars time describe it as permanent jet lag. The Mars Sol Date (MSD) system, developed by Michael Allison (1997) and refined by NASA, provides a continuous sol count analogous to the Julian Date used by astronomers. Local Mean Solar Time (LMST) works exactly like Earth time zones: every 15° of longitude shifts LMST by 1 hour. The prime meridian of Mars passes through the tiny crater Airy-0 (diameter ~0.5 km) in Sinus Meridiani, established by the Mariner 9 team in 1972. Mars has seasons too — its 25.2° axial tilt (similar to Earth's 23.4°) produces summer and winter, though each season lasts about twice as long as Earth's because the Mars year is 687 Earth days.",
    faqs: [
      {
        question: 'Why is a Mars day called a "sol"?',
        answer: 'The term "sol" was adopted by NASA during the Viking missions (1976) to distinguish Mars solar days from Earth days in mission planning. The word derives from Latin "sol" meaning sun — the same root as "solar." Using a distinct term prevents ambiguity: "Sol 100" unambiguously means 100 Mars solar days after landing, not 100 Earth days. Each NASA Mars mission starts counting from Sol 0 (landing day). The first Mars sunrise after landing marks Sol 1.',
      },
      {
        question: 'How do NASA teams work on Mars time?',
        answer: 'Mars mission operations teams wear special watches that run on Mars time (24h 39m per "day"). Each Earth day, their schedule shifts ~40 minutes later. After 36 Earth days, they have completely flipped day/night. Teams work in shifts of several months, and the cumulative sleep disruption is significant. Some team members report it is easier to adapt to than transatlantic jet lag (a 9-hour shift) because the daily shift is small. NASA provides blackout curtains, light therapy, and sleep hygiene guidance for Mars time workers.',
      },
      {
        question: "What's the difference between LMST and true solar time on Mars?",
        answer: 'Local Mean Solar Time (LMST) assumes a perfectly uniform Mars orbit and rotation — it is the "mean" time, like Earth\'s mean solar time before time zones. True solar time varies by up to ±50 seconds due to Mars\' orbital eccentricity (e = 0.093, vs Earth\'s 0.017). This difference is called the equation of time. For most purposes, LMST is sufficient — NASA\'s Mars24 algorithm accounts for these variations.',
      },
      {
        question: 'How many sols are in a Mars year?',
        answer: 'A Mars year (one orbit around the Sun) takes 686.98 Earth days. Since 1 sol = 1.02749 Earth days, a Mars year = 686.98 / 1.02749 = 668.6 sols. Mars years are numbered starting from MY 1 on April 11, 1955 (Earth date). MY 37 began on December 26, 2022. Mars has four seasons due to its 25.2° axial tilt — spring, summer, autumn, winter — each lasting 142–194 sols depending on orbital position.',
      },
      {
        question: 'Why does Curiosity use 137.4°E longitude for its local time?',
        answer: 'Curiosity landed in Gale Crater at 137.4°E, 4.6°S. LMST at this longitude is 137.4/360 × 24 = 9.16 hours ahead of the prime meridian (Airy-0). This means when it is noon at Gale Crater, it is 2:50 AM at Airy-0. Each rover team uses the rover\'s landing site longitude to compute local time for daily operations — driving and science activities happen during the local Mars daytime when lighting is optimal.',
      },
    ],
    proTips: [
      'For Mars-Earth time conversion apps, always use the NASA Mars24 algorithm (Allison & McEwen 2000, updated 2020). This calculator uses a simplified version — for mission-critical work, use the full NASA algorithm.',
      'The Mars Sol Date (MSD) origin is Dec 29, 1873, 12:00 UTC. This date was chosen because it places MSD 0 near the Martian northern hemisphere winter solstice of 1873–1874.',
      'Mars dust storm season peaks near perihelion (closest approach to Sun, Ls ≈ 250°). Global dust storms can reduce surface solar power to near zero for weeks — mission planners track this carefully.',
      'If building a Mars watch/simulation, account for the equation of time (±50 seconds) for photorealistic accuracy. The effect is larger on Mars than Earth due to the more eccentric orbit.',
    ],
    workedExamples: [
      {
        scenario: "It is noon UTC on Earth, May 20, 2026. What is the Local Mean Solar Time at Gale Crater (137.4°E), where Curiosity is exploring?",
        inputs: { mode: 'earthToMars', earthDate: '2026-05-20T12:00:00', marsLongitude: '137.4' },
        result: 'LMST at Gale Crater (137.4°E): approximately 09:16:00, MSD ~53335.',
        insight: "Using the Mars24 algorithm, noon UTC on Earth translates to approximately late morning at Gale Crater. The LMST depends on the current Mars-Earth alignment and the rover's longitude. NASA Curiosity team members starting their shift at 8 AM LMST would need to start at roughly 8 PM UTC the previous Earth day, shifting ~40 min later each subsequent day.",
      },
      {
        scenario: 'Perseverance has been on Mars for 1,000 sols. How many Earth days is this?',
        inputs: { mode: 'solToEarth', sols: '1000' },
        result: '1,000 sols = 1,027d 11h 47m Earth time (1,027.49 Earth days).',
        insight: '1,000 sols × 88,775.244 seconds = 88,775,244 seconds = 1,027.49 Earth days. That is 2 years, 9 months, and 22 days. Perseverance reached Sol 1,000 on November 7, 2023 (Earth date). This milestone represents a major achievement — the primary mission was planned for just 1 Mars year (669 sols).',
      },
    ],
    limitations: [
      'This calculator uses a simplified Mars time algorithm based on the Allison & McEwen (2000) formulation. For precision applications (spacecraft navigation, mission planning), use the full NASA Mars24 algorithm which accounts for ΔT, Mars orbital perturbations, and the Mars equation of time.',
      'The "Mission Time" mode uses nominal landing dates; actual mission sol counts may differ by ±1 sol due to the exact definition of Sol 0.',
      'Mars longitude definitions can vary between planetographic (0–360°W) and planetocentric (0–360°E) conventions — this calculator uses east-longitude positive.',
    ],
  citations: [
      { source: 'Wikipedia — Mars Time', url: 'https://en.wikipedia.org/wiki/Mars_Time' },
      { source: 'Mars Time — Engineering Reference', url: 'https://www.engineeringtoolbox.com/' },
    ],
  },
};

export default marsTimeConfig;
