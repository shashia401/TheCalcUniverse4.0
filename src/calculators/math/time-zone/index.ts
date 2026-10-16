import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import TimeZonePanel from './TimeZonePanel';
import {
  ZONES,
  WORLD_CLOCK,
  calcOverlap,
  dayLabel,
  findZone,
  formatClock,
  formatOffset,
  isDaylightTime,
  localAt,
  wallToUtc,
} from './tzMath';
import { parseClockTime } from '../../../utils/clockTime';
import { parseIsoDateUtc } from '../../../utils/isoDate';

/* ------------------------------------------------------------------ */
/*  Calculator config                                                  */
/* ------------------------------------------------------------------ */

// Zones, offsets (DST-aware, by date), parsing and overlap maths live in tzMath.ts / the shared utils.
const tzOptions = ZONES.map((z) => ({ label: z.label, value: z.id }));

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'fromZone',
      label: 'From Time Zone',
      type: 'select',
      options: tzOptions,
    },
    {
      id: 'toZone',
      label: 'To Time Zone',
      type: 'select',
      options: tzOptions,
    },
    {
      id: 'time',
      label: 'Time',
      type: 'text',
      required: true,
      placeholder: 'e.g., 2:30 PM or 14:30',
      helpText: 'Enter time in 12hr or 24hr format (e.g., 9 AM, 2:30 PM, or 14:30)',
    },
    {
      id: 'date',
      label: 'Date',
      type: 'date',
      helpText: 'The day you mean. Daylight saving time is applied for this date in each zone; leave blank for today.',
    },
    {
      id: 'includeBusinessHours',
      label: 'Business Hours Overlay',
      type: 'select',
      options: [
        { label: 'Yes - show overlap', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      defaultValue: 'yes',
      helpText: 'Color-coded overlap finding - green = both zones in business hours',
    },
  ],

  calculate: (values) => {
    const src = findZone(values.fromZone ?? '');
    const dst = findZone(values.toZone ?? '');
    const minutes = parseClockTime(values.time ?? '');
    if (!src || !dst || minutes === null) return [];

    // The DATE decides daylight saving. Blank means today; a typed date must be a real calendar date.
    const dateStr = (values.date ?? '').trim();
    let dayMs: number;
    if (dateStr === '') {
      const now = new Date();
      dayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    } else {
      const parsed = parseIsoDateUtc(dateStr);
      if (parsed === null) return [];
      dayMs = parsed;
    }
    const year = new Date(dayMs).getUTCFullYear();
    if (year < 1970 || year > 2100) {
      return [{ id: 'error', label: 'Date out of range', value: 'Choose a date between 1970 and 2100.', color: 'negative' as const }];
    }
    const isoDay = new Date(dayMs).toISOString().slice(0, 10);

    try {
      // One instant in time, read off the clocks of both zones; each zone's own offset on THAT date is used.
      const { utcMs, kind } = wallToUtc(src.iana, dayMs + minutes * 60_000);
      const from = localAt(src.iana, utcMs);
      const to = localAt(dst.iana, utcMs);
      const diffMin = to.offsetMin - from.offsetMin;
      const dayDelta = to.dayNumber - from.dayNumber;

      const convertedTime = formatClock(to.minutesOfDay) + dayLabel(dayDelta);

      // Time difference on that date, e.g. "9.5 hours ahead"
      const diff = diffMin / 60;
      const abs = Math.abs(diff);
      const hoursText = `${abs} hour${abs !== 1 ? 's' : ''}`;
      const diffDesc = diff === 0 ? 'Same time' : diff > 0 ? `${hoursText} ahead` : `${hoursText} behind`;

      const withDst = (z: { iana: string; label: string }, off: number) =>
        `${z.label} -- ${formatOffset(off)}${isDaylightTime(z.iana, utcMs) ? ' (DST)' : ''}`;

      const results: CalculatorResult[] = [
        {
          id: 'convertedTime',
          label: 'Converted Time',
          value: convertedTime,
          highlight: true,
          color: 'positive',
        },
        {
          id: 'fromInfo',
          label: 'From',
          value: withDst(src, from.offsetMin),
        },
        {
          id: 'toInfo',
          label: 'To',
          value: withDst(dst, to.offsetMin),
        },
        {
          id: 'timeDifference',
          label: 'Time Difference',
          value: diffDesc,
        },
        {
          id: 'dateUsed',
          label: 'Date used for daylight saving',
          value: dateStr === '' ? `${isoDay} (today)` : isoDay,
        },
      ];

      if (kind === 'gap') {
        results.push({
          id: 'dstNote',
          label: 'Clock change',
          value: `${formatClock(minutes)} does not exist on ${isoDay} in ${src.label}: the clocks jump forward. It is read as ${formatClock(from.minutesOfDay)}.`,
          color: 'negative',
        });
      } else if (kind === 'ambiguous') {
        results.push({
          id: 'dstNote',
          label: 'Clock change',
          value: `${formatClock(minutes)} happens twice on ${isoDay} in ${src.label}: the clocks fall back. The first one (daylight time) is used.`,
          color: 'negative',
        });
      }

      if (values.includeBusinessHours === 'yes') {
        const overlap = calcOverlap(diffMin);
        const wrap = (m: number) => ((m % 1440) + 1440) % 1440;

        if (overlap.durationHours > 0) {
          const n = overlap.durationHours;
          results.push({
            id: 'businessOverlap',
            label: 'Business Hours Overlap',
            value: `${formatClock(wrap(overlap.overlapStart + diffMin))} -- ${formatClock(wrap(overlap.overlapEnd + diffMin))} (${n} hour${n !== 1 ? 's' : ''}, ${dst.label} time)`,
          });
        } else {
          results.push({
            id: 'businessOverlap',
            label: 'Business Hours Overlap',
            value: 'No overlap in business hours',
          });
        }

        results.push({
          id: 'overlapData',
          label: 'Overlap Data',
          value: JSON.stringify(overlap),
        });
      }

      // Everything the panel draws, so it never re-parses the inputs or guesses offsets (ids starting "_" are hidden).
      results.push({
        id: '_tz',
        label: '',
        value: JSON.stringify({
          fromLabel: src.label,
          toLabel: dst.label,
          sourceClock: formatClock(from.minutesOfDay),
          targetClock: formatClock(to.minutesOfDay),
          dayDelta,
          worldClock: WORLD_CLOCK.map((w) => {
            const t = localAt(w.iana, utcMs);
            return { label: w.label, clock: formatClock(t.minutesOfDay), dayDelta: t.dayNumber - from.dayNumber };
          }),
        }),
      });

      return results;
    } catch {
      return []; // an engine without full Intl time zone support
    }
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TimeZonePanel, { values, results });
  },

  educational: {
    formula: 'TargetTime = SourceTime - SourceOffset + TargetOffset',
    formulaDescription:
      'Convert a time from one time zone to another by accounting for the UTC offset difference between the two zones. Every time zone has a UTC offset (e.g., EST is UTC-5, PST is UTC-8). To convert, first normalize the source time to UTC by subtracting its offset, then apply the target offset to get the local time in the destination zone. This two-step process ensures accuracy regardless of which direction the conversion goes. Offsets are not fixed: each zone\'s offset is looked up for the date you choose, so Daylight Saving Time (EDT instead of EST, BST instead of GMT, and so on) is applied automatically and the gap between two zones can change during the year.',
    variables: [
      { symbol: 'SourceTime', name: 'Source Time', description: 'The time in the original time zone that you want to convert from.' },
      { symbol: 'SourceOffset', name: 'Source Offset', description: 'UTC offset of the source time zone. Eastern Standard Time is UTC-5, Central European Time is UTC+1, etc.' },
      { symbol: 'TargetOffset', name: 'Target Offset', description: 'UTC offset of the target time zone that you want to convert to.' },
    ],
    howToUse: [
      'Select the source time zone (the zone you know the time in) from the dropdown list.',
      'Select the target time zone (the zone you want to convert to) from the dropdown list.',
      'Enter the time in either 12-hour format (e.g., 2:30 PM) or 24-hour format (e.g., 14:30).',
      'Optionally select a date so the calculator can account for Daylight Saving Time offsets.',
      'Enable "Business Hours Overlay" to see when the standard 9 AM-5 PM workday overlaps between the two zones.',
    ],
    explanation:
      'Time zone conversion accounts for the difference in UTC offsets between regions. The calculator determines the offset for the source and target zones, computes the difference (target offset minus source offset), and applies it to the entered time. A positive difference means the target time is ahead (later in the day), and a negative difference means it is behind (earlier in the day). The Business Hours Overlay shows when the standard 9 AM-5 PM workday overlaps across both zones, which is essential for scheduling international meetings, conference calls, and remote collaboration across time zones. The overlay color-codes each hour block: green when both zones are within business hours, yellow when only one is, and gray when neither is.',
    faqs: [
      {
        question: 'Do you account for Daylight Saving Time?',
        answer:
          'Yes. Each zone follows the IANA time zone database (the same one your phone and operating system use), and the date you pick decides which offset applies. For example, New York is UTC-5 (EST) in January and UTC-4 (EDT) in July, and London is UTC+0 in winter and UTC+1 (BST) in summer. Because countries change their clocks on different dates, the gap between two zones can differ for a few weeks a year: New York to London is 4 hours on 20 March 2026 (the US has already changed, the UK has not) but 5 hours on 31 March. Leave the date blank to use today. If the time you enter does not exist (the hour skipped when clocks go forward) or happens twice (the hour repeated when they go back), the calculator says so and explains how it read it.',
      },
      {
        question: 'What are business hours?',
        answer:
          'Business hours are defined as 9:00 AM to 5:00 PM local time (weekdays versus weekends are not considered). The overlay shows when both zones overlap during these hours, color-coded: green (both zones are in business hours), yellow (only one zone is in business hours), or gray (neither zone is in business hours). This is useful for finding the best times for international meetings.',
      },
      {
        question: 'How do I convert times that are already in UTC?',
        answer: 'To convert from UTC to another zone, select UTC (offset +0:00) as the source time zone. To convert a local time to UTC, select UTC as the target time zone. This is useful for logging events in a standardized time format that is independent of local time zone.',
      },
      {
        question: 'How do I find the best meeting time across multiple time zones?',
        answer: 'Enable the "Business Hours Overlay" toggle. The calculator will show a color-coded grid of all 24 hours, marking which hours overlap as business hours (9 AM-5 PM) in both zones. Green = both zones are working, Yellow = only one zone is working, Gray = neither zone is working. For meetings spanning three or more zones, convert pairwise to find the intersection of green blocks. Generally, early morning in the Americas (7-9 AM ET) overlaps with afternoon in Europe (1-3 PM CET), making it the most common transatlantic meeting window.',
      },
      {
        question: 'Why does the converted time show "(next day)" or "(previous day)"?',
        answer: 'When the time zone difference causes the converted time to cross midnight, the calculator adds a label indicating the day shift. For example, in winter 9:00 AM PST (UTC-8) converted to JST (UTC+9) is a 17-hour difference, resulting in 2:00 AM the next day. This is essential for scheduling international calls — you don\'t want to call someone at 2:00 AM their time. The "(next day)" and "(previous day)" markers help you spot these day-boundary crossings immediately.',
      },
      {
        question: 'What are half-hour and quarter-hour time zones?',
        answer: 'Some regions use non-integer UTC offsets. India (IST) is UTC+5:30, Newfoundland (NST) is UTC-3:30, and Nepal is UTC+5:45. The calculator correctly handles these fractional offsets. For example, when it is 12:00 PM in New York (EST, UTC-5), it is 10:30 PM in India (IST, UTC+5:30) — a 10.5-hour difference rather than a round 10 or 11 hours. Fractional offsets are common in South Asia, parts of Australia, and some Pacific islands.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Sarah is a product manager in San Francisco scheduling a video call with her engineering team in London on 15 June 2026. She wants to propose 9:00 AM her time and needs to know what time that is for the London team.',
        inputs: { fromZone: 'pst', toZone: 'bst', time: '9:00 AM', date: '2026-06-15', includeBusinessHours: 'yes' },
        result: '5:00 PM London time (8 hours ahead); No overlap in business hours',
        insight: 'In June San Francisco is on PDT (UTC-7) and London on BST (UTC+1), so 9:00 AM in San Francisco = 5:00 PM in London -- right at the very end of London\'s workday. Because San Francisco business hours (9 AM-5 PM, which map to 5 PM-1 AM London time) and London business hours (9 AM-5 PM) are two 8-hour windows separated by exactly the 8-hour offset, they never overlap -- a well-known scheduling headache between California and the UK. Teams in this situation typically have to schedule outside one side\'s normal business hours, such as an early call for the Bay Area team or a late one for London.',
      },
      {
        scenario: 'Raj is based in Mumbai (IST, UTC+5:30) and needs to join a webinar hosted from New York at 2:00 PM Eastern Time on 20 January 2026. He wants to know if he will need to stay up late.',
        inputs: { fromZone: 'est', toZone: 'ist', time: '2:00 PM', date: '2026-01-20', includeBusinessHours: 'no' },
        result: '12:30 AM IST (next day); 10.5 hours ahead',
        insight: '2:00 PM EST = 12:30 AM IST (next day). The 10.5-hour difference means Raj would need to join at half past midnight. (In July, when New York is on EDT, the gap shrinks to 9.5 hours and the same call would be 11:30 PM IST.) This is typical for US-India scheduling — US business hours (9 AM-5 PM) map to 7:30 PM-3:30 AM IST. For a more convenient time, the US presenter should consider an early morning slot (7:00 AM EST = 5:30 PM IST), which is reasonable for both parties.',
      },
      {
        scenario: 'A global customer support team with offices in Tokyo (JST), London (GMT), and New York (EST) needs to find overlapping business hours for a handoff meeting. They want to know: when are all three offices simultaneously in business hours?',
        inputs: { fromZone: 'est', toZone: 'jst', time: '8:00 AM', date: '2026-01-12', includeBusinessHours: 'yes' },
        result: '8:00 AM EST = 10:00 PM JST (same day); 14 hours ahead; No overlap in business hours',
        insight: 'This is a "follow the sun" challenge. EST (UTC-5) 8:00 AM = GMT (UTC+0) 1:00 PM = JST (UTC+9) 10:00 PM. JST is outside business hours at 10 PM. Running the pairwise checks (in January): EST-GMT overlap is 9:00 AM-12:00 PM EST / 2:00-5:00 PM GMT. GMT-JST has no overlap — JST business hours (9 AM-5 PM) are GMT 12:00 AM-8:00 AM. The three zones never overlap in standard business hours. The best compromise is a 7:00 AM EST / 12:00 PM GMT / 9:00 PM JST call, where JST is just at the edge.',
      },
    ],
    proTips: [
      'Bookmark the most common conversions you use. For example, if you regularly convert between New York and India, remember the difference is 10.5 hours in winter (EST) and 9.5 hours in summer (EDT). The calculator applies the right one for the date, but knowing the pattern speeds up quick mental checks.',
      'Use the Business Hours Overlay as a "meeting time finder." Green hours (both zones 9 AM-5 PM) are the only times you should propose for synchronous meetings. Yellow hours mean one side is working outside normal hours — a signal to negotiate or find an alternative.',
      'For recurring meetings across DST-observing zones, the time difference shifts by an hour when one zone changes its clocks and the other does not (or when they change on different dates; the US, Europe and Australia all use different dates, and the southern hemisphere moves the opposite way). Check the date of every occurrence, not just the first one: the calculator applies each zone\'s rules for the date you enter.',
      'When converting times for flight bookings, always confirm with the airline\'s published schedule. The calculator gives you the mathematical conversion, but airlines may use different time zone references (local departure time vs. local arrival time) that align with this calculation.',
      'The JSON overlap data in the results is useful for developers building scheduling apps. Parse the "overlapData" result field to get the raw hour-by-hour array with color codes, which you can use to build custom meeting-time visualizations.',
    ],
    quickReference: [
      { label: 'EST (New York)', value: 'UTC-5 (UTC-4 EDT)' },
      { label: 'PST (Los Angeles)', value: 'UTC-8 (UTC-7 PDT)' },
      { label: 'GMT/UTC (London)', value: 'UTC+0 (UTC+1 BST)' },
      { label: 'CET (Paris/Berlin)', value: 'UTC+1 (UTC+2 CEST)' },
      { label: 'IST (Mumbai)', value: 'UTC+5:30' },
      { label: 'JST (Tokyo)', value: 'UTC+9' },
      { label: 'AEST (Sydney)', value: 'UTC+10 (UTC+11 AEDT)' },
      { label: '', value: '' },
      { label: 'Business hours', value: '9:00 AM – 5:00 PM local' },
      { label: 'Green = overlap', value: 'Both zones working' },
    ],
    limitations: [
      'Offsets come from the time zone database built into your browser (IANA tzdata) and cover 1970 to 2100. Future daylight saving rules can still be changed by governments after this page is loaded, and dates beyond the next few years are projections of today\'s rules.',
      'The business hours overlay uses a fixed 9:00 AM-5:00 PM window for all zones, which may not match actual working hours in all cultures (e.g., Spain often works 9:00 AM-2:00 PM and 4:00 PM-7:00 PM; some Middle Eastern countries work Sunday-Thursday).',
      'The calculator supports 24 pre-defined time zones — it does not cover every IANA time zone (there are over 300), so some specific regional zones may not be listed.',
      'The overlay does not account for lunch breaks, flexible hours, or 4-day work weeks. The green/yellow/gray color coding is a rough scheduling guide, not a definitive calendar.',
      'The business hours overlay compares 9 AM-5 PM in each zone using the offsets for the chosen date; it does not look at weekdays, so a Saturday in one zone is treated like any other day.',
    ],
    citations: [
      { source: 'Wikipedia - Time Zone', url: 'https://en.wikipedia.org/wiki/Time_zone' },
      { source: 'IANA - Time Zone Database', url: 'https://www.iana.org/time-zones' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">World Time Zone Conversion</text><rect x="10" y="32" width="300" height="36" rx="6" fill="var(--svg-f0f4ff)"/><text x="160" y="46" text-anchor="middle" font-size="10" fill="var(--svg-555555)" font-weight="bold">UTC Offsets</text><text x="22" y="62" font-size="9" fill="var(--svg-333333)">PST −8</text><text x="70" y="62" font-size="9" fill="var(--svg-333333)">EST −5</text><text x="122" y="62" font-size="9" fill="var(--svg-333333)">UTC 0</text><text x="171" y="62" font-size="9" fill="var(--svg-333333)">CET +1</text><text x="221" y="62" font-size="9" fill="var(--svg-333333)">IST +5.5</text><text x="275" y="62" font-size="9" fill="var(--svg-333333)">JST +9</text><rect x="10" y="78" width="300" height="42" rx="6" fill="var(--svg-fff5f5)"/><text x="160" y="94" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">TargetTime = SourceTime − SourceOffset + TargetOffset</text><text x="22" y="112" font-size="9" fill="var(--svg-888888)">Example: 2:00 PM EST (UTC−5) → 11:00 AM PST (UTC−8)</text><text x="160" y="138" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Business Hours Overlap</text><rect x="15" y="148" width="290" height="24" rx="4" fill="var(--svg-d1fae5)"/><text x="30" y="164" font-size="10" fill="var(--svg-065f46)">Both zones in business hours (9 AM–5 PM)</text><rect x="160" y="150" width="60" height="8" rx="2" fill="var(--svg-fbbf24)"/><text x="15" y="185" font-size="9" fill="var(--svg-888888)">Green = both working | Yellow = one working | Gray = neither</text></svg>',
      alt: 'World time zone conversion showing UTC offsets and formula',
      caption: 'Time zone conversion adjusts for UTC offset differences; business hours overlay shows when work schedules overlap.',
    },
  },
};

export default config;
