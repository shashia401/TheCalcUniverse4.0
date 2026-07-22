import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ConceptionPanel from './ConceptionPanel';

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
        { label: 'Based on Cycle Length (Average)', value: 'cycle' },
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
      helpText: 'For cycle length method. Default 28 days.',
      showWhen: (v) => v.method === 'lmp' || v.method === 'nextPeriod' || v.method === 'cycle',
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
      inputMode: 'decimal',
      helpText: 'For cycle-based method — when your period typically ends.',
      showWhen: (v) => v.method === 'lmp' || v.method === 'nextPeriod' || v.method === 'cycle',
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
  calculate: (values) => {
    const method = values.method || 'lmp';
    const cycleLength = parseFloat(values.cycleLength) || 28;

    const addDays = (d: Date, n: number): Date => {
      const r = new Date(d);
      r.setDate(r.getDate() + n);
      return r;
    };

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── IVF Method ──────────────────────────────────────────────
    if (method === 'ivf') {
      const ivfDateStr = values.ivfDate?.trim();
      if (!ivfDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(ivfDateStr)) return [];
      const transferDate = new Date(ivfDateStr + 'T00:00:00');
      if (isNaN(transferDate.getTime())) return [];

      const embryoDays = values.embryoType === 'day3' ? 3 : 5;
      // Due date: Day 5 transfer → +261 days, Day 3 transfer → +263 days
      const ivfDueDateDays = embryoDays === 5 ? 261 : 263;
      const estDueDate = addDays(transferDate, ivfDueDateDays);

      // Estimated "ovulation" (retrieval) date
      const retrievalDate = addDays(transferDate, -(embryoDays - 1)); // e.g., day 5 → retrieval 5 days before transfer
      const retrievalLabel = embryoDays === 5 ? 'Blastocyst (Day 5)' : 'Cleavage Stage (Day 3)';

      const weeksPregnant = Math.floor((today.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) + (embryoDays === 5 ? 2 : 2);

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
          value: weeksPregnant > 0 ? `~${weeksPregnant} weeks since LMP equivalent` : 'Prior to transfer',
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
      const ddStr = values.targetDueDate?.trim();
      if (!ddStr || !/^\d{4}-\d{2}-\d{2}$/.test(ddStr)) return [];
      const targetDue = new Date(ddStr + 'T00:00:00');
      if (isNaN(targetDue.getTime())) return [];

      // Conception ≈ due date - 266 days
      const conceptionDate = addDays(targetDue, -266);
      // Ovulation ≈ conception date (ovulation is when conception happens)
      const ovulationDate = conceptionDate;
      // LMP ≈ conception - 14 days
      const lmpDate = addDays(conceptionDate, -14);
      // Fertile window: 5 days before ovulation
      const fertileStart = addDays(ovulationDate, -5);

      // Current pregnancy progress
      const daysFromLmp = Math.round((today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksPregnant = Math.floor(daysFromLmp / 7);
      const daysRemaining = Math.round((targetDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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
          label: daysFromLmp >= 0 ? 'Current Pregnancy Progress' : 'Weeks until pregnancy',
          value: daysFromLmp >= 0
            ? `~${weeksPregnant} weeks pregnant · ${daysRemaining} days remaining`
            : `Conception window opens in ${Math.abs(daysFromLmp)} days`,
          color: 'neutral',
        },
      ];
    }

    // ── Original method (LMP / Next Period / Cycle) ─────────────
    let referenceDate: Date;

    if (method === 'nextPeriod') {
      const nd = values.nextPeriodDate?.trim();
      if (!nd || !/^\d{4}-\d{2}-\d{2}$/.test(nd)) return [];
      referenceDate = new Date(nd + 'T00:00:00');
      if (isNaN(referenceDate.getTime())) return [];
    } else if (method === 'cycle') {
      referenceDate = new Date();
    } else {
      const ld = values.lmpDate?.trim();
      if (!ld || !/^\d{4}-\d{2}-\d{2}$/.test(ld)) return [];
      referenceDate = new Date(ld + 'T00:00:00');
      if (isNaN(referenceDate.getTime())) return [];
    }

    let ovulationDate: Date;

    if (method === 'nextPeriod') {
      ovulationDate = addDays(referenceDate, -14);
    } else if (method === 'cycle') {
      const estimatedLmp = addDays(today, -cycleLength);
      ovulationDate = addDays(estimatedLmp, cycleLength - 14);
    } else {
      ovulationDate = addDays(referenceDate, cycleLength - 14);
    }

    // Fertile window: 5 days before ovulation + day of ovulation
    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = ovulationDate;

    // Peak fertility: 2 days before ovulation through ovulation day
    const peakStart = addDays(ovulationDate, -2);

    // Implantation window: 6-12 days after ovulation
    const implantStart = addDays(ovulationDate, 6);
    const implantEnd = addDays(ovulationDate, 12);

    // Due date if conception occurs
    const estLmp = addDays(ovulationDate, -14);
    const estDueDate = addDays(estLmp, 280);

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
          ? 'You are in your fertile window — chances are highest today and the next 2 days.'
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
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ConceptionPanel, { values, results });
  },
  educational: {
    formula: 'Ovulation = Cycle Length − 14 days | Fertile Window = Ovulation − 5 days to Ovulation | IVF Due Date = Transfer Date + 261–263 days',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Conception Window (28-Day Cycle)</text><rect x="30" y="55" width="380" height="40" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="55" width="68" height="40" rx="4" fill="var(--svg-ef4444)" opacity=".4"/><text x="64" y="79" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Period</text><rect x="98" y="55" width="41" height="40" fill="var(--svg-3b82f6)" opacity=".3"/><text x="118" y="79" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)">Pre</text><rect x="139" y="55" width="81" height="40" fill="var(--svg-22c55e)" opacity=".5"/><text x="179" y="79" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-22c55e)">Fertile Window</text><rect x="220" y="55" width="190" height="40" rx="4" fill="var(--svg-8b5cf6)" opacity=".3"/><text x="315" y="79" text-anchor="middle" font-size="10" fill="var(--svg-8b5cf6)">Luteal Phase</text><text x="64" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Days 1-5</text><text x="118" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Day 6-8</text><text x="179" y="115" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)" font-weight="bold">Day 9-14</text><text x="315" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Day 15-28</text><text x="220" y="160" text-anchor="middle" font-size="11" fill="var(--svg-8b5cf6)" font-weight="bold">Fertile window: 6 days ending on ovulation</text></svg>',
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
      'Understanding your fertile window is key to conception planning. A pregnancy is most likely when intercourse occurs in the 3 days ending on ovulation day. The fertile window (6 days) accounts for sperm survival (up to 5 days in fertile-quality cervical mucus) and egg viability (12–24 hours after ovulation). Ovulation typically occurs 14 days before your next period starts, but this varies between women and cycles. Tracking with ovulation predictor kits (which detect the LH surge 24–36 hours before ovulation), basal body temperature (which rises 0.5–1°F after ovulation), or cervical mucus observation (which becomes egg-white consistency at peak fertility) can confirm ovulation timing more precisely than calendar methods alone. The implantation window (6–12 days after ovulation) is when a fertilized egg travels down the fallopian tube and embeds in the uterine lining — this is when very early pregnancy tests may show positive results. An important practical note: having intercourse every 1-2 days during the fertile window maximizes conception chances. Waiting to "save up" sperm is counterproductive — regular ejaculation maintains healthier sperm quality than prolonged abstinence. The peak fertility window (the 2 days before ovulation) accounts for approximately 44% of all conceptions in natural cycles, based on the landmark Wilcox et al. (1995) study of fertility timing. For couples trying to conceive, focusing on this 3-day peak window (ovulation day minus 2 through ovulation day) gives the highest probability of success while minimizing the pressure of rigid daily scheduling.',
    faqs: [
      {
        question: 'How likely is pregnancy from intercourse on each fertile day?',
        answer: 'Based on Wilcox et al. (1995), the probability of conception by day relative to ovulation: Day −5: ~4%, Day −4: ~11%, Day −3: ~16%, Day −2: ~20%, Day −1: ~24%, Day 0 (ovulation): ~12%, Day +1: ~0%. Peak fertility is the 2 days before ovulation.',
      },
      {
        question: 'Can I get pregnant from intercourse outside the fertile window?',
        answer: 'No. Without a viable egg present, pregnancy cannot occur. Sperm survive up to 5 days in fertile cervical mucus, so intercourse up to 5 days before ovulation can result in pregnancy. After ovulation, the egg survives only 12–24 hours.',
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
        answer: 'Fertility peaks in the early-to-mid 20s and gradually declines after age 30, with a more pronounced drop after 35. By age 40, the chance of conceiving naturally in a given cycle is roughly 5% compared to ~25% at age 25. This is primarily due to declining egg quantity and quality. Male fertility also declines with age, though more gradually, with increased risks of genetic abnormalities after age 40.',
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
        insight: 'With a textbook 28-day cycle and LMP of January 1, ovulation is estimated on January 15 (cycle day 14). The fertile window spans the 6 days ending on ovulation day — January 10 through 15. The peak fertility window (January 13–15, the 2 days before ovulation through ovulation day) accounts for the highest conception probability. Based on Wilcox et al. data, intercourse on January 13 (~20% probability) through January 15 (~12% probability) gives the best single-day chances. For maximum probability, the couple should have intercourse every 1–2 days from January 10 through January 16. The implantation window (January 21–27) is when the fertilized egg travels and embeds — a home pregnancy test taken on January 28 or later has a reasonable chance of detecting hCG.',
      },
      {
        scenario: 'A couple is planning a pregnancy and wants the baby to be born around September 1, 2026 (to align with school cutoff dates and work leave schedules). They want to know the optimal conception window and when to start trying.',
        inputs: { method: 'dueDate', targetDueDate: '2026-09-01', cycleLength: '28', periodLength: '5' },
        result: 'Working backwards from a September 1, 2026 due date: Estimated Conception Date: ~December 10, 2025. Fertile/Conception Window: ~December 5–10, 2025. Estimated LMP: ~November 26, 2025.',
        insight: 'To target a September 1, 2026 due date, conception should occur around December 10, 2025 (266 days before the due date). The couple should focus their efforts on the fertile window of approximately December 5–10, 2025, with peak fertility December 8–10. This reverse-planning approach is useful for coordinating with career timing, school enrollment cutoffs, and seasonal preferences. However, conception timing is inherently uncertain — even with perfectly timed intercourse in the fertile window, the per-cycle pregnancy rate for healthy couples is only about 20–30%. The couple should start trying 2–3 cycles before the target window (October–November 2025) to account for the possibility that the first few cycles may not result in conception. If pregnancy does not occur by the December 2025 window, each subsequent cycle shifts the due date about one month forward.',
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
      'This calculator uses calendar-based estimation methods that assume a regular ovulatory cycle with a 14-day luteal phase. Ovulation does not always occur exactly 14 days before the next period — the luteal phase can range from 12–16 days. Cycle lengths can vary cycle to cycle due to stress, illness, travel, or no identifiable cause. Calendar methods alone predict ovulation correctly only ~30% of the time, even in women with "regular" cycles.',
      'This calculator is a planning and educational tool, not a diagnostic instrument. It cannot confirm ovulation, detect pregnancy, or diagnose fertility problems. For couples actively trying to conceive for 12+ months without success (6+ months if over age 35), consultation with a reproductive endocrinologist is recommended regardless of what the calculator predicts.',
      'The per-cycle conception probabilities mentioned are population averages from the Wilcox et al. (1995) study. Individual fertility varies dramatically with age (steep decline after 35), ovarian reserve, tubal patency, male factor fertility, lifestyle factors, and underlying medical conditions. The probability of conception in a given cycle ranges from ~25% (age 25, no fertility issues) to <5% (age 40+).',
      'IVF due date calculations assume a standard embryo development timeline. Frozen embryo transfers (FET) in programmed/hormone-replacement cycles use different dating formulas than fresh transfers, and natural-cycle FETs are dated by ovulation trigger or LH surge timing. This calculator covers fresh Day 3 and Day 5 transfers only.',
      'Due-date-based reverse conception planning provides estimates, not guarantees. The natural variation in gestation length (37–42 weeks is considered full term) means a target due date may result in birth 2–3 weeks before or after the target. Conception is probabilistic — even perfectly timed intercourse yields only a 20–30% chance of pregnancy per cycle in optimal conditions.',
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
      { source: 'NIH - Fertility', url: 'https://www.nichd.nih.gov/health/topics/fertility' },
      { source: 'Wilcox et al. (1995) - Timing of Sexual Intercourse in Relation to Ovulation', url: 'https://doi.org/10.1056/NEJM199512073332301' },
      { source: 'ASRM - Optimizing Natural Fertility', url: 'https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility/' },
    ],
  },
};

export default conceptionConfig;
