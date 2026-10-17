import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HeightPanel from './HeightPanel';
import { parseNonNegative } from '../../../utils/parseNumber';

const CM_PER_INCH = 2.54;
/** Tanner mid-parental height: the average man-woman gap is 13 cm (5.12 in); about 95% of children land within 8.5 cm. */
const GENDER_GAP_CM = 13;
const RANGE_CM = 8.5;

/** 70.96 in -> 5'10.96" style, but in tenths of an inch so 11.96 can never print as 5'12". */
function inchesToFeetInches(inches: number): string {
  const tenths = Math.round(inches * 10);
  const ft = Math.floor(tenths / 120);
  const inc = (tenths % 120) / 10;
  return `${ft}'${Number.isInteger(inc) ? inc : inc.toFixed(1)}"`;
}

const heightCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'motherFeet',
      label: "Mother's Height (feet)",
      type: 'number',
      min: 3,
      max: 8,
      placeholder: '5',
      inputMode: 'decimal',
      helpText: "Enter the mother's height in feet",
    },
    {
      id: 'motherInches',
      label: "Mother's Height (inches)",
      type: 'number',
      min: 0,
      max: 11,
      placeholder: '4',
      inputMode: 'decimal',
      helpText: "Enter the mother's height in inches (0-11)",
    },
    {
      id: 'fatherFeet',
      label: "Father's Height (feet)",
      type: 'number',
      min: 3,
      max: 8,
      placeholder: '5',
      inputMode: 'decimal',
      helpText: "Enter the father's height in feet",
    },
    {
      id: 'fatherInches',
      label: "Father's Height (inches)",
      type: 'number',
      min: 0,
      max: 11,
      placeholder: '10',
      inputMode: 'decimal',
      helpText: "Enter the father's height in inches (0-11)",
    },
    {
      id: 'childGender',
      label: "Child's Gender",
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
      helpText: "Select the child's gender for height prediction",
    },
  ],
  calculate: (values) => {
    const motherFeet = parseNonNegative(values.motherFeet);
    const motherInches = parseNonNegative(values.motherInches);
    const fatherFeet = parseNonNegative(values.fatherFeet);
    const fatherInches = parseNonNegative(values.fatherInches);
    const childGender = values.childGender;

    if (
      isNaN(motherFeet) ||
      isNaN(motherInches) ||
      isNaN(fatherFeet) ||
      isNaN(fatherInches) ||
      !childGender
    ) {
      return [];
    }
    if (motherInches >= 12 || fatherInches >= 12) return [];

    const totalMotherInches = motherFeet * 12 + motherInches;
    const totalFatherInches = fatherFeet * 12 + fatherInches;

    // Plausible adult heights only (3 ft to 9 ft): anything else is a typo, not a prediction.
    const plausible = (inches: number) => inches >= 36 && inches <= 108;
    if (!plausible(totalMotherInches) || !plausible(totalFatherInches)) return [];

    // Tanner's mid-parental ("target") height works in centimetres: the +/-13 cm is the average
    // man-woman height gap (5.12 in), NOT 13 inches. 8.5 cm is about two standard deviations.
    const isMale = childGender === 'male';
    const parentsCm = (totalMotherInches + totalFatherInches) * CM_PER_INCH;
    const predictedCmExact = (parentsCm + (isMale ? GENDER_GAP_CM : -GENDER_GAP_CM)) / 2;
    const predictedInches = predictedCmExact / CM_PER_INCH;
    const rangeInches = RANGE_CM / CM_PER_INCH;

    const rangeLow = predictedInches - rangeInches;
    const rangeHigh = predictedInches + rangeInches;
    const predictedCm = Math.round(predictedCmExact * 10) / 10;

    const predictedDisplay = `${inchesToFeetInches(predictedInches)} (${predictedCm.toFixed(1)} cm)`;
    const rangeDisplay = `${inchesToFeetInches(rangeLow)} to ${inchesToFeetInches(rangeHigh)} (${(predictedCmExact - RANGE_CM).toFixed(1)}-${(predictedCmExact + RANGE_CM).toFixed(1)} cm)`;

    return [
      {
        id: 'predictedHeight',
        label: 'Predicted Height',
        value: predictedDisplay,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'heightRange',
        label: 'Expected Range (about 95%)',
        value: rangeDisplay,
      },
      {
        id: 'predictedCm',
        label: 'Predicted Height (cm)',
        value: predictedCm.toFixed(1),
      },
      {
        id: 'midParental',
        label: 'Predicted Height (inches)',
        value: predictedInches.toFixed(1),
      },
      {
        id: 'gender',
        label: 'Gender',
        value: isMale ? 'Male' : 'Female',
      },
      {
        id: 'motherHeight',
        label: "Mother's Height",
        value: inchesToFeetInches(totalMotherInches),
      },
      {
        id: 'fatherHeight',
        label: "Father's Height",
        value: inchesToFeetInches(totalFatherInches),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HeightPanel, { values, results });
  },
  educational: {
    formula:
      "Boy: (M + F + 13 cm) / 2 | Girl: (M + F − 13 cm) / 2 | Range: ± 8.5 cm (about 3.3 in)",
    formulaDescription:
      "The Mid-Parental Height formula estimates adult height based on parental averages, adjusted for gender.",
    variables: [
      {
        symbol: "M & F",
        name: "Mother's & Father's Height",
        description: "M is the mother's total height in inches. F is the father's total height in inches. Both are summed in the mid-parental height formula.",
      },
      {
        symbol: "+13 cm",
        name: "Male Adjustment",
        description: "Add 13 cm (5.1 inches) for male children: the average height gap between men and women.",
      },
      {
        symbol: "−13 cm",
        name: "Female Adjustment",
        description: "Subtract 13 cm (5.1 inches) for female children: the same average gap, applied the other way.",
      },
    ],
    howToUse: [
      "Enter both parents' heights in feet and inches using the input fields.",
      "Select the child's gender (Male or Female) from the dropdown menu.",
      "View the predicted adult height, expected range, and metric conversion.",
    ],
    explanation:
      "This calculator uses the Mid-Parental Height method (also known as the Tanner method). It provides only a rough estimate — actual adult height is influenced by nutrition, genetics, sleep, and environmental factors. Consult a pediatrician for medical concerns. Practical example: a father is 5 feet 10 inches (70 inches) and a mother is 5 feet 4 inches (64 inches). The parents add up to 134 inches = 340.4 cm. For a son: (340.4 + 13) / 2 = 176.7 cm, or about 5 feet 9.6 inches, with an expected range of 168.2 to 185.2 cm (about 5 feet 6.2 inches to 6 feet 0.9 inches). For a daughter: (340.4 − 13) / 2 = 163.7 cm, or about 5 feet 4.4 inches, with a range of 155.2 to 172.2 cm (5 feet 1.1 inches to 5 feet 7.8 inches). The 13 is centimetres, not inches: adding 13 inches would overstate every prediction by about 4 inches. Edge cases: the method assumes both biological parents are of average genetic background — it does not account for ethnic differences in average height distribution. For adopted children or cases where one biological parent's height is unknown, the method cannot provide a meaningful estimate. If either parent has a condition that significantly affected their own growth (such as childhood malnutrition or a growth hormone disorder), the prediction will be less accurate. The ±8.5 cm (about ±3.3 inch) range is roughly two standard deviations, covering about 95% of children (about the 3rd to 97th percentile), so roughly one child in twenty will fall outside it. Note also that puberty timing significantly affects growth — early maturers may reach their predicted height sooner but not necessarily taller.",
    workedExamples: [
      {
        scenario: "Dr. Patel, a pediatrician, is counseling the Garcia family about their 4-year-old son's expected adult height. The father is 5 feet 10 inches (70 inches) and the mother is 5 feet 4 inches (64 inches). What is the predicted adult height for their son, and what should Dr. Patel tell them about the reliability of this prediction?",
        inputs: { motherFeet: '5', motherInches: '4', fatherFeet: '5', fatherInches: '10', childGender: 'male' },
        result: "Predicted: 5'9.6\" (176.7 cm), Range: 5'6.2\" to 6'0.9\" (168.2-185.2 cm)",
        insight: "Predicted height: (162.6 + 177.8 + 13) / 2 = 176.7 cm (5'9.6\") with a range of 5'6.2\" to 6'0.9\" (168.2-185.2 cm). Dr. Patel should explain that this is a screening estimate only — about 95% of children fall within ±8.5 cm (3.3 inches) of the prediction, but about 5% fall outside this range. The Garcia family should focus on ensuring good nutrition, adequate sleep (9-11 hours for a 4-year-old), and regular pediatric check-ups rather than fixating on a specific predicted number.",
      },
      {
        scenario: "Emma and her husband are both competitive basketball players and are curious about their newborn daughter's genetic height potential. Emma is 6'1\" (73 in) and her husband is 6'7\" (79 in). They want to know if their daughter is likely to be tall enough for competitive basketball.",
        inputs: { motherFeet: '6', motherInches: '1', fatherFeet: '6', fatherInches: '7', childGender: 'female' },
        result: "Predicted: 6'1.4\" (186.5 cm), Range: 5'10.1\" to 6'4.8\" (178.0-195.0 cm)",
        insight: "Predicted height: (185.4 + 200.7 − 13) / 2 = 186.5 cm (6'1.4\") with a range of 5'10.1\" to 6'4.8\" (178.0-195.0 cm). At 6'1.4\", their daughter would be far above the average female height (5'4\") and well suited to basketball. One caution: this formula has no regression-to-the-mean term, and real children of exceptionally tall parents tend to end up somewhat closer to the population average than their parents, so treat the top of the range as unlikely and the lower half as the realistic zone.",
      },
      {
        scenario: "Mark is a single father whose wife passed away. He knows his own height (5'9\" / 69 in) and his late wife was 5'2\" (62 in). He wants to predict his 2-year-old son's adult height but is unsure if the formula is appropriate given that he can't directly measure the mother. He has her driver's license height.",
        inputs: { motherFeet: '5', motherInches: '2', fatherFeet: '5', fatherInches: '9', childGender: 'male' },
        result: "Predicted: 5'8.1\" (172.9 cm), Range: 5'4.7\" to 5'11.4\" (164.4-181.4 cm)",
        insight: "Predicted height: (157.5 + 175.3 + 13) / 2 = 172.9 cm (5'8.1\") with a range of 5'4.7\" to 5'11.4\" (164.4-181.4 cm). The prediction works with the mother's known height even if she is not present. However, driver's license heights are often self-reported and may be inaccurate by 1-2 inches. Mark should use the most precise measurement available — if he has her medical records, that would be more reliable. Also, growth patterns from the mother's side of the family (maternal grandparents' heights) provide additional genetic context that this formula does not capture.",
      },
    ],
    proTips: [
      "Use measured heights from a doctor's office rather than self-reported heights. People routinely overestimate their height by 0.5-1.5 inches on driver's licenses and surveys, and this error directly flows into the prediction.",
      "The mid-parental height is a screening tool, not a crystal ball. Think of it as a 'genetic ceiling' estimate — nutrition, illness, and hormonal factors can push actual height above or below the prediction. Use the range (±8.5 cm, about 3.3 in) rather than the point estimate for realistic expectations.",
      "Consider the heights of both sets of grandparents. If all four grandparents are tall (or short), the child may trend toward the upper (or lower) end of the predicted range. This 'generational regression' effect can shift the actual outcome by 1-2 inches within the range.",
      "For girls, the formula works best before menarche (first period). After menarche, girls typically gain only 2-3 more inches, at which point current height plus 2-3 inches may be a better predictor than the mid-parental formula. For boys, peak growth velocity occurs around age 13-14, with growth continuing into late teens.",
      "Don't over-interpret small differences. A predicted height of 5'11\" vs. 6'0\" is statistically meaningless — both fall well within each other's ±3.3 inch ranges. Avoid making significant life or medical decisions based on a 1-inch difference in prediction.",
      "Track growth velocity over time rather than fixating on a single prediction. A child consistently growing 2-2.5 inches per year during childhood is likely reaching their genetic potential regardless of what the mid-parental formula predicts.",
    ],
    limitations: [
      "This method provides a rough estimate (±8.5 cm, about 3.3 inches) and should not replace professional medical advice or growth monitoring by a pediatrician.",
      "The formula assumes both biological parents are of average genetic background for their population — it does not account for ethnic or regional differences in average height distributions, which can shift predictions by 1-3 inches.",
      "For adopted children or cases where one biological parent's height is unknown, the method cannot provide a meaningful estimate. Using a non-biological parent's height will produce a misleading result.",
      "The formula does not incorporate the child's current height, weight, or growth velocity — a bone age X-ray is far more accurate for children who have already entered puberty.",
      "Medical conditions affecting growth (growth hormone deficiency, hypothyroidism, Turner syndrome, Marfan syndrome, childhood malnutrition, chronic steroid use) are not accounted for and can significantly alter actual adult height.",
      "The ±8.5 cm (about 3.3 inch) range covers approximately 95% of children (two standard deviations). Roughly 1 child in 20 falls outside it — half above and half below — and even inside the range the spread is wide, making it unsuitable for precision-dependent decisions.",
      "Secular trends in height (each generation tends to be slightly taller than the previous one due to improved nutrition) are not captured by this formula, which was developed based on mid-20th century population data.",
    ],
    quickReference: [
      { label: 'Boy Formula', value: '(Mother + Father + 13 cm) ÷ 2' },
      { label: 'Girl Formula', value: '(Mother + Father − 13 cm) ÷ 2' },
      { label: 'Expected Range', value: '±8.5 cm / 3.3 in (covers ~95% of children)' },
      { label: 'Average Male Height (US)', value: '5\'9" (175.3 cm)' },
      { label: 'Average Female Height (US)', value: '5\'4" (162.6 cm)' },
      { label: '1 inch in cm', value: '2.54 cm' },
      { label: '1 foot in inches', value: '12 inches' },
      { label: 'When to consult a doctor', value: 'Height below 3rd or above 97th percentile' },
    ],
    commonUses: [
      "Pediatric growth monitoring as a screening tool during well-child visits at ages 2-4 and pre-puberty",
      "Providing parents with a general expectation of their child's adult stature for sports, clothing, or ergonomic planning",
      "Identifying potential growth disorders — a child consistently tracking well below the mid-parental predicted range may warrant endocrine evaluation",
      "Educational demonstrations in biology and genetics classes to illustrate polygenic inheritance (height is controlled by hundreds of genes, not a single gene)",
      "Research studies on secular trends in height and the relationship between parental and offspring height across generations",
    ],
    faqs: [
      {
        question: "How accurate is the mid-parental height method?",
        answer:
          "The mid-parental height method is a simple screening tool with an accuracy of roughly ±8.5 cm (about 3.3 inches) for about 95% of children. It is most useful as a rough guideline rather than a precise prediction. Many children grow taller or shorter than this estimate due to factors the formula cannot capture, including nutrition, hormone levels, and the genetic contribution from grandparents and extended family.",
      },
      {
        question: "What factors can affect a child's final adult height?",
        answer:
          "Adult height is influenced by many factors beyond parental height: nutrition (adequate protein, calcium, and vitamin D for bone growth), quality and duration of sleep (growth hormone is primarily released during deep sleep stages), regular physical activity (weight-bearing exercise stimulates bone density), chronic illnesses (asthma, celiac disease, congenital heart defects), hormonal conditions (growth hormone deficiency, thyroid disorders), and the overall genetic makeup from both sides of the extended family including grandparents.",
      },
      {
        question: "When is the best age to predict adult height using this method?",
        answer: "The mid-parental height method is most accurate when used to predict adult height in children between ages 2 and 4, or at the onset of puberty. During puberty, growth velocity changes significantly — children typically enter a growth spurt that lasts 2-3 years. For boys, peak height velocity occurs around age 13-14, and for girls, around age 11-12. After a girl has started menstruating, she typically gains only 2-3 more inches of height. For boys, growth plates fuse later, allowing more time for growth after the spurt begins. To get a more accurate prediction during puberty, a pediatrician can order a bone age X-ray of the left hand and wrist, which compares skeletal maturity to chronological age.",
      },
      {
        question: "Why does the formula add 13 cm for boys and subtract 13 cm for girls?",
        answer: "The adjustment is 13 cm (about 5.1 inches), the average height difference between adult men and women. Averaging both parents gives the same number for a son or a daughter, so the formula adds the 13 cm gap to the parents' combined height for a boy and subtracts it for a girl before halving. That moves the prediction up by 6.5 cm (2.6 inches) for a boy and down by the same amount for a girl, toward the male and female averages. It is a centimetre figure: older versions of this calculator added 13 inches, which overstated every prediction by about 4 inches.",
      },
      {
        question: "Can I use this calculator for children who have already started puberty?",
        answer: "Yes, but with caution. Once puberty begins, the child's current height relative to their peers becomes an additional data point. The bone age method (Greulich-Pyle atlas, using an X-ray of the left hand and wrist) is significantly more accurate for adolescents because it measures how much growth potential remains in the growth plates. If your child has already started their growth spurt, a pediatric endocrinologist can combine the mid-parental height with bone age and current height for a more refined prediction. After a girl's first period, she typically has only 2-3 inches of growth remaining, making current height the dominant predictor.",
      },
      {
        question: "How does this formula compare to doubling a child's height at age 2?",
        answer: "The 'double the height at age 2' method is an older rule of thumb that is less accurate than the mid-parental method. While a 2-year-old's height does correlate with adult height (correlation coefficient ~0.8), the mid-parental method incorporates genetic information from both parents and is generally more reliable. For boys, doubling height at age 2.5 is slightly more accurate than at age 2. Neither method is as accurate as a bone age assessment during puberty. The best approach combines the mid-parental target with growth chart tracking over multiple pediatric visits to confirm the child is following a consistent percentile curve.",
      },
      {
        question: "My predicted child height seems too short/tall — should I be concerned?",
        answer: "Not necessarily. The formula has wide confidence intervals. A prediction of 5'6\" for a boy with a range of about 5'3\" to 5'9\" is statistically unremarkable — it's within the normal distribution of male heights. Concerns should arise only if: (a) the child's current height consistently tracks well below the 3rd percentile or above the 97th percentile on growth charts, (b) growth velocity suddenly drops (less than 1.5 inches per year during childhood), or (c) there are other signs of hormonal imbalance (delayed or precocious puberty). In these cases, consult a pediatric endocrinologist — not because of the prediction, but because of the growth pattern.",
      },
    ],
    citations: [
      { source: 'CDC - Growth Charts', url: 'https://www.cdc.gov/growthcharts/' },
      { source: 'WHO - Child Growth Standards', url: 'https://www.who.int/tools/child-growth-standards' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Mid-Parental Height Method</text><circle cx="55" cy="50" r="9" fill="var(--svg-3b82f6)" opacity="0.5"/><line x1="55" y1="59" x2="55" y2="95" stroke="var(--svg-3b82f6)" stroke-width="3" opacity="0.5"/><line x1="55" y1="70" x2="38" y2="88" stroke="var(--svg-3b82f6)" stroke-width="2" opacity="0.5"/><line x1="55" y1="70" x2="72" y2="88" stroke="var(--svg-3b82f6)" stroke-width="2" opacity="0.5"/><text x="55" y="112" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Mother</text><text x="55" y="126" text-anchor="middle" font-size="9" fill="var(--svg-888888)">5\'4" (64")</text><text x="113" y="60" text-anchor="middle" font-size="16" fill="var(--svg-333333)">+</text><circle cx="145" cy="42" r="9" fill="var(--svg-3b82f6)" opacity="0.9"/><line x1="145" y1="51" x2="145" y2="95" stroke="var(--svg-3b82f6)" stroke-width="3" opacity="0.9"/><line x1="145" y1="62" x2="128" y2="82" stroke="var(--svg-3b82f6)" stroke-width="2" opacity="0.9"/><line x1="145" y1="62" x2="162" y2="82" stroke="var(--svg-3b82f6)" stroke-width="2" opacity="0.9"/><text x="145" y="112" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Father</text><text x="145" y="126" text-anchor="middle" font-size="9" fill="var(--svg-888888)">5\'10" (70")</text><line x1="90" y1="138" x2="165" y2="138" stroke="var(--svg-999999)" stroke-width="1.5"/><polygon points="160,135 170,138 160,141" fill="var(--svg-999999)"/><circle cx="265" cy="52" r="9" fill="var(--svg-ef4444)"/><line x1="265" y1="61" x2="265" y2="95" stroke="var(--svg-ef4444)" stroke-width="3"/><line x1="265" y1="70" x2="250" y2="86" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="265" y1="70" x2="280" y2="86" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="265" y="112" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Child</text><text x="265" y="126" text-anchor="middle" font-size="9" fill="var(--svg-888888)">~5\'10"</text><rect x="10" y="145" width="300" height="20" rx="4" fill="var(--svg-fff5f5)" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="160" y="159" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">Boy: (M+F+13 cm)/2  |  Girl: (M+F−13 cm)/2</text><text x="160" y="185" text-anchor="middle" font-size="9" fill="var(--svg-888888)">Expected range: ±8.5 cm / 3.3 in (covers ~95% of children)</text></svg>',
      alt: 'Mid-parental height method showing mother and father heights adding to predict child height',
      caption: 'The Mid-Parental Height formula estimates adult height from parental heights, with a ±8.5 cm (about 3.3 inch) range.',
    },
  },
};

export default heightCalculatorConfig;
