import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PeriodOvulationPanel from './PeriodOvulationPanel';

const periodOvulationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'lmpDate',
      label: 'First Day of Last Period',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      required: true,
      inputMode: 'text',
      helpText: 'Enter as YYYY-MM-DD (e.g. 2026-03-15)',
    },
    {
      id: 'cycleLength',
      label: 'Average Cycle Length',
      type: 'number',
      placeholder: '28',
      unit: 'days',
      min: 20,
      max: 45,
      step: 1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Most common: 28 days. Ranges from 21–35 days.',
    },
    {
      id: 'periodLength',
      label: 'Average Period Length',
      type: 'number',
      placeholder: '5',
      unit: 'days',
      min: 2,
      max: 10,
      step: 1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Typical range: 3–7 days.',
    },
    {
      id: 'lutealPhase',
      label: 'Luteal Phase Length (Optional)',
      type: 'number',
      placeholder: '14',
      unit: 'days',
      min: 10,
      max: 16,
      step: 1,
      required: false,
      inputMode: 'numeric',
      helpText: 'Default is 14 days. Usually 12–16 days. The luteal phase is relatively constant for each person.',
    },
  ],
  calculate: (values) => {
    const lmpStr = values.lmpDate?.trim();
    const cycleLength = parseInt(values.cycleLength) || 28;
    const periodLength = parseInt(values.periodLength) || 5;
    const lutealPhase = parseInt(values.lutealPhase) || 14;

    if (!lmpStr || !/^\d{4}-\d{2}-\d{2}$/.test(lmpStr)) return [];
    const lmp = new Date(lmpStr + 'T00:00:00');
    if (isNaN(lmp.getTime()) || cycleLength < 20 || cycleLength > 45) return [];

    const addDays = (d: Date, n: number): Date => {
      const r = new Date(d);
      r.setDate(r.getDate() + n);
      return r;
    };

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Anchor predictions to whichever cycle "today" actually falls in — a
    // saved/revisited LMP date can be several cycles in the past, and
    // generating a fixed 3-cycle window starting at LMP would then show a
    // "next period" that already happened and a cycle day in the hundreds.
    const dayMs = 1000 * 60 * 60 * 24;
    const daysSinceLmpRaw = Math.floor((today.getTime() - lmp.getTime()) / dayMs);
    const cyclesElapsed = Math.max(0, Math.floor(daysSinceLmpRaw / cycleLength));

    // Generate the current cycle plus the next 2 months of predictions
    const predictions: { periodStart: Date; periodEnd: Date; ovulation: Date; fertileStart: Date; fertileEnd: Date }[] = [];
    for (let m = cyclesElapsed; m < cyclesElapsed + 3; m++) {
      const periodStart = addDays(lmp, m * cycleLength);
      const periodEnd = addDays(periodStart, periodLength - 1);
      const ovulation = addDays(periodStart, cycleLength - lutealPhase);
      const fertileStart = addDays(ovulation, -5);
      const fertileEnd = ovulation;
      predictions.push({ periodStart, periodEnd, ovulation, fertileStart, fertileEnd });
    }

    const currentCycle = predictions[0];

    // Current status
    const daysSinceLmp = Math.round((today.getTime() - currentCycle.periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = daysSinceLmp + 1;

    // Build status string
    let statusText: string;
    if (cycleDay <= periodLength) {
      statusText = `Menstruation (Day ${cycleDay} of period)`;
    } else if (today >= currentCycle.fertileStart && today <= currentCycle.fertileEnd) {
      statusText = 'Fertile Window — highest chance of conception';
    } else if (cycleDay > cycleLength - lutealPhase) {
      statusText = 'Luteal Phase — PMS symptoms may occur';
    } else {
      statusText = 'Follicular Phase — post-period, pre-ovulation';
    }

    // Next period date (after the cycle "today" is currently in)
    const nextPeriod = addDays(currentCycle.periodStart, cycleLength);
    const daysUntilNextPeriod = Math.round((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Ovulation for current cycle
    const ovulationDate = currentCycle.ovulation;
    const daysUntilOvulation = Math.round((ovulationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return [
      {
        id: 'cycleDay',
        label: 'Current Cycle Day',
        value: `Day ${cycleDay} of ${cycleLength}`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'currentPhase',
        label: 'Current Phase',
        value: statusText,
        color: 'neutral',
      },
      {
        id: 'predictedPeriod',
        label: 'Next Predicted Period',
        value: `${fmt(nextPeriod)} (in ${daysUntilNextPeriod} days)`,
        color: 'negative',
      },
      {
        id: 'ovulationDate',
        label: 'Estimated Ovulation',
        value: daysUntilOvulation >= 0
          ? `${fmt(ovulationDate)} (in ${daysUntilOvulation} days)`
          : `${fmt(ovulationDate)} (${Math.abs(daysUntilOvulation)} days ago)`,
        color: 'positive',
      },
      {
        id: 'fertileWindow',
        label: 'Fertile Window',
        value: `${fmt(currentCycle.fertileStart)} → ${fmt(currentCycle.fertileEnd)}`,
        color: 'positive',
      },
      {
        id: 'monthsPredictions',
        label: '3-Month Outlook',
        value: `${fmt(predictions[0].periodStart)} – ${fmt(predictions[2].periodEnd)}`,
        color: 'neutral',
      },
      {
        id: 'periodFrequency',
        label: 'Period Frequency',
        value: `Every ${cycleLength} days · ~${Math.round(365 / cycleLength)} periods per year`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PeriodOvulationPanel, { values, results });
  },
  educational: {
    formula: 'Ovulation = Cycle Length − Luteal Phase | Next Period = LMP + Cycle Length | Fertile Window = Ovulation − 5 to Ovulation',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Menstrual Cycle (28-Day Example)</text><rect x="30" y="55" width="380" height="40" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="55" width="68" height="40" rx="4" fill="var(--svg-ef4444)" opacity=".5"/><text x="64" y="79" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ef4444)">Period</text><rect x="98" y="55" width="109" height="40" fill="var(--svg-3b82f6)" opacity=".3"/><text x="152" y="79" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Follicular</text><rect x="207" y="55" width="27" height="40" fill="var(--svg-22c55e)" opacity=".6"/><text x="220" y="79" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)" font-weight="bold">Ovu</text><rect x="234" y="55" width="176" height="40" rx="4" fill="var(--svg-8b5cf6)" opacity=".3"/><text x="322" y="79" text-anchor="middle" font-size="10" fill="var(--svg-8b5cf6)" font-weight="bold">Luteal Phase</text><text x="64" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Days 1-5</text><text x="152" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Days 6-13</text><text x="220" y="115" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)" font-weight="bold">Ovulation</text><text x="322" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Days 15-28</text></svg>',
      alt: 'Timeline of menstrual cycle phases: period, follicular, ovulation, and luteal phase',
      caption: 'Ovulation occurs ~14 days before the next period; the fertile window spans the 6 days ending on ovulation',
    },
    formulaDescription:
      'The menstrual cycle is divided into the follicular phase (from period to ovulation), ovulation (~24 hours), and the luteal phase (after ovulation until next period). The luteal phase is relatively constant at 12–16 days, while the follicular phase varies. Ovulation occurs approximately cycle length minus luteal phase days from the start of your period.',
    variables: [
      { symbol: 'LMP', name: 'Last Menstrual Period', description: 'The first day of your most recent period. Day 1 of your cycle. The reference point for all cycle predictions.' },
      { symbol: 'Cycle Parameters', name: 'Cycle Length & Luteal Phase', description: 'Cycle length: days from period to next period (avg 28, normal 21–35). Luteal phase: post-ovulation phase, relatively constant at ~14 days for each person.' },
      { symbol: 'Fertile Window', name: 'Fertile Days', description: 'The 6-day window ending on ovulation day when conception is possible. Includes 5 days of sperm survival + 1 day of egg viability.' },
    ],
    howToUse: [
      'Enter the first day of your last period (YYYY-MM-DD format).',
      'Enter your average cycle length (most common: 28 days).',
      'Optionally enter your luteal phase length if you know it (defaults to 14 days).',
      'Review your current cycle day, phase, and predicted dates for the next 3 months.',
      'Use the privacy notice: all data is processed locally — nothing is stored on servers.',
    ],
    explanation:
      'The menstrual cycle consists of four phases: menstruation (Days 1–5) where the uterine lining sheds, the follicular phase (Days 1–13) where estrogen rises and an egg matures in the ovary, ovulation (~Day 14 in a 28-day cycle) when the mature egg is released, and the luteal phase (Days 15–28) where progesterone prepares the uterus for potential implantation. Ovulation — the release of a mature egg — occurs ~14 days before your next period, not 14 days after your last period. This is a common misconception. The egg survives 12–24 hours, while sperm can survive up to 5 days in fertile cervical mucus, creating a 6-day fertile window. The luteal phase is hormonally driven by progesterone and is relatively constant at 12–16 days across cycles for each individual, making it the most reliable predictor of ovulation timing. For example, if your cycle is 33 days and your luteal phase is consistently 14 days, ovulation occurs around day 19 (33 − 14 = 19), not day 14. Calendar-based tracking is most accurate for people with regular cycles (±2–3 days). For those with irregular cycles (varying by 7+ days), combining calendar methods with ovulation predictor kits (which detect the LH surge 24–36 hours before ovulation) or basal body temperature tracking (which rises 0.5–1°F after ovulation) improves accuracy. Common cycle variations can indicate health issues: cycles shorter than 21 days or longer than 35 days may warrant investigation for conditions like PCOS, thyroid disorders, or perimenopause.',
    faqs: [
      {
        question: 'How accurate is calendar-based period prediction?',
        answer: 'For people with regular cycles (consistent within 2–3 days of average), calendar prediction is fairly accurate — usually within 1–2 days of your actual period. For irregular cycles (varying by 7+ days), predictions become significantly less reliable. The calculator\'s accuracy depends on entering your correct average cycle length and luteal phase. Accuracy improves with more tracking data: one month of data gives an approximate estimate, while 6+ months of tracked cycles produces much more reliable predictions. The luteal phase length is the most stable variable — if you confirm yours through ovulation testing (OPK or BBT), your ovulation predictions become significantly more accurate.',
      },
      {
        question: 'Is my data private?',
        answer: 'Yes. This calculator runs entirely in your browser. Your cycle data is not sent to any server, cloud service, or third party. The privacy badge at the top of the calendar confirms that all data processing happens locally on your device. There is no account creation, no data collection, and no analytics tracking of your menstrual information. You can use this tool with complete confidence that your personal health data remains private.',
      },
      {
        question: 'What if my cycles are irregular?',
        answer: 'For irregular cycles, enter your average cycle length but understand that predictions are less precise. Track for 3–6 months to find your average. Consider using ovulation predictor kits (OPKs) for more accurate fertile window detection — they detect the LH surge 24–36 hours before ovulation with 99% accuracy. Basal body temperature (BBT) charting can confirm ovulation after it happens by showing the characteristic temperature shift — take your temperature every morning before getting out of bed with a basal thermometer (accurate to 0.01°F). If cycles are consistently irregular (varying by 7+ days), consult a healthcare provider to investigate potential causes like PCOS (affecting 8–13% of women), thyroid disorders, high prolactin levels, premature ovarian insufficiency, or perimenopause (typically starting after age 40).',
      },
      {
        question: 'How do I determine my personal luteal phase length?',
        answer: 'The most reliable way to determine your luteal phase length is to track ovulation and count the days until your next period starts. Use ovulation predictor kits (OPKs) to detect the LH surge — ovulation typically occurs 24–36 hours after a positive OPK. Count the days from the day after ovulation until the day before your next period. Do this for 2–3 cycles: your luteal phase should be consistent within 1 day. If your luteal phase is consistently shorter than 10 days (luteal phase defect), it can make conception difficult because the uterine lining may shed before a fertilized egg can implant — this warrants medical evaluation.',
      },
      {
        question: 'Can I get pregnant during my period?',
        answer: 'While uncommon, it is possible — especially for people with shorter cycles (21–24 days) or longer periods (7+ days). If you have a 21-day cycle and ovulate on day 7, sperm from intercourse on day 5 of your period (when bleeding is tapering off) can survive and fertilize the egg on day 7. Additionally, what appears to be a period can sometimes be ovulation spotting or breakthrough bleeding. For pregnancy prevention, always use contraception regardless of where you are in your cycle — calendar-based methods (fertility awareness method / FAM) have a typical-use failure rate of 24% per year compared to 0.3% for IUDs or implants.',
      },
      {
        question: 'What is the difference between ovulation day and peak fertility day?',
        answer: 'Ovulation day is the specific day the egg is released from the ovary and survives for 12–24 hours. Peak fertility days are the 2–3 days *before* ovulation when conception is most likely — studies show the probability of conception is highest with intercourse 1–2 days before ovulation (25–30% chance per cycle), lower on ovulation day itself (10–12%), and near zero after ovulation. This is because sperm need time to undergo capacitation (a biochemical maturation process) in the female reproductive tract before they can fertilize the egg. Having sperm already present when the egg is released gives the highest chance. This calculator shows the full 6-day fertile window ending on ovulation day — the 2 days before ovulation are your peak fertility days.',
      },
      {
        question: 'What are the most reliable signs that ovulation is approaching?',
        answer: 'The three most reliable signs are: (1) Cervical mucus changes — it becomes clear, stretchy, and egg-white-like (spinnbarkeit) in the days leading to ovulation, creating an optimal environment for sperm survival. Check daily by wiping with toilet paper before urination. (2) LH surge detected by OPKs — a positive test (test line darker than control line) indicates ovulation in 24–36 hours. Test once daily starting 2–3 days before expected ovulation; morning urine is typically best though some clinicians recommend afternoon testing for LH. (3) Mittelschmerz — about 20% of women feel a one-sided lower abdominal twinge or cramp during ovulation. Additionally, some women notice increased libido, breast tenderness, or a softer/higher/more open cervical position around ovulation.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Sarah has a regular 28-day cycle. Her last period started on March 1, 2026. She wants to know when her next period will arrive, when she ovulates, and what her fertile window is for conception planning.',
        inputs: { lmpDate: '2026-03-01', cycleLength: '28', periodLength: '5', lutealPhase: '14' },
        result: 'Current cycle day depends on today\'s date. Next period predicted around March 29. Ovulation estimated March 15 (Day 14). Fertile window: March 10–15. Period frequency: every 28 days, ~13 periods per year.',
        insight: 'With a textbook 28-day cycle, Sarah\'s predictions are the most straightforward. Her fertile window opens 5 days before ovulation (March 10) and closes on ovulation day. The highest-conception-probability days are March 13–14 (the 2 days before ovulation). If trying to conceive, intercourse every 1–2 days during the fertile window maximizes cumulative probability (~85% pregnancy rate over 6 months for couples under 35). If avoiding pregnancy, this calendar method alone has a 24% typical-use failure rate — consider combining with barrier methods during the fertile window.',
      },
      {
        scenario: 'Maria has a longer 33-day cycle with a 14-day luteal phase. Her last period started on April 5, 2026. She previously assumed she ovulates on Day 14 like everyone, but her doctor explained ovulation happens 14 days before the next period, not 14 days after the last one.',
        inputs: { lmpDate: '2026-04-05', cycleLength: '33', periodLength: '6', lutealPhase: '14' },
        result: 'Ovulation estimated around Day 19 (April 24). Fertile window: April 19–24. Next period predicted May 8. Period frequency: every 33 days, ~11 periods per year.',
        insight: 'Maria\'s situation illustrates the most common misconception about ovulation timing. With a 33-day cycle, ovulation occurs around Day 19 (33 − 14 = 19), NOT Day 14. If Maria had used the common "Day 14" assumption for conception timing, she would have missed her fertile window entirely (which ends on Day 19 in this cycle — well after Day 14). This is why calendar-based methods must account for individual cycle length. For people with longer cycles, the follicular phase is longer — the egg takes more time to mature — but the luteal phase stays consistent. Maria should confirm ovulation with OPKs starting around Day 14–15 to catch her later-than-average ovulation.',
      },
      {
        scenario: 'Priya has irregular cycles ranging from 26–35 days. Her last period started on May 2, 2026. She tracks her cycle for health monitoring and wants to understand how to get the most useful predictions from a calculator despite irregularity.',
        inputs: { lmpDate: '2026-05-02', cycleLength: '30', periodLength: '5', lutealPhase: '14' },
        result: 'Using a 30-day average, ovulation estimated around Day 16 (May 18). Fertile window: May 13–18. Next period predicted June 1. However — predictions could be off by 4–5 days in either direction. Period frequency: ~12 periods per year.',
        insight: 'Priya\'s 9-day cycle variation (26–35) means calendar predictions have a wide margin of error. With a 30-day average entered, her actual ovulation could occur anywhere from Day 12 to Day 21. For conception, Priya should supplement with daily OPK testing from Day 10 onward until she detects the LH surge or her period arrives. For period preparedness, she should keep supplies ready from Day 24 onward (earliest possible period start: Day 26). Tracking basal body temperature for 3+ months would reveal whether her luteal phase is consistent — if it is, ovulation can be back-calculated from each period. If cycles are irregular AND she has symptoms like acne, excess hair growth, or difficulty losing weight, PCOS screening (blood work + ultrasound) is recommended. Cycle irregularity affecting more than 25% of cycles warrants medical evaluation.',
      },
    ],
    proTips: [
      'Track at least 3 months of cycle data before relying on predictions for family planning. Write down the first day of each period (Cycle Day 1) in a calendar or app. After 3 months, calculate your average: (cycle1 + cycle2 + cycle3) / 3. This average is significantly more accurate than a single month\'s data. For the most accurate average, track 6–12 months. If any single cycle deviates from your average by more than 7 days, exclude it as an outlier before averaging.',
      'Confirm your luteal phase length with ovulation prediction kits (OPKs) for at least 2 cycles. This single data point dramatically improves prediction accuracy because the luteal phase is hormonally fixed at 12–16 days per individual while the follicular phase varies wildly. Buy a box of digital OPKs (Clearblue or similar) and start testing 3–4 days before expected ovulation. The day after the first positive test is your ovulation day. Count the days from ovulation day to the day before next period — that is your luteal phase. Enter this number instead of the default 14 for personalized predictions.',
      'Basal body temperature (BBT) charting provides confirmation that ovulation actually occurred — something prediction alone cannot verify. Buy a basal thermometer (reads to 0.01°F, available for $10–15 at drugstores). Take your temperature at the same time every morning, before sitting up or drinking anything. A sustained temperature rise of 0.5–1°F for at least 3 days confirms ovulation happened. Charting for 3+ months reveals your personal pattern and is far cheaper long-term than daily OPKs. BBT cannot predict ovulation in advance (it confirms it after the fact), so it works best when combined with this calculator for predicting the window and then using BBT to confirm it closed.',
      'Combine this calculator with ovulation predictor kits and cervical mucus tracking for the highest possible accuracy — this is the "symptothermal method" used in Fertility Awareness Methods (FAM) with a perfect-use effectiveness rate of 99.6%. The calculator gives you the predicted window, OPKs give you 24–36 hours advance notice of ovulation, and cervical mucus changes (clear, stretchy, egg-white consistency) indicate peak fertility. When all three agree, you have very high confidence in ovulation timing. When they disagree, trust OPKs and mucus over the calendar.',
      'Track cycle-related symptoms alongside your calendar to identify patterns over time. Note: premenstrual breast tenderness (typically starting 7–10 days before period, corresponding to the progesterone peak), ovulation pain (mittelschmerz — one-sided lower abdominal twinge around Day 14 in a 28-day cycle), menstrual migraine timing (typically Days 1–3 or the 2 days before period, triggered by the estrogen drop), and energy/mood patterns (many athletes report peak performance during the late follicular phase, Days 8–13, when estrogen is high). Sharing these patterns with your healthcare provider can aid in diagnosing conditions like PMDD, endometriosis, or hormonal imbalances.',
      'If you use hormonal birth control (pill, patch, ring), this calculator is NOT appropriate because you do not have a true menstrual cycle — you have a withdrawal bleed during the placebo/hormone-free interval, not a period. You do not ovulate on combined hormonal contraception, so there is no fertile window to predict. The "cycle length" in this case is fixed by the pill pack (typically 28 days), but the biology is entirely different. This calculator is designed for natural, ovulatory menstrual cycles only.',
    ],
    quickReference: [
      { label: 'Typical cycle length', value: '28 days (normal range 21–35 days)' },
      { label: 'Typical period length', value: '5 days (normal range 3–7 days)' },
      { label: 'Typical luteal phase', value: '14 days (normal range 12–16 days)' },
      { label: 'Ovulation timing (28-day cycle)', value: 'Day 14 (not 14 days after period starts — 14 days before next period)' },
      { label: 'Fertile window', value: '6 days ending on ovulation day (5 days sperm + 1 day egg viability)' },
      { label: 'Egg lifespan', value: '12–24 hours after ovulation' },
      { label: 'Sperm lifespan in fertile mucus', value: 'Up to 5 days (average 3 days in fertile cervical mucus)' },
      { label: 'Peak fertility days', value: '2 days before ovulation and ovulation day itself' },
      { label: 'Cycles per year (28-day cycle)', value: '~13 periods per year' },
      { label: 'When to use OPKs', value: '2–4 days before expected ovulation for 7–10 days per cycle' },
      { label: 'BBT rise after ovulation', value: '0.5–1°F (0.3–0.6°C) sustained rise for at least 3 days' },
      { label: 'Cycles shorter than 21 days', value: 'Possible anovulation, diminished ovarian reserve — consult doctor' },
    ],
    commonUses: [
      'Cycle tracking — predict upcoming period dates, ovulation, and fertile windows up to 3 months in advance for personal awareness and planning',
      'Fertility awareness — identify the 6-day fertile window for conception planning, with the peak fertility days being the 2 days before ovulation',
      'Health monitoring — track cycle regularity and identify potential concerns (cycles shorter than 21 or longer than 35 days) that may warrant medical investigation',
      'Lifestyle planning — plan around predicted menstrual phases for travel, events, athletic training, and symptom management including PMS and cramps'
    ],
    limitations: [
      'Calendar-based estimates only — predictions use population averages (14-day luteal phase default). Actual ovulation may occur days earlier or later than predicted, even with regular cycles. Anovulatory cycles occur in 1–2 of every 12 cycles even in healthy individuals.',
      'Life factors not accounted for — stress, illness, weight changes (>10% body weight), intense training, travel, sleep disruption, breastfeeding, and perimenopause all affect cycle timing. Recent hormonal contraception can cause irregularity for 3–6 months after discontinuation.',
      'Sperm survival is variable — while 5 days is the documented maximum, most sperm survive only 2–3 days even in fertile cervical mucus. Individual variation is not accounted for in predictions.',
      'This calculator is NOT a contraceptive device (calendar methods have 24% typical-use failure rate annually). It is NOT a diagnostic tool for any medical condition. For family planning, confirm ovulation with OPK or BBT. For medical concerns, consult a qualified healthcare provider.',
    ],
    citations: [
      { source: 'ACOG - Menstrual Cycle', url: 'https://www.acog.org/womens-health/faqs/the-menstrual-cycle-menstruation' },
      { source: 'NIH - Menstruation Health', url: 'https://www.nichd.nih.gov/health/topics/menstruation' },
    ],
  },
};

export default periodOvulationConfig;
