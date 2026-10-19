import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ArmyBodyFatPanel from './ArmyBodyFatPanel';
import { finiteSteps } from '../../../utils/explainGuard';

// AR 600-9 (28 June 2013), Appendix B, Table B-2: maximum allowable % body fat by age group.
const MAX_BF_TABLE: { ageMax: number; label: string; male: number; female: number }[] = [
  { ageMax: 20, label: '17–20', male: 20, female: 30 },
  { ageMax: 27, label: '21–27', male: 22, female: 32 },
  { ageMax: 39, label: '28–39', male: 24, female: 34 },
  { ageMax: Infinity, label: '40+', male: 26, female: 36 },
];

// AR 600-9 (28 June 2013), Table B-1 screening table weight (lb).
// Row = [height in, minimum weight, male max 17–20 / 21–27 / 28–39 / 40+, female max 17–20 / 21–27 / 28–39 / 40+].
// Male maxima are not listed below 60 in (0 here). Above 80 in: +6 lb/in (male), +5 lb/in (female).
const SCREENING_TABLE: number[][] = [
  [58, 91, 0, 0, 0, 0, 119, 121, 122, 124],
  [59, 94, 0, 0, 0, 0, 124, 125, 126, 128],
  [60, 97, 132, 136, 139, 141, 128, 129, 131, 133],
  [61, 100, 136, 140, 144, 146, 132, 134, 135, 137],
  [62, 104, 141, 144, 148, 150, 136, 138, 140, 142],
  [63, 107, 145, 149, 153, 155, 141, 143, 144, 146],
  [64, 110, 150, 154, 158, 160, 145, 147, 149, 151],
  [65, 114, 155, 159, 163, 165, 150, 152, 154, 156],
  [66, 117, 160, 163, 168, 170, 155, 156, 158, 161],
  [67, 121, 165, 169, 174, 176, 159, 161, 163, 166],
  [68, 125, 170, 174, 179, 181, 164, 166, 168, 171],
  [69, 128, 175, 179, 184, 186, 169, 171, 173, 176],
  [70, 132, 180, 185, 189, 192, 174, 176, 178, 181],
  [71, 136, 185, 189, 194, 197, 179, 181, 183, 186],
  [72, 140, 190, 195, 200, 203, 184, 186, 188, 191],
  [73, 144, 195, 200, 205, 208, 189, 191, 194, 197],
  [74, 148, 201, 206, 211, 214, 194, 197, 199, 202],
  [75, 152, 206, 212, 217, 220, 200, 202, 204, 208],
  [76, 156, 212, 217, 223, 226, 205, 207, 210, 213],
  [77, 160, 218, 223, 229, 232, 210, 213, 215, 219],
  [78, 164, 223, 229, 235, 238, 216, 218, 221, 225],
  [79, 168, 229, 235, 241, 244, 221, 224, 227, 230],
  [80, 173, 234, 240, 247, 250, 227, 230, 233, 236],
];

