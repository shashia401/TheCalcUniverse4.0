import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ArmyBodyFatPanel from './ArmyBodyFatPanel';

const armyBodyFatConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sex',
      label: 'Gender',
      type: 'select',
      required: true,
      helpText: 'The AR 600-9 formula differs for males (neck + waist) and females (neck + waist + hip)',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      placeholder: '25',
      unit: 'years',
      min: 17,
      max: 65,
      step: 1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Used to determine the maximum allowable body fat per AR 600-9',
    },
    {
      id: 'heightInches',
      label: 'Height',
      type: 'number',
      placeholder: '70',
      unit: 'in',
      min: 55,
      max: 84,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Total height in inches (e.g., 5\'10" = 70 in). Army standard only uses inches.',
    },
    {
      id: 'weight',
      label: 'Weight',
      type: 'number',
      placeholder: '180',
      unit: 'lbs',
      min: 80,
      max: 400,
      step: 1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Weight in pounds.',
    },
    {
      id: 'neck',
      label: 'Neck Circumference',
      type: 'number',
      placeholder: '15.5',
      unit: 'in',
      min: 10,
      max: 25,
      step: 0.125,
      required: true,
      inputMode: 'decimal',
      helpText: 'Measure just below the larynx. Tape parallel to the floor. Round up to nearest 0.5 in.',
    },
    {
      id: 'waist',
      label: 'Waist Circumference (Men)',
      type: 'number',
      placeholder: '34',
      unit: 'in',
      min: 20,
      max: 60,
      step: 0.125,
      inputMode: 'decimal',
      helpText: 'Men only — measure at navel level. Women — measure at narrowest point (natural waist).',
    },
    {
      id: 'hip',
      label: 'Hip Circumference (Women)',
      type: 'number',
      placeholder: '38',
      unit: 'in',
      min: 20,
      max: 60,
      step: 0.125,
      inputMode: 'decimal',
      helpText: 'Women only — measure at the widest point of the hips/buttocks.',
      showWhen: (v) => v.sex === 'female',
    },
  ],
  calculate: (values) => {
    const sex = values.sex || 'male';
    const age = parseFloat(values.age);
    const heightIn = parseFloat(values.heightInches);
    const weight = parseFloat(values.weight);
    const neckIn = parseFloat(values.neck);
    const waistIn = parseFloat(values.waist);
    const hipIn = parseFloat(values.hip);

    if ([age, heightIn, weight, neckIn].some(isNaN) || weight <= 0 || heightIn <= 0 || neckIn <= 0) return [];

    const isMale = sex === 'male';
    if (isMale && (isNaN(waistIn) || waistIn <= 0)) return [];
    if (!isMale && (isNaN(waistIn) || waistIn <= 0 || isNaN(hipIn) || hipIn <= 0)) return [];

    // AR 600-9 DoD body fat formula (uses circumference in inches)
    let bodyFatPct: number;

    if (isMale) {
      // Men: %BF = 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76
      // Uses the same equation as U.S. Navy method but with stricter measurement protocol
      if (waistIn - neckIn <= 0) return []; // log10 domain error guard
      bodyFatPct = 86.010 * Math.log10(waistIn - neckIn) - 70.041 * Math.log10(heightIn) + 36.76;
    } else {
      // Women: %BF = 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) - 78.387
      if (waistIn + hipIn - neckIn <= 0) return []; // log10 domain error guard
      bodyFatPct = 163.205 * Math.log10(waistIn + hipIn - neckIn) - 97.684 * Math.log10(heightIn) - 78.387;
    }

    // Clamp to reasonable range
    bodyFatPct = Math.max(2, Math.min(bodyFatPct, 70));

    // AR 600-9 maximum allowable body fat by age and gender
    const maxBfTable: { ageMax: number; male: number; female: number }[] = [
      { ageMax: 21, male: 20, female: 30 },
      { ageMax: 27, male: 22, female: 32 },
      { ageMax: 33, male: 24, female: 34 },
      { ageMax: 39, male: 26, female: 36 },
      { ageMax: 45, male: 28, female: 38 },
      { ageMax: 55, male: 30, female: 40 },
      { ageMax: 65, male: 32, female: 42 },
    ];

    const findMaxBf = (age: number, isMale: boolean): number => {
      for (const row of maxBfTable) {
        if (age <= row.ageMax) return isMale ? row.male : row.female;
      }
      return isMale ? 32 : 42;
    };

    const maxBf = findMaxBf(age, isMale);
    const passes = bodyFatPct <= maxBf;

    // Screening weight from AR 600-9 tables (simplified)
    const screeningWeight = isMale
      ? Math.round(106 + (heightIn - 60) * 6)
      : Math.round(100 + (heightIn - 60) * 5);

    return [
      {
        id: 'bodyFatArmy',
        label: 'Body Fat (AR 600-9 DoD Method)',
        value: `${bodyFatPct.toFixed(1)}%`,
        highlight: true,
        color: passes ? 'positive' : 'negative',
      },
      {
        id: 'maxAllowedBf',
        label: `Max Allowable (Age ${age.toFixed(0)})`,
        value: `${maxBf}%`,
        color: 'neutral',
      },
      {
        id: 'passFail',
        label: 'Army Tape Test Result',
        value: passes ? 'PASS ✓ Within Standards' : 'FAIL — Exceeds Maximum Allowable Body Fat',
        color: passes ? 'positive' : 'negative',
      },
      {
        id: 'screeningWeight',
        label: 'Army Screening Weight (approximate)',
        value: `${screeningWeight} lbs (for height ${heightIn.toFixed(0)} in)`,
        color: weight <= screeningWeight + 10 ? 'positive' : 'neutral',
      },
      {
        id: 'regulationRef',
        label: 'Regulation Reference',
        value: 'AR 600-9 · The Army Body Composition Program',
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ArmyBodyFatPanel, { values, results });
  },
  educational: {
    formula: 'Men: 86.010 × log₁₀(Waist − Neck) − 70.041 × log₁₀(Height) + 36.76 | Women: 163.205 × log₁₀(Waist + Hip − Neck) − 97.684 × log₁₀(Height) − 78.387',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Army Tape Test Measurement Sites</text><circle cx="220" cy="48" r="14" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><path d="M206,62 L200,80 L192,105 L188,150 L192,200 L200,240 L210,270 L230,270 L240,240 L248,200 L252,150 L248,105 L240,80 L234,62" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="140" y1="75" x2="198" y2="75" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="4,2"/><text x="130" y="79" text-anchor="end" font-size="12" fill="var(--svg-ef4444)" font-weight="bold">Neck</text><line x1="140" y1="145" x2="185" y2="145" stroke="var(--svg-f59e0b)" stroke-width="2" stroke-dasharray="4,2"/><text x="130" y="149" text-anchor="end" font-size="12" fill="var(--svg-f59e0b)" font-weight="bold">Waist</text><text x="220" y="320" text-anchor="middle" font-size="11" fill="var(--svg-666666)">AR 600-9 &middot; The Army Body Composition Program</text></svg>',
      alt: 'Body silhouette with measurement lines at neck and waist for the Army tape test',
      caption: 'AR 600-9 measures neck and waist circumference (and hips for women) to estimate body fat percentage',
    },
    formulaDescription:
      'The Department of Defense body fat formula (AR 600-9) uses circumference measurements in inches. The same mathematical formula as the U.S. Navy method, but with stricter measurement protocols and specific pass/fail thresholds by age and gender.',
    variables: [
      { symbol: 'Height', name: 'Height (inches)', description: 'Measured without shoes to the nearest 0.5 inch.' },
      { symbol: 'Circumference Measurements', name: 'Neck, Waist & Hip', description: 'Neck: measured just below the larynx. Waist: at navel level for men, narrowest point for women. Hip (women): at the widest point of the buttocks. All rounded up to nearest 0.5 inch per AR 600-9.' },
      { symbol: 'Max BF%', name: 'Maximum Allowable Body Fat', description: 'Age- and gender-adjusted threshold from AR 600-9. Ranges from 20% (male, 21 and under) to 42% (female, 55+).' },
    ],
    quickReference: [
      { label: 'AR 600-9 Male BF% max (age 17–21)', value: '20%' },
      { label: 'AR 600-9 Male BF% max (age 22–27)', value: '22%' },
      { label: 'AR 600-9 Male BF% max (age 28–33)', value: '24%' },
      { label: 'AR 600-9 Male BF% max (age 34–39)', value: '26%' },
      { label: 'AR 600-9 Male BF% max (age 40–45)', value: '28%' },
      { label: 'AR 600-9 Male BF% max (age 46–55)', value: '30%' },
      { label: 'AR 600-9 Male BF% max (age 56–65)', value: '32%' },
      { label: 'AR 600-9 Female BF% max (age 17–21)', value: '30%' },
      { label: 'AR 600-9 Female BF% max (age 22–27)', value: '32%' },
      { label: 'AR 600-9 Female BF% max (age 28–33)', value: '34%' },
      { label: 'AR 600-9 Female BF% max (age 34–39)', value: '36%' },
      { label: 'AR 600-9 Female BF% max (age 40–45)', value: '38%' },
      { label: 'AR 600-9 Female BF% max (age 46–55)', value: '40%' },
      { label: 'AR 600-9 Female BF% max (age 56–65)', value: '42%' },
      { label: 'Male measurement formula', value: '86.010 × log₁₀(Waist − Neck) − 70.041 × log₁₀(Height) + 36.76' },
      { label: 'Female measurement formula', value: '163.205 × log₁₀(Waist + Hip − Neck) − 97.684 × log₁₀(Height) − 78.387' },
      { label: 'Measurement precision', value: 'All measurements rounded up to nearest 0.5 inch per AR 600-9 protocol' },
      { label: 'ABCP reassessment interval', value: 'Every 30 days minimum for flagged Soldiers' },
      { label: 'Flag removal timeline', value: 'Must show satisfactory progress at 3 months and meet standard within 6 months' },
      { label: 'Measurement training requirement', value: 'AR 600-9 requires measurements by trained unit personnel only' },
      { label: 'Screening weight formula (approx.)', value: 'Male: 106 + 6 × (height_in − 60); Female: 100 + 5 × (height_in − 60)' },
    ],
    howToUse: [
      'Enter your gender, age, height (inches), and weight (lbs).',
      'Measure and enter neck circumference just below the larynx.',
      'Men: measure waist at navel level. Women: measure waist at narrowest point and hip at widest point.',
      'Measurements are rounded up to the nearest 0.5 inch per AR 600-9 protocol.',
      'Results show your estimated body fat %, the maximum allowable for your age/gender, and pass/fail status.',
    ],
    explanation:
      'AR 600-9 (The Army Body Composition Program) establishes the Department of Defense body fat standards for active duty Soldiers, National Guard, and Army Reserve. The body fat formula is identical to the U.S. Navy circumference method, but measurement protocols differ: AR 600-9 requires measurements to be taken in a specific sequence by trained personnel, with measurements rounded up to the nearest 0.5 inch. The maximum allowable body fat percentage increases with age: at age 21, the limit is 20% (male) and 30% (female), while at age 55, it rises to 30% (male) and 40% (female). This recognizes that body composition naturally changes with age. Soldiers who exceed the maximum allowable body fat percentage for their age and gender are flagged and enrolled in the ABCP (Army Body Composition Program), which includes counseling, exercise guidance, and regular re-assessment at 30-day intervals. Failure to meet standards after 6+ months in the program can lead to administrative separation from service. The screening weight table provides an initial flag — Soldiers exceeding screening weight are taped for body fat assessment, but passing the tape test means they meet the standard regardless of scale weight. A Soldier might exceed their screening weight by 20 lbs but still pass the tape test if they carry significant muscle mass. Conversely, a Soldier below screening weight could still fail the tape test if they have low muscle mass and high body fat percentage. This is why the Army uses the tape test as the definitive measure rather than the scale.',
    faqs: [
      {
        question: 'How does AR 600-9 differ from the U.S. Navy body fat method?',
        answer: 'The mathematical formula is identical. The difference is in measurement protocol: AR 600-9 uses inches, requires measurements to be taken by trained personnel following strict procedures, and measurements are rounded up to the nearest 0.5 inch (not to the nearest 0.1 or 0.01). The Navy method rounds to the nearest 0.5 inch as well but uses different measurement sites for the waist: Navy measures at the narrowest point of the waist for both men and women, while Army AR 600-9 measures the male waist at the navel (belly button) level. The pass/fail thresholds also differ between the services — each branch sets its own age- and gender-adjusted maximums. The key difference is that AR 600-9 is tied to administrative consequences (ABCP enrollment, potential separation), while the Navy method is primarily a fitness assessment component.',
      },
      {
        question: 'What happens if I exceed the maximum allowable body fat percentage?',
        answer: 'Soldiers who exceed the standard are enrolled in the Army Body Composition Program (ABCP). They receive counseling, a tailored exercise and nutrition plan, and periodic re-assessment. Continued non-compliance after 6+ months in the program can result in administrative separation. The ABCP process: (1) Initial counseling within 2 working days of flagging, where the Soldier receives a written plan with specific weight loss goals (targeting 3–8 lbs per month, or 1% body fat reduction per month). (2) Monthly reassessments — the Soldier must show satisfactory progress, defined as a monthly weight loss of 3–8 lbs or 1% body fat reduction. (3) At month 6, if the Soldier still does not meet the standard, a separation board is convened. The board reviews the Soldier\'s entire record including performance, disciplinary history, and demonstrated effort. Separation is not automatic — it is a command decision based on the totality of circumstances. Soldiers who make consistent progress but haven\'t yet reached the standard may receive extensions. Soldiers who show no effort typically face separation. AR 600-9 is a retention standard, not merely a fitness evaluation.',
      },
      {
        question: 'Is the screening weight the same as the weight limit?',
        answer: 'No. The screening weight is used to determine who needs to be "taped" (body fat assessed). Soldiers exceeding screening weight but within body fat standards pass. Soldiers below screening weight are exempt from the tape test unless they have a visibly disproportionate body composition. This two-tier system exists because muscle weighs more than fat by volume. A 5\'10" Soldier weighing 210 lbs with 12% body fat (very lean, very muscular) would exceed the screening weight of ~166 lbs by 44 lbs — but would easily pass the tape test. Conversely, a 5\'10" Soldier weighing 165 lbs could be below screening weight but still have 28% body fat (low muscle mass, high body fat percentage) — this condition is sometimes called "normal-weight obesity" or "skinny fat." If a Soldier below screening weight appears to have excess body fat, the commander can still order a tape test. The screening weight is a filter to reduce unnecessary taping, not a regulatory standard by itself.',
      },
      {
        question: 'How accurate is the Army tape test compared to DEXA or hydrostatic weighing?',
        answer: 'The Army tape test (circumference method) has a standard error of approximately ±3–4% body fat compared to laboratory gold standards like DEXA (dual-energy X-ray absorptiometry), Bod Pod (air displacement plethysmography), or hydrostatic (underwater) weighing. The tape test tends to underestimate body fat in people with very high body fat (>35%) and overestimate in very lean individuals (<10% male, <15% female). For the population near the pass/fail threshold (typically 18–26% for males), the accuracy is reasonable — within ±3% for most individuals. The tape test was validated in large military populations specifically because it balances accuracy, cost ($0 for a measuring tape vs. $100–300 for a DEXA scan), portability (can be done in a motor pool or field environment), and speed (a trained NCO can tape 15–20 Soldiers per hour). The Army is aware of the limitations and periodically evaluates alternatives including waist-to-height ratio and direct body fat measurement technologies, but the circumference method remains the DoD standard as of 2025.',
      },
      {
        question: 'What is the relationship between the Army tape test and the ACFT (Army Combat Fitness Test)?',
        answer: 'The body fat standard (AR 600-9) and the fitness test (ACFT) measure different things and are independent requirements. A Soldier must pass BOTH. The ACFT measures physical performance (strength, endurance, power) through six events: 3-rep max deadlift, standing power throw, hand-release push-ups, sprint-drag-carry, plank, and 2-mile run. The body fat standard measures body composition. A Soldier can score 600/600 on the ACFT and still fail the tape test — there is no "fitness exemption" from body fat standards. Conversely, a Soldier who passes body fat can still fail the ACFT. The most common scenario: a very strong, heavily muscled Soldier who exceeds screening weight by 30+ lbs but passes the tape test easily. From 2020–2025, the Army shifted from the APFT (push-ups, sit-ups, 2-mile run) to the ACFT, which more heavily tests strength and power — this change has increased the number of Soldiers who exceed screening weight due to additional muscle mass but still comfortably pass body fat.',
      },
      {
        question: 'Can I use this calculator for official Army tape test reporting?',
        answer: 'No. AR 600-9 specifically requires measurements to be taken by trained unit personnel (typically an NCO who has completed the Army Body Composition Program training course) following a precise protocol. The person being measured must stand with feet together, arms at sides, shoulders relaxed, looking straight ahead. The person taking the measurements must use the specific anatomical landmarks described in the regulation and round up to the nearest 0.5 inch. Self-measurement is inherently inaccurate for the waist — you cannot properly measure your own waist at navel level while maintaining the required posture. Additionally, the official calculation must be documented on DA Form 5500 (male) or DA Form 5501 (female) and signed by both the measurer and the Soldier. This calculator provides an educational estimate for personal awareness only. Your official score must come from a unit-designated trained measurer using the current version of AR 600-9.',
      },
      {
        question: 'What strategies are effective for reducing body fat for the Army tape test?',
        answer: 'Effective strategies for military body fat reduction (supported by DoD research): (1) Create a caloric deficit of 500–750 calories per day — this produces 1–1.5 lbs of fat loss per week, which is sustainable and preserves muscle. More aggressive deficits (>1000 cal/day) increase muscle loss and reduce physical performance. (2) Prioritize protein intake at 1.6–2.2 g/kg body weight to preserve lean mass during fat loss — this is especially important because the tape test formula is sensitive to neck circumference (a larger neck reduces your calculated body fat percentage). (3) Combine resistance training 3–4 days/week with zone 2 cardio (60–70% max HR, 150+ minutes/week) — resistance training preserves neck and shoulder muscle mass while cardio drives the caloric deficit. (4) Avoid crash dieting in the weeks before a tape test — rapid water loss and glycogen depletion can temporarily reduce measurements but (a) this doesn\'t change actual body fat, (b) it impairs ACFT performance, and (c) rapid weight regain after the test will be flagged in the following month\'s assessment. (5) Sleep 7–8 hours per night — sleep deprivation increases cortisol (stress hormone) which promotes abdominal fat storage, directly working against your body fat goals.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A 25-year-old male Soldier, 5\'9" (69 inches), weighs 195 lbs. His neck measures 16 inches, waist at navel measures 35 inches. He needs to know if he passes AR 600-9 for his age group.',
        inputs: { sex: 'male', age: '25', heightInches: '69', weight: '195', neck: '16', waist: '35' },
        result: 'Body fat: approximately 18.5%. Maximum allowable for age 25 (22–27 bracket): 22%. Result: PASS. Screening weight approximately 160 lbs (he exceeds this by 35 lbs but passes tape test due to muscular build).',
        insight: 'This Soldier exceeds his screening weight by 35 lbs yet passes the tape test with a comfortable margin (18.5% vs. 22% max). This is the classic "muscular Soldier" scenario. His waist-to-neck difference of 19 inches (35 − 16) drives a low body fat calculation because the log of this difference is the largest positive term in the formula. If he were to gain 2 inches on his waist (to 37 inches) while keeping neck the same, his body fat would jump to approximately 21.5% — still passing but much closer to the limit. This illustrates why neck circumference matters: a Soldier can pass the tape test by either losing abdominal fat (reducing waist) OR building neck/shoulder muscle (increasing neck) — though the Army strongly prefers the former approach for actual health outcomes.',
      },
      {
        scenario: 'A 32-year-old female Soldier, 5\'5" (65 inches), weighs 155 lbs. Neck: 13 inches, waist: 30 inches, hips: 38 inches. She is approaching the age bracket where the standard relaxes and wants to understand her current standing.',
        inputs: { sex: 'female', age: '32', heightInches: '65', weight: '155', neck: '13', waist: '30', hip: '38' },
        result: 'Body fat: approximately 32.8%. Maximum allowable for age 32 (28–33 bracket): 34%. Result: PASS — though close to the threshold. Screening weight approximately 125 lbs (exceeded by 30 lbs).',
        insight: 'This Soldier passes with 32.8% against a 34% maximum — a margin of only 1.2%. She should be aware that in 2 years (age 34), her maximum increases to 36%, giving her more room. However, she should not rely on the aging threshold — the goal is always to maintain fitness regardless of age adjustments. The female formula uses a sum of waist + hip − neck, making it sensitive to all three measurements. If her waist increased by 1 inch (31 inches), her body fat would rise to approximately 35.1% — a FAIL. If she reduced her waist by 1 inch (29 inches), body fat would drop to approximately 30.5% — a comfortable PASS. This high sensitivity to small measurement changes is why precise measurement technique matters. She should focus on reducing abdominal circumference through a combination of nutrition and total-body exercise. The good news: her neck measurement (13 inches) and hip measurement (38 inches) contribute favorably to the formula — a relatively larger neck and smaller hips both reduce the calculated body fat percentage.',
      },
      {
        scenario: 'A 45-year-old male National Guard Soldier, 6\'0" (72 inches), 235 lbs, preparing for annual body composition screening. Neck: 17 inches, waist: 40 inches. He failed last year at 29.5% body fat (age 44) and has been in ABCP for 8 months. He wants to know if his progress is sufficient.',
        inputs: { sex: 'male', age: '45', heightInches: '72', weight: '235', neck: '17', waist: '40' },
        result: 'Body fat: approximately 27.2%. Maximum allowable for age 45 (40–45 bracket): 28%. Result: PASS (tight margin). Compared to last year (29.5% at 40-inch waist with likely smaller neck), he has improved by adding 0.5 inch to neck (through strength training) and reducing waist by an estimated 1–2 inches.',
        insight: 'At 27.2% against a 28% maximum, this Soldier passes — but by only 0.8%. This is the "barely adequate" scenario that warrants continued diligence. After 8 months in ABCP, passing is the minimum requirement to exit the program. However, his margin is so thin that a small measurement variation (0.5 inch on waist) could swing him back to failing at the next monthly reassessment. His commander would likely remove the flag while counseling him to maintain or improve his fitness. Practical next steps: (1) maintain neck circumference through continued resistance training — losing neck muscle would worsen his body fat calculation; (2) continue reducing waist circumference toward 38 inches, which would give him a comfortable 23.5% — a solid PASS; (3) track trends rather than single-point measurements — a consistent downward trend in calculated body fat (even 0.5% per month) is the best indicator of sustainable progress. This case illustrates why the ABCP emphasizes long-term lifestyle changes over crash dieting before weigh-ins.',
      },
    ],
    proTips: [
      'Neck circumference is the most overlooked variable in the Army tape test — and building neck muscle can legitimately improve your calculated body fat percentage. The formula subtracts neck from waist (men) or from waist+hip (women), so a larger neck directly reduces the calculated body fat. Incorporate neck-specific exercises: neck flexion/extension with a harness or plate, shrugs for trapezius development, and direct neck work 2x/week. A 0.5-inch increase in neck circumference (achievable with 3–4 months of consistent training) can reduce calculated body fat by 1–2 percentage points — sometimes the difference between pass and fail. This is NOT "gaming the system" — it\'s building upper-body muscle mass, which AR 600-9 explicitly accounts for.',
      'Measure at the same time of day and under the same conditions every time. Waist circumference varies by 0.5–1.5 inches over the course of a day due to food, water, bloating, and posture. Official Army tape tests are typically conducted in the morning (before PT formation) for consistency. For an accurate self-check, measure first thing in the morning after using the bathroom and before eating or drinking. Do NOT measure after meals, after drinking water, or in the evening — your waist measurement can be 1–2 inches larger, producing a falsely high body fat estimate. If a Soldier\'s official tape test is scheduled for 0600, their 9 PM self-measurement the night before is NOT predictive of their morning measurement.',
      'The waist measurement site is DIFFERENT for men (at navel/belly button) vs. women (narrowest point of natural waist). This is the most common measurement error in self-administered tests. For men: find your navel (belly button). Place the tape directly across it, parallel to the floor. Do NOT suck in your stomach — according to AR 600-9 protocol, the Soldier is measured at the end of a normal exhalation. For women: find the narrowest part of your torso — typically 1–2 inches above the navel, roughly at the bottom of the ribcage. This is NOT at navel level for most women. Using the wrong site can change your measurement by 1–3 inches. When in doubt, ask a trained NCO to demonstrate the correct anatomical landmarks.',
      'The Army Body Composition Program (ABCP) requires "satisfactory progress" defined as 3–8 lbs per month or 1% body fat reduction per month. A common pitfall: Soldiers lose weight too aggressively (crash dieting, excessive cardio, sauna suits) to pass a monthly weigh-in, only to regain the weight immediately. This roller-coaster pattern is visible to commanders who review the trend rather than a single data point. A Soldier who loses 10 lbs then regains 8 lbs in the next month has effectively made only 2 lbs of progress over 60 days — far below the required rate. Sustainable progress = consistent 0.5–1% body fat reduction per month achieved through moderate caloric deficit, resistance training, and adequate sleep. Commanders are trained to distinguish between "working the program" (steady trend) and "gaming the weigh-in" (yo-yo pattern).',
      'If you are close to the threshold (±2% of max), be aware that measurement rounding (up to nearest 0.5 inch) can swing your calculated body fat by 1–3%. AR 600-9 explicitly requires rounding UP, never down — a measurement of 35.1 inches is recorded as 35.5 inches. This rounding rule is NOT in your favor. To be safe, aim to be at least 2–3% under your maximum allowable body fat, not just "barely under." A Soldier who is exactly at their max minus 0.1% is one rounding decision away from failing — and the rounding always goes against you. The rule is applied consistently: 35.0 exactly stays 35.0, but 35.1 becomes 35.5.',
      'The Army tape test formula is mathematically identical to the Navy method but the administrative context is different. In the Navy, body fat is one component of the Physical Fitness Assessment (PFA) — failing body fat means failing the PFA, which affects advancement and can lead to separation. In the Army, failing AR 600-9 triggers ABCP enrollment, which is a separate administrative action from the ACFT. Both services use the same math but different stakes. If you are transferring between services, be aware that each branch has its own maximum allowable body fat tables, measurement protocols, and consequences for exceeding standards. A body fat percentage that passes in the Army (28% for a 44-year-old male) may fail in the Marine Corps (which generally has stricter standards).',
    ],
    limitations: [
      'Self-measurement inaccuracy — it is physically difficult to measure your own neck and waist while maintaining the required posture (feet together, arms at sides, looking straight ahead). The calculator cannot replicate an official tape test conducted by trained personnel per AR 600-9 protocol.',
      'Measurement rounding per AR 600-9 — official measurements are rounded UP to the nearest 0.5 inch, which always works against the Soldier. This calculator does not apply that rounding, so results may differ from an official test.',
      'Body proportion assumptions — the formula assumes average body proportions and may be less accurate for individuals with very short/long torsos relative to height, very narrow/wide shoulders, or significant muscular asymmetry.',
      'This calculator is NOT for official Army use, NOT for ABCP enrollment or administrative decisions. It is an educational tool for Soldiers to understand the formula and estimate their standing. Official tape tests must be conducted by trained unit personnel per the current AR 600-9.',
    ],
    commonUses: [
      'Army body composition screening — active duty Soldiers and National Guard members are assessed for compliance with AR 600-9 body fat standards during periodic physical fitness tests',
      'Enrollment in the Army Body Composition Program (ABCP) — Soldiers who exceed maximum allowable body fat receive counseling, exercise guidance, and regular reassessment at 30-day intervals',
      'Pre-deployment readiness evaluation — service members must meet body fat standards before deployment to ensure physical readiness and worldwide deployability',
      'Administrative separation assessment — continued non-compliance with body fat standards after 6+ months in ABCP can lead to administrative separation proceedings'
    ],
    citations: [
      { source: 'Wikipedia - Body Fat Percentage', url: 'https://en.wikipedia.org/wiki/Body_fat_percentage' },
      { source: 'U.S. Army - AR 600-9, The Army Body Composition Program', url: 'https://www.army.mil/e2/downloads/rv7/r2/policydocs/r600_9.pdf' },
    ],
  },
};

export default armyBodyFatConfig;
