import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SchengenVisaPanel from './SchengenVisaPanel';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function toDate(str: string): Date {
  return new Date(str + 'T00:00:00');
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function isDateValid(str: string): boolean {
  if (!str) return false;
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  // Reject dates outside reasonable travel range
  if (year < 1900 || year > 2100) return false;
  return true;
}

function isTripReasonable(start: Date, end: Date): boolean {
  // Reject trips longer than 365 days (likely data entry errors)
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return false;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return diffDays <= 365;
}

interface Trip {
  start: Date;
  end: Date;
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
    const checkDateStr = values.checkDate && isDateValid(values.checkDate)
      ? values.checkDate
      : getTodayString();
    const checkDate = toDate(checkDateStr);

    // Gather trips
    const trips: Trip[] = [];
    for (let i = 1; i <= 5; i++) {
      const startStr = values[`trip${i}Start`];
      const endStr = values[`trip${i}End`];
      if (startStr && endStr && isDateValid(startStr) && isDateValid(endStr)) {
        const start = toDate(startStr);
        const end = toDate(endStr);
        if (end >= start && isTripReasonable(start, end)) {
          trips.push({ start, end });
        }
      }
    }

    if (trips.length === 0) return [];

    // Rolling 180-day window. daysBetween() is inclusive of both endpoints,
    // so the window start must be 179 days back (not 180) for
    // [windowStart, checkDate] to span exactly 180 days — matching the EU's
    // own Schengen calculator convention. Off by one here silently counts
    // an extra day and can flag an overstay a day early.
    const windowStart = new Date(checkDate);
    windowStart.setDate(windowStart.getDate() - 179);

    let totalDaysInWindow = 0;
    const tripDetails: { label: string; days: number; inWindow: boolean }[] = [];

    for (const trip of trips) {
      const overlapStart = trip.start > windowStart ? trip.start : windowStart;
      const overlapEnd = trip.end < checkDate ? trip.end : checkDate;

      if (overlapStart <= overlapEnd) {
        const days = daysBetween(overlapStart, overlapEnd);
        totalDaysInWindow += days;
        tripDetails.push({
          label: `${formatDate(trip.start)} – ${formatDate(trip.end)}`,
          days,
          inWindow: true,
        });
      } else {
        tripDetails.push({
          label: `${formatDate(trip.start)} – ${formatDate(trip.end)}`,
          days: 0,
          inWindow: false,
        });
      }
    }

    const remaining = 90 - totalDaysInWindow;
    const isOverstay = totalDaysInWindow > 90;

    const results: ReturnType<CalculatorConfig['calculate']> = [];

    results.push({
      id: 'totalDaysUsed',
      label: 'Total Days Used (180-day window)',
      value: `${totalDaysInWindow} days`,
      highlight: true,
      color: isOverstay ? 'negative' : totalDaysInWindow > 70 ? 'neutral' : 'positive',
    });

    results.push({
      id: 'daysRemaining',
      label: isOverstay ? 'Days Over Limit' : 'Days Remaining',
      value: isOverstay ? `${Math.abs(remaining)} days over` : `${remaining} days`,
      color: isOverstay ? 'negative' : remaining <= 10 ? 'neutral' : 'positive',
    });

    results.push({
      id: 'checkWindow',
      label: 'Rolling Window',
      value: `${formatDate(windowStart)} – ${formatDate(checkDate)} (180 days)`,
      color: 'neutral',
    });

    // Trip breakdown
    for (let i = 0; i < tripDetails.length; i++) {
      const td = tripDetails[i];
      results.push({
        id: `trip${i + 1}Detail`,
        label: `Trip ${i + 1}: ${td.label}`,
        value: td.inWindow ? `${td.days} days in window` : 'Outside 180-day window',
        color: td.inWindow ? (td.days > 0 ? 'neutral' : 'neutral') : 'neutral',
      });
    }

    if (isOverstay) {
      // Days until reset: how many days before the oldest trip day drops out of the window
      // Find the earliest trip start that's causing the overstay
      const sortedTrips = [...trips].sort((a, b) => a.start.getTime() - b.start.getTime());
      const oldestTrip = sortedTrips[0];
      const daysUntilReset = Math.round(
        (oldestTrip.start.getTime() + 180 * 24 * 60 * 60 * 1000 - checkDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      results.push({
        id: 'resetInfo',
        label: 'Days Until Eligible Reset',
        value: `~${Math.max(1, daysUntilReset)} days until a new day is available (oldest trip exits the window)`,
        color: 'negative',
      });
    }

    results.push({
      id: 'ruleReminder',
      label: '90/180 Rule Status',
      value: isOverstay
        ? `You have exceeded the 90-day limit. You must leave the Schengen Area and wait until enough days roll out of the 180-day window.`
        : `You have ${remaining} days remaining within the 180-day rolling window.`,
      color: isOverstay ? 'negative' : 'positive',
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SchengenVisaPanel, { values, results });
  },
  educational: {
    formula: 'Total Days in Schengen Area (within any rolling 180-day window) ≤ 90',
    formulaDescription:
      'The 90/180 rule states that non-EU visitors may stay up to 90 days within any rolling 180-day period across all Schengen Area countries. The window moves forward each day, so day counts update continuously.',
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
      { symbol: 'Schengen Area', name: 'Zone of Free Movement', description: 'A group of 27 European countries that have abolished internal border controls. Includes most EU countries plus Iceland, Norway, Switzerland, and Liechtenstein.' },
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
        result: '40 days used (Mar 1-30: 30 days + Jun 1-10: 10 days). 50 days remaining within the 180-day window ending July 1, 2026.',
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
        result: '127 days used (Trip 1: 107 days + Trip 2: 20 days). 37 days over the 90-day limit. Window: Nov 2, 2025 - May 1, 2026.',
        insight:
          'Trip 1 spans 107 days (Nov 1 to Feb 15), which already exceeds the 90-day limit by itself. When checked on May 1, 2026, the calculator flags the overstay and estimates how many days until the earliest trip day (Nov 1, 2025) rolls out of the 180-day window. The 180-day window from May 1 looks back to November 2, 2025 — so only 1 day of Trip 1 has rolled out. The traveler must wait until roughly the end of April 2026 for the Feb 15 exit date to fall outside the window, freeing up days.',
      },
    ],
    quickReference: [
      { label: 'Maximum Stay', value: '90 days in any 180-day window' },
      { label: 'Window Type', value: 'Rolling (not calendar year)' },
      { label: 'Day Count', value: 'Entry day and exit day both count' },
      { label: 'Schengen Countries', value: '27 (including non-EU: Iceland, Norway, Switzerland, Liechtenstein)' },
      { label: 'Reset Mechanism', value: 'Oldest trip days gradually roll out as the window moves forward' },
    ],
    proTips: [
      'Keep a travel diary or use a dedicated Schengen calculator app to track every entry and exit date — border agents may ask for your exact travel history at passport control.',
      'Always set the "Check Date" to the day you plan to RE-ENTER the Schengen Area, not the day you plan to leave. This ensures you are not denied entry at the border.',
      'If you travel frequently to the Schengen Area, consider maintaining at least a 15-day buffer (stay under 75 days used) to avoid accidentally exceeding the limit due to flight delays, cancellations, or miscalculations.',
      'Remember that airport transit within the Schengen Area (e.g., connecting through Amsterdam to a non-Schengen destination) may count if you pass through passport control. Always confirm whether you will enter the Schengen Area during a layover.',
      'For long-stay visitors (e.g., digital nomads staying 90 days and then exiting), mark your calendar for 181 days after your first entry day — that is when enough days will have rolled out to allow a new full 90-day stay.',
    ],
    limitations: [
      'This calculator provides an estimate based on the 90/180 rule as generally applied to non-EU/EEA nationals. It does NOT account for bilateral visa waiver agreements that some countries have with non-EU nations (e.g., the US has bilateral agreements with several Schengen countries that predate the Schengen agreement). Nationals of certain countries may have different rules. The calculator does not distinguish between the Schengen Area and EU countries that are NOT in Schengen (Ireland, Cyprus, Romania, Bulgaria). Always verify your specific situation with the embassy of the country you plan to visit. Overstay penalties can include fines of hundreds to thousands of euros, deportation, and multi-year entry bans.',
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
      'The Schengen 90/180 rule applies to non-EU/non-EEA nationals visiting the Schengen Area for short stays (tourism, business, family visits). The rule is often misunderstood. It is NOT a per-year quota of 90 days and it does NOT reset on January 1. Instead, the 180-day window is rolling — it moves forward one day at a time. Every day you check your status, the system looks back at the previous 180 days and counts how many of those days you spent inside the Schengen Area. If the total exceeds 90, you are in violation. This means that a single long stay of 90 days uses up your full allowance for that period, and you must wait approximately 90 more days before you can re-enter (until enough days have "rolled out" of the window). For example, if you stay 90 days starting January 1, you would be able to re-enter on approximately July 1 (180 days after January 1), but only for a short stay since many days are still in the window. The practical effect is that you can spend, at most, about half the days in any 180-day period inside the Schengen Area. The rule applies cumulatively across all Schengen countries — you cannot visit multiple Schengen countries to reset the counter. Overstaying can result in fines, deportation, and entry bans. Some non-EU nationals (e.g., citizens of countries with bilateral agreements) may have different rules. Always verify your specific situation with the embassy of the country you plan to visit.',
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
        answer: 'Overstaying is a violation of Schengen immigration rules. Consequences may include fines, deportation, a formal re-entry ban of 6 months to 5 years, and difficulties obtaining future visas. Always plan your travel to stay within the limit.',
      },
      {
        question: 'Do transit days count toward the 90-day limit?',
        answer: 'Yes. Any day spent physically inside the Schengen Area counts, including partial days. The day you enter and the day you leave both count. Airport transit (staying in the international transit area without entering the country) typically does not count — but only if you remain airside and do not pass through passport control. If you exit the airport or pass through immigration (even briefly), that day counts. When in doubt, count transit days as Schengen days.',
      },
      {
        question: 'How can I check if my specific nationality has different Schengen rules?',
        answer: 'Rules vary significantly by nationality. US, UK, Canadian, Australian, and Japanese citizens generally get visa-free short stays (90/180 rule). However, some non-EU nationals have bilateral visa waiver agreements with individual Schengen countries that predate the Schengen Agreement, potentially allowing longer stays in that specific country. For example, the US has bilateral agreements with France and Poland. Always check with the embassy of the specific Schengen country you plan to visit, as border agents for that country enforce their bilateral rules. The EU\'s official Schengen visa website and your home country\'s foreign ministry website are the most reliable sources for nationality-specific rules.',
      },
      {
        question: 'What countries are in the Schengen Area vs the EU?',
        answer: 'The Schengen Area includes 27 countries: 23 EU members (Austria, Belgium, Croatia, Czech Republic, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Slovakia, Slovenia, Spain, Sweden) plus 4 non-EU countries (Iceland, Norway, Switzerland, Liechtenstein). EU countries NOT in Schengen include Ireland and Cyprus (which maintain their own border controls). Romania and Bulgaria joined Schengen fully in 2025. Microstates like Monaco, San Marino, and Vatican City have open borders with Schengen countries, meaning time spent there also counts toward your 90 days.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Schengen Area', url: 'https://en.wikipedia.org/wiki/Schengen_Area' },

    ],
  },
};

export default schengenVisaConfig;
