import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ConceptionPanel from './ConceptionPanel';
import { parseIsoDate, toIsoDate, addDays as addCalendarDays } from '../../../utils/dates';
import { finiteSteps } from '../../../utils/explainGuard';
import { hasAnswer } from '../../../utils/explainResults';

// The calculator's day offsets, shared by calculate and explainSteps.
const FERTILE_DAYS_BEFORE = 5; // fertile window opens this many days before ovulation
const PEAK_DAYS_BEFORE = 2; // peak fertility: ovulation - 2 days through ovulation day
const IMPLANT_FROM = 6; // implantation window: days after ovulation
const IMPLANT_TO = 12;
const OVULATION_TO_LMP = 14; // LMP is 14 days before ovulation
const TERM_DAYS = 280; // 40 weeks from LMP
const CONCEPTION_TO_DUE = 266; // 280 - 14

/** Days from the reference date (last period, next period, or today) to ovulation. */
const ovulationOffset = (method: string, cycleLength: number): number =>
  method === 'nextPeriod' ? -OVULATION_TO_LMP : cycleLength - OVULATION_TO_LMP;

/** Days from embryo transfer to the due date: Day 5 transfer 261, Day 3 transfer 263 (266 minus the embryo's age). */
const ivfDueDays = (embryoDays: number): number => CONCEPTION_TO_DUE - embryoDays;

