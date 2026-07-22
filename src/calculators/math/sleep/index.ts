import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SleepPanel from './SleepPanel';

interface TimeResult {
  hours: number;
  minutes: number;
}

function parseTime(input: string): TimeResult | null {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return null;

  // Try 12-hour format: "6:30 AM" or "6:30 PM"
  const match12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(trimmed);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridian = match12[3];
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }

  // Try 24-hour format: "06:30" or "23:00"
  const match24 = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return { hours, minutes };
  }

  return null;
}

function toMinutes(t: TimeResult): number {
  return t.hours * 60 + t.minutes;
}

function fromMinutes(totalMinutes: number): TimeResult {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(m / 60);
  const minutes = m % 60;
  return { hours, minutes };
}

function formatTime(t: TimeResult): string {
  const hour12 = t.hours % 12 || 12;
  const meridian = t.hours < 12 ? 'AM' : 'PM';
  const minStr = String(t.minutes).padStart(2, '0');
  return `${hour12}:${minStr} ${meridian}`;
}

const FALL_ASLEEP_MINUTES = 14;
const CYCLE_MINUTES = 90;

const sleepConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      options: [
        { label: 'Wake up at → when to sleep', value: 'wake' },
        { label: 'Sleep at → when to wake', value: 'sleep' },
      ],
    },
    {
      id: 'wakeupTime',
      label: 'Wake Up Time',
      type: 'text',
      placeholder: 'e.g., 6:30 AM or 06:30',
      helpText: 'What time do you need to wake up?',
      showWhen: (v) => v.mode === 'wake',
    },
    {
      id: 'bedtime',
      label: 'Bed Time',
      type: 'text',
      placeholder: 'e.g., 11:00 PM or 23:00',
      helpText: 'What time are you going to bed?',
      showWhen: (v) => v.mode === 'sleep',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'wake';

    if (mode === 'wake') {
      const wakeupTime = parseTime(values.wakeupTime || '');
      if (!wakeupTime) return [];

      const wakeMinutes = toMinutes(wakeupTime);
      const options: Array<{ time: string; cycles: number; hours: number }> = [];

      for (let cycles = 6; cycles >= 3; cycles--) {
        const totalSleepMinutes = cycles * CYCLE_MINUTES;
        const bedMinutes = wakeMinutes - totalSleepMinutes - FALL_ASLEEP_MINUTES;
        const bedTime = fromMinutes(bedMinutes);
        options.push({
          time: formatTime(bedTime),
          cycles,
          hours: (totalSleepMinutes / 60),
        });
      }

      const bestIdx = options.findIndex((o) => o.cycles >= 5 && o.cycles <= 6);
      const recommendedItem = bestIdx >= 0 ? options[bestIdx] : options[0];

      return [
        {
          id: 'options',
          label: 'Optimal Times',
          value: JSON.stringify(options),
        },
        {
          id: 'cycleInfo',
          label: 'Sleep Cycles',
          value: `${recommendedItem.cycles} complete cycles (${recommendedItem.hours.toFixed(1)} hours)`,
        },
        {
          id: 'recommendedBedtime',
          label: 'Recommended Bedtime',
          value: recommendedItem.time,
          highlight: true,
          color: 'positive',
        },
      ];
    }

    if (mode === 'sleep') {
      const bedtime = parseTime(values.bedtime || '');
      if (!bedtime) return [];

      const bedMinutes = toMinutes(bedtime);
      const options: Array<{ time: string; cycles: number; hours: number }> = [];

      for (let cycles = 6; cycles >= 3; cycles--) {
        const totalSleepMinutes = cycles * CYCLE_MINUTES;
        const wakeMinutes = bedMinutes + FALL_ASLEEP_MINUTES + totalSleepMinutes;
        const wakeTime = fromMinutes(wakeMinutes);
        options.push({
          time: formatTime(wakeTime),
          cycles,
          hours: (totalSleepMinutes / 60),
        });
      }

      const bestIdx = options.findIndex((o) => o.cycles >= 5 && o.cycles <= 6);
      const recommendedItem = bestIdx >= 0 ? options[bestIdx] : options[0];

      return [
        {
          id: 'options',
          label: 'Optimal Times',
          value: JSON.stringify(options),
        },
        {
          id: 'cycleInfo',
          label: 'Sleep Cycles',
          value: `${recommendedItem.cycles} complete cycles (${recommendedItem.hours.toFixed(1)} hours)`,
        },
        {
          id: 'recommendedWakeup',
          label: 'Recommended Wake Up',
          value: recommendedItem.time,
          highlight: true,
          color: 'positive',
        },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SleepPanel, { values, results });
  },
  educational: {
    formula: 'Sleep Time = N × 90 min cycles + 14 min fall-asleep',
    formulaDescription:
      'Sleep cycles last approximately 90 minutes each, including light sleep, deep sleep, and REM sleep. Waking at the end of a cycle (rather than in the middle) leaves you feeling more refreshed.',
    variables: [
      {
        symbol: 'Cycle',
        name: 'Sleep Cycle',
        description: 'A ~90-minute period of sleep consisting of light, deep, and REM stages.',
      },
      {
        symbol: '14 min',
        name: 'Fall-Asleep Time',
        description: 'The average time it takes a person to fall asleep after getting into bed.',
      },
      {
        symbol: 'N',
        name: 'Number of Cycles',
        description: 'The number of complete 90-minute sleep cycles. 5-6 cycles (7.5-9 hours) is recommended for most adults.',
      },
    ],
    howToUse: [
      'Choose whether you want to find a bedtime (based on wake time) or wake time (based on bedtime).',
      'Enter your desired wake-up time or bedtime in 12-hour (6:30 AM) or 24-hour (06:30) format.',
      'View the 4 closest options with different cycle counts.',
      'The recommended option is highlighted — typically 5-6 complete cycles.',
    ],
    explanation:
      'Sleep cycles are approximately 90 minutes long, and waking at the end of a cycle leaves you feeling more rested. This calculator adds 14 minutes for falling asleep, then works backward (or forward) from your desired time, offering 4 options with 3-6 complete cycles. The 5-6 cycle option is recommended for most adults. Practical example: if you need to wake up at 6:30 AM, working backward: 6 cycles = 9 hours of sleep + 14 min fall-asleep = 9:14 before wake time, so bedtime = 9:16 PM. 5 cycles = 7.5 hours + 14 min = 7:44 before, so bedtime = 10:46 PM. 4 cycles = 6 hours + 14 min = 6:14 before, so bedtime = 12:16 AM. The 5-cycle option at 10:46 PM is typically the best balance. Edge cases: if you take medication that affects sleep architecture (such as antidepressants which suppress REM sleep), your cycle length may differ from 90 minutes. People with sleep disorders like sleep apnea experience disrupted cycles and may not benefit from cycle-based timing. For shift workers, the body\'s circadian rhythm is often misaligned with the desired sleep schedule, making it harder to fall asleep at the calculated time — consider blackout curtains and consistent sleep hygiene. For polyphasic sleep schedules (multiple short naps per day), cycle-based timing does not apply because the sleep architecture differs significantly from monophasic sleep.',
    faqs: [
      {
        question: 'What happens if I wake up in the middle of a cycle?',
        answer:
          'Waking during deep sleep or REM can cause sleep inertia — that groggy, disoriented feeling. Waking at the end of a cycle (during light sleep) helps you feel more refreshed.',
      },
      {
        question: 'Is 14 minutes the average time to fall asleep?',
        answer:
          'Yes, clinical studies show that the average healthy adult takes 10-20 minutes to fall asleep. Falling asleep much faster may indicate sleep deprivation; taking much longer may indicate insomnia or anxiety.',
      },
      {
        question: 'Are sleep cycles exactly 90 minutes?',
        answer:
          'Not always. Sleep cycles range from 70-120 minutes, with the average being about 90 minutes. The first cycle tends to be shorter, and later cycles can be longer with more REM sleep.',
      },
      {
        question: 'How many sleep cycles do I need?',
        answer:
          'Most adults need 5-6 complete cycles (7.5-9 hours of sleep). Some people function well on 4 cycles (6 hours), but this is less common. The recommended amount for adults is 7-9 hours per night.',
      },
      {
        question: 'Does the calculator account for different sleep stages within each cycle?',
        answer: 'The calculator assumes a uniform 90-minute average cycle, but in reality, sleep architecture changes throughout the night. The first sleep cycle of the night is often shorter (70-80 minutes) and contains more deep sleep (slow-wave sleep). Later cycles become longer (100-120 minutes) and contain more REM sleep. This means that if you sleep for only 3 cycles (about 4.5 hours), you will get a higher proportion of deep sleep but very little REM sleep, which can impair memory consolidation and emotional regulation. If you sleep 6 cycles (9 hours), you will get more REM sleep toward the morning. This is why waking up naturally after a full night of sleep often produces vivid dream recall — you are waking from the last REM period of the night. The 14-minute fall-asleep estimate is an average — people with insomnia may take 30-60 minutes to fall asleep, while sleep-deprived individuals may fall asleep in under 5 minutes. If you consistently fall asleep faster than 5 minutes, it may indicate significant sleep deprivation.',
      },
    ],
    citations: [
      { source: 'CDC - Sleep and Sleep Disorders', url: 'https://www.cdc.gov/sleep/' },
      { source: 'National Sleep Foundation - Sleep Duration Recommendations', url: 'https://www.thensf.org/' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">90-Minute Sleep Cycles</text><path d="M10 80 Q50 40 90 80 Q130 120 170 80 Q210 40 250 80 Q290 120 310 85" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3"/><text x="50" y="55" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Light</text><text x="130" y="100" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Deep</text><text x="210" y="55" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">REM</text><text x="290" y="100" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Light</text><text x="160" y="128" text-anchor="middle" font-size="10" fill="var(--svg-555555)">One cycle ≈ 90 minutes</text><rect x="15" y="140" width="290" height="52" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="157" text-anchor="middle" font-size="10" fill="var(--svg-555555)" font-weight="bold">Sleep Time = N × 90 min + 14 min fall-asleep</text><text x="20" y="176" font-size="9" fill="var(--svg-888888)">6 cycles: 9:14 hours → 5 cycles: 7:44 hours → 4 cycles: 6:14 hours</text><text x="20" y="190" font-size="9" fill="var(--svg-888888)">Wake at cycle end (light sleep) to feel refreshed, avoid sleep inertia</text></svg>',
      alt: 'Sleep cycle wave diagram showing 90-minute sleep cycles',
      caption: 'Sleep cycles last ~90 minutes. Waking at cycle end (light sleep) leaves you refreshed; waking mid-cycle causes sleep inertia.',
    },
  },
};

export default sleepConfig;
