import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PregnancyPanel from './PregnancyPanel';

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const fmtDate = (d: Date): string =>
  d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const fmtShort = (d: Date): string =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const pregnancyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'lmpDate',
      label: 'First Day of Last Menstrual Period',
      type: 'date',
      required: true,
      helpText: 'Enter the first day of your last menstrual period.',
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
      helpText: 'Default 28 days. Adjust if your cycle is consistently shorter or longer.',
    },
  ],
  calculate: (values) => {
    const lmpStr = values.lmpDate;
    const cycleLengthStr = values.cycleLength;

    // Validate LMP date — type='date' gives ISO string (YYYY-MM-DD)
    if (!lmpStr) return [];
    const lmpDate = new Date(lmpStr + 'T00:00:00');
    if (isNaN(lmpDate.getTime())) return [];
    lmpDate.setHours(0, 0, 0, 0);

    // Parse cycle length with explicit checks (no ||)
    let cycleLength = 28;
    if (cycleLengthStr && cycleLengthStr.trim() !== '') {
      const parsed = parseFloat(cycleLengthStr);
      if (!isNaN(parsed) && parsed >= 20 && parsed <= 45) {
        cycleLength = parsed;
      }
    }

    const cycleOffset = cycleLength - 28;

    // Today normalized
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- Core Calculations ---

    // Due date: LMP + 280 days (40 weeks), adjusted for cycle length
    const dueDate = addDays(lmpDate, 280 + cycleOffset);

    // Gestational age
    const totalDaysPreg = Math.round(
      (today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weeksPregnant = Math.floor(totalDaysPreg / 7);
    const daysRemainder = totalDaysPreg % 7;
    const daysUntilDue = Math.round(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Gestational age label
    const isPregnant = totalDaysPreg > 0 && totalDaysPreg < 280;
    const isPastDue = totalDaysPreg >= 280;
    let gestationalAgeLabel: string;
    if (!isPregnant && !isPastDue) {
      gestationalAgeLabel = 'Pregnancy has not started yet';
    } else if (isPastDue) {
      gestationalAgeLabel = `${Math.abs(daysUntilDue)} days past due date`;
    } else {
      gestationalAgeLabel = `${weeksPregnant} weeks${daysRemainder > 0 ? ` and ${daysRemainder} day${daysRemainder > 1 ? 's' : ''}` : ''} pregnant`;
    }

    // Trimester detection
    // 1st: weeks 1-13, 2nd: weeks 14-26, 3rd: weeks 27-40
    let trimesterLabel: string;
    if (totalDaysPreg <= 0) {
      trimesterLabel = 'Not yet pregnant';
    } else if (totalDaysPreg > 280) {
      trimesterLabel = 'Post-term (past 40 weeks)';
    } else if (weeksPregnant <= 13) {
      trimesterLabel = '1st Trimester (Weeks 1-13)';
    } else if (weeksPregnant <= 26) {
      trimesterLabel = '2nd Trimester (Weeks 14-26)';
    } else {
      trimesterLabel = '3rd Trimester (Weeks 27-40)';
    }

    // Estimated conception date: LMP + 14 days (approximate)
    const conceptionDate = addDays(lmpDate, 14 + cycleOffset);

    // Key milestones
    const endFirstTrimester = addDays(lmpDate, 91); // 13 weeks
    const viabilityDate = addDays(lmpDate, 168); // 24 weeks
    const fullTermDate = addDays(lmpDate, 259); // 37 weeks

    // Progress percentage
    const progressPct = Math.min(100, Math.max(0, (totalDaysPreg / 280) * 100));

    // Days remaining label
    let daysRemainingLabel: string;
    if (daysUntilDue > 0) {
      daysRemainingLabel = `${daysUntilDue} days to go`;
    } else if (daysUntilDue === 0) {
      daysRemainingLabel = 'Due today!';
    } else {
      daysRemainingLabel = `${Math.abs(daysUntilDue)} days past due`;
    }

    return [
      {
        id: 'dueDate',
        label: 'Estimated Due Date (EDD)',
        value: fmtDate(dueDate),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'gestationalAge',
        label: 'Current Gestational Age',
        value: gestationalAgeLabel,
        color: isPregnant ? 'positive' : 'neutral',
      },
      {
        id: 'currentTrimester',
        label: 'Current Trimester',
        value: trimesterLabel,
        color: isPregnant ? 'positive' : 'neutral',
      },
      {
        id: 'conceptionDate',
        label: 'Estimated Conception Date',
        value: fmtShort(conceptionDate),
        color: 'neutral',
      },
      {
        id: 'progressSummary',
        label: `Progress (${progressPct.toFixed(0)}% of 40 weeks)`,
        value: daysRemainingLabel,
        color: isPregnant ? 'positive' : 'neutral',
      },
      {
        id: 'endFirstTrimester',
        label: 'End of 1st Trimester (13 weeks)',
        value: fmtShort(endFirstTrimester),
        color: 'neutral',
      },
      {
        id: 'viabilityDate',
        label: 'Viability Milestone (24 weeks)',
        value: fmtShort(viabilityDate) + ' — Lungs begin surfactant production',
        color: 'neutral',
      },
      {
        id: 'fullTermDate',
        label: 'Full Term (37 weeks)',
        value: fmtShort(fullTermDate) + ' — Baby is considered early term',
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PregnancyPanel, { values, results });
  },
  educational: {
    formula: 'Due Date = LMP + 280 days (40 weeks) | Gestational Age = Today − LMP | Conception ≈ LMP + 14 days',
    formulaDescription:
      "The Estimated Due Date (EDD) is calculated by adding 280 days (40 weeks) to the first day of the Last Menstrual Period, following Naegele's Rule — a dating convention established by German obstetrician Franz Naegele in the early 1800s. Gestational age is then tracked forward from LMP as the standard clinical measure. Conception is estimated at roughly 14 days after LMP, corresponding to ovulation in a typical 28-day cycle.",
    variables: [
      {
        symbol: 'LMP (Last Menstrual Period)',
        name: 'Last Menstrual Period',
        description:
          'The first day of your last menstrual period — the standard clinical reference point for dating a pregnancy. Gestational age is counted from LMP, not from conception.',
      },
      {
        symbol: '280 days (40 weeks)',
        name: 'Full Gestation Length',
        description:
          'Standard human gestation averages 280 days from LMP. A pregnancy is considered full term between 37 and 42 weeks. Only about 5% of births occur on the exact due date.',
      },
      {
        symbol: 'Gestational Age',
        name: 'Gestational Age',
        description:
          'The current duration of pregnancy measured from LMP in weeks and days. At 40 weeks + 0 days the pregnancy reaches full term. Calculated as today minus LMP date.',
      },
      {
        symbol: 'Trimester',
        name: 'Trimester Classification',
        description:
          'Pregnancy is divided into three trimesters: 1st (weeks 1-13) with organ formation and highest miscarriage risk; 2nd (weeks 14-26) with fetal movement and anatomy screening; 3rd (weeks 27-40) with lung maturation and rapid growth.',
      },
      {
        symbol: 'Conception Date',
        name: 'Conception (Ovulation) Estimate',
        description:
          'Estimated date of conception, approximately 14 days after LMP in a 28-day cycle. Conception occurs when a sperm fertilizes the egg within 12-24 hours of ovulation.',
      },
    ],
    howToUse: [
      'Enter the first day of your last menstrual period using the date picker.',
      'Adjust the cycle length if your average menstrual cycle is shorter or longer than 28 days (range 20-45 days).',
      'Review your estimated due date, current gestational age, and trimester classification.',
      'Reference the milestone dates for 1st trimester end, viability, and full term to plan prenatal care appointments.',
    ],
    explanation:
      "Pregnancy is conventionally dated from the first day of the Last Menstrual Period (LMP), a system established by German obstetrician Franz Naegele in the early 1800s. Under Naegele's Rule, the Estimated Due Date (EDD) is calculated as LMP plus 280 days, or 40 weeks. This convention persists because the LMP date is usually known, whereas the exact date of conception is rarely certain. Gestational age — the standard clinical measure of pregnancy progression — is expressed in completed weeks and days from LMP. At 40 weeks and 0 days, the pregnancy reaches its estimated due date. The 40-week journey is divided into three trimesters, each marking distinct developmental milestones for both the baby and the mother. The first trimester (weeks 1-13) is a period of rapid organogenesis — the baby's heart begins beating around week 6, and all major organs are formed by week 12. This trimester carries the highest risk of miscarriage, and many women experience fatigue, nausea, and breast tenderness. The second trimester (weeks 14-26) is often called the 'golden period' as energy returns and fetal movement becomes noticeable (quickening, typically felt around weeks 18-22). The 20-week anatomy scan is a major prenatal milestone. After week 24, the fetus reaches viability — the point at which survival outside the womb is possible with intensive medical support. The third trimester (weeks 27-40) focuses on rapid brain and lung development, significant weight gain, and preparation for birth. At 37 weeks, the baby is considered early term; full term spans 39-40 weeks for optimal outcomes. Understanding these milestones helps expectant parents plan prenatal care, maternity leave, and birth preparations with confidence.",
    faqs: [
      {
        question: 'How accurate is the due date calculated from LMP?',
        answer: 'The due date is a statistical estimate, not a precise prediction. Only about 5% of babies are born on their exact due date. Normal delivery can occur anywhere between 37 and 42 weeks. First-trimester ultrasound (crown-rump length at 8-13 weeks) provides the most accurate dating with an error margin of ±5-7 days. If your ultrasound dating differs significantly from your LMP date, the ultrasound-based date is typically considered more reliable.',
      },
      {
        question: 'What if my menstrual cycle is longer or shorter than 28 days?',
        answer: 'If your cycle is consistently longer or shorter, adjust the cycle length input accordingly. The calculator shifts the due date by the difference from 28 days. For example, a 35-day cycle shifts ovulation to day 21, adding 7 days to the due date. For irregular cycles (varying by 7+ days between cycles), early ultrasound dating is recommended for the most accurate due date.',
      },
      {
        question: 'When does each trimester begin and end?',
        answer: 'The first trimester spans weeks 1 through 13, starting from LMP. The second trimester covers weeks 14 through 26. The third trimester runs from week 27 through delivery (typically weeks 27-40). Each trimester brings different developmental milestones and prenatal care focuses. Your healthcare provider will recommend specific screenings and tests timed to each trimester.',
      },
      {
        question: 'What are the key pregnancy milestones to track?',
        answer: 'Key milestones include: end of first trimester (week 13) when organ formation is complete; viability threshold (week 24) when the fetus has a chance of survival with medical support; full term (week 37) when the baby is considered early term and delivery is no longer considered preterm; and the estimated due date (week 40). The 20-week anatomy scan between weeks 18-22 is also a major prenatal milestone.',
      },
      {
        question: 'Why is pregnancy dated from the last menstrual period and not from conception?',
        answer: 'LMP dating has been the clinical standard since the early 1800s because the first day of the last period is usually the most reliably known date. Conception is rarely known with certainty — sperm can survive 5-7 days in the reproductive tract, and ovulation timing varies even in regular cycles. Using LMP provides a consistent reference point across all pregnancies, even if it means the first 2 weeks of "pregnancy" occur before conception actually happens. This convention ensures all healthcare providers, ultrasound machines, and growth charts use the same dating language.',
      },
      {
        question: 'What should I do if my due date changes after an ultrasound?',
        answer: 'It is common and normal for the due date to be adjusted after a first-trimester ultrasound (typically done at 8-13 weeks). If the ultrasound-based date differs from the LMP-based date by 7 or more days, healthcare providers typically adopt the ultrasound date as it is considered more accurate (±5-7 days) than LMP dating. Late first-trimester and second-trimester ultrasounds are less accurate for dating, so providers are less likely to change the due date based on later scans. Do not be alarmed if your due date shifts — early ultrasound dating is the gold standard.',
      },
      {
        question: 'What does "full term" actually mean, and why does it matter?',
        answer: 'Full term is now defined more precisely than simply "40 weeks." Early term: 37 weeks 0 days through 38 weeks 6 days. Full term: 39 weeks 0 days through 40 weeks 6 days. Late term: 41 weeks 0 days through 41 weeks 6 days. Post-term: 42 weeks and beyond. This distinction matters because babies born at 37-38 weeks (early term) have higher rates of respiratory issues, feeding difficulties, and NICU admissions compared to babies born at 39-40 weeks (full term). For this reason, elective inductions and scheduled C-sections are typically not performed before 39 weeks unless medically indicated.',
      },
    ],
    citations: [
      {
        source: 'ACOG - Method for Estimating Due Date',
        url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/method-for-estimating-due-date',
      },
      {
        source: 'WHO - Pregnancy and Prenatal Care',
        url: 'https://www.who.int/health-topics/pregnancy',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Pregnancy Timeline (40 Weeks)</text><rect x="30" y="60" width="380" height="40" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="60" width="124" height="40" rx="4" fill="var(--svg-3b82f6)" opacity=".3"><title>1st Trimester: Weeks 1-13 — Early development, organ formation</title></rect><text x="92" y="84" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-3b82f6)">1st Trimester</text><rect x="154" y="60" width="124" height="40" fill="var(--svg-22c55e)" opacity=".3"><title>2nd Trimester: Weeks 14-26 — Growth, movement felt, viability reached</title></rect><text x="216" y="84" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-22c55e)">2nd Trimester</text><rect x="278" y="60" width="132" height="40" rx="4" fill="var(--svg-f59e0b)" opacity=".3"><title>3rd Trimester: Weeks 27-40 — Final growth, preparation for birth</title></rect><text x="344" y="84" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-f59e0b)">3rd Trimester</text><text x="92" y="120" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Weeks 1-13</text><text x="216" y="120" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Weeks 14-26</text><text x="344" y="120" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Weeks 27-40</text><line x1="154" y1="55" x2="154" y2="105" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="3,3"/><text x="154" y="140" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">13w — End 1st Tri</text><line x1="258" y1="55" x2="258" y2="105" stroke="var(--svg-22c55e)" stroke-width="1.5" stroke-dasharray="3,3"/><text x="258" y="158" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">24w — Viability</text><line x1="382" y1="55" x2="382" y2="105" stroke="var(--svg-f59e0b)" stroke-width="1.5" stroke-dasharray="3,3"/><text x="382" y="140" text-anchor="middle" font-size="9" fill="var(--svg-f59e0b)">37w — Full Term</text><line x1="410" y1="55" x2="410" y2="105" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="410" y="158" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)" font-weight="bold">40w — Due Date</text><text x="220" y="195" text-anchor="middle" font-size="11" fill="var(--svg-8b5cf6)">EDD = LMP + 280 days (Naegele&apos;s Rule)</text><text x="220" y="230" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Gestational Age = Today − LMP | Conception ≈ LMP + 14 days</text></svg>',
      alt: 'Pregnancy timeline bar spanning 40 weeks with three color-coded trimesters: blue for 1st (weeks 1-13), green for 2nd (weeks 14-26), and orange for 3rd (weeks 27-40), with milestone markers at 13 weeks (end of 1st trimester), 24 weeks (viability), 37 weeks (full term), and 40 weeks (due date).',
      caption: 'The 40-week pregnancy timeline from LMP, divided into three trimesters with key milestone markers for prenatal planning.',
    },
    quickReference: [
      { label: 'Week 4', value: 'Implantation complete; pregnancy hormone (hCG) detectable' },
      { label: 'Week 8', value: 'Heartbeat visible on ultrasound; basic limb buds forming' },
      { label: 'Week 12', value: 'End of 1st trimester; all major organs formed; miscarriage risk drops significantly' },
      { label: 'Week 16', value: 'Baby can make facial expressions; sex organs distinguishable' },
      { label: 'Week 20', value: 'Anatomy scan; halfway point; fetal movement often felt' },
      { label: 'Week 24', value: 'Viability threshold; lungs begin surfactant production; baby responds to sound' },
      { label: 'Week 28', value: '3rd trimester begins; eyes open; brain wave activity resembles newborn' },
      { label: 'Week 32', value: 'Baby practices breathing; most major systems mature' },
      { label: 'Week 37', value: 'Full term — baby is considered early term; delivery not premature' },
      { label: 'Week 40', value: 'Estimated due date; average pregnancy length' },
    ],
    workedExamples: [
      {
        scenario: 'Sarah, 28, has an LMP of March 1, 2026 and a regular 28-day cycle. She wants to know her due date, current gestational age, and which trimester she is in.',
        inputs: { lmp: '2026-03-01', cycleLength: '28' },
        result: 'Due date: December 6, 2026. As of late May, she is approximately 12 weeks pregnant and in her first trimester.',
        insight: 'Using Naegele\'s rule (LMP + 280 days), Sarah\'s due date calculates to December 6. The 28-day cycle is standard, so no adjustment is needed. At 12 weeks, she is completing the first trimester — a milestone when many parents begin sharing pregnancy news as miscarriage risk drops significantly after this point.',
      },
      {
        scenario: 'Maria has a longer 35-day cycle and her LMP was January 15, 2026. She is unsure how her longer cycle affects her due date.',
        inputs: { lmp: '2026-01-15', cycleLength: '35' },
        result: 'Due date: October 29, 2026 (adjusted 7 days later than the standard 28-day calculation of October 22).',
        insight: 'Women with cycles longer than 28 days ovulate later, so the due date is adjusted forward by the extra days. For Maria, 35 - 28 = 7 extra days, pushing her due date from October 22 to October 29. This adjustment is important because using the standard 28-day calculation would suggest the baby is "late" when it is actually right on time.',
      },
      {
        scenario: 'Jessica\'s LMP was June 1, 2026, and today is September 15, 2026. She wants to know her current week, trimester, and key upcoming milestones.',
        inputs: { lmp: '2026-06-01', cycleLength: '28' },
        result: 'As of September 15, she is approximately 15 weeks pregnant and in her second trimester. Due date: March 8, 2027.',
        insight: 'At 15 weeks, Jessica has entered the second trimester (weeks 14-27). Many women feel more energetic during this period as first-trimester symptoms like nausea often subside. The anatomy ultrasound is typically scheduled around week 20, and fetal movement (quickening) is often first felt between weeks 16-22.',
      },
    ],
    proTips: [
      'Pregnancy is dated from the first day of your last menstrual period (LMP), not from conception — this means you are already "2 weeks pregnant" at conception. This is the standard medical convention used worldwide.',
      'If you have irregular cycles, your due date may be adjusted after a first-trimester ultrasound, which measures the crown-rump length of the embryo and is more accurate than LMP-based dating (±5-7 days vs ±2-3 weeks).',
      'Book your first prenatal appointment as soon as you confirm pregnancy — ideally before 8-10 weeks. Early prenatal care is associated with better outcomes for both mother and baby.',
      'Consider downloading a pregnancy tracking app alongside using this calculator; weekly fetal development information helps you understand what is happening at each stage.',
    ],
    limitations: [
      'This calculator uses Naegele\'s rule (LMP + 280 days, adjusted for cycle length) which provides an estimated due date. Only about 4-5% of babies are born on their exact due date.',
      'Irregular menstrual cycles, late ovulation, or uncertain LMP dates can significantly affect accuracy. A first-trimester ultrasound is the gold standard for dating a pregnancy.',
      'This calculator is for informational purposes only and is not a substitute for professional prenatal care. Always consult your healthcare provider for personalized pregnancy dating and management.',
      'Adjustments for IVF pregnancies or pregnancies achieved through assisted reproductive technology are not modeled; those due dates are typically calculated from the embryo transfer date.',
      'Trimester boundaries are approximate: first trimester (weeks 1-13), second trimester (weeks 14-26), third trimester (weeks 27-40). Some guidelines use slightly different cutoff points.',
    ],
    commonUses: [
      'Track your pregnancy week by week and understand which trimester you are in for prenatal care planning.',
      'Plan maternity leave, baby showers, and birth preparations around key milestone dates.',
      'Share your estimated due date and gestational progress with your healthcare provider at prenatal visits.',
    ],
  },
};

export default pregnancyConfig;
