import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import MilestonesPanel from './MilestonesPanel';

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const fmtShort = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const addDays = (d: Date, days: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
};

const dueDateConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'method',
      label: 'Calculation Method',
      type: 'select',
      required: true,
      helpText: 'Choose how to calculate your due date — LMP is the standard clinical method',
      options: [
        { label: 'Last Menstrual Period (LMP) — Most Common', value: 'lmp' },
        { label: 'Conception / Ovulation Date', value: 'conception' },
        { label: 'IVF Transfer Date (Day-5 Blastocyst)', value: 'ivf' },
      ],
    },
    {
      id: 'date',
      label: 'Date',
      type: 'text',
      placeholder: '2025-06-15',
      required: true,
      helpText: 'Enter date as YYYY-MM-DD (e.g. 2025-01-15)',
    },
    {
      id: 'cycleLength',
      label: 'Average Cycle Length',
      type: 'number',
      placeholder: '28',
      unit: 'days',
      inputMode: 'decimal',
      min: 20,
      max: 45,
      step: 1,
      helpText: 'LMP method only — default 28 days. Adjusts ovulation offset.',
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const method = values.method || 'lmp';
    const dateStr = values.date?.trim();
    const cycleLength = parseFloat(values.cycleLength) || 28;

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return [];

    const inputDate = new Date(dateStr + 'T00:00:00');
    if (isNaN(inputDate.getTime())) return [];

    let lmpDate: Date;

    if (method === 'lmp') {
      lmpDate = inputDate;
    } else if (method === 'conception') {
      lmpDate = addDays(inputDate, -14);
    } else {
      lmpDate = addDays(inputDate, -19);
    }

    const cycleOffset = cycleLength - 28;
    const dueDate = addDays(lmpDate, 280 + cycleOffset);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDaysPreg = Math.round((today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksPregnant = Math.floor(totalDaysPreg / 7);
    const daysRemainder = totalDaysPreg % 7;
    const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const progressPct = Math.min(100, Math.max(0, (totalDaysPreg / 280) * 100));

    const t1End = addDays(lmpDate, 97);
    const t2Start = addDays(lmpDate, 98);
    const t2End = addDays(lmpDate, 195);
    const t3Start = addDays(lmpDate, 196);

    const conceptionDate = addDays(lmpDate, 14 + cycleOffset);

    const isPregnant = totalDaysPreg > 0 && totalDaysPreg < 294;
    const isPastDue = totalDaysPreg >= 280;

    const gestationalLabel = isPregnant
      ? `${weeksPregnant} weeks${daysRemainder > 0 ? ` and ${daysRemainder} day${daysRemainder > 1 ? 's' : ''}` : ''} pregnant`
      : totalDaysPreg <= 0
      ? 'Pregnancy has not started yet'
      : 'Past estimated due date';

    const daysRemainingLabel = daysUntilDue > 0
      ? `${daysUntilDue} days to go`
      : daysUntilDue === 0
      ? 'Due today!'
      : `${Math.abs(daysUntilDue)} days past due`;

    return [
      {
        id: 'dueDate',
        label: 'Estimated Due Date (EDD)',
        value: fmtDate(dueDate),
        highlight: true,
        color: 'positive' as const,
        interpretation: `This is a 40-week estimate from your last period (Naegele's rule) — only about 1 in 20 babies actually arrive on the exact date. Full term is anywhere from 37 to 42 weeks, so treat it as the middle of a window, not a deadline. An early ultrasound dating scan is more precise.`,
      },
      {
        id: 'gestationalAge',
        label: 'Current Gestational Age',
        value: gestationalLabel,
        color: isPregnant ? 'positive' : 'neutral' as const,
      },
      {
        id: 'progress',
        label: `Pregnancy Progress (${progressPct.toFixed(0)}% of 40 weeks)`,
        value: isPregnant
          ? `${daysRemainingLabel} · ${Math.round(280 - totalDaysPreg)} days remain`
          : daysUntilDue > 0
          ? `${daysRemainingLabel} before pregnancy begins`
          : daysRemainingLabel,
        color: isPastDue ? 'neutral' : 'positive' as const,
      },
      {
        id: 'conceptionDate',
        label: 'Estimated Conception Date',
        value: fmtShort(conceptionDate),
        color: 'neutral' as const,
      },
      {
        id: 't1',
        label: '1st Trimester',
        value: `${fmtShort(lmpDate)} → ${fmtShort(t1End)} (Weeks 1–13)`,
        color: 'neutral' as const,
      },
      {
        id: 't2',
        label: '2nd Trimester',
        value: `${fmtShort(t2Start)} → ${fmtShort(t2End)} (Weeks 14–27)`,
        color: 'neutral' as const,
      },
      {
        id: 't3',
        label: '3rd Trimester',
        value: `${fmtShort(t3Start)} → ${fmtShort(dueDate)} (Weeks 28–40)`,
        color: 'neutral' as const,
      },
      {
        id: 'currentTrimester',
        label: 'Current Trimester',
        value: !isPregnant
          ? 'N/A'
          : weeksPregnant <= 13
          ? '1st Trimester'
          : weeksPregnant <= 27
          ? '2nd Trimester'
          : '3rd Trimester',
        color: 'positive' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MilestonesPanel, { values, results });
  },
  educational: {
    formula: "EDD = LMP + 280 days (Naegele's Rule)",
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Pregnancy Timeline (40 Weeks)</text><rect x="30" y="60" width="380" height="40" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="60" width="125" height="40" rx="4" fill="var(--svg-3b82f6)" opacity=".3"/><text x="92" y="84" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-3b82f6)">1st Tri</text><rect x="155" y="60" width="130" height="40" fill="var(--svg-22c55e)" opacity=".3"/><text x="220" y="84" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-22c55e)">2nd Tri</text><rect x="285" y="60" width="125" height="40" rx="4" fill="var(--svg-f59e0b)" opacity=".3"/><text x="347" y="84" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-f59e0b)">3rd Tri</text><text x="92" y="120" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Weeks 1-13</text><text x="220" y="120" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Weeks 14-27</text><text x="347" y="120" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Weeks 28-40</text><line x1="347" y1="125" x2="347" y2="140" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="347" y="155" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)" font-weight="bold">Due Date</text><text x="220" y="195" text-anchor="middle" font-size="11" fill="var(--svg-8b5cf6)">EDD = LMP + 280 days (Naegele&apos;s Rule)</text></svg>',
      alt: 'Pregnancy timeline bar showing 1st, 2nd, and 3rd trimesters across 40 weeks with due date marker',
      caption: 'EDD is calculated as LMP + 280 days (Naegele\'s Rule); full term spans weeks 37-42',
    },
    formulaDescription:
      "The Estimated Due Date is calculated by adding 280 days (40 weeks) to the first day of the Last Menstrual Period. Cycle length adjustment shifts ovulation timing accordingly. IVF dates use embryo-specific offsets: Day 5 blastocyst transfer + 261 days, Day 3 transfer + 263 days.",
    variables: [
      { symbol: 'LMP', name: 'Last Menstrual Period', description: 'The first day of your last period — the standard clinical starting point for gestational dating by convention, dating back to Naegele in the 19th century.' },
      { symbol: '280 days', name: 'Full-Term Gestation', description: '40 weeks from LMP. Most pregnancies deliver between 37 and 42 weeks. Only about 5% of babies arrive on their exact due date.' },
      { symbol: 'Cycle Offset', name: 'Cycle Length Adjustment', description: 'If your cycle is longer or shorter than 28 days, the due date shifts accordingly (e.g., 35-day cycle → due date shifts +7 days). This accounts for later ovulation.' },
      { symbol: 'Trimester', name: 'Three Trimesters', description: '1st Trimester (Weeks 1–13): organ formation, highest miscarriage risk, fatigue and nausea common. 2nd Trimester (Weeks 14–27): growth and movement felt, energy often returns. 3rd Trimester (Weeks 28–40): lung maturation, final growth, discomfort increases.' },
      { symbol: 'Ultrasound Dating', name: 'First-Trimester Ultrasound', description: 'Crown-rump length measured at 8–13 weeks is the most accurate dating method (±5–7 days). May revise the LMP-based due date if there is a discrepancy of 7+ days.' },
    ],
    howToUse: [
      'Select your calculation method — LMP (last period) is the most common clinical standard.',
      'Enter the relevant date in YYYY-MM-DD format.',
      'If using LMP and your cycle is not 28 days, enter your average cycle length for accuracy.',
      'If using IVF, select the appropriate method and enter your transfer date.',
      'Review your due date, current gestational age, trimester start dates, and key milestones.',
      'Share the results with your healthcare provider for clinical confirmation at your first ultrasound.',
    ],
    explanation:
      "The Estimated Due Date uses Naegele's Rule: LMP + 280 days. This formula was developed by German obstetrician Franz Naegele in the early 1800s and remains the standard dating method today. Only about 5% of babies are born on their exact due date — most arrive within 2 weeks on either side, which is why healthcare providers refer to a <<due month>> rather than a specific day. First-trimester ultrasound (crown-rump length measurement at 8–13 weeks) provides the most accurate dating, especially for women with irregular cycles or uncertain LMP. The three trimesters mark distinct phases: the first trimester involves organ formation and carries the highest miscarriage risk; the second trimester brings fetal movement and most prenatal screening tests; the third trimester involves lung maturation, rapid weight gain, and preparation for delivery. Normal delivery is defined as 37–42 weeks. Babies born before 37 weeks are preterm, while those after 42 weeks are post-term. If your due date changes after an ultrasound, the earlier dating (usually the ultrasound) is considered more reliable.",
    faqs: [
      {
        question: 'How accurate is the due date?',
        answer: 'The EDD is a statistical average, not a precise prediction. Only 5% of babies arrive on the due date. Normal delivery spans 37–42 weeks. First-trimester ultrasound (crown-rump length measured at 8–13 weeks) is the most accurate dating method, with an error margin of ±5–7 days. Due dates based solely on LMP can be off by 1–2 weeks if ovulation timing was unusual.',
      },
      {
        question: 'What if my cycle is not 28 days?',
        answer: 'Enter your actual average cycle length. For a 35-day cycle, ovulation occurs ~day 21 instead of day 14, shifting the due date forward by 7 days. This calculator adjusts automatically. For irregular cycles (varying by 7+ days), use early ultrasound dating for the most accurate due date.',
      },
      {
        question: 'How do I use this with an IVF transfer?',
        answer: 'Select "IVF Transfer Date (Day-5 Blastocyst)" and enter your transfer date. The calculator adds the equivalent days to establish your LMP equivalent and due date. For a Day 5 blastocyst transfer, the due date is transfer date + 261 days. For Day 3 embryo transfers, use transfer date + 263 days. This accounts for the embryo\'s development stage outside the body.',
      },
      {
        question: 'What is the difference between gestational age and fetal age?',
        answer: 'Gestational age counts from LMP (standard clinical measurement used by all healthcare providers). Fetal age counts from conception — approximately 2 weeks less than gestational age. Doctors always use gestational age. So at "12 weeks pregnant," the fetus is actually about 10 weeks old developmentally.',
      },
      {
        question: 'Can my due date change during pregnancy?',
        answer: 'Yes. Your due date may be adjusted after your first-trimester ultrasound if the ultrasound dating differs significantly from your LMP-based date (typically by 7+ days). Later ultrasounds are less accurate for dating. It is normal for your care provider to revise the due date once based on early ultrasound measurements.',
      },
    ],
    commonUses: [
      'Pregnancy planning — establish the estimated due date (EDD) from LMP or conception date for prenatal appointment scheduling and trimester planning',
      'Gestational age tracking — determine current weeks pregnant and remaining days to due date for monitoring fetal development milestones',
      'Cycle length adjustment — for women with cycles that differ from 28 days, get a personalized due date that accounts for ovulation timing differences',
      'IVF pregnancy dating — calculate due dates for Day 3 and Day 5 embryo transfers using the appropriate embryo-specific offsets for assisted reproduction'
    ],
  
    
    workedExamples: [
      {
        scenario: 'Fatima, 32, has a regular 28-day cycle and her last period started on June 1, 2025. She wants to calculate her due date using the standard LMP method and plan her prenatal appointments around the trimester schedule.',
        inputs: {
          'Calculation Method': 'LMP',
          'Date': '2025-06-01',
          'Cycle Length': '28',
        },
        result: 'EDD: March 8, 2026. Conception: ~June 15, 2025. 1st Trimester: June 1 – September 6, 2025. 2nd Trimester: September 7 – December 13, 2025. 3rd Trimester: December 14, 2025 – March 8, 2026. Total gestation: 40 weeks.',
        insight: 'Fatima\'s due date is calculated as LMP + 280 days = June 1 + 280 = March 8. With a standard 28-day cycle, ovulation is presumed at day 14 (June 15). The three trimesters divide the 40-week pregnancy into roughly equal 13-week blocks. Fatima should schedule her first-trimester ultrasound between 8–13 weeks (July 27 – August 31) for the most accurate crown-rump length dating, which may refine the due date by ±5–7 days. Only about 5% of babies arrive on the exact due date — delivery anytime from 37 weeks (February 15, 2026) to 42 weeks (March 22, 2026) is considered full term.',
      },
      {
        scenario: 'Aiko underwent IVF with a Day-5 blastocyst transfer on April 20, 2025. Her clinic advised her to use the IVF calculation method rather than LMP because her menstrual cycle was suppressed during the treatment protocol.',
        inputs: {
          'Calculation Method': 'IVF Transfer (Day-5)',
          'Date': '2025-04-20',
          'Cycle Length': '28',
        },
        result: 'EDD: January 6, 2026. Conception: ~April 15, 2025. 1st Trimester: April 1 – July 7, 2025. 2nd Trimester: July 8 – October 13, 2025. 3rd Trimester: October 14, 2025 – January 6, 2026.',
        insight: 'For IVF, the calculator works backward from the transfer date to an equivalent LMP: Day-5 blastocyst transfer = LMP equivalent of transfer date minus 19 days (April 20 – 19 = April 1). From there, the standard 280-day Naegele\'s rule applies: April 1 + 280 = January 6, 2026. IVF dating is generally more precise than natural-conception LMP dating because the exact embryo age and transfer date are known. However, the same full-term window (37–42 weeks) applies — Aiko\'s baby would be considered full term from December 16, 2025 to January 20, 2026. The first-trimester ultrasound dating may still refine the date slightly, but IVF-derived dates are usually kept as the primary reference since the conception timing is precisely known.',
      },
    ],

    proTips: [
      'First-trimester ultrasound (crown-rump length at 8–13 weeks) is the gold standard for dating. If the ultrasound date differs from your LMP-based EDD by 7+ days, your provider will likely use the ultrasound date — it is more accurate than cycle-based estimates, especially for irregular cycles.',
      'Only about 5% of babies arrive on their exact due date. Think of it as a "due month" rather than a "due day." Normal delivery spans from 37 weeks (early term) to 42 weeks (post-term). Mark your calendar for 37 weeks as the "any day now" point.',
      'When using the conception/ovulation method, the calculator subtracts 14 days from your conception date to establish an equivalent LMP. This means the conception date you enter should be the actual date you believe conception occurred (ovulation + fertilization), not the start of your fertile window.',
      'For IVF pregnancies with Day-3 embryo transfers (rather than Day-5 blastocysts), use the conception date method with your transfer date + 5 days as the conception date (Day-3 embryos are 3 days old at transfer, and conception is defined as fertilization day).',
    ],

    quickReference: [
      { label: 'Full-Term Gestation', value: '40 weeks (280 days) from LMP' },
      { label: 'Early Term', value: '37 weeks 0 days – 38 weeks 6 days' },
      { label: 'Full Term', value: '39 weeks 0 days – 40 weeks 6 days' },
      { label: 'Late Term', value: '41 weeks 0 days – 41 weeks 6 days' },
      { label: 'Post-Term', value: '42 weeks 0 days and beyond' },
      { label: 'Preterm', value: 'Before 37 weeks 0 days' },
      { label: '1st Trimester', value: 'Weeks 1–13 (organ formation)' },
      { label: '2nd Trimester', value: 'Weeks 14–27 (growth, movement felt)' },
      { label: '3rd Trimester', value: 'Weeks 28–40 (lung maturation, final growth)' },
      { label: 'Ultrasound Accuracy', value: '±5–7 days when measured at 8–13 weeks via crown-rump length' },
      { label: 'On-Time Births', value: 'Only ~5% of babies arrive on the exact EDD' },
      { label: 'Naegele\'s Rule', value: 'EDD = LMP + 280 days (published 1812)' },
    ],

    limitations: [
      'Naegele\'s rule assumes a 28-day cycle with ovulation on day 14. If ovulation occurred earlier or later — which is common even in regular cycles — the due date can be off by several days to a week.',
      'This calculator cannot replace clinical dating by a healthcare provider. First-trimester ultrasound measurement of crown-rump length is significantly more accurate (±5–7 days) than any calendar-based method.',
      'For women with irregular cycles (varying by 7+ days month-to-month), LMP-based dating is unreliable. The calculator\'s cycle length adjustment helps but cannot account for cycle-to-cycle variability in ovulation timing.',
      'The trimester breakdown (weeks 1–13, 14–27, 28–40) is a statistical convenience — actual fetal development is a continuous process, and the boundaries between trimesters do not correspond to distinct biological events. Clinical milestones vary by individual pregnancy.',
    ],
citations: [
      { source: 'ACOG - Due Date Estimation', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/method-for-estimating-due-date' },
      { source: 'NIH - Pregnancy', url: 'https://www.nichd.nih.gov/health/topics/pregnancy' },
    ],
  },
};

export default dueDateConfig;
