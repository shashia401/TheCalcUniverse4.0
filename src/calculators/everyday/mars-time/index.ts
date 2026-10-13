import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { SOL_SECONDS, hms, lmstHours, marsSolDate, mtcHours, parseUtc } from './marsMath';

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
      helpText: 'ISO 8601, read as UTC unless you add a Z or an offset (+02:00). Mars24 converts it to Terrestrial Time (adds the leap seconds) before computing the Mars Sol Date.',
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
      helpText: 'Longitude on Mars. Curiosity rover: 137.4°E (Gale Crater). Perseverance: 77.4°E (Jezero Crater). 0° = Airy-0 crater meridian. East longitude is positive.',
      showWhen: (v) => v.mode === 'earthToMars',
    },
    {
      id: 'sols',
      label: 'Number of Sols',
      type: 'number',
      placeholder: '100',
      inputMode: 'decimal',
      min: 0,
      max: 1000000,
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
      max: 100000,
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
    const results: CalculatorResult[] = [];

    if (mode === 'earthToMars') {
      const lon = parseFloat(values.marsLongitude);
      const earthDate = parseUtc(values.earthDate);
      if (!earthDate || !Number.isFinite(lon)) return [];

      const msd = marsSolDate(earthDate);
      results.push(
        {
          id: 'lmst',
          label: 'Local Mean Solar Time',
          value: hms(lmstHours(msd, lon)),
          highlight: true,
          color: 'positive',
          interpretation: `Mean solar time at ${lon}°E on Mars. True (sundial) time differs by the Mars equation of time, up to about 50 minutes.`,
        },
        { id: 'mtc', label: 'Coordinated Mars Time (MTC)', value: hms(mtcHours(msd)), color: 'neutral', interpretation: 'Mean solar time at the prime meridian (Airy-0), the Mars counterpart of UTC.' },
        { id: 'msd', label: 'Mars Sol Date (MSD)', value: msd.toFixed(4), color: 'neutral' },
        { id: 'sol', label: 'Sol Number (MSD, prime meridian)', value: Math.floor(msd).toString(), color: 'neutral' },
        { id: 'earthTime', label: 'Earth UTC', value: earthDate.toISOString(), color: 'neutral' },
      );
    }

    if (mode === 'solToEarth') {
      const sols = parseFloat(values.sols);
      if (!Number.isFinite(sols) || sols < 0) return [];

      const earthDays = (sols * SOL_SECONDS) / 86400;
      const earthHours = earthDays * 24;
      const totalMinutes = Math.floor(earthDays * 1440 + 1e-6);
      const days = Math.floor(totalMinutes / 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);
      const minutes = totalMinutes % 60;

      results.push(
        { id: 'earthTime', label: `Earth Equivalent of ${sols} Sols`, value: `${days}d ${hours}h ${minutes}m`, highlight: true, color: 'positive' },
        { id: 'earthDays', label: 'In Earth Days', value: earthDays.toFixed(4) + ' days', color: 'neutral' },
        { id: 'earthHours', label: 'In Earth Hours', value: earthHours.toFixed(2) + ' hours', color: 'neutral' },
        { id: 'solSeconds', label: '1 Sol =', value: '24h 39m 35.244s (88,775.244 seconds)', color: 'neutral' },
      );
    }

    if (mode === 'missionTime') {
      const sol = parseFloat(values.missionSols);
      if (!Number.isFinite(sol) || sol < 0) return [];

      const landingDates: Record<string, string> = {
        curiosity: '2012-08-06T05:17:57Z',
        perseverance: '2021-02-18T20:55:00Z',
        insight: '2018-11-26T19:52:59Z',
      };

      const roverNames: Record<string, string> = {
        curiosity: 'Curiosity (MSL) — Gale Crater',
        perseverance: 'Perseverance (Mars 2020) — Jezero Crater',
        insight: 'InSight — Elysium Planitia',
      };

      const rover = values.rover && landingDates[values.rover] ? values.rover : 'curiosity';
      const landingDate = new Date(landingDates[rover]);
      const earthElapsed = sol * SOL_SECONDS * 1000;
      const earthDate = new Date(landingDate.getTime() + earthElapsed);

      results.push(
        { id: 'earthDate', label: `Sol ${sol} on Earth`, value: earthDate.toISOString().split('T')[0], highlight: true, color: 'positive', interpretation: 'Same time of sol as the landing, counted from the landing instant (Sol 0).' },
        { id: 'rover', label: 'Rover', value: roverNames[rover], color: 'neutral' },
        { id: 'landing', label: 'Landed', value: landingDate.toISOString().split('T')[0], color: 'neutral' },
        { id: 'totalDays', label: 'Earth Days Since Landing', value: Math.floor(earthElapsed / 86400000).toLocaleString('en-US'), color: 'neutral' },
      );
    }

    return results;
  },

  educational: {
    formula: '1 sol = 24h 39m 35.244s = 88,775.244 seconds',
    formulaDescription: 'A Mars solar day (sol) is 39 minutes and 35 seconds longer than an Earth day. This is because Mars rotates slightly slower — its sidereal rotation period is 24h 37m 22.7s, but the orbital motion adds ~2 minutes to the solar day. A Mars year (686.98 Earth days) is about 668.6 sols.',
    diagram: {
      svg: '<svg viewBox=\'0 0 440 130\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><text x=\'220\' y=\'20\' text-anchor=\'middle\' font-size=\'13\' font-weight=\'bold\' fill=\'currentColor\'>One day on Earth vs one sol on Mars</text><rect x=\'80\' y=\'40\' width=\'240\' height=\'24\' rx=\'3\' fill=\'var(--svg-3b82f6)\'/><text x=\'72\' y=\'57\' text-anchor=\'end\' font-size=\'11\' fill=\'currentColor\'>Earth</text><text x=\'326\' y=\'57\' font-size=\'11\' fill=\'currentColor\'>24h 00m 00s</text><rect x=\'80\' y=\'74\' width=\'246.6\' height=\'24\' rx=\'3\' fill=\'var(--svg-ef4444)\'/><text x=\'72\' y=\'91\' text-anchor=\'end\' font-size=\'11\' fill=\'currentColor\'>Mars</text><text x=\'332\' y=\'91\' font-size=\'11\' fill=\'currentColor\'>24h 39m 35s</text><text x=\'220\' y=\'120\' text-anchor=\'middle\' font-size=\'10\' fill=\'var(--svg-6b7280)\'>1 sol = 88,775.244 s = 1.0274912517 Earth days</text></svg>',
      alt: 'Two bars comparing an Earth day of 24 hours with a Mars sol of 24 hours 39 minutes 35 seconds',
      caption: 'A sol is about 2.7% longer than an Earth day, so Mars-time schedules slip about 40 minutes per Earth day.',
    },
    variables: [
      { symbol: 'sol', name: 'Mars Solar Day', description: 'The time between two successive solar noons on Mars. 1 sol = 88,775.244 seconds = 1.02749125 Earth days. A Mars year is about 668.6 sols.' },
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
      { label: '1 Mars year', value: '686.98 Earth days = 668.6 sols' },
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
    explanation: "Mars time is both simple and maddening. A Mars solar day (sol) is 24 hours, 39 minutes, and 35.244 seconds of Earth time — only about 40 minutes longer than an Earth day. This small difference means that Mars rover operations teams must shift their work schedule 40 minutes later every Earth day to stay synchronized with the rover's day-night cycle. After about 18 days, this cumulative drift flips day and night completely — mission controllers working Mars time describe it as permanent jet lag. The Mars Sol Date (MSD) system, developed by Allison and McEwen (2000) for the NASA GISS Mars24 tool, provides a continuous sol count analogous to the Julian Date used by astronomers. Local Mean Solar Time (LMST) works exactly like Earth time zones: every 15° of longitude shifts LMST by 1 hour. The prime meridian of Mars passes through the tiny crater Airy-0 (diameter ~0.5 km) in Sinus Meridiani, established by the Mariner 9 team in 1972. Mars has seasons too — its 25.2° axial tilt (similar to Earth's 23.4°) produces summer and winter, though each season lasts about twice as long as Earth's because the Mars year is 687 Earth days.",
    faqs: [
      {
        question: 'How many hours, minutes, and seconds is a Mars day compared to Earth?',
        answer: 'A Mars solar day (sol) is 24 hours, 39 minutes, and 35.244 seconds — exactly 88,775.244 seconds. That\'s 39 minutes 35 seconds longer than a 24-hour Earth day, or about 1.0275 Earth days per sol. The difference comes from Mars\' slower rotation combined with the extra rotation needed each day to catch up with its own orbital motion around the Sun.',
      },
      {
        question: 'What is Coordinated Mars Time (MTC)?',
        answer: 'Coordinated Mars Time (MTC) is the Mars equivalent of Earth\'s UTC — a single planet-wide reference time defined as the Local Mean Solar Time at Mars\' prime meridian (0° longitude, through the crater Airy-0). Every other longitude\'s Local Mean Solar Time (LMST) is MTC plus or minus an offset based on how far east or west it sits from that meridian — the same way Earth time zones offset from UTC, except Mars has no daylight saving and offsets are continuous rather than in 1-hour steps.',
      },
      {
        question: 'Why is a Mars day called a "sol"?',
        answer: 'The term "sol" was adopted by NASA during the Viking missions (1976) to distinguish Mars solar days from Earth days in mission planning. The word derives from Latin "sol" meaning sun — the same root as "solar." Using a distinct term prevents ambiguity: "Sol 100" unambiguously means 100 Mars solar days after landing, not 100 Earth days. Each NASA Mars mission starts counting from Sol 0 (landing day).',
      },
      {
        question: 'How do NASA teams work on Mars time?',
        answer: 'Mars mission operations teams wear special watches that run on Mars time (24h 39m per "day"). Each Earth day, their schedule shifts ~40 minutes later. After about 18 Earth days, they have completely flipped day/night. Teams work in shifts of several months, and the cumulative sleep disruption is significant. Some team members report it is easier to adapt to than transatlantic jet lag (a 9-hour shift) because the daily shift is small.',
      },
      {
        question: "What's the difference between LMST and true solar time on Mars?",
        answer: 'Local Mean Solar Time (LMST) assumes a perfectly uniform Mars orbit and rotation — it is the "mean" time, like Earth\'s mean solar time before time zones. True solar time (the Sun on a sundial) differs from LMST by the equation of time, which on Mars reaches about 50 minutes because of the orbital eccentricity (e = 0.093, vs Earth\'s 0.017). This calculator returns mean time (LMST) only; the Mars24 tool also gives true solar time.',
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
      'For Mars-Earth time conversion apps, use the NASA Mars24 algorithm (Allison & McEwen 2000). This calculator implements its Mars Sol Date and mean-time steps, including the conversion from UTC to Terrestrial Time.',
      'The Mars Sol Date (MSD) origin is about Dec 29, 1873, 12:00 (JD 2405522.0029 TT), chosen so that all sol dates since the 1870s are positive.',
      'Mars dust storm season peaks near perihelion (closest approach to Sun, Ls ≈ 250°). Global dust storms can reduce surface solar power to near zero for weeks — mission planners track this carefully.',
      'If building a Mars watch/simulation, add the equation of time (up to about 50 minutes) to get true solar time. The effect is much larger on Mars than Earth (about 16 minutes) because of the more eccentric orbit.',
    ],
    workedExamples: [
      {
        scenario: "It is noon UTC on Earth, May 20, 2026. What is the Local Mean Solar Time at Gale Crater (137.4°E), where Curiosity is exploring?",
        inputs: { mode: 'earthToMars', earthDate: '2026-05-20T12:00:00', marsLongitude: '137.4' },
        result: 'LMST at Gale Crater (137.4°E): 04:24:50, MSD 54169.8023.',
        insight: "Using the Mars24 algorithm, noon UTC on 20 May 2026 is MSD 54169.8023, so it is 19:15 MTC (19:15:14) at the prime meridian and 04:24:50 LMST at Gale Crater (19:15 plus 9.16 hours of longitude offset). Because a sol is about 40 minutes longer than an Earth day, the same LMST arrives about 40 minutes later each Earth day.",
      },
      {
        scenario: 'Perseverance has been on Mars for 1,000 sols. How many Earth days is this?',
        inputs: { mode: 'solToEarth', sols: '1000' },
        result: '1,000 sols = 1,027d 11h 47m Earth time (1,027.49 Earth days).',
        insight: '1,000 sols × 88,775.244 seconds = 88,775,244 seconds = 1,027.49 Earth days. That is 2 years, 9 months, and 25 days. Adding that to Perseverance\'s Feb 18, 2021 landing (20:55 UTC) puts Sol 1,000 on December 13, 2023 (Earth date). This milestone represents a major achievement — the primary mission was planned for just 1 Mars year (669 sols).',
      },
    ],
    limitations: [
      'The Mars Sol Date uses the Allison & McEwen (2000) formula with the UTC-to-TT leap-second correction (a built-in table from 1972; earlier dates use 10 s). Equation of time and true solar time are not included. For spacecraft navigation or rover operations use the official NASA Mars24 tool.',
      'The "Mission Time" mode counts whole sols from the landing instant (Curiosity 2012-08-06 05:17:57 UTC, Perseverance 2021-02-18 20:55 UTC, InSight 2018-11-26 19:52:59 UTC); official mission sol numbers change at local midnight at the landing site, so a date can differ by about a day.',
      'Mars longitude definitions can vary between planetographic (0–360°W) and planetocentric (0–360°E) conventions — this calculator uses east-longitude positive.',
    ],
  citations: [
      { source: 'Wikipedia — Mars Time', url: 'https://en.wikipedia.org/wiki/Mars_Time' },
      { source: 'NASA GISS — Mars24 Sunclock', url: 'https://www.giss.nasa.gov/tools/mars24/' },
      { source: 'Allison & McEwen (2000), Planetary and Space Science 48, 215-235', url: 'https://doi.org/10.1016/S0032-0633(99)00092-6' },
    ],
  },
};

export default marsTimeConfig;
