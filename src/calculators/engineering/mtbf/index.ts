import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import MTBFPanel from './MTBFPanel';

const mtbfConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      required: true,
      defaultValue: 'mtbf',
      helpText: 'Choose whether to compute MTBF from data, reliability at a time, or expected failures',
      options: [
        { label: 'MTBF — from failures and operating hours', value: 'mtbf' },
        { label: 'Reliability % — at a specific time', value: 'reliability' },
        { label: 'Expected Failures — given MTBF and hours', value: 'failures' },
      ],
    },
    {
      id: 'operatingHours',
      label: 'Total Operating Hours',
      type: 'number',
      placeholder: '50000',
      unit: 'hours',
      inputMode: 'decimal',
      min: 0,
      step: 100,
      helpText: 'Combined operating hours across all units in the observation period',
    },
    {
      id: 'numberOfFailures',
      label: 'Number of Failures',
      type: 'number',
      placeholder: '5',
      unit: 'failures',
      inputMode: 'decimal',
      min: 1,
      step: 1,
      helpText: 'Total number of failures observed during those operating hours',
    },
    {
      id: 'mtbf',
      label: 'Known MTBF',
      type: 'number',
      placeholder: '10000',
      unit: 'hours',
      inputMode: 'decimal',
      min: 0,
      step: 100,
      helpText: 'Required for reliability and failures calculations',
    },
    {
      id: 'missionTime',
      label: 'Mission / Operating Time (t)',
      type: 'number',
      placeholder: '8760',
      unit: 'hours',
      inputMode: 'decimal',
      min: 0,
      step: 100,
      helpText: '8,760 = 1 year of continuous operation',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'mtbf';
    const operatingHours = parseFloat(values.operatingHours);
    const failures = parseFloat(values.numberOfFailures);
    const mtbfKnown = parseFloat(values.mtbf);
    const missionTime = parseFloat(values.missionTime);

    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

    if (mode === 'mtbf') {
      if (isNaN(operatingHours) || isNaN(failures) || failures <= 0) return [];
      const mtbf = operatingHours / failures;
      const failureRate = 1 / mtbf;
      const reliability1yr = Math.exp(-8760 / mtbf) * 100;
      return [
        { id: 'mtbf', label: 'Mean Time Between Failures (MTBF)', value: `${fmt(mtbf)} hours`, highlight: true, color: 'positive' },
        { id: 'failureRate', label: 'Failure Rate (λ)', value: `${failureRate.toExponential(4)} failures/hr`, color: 'neutral' },
        { id: 'reliability1yr', label: 'Reliability Over 1 Year', value: `${reliability1yr.toFixed(2)}%`, color: reliability1yr > 90 ? 'positive' : 'neutral' },
      ];
    }

    if (mode === 'reliability') {
      if (isNaN(mtbfKnown) || isNaN(missionTime) || mtbfKnown <= 0) return [];
      const reliability = Math.exp(-missionTime / mtbfKnown) * 100;
      const unreliability = 100 - reliability;
      return [
        { id: 'reliability', label: `Reliability over ${fmt(missionTime)} hours`, value: `${reliability.toFixed(4)}%`, highlight: true, color: reliability > 90 ? 'positive' : reliability > 70 ? 'neutral' : 'negative' },
        { id: 'probability_failure', label: 'Probability of Failure', value: `${unreliability.toFixed(4)}%`, color: 'negative' },
        { id: 'lambda', label: 'Failure Rate (λ)', value: `${(1/mtbfKnown).toExponential(4)} /hr`, color: 'neutral' },
      ];
    }

    if (mode === 'failures') {
      if (isNaN(mtbfKnown) || isNaN(missionTime) || mtbfKnown <= 0) return [];
      const expectedFailures = missionTime / mtbfKnown;
      return [
        { id: 'expectedFailures', label: `Expected Failures over ${fmt(missionTime)} hours`, value: `${expectedFailures.toFixed(2)}`, highlight: true, color: expectedFailures < 1 ? 'positive' : expectedFailures < 3 ? 'neutral' : 'negative' },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MTBFPanel, { values, results });
  },
  educational: {
    formula: 'MTBF = Total Operating Hours ÷ Number of Failures | Reliability = e^(−t/MTBF)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="60" width="320" height="220" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" rx="4"/><path d="M70 250 Q120 250 150 200 Q200 120 280 100 Q340 90 380 90" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3"/><text x="110" y="180" font-size="10" fill="var(--svg-ef4444)">Infant</text><text x="220" y="100" font-size="10" fill="var(--svg-22c55e)">Normal</text><text x="340" y="120" font-size="10" fill="var(--svg-ef4444)">Wear-out</text><text x="70" y="290" font-size="11" fill="var(--svg-666666)">Time</text><text x="220" y="310" text-anchor="middle" font-size="12" fill="var(--svg-333333)">Bathtub Curve: Failure Rate over Time</text></svg>',
      alt: 'Bathtub curve graph showing failure rate over time with infant mortality, normal life, and wear-out phases',
      caption: 'Bathtub curve — failure rate is high initially, stable during normal life, then rises with wear-out',
    },
    formulaDescription:
      'MTBF is the average time between equipment failures. Reliability R(t) = e^(−t/MTBF) is the probability of failure-free operation for a given mission time. The failure rate λ is the inverse of MTBF.',
    variables: [
      { symbol: 'MTBF', name: 'Mean Time Between Failures', description: 'Average operating time between failures for repairable systems. Higher is better. Example: 10,000 hour MTBF means one failure per 10,000 hours on average.' },
      { symbol: 'λ', name: 'Failure Rate', description: 'The inverse of MTBF (λ = 1/MTBF). Expressed as failures per hour. A 10,000 hour MTBF = 0.0001 failures/hour.' },
      { symbol: 'R(t)', name: 'Reliability', description: 'Probability that the system operates without failure for time t, calculated as e^(−t/MTBF). At t = MTBF, only 36.8% of systems survive without failure.' },
    ],
    howToUse: [
      'Select the calculation mode: MTBF from data, reliability at a specific time, or expected failures over a period.',
      'For MTBF: enter total operating hours and total failures observed.',
      'For reliability: enter a known MTBF and the mission time.',
      'View MTBF, failure rate, and predicted reliability over time.',
      'Use the 1-year reliability result to assess whether your system meets uptime requirements.',
    ],
    explanation:
      'MTBF is a fundamental reliability engineering metric. It assumes failures follow an exponential distribution (constant failure rate). A system with MTBF of 10,000 hours has a 63.2% probability of failing within 10,000 hours. The exponential reliability model (R = e^−λt) is simple but assumes failures are random and independent — it is most appropriate for mature, complex systems in their normal operating phase (excluding infant mortality and wear-out periods). Real-world example: a data center UPS system has logged 50,000 operating hours with 4 failures. MTBF equals 50,000 divided by 4 which is 12,500 hours. The 1-year reliability is R(8,760) = e^(−8,760/12,500) which equals 49.6% — meaning there is about a 50% chance of at least one failure in any given year. The facility manager would use this to plan redundancy and maintenance schedules. Note that the bathtub curve concept is important here: failure rates are higher early in life (infant mortality) and late in life (wear-out), with a relatively constant rate in the middle. For repairable systems in critical applications like medical equipment or aircraft, design targets often call for an MTBF of 100,000 hours or more. A server power supply with an MTBF of 500,000 hours has a 98.3% chance of surviving one year of continuous operation without failure.',
    commonUses: [
      'Predicting equipment reliability and planning preventive maintenance schedules in manufacturing and industrial operations',
      'Comparing product reliability across different vendors by analyzing field failure data and MTBF specifications',
      'Calculating the probability of failure-free operation over a given mission time for critical systems like servers, medical devices, or aircraft components',
      'Determining spare parts inventory requirements based on expected failure rates over a maintenance planning period',
    ],
    quickReference: [
      { label: 'MTBF 10,000 hrs', value: 'λ = 0.0001 failures/hr, 63.2% failure probability within 10,000 hrs' },
      { label: 'MTBF 50,000 hrs', value: 'Reliability at 1 yr (8,760 hrs) = 83.9%' },
      { label: 'MTBF 100,000 hrs', value: 'Reliability at 1 yr = 91.6%, at 5 yr = 64.5%' },
      { label: 'MTBF 500,000 hrs', value: 'Reliability at 1 yr = 98.3%, typical for server PSUs' },
      { label: 'MTBF 1,000,000 hrs', value: 'Reliability at 1 yr = 99.1%, typical for telecom equipment' },
      { label: 'R(t) at t = MTBF', value: 'Always 36.8% (e⁻¹) — surprisingly low' },
      { label: 'Six 9s (99.9999%)', value: 'Availability requires MTBF/MTTR ratio > 1,000,000' },
      { label: 'Availability formula', value: 'A = MTBF / (MTBF + MTTR)' },
    ],
    faqs: [
      {
        question: 'What is the difference between MTBF and MTTR?',
        answer: 'MTBF is the average time between failures (reliability). MTTR (Mean Time To Repair) is the average time to fix a failure (maintainability). System availability = MTBF / (MTBF + MTTR). If MTBF = 500 hours and MTTR = 4 hours, availability = 500 / 504 = 99.2%. To achieve "five nines" availability (99.999%), you need MTBF / MTTR to be at least 100,000. This means for a system with 1-hour MTTR, MTBF must exceed 100,000 hours. Six nines (99.9999%) requires a ratio of 1,000,000.',
      },
      {
        question: 'Is MTBF the same as product lifetime?',
        answer: 'No. MTBF is the average time between failures for repairable systems, not the expected lifetime. A system with 10,000 hour MTBF does NOT mean it will last 10,000 hours without failure. It means the average time between failures is 10,000 hours — some units fail sooner, some later. In fact, at t = MTBF, only 36.8% of identical systems are still operating without a failure. For non-repairable systems, use MTTF (Mean Time To Failure) instead.',
      },
      {
        question: 'How does the bathtub curve affect MTBF calculations?',
        answer: 'The bathtub curve describes three failure periods: early life (infant mortality) where defects surface, normal life where failures are random and MTBF is most applicable, and wear-out where failure rates increase. MTBF calculations are most meaningful during the normal life period. Burn-in testing helps weed out infant mortality before field deployment. For systems in the wear-out phase, the exponential reliability model (constant failure rate) no longer applies, and Weibull analysis is more appropriate.',
      },
      {
        question: 'What assumptions does the exponential reliability model make?',
        answer: 'The exponential model (R = e^(-λt)) assumes: (1) failures are random and independent — a failure in one unit does not affect others; (2) the failure rate λ is constant over time — the system is not degrading or improving; (3) the system is repairable — after repair, it is returned to "as good as new" condition; (4) failures follow a Poisson process. These assumptions are reasonable for complex electronic systems in their useful life phase, but break down during early-life (infant mortality) and wear-out periods. For mechanical systems with wear, the Weibull distribution (with shape parameter > 1) is often more appropriate.',
      },
      {
        question: 'How does redundancy improve system reliability?',
        answer: 'Redundancy dramatically improves reliability. For N identical parallel redundant components (any one can do the job): system reliability = 1 - (1 - R_single)^N. Example: a single server has R(1yr) = 90% (unreliability = 10%). Adding a redundant server (N=2): system R(1yr) = 1 - (0.10)^2 = 99%. With N=3: R = 99.9%. This is also why dual redundant aircraft systems (engines, hydraulics, avionics) achieve extremely high effective MTBF. However, this is for ACTIVE parallel redundancy — standby redundancy (where the spare only activates on failure) requires different calculations accounting for the switchover mechanism\'s reliability.',
      },
      {
        question: 'How do I use MTBF to plan spare parts inventory?',
        answer: 'Use the "Expected Failures" mode: expected failures = operating time / MTBF. For a fleet of 100 pumps, each with MTBF of 25,000 hours, operating 8,760 hours/year: expected failures per year = 100 x 8,760 / 25,000 = 35.04. So you would expect roughly 35 failures per year. For inventory planning, you typically stock 1.5-2x the expected number of failures as safety stock, accounting for lead time variability. Enter your fleet operating hours and known MTBF to get the expected failure count, then multiply by your lead-time safety factor.',
      },
      {
        question: 'Why do some manufacturers quote absurdly high MTBF numbers like 1,000,000 hours?',
        answer: 'MTBF numbers above 100,000 hours (11.4 years) are common in datasheets. A 1,000,000 hour MTBF (114 years) seems impossible to verify — and it is. These numbers come from accelerated life testing (testing at elevated temperatures, voltages, or stresses to compress time) combined with reliability prediction standards like MIL-HDBK-217 or Telcordia SR-332. They are statistical predictions, not empirical measurements. They assume the device operates in its "useful life" phase with no wear-out. A fan bearing with a 50,000-hour lifetime would dominate system reliability even if the electronics have 1,000,000-hour MTBF. Always check: does the MTBF number include mechanical components? What confidence level was used? What environmental assumptions (temperature, humidity, vibration)? A "1M-hour MTBF at 25C" power supply may drop to 200K hours at 55C inside a rack.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A data center operations team has logged 240,000 cumulative operating hours across 50 servers over the past year, during which they experienced 8 unplanned hardware failures. They need to know the MTBF and the probability of at least one failure in any given month (730 hours).',
        inputs: { mode: 'mtbf', operatingHours: '240000', numberOfFailures: '8', mtbf: '', missionTime: '' },
        result: 'MTBF = 240,000 / 8 = 30,000 hours. Failure rate λ = 1/30,000 = 0.0000333 failures/hour. Reliability over 1 month (730 hours) = e^(-730/30,000) x 100 = 97.6%. Probability of at least one failure in a month = 2.4%.',
        insight: 'With an MTBF of 30,000 hours, these servers have a solid but not exceptional reliability profile. Over a month, there is a 2.4% chance of at least one failure — which means roughly every 41 months (3.4 years), the data center should expect a server failure. This is within normal expectations for commodity server hardware. The team should maintain at least N+1 redundancy and keep cold spares for the most failure-prone components (power supplies, disks, fans).',
      },
      {
        scenario: 'An aerospace manufacturer is evaluating two avionics computers for a new aircraft. Computer A has published MTBF of 120,000 hours. Computer B has MTBF of 80,000 hours but is 40% cheaper. The mission time for a long-haul flight is 14 hours. The aircraft will fly approximately 4,000 hours per year. Which computer is the better value over the aircraft\'s 25-year service life?',
        inputs: { mode: 'reliability', operatingHours: '', numberOfFailures: '', mtbf: '120000', missionTime: '14' },
        result: 'Computer A: R(14 hrs) = e^(-14/120,000) x 100 = 99.98833%. Computer B: R(14 hrs) = e^(-14/80,000) x 100 = 99.98250%. Difference per flight: 0.00583 percentage points. Over 25 years x 4,000 hrs/yr = 100,000 fleet hours, expected failures: A = 100,000/120,000 = 0.83, B = 100,000/80,000 = 1.25.',
        insight: 'The per-flight reliability difference between 99.988% and 99.983% seems tiny, but it compounds over the fleet life. Computer A expects 0.83 failures vs 1.25 for B over the service life — about 0.42 fewer failures. If each in-flight avionics failure costs $500,000 in investigation, downtime, and reputation, the expected savings from choosing A is $210,000 per aircraft. This far exceeds the price difference, making Computer A the better value despite the higher unit cost. This analysis demonstrates why aerospace companies obsess over MTBF — even seemingly small differences have enormous fleet-level cost implications.',
      },
      {
        scenario: 'A factory maintenance manager wants to know how many spare pump motors to stock. The plant has 20 identical pumps running 24/7 (8,760 hrs/yr each). Each pump motor has an MTBF of 40,000 hours. Lead time for replacement motors is 4 weeks (672 hours). The manager wants to avoid stockouts 95% of the time.',
        inputs: { mode: 'failures', operatingHours: '', numberOfFailures: '', mtbf: '40000', missionTime: '175200' },
        result: 'Expected failures per year = 20 x 8,760 / 40,000 = 4.38 failures/year. During the 4-week lead time (672 hrs), expected failures = 20 x 672 / 40,000 = 0.336. For 95% confidence during lead time, using the Poisson distribution: P(X <= k) >= 0.95 when k = 1 (since P(X <= 1) for λ = 0.336 equals approximately 0.958). Recommended spares: 1.',
        insight: 'The Poisson distribution (not this calculator, which gives expected values only) tells us that even with 0.336 expected failures during lead time, stocking 1 spare gives 95.8% protection against stockouts during the procurement period. For the full year at 4.38 expected failures, the recommended annual safety stock would be about 7 motors (expected 4.38 + 2 standard deviations of roughly 2.1). The maintenance manager should also consider that these pumps might share a common failure mode (voltage spike, contamination), which violates the independence assumption and could cause clustered failures that the simple Poisson model would underestimate.',
      },
    ],
    proTips: [
      'MTBF is most useful for comparing similar products, not for predicting exact failure times. Two power supplies with MTBF of 100K and 50K hours: the 100K one will have roughly half the failure rate in a large population. But do NOT schedule maintenance based on MTBF — the exponential distribution means failures happen randomly, not "every 100K hours." Use condition-based maintenance instead of time-based maintenance for electronic systems.',
      'The exponential reliability model assumes a constant failure rate. This is valid for mature electronic systems in their useful life, but NOT for: mechanical wear components (bearings, seals), brand-new systems still in infant mortality, systems operating beyond their design life, or software systems where failures are often correlated. When in doubt, plot your failure data on Weibull probability paper — a Weibull shape parameter β = 1 confirms exponential is appropriate.',
      'When comparing vendor MTBF claims, ask: what standard was used (MIL-HDBK-217F vs Telcordia SR-332 vs field data)? What ambient temperature was assumed? At what confidence level (60% vs 90%)? What components were included (does the MTBF include the fan, or just the electronics)? Telcordia MTBF numbers are typically 2-5x higher than MIL-HDBK for the same product. Field-measured MTBF is usually the most conservative — and most trustworthy — number.',
      'For series systems (where ANY component failure brings down the system), the system failure rate equals the sum of individual failure rates: λ_system = λ1 + λ2 + ... + λn. This means the system MTBF is always LOWER than the lowest individual MTBF. A server with 10 components, each rated 500,000 hours MTBF, has a system MTBF of only 50,000 hours. This is the "series reliability penalty" — always calculate system-level MTBF, not component-level.',
      'Use the reliability mode with different mission times to understand your risk profile over time. A system with MTBF of 50,000 hours has 83.9% reliability at 1 year (8,760 hours), but only 41.7% at 5 years (43,800 hours). This steep drop-off illustrates why long warranties on electronic products are expensive for manufacturers — reliability decays exponentially, not linearly.',
    ],
    limitations: [
      'This calculator uses the exponential reliability model (constant failure rate), which assumes failures are random and independent. It is appropriate for electronic and complex repairable systems in their useful life phase, but NOT for systems exhibiting wear-out, infant mortality, or non-constant failure rates.',
      'Series/parallel system reliability combining multiple components requires separate reliability block diagram (RBD) analysis. The calculator handles only single-component or simple system-level reliability, not multi-component redundancy configurations.',
      'Confidence intervals are not provided. The calculator gives point estimates, but real MTBF should be reported with confidence bounds (e.g., "MTBF = 10,000 hours at 90% lower confidence level"). Accelerated life testing predictions and environmental stress factors are not modeled.',
      'Software reliability, preventive maintenance effects, common-cause failures, and time-varying operating conditions are not covered. For safety-critical applications, formal FMECA and Fault Tree Analysis are required in addition to MTBF calculations.',
      'This calculator is a starting point for reliability estimation, not a substitute for formal reliability engineering. Field data should be collected and analyzed with appropriate statistical methods.',
    ],
    citations: [
      { source: 'Wikipedia', title: 'Mean Time Between Failures', url: 'https://en.wikipedia.org/wiki/Mean_time_between_failures' },
      { source: 'Wolfram MathWorld', title: 'Reliability', url: 'https://en.wikipedia.org/wiki/Mean_time_between_failures' },
    ],
  },
};

export default mtbfConfig;