const fmtLong = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const conceptionConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'method',
      label: 'Calculation Method',
      type: 'select',
      required: true,
      helpText: 'Choose your preferred method — LMP is most common for natural cycles',
      options: [
        { label: 'Based on Last Period (LMP)', value: 'lmp' },
        { label: 'Based on Next Expected Period', value: 'nextPeriod' },
        { label: 'Based on Cycle Length (if your period starts today)', value: 'cycle' },
        { label: 'IVF Transfer Date (assisted reproduction)', value: 'ivf' },
        { label: 'Based on Target Due Date', value: 'dueDate' },
      ],
    },
    {
      id: 'lmpDate',
      label: 'First Day of Last Menstrual Period',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      helpText: 'For LMP method. Enter as YYYY-MM-DD (e.g. 2025-12-01)',
      showWhen: (v) => v.method === 'lmp',
    },
    {
      id: 'nextPeriodDate',
      label: 'Expected Date of Next Period',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      helpText: 'For next period method. Enter as YYYY-MM-DD',
      showWhen: (v) => v.method === 'nextPeriod',
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
      inputMode: 'decimal',
      helpText: 'For the LMP and cycle length methods. Default 28 days. The cycle length method assumes today is day 1 of your cycle.',
      showWhen: (v) => v.method === 'lmp' || v.method === 'cycle',
    },
    {
      id: 'ivfDate',
      label: 'IVF Embryo Transfer Date',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      helpText: 'For IVF method. Enter the embryo transfer date as YYYY-MM-DD (e.g. 2025-12-15)',
      showWhen: (v) => v.method === 'ivf',
    },
    {
      id: 'embryoType',
      label: 'Embryo Type',
      type: 'select',
      options: [
        { label: 'Day 5 (Blastocyst)', value: 'day5' },
        { label: 'Day 3 (Cleavage Stage)', value: 'day3' },
      ],
      helpText: 'For IVF method. Day 5 blastocyst is most common.',
      showWhen: (v) => v.method === 'ivf',
    },
    {
      id: 'targetDueDate',
      label: 'Target Due Date',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      helpText: 'For due-date-based planning. Enter target due date as YYYY-MM-DD (e.g. 2026-09-15)',
      showWhen: (v) => v.method === 'dueDate',
    },
  ],
  explainSteps: (values) => {
    // Absolute dates are printed only for methods whose dates come from the input; the "cycle" method counts
    // from today, so its steps use offsets from "today" instead of dates.
    const rows = conceptionConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const method = values.method || 'lmp';
    const cycleLength = parseFloat(values.cycleLength) || 28;

    if (method === 'ivf') {
      const transfer = parseIsoDate(values.ivfDate);
      if (!transfer) return [];
      const embryoDays = values.embryoType === 'day3' ? 3 : 5;
      const dueDays = ivfDueDays(embryoDays);
      return finiteSteps([
        {
          label: `Days from transfer to due date (${embryoDays === 5 ? 'Day 5 blastocyst' : 'Day 3 cleavage stage'})`,
          expr: `${CONCEPTION_TO_DUE} − ${embryoDays} = ${dueDays} days`,
          note: 'The calculator subtracts the embryo\u2019s age at transfer from the 266 days between conception and the due date.',
        },
        { label: 'Add them to the transfer date', expr: `${fmtLong(transfer)} + ${dueDays} days = ${fmtLong(addCalendarDays(transfer, dueDays))}` },
        { label: 'Estimated egg retrieval date', expr: `${fmtLong(transfer)} − ${embryoDays} days = ${fmtLong(addCalendarDays(transfer, -embryoDays))}` },
      ]);
    }

    if (method === 'dueDate') {
      const due = parseIsoDate(values.targetDueDate);
      if (!due) return [];
      const conception = addCalendarDays(due, -CONCEPTION_TO_DUE);
      return finiteSteps([
        { label: 'Count back from the target due date to conception', expr: `${fmtLong(due)} − ${CONCEPTION_TO_DUE} days = ${fmtLong(conception)}` },
        {
          label: `Conception window: ${FERTILE_DAYS_BEFORE} days before the conception date through that date`,
          expr: `${fmtLong(conception)} − ${FERTILE_DAYS_BEFORE} days = ${fmtLong(addCalendarDays(conception, -FERTILE_DAYS_BEFORE))} → ${fmtLong(conception)}`,
        },
        { label: 'Estimated first day of the last period', expr: `${fmtLong(conception)} − ${OVULATION_TO_LMP} days = ${fmtLong(addCalendarDays(conception, -OVULATION_TO_LMP))}` },
      ]);
    }

    let reference: Date | null = null;
    if (method === 'nextPeriod') reference = parseIsoDate(values.nextPeriodDate);
    else if (method !== 'cycle') reference = parseIsoDate(values.lmpDate);
    if (method !== 'cycle' && !reference) return [];
    const ovOff = ovulationOffset(method, cycleLength);
    const at = (n: number): string =>
      reference ? fmtLong(addCalendarDays(reference, n)) : n === 0 ? 'today' : n > 0 ? `today + ${n} days` : `today − ${-n} days`;
    const anchor = reference ? fmtLong(reference) : 'today';
    const ovExpr =
      method === 'nextPeriod'
        ? `${anchor} − ${OVULATION_TO_LMP} days = ${at(ovOff)}`
        : `${anchor} + (${cycleLength} − ${OVULATION_TO_LMP}) days = ${at(ovOff)}`;
    return finiteSteps([
      {
        label: method === 'cycle' ? 'Estimated ovulation (this method treats today as day 1 of the cycle)' : 'Estimated ovulation',
        expr: ovExpr,
      },
      {
        label: `Fertile window: ${FERTILE_DAYS_BEFORE} days before ovulation through ovulation day`,
        expr: `${at(ovOff - FERTILE_DAYS_BEFORE)} → ${at(ovOff)}`,
        note: `The peak days are ovulation − ${PEAK_DAYS_BEFORE} days through ovulation: ${at(ovOff - PEAK_DAYS_BEFORE)} → ${at(ovOff)}.`,
      },
      {
        label: `Implantation window: ${IMPLANT_FROM} to ${IMPLANT_TO} days after ovulation`,
        expr: `${at(ovOff + IMPLANT_FROM)} → ${at(ovOff + IMPLANT_TO)}`,
      },
      {
        label: 'Due date if conceived this cycle: 14 days before ovulation is the start, plus 280 days',
        expr: !reference && ovOff - OVULATION_TO_LMP === 0
          ? `today + ${TERM_DAYS} days`
          : `${at(ovOff - OVULATION_TO_LMP)} + ${TERM_DAYS} days = ${at(ovOff - OVULATION_TO_LMP + TERM_DAYS)}`,
      },
    ]);
  },
  calculate: (values) => {
    const method = values.method || 'lmp';
    const cycleLength = parseFloat(values.cycleLength) || 28;
    if (cycleLength < 20 || cycleLength > 45) return [];

    const addDays = (d: Date, n: number): Date => {
      const r = new Date(d);
      r.setDate(r.getDate() + n);
      return r;
    };

    const fmt = fmtLong;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── IVF Method ──────────────────────────────────────────────
    if (method === 'ivf') {
      // Calendar-invalid dates (2026-02-31) are rejected rather than rolled over to March.
      const transferDate = parseIsoDate(values.ivfDate);
      if (!transferDate) return [];

      const embryoDays = values.embryoType === 'day3' ? 3 : 5;
      // Due date: Day 5 transfer → +261 days, Day 3 transfer → +263 days
      const ivfDueDateDays = ivfDueDays(embryoDays);
      const estDueDate = addDays(transferDate, ivfDueDateDays);

      // Estimated "ovulation" (retrieval) date — Day 0 is the retrieval/fertilization
      // day, so a "Day 5" (blastocyst) transfer happens 5 days after retrieval and a
      // "Day 3" transfer 3 days after — matching the 261/263-day due-date offsets above
      // (266 - embryoDays), which already assume retrieval = transfer - embryoDays.
      const retrievalDate = addDays(transferDate, -embryoDays); // e.g., day 5 → retrieval 5 days before transfer
      const retrievalLabel = embryoDays === 5 ? 'Blastocyst (Day 5)' : 'Cleavage Stage (Day 3)';

      // Gestational age counts the 14 days before fertilization plus the embryo's age at transfer:
      // GA(days) = days since transfer + 14 + embryo age (Day 5 transfer = 2w5d, Day 3 = 2w3d on transfer day).
      const gaDays = Math.round((today.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24)) + 14 + embryoDays;
      const weeksPregnant = Math.floor(gaDays / 7);
      const stageText =
        gaDays < 14 + embryoDays
          ? 'Prior to transfer'
          : gaDays > 294
          ? 'Past the estimated due date'
          : `${weeksPregnant} weeks ${gaDays % 7} day${gaDays % 7 === 1 ? '' : 's'} (gestational age)`;

      // Pregnancy test date: ~9-14 days post transfer
      const testDate = addDays(transferDate, 9);

      return [
        {
          id: 'ivfDueDate',
          label: 'Estimated Due Date (IVF)',
          value: fmt(estDueDate),
          highlight: true,
          color: 'positive',
        },
        {
          id: 'ivfEmbryoType',
          label: 'Embryo Type',
          value: retrievalLabel,
          color: 'neutral',
        },
        {
          id: 'ivfTransferDate',
          label: 'Embryo Transfer Date',
          value: fmt(transferDate),
          color: 'neutral',
        },
        {
          id: 'ivfRetrieval',
          label: 'Estimated Egg Retrieval (ovulation) Date',
          value: fmt(retrievalDate),
          color: 'neutral',
        },
        {
          id: 'ivfPregnancyTest',
          label: 'Earliest Recommended Pregnancy Test',
          value: fmt(testDate),
          color: 'neutral',
        },
        {
          id: 'ivfWeeksProgress',
          label: 'Current Pregnancy Stage',
          value: stageText,
          color: 'neutral',
        },
        {
          id: 'estDueDate',
          label: 'Estimated Due Date',
          value: fmt(estDueDate),
          color: 'positive',
        },
      ];
    }

    // ── Target Due Date Method ──────────────────────────────────
    if (method === 'dueDate') {
      const targetDue = parseIsoDate(values.targetDueDate);
      if (!targetDue) return [];

      // Conception ≈ due date - 266 days
      const conceptionDate = addDays(targetDue, -CONCEPTION_TO_DUE);
      // Ovulation ≈ conception date (ovulation is when conception happens)
      const ovulationDate = conceptionDate;
      // LMP ≈ conception - 14 days
      const lmpDate = addDays(conceptionDate, -OVULATION_TO_LMP);
      // Fertile window: 5 days before ovulation
      const fertileStart = addDays(ovulationDate, -FERTILE_DAYS_BEFORE);

      // Current pregnancy progress
      const daysFromLmp = Math.round((today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksPregnant = Math.floor(daysFromLmp / 7);
      const daysRemaining = Math.round((targetDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilWindow = Math.round((fertileStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return [
        {
          id: 'conceptionDate',
          label: 'Estimated Conception Date',
          value: fmt(conceptionDate),
          highlight: true,
          color: 'positive',
        },
        {
          id: 'fertileWindow',
          label: 'Conception Window',
          value: `${fmt(fertileStart)} → ${fmt(ovulationDate)}`,
          color: 'positive',
        },
        {
          id: 'ovulationDate',
          label: 'Estimated Ovulation Date',
          value: fmt(ovulationDate),
          color: 'neutral',
        },
        {
          id: 'lmpEstimated',
          label: 'Estimated LMP (First Day of Last Period)',
          value: fmt(lmpDate),
          color: 'neutral',
        },
        {
          id: 'estDueDate',
          label: 'Target Due Date',
          value: fmt(targetDue),
          color: 'positive',
        },
        {
          id: 'weeksPregnant',
          label: daysRemaining >= 0 && daysFromLmp < 0 ? 'Time until the conception window' : 'Current Pregnancy Progress',
          value: daysRemaining < 0
            ? 'The target due date has already passed'
            : daysFromLmp >= 0
            ? `~${weeksPregnant} weeks pregnant · ${daysRemaining} days remaining`
            : `Conception window opens in ${daysUntilWindow} days`,
          color: 'neutral',
        },
      ];
    }

    // ── Original method (LMP / Next Period / Cycle) ─────────────
    let referenceDate: Date;

    if (method === 'nextPeriod') {
      const nd = parseIsoDate(values.nextPeriodDate);
      if (!nd) return [];
      referenceDate = nd;
    } else if (method === 'cycle') {
      referenceDate = new Date(today); // assumes today is day 1 of the cycle
    } else {
      const ld = parseIsoDate(values.lmpDate);
      if (!ld) return [];
      referenceDate = ld;
    }

    // The cycle method anchors on today as cycle day 1 (no dates are entered), so ovulation is
    // today + (cycle length - 14); the other methods count from the entered date.
    const ovulationDate = addDays(referenceDate, ovulationOffset(method, cycleLength));

    // Fertile window: 5 days before ovulation + day of ovulation
    const fertileStart = addDays(ovulationDate, -FERTILE_DAYS_BEFORE);
    const fertileEnd = ovulationDate;

    // Peak fertility: 2 days before ovulation through ovulation day
    const peakStart = addDays(ovulationDate, -PEAK_DAYS_BEFORE);

    // Implantation window: 6-12 days after ovulation
    const implantStart = addDays(ovulationDate, IMPLANT_FROM);
    const implantEnd = addDays(ovulationDate, IMPLANT_TO);

    // Due date if conception occurs
    const estLmp = addDays(ovulationDate, -OVULATION_TO_LMP);
    const estDueDate = addDays(estLmp, TERM_DAYS);

    ovulationDate.setHours(0, 0, 0, 0);

    const daysUntilOvulation = Math.round((ovulationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isCurrentlyFertile = today >= fertileStart && today <= fertileEnd;

    return [
      {
        id: 'ovulationDate',
        label: 'Estimated Ovulation Date',
        value: fmt(ovulationDate),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'fertileWindow',
        label: 'Fertile Window (6 days)',
        value: `${fmt(fertileStart)} → ${fmt(fertileEnd)}`,
        color: 'positive',
      },
      {
        id: 'peakFertility',
        label: 'Peak Fertility (ovulation − 2 days)',
        value: `${fmt(peakStart)} → ${fmt(ovulationDate)}`,
        color: 'positive',
      },
      {
        id: 'implantationWindow',
        label: 'Implantation Window (6–12 days post-ovulation)',
        value: `${fmt(implantStart)} → ${fmt(implantEnd)}`,
        color: 'neutral',
      },
      {
        id: 'estDueDate',
        label: 'Estimated Due Date (if conceived this cycle)',
        value: fmt(estDueDate),
        color: 'neutral',
      },
      {
        id: 'fertileDays',
        label: 'Fertile Days (in order of fertility)',
        value: isCurrentlyFertile
          ? `You are in your fertile window — chances are highest in the 2 days before ovulation and on ovulation day (${fmt(ovulationDate)}).`
          : daysUntilOvulation > 0
          ? `Your fertile window opens in ${Math.max(0, Math.round((fertileStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))} days (${fmt(fertileStart)})`
          : 'Your fertile window has passed for this cycle.',
        color: isCurrentlyFertile ? 'positive' : 'neutral',
      },
      {
        id: 'daysUntilOvulation',
        label: 'Days Until Ovulation',
        value: daysUntilOvulation > 0
          ? `${daysUntilOvulation} days`
          : daysUntilOvulation === 0
          ? 'Today!'
          : `${Math.abs(daysUntilOvulation)} days ago`,
        color: daysUntilOvulation >= 0 && daysUntilOvulation <= 1 ? 'positive' : 'neutral',
      },
      {
        // Panel data (same dates as above) so the calendar never parses display strings.
        id: '_window',
        label: '_window',
        value: JSON.stringify({ start: toIsoDate(fertileStart), end: toIsoDate(fertileEnd), ovulation: toIsoDate(ovulationDate) }),
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ConceptionPanel, { values, results });
  },
  educational: {
    formula: 'Ovulation = Cycle Length − 14 days | Fertile Window = Ovulation − 5 days to Ovulation | IVF Due Date = Transfer Date + 261–263 days',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Conception Window (28-Day Cycle)</text><rect x="30" y="55" width="380" height="40" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="55" width="68" height="40" rx="4" fill="var(--svg-ef4444)" opacity=".4"/><text x="64" y="79" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Period</text><rect x="98" y="55" width="41" height="40" fill="var(--svg-3b82f6)" opacity=".3"/><text x="118" y="79" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)">Pre</text><rect x="139" y="55" width="81" height="40" fill="var(--svg-22c55e)" opacity=".5"/><text x="179" y="79" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-22c55e)">Fertile Window</text><rect x="220" y="55" width="190" height="40" rx="4" fill="var(--svg-8b5cf6)" opacity=".3"/><text x="315" y="79" text-anchor="middle" font-size="10" fill="var(--svg-8b5cf6)">Luteal Phase</text><text x="64" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Days 1-5</text><text x="118" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Day 6-9</text><text x="179" y="115" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)" font-weight="bold">Day 10-15</text><text x="315" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Day 16-28</text><text x="220" y="160" text-anchor="middle" font-size="11" fill="var(--svg-8b5cf6)" font-weight="bold">Fertile window: 6 days ending on ovulation</text></svg>',
      alt: 'Timeline showing the 6-day fertile window ending on ovulation day within a 28-day cycle',
      caption: 'The fertile window spans 5 days before ovulation through ovulation day; sperm survive up to 5 days',
    },
    formulaDescription:
      'The fertile window spans the 6 days ending on the day of ovulation. Sperm can survive up to 5 days in fertile cervical mucus. The egg is viable for only 12–24 hours after ovulation. For IVF: Day 5 blastocyst transfer → due date = transfer + 261 days. Day 3 embryo transfer → due date = transfer + 263 days.',
    variables: [
      { symbol: 'Ovulation & Fertile Window', name: 'Ovulation & Fertile Window', description: 'Ovulation releases a mature egg ~14 days before the next period. The fertile window spans 5 days before ovulation through ovulation day — sperm survive up to 5 days, the egg lives 12–24 hours.' },
      { symbol: 'Implantation', name: 'Implantation Window', description: '6–12 days after ovulation. The fertilized egg travels to the uterus and embeds in the endometrial lining.' },
      { symbol: 'IVF', name: 'In Vitro Fertilization', description: 'Day 5 (blastocyst) transfer: due date = transfer + 261 days. Day 3 (cleavage) transfer: due date = transfer + 263 days. Account for embryo age outside the body.' },
    ],
    howToUse: [
      'Select your calculation method — LMP is most common if you track your period.',
      'For IVF: select "IVF Transfer Date" and enter the transfer date with your embryo type (Day 3 or Day 5).',
      'For due-date-based planning: select "Target Due Date" to find your conception window.',
      'Enter the relevant date information.',
      'If using average cycle length, enter your typical cycle length (20–45 days).',
      'Review your estimated ovulation date, fertile window dates, and peak fertility days.',
      'Use the fertile window calendar to plan intercourse timing for best conception chances.',
    ],
    explanation:
      'Understanding your fertile window is key to conception planning. A pregnancy is most likely when intercourse occurs in the 3 days ending on ovulation day. The fertile window (6 days) accounts for sperm survival (up to 5 days in fertile-quality cervical mucus) and egg viability (12–24 hours after ovulation). Ovulation typically occurs 14 days before your next period starts, but this varies between women and cycles. Tracking with ovulation predictor kits (which detect the LH surge 24–36 hours before ovulation), basal body temperature (which rises 0.5–1°F after ovulation), or cervical mucus observation (which becomes egg-white consistency at peak fertility) can confirm ovulation timing more precisely than calendar methods alone. The implantation window (6–12 days after ovulation) is when a fertilized egg travels down the fallopian tube and embeds in the uterine lining — this is when very early pregnancy tests may show positive results. An important practical note: having intercourse every 1-2 days during the fertile window maximizes conception chances. Waiting to "save up" sperm is counterproductive — regular ejaculation maintains healthier sperm quality than prolonged abstinence. In the landmark Wilcox et al. (1995) study, conception was only possible from intercourse in the 6 days ending on ovulation day, and the chance per day rose from about 10% five days before ovulation to about 33% on ovulation day itself. For couples trying to conceive, focusing on the 3-day peak window (ovulation day minus 2 through ovulation day) gives the highest probability of success while minimizing the pressure of rigid daily scheduling.',
    faqs: [
      {
        question: 'How do I calculate my conception date from my due date?',
        answer: 'Select "Based on Target Due Date" above and enter your due date — the calculator works backward using the standard 266-day conception-to-birth timeline (280 days from LMP, minus the ~14 days between LMP and ovulation/conception). For example, a September 1, 2026 due date puts estimated conception around December 9, 2025. The same method also works if you only know your baby\'s actual birth date, though the estimate is less precise for babies born notably early or late, since the 266-day timeline assumes a full-term birth at exactly 40 weeks.',
      },
      {
        question: 'Why does "4 weeks pregnant" mean I actually conceived 2 weeks ago?',
        answer: 'Pregnancy is dated from the first day of your last menstrual period (LMP), not from conception — but ovulation and conception typically happen around day 14 of the cycle, about 2 weeks after LMP. So at "4 weeks pregnant" (4 weeks since LMP), conception itself happened roughly 2 weeks earlier, not 4. This LMP-based convention (called "gestational age") is used because most people know their LMP date precisely but not their exact conception date — this calculator\'s "Based on Last Period" method uses the same 2-week offset to estimate your ovulation and conception dates.',
      },
      {
        question: 'What are the best days to get pregnant?',
        answer: 'The last three days of the fertile window: the 2 days before ovulation and ovulation day itself. In Wilcox et al. (1995) the chance of conception from intercourse on a given day rose from about 10% five days before ovulation to about 33% on ovulation day, and there were no conceptions from intercourse after ovulation. Use the "Based on Last Period" or "Based on Cycle Length" method above to get your personal estimated dates rather than relying on a generic average, since ovulation timing varies by several days between individuals even with regular cycles.',
      },
      {
        question: 'How likely is pregnancy from intercourse on each fertile day?',
        answer: 'Based on Wilcox et al. (1995), the probability of conception from intercourse on a single day ranged from about 10% five days before ovulation to about 33% on the day of ovulation itself, rising across the days in between, and was essentially zero after ovulation. Peak fertility is the 2 days before ovulation plus ovulation day.',
      },
      {
        question: 'Can I get pregnant from intercourse outside the fertile window?',
        answer: 'Pregnancy cannot occur without a viable egg, but the dates here are calendar estimates and ovulation can occur days earlier or later than predicted, so a day outside the estimated window is not guaranteed to be safe. Sperm survive up to 5 days in fertile cervical mucus, so intercourse up to 5 days before ovulation can result in pregnancy. After ovulation, the egg survives only 12–24 hours. This calculator is not a contraception method.',
      },
      {
        question: "How do I know if I'm ovulating?",
        answer: 'Common ovulation signs: changes in cervical mucus (egg-white consistency), mild pelvic pain (mittelschmerz), increased libido, and a slight rise in basal body temperature. Ovulation predictor kits (LH surge) and fertility tracking apps can help confirm.',
      },
      {
        question: 'What if my cycle is irregular?',
        answer: 'Irregular cycles make calendar-based prediction less reliable. For irregular cycles, use ovulation predictor kits, track basal body temperature, and monitor cervical mucus. Consider consulting a fertility specialist if cycles are consistently irregular (varying by 7+ days).',
      },
      {
        question: 'How does age affect fertility and conception chances?',
        answer: 'Fertility peaks in the early-to-mid 20s and gradually declines after age 30, with a more pronounced drop after 35. By age 40, the chance of conceiving naturally in a given cycle is roughly 5% or less, compared to roughly 20–25% in the 20s. This is primarily due to declining egg quantity and quality. Male fertility also declines with age, though more gradually, with increased risks of genetic abnormalities after age 40.',
      },
    ],
    commonUses: [
      'Conception timing — identify the optimal fertile window and peak fertility days for timed intercourse to maximize the chances of pregnancy',
      'IVF cycle planning — calculate due dates from Day 3 or Day 5 embryo transfer dates and track the pregnancy timeline from assisted reproduction',
      'Due date planning — work backwards from a target due date to determine the conception window, useful for family planning and career timing decisions',
      'Implantation awareness — understand the 6-12 day implantation window after ovulation when early pregnancy tests may first show positive results'
    ],
    workedExamples: [
      {
        scenario: 'A woman with a regular 28-day cycle had her last period start on January 1, 2026. She is trying to conceive and wants to identify her fertile window, peak fertility days, ovulation date, and implantation window for this cycle.',
        inputs: { method: 'lmp', lmpDate: '2026-01-01', cycleLength: '28', periodLength: '5' },
        result: 'Ovulation: ~January 15. Fertile Window: ~January 10–15. Peak Fertility: ~January 13–15. Implantation Window: ~January 21–27. Estimated Due Date if conception occurs: ~October 8, 2026.',
        insight: 'With a textbook 28-day cycle and LMP of January 1, ovulation is estimated on January 15 (14 days before the next period, cycle day 15). The fertile window spans the 6 days ending on ovulation day — January 10 through 15. The peak fertility window (January 13–15, the 2 days before ovulation through ovulation day) accounts for the highest conception probability. In the Wilcox et al. data the single-day chance climbs to about 33% on the day of ovulation, so January 13 through January 15 gives the best single-day chances. For maximum probability, the couple should have intercourse every 1–2 days from January 10 through January 16. The implantation window (January 21–27) is when the fertilized egg travels and embeds — a home pregnancy test taken on January 28 or later has a reasonable chance of detecting hCG.',
      },
      {
        scenario: 'A couple is planning a pregnancy and wants the baby to be born around September 1, 2026 (to align with school cutoff dates and work leave schedules). They want to know the optimal conception window and when to start trying.',
        inputs: { method: 'dueDate', targetDueDate: '2026-09-01', cycleLength: '28', periodLength: '5' },
        result: 'Working backwards from a September 1, 2026 due date: Estimated Conception Date: ~December 9, 2025. Fertile/Conception Window: ~December 4–9, 2025. Estimated LMP: ~November 25, 2025.',
        insight: 'To target a September 1, 2026 due date, conception should occur around December 9, 2025 (266 days before the due date). The couple should focus their efforts on the fertile window of approximately December 4–9, 2025, with peak fertility December 7–9. This reverse-planning approach is useful for coordinating with career timing, school enrollment cutoffs, and seasonal preferences. However, conception timing is inherently uncertain — even with perfectly timed intercourse in the fertile window, the per-cycle pregnancy rate for healthy couples is only about 20–30%. The couple should start trying 2–3 cycles before the target window (October–November 2025) to account for the possibility that the first few cycles may not result in conception. If pregnancy does not occur by the December 2025 window, each subsequent cycle shifts the due date about one month forward.',
      },
      {
        scenario: 'A woman undergoing IVF had a Day 5 blastocyst embryo transferred on March 15, 2026. She wants to calculate her estimated due date, the earliest recommended pregnancy test date, and understand how IVF dating differs from natural conception dating.',
        inputs: { method: 'ivf', ivfDate: '2026-03-15', embryoType: 'day5' },
        result: 'IVF Estimated Due Date: ~December 1, 2026 (transfer + 261 days). Earliest Pregnancy Test: ~March 24, 2026 (9 days post-transfer). Egg Retrieval Estimate: ~March 10, 2026. Current pregnancy stage depends on date of calculation.',
        insight: 'IVF dating is more precise than natural conception dating because the exact embryo age and transfer date are known. A Day 5 blastocyst transfer on March 15 means the embryo was already 5 days old at transfer, so the due date is calculated as transfer date + 261 days (the remaining days of the 266-day conception-to-birth timeline). This yields December 1, 2026. The earliest recommended pregnancy test (blood beta-hCG) is 9–14 days post-transfer — March 24 at the earliest for a first response test. The egg retrieval occurred approximately March 10 (5 days before transfer). IVF due dates are considered more accurate than LMP-based dates and are not adjusted after early ultrasound confirmation. The 2-week wait between transfer and pregnancy test is one of the most emotionally challenging periods of IVF — support resources and distraction planning are recommended.',
      },
    ],
    proTips: [
      'Track more than just the calendar. Use ovulation predictor kits (OPKs) to detect the LH surge 24–36 hours before ovulation — this is far more accurate than calendar estimation alone, especially if your cycles vary by more than 1–2 days. The Clearblue Digital and cheap strip tests are both effective.',
      'Have intercourse every 1–2 days throughout the fertile window, not just on the predicted peak day. Sperm quality is maintained or improved with regular ejaculation (every 1–2 days), and this ensures sperm are present whenever ovulation actually occurs. The "save up sperm" myth is counterproductive — prolonged abstinence (5+ days) can increase sperm DNA fragmentation.',
      'Use basal body temperature (BBT) charting to confirm ovulation has occurred, not to predict it. BBT rises 0.5–1.0°F only after ovulation due to progesterone. Charting 2–3 cycles of BBT data helps you identify your personal follicular phase length (which varies) versus your luteal phase length (which is usually 12–14 days and consistent cycle to cycle).',
      'For irregular cycles (varying by 7+ days), calendar-based prediction is unreliable. Combine OPKs, cervical mucus tracking (egg-white consistency = peak fertility), and BBT confirmation. Cervical mucus is the single best real-time fertility sign — it appears 2–3 days before ovulation and directly facilitates sperm survival and transport. Consider consulting a reproductive endocrinologist if cycles are consistently irregular or if you have been trying for 6+ months (age 35+) or 12+ months (under 35) without success.',
      'Male partner fertility matters equally. Sperm parameters can be affected by: heat exposure (hot tubs, saunas, laptop use on lap), smoking (reduces count and motility), heavy alcohol (reduces testosterone), and certain medications. A semen analysis is non-invasive, relatively inexpensive, and provides valuable information — it should be pursued as early as female fertility testing if conception is delayed.',
      'For IVF patients: the "two-week wait" between transfer and pregnancy test is uniquely challenging. Avoid home pregnancy tests before day 9 post-transfer (they can show false negatives due to low hCG or false positives from trigger shot remnants). Plan pleasurable distractions during this window — the stress of constant symptom-spotting does not affect implantation but significantly impacts mental health.',
    ],
    limitations: [
      'This calculator uses calendar-based estimation methods that assume a regular ovulatory cycle with a 14-day luteal phase. Ovulation does not always occur exactly 14 days before the next period — the luteal phase can range from 12–16 days. Cycle lengths can vary cycle to cycle due to stress, illness, travel, or no identifiable cause. Calendar methods alone often miss the true ovulation day, even in women with "regular" cycles.',
      'This calculator is a planning and educational tool, not a diagnostic instrument. It cannot confirm ovulation, detect pregnancy, or diagnose fertility problems. For couples actively trying to conceive for 12+ months without success (6+ months if over age 35), consultation with a reproductive endocrinologist is recommended regardless of what the calculator predicts.',
      'The per-cycle conception probabilities mentioned are population averages from the Wilcox et al. (1995) study. Individual fertility varies dramatically with age (steep decline after 35), ovarian reserve, tubal patency, male factor fertility, lifestyle factors, and underlying medical conditions. The probability of conception in a given cycle ranges from roughly 20–25% (20s, no fertility issues) to about 5% or less (age 40+).',
      'IVF due date calculations assume a standard embryo development timeline. Frozen embryo transfers (FET) in programmed/hormone-replacement cycles use different dating formulas than fresh transfers, and natural-cycle FETs are dated by ovulation trigger or LH surge timing. This calculator covers fresh Day 3 and Day 5 transfers only.',
      'Due-date-based reverse conception planning provides estimates, not guarantees. The natural variation in gestation length (births from 37 to 42 weeks are all within the normal range) means a target due date may result in birth 2–3 weeks before or after the target. Conception is probabilistic — even perfectly timed intercourse yields only a 20–30% chance of pregnancy per cycle in optimal conditions.',
    ],
    quickReference: [
      { label: 'Ovulation Timing', value: '~14 days before next period starts' },
      { label: 'Fertile Window', value: '5 days before ovulation through ovulation day (6 days total)' },
      { label: 'Peak Fertility', value: '2 days before ovulation through ovulation day (3 days)' },
      { label: 'Sperm Survival', value: 'Up to 5 days in fertile cervical mucus' },
      { label: 'Egg Viability', value: '12–24 hours after ovulation' },
      { label: 'Implantation Window', value: '6–12 days after ovulation' },
      { label: 'IVF Day 5 Due Date', value: 'Transfer date + 261 days' },
      { label: 'IVF Day 3 Due Date', value: 'Transfer date + 263 days' },
      { label: 'Earliest Pregnancy Test', value: '~9–14 days post ovulation/transfer' },
      { label: 'Due Date (Naegele\'s Rule)', value: 'LMP + 280 days (40 weeks)' },
    ],
    citations: [
      { source: 'ACOG - Optimizing Fertility', url: 'https://www.acog.org/womens-health/faqs/optimizing-fertility' },
      { source: 'Wikipedia - Fertility', url: 'https://en.wikipedia.org/wiki/Fertility' },
      { source: 'Wilcox et al. (1995) - Timing of Sexual Intercourse in Relation to Ovulation', url: 'https://doi.org/10.1056/NEJM199512073332301' },
      { source: 'ASRM - Optimizing Natural Fertility', url: 'https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility/' },
    ],
  },
};

export default conceptionConfig;