// AR 600-9 Appendix B rounding rules: neck rounds UP, abdomen/waist/hip round DOWN, to the nearest 1/2 in.
const roundUpHalf = (x: number): number => Math.ceil(x * 2) / 2;
const roundDownHalf = (x: number): number => Math.floor(x * 2) / 2;

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
      min: 58,
      max: 84,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Total height in inches (e.g., 5\'10" = 70 in). The AR 600-9 tables start at 58 in. Rounded to the nearest 0.5 in for the body fat equation.',
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
      helpText: 'Measure just below the larynx. Enter the raw tape reading — AR 600-9 rounding (neck UP to the nearest 0.5 in) is applied for you.',
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
      helpText: 'Men: abdomen at navel level. Women: natural waist at the narrowest point. Enter the raw tape reading — AR 600-9 rounding (DOWN to the nearest 0.5 in) is applied for you.',
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
      helpText: 'Women only — measure at the widest point of the hips/buttocks. AR 600-9 rounding (DOWN to the nearest 0.5 in) is applied for you.',
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

    // AR 600-9 Appendix B rounding: neck UP, abdomen/waist/hip DOWN to the nearest 1/2 in;
    // height to the nearest 1/2 in for the body fat equation (whole inch for the screening table).
    const neck = roundUpHalf(neckIn);
    const waist = roundDownHalf(waistIn);
    const hip = roundDownHalf(hipIn);
    const height = Math.round(heightIn * 2) / 2;

    // AR 600-9 / DoD (Hodgdon & Beckett) body fat equations, all measurements in inches
    let rawPct: number;
    if (isMale) {
      // Men: %BF = 86.010 × log10(abdomen − neck) − 70.041 × log10(height) + 36.76
      if (waist - neck <= 0) return []; // log10 domain error guard
      rawPct = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
    } else {
      // Women: %BF = 163.205 × log10(waist + hip − neck) − 97.684 × log10(height) − 78.387
      if (waist + hip - neck <= 0) return []; // log10 domain error guard
      rawPct = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
    }

    // Clamp to reasonable range
    const bodyFatPct = Math.max(2, Math.min(rawPct, 70));
    // Table B-5: the official percent body fat is rounded to the nearest whole % and is what is
    // compared with the Table B-2 maximum.
    const officialPct = Math.round(bodyFatPct);

    const ageBracket = MAX_BF_TABLE.find((row) => Math.floor(age) <= row.ageMax) ?? MAX_BF_TABLE[MAX_BF_TABLE.length - 1];
    const maxBf = isMale ? ageBracket.male : ageBracket.female;
    const passes = officialPct <= maxBf;

    // Screening table weight (Table B-1): height rounded to the nearest whole inch.
    const screenHeight = Math.round(heightIn);
    const ageCol = MAX_BF_TABLE.indexOf(ageBracket);
    let screeningText: string;
    let screeningMax = 0;
    if (screenHeight <= 80) {
      const row = SCREENING_TABLE.find((r) => r[0] === Math.max(58, screenHeight))!;
      screeningMax = row[(isMale ? 2 : 6) + ageCol];
      screeningText = screeningMax > 0
        ? `${screeningMax} lbs max · ${row[1]} lbs min (height ${screenHeight} in, age ${ageBracket.label})`
        : 'No male screening weight is listed below 60 in in AR 600-9';
    } else {
      const last = SCREENING_TABLE[SCREENING_TABLE.length - 1];
      screeningMax = last[(isMale ? 2 : 6) + ageCol] + (screenHeight - 80) * (isMale ? 6 : 5);
      screeningText = `${screeningMax} lbs max (height ${screenHeight} in, age ${ageBracket.label}; +${isMale ? 6 : 5} lb per inch over 80 in)`;
    }

    return [
      {
        id: 'bodyFatArmy',
        label: 'Body Fat (AR 600-9 DoD Method)',
        value: `${bodyFatPct.toFixed(1)}%`,
        highlight: true,
        color: passes ? 'positive' : 'negative',
      },
      {
        id: 'officialBodyFat',
        label: 'Official Value (whole %, used for pass/fail)',
        value: `${officialPct}%`,
        color: 'neutral',
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
        label: 'Army Screening Weight (AR 600-9 Table B-1)',
        value: screeningText,
        color: screeningMax > 0 && weight <= screeningMax ? 'positive' : 'neutral',
      },
      {
        id: 'regulationRef',
        label: 'Regulation Reference',
        value: 'AR 600-9 · The Army Body Composition Program',
        color: 'neutral',
      },
    ];
  },
  explainSteps: (values) => {
    const results = armyBodyFatConfig.calculate(values);
    if (!results.length) return [];
    const val = (id: string) => results.find((x) => x.id === id)?.value ?? '';
    const isMale = (values.sex || 'male') === 'male';
    const age = parseFloat(values.age);
    const heightIn = parseFloat(values.heightInches);
    const neckIn = parseFloat(values.neck);
    const waistIn = parseFloat(values.waist);
    const hipIn = parseFloat(values.hip);
    const neck = roundUpHalf(neckIn);
    const waist = roundDownHalf(waistIn);
    const hip = roundDownHalf(hipIn);
    const height = Math.round(heightIn * 2) / 2;
    const pct = parseFloat(val('bodyFatArmy'));
    const circ = isMale ? waist - neck : waist + hip - neck;
    const l1 = Math.log10(circ);
    const l2 = Math.log10(height);
    const rawPct = isMale ? 86.01 * l1 - 70.041 * l2 + 36.76 : 163.205 * l1 - 97.684 * l2 - 78.387;
    const clamped = Math.abs(rawPct - pct) > 0.05 ? ` → limited to ${val('bodyFatArmy')} (results are kept between 2% and 70%)` : '';

    return finiteSteps([
      {
        label: 'Round the measurements the Army way',
        expr: `neck ${neckIn} → ${neck} in (up) · ${isMale ? 'abdomen' : 'waist'} ${waistIn} → ${waist} in (down)${isMale ? '' : ` · hip ${hipIn} → ${hip} in (down)`} · height ${heightIn} → ${height} in`,
        note: 'AR 600-9 rounds the neck up and the abdomen, waist and hip down to the nearest half inch.',
      },
      {
        label: 'Take the logarithms',
        expr: isMale
          ? `log10(${waist} − ${neck}) = log10(${circ}) = ${l1.toFixed(4)} · log10(${height}) = ${l2.toFixed(4)}`
          : `log10(${waist} + ${hip} − ${neck}) = log10(${circ}) = ${l1.toFixed(4)} · log10(${height}) = ${l2.toFixed(4)}`,
      },
      {
        label: `Substitute into the ${isMale ? 'male' : 'female'} equation`,
        expr: isMale
          ? `86.010 × ${l1.toFixed(4)} − 70.041 × ${l2.toFixed(4)} + 36.76 = ${rawPct.toFixed(1)}%${clamped}`
          : `163.205 × ${l1.toFixed(4)} − 97.684 × ${l2.toFixed(4)} − 78.387 = ${rawPct.toFixed(1)}%${clamped}`,
      },
      {
        label: 'Round to a whole percent and compare',
        expr: `${val('bodyFatArmy')} → ${val('officialBodyFat')} official · maximum for age ${age.toFixed(0)} = ${val('maxAllowedBf')} → ${val('passFail')}`,
        note: 'The official whole-percent value is what the calculator compares with the AR 600-9 maximum for your age group.',
      },
    ]);
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ArmyBodyFatPanel, { values, results });
  },
  educational: {
    formula: 'Men: 86.010 × log₁₀(Waist − Neck) − 70.041 × log₁₀(Height) + 36.76 | Women: 163.205 × log₁₀(Waist + Hip − Neck) − 97.684 × log₁₀(Height) − 78.387',
    formulaSource: 'AR 600-9, The Army Body Composition Program (28 June 2013), Appendix B — Table B-1 (screening table weight), Table B-2 (maximum allowable percent body fat) and Table B-5 (the body fat equations and worked samples). The equations originate from Hodgdon & Beckett (Naval Health Research Center, 1984).',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Army Tape Test Measurement Sites</text><circle cx="220" cy="48" r="14" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><path d="M206,62 L200,80 L192,105 L188,150 L192,200 L200,240 L210,270 L230,270 L240,240 L248,200 L252,150 L248,105 L240,80 L234,62" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="140" y1="75" x2="198" y2="75" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="4,2"/><text x="130" y="79" text-anchor="end" font-size="12" fill="var(--svg-ef4444)" font-weight="bold">Neck</text><line x1="140" y1="145" x2="185" y2="145" stroke="var(--svg-f59e0b)" stroke-width="2" stroke-dasharray="4,2"/><text x="130" y="149" text-anchor="end" font-size="12" fill="var(--svg-f59e0b)" font-weight="bold">Waist</text><text x="220" y="320" text-anchor="middle" font-size="11" fill="var(--svg-666666)">AR 600-9 &middot; The Army Body Composition Program</text></svg>',
      alt: 'Body silhouette with measurement lines at neck and waist for the Army tape test',
      caption: 'AR 600-9 measures neck and waist circumference (and hips for women) to estimate body fat percentage',
    },
    formulaDescription:
      'The Department of Defense body fat formula (AR 600-9) uses circumference measurements in inches. It is the same mathematical formula as the U.S. Navy method, with stricter measurement protocols and specific pass/fail thresholds by age group and gender. Per AR 600-9 Appendix B (28 June 2013) the neck is rounded UP and the abdomen, waist and hip DOWN to the nearest 0.5 inch, height is taken to the nearest 0.5 inch, and the resulting percent body fat is rounded to the nearest whole percent before it is compared with the maximum allowable.',
    variables: [
      { symbol: 'Height', name: 'Height (inches)', description: 'Measured without shoes to the nearest 0.5 inch.' },
      { symbol: 'Circumference Measurements', name: 'Neck, Waist & Hip', description: 'Neck: measured just below the larynx. Abdomen/waist: at navel level for men, narrowest point of the natural waist for women. Hip (women): at the widest point of the buttocks. Per AR 600-9 Appendix B the neck is rounded UP and the abdomen/waist/hip are rounded DOWN to the nearest 0.5 inch.' },
      { symbol: 'Max BF%', name: 'Maximum Allowable Body Fat', description: 'Age- and gender-adjusted threshold from AR 600-9 Table B-2 (four age groups: 17–20, 21–27, 28–39, 40 and older). Ranges from 20% (male, 17–20) to 36% (female, 40 and older).' },
    ],
    quickReference: [
      { label: 'AR 600-9 Male BF% max (age 17–20)', value: '20%' },
      { label: 'AR 600-9 Male BF% max (age 21–27)', value: '22%' },
      { label: 'AR 600-9 Male BF% max (age 28–39)', value: '24%' },
      { label: 'AR 600-9 Male BF% max (age 40 and older)', value: '26%' },
      { label: 'AR 600-9 Female BF% max (age 17–20)', value: '30%' },
      { label: 'AR 600-9 Female BF% max (age 21–27)', value: '32%' },
      { label: 'AR 600-9 Female BF% max (age 28–39)', value: '34%' },
      { label: 'AR 600-9 Female BF% max (age 40 and older)', value: '36%' },
      { label: 'Male measurement formula', value: '86.010 × log₁₀(Waist − Neck) − 70.041 × log₁₀(Height) + 36.76' },
      { label: 'Female measurement formula', value: '163.205 × log₁₀(Waist + Hip − Neck) − 97.684 × log₁₀(Height) − 78.387' },
      { label: 'Measurement rounding', value: 'Neck rounded UP, abdomen/waist/hip rounded DOWN to the nearest 0.5 inch (AR 600-9 App. B); percent body fat rounded to the nearest whole %' },
      { label: 'ABCP reassessment interval', value: 'Monthly (about every 30 days) for Soldiers enrolled in the ABCP' },
      { label: 'Satisfactory progress', value: 'Monthly loss of 3–8 lbs or 1% body fat (AR 600-9 para 3-9b); two consecutive months of less than satisfactory progress = program failure (para 3-12)' },
      { label: 'Measurement training requirement', value: 'AR 600-9 requires measurements by trained unit personnel only' },
      { label: 'Screening weight', value: 'Table B-1 lookup by height and age group, e.g. male 69 in aged 21–27: 179 lbs; female 65 in aged 28–39: 154 lbs. Above 80 in add 6 lbs/in (male) or 5 lbs/in (female)' },
    ],
    howToUse: [
      'Enter your gender, age, height (inches), and weight (lbs).',
      'Measure and enter neck circumference just below the larynx.',
      'Men: measure waist at navel level. Women: measure waist at narrowest point and hip at widest point.',
      'Enter raw tape readings — the calculator applies the AR 600-9 rounding rules for you (neck up, abdomen/waist/hip down, to the nearest 0.5 inch).',
      'Results show your estimated body fat %, the maximum allowable for your age/gender, and pass/fail status.',
    ],
    explanation:
      'AR 600-9 (The Army Body Composition Program) establishes the Department of Defense body fat standards for active duty Soldiers, National Guard, and Army Reserve. The body fat formula is identical to the U.S. Navy circumference method, but measurement protocols differ: AR 600-9 requires measurements to be taken three times in sequence by trained personnel, averaged, and rounded (neck up, abdomen/waist/hip down) to the nearest 0.5 inch. The maximum allowable body fat percentage depends on four age groups: for men 20% (17–20), 22% (21–27), 24% (28–39) and 26% (40 and older); for women 30%, 32%, 34% and 36%. Soldiers who exceed the maximum allowable body fat for their age and gender are flagged and enrolled in the Army Body Composition Program (ABCP), which includes counseling, nutrition guidance, and monthly assessments. Satisfactory progress is a monthly loss of 3–8 lbs or 1% body fat; a Soldier who shows less than satisfactory progress on two consecutive monthly assessments (or on three or more assessments after 6 months in the program while still above the standard) has failed the program, and the commander will request a medical evaluation and, absent a qualifying medical condition, initiate separation action. The screening table weight (Table B-1) gives an initial flag — Soldiers exceeding the screening weight for their height and age group are taped for body fat assessment, but passing the tape test means they meet the standard regardless of scale weight. A Soldier might exceed their screening weight by 20 lbs but still pass the tape test if they carry significant muscle mass. Conversely, a Soldier below screening weight could still be taped if their commander judges that their appearance suggests excessive body fat. This is why the Army uses the tape test as the definitive measure rather than the scale.',
    faqs: [
      {
        question: 'How does AR 600-9 differ from the U.S. Navy body fat method?',
        answer: 'The mathematical formula is identical. The difference is the measurement protocol and the consequences: AR 600-9 uses inches, requires three sets of measurements by trained personnel, rounds the neck UP and the abdomen/waist/hip DOWN to the nearest 0.5 inch, and uses the percentage rounded to the nearest whole percent. Both services measure men at the navel and women at the natural waist. The pass/fail thresholds also differ between the services — each branch sets its own age- and gender-adjusted maximums. AR 600-9 is tied to administrative consequences (ABCP enrollment, potential separation), while the Navy method is primarily a fitness assessment component.',
      },
      {
        question: 'What happens if I exceed the maximum allowable body fat percentage?',
        answer: 'Soldiers who exceed the standard are flagged and enrolled in the Army Body Composition Program (ABCP). Under AR 600-9 (28 June 2013): (1) the commander provides notification counseling within 2 working days, and the Soldier acknowledges enrollment within 2 working days; (2) the Soldier must meet with a dietitian or health care provider within 30 days of enrollment; (3) progress is assessed monthly — a monthly loss of 3–8 lbs or 1% body fat counts as satisfactory progress; (4) a Soldier fails the program if progress is less than satisfactory on two consecutive monthly assessments, or if after 6 months in the program he or she still exceeds the standard and has had less than satisfactory progress on three or more (nonconsecutive) assessments. After program failure the commander requests a medical evaluation and, if no qualifying medical condition is found, initiates separation action, a bar to reenlistment, or involuntary transfer to the IRR (Reserve Soldiers). Separation is a command and administrative process, not an automatic outcome.',
      },
      {
        question: 'Is the screening weight the same as the weight limit?',
        answer: 'No. The screening table weight (AR 600-9 Table B-1) is used to determine who needs a body fat assessment on DA Form 5500/5501. Soldiers exceeding the screening weight but within body fat standards pass. Soldiers below the table minimum are referred for medical evaluation. The two-tier system exists because muscle weighs more than fat by volume. A 5\'10" (70 in) male Soldier aged 21–27 has a screening weight of 185 lbs; if he weighs 210 lbs at 12% body fat he exceeds it by 25 lbs but easily passes the tape test. Conversely, a Soldier below the screening weight could still carry excess body fat (sometimes called "normal-weight obesity"); the regulation lets the commander order a body fat assessment when the Soldier\'s appearance suggests excessive body fat. The screening weight is a filter to reduce unnecessary taping, not a regulatory standard by itself.',
      },
      {
        question: 'How accurate is the Army tape test compared to DEXA or hydrostatic weighing?',
        answer: 'The Army tape test (circumference method) has a standard error of approximately ±3–4% body fat compared to laboratory gold standards like DEXA (dual-energy X-ray absorptiometry), Bod Pod (air displacement plethysmography), or hydrostatic (underwater) weighing. The tape test tends to underestimate body fat in people with very high body fat and overestimate it in very lean individuals. The tape test was adopted because it balances accuracy, cost ($0 for a measuring tape vs. $100–300 for a DEXA scan), portability (it can be done in a motor pool or field environment), and speed. The circumference method is the one prescribed in AR 600-9; check the current regulation and any Army directives for changes to the method or standards.',
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
        result: 'Body fat: approximately 18.0% (official whole-percent value 18%). Maximum allowable for age 25 (21–27 group): 22%. Result: PASS. Screening table weight for 69 in, age 21–27: 179 lbs (he exceeds this by 16 lbs but passes the tape test due to muscular build).',
        insight: 'This Soldier exceeds his 179-lb screening weight by 16 lbs yet passes the tape test with a comfortable margin (18.0% vs. 22% max). This is the classic "muscular Soldier" scenario. His waist-to-neck difference of 19 inches (35 − 16) drives a low body fat calculation because the log of this difference is the largest positive term in the formula. If he were to gain 2 inches on his waist (to 37 inches) while keeping neck the same, his body fat would jump to approximately 21.7% — still passing but much closer to the limit. This illustrates why neck circumference matters: a Soldier can pass the tape test by either losing abdominal fat (reducing waist) OR building neck/shoulder muscle (increasing neck) — though the Army strongly prefers the former approach for actual health outcomes.',
      },
      {
        scenario: 'A 32-year-old female Soldier, 5\'5" (65 inches), weighs 155 lbs. Neck: 13 inches, waist: 30 inches, hips: 38 inches. She is in the 28–39 age group (the standard relaxes again at 40) and wants to understand her current standing.',
        inputs: { sex: 'female', age: '32', heightInches: '65', weight: '155', neck: '13', waist: '30', hip: '38' },
        result: 'Body fat: approximately 28.6% (official whole-percent value 29%). Maximum allowable for age 32 (28–39 group): 34%. Result: PASS with a comfortable margin. Screening table weight for 65 in, age 28–39: 154 lbs (she is 1 lb over, so a tape test is required, which she passes).',
        insight: 'This Soldier passes with 28.6% against a 34% maximum — a comfortable margin of 5.4 percentage points. Her maximum stays at 34% until age 40, when it rises to 36%, but she should not rely on the aging threshold — the goal is always to maintain fitness regardless of age adjustments. The female formula uses a sum of waist + hip − neck, making it sensitive to all three measurements. If her waist increased by 1 inch (31 inches), her body fat would rise to approximately 29.8% — still a comfortable PASS. If she reduced her waist by 1 inch (29 inches), body fat would drop to approximately 27.3% — an even wider margin. This illustrates how a few inches of waist circumference shift the calculated percentage without threatening her standing at this age. She should focus on reducing abdominal circumference through a combination of nutrition and total-body exercise. Her neck measurement (13 inches) lowers the calculated percentage; her hip measurement (38 inches) raises it.',
      },
      {
        scenario: 'A 45-year-old male National Guard Soldier, 6\'0" (72 inches), 235 lbs, preparing for annual body composition screening. Neck: 17 inches, waist: 40 inches. He failed last year at 29.5% body fat (age 44) and has been in ABCP for 8 months. He wants to know if his progress is sufficient.',
        inputs: { sex: 'male', age: '45', heightInches: '72', weight: '235', neck: '17', waist: '40' },
        result: 'Body fat: approximately 23.8% (official whole-percent value 24%). Maximum allowable for age 45 (40 and older group): 26%. Result: PASS with a narrow margin. Screening table weight for 72 in, age 40+: 203 lbs (he exceeds this by 32 lbs). Compared to last year (29.5% at 40-inch waist with likely smaller neck), he has improved by adding 0.5 inch to neck (through strength training) and reducing waist by an estimated 1–2 inches.',
        insight: 'At 23.8% against a 26% maximum, this Soldier passes with a 2.2-percentage-point margin. This marks a clear improvement over last year\'s 29.5% failing score (which exceeded the same 26% maximum for his age group). After 8 months in ABCP, this margin gives his commander confidence to remove the flag while counseling him to maintain his progress. Practical next steps: (1) maintain neck circumference through continued resistance training — losing neck muscle would worsen his body fat calculation; (2) continue reducing waist circumference toward 38 inches, which would bring him to approximately 20.4% — a much wider margin; (3) track trends rather than single-point measurements — a consistent downward trend in calculated body fat is the best indicator of sustainable progress. This case illustrates why the ABCP emphasizes long-term lifestyle changes over crash dieting before weigh-ins.',
      },
    ],
    proTips: [
      'Neck circumference is the most overlooked variable in the Army tape test — and building neck muscle can legitimately improve your calculated body fat percentage. The formula subtracts neck from waist (men) or from waist+hip (women), so a larger neck directly reduces the calculated body fat. Incorporate neck-specific exercises: neck flexion/extension with a harness or plate, shrugs for trapezius development, and direct neck work 2x/week. A 0.5-inch increase in neck circumference (achievable with 3–4 months of consistent training) lowers calculated body fat by roughly 1 percentage point (a little more when the waist–neck difference is small) — sometimes the difference between pass and fail. This is NOT "gaming the system" — it\'s building upper-body muscle mass, which AR 600-9 explicitly accounts for.',
      'Measure at the same time of day and under the same conditions every time. Waist circumference varies by 0.5–1.5 inches over the course of a day due to food, water, bloating, and posture. Official Army tape tests are typically conducted in the morning (before PT formation) for consistency. For an accurate self-check, measure first thing in the morning after using the bathroom and before eating or drinking. Do NOT measure after meals, after drinking water, or in the evening — your waist measurement can be 1–2 inches larger, producing a falsely high body fat estimate. If a Soldier\'s official tape test is scheduled for 0600, their 9 PM self-measurement the night before is NOT predictive of their morning measurement.',
      'The waist measurement site is DIFFERENT for men (at navel/belly button) vs. women (narrowest point of natural waist). This is the most common measurement error in self-administered tests. For men: find your navel (belly button). Place the tape directly across it, parallel to the floor. Do NOT suck in your stomach — according to AR 600-9 protocol, the Soldier is measured at the end of a normal, relaxed exhalation. For women: find the narrowest part of your abdomen — AR 600-9 describes it as usually about halfway between the navel and the lower end of the breastbone (sternum). This is NOT at navel level for most women. Using the wrong site can change your measurement by 1–3 inches. When in doubt, ask a trained NCO to demonstrate the correct anatomical landmarks.',
      'The Army Body Composition Program (ABCP) requires "satisfactory progress" defined as 3–8 lbs per month or 1% body fat reduction per month. A common pitfall: Soldiers lose weight too aggressively (crash dieting, excessive cardio, sauna suits) to pass a monthly weigh-in, only to regain the weight immediately. This roller-coaster pattern is visible to commanders who review the trend rather than a single data point. A Soldier who loses 10 lbs then regains 8 lbs in the next month has effectively made only 2 lbs of progress over 60 days — far below the required rate. Sustainable progress = consistent 0.5–1% body fat reduction per month achieved through moderate caloric deficit, resistance training, and adequate sleep. Commanders are trained to distinguish between "working the program" (steady trend) and "gaming the weigh-in" (yo-yo pattern).',
      'If you are close to the threshold (±2% of max), know the rounding rules. AR 600-9 rounds the neck UP and the abdomen, waist and hip DOWN to the nearest 0.5 inch (a 34 3/4-inch abdomen is recorded as 34.5 inches; a 16 1/4-inch neck as 16.5 inches), and both rules slightly lower the calculated percentage. The final percent body fat is also rounded to the nearest whole percent, so a calculated 22.4% in the 22% group is recorded as 22% and passes. Measurements are the average of three sets, so careful, repeatable tape placement matters more than any single reading. To be safe, aim to be at least 2–3% under your maximum allowable body fat, not just "barely under."',
      'The Army tape test formula is mathematically identical to the Navy method but the administrative context is different. In the Navy, body fat is one component of the Physical Fitness Assessment (PFA) — failing body fat means failing the PFA, which affects advancement and can lead to separation. In the Army, failing AR 600-9 triggers ABCP enrollment, which is a separate administrative action from the fitness test. Both services use the same math but different stakes. If you are transferring between services, be aware that each branch has its own maximum allowable body fat tables, measurement protocols, and consequences for exceeding standards. A body fat percentage that passes under one service\'s table may fail under another\'s.',
    ],
    limitations: [
      'Self-measurement inaccuracy — it is physically difficult to measure your own neck and waist while maintaining the required posture (feet together, arms at sides, looking straight ahead). The calculator cannot replicate an official tape test conducted by trained personnel per AR 600-9 protocol.',
      'Measurement protocol — official measurements are the average of three sets of readings taken by trained personnel, each rounded to the nearest 0.5 inch (neck up, abdomen/waist/hip down). This calculator applies the same rounding rules to the single reading you enter, but it cannot reproduce the three-measurement averaging.',
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
      { source: 'U.S. Army - AR 600-9, The Army Body Composition Program (28 June 2013) — Appendix B: Tables B-1, B-2, B-5 and measurement rules', url: 'https://www.army.mil/e2/downloads/rv7/r2/policydocs/r600_9.pdf' },
    ],
  },
};

export default armyBodyFatConfig;
