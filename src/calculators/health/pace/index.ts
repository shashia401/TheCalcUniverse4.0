import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PacePanel from './PacePanel';

const paceConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'distanceUnit',
      label: 'Distance Unit',
      type: 'select',
      required: true,
      helpText: 'All computed results (pace, splits) will use this unit',
      options: [
        { label: 'Miles', value: 'miles' },
        { label: 'Kilometers', value: 'km' },
      ],
    },
    {
      id: 'distance',
      label: 'Distance',
      type: 'select',
      required: true,
      helpText: 'Select a preset race distance or choose "Custom" to enter your own',
      options: [
        { label: '400 m', value: '0.25' },
        { label: '800 m', value: '0.5' },
        { label: '1K', value: '1' },
        { label: '5K', value: '5' },
        { label: '10K', value: '10' },
        { label: '10 mi', value: '10_mi' },
        { label: 'Half Marathon (13.1 mi / 21.1 km)', value: 'half' },
        { label: 'Marathon (26.2 mi / 42.2 km)', value: 'marathon' },
        { label: '50K Ultramarathon', value: '50k' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      id: 'customDistance',
      label: 'Custom Distance',
      type: 'number',
      placeholder: '10',
      min: 0,
      step: 0.01,
      helpText: 'Enter your custom distance in the selected unit (miles or km).',
    },
    {
      id: 'hours',
      label: 'Hours',
      type: 'number',
      placeholder: '0',
      unit: 'h',
      min: 0,
      max: 24,
      step: 1,
      helpText: 'Hours portion of total time (used in Pace and Distance modes)',
    },
    {
      id: 'minutes',
      label: 'Minutes',
      type: 'number',
      placeholder: '30',
      unit: 'min',
      min: 0,
      max: 59,
      step: 1,
      helpText: 'Minutes portion of total time (0–59)',
    },
    {
      id: 'seconds',
      label: 'Seconds',
      type: 'number',
      placeholder: '0',
      unit: 's',
      min: 0,
      max: 59,
      step: 1,
      helpText: 'Seconds portion of total time (0–59)',
    },
    {
      id: 'calcMode',
      label: 'Calculate',
      type: 'select',
      required: true,
      options: [
        { label: 'Pace (time per unit distance)', value: 'pace' },
        { label: 'Time (given distance and pace)', value: 'time' },
        { label: 'Distance (given time and pace)', value: 'distance' },
      ],
      helpText: 'Choose which value to calculate — you supply the other two',
    },
    {
      id: 'paceMinutes',
      label: 'Pace — Minutes',
      type: 'number',
      placeholder: '8',
      unit: 'min',
      min: 0,
      max: 59,
      step: 0.01,
      helpText: 'Pace minutes per mile/km (e.g., 8:30/mi pace → 8 min, 30 sec).',
    },
    {
      id: 'paceSeconds',
      label: 'Pace — Seconds',
      type: 'number',
      placeholder: '30',
      unit: 's',
      min: 0,
      max: 59,
      step: 1,
      helpText: 'Seconds portion of your pace (0–59)',
    },
  ],
  calculate: (values) => {
    const distanceUnit = values.distanceUnit || 'miles';
    const distanceKey = values.distance || '5';
    const customDist = parseFloat(values.customDistance);
    const hours = parseFloat(values.hours) || 0;
    const minutes = parseFloat(values.minutes) || 0;
    const seconds = parseFloat(values.seconds) || 0;
    const calcMode = values.calcMode || 'pace';
    const paceMin = parseFloat(values.paceMinutes) || 0;
    const paceSec = parseFloat(values.paceSeconds) || 0;

    // Resolve distance in the selected unit
    let distInUnit: number;
    const isMiles = distanceUnit === 'miles';

    if (distanceKey === 'custom') {
      distInUnit = customDist;
    } else if (distanceKey === 'half') {
      distInUnit = isMiles ? 13.109375 : 21.0975;
    } else if (distanceKey === 'marathon') {
      distInUnit = isMiles ? 26.21875 : 42.195;
    } else if (distanceKey === '10_mi') {
      distInUnit = 10;
    } else if (distanceKey === '50k') {
      distInUnit = isMiles ? 31.07 : 50;
    } else {
      distInUnit = parseFloat(distanceKey);
    }

    const totalTimeSec = hours * 3600 + minutes * 60 + seconds;
    const totalPaceSec = paceMin * 60 + paceSec;

    // Reject negative time or pace values
    if (hours < 0 || minutes < 0 || seconds < 0 || paceMin < 0 || paceSec < 0) return [];

    let resultPaceSec: number;
    let totalTimeSeconds: number;
    let resultDist: number;

    if (calcMode === 'pace') {
      if (isNaN(distInUnit) || distInUnit <= 0 || totalTimeSec <= 0) return [];
      resultPaceSec = totalTimeSec / distInUnit;
      totalTimeSeconds = totalTimeSec;
      resultDist = distInUnit;
    } else if (calcMode === 'time') {
      if (isNaN(distInUnit) || distInUnit <= 0 || totalPaceSec <= 0) return [];
      totalTimeSeconds = distInUnit * totalPaceSec;
      resultPaceSec = totalPaceSec;
      resultDist = distInUnit;
    } else {
      // distance mode
      if (totalPaceSec <= 0 || totalTimeSec <= 0) return [];
      resultDist = totalTimeSec / totalPaceSec;
      totalTimeSeconds = totalTimeSec;
      resultPaceSec = totalPaceSec;
    }

    const paceMinDisplay = Math.floor(resultPaceSec / 60);
    const paceSecDisplay = Math.round(resultPaceSec % 60);
    const paceStr = `${paceMinDisplay}:${String(paceSecDisplay).padStart(2, '0')} /${isMiles ? 'mi' : 'km'}`;

    const totalH = Math.floor(totalTimeSeconds / 3600);
    const totalM = Math.floor((totalTimeSeconds % 3600) / 60);
    const totalS = Math.round(totalTimeSeconds % 60);
    const timeStr = totalH > 0
      ? `${totalH}:${String(totalM).padStart(2, '0')}:${String(totalS).padStart(2, '0')}`
      : `${totalM}:${String(totalS).padStart(2, '0')}`;

    const distStr = resultDist >= 1
      ? `${resultDist.toFixed(2)} ${isMiles ? 'mi' : 'km'}`
      : `${(resultDist * (isMiles ? 1609.344 : 1000)).toFixed(0)} ${isMiles ? 'm' : 'm'}`;

    // Speed
    const speedKmh = isMiles
      ? resultDist / (totalTimeSeconds / 3600) * 1.609344
      : resultDist / (totalTimeSeconds / 3600);
    const speedMph = isMiles
      ? resultDist / (totalTimeSeconds / 3600)
      : resultDist / (totalTimeSeconds / 3600) * 0.621371;

    // Generate splits
    const splits: { dist: string; time: string }[] = [];
    if (resultDist >= 1 && resultDist <= 50) {
      const increment = resultDist <= 5 ? 1 : resultDist <= 10 ? 1 : resultDist <= 21.1 ? 2 : 5;
      for (let d = increment; d <= Math.floor(resultDist); d += increment) {
        const t = d * resultPaceSec;
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = Math.round(t % 60);
        splits.push({
          dist: `${d} ${isMiles ? 'mi' : 'km'}`,
          time: h > 0
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${m}:${String(s).padStart(2, '0')}`,
        });
      }
    }

    const fmt = (n: number) => n.toFixed(2);

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'negative' | 'neutral' }> = [
      {
        id: 'pace',
        label: `Pace (${isMiles ? 'per mile' : 'per km'})`,
        value: paceStr,
        highlight: calcMode === 'pace',
        color: 'positive',
      },
      {
        id: 'totalTime',
        label: 'Total Time',
        value: timeStr,
        highlight: calcMode === 'time',
        color: 'neutral',
      },
      {
        id: 'distance',
        label: `Distance (${isMiles ? 'miles' : 'km'})`,
        value: distStr,
        highlight: calcMode === 'distance',
        color: 'neutral',
      },
      {
        id: 'speed',
        label: 'Speed',
        value: `${fmt(speedMph)} mph · ${fmt(speedKmh)} km/h`,
        color: 'neutral',
      },
    ];

    if (splits.length > 0) {
      results.push({
        id: 'splitCount',
        label: 'Split Intervals Available',
        value: `${splits.length} split points · ${distStr} total`,
        color: 'neutral',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PacePanel, { values, results });
  },
  educational: {
    formula: 'Pace = Time ÷ Distance | Time = Distance × Pace | Distance = Time ÷ Pace',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Pace, Time &amp; Distance Triangle</text><line x1="220" y1="90" x2="90" y2="220" stroke="var(--svg-cccccc)" stroke-width="1"/><line x1="220" y1="90" x2="350" y2="220" stroke="var(--svg-cccccc)" stroke-width="1"/><line x1="90" y1="220" x2="350" y2="220" stroke="var(--svg-cccccc)" stroke-width="1"/><circle cx="220" cy="90" r="25" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="220" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-3b82f6)">Pace</text><circle cx="90" cy="220" r="25" fill="var(--svg-dbeafe)" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="90" y="225" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-22c55e)">Time</text><circle cx="350" cy="220" r="25" fill="var(--svg-dbeafe)" stroke="var(--svg-f59e0b)" stroke-width="2"/><text x="350" y="225" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-f59e0b)">Dist.</text><text x="220" y="285" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)" font-weight="bold">Given any 2 variables, calculate the 3rd</text></svg>',
      alt: 'Triangle diagram connecting pace, time, and distance with interchangeable formulas',
      caption: 'Pace = Time / Distance; given any two variables, the third can be calculated',
    },
    formulaDescription:
      'The three core running formulas are interchangeable: given any two variables, the third can be derived. Pace is typically expressed in minutes per mile or per kilometer. The relationship between pace (e.g., 8:00/mi) and speed (7.5 mph) is the inverted equivalent — pace describes time per distance while speed describes distance per time.',
    variables: [
      { symbol: 'Pace', name: 'Running Pace', description: 'Time required to cover one unit of distance. Lower is faster. A 7:00/mi pace is significantly faster than 10:00/mi.' },
      { symbol: 'Distance', name: 'Race/Route Distance', description: 'Total distance of the run, from 400m sprints to ultramarathons. Preset options include 5K, 10K, half marathon, marathon, and 50K.' },
      { symbol: 'Split', name: 'Split Time', description: 'Intermediate time at a specific distance point. Used to pace a race evenly. For a marathon, checking your half-marathon split tells you if you are on track.' },
    ],
    howToUse: [
      'Select distance unit (miles or km). All computed results will use this unit.',
      'Choose a preset race distance (5K through marathon) or enter a custom distance.',
      'Select what you want to calculate: Pace (time per unit distance), Time (total race time), or Distance (given time and pace).',
      'Fill in the two known values — the tool calculates the third automatically.',
      'Use the split table below to plan your race strategy at each intermediate distance point.',
      'The wristband view is designed to be screenshot and carried on race day for reference.',
    ],
    explanation:
      'Running pace math is straightforward but critical for race strategy. The most common mistake runners make is starting too fast — going out at a pace 10–15 seconds per mile faster than goal pace and then fading dramatically in the second half. This "positive splitting" can cost 5–10 minutes or more over a marathon distance. Even pacing (maintaining the same pace throughout) or slightly negative splitting (running the second half faster than the first) produces the fastest overall times for most runners. The split table helps you plan: for a marathon, check your time at 10K, half marathon, and 20 miles to ensure you are on track. For beginners, add 30–60 seconds per mile to your 5K pace to estimate a realistic marathon pace. For experienced runners, the "VDOT" system developed by Jack Daniels uses your recent race performance to predict equivalent performances at other distances. For example, a 22:00 5K predicts roughly a 1:42 half marathon and a 3:33 marathon, assuming equivalent training and conditions.',
    faqs: [
      {
        question: 'What is a good running pace?',
        answer: 'A "good" pace is personal — it depends on your fitness level, age, distance, and goals. A 10-minute mile is achievable for most recreational runners. Elite marathoners run under 5 minutes per mile (sub-2:20 marathon). Use the pace calculator to find your current pace and target improvements of 5-10% per training cycle. A useful benchmark: if you can run a 5K at 9:00/mi, a sustainable marathon pace would be roughly 10:00–10:30/mi.',
      },
      {
        question: 'Should I run at an even pace or negative split?',
        answer: 'Research strongly favors even or slightly negative splits (running the second half faster than the first). Even pacing minimizes energy waste and produces the best overall time for most runners. Going out too fast (positive split) leads to significant slowdown in the final miles. Elite marathoners often run negative splits by banking energy in the first half. For your first race, focus on holding back in the first half — you will pass many people who started too fast.',
      },
      {
        question: 'How do I convert min/mile to min/km?',
        answer: 'Multiply minutes-per-mile by 0.6214. For example, 8:00/mi ≈ 4:58/km. Conversely, multiply min/km by 1.609 to get min/mile. 5:00/km ≈ 8:03/mi. A practical tip: if your GPS watch is set to kilometers but you think in miles, subtract roughly 40% from your per-km time to estimate per-mile pace.',
      },
      {
        question: 'What pace should I aim for in my first marathon?',
        answer: 'For a first marathon, aim for a pace 45–90 seconds per mile slower than your current 10K race pace. Most first-timers should focus on finishing comfortably rather than chasing a specific time. The "wall" typically hits around mile 18–22 when glycogen stores deplete — even pacing and proper fueling (30–60g carbs per hour) can help delay or avoid it. Consider a run-walk strategy (e.g., 9 min run / 1 min walk) for your first marathon.',
      },
      {
        question: 'How do elevation and terrain affect running pace?',
        answer: 'Elevation gain significantly impacts pace — a general rule is that 100 feet of climbing adds roughly 20–30 seconds per mile to your pace. Running on trails vs. roads also adds 30–90 seconds per mile depending on technical difficulty. The pace calculator assumes flat road conditions — adjust your expectations accordingly for hilly courses or trail races. Many runners use a "grade-adjusted pace" to compare effort across different terrains.',
      },
    ],
    commonUses: [
      'Race day planning — calculate target pace for any distance from 400m to marathon and generate split times for even pacing strategy on race day',
      'Training pace zones — determine easy run, tempo run, and interval paces from a recent race result using the pace-time-distance relationship',
      'Goal setting and comparison — see equivalent performances across distances: a 22:00 5K predicts roughly a 1:42 half marathon and a 3:33 marathon',
      'Route and workout design — calculate total time for a known distance at a given pace, or determine how far you can go in a set time for planning training routes'
    ],
  
    citations: [
      { source: 'ACSM - Running Pace', url: 'https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription' },
      { source: 'CDC - Physical Activity', url: 'https://www.cdc.gov/physicalactivity/basics/' },
    ],
  },
};

export default paceConfig;
