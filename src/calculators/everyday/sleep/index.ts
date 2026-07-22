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

  const match12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(trimmed);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridian = match12[3];
    if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }

  const match24 = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
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
      defaultValue: 'wake',
      required: true,
      helpText: 'Choose "Wake up at" to find the best bedtime based on when you need to wake. Choose "Sleep at" to find the best wake-up time based on when you go to bed.',
    },
    {
      id: 'wakeupTime',
      label: 'Wake Up Time',
      type: 'text',
      placeholder: 'e.g., 6:30 AM or 06:30',
      inputMode: 'decimal',
      helpText: 'Enter the time you need to wake up. Use 12-hour format (6:30 AM) or 24-hour format (06:30). The calculator adds 14 minutes for falling asleep and calculates bedtimes for 3-6 complete sleep cycles.',
      showWhen: (v) => v.mode === 'wake',
    },
    {
      id: 'bedtime',
      label: 'Bed Time',
      type: 'text',
      placeholder: 'e.g., 11:00 PM or 23:00',
      inputMode: 'decimal',
      helpText: 'Enter the time you plan to go to bed. Use 12-hour format (11:00 PM) or 24-hour format (23:00). The calculator adds 14 minutes for falling asleep and calculates wake-up times for 3-6 cycles.',
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
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">90-Minute Sleep Cycles</text><path d="M10 80 Q50 40 90 80 Q130 120 170 80 Q210 40 250 80 Q290 120 310 85" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3"/><text x="50" y="55" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Light</text><text x="130" y="100" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Deep</text><text x="210" y="55" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">REM</text><text x="290" y="100" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Light</text><text x="160" y="128" text-anchor="middle" font-size="10" fill="var(--svg-555555)">One cycle ≈ 90 minutes</text><rect x="15" y="140" width="290" height="52" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="157" text-anchor="middle" font-size="10" fill="var(--svg-555555)" font-weight="bold">Sleep Time = N × 90 min + 14 min fall-asleep</text><text x="20" y="176" font-size="9" fill="var(--svg-888888)">6 cycles: 9:14 hours → 5 cycles: 7:44 hours → 4 cycles: 6:14 hours</text><text x="20" y="190" font-size="9" fill="var(--svg-888888)">Wake at cycle end (light sleep) to feel refreshed, avoid sleep inertia</text></svg>',
      alt: 'Sleep cycle wave diagram showing 90-minute sleep cycles with light, deep, and REM stages',
      caption: 'Sleep cycles last ~90 minutes. Waking at cycle end (light sleep) leaves you refreshed; waking mid-cycle causes sleep inertia.',
    },
    formulaDescription:
      'Sleep cycles last approximately 90 minutes each, cycling through light sleep (NREM stages 1-2), deep sleep (NREM stage 3, also called slow-wave sleep), and REM sleep. The proportion of each stage changes across the night: earlier cycles have more deep sleep while later cycles have more REM sleep. Waking at the end of a cycle, during light sleep, leaves you feeling significantly more refreshed than waking in the middle of deep sleep or REM sleep — a phenomenon called sleep inertia. The 14-minute fall-asleep time is based on the average sleep onset latency for healthy adults (10-20 minutes). If you consistently fall asleep in under 5 minutes, you may be significantly sleep-deprived; if it takes over 30 minutes, you may have insomnia.',
    variables: [
      { symbol: 'N', name: 'Number of Cycles', description: 'The number of complete 90-minute sleep cycles. Most adults function best with 5-6 cycles (7.5-9 hours). 4 cycles (6 hours) may be sufficient for some; fewer than 4 cycles leads to cumulative sleep debt.' },
      { symbol: '90 min', name: 'Sleep Cycle Duration', description: 'The average length of one complete sleep cycle from light sleep through deep sleep to REM sleep. Individual variation ranges from 70-120 minutes, with the first cycle typically being shorter (70-80 min) and later cycles longer (100-120 min).' },
      { symbol: '14 min', name: 'Sleep Onset Latency', description: 'The average time it takes a healthy adult to fall asleep after getting into bed (10-20 minutes). This is called sleep onset latency and varies with sleep debt, caffeine intake, and screen exposure before bed.' },
    ],
    howToUse: [
      'Choose mode: "Wake up at" to find when you should go to bed, or "Sleep at" to find when to set your alarm.',
      'Enter your desired wake-up time or bedtime in 12-hour (6:30 AM) or 24-hour (06:30) format.',
      'View the 4 closest sleep schedule options with different cycle counts (3-6 cycles).',
      'The recommended option (highlighted) is typically 5-6 complete cycles for optimal rest.',
    ],
    explanation:
      'A sleep cycle is a repeating ~90-minute period through light sleep, deep sleep (slow-wave), and REM (rapid eye movement) sleep stages. Waking at the end of a cycle — when you are in light sleep — leaves you feeling refreshed with minimal grogginess. Waking during deep sleep or REM causes sleep inertia: that heavy, disoriented feeling that can last 30-60 minutes. This calculator helps you time your sleep so you wake near the end of a cycle. It adds 14 minutes for sleep onset latency (time to fall asleep), then works backward or forward from your target time. The recommendation algorithm prioritizes 5-6 complete cycles (7.5-9 hours), which is the CDC-recommended range for most adults. The calculator provides 4 options (3-6 cycles) so you can choose based on your schedule flexibility. The sleep cycle model is based on research by Dr. Nathaniel Kleitman, who co-discovered REM sleep in 1953, and has been validated by decades of polysomnography studies.',
    workedExamples: [
      {
        scenario: 'Sarah needs to wake up at 6:30 AM for work. What time should she go to bed to feel refreshed?',
        inputs: { mode: 'wake', wakeupTime: '6:30 AM' },
        result: 'Go to bed at 10:46 PM (5 cycles) for 7.5 hours of sleep.',
        insight: 'The 5-cycle option at 10:46 PM is recommended. This gives Sarah 7.5 hours of actual sleep (7 hours 44 minutes in bed) and aligns with CDC guidelines of 7-9 hours for adults. If Sarah goes to bed at 10:46 PM but does not fall asleep until 11:15 PM (29 minutes — longer than the 14-minute average), she should adjust by going to bed 15 minutes earlier to account for her personal sleep onset latency.',
      },
      {
        scenario: 'James is about to go to bed at 11:00 PM and wants to know the best alarm time for the morning.',
        inputs: { mode: 'sleep', bedtime: '11:00 PM' },
        result: 'Wake up at 6:44 AM (5 cycles) for 7.5 hours of sleep.',
        insight: 'The 5-cycle option (6:44 AM) is recommended. If James needs to be at work by 8:00 AM, the 6:44 AM wake time gives him 76 minutes to get ready and commute — a comfortable buffer. If he has an early meeting at 7:00 AM, the 4-cycle option (5:14 AM) gives 6 hours of sleep, which is below the recommended amount but may be sufficient for a single night without significant performance impairment.',
      },
      {
        scenario: 'Priya has a 6:00 AM flight and needs to wake up at 3:30 AM to get to the airport. She can go to bed as early as 7:00 PM. What is her best option?',
        inputs: { mode: 'wake', wakeupTime: '3:30 AM' },
        result: 'Go to bed at 7:46 PM (5 cycles) for 7.5 hours of sleep.',
        insight: 'The 5-cycle option at 7:46 PM is the best realistic choice. It gives Priya 7.5 hours of quality sleep. She should begin her bedtime routine (screen-free time, dimming lights) by 7:00 PM to be in bed by 7:46 PM. A melatonin supplement (0.3-1 mg) taken at 6:30 PM may help shift her circadian rhythm earlier for this unusually early bedtime. On the plane, she can use the 6:00 AM departure to take a 90-minute nap timed to end in light sleep to minimize jet lag upon arrival.',
      },
    ],
    proTips: [
      'Consistency beats duration — going to bed and waking up at the same time every day (including weekends) improves sleep quality more than sleeping an extra hour on weekends. Your circadian rhythm thrives on predictability.',
      'If you miss your calculated bedtime by more than 20 minutes, skip to the next cycle. Going to bed at 10:05 PM when 9:46 PM was the target means you are starting a new cycle — keep yourself awake until 11:16 PM for the next window rather than entering a cycle mid-stream.',
      'The 14-minute fall-asleep average is for healthy adults without sleep disorders. Track your personal sleep onset latency with a sleep diary for 2 weeks (time when you get in bed vs. time you actually fall asleep). If you consistently take 25 minutes, use 25 in your mental calculation instead of 14.',
      'Blue light from screens suppresses melatonin production for 90+ minutes after exposure. For optimal sleep onset at your calculated bedtime, stop using phones, tablets, and computers 60-90 minutes before bed. If you must use screens, wear amber-tinted blue-blocking glasses or use night mode with color temperature set to 2700K or lower.',
      'Caffeine has a half-life of 5-6 hours — half the caffeine from a 3:00 PM coffee is still in your bloodstream at 8:00-9:00 PM. For a 10:46 PM bedtime, stop caffeine by noon, or at minimum no later than 2:00 PM. Even if you "sleep fine" with evening caffeine, it reduces deep sleep duration by 15-20% without you being aware of it.',
      'Exercise improves sleep quality but timing matters. Vigorous exercise within 2 hours of bedtime elevates core body temperature and heart rate, delaying sleep onset. For a 10:46 PM bedtime, finish intense workouts by 8:00 PM. Gentle yoga, stretching, or walking in the evening can actually improve sleep onset.',
    ],
    limitations: [
      'When not to use: If you have a diagnosed sleep disorder (sleep apnea, narcolepsy, RLS, parasomnias), use a medically supervised sleep study (polysomnogram) instead. For shift workers with circadian rhythm disorder, consult a sleep medicine specialist — cycle-based timing alone cannot overcome a misaligned biological clock without light therapy or melatonin intervention.',
      'The 14-minute sleep onset latency is an average from population studies. Individual sleep onset varies widely based on sleep debt (shorter latency when sleep-deprived), caffeine intake, stress, screen exposure, and medical conditions. People with insomnia may take 30-60+ minutes to fall asleep.',
      'This calculator does not account for sleep disorders such as sleep apnea (interrupted breathing), narcolepsy, restless leg syndrome, or parasomnias. These conditions disrupt normal sleep architecture and reduce the effectiveness of cycle-based timing.',
      'Shift workers and people with circadian rhythm disorders (delayed sleep phase, advanced sleep phase) may be unable to fall asleep at the calculated times because their biological clock is shifted relative to the clock time. Melatonin and light therapy may be needed to shift the circadian rhythm first.',
      'Polyphasic sleep schedules (multiple short sleep periods per day) operate on fundamentally different sleep architecture than monophasic sleep. This calculator is designed for a single overnight sleep period and does not apply to nap-based schedules.',
    ],
    quickReference: [
      { label: 'Wake at 6:00 AM', value: 'Bedtimes: 7:46 PM, 9:16 PM, 10:46 PM, 12:16 AM' },
      { label: 'Wake at 7:00 AM', value: 'Bedtimes: 8:46 PM, 10:16 PM, 11:46 PM, 1:16 AM' },
      { label: 'Wake at 8:00 AM', value: 'Bedtimes: 9:46 PM, 11:16 PM, 12:46 AM, 2:16 AM' },
      { label: 'Bed at 10:00 PM', value: 'Wake: 3:44 AM, 5:14 AM, 6:44 AM, 8:14 AM' },
      { label: 'Bed at 11:00 PM', value: 'Wake: 4:44 AM, 6:14 AM, 7:44 AM, 9:14 AM' },
      { label: '3 cycles (4.5 hrs)', value: 'Minimum functional sleep for 1 night' },
      { label: '5 cycles (7.5 hrs)', value: 'Recommended — sweet spot for adults' },
      { label: '6 cycles (9 hrs)', value: 'Ideal — athletes, recovery, illness' },
    ],
    commonUses: [
      'Morning alarm planning — set an alarm that wakes you at the end of a sleep cycle rather than in the middle, reducing morning grogginess and sleep inertia.',
      'Shift work schedule adaptation — workers rotating between day and night shifts use cycle timing to maximize sleep quality within constrained time windows.',
      'Jet lag minimization — travelers calculate optimal sleep and wake times based on destination time zones to synchronize circadian rhythms faster upon arrival.',
      'New parent sleep strategy — parents of infants use cycle-based timing to maximize the value of fragmented sleep, timing their own sleep to coincide with the babys longest predicted sleep window.',
      'Athletic recovery planning — athletes and coaches schedule sleep around competition times, prioritizing deep sleep for physical recovery and REM sleep for motor skill consolidation.',
    ],
    faqs: [
      {
        question: 'What happens if I wake up in the middle of a cycle?',
        answer: 'Waking during deep sleep (NREM Stage 3) or REM sleep can cause sleep inertia — that groggy, disoriented feeling that can last 30-60 minutes. Deep sleep is characterized by high-amplitude delta brain waves and is the hardest stage from which to wake. Waking at the end of a cycle, during light sleep (NREM Stage 1-2), helps you feel more refreshed and alert. This is the core principle behind sleep cycle alarm clocks and this calculator.',
      },
      {
        question: 'Is 14 minutes the average time to fall asleep?',
        answer: 'Yes, clinical sleep studies show that the average healthy adult takes 10-20 minutes to fall asleep after getting into bed (sleep onset latency). Falling asleep in under 5 minutes may indicate significant sleep deprivation — your body is so starved for sleep that it enters sleep almost immediately, bypassing the normal wind-down period. Taking longer than 30 minutes to fall asleep consistently may indicate insomnia or anxiety. Track your personal average over 2 weeks for best results with this calculator.',
      },
      {
        question: 'Are sleep cycles exactly 90 minutes?',
        answer: 'Not exactly. Sleep cycles range from 70-120 minutes, with 90 minutes being the population average. The first cycle of the night tends to be shorter (70-80 minutes) and contains proportionally more deep slow-wave sleep. Later cycles become longer (100-120 minutes) and contain more REM sleep. This means that if you only sleep 4.5 hours (3 cycles), you will get a higher proportion of deep sleep but very little REM sleep, which can impair memory consolidation and emotional regulation.',
      },
      {
        question: 'How many sleep cycles do I need?',
        answer: 'Most adults need 5-6 complete cycles (7.5-9 hours). The CDC and National Sleep Foundation recommend 7-9 hours for adults aged 18-64, 7-8 hours for adults 65+, and 8-10 hours for teenagers. Some people function well on 4 cycles (6 hours), but this is a genetic trait found in only about 3-5% of the population (the DEC2 gene mutation). If you need an alarm to wake up and feel groggy before caffeine, you are almost certainly not a natural short sleeper.',
      },
      {
        question: 'How do I know my personal sleep cycle length?',
        answer: 'Track your natural wake times without an alarm for 1-2 weeks (vacation is ideal). Go to bed at the same time each night and note when you wake up naturally. Divide total sleep time by the number of times you remember briefly waking (most people have micro-awakenings between cycles that they dont remember). If you sleep 7.5 hours and recall 5 brief moments of wakefulness (at cycle transitions), your personal cycle length is about 90 minutes. Wearable sleep trackers (Fitbit, Oura, Apple Watch) can estimate cycle length from heart rate variability and movement data, though their accuracy varies. The gold standard for measuring sleep architecture is a polysomnogram (sleep study) in a clinical setting.',
      },
      {
        question: 'Does this calculator work for naps?',
        answer: 'Partially. The cycle model applies to naps primarily in terms of avoiding deep sleep. A 20-minute "power nap" stays in light sleep (NREM 1-2) and avoids deep sleep, making it easy to wake up refreshed. A 90-minute nap completes one full cycle (light → deep → REM → light) and also ends during light sleep, making it the second-best nap length. Avoid 45-60 minute naps, which end during deep sleep and cause significant sleep inertia. However, this calculator is designed for a full night\'s sleep with multiple cycles, not single-cycle naps.',
      },
      {
        question: 'How do alcohol, exercise, and eating affect sleep cycle timing?',
        answer: 'Alcohol before bed fragments sleep architecture: it increases deep sleep in the first half of the night (the "sedation" effect) but causes REM rebound in the second half, leading to more awakenings and less restorative sleep. Exercise within 2 hours of bedtime raises core temperature, delaying sleep onset; morning exercise improves deep sleep quality. Large meals within 3 hours of bedtime increase metabolic activity and core temperature, disrupting the first sleep cycle. For accurate cycle timing: avoid alcohol within 3 hours of bedtime, finish exercise by early evening, and eat dinner at least 3 hours before your calculated bedtime. A light carbohydrate snack (banana, crackers) 30 minutes before bed can actually help sleep onset by increasing tryptophan availability in the brain.',
      },
    ],
    citations: [
      { source: 'CDC - Sleep and Sleep Disorders', url: 'https://www.cdc.gov/sleep/' },
      { source: 'National Sleep Foundation - Sleep Duration Recommendations', url: 'https://www.thensf.org/' },
      { source: 'Kleitman, N. (1963). Sleep and Wakefulness. University of Chicago Press.', url: 'https://press.uchicago.edu/ucp/books/book/chicago/S/bo5950866.html' },
    ],
  },
};

export default sleepConfig;
