import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SchengenVisaPanel from './SchengenVisaPanel';
import { MAX_DAYS, WINDOW_DAYS, fromDayNum, schengenInfo, toIsoDate } from './schengenMath';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const schengenVisaConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'checkDate',
      label: 'Check Date',
      type: 'date',
      placeholder: getTodayString(),
      helpText: 'Date to check your 90/180 day status (default: today). Set this to the date you plan to enter or re-enter the Schengen Area.',
    },
    {
      id: 'trip1Start',
      label: 'Trip 1 Start Date',
      type: 'date',
      required: true,
      helpText: 'First day of your first Schengen trip (day of entry counts)',
    },
    {
      id: 'trip1End',
      label: 'Trip 1 End Date',
      type: 'date',
      required: true,
      helpText: 'Last day of your first Schengen trip (day of exit counts)',
    },
    {
      id: 'trip2Start',
      label: 'Trip 2 Start Date',
      type: 'date',
      helpText: 'First day of your second Schengen trip (optional)',
    },
    {
      id: 'trip2End',
      label: 'Trip 2 End Date',
      type: 'date',
      helpText: 'Last day of your second Schengen trip (optional)',
    },
    {
      id: 'trip3Start',
      label: 'Trip 3 Start Date',
      type: 'date',
      helpText: 'First day of your third Schengen trip (optional)',
    },
    {
      id: 'trip3End',
      label: 'Trip 3 End Date',
      type: 'date',
      helpText: 'Last day of your third Schengen trip (optional)',
    },
    {
      id: 'trip4Start',
      label: 'Trip 4 Start Date',
      type: 'date',
      helpText: 'First day of your fourth Schengen trip (optional)',
    },
    {
      id: 'trip4End',
      label: 'Trip 4 End Date',
      type: 'date',
      helpText: 'Last day of your fourth Schengen trip (optional)',
    },
    {
      id: 'trip5Start',
      label: 'Trip 5 Start Date',
      type: 'date',
      helpText: 'First day of your fifth Schengen trip (optional)',
    },
    {
      id: 'trip5End',
      label: 'Trip 5 End Date',
      type: 'date',
      helpText: 'Last day of your fifth Schengen trip (optional)',
    },
  ],
  calculate: (values) => {
    const info = schengenInfo(values);
    if (!info) return [];
    const { used, remaining, overstay } = info;
    const fd = (n: number) => formatDate(fromDayNum(n));
    const results: ReturnType<CalculatorConfig['calculate']> = [];

    results.push({
      id: 'totalDaysUsed',
      label: 'Total Days Used (180-day window)',
      value: `${used} days`,
      highlight: true,
      color: overstay ? 'negative' : used > 70 ? 'neutral' : 'positive',
      interpretation: `Days in the Schengen area from ${fd(info.windowStart)} to ${fd(info.checkDay)} inclusive (the 180 days ending on the check date). Entry and exit days count; a day covered by two trips counts once.`,
    });

    results.push({
      id: 'daysRemaining',
      label: overstay ? 'Days Over Limit' : 'Days Remaining',
      value: overstay ? `${Math.abs(remaining)} days over` : `${remaining} days`,
      color: overstay ? 'negative' : remaining <= 10 ? 'neutral' : 'positive',
    });

    results.push({
      id: 'maxStay',
      label: 'Longest Stay Starting On The Check Date',
      value: `${info.maxStay}${info.maxStay >= 90 ? '+' : ''} days`,
      color: info.maxStay === 0 ? 'negative' : 'neutral',
      interpretation: 'Counts days rolling out of the window as the stay goes on, so it can be longer than the days remaining. Only trips before the check date are considered.',
    });

    results.push({
      id: 'checkWindow',
      label: 'Rolling Window',
      value: `${fd(info.windowStart)} – ${fd(info.checkDay)} (180 days)`,
      color: 'neutral',
    });

    info.trips.forEach((trip, i) => {
      const days = info.tripDays[i];
      results.push({
        id: `trip${i + 1}Detail`,
        label: `Trip ${i + 1}: ${fd(trip.start)} – ${fd(trip.end)}`,
        value: days > 0 ? `${days} days in window` : 'Outside 180-day window',
        color: 'neutral',
      });
    });

    if (info.ignoredLong > 0) {
      results.push({ id: 'ignoredTrips', label: 'Ignored Trips', value: `${info.ignoredLong} trip(s) ignored`, color: 'negative', warning: 'A trip longer than 366 days was ignored as a probable typing error. Check the year of its dates.' });
    }

    if (info.overlapping) {
      results.push({ id: 'overlapNote', label: 'Overlapping Trips', value: 'Some trips overlap', color: 'neutral', warning: 'Some of your trips overlap. Each calendar day is counted once in the total, so the total can be less than the sum of the trip lines.' });
    }

    if (info.allowedFrom !== null) {
      const wait = info.allowedFrom - info.checkDay;
      results.push({
        id: 'resetInfo',
        label: overstay ? 'Days Until Eligible Reset' : 'Next Day With Room',
        value: wait === 0 ? 'A new day is available on the check date' : `~${wait} days until a new day is available (${fd(info.allowedFrom)})`,
        color: overstay ? 'negative' : 'neutral',
      });
    }

    results.push({
      id: 'ruleReminder',
      label: '90/180 Rule Status',
      value: overstay
        ? `You have exceeded the 90-day limit. You must leave the Schengen Area and wait until enough days roll out of the 180-day window.`
        : `You have ${remaining} days remaining within the 180-day rolling window.`,
      color: overstay ? 'negative' : 'positive',
      warning: 'Planning aid only. Border officers and the EU Entry/Exit System use the real stamps and records, and your nationality, visa type or bilateral agreements may change the rules.',
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SchengenVisaPanel, { values, results });
  },
  explainSteps: (values) => {
    // Without a check date the window would end today; steps must depend only on the dates the user typed.
    if (!values.checkDate?.trim()) return [];
    const info = schengenInfo(values);
    if (!info) return [];
    const results = schengenVisaConfig.calculate(values);
    const val = (id: string) => resultValue(results, id) ?? '';
    const iso = (day: number) => toIsoDate(fromDayNum(day));
    const sum = info.tripDays.reduce((a, b) => a + b, 0);
    return finiteSteps([
      {
        label: 'Set the 180-day window that ends on the check date',
        expr: `${iso(info.checkDay)} − ${WINDOW_DAYS - 1} days = ${iso(info.windowStart)}, so the window is ${iso(info.windowStart)} to ${iso(info.checkDay)}`,
        note: 'The check date itself is the last day of the window.',
      },
      {
        label: 'Count each trip’s days inside the window',
        expr: info.trips.map((t, i) => `Trip ${i + 1} (${iso(t.start)} to ${iso(t.end)}): ${info.tripDays[i]} ${info.tripDays[i] === 1 ? 'day' : 'days'}`).join(' · '),
        note: 'Entry and exit days both count.',
      },
      {
        label: 'Count every calendar day once',
        expr: info.overlapping
          ? `${info.tripDays.join(' + ')} = ${sum}, minus ${sum - info.used} overlapping = ${val('totalDaysUsed')}`
          : info.tripDays.length > 1
            ? `${info.tripDays.join(' + ')} = ${val('totalDaysUsed')}`
            : val('totalDaysUsed'),
        note: info.overlapping ? 'A day covered by two trips counts once.' : undefined,
      },
      {
        label: `Compare with the ${MAX_DAYS}-day limit`,
        expr: info.overstay ? `${info.used} − ${MAX_DAYS} = ${val('daysRemaining')}` : `${MAX_DAYS} − ${info.used} = ${val('daysRemaining')}`,
      },
    ]);
  },
  educational: {
    formula: 'Total Days in Schengen Area (within any rolling 180-day window) ≤ 90',
    formulaDescription:
      'The 90/180 rule states that visitors who do not need a long-stay visa may stay up to 90 days within any rolling 180-day period across all Schengen Area countries. For a given day, count the days spent in the area during the 180 days ending on that day (that day included); the total must not exceed 90 on any day of the stay. The day of entry and the day of exit both count. This calculator follows that method, counts a day covered by two trips once, and also shows the longest stay you could start on the check date.',
    diagram: {
      svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="240" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Rolling 180-Day Window</text>' +
        '<!-- Window bar -->' +
        '<rect x="30" y="40" width="300" height="30" rx="6" fill="var(--svg-3b82f6)" opacity="0.15"/>' +
        '<text x="180" y="59" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-3b82f6)" font-weight="600" text-anchor="middle">180-Day Rolling Window</text>' +
        '<!-- Trip blocks -->' +
        '<rect x="60" y="45" width="50" height="20" rx="3" fill="var(--svg-22c55e)" opacity="0.8"/>' +
        '<rect x="180" y="45" width="70" height="20" rx="3" fill="var(--svg-f59e0b)" opacity="0.8"/>' +
        '<rect x="290" y="45" width="30" height="20" rx="3" fill="var(--svg-ef4444)" opacity="0.8"/>' +
        '<text x="85" y="100" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">Trip 1</text>' +
        '<text x="215" y="100" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">Trip 2</text>' +
        '<text x="305" y="100" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">Trip 3</text>' +
        '<!-- Arrow -->' +
        '<text x="380" y="50" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)">Check</text>' +
        '<text x="380" y="62" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)">Date</text>' +
        '<polygon points="330,55 345,50 345,60" fill="var(--svg-64748b)"/>' +
        '</svg>',
      alt: 'Diagram showing a rolling 180-day window with multiple trips inside it',
      caption: 'The 180-day window rolls forward each day. Each trip\'s days are counted only if they fall within the window.',
    },
    variables: [
      { symbol: '90-Day Limit', name: 'Maximum Stay', description: 'The maximum total number of days you can spend in the Schengen Area within any rolling 180-day window.' },
      { symbol: '180-Day Window', name: 'Rolling Reference Period', description: 'A continuously moving window that looks back 180 days from each check date. As each day passes, the oldest day drops out and a new day enters.' },
      { symbol: 'Schengen Area', name: 'Zone of Free Movement', description: 'A group of 29 European countries (25 EU members plus Iceland, Norway, Switzerland and Liechtenstein) that have abolished internal border controls. Ireland and Cyprus are EU members outside Schengen.' },
    ],
    workedExamples: [
      {
        scenario: 'Checking Remaining Days Before a New Trip',
        inputs: {
          checkDate: '2026-07-01',
          trip1Start: '2026-03-01',
          trip1End: '2026-03-30',
          trip2Start: '2026-06-01',
          trip2End: '2026-06-10',
        },
        result: '40 days used (Mar 1-30: 30 days + Jun 1-10: 10 days). 50 days remaining within the 180-day window Jan 3 - Jul 1, 2026.',
        insight:
          'With two previous trips totaling 40 days (30 days in March + 10 days in June), and a check date of July 1, 2026, the calculator shows 50 days remaining. The March trip (30 days) is approximately 4 months old, so it remains fully inside the 180-day window. This traveler can still plan a trip of up to 50 days. However, note that the June trip will only roll out in early December 2026, so future travel must account for those 10 days until then.',
      },
      {
        scenario: 'Detecting an Overstay and Finding the Reset Date',
        inputs: {
          checkDate: '2026-05-01',
          trip1Start: '2025-11-01',
          trip1End: '2026-02-15',
          trip2Start: '2026-03-01',
          trip2End: '2026-03-20',
        },
        result: '125 days used (Trip 1: 105 days in the window + Trip 2: 20 days). 35 days over the 90-day limit. Window: Nov 3, 2025 - May 1, 2026.',
        insight:
          'Trip 1 spans 107 days (Nov 1 to Feb 15), which already exceeds the 90-day limit by itself. When checked on May 1, 2026, the 180-day window runs from November 3, 2025, so only the first 2 days of Trip 1 have rolled out and 105 of its days still count, plus 20 days from Trip 2: 125 in total, 35 over the limit. The calculator then finds the first date on which one more day fits (the reset date) by letting the oldest days roll out of the window.',
      },
    ],
    quickReference: [
      { label: 'Maximum Stay', value: '90 days in any 180-day window' },
      { label: 'Window Type', value: 'Rolling (not calendar year)' },
      { label: 'Day Count', value: 'Entry day and exit day both count' },
      { label: 'Schengen Countries', value: '29 (25 EU members + Iceland, Norway, Switzerland, Liechtenstein)' },
      { label: 'Reset Mechanism', value: 'Oldest trip days gradually roll out as the window moves forward' },
    ],
    proTips: [
      'Keep a record of every entry and exit date (passport stamps, boarding passes). Since the EU Entry/Exit System became fully operational in April 2026, border records are electronic, so your own log should match them. The European Commission also publishes an official short-stay calculator.',
      'Always set the "Check Date" to the day you plan to RE-ENTER the Schengen Area, not the day you plan to leave. This ensures you are not denied entry at the border.',
      'If you travel frequently to the Schengen Area, consider maintaining at least a 15-day buffer (stay under 75 days used) to avoid accidentally exceeding the limit due to flight delays, cancellations, or miscalculations.',
      'Remember that airport transit within the Schengen Area (e.g., connecting through Amsterdam to a non-Schengen destination) may count if you pass through passport control. Always confirm whether you will enter the Schengen Area during a layover.',
      'For long-stay visitors (e.g., digital nomads staying 90 days and then exiting), after a continuous 90-day stay, a new full 90-day stay is possible once the whole first stay has left the window, which is 180 days after the last day of that stay (a partial stay becomes possible earlier, as the earliest days roll out one by one).',
    ],
    limitations: [
      'This calculator is a planning aid for the standard 90/180 rule for short stays; it is not legal advice and its result does not bind border authorities. It does not account for bilateral agreements that some countries have with individual Schengen states, long-stay or residence permits, or special categories of traveller. You enter the dates, so it cannot tell whether a country you visited is in Schengen (Ireland and Cyprus are EU members outside it; the UK and non-EU Balkan states are outside it). Always verify your specific situation with the embassy of the country you plan to visit. Overstay penalties can include fines of hundreds to thousands of euros, deportation, and multi-year entry bans.',
    ],
    commonUses: [
      'Checking how many Schengen Area days you have remaining before a planned trip to avoid overstaying',
      'Tracking cumulative time spent across multiple short trips to ensure you stay within the 90/180 limit',
      'Planning the optimal travel schedule by seeing when enough days roll out of the 180-day window',
      'Verifying whether past trips have put you in violation and estimating the reset date for future eligibility',
    ],
    howToUse: [
      'Set the Check Date (defaults to today).',
      'Enter the start and end dates for each trip to the Schengen Area (up to 5 trips). Trip 1 is required; trips 2–5 are optional.',
      'Review the total days used within the rolling 180-day window.',
      'Check your remaining days or any overstay alert.',
      'If over the limit, see the estimated days until the window resets enough to allow new travel.',
    ],
    explanation:
      'The Schengen 90/180 rule applies to short stays (tourism, business, family visits) by non-EU/EEA/Swiss nationals who do not hold a long-stay visa or residence permit. The rule is often misunderstood. It is NOT a per-year quota of 90 days and it does NOT reset on January 1. Instead, the 180-day window is rolling — it moves forward one day at a time. Every day you check your status, the system looks back at the previous 180 days and counts how many of those days you spent inside the Schengen Area. If the total exceeds 90, you are in violation. This means that a single long stay of 90 days uses up your full allowance for that period, and you must wait approximately 90 more days before you can re-enter (until enough days have "rolled out" of the window). For example, if you stay 90 days starting January 1, you would be able to re-enter on approximately July 1 (180 days after January 1), but only for a short stay since many days are still in the window. The practical effect is that you can spend, at most, about half the days in any 180-day period inside the Schengen Area. The rule applies cumulatively across all Schengen countries — you cannot visit multiple Schengen countries to reset the counter. Overstaying can result in fines, deportation, and entry bans. Some travellers (for example citizens of countries with bilateral agreements) may have different rules. Always verify your specific situation with the embassy of the country you plan to visit.',
    faqs: [
      {
        question: 'Does the 90-day limit reset on January 1?',
        answer: 'No. This is the most common misconception. The 180-day window is rolling — it moves forward every day. There is no fixed reset date. Days you spent in the Schengen Area 6 months ago gradually "fall out" of the window, freeing up new days.',
      },
      {
        question: 'Can I visit multiple Schengen countries to reset the counter?',
        answer: 'No. The 90/180 rule applies to the entire Schengen Area as one zone. Travel between Schengen countries does not reset or pause the counter. Days spent in any Schengen country count toward the same 90-day total.',
      },
      {
        question: 'What happens if I overstay my 90 days?',
        answer: 'Overstaying is a violation of Schengen immigration rules. Consequences can include fines, removal and an entry ban, and may affect future visa applications; penalties differ by country, so check the rules of the country concerned. Always plan your travel to stay within the limit.',
      },
      {
        question: 'Do transit days count toward the 90-day limit?',
        answer: 'Yes. Any day spent physically inside the Schengen Area counts, including partial days. The day you enter and the day you leave both count. Airport transit (staying in the international transit area without entering the country) typically does not count — but only if you remain airside and do not pass through passport control. If you exit the airport or pass through immigration (even briefly), that day counts. When in doubt, count transit days as Schengen days.',
      },
      {
        question: 'How can I check if my specific nationality has different Schengen rules?',
        answer: 'Rules vary by nationality. Citizens of many countries (including the US, UK, Canada, Australia and Japan) can make visa-free short stays under the 90/180 rule, while others need a short-stay visa. A few countries also have older bilateral agreements with individual Schengen states that can allow a longer stay in that state. Check the European Commission\'s home-affairs website and the embassy of the country you plan to visit for rules that apply to your nationality.',
      },
      {
        question: 'What countries are in the Schengen Area vs the EU?',
        answer: 'The Schengen Area includes 29 countries: 25 EU members (Austria, Belgium, Bulgaria, Croatia, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Italy, Latvia, Lithuania, Luxembourg, Malta, the Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden) plus Iceland, Norway, Switzerland and Liechtenstein. Ireland and Cyprus are EU members that are not part of Schengen (Bulgaria and Romania joined fully on 1 January 2025). Time in microstates such as Monaco, San Marino and Vatican City, which have open borders with Schengen states, is generally treated as time in the area; check the official guidance.',
      },
    ],
    citations: [
      { source: 'European Commission, Migration and Home Affairs', title: 'Short-stay calculator and border crossing', url: 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing_en' },
      { source: 'Wikipedia', title: 'Schengen Area', url: 'https://en.wikipedia.org/wiki/Schengen_Area' },

    ],
  },
};

export default schengenVisaConfig;
