import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HeightPanel from './HeightPanel';

function inchesToFeetInches(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inc = Math.round((inches % 12) * 10) / 10;
  const incDisplay = Number.isInteger(inc) ? Math.round(inc) : inc;
  return `${ft}'${incDisplay}"`;
}

function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 100) / 100;
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
    const motherFeet = parseFloat(values.motherFeet);
    const motherInches = parseFloat(values.motherInches);
    const fatherFeet = parseFloat(values.fatherFeet);
    const fatherInches = parseFloat(values.fatherInches);
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

    const totalMotherInches = motherFeet * 12 + motherInches;
    const totalFatherInches = fatherFeet * 12 + fatherInches;

    if (totalMotherInches === 0 || totalFatherInches === 0) {
      return [];
    }

    const isMale = childGender === 'male';
    const predictedInches = isMale
      ? (totalMotherInches + totalFatherInches + 13) / 2
      : (totalMotherInches + totalFatherInches - 13) / 2;

    const rangeLow = predictedInches - 2;
    const rangeHigh = predictedInches + 2;
    const predictedCm = inchesToCm(predictedInches);

    const predictedDisplay = `${inchesToFeetInches(predictedInches)} (${predictedCm.toFixed(2)} cm)`;
    const rangeDisplay = `${inchesToFeetInches(rangeLow)} to ${inchesToFeetInches(rangeHigh)}`;

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
        label: 'Expected Range',
        value: rangeDisplay,
      },
      {
        id: 'predictedCm',
        label: 'Predicted Height (cm)',
        value: predictedCm.toFixed(2),
      },
      {
        id: 'midParental',
        label: 'Mid-Parental Height',
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
      "Boy: (M + F + 13) / 2 | Girl: (M + F - 13) / 2 | Range: ± 2 inches",
    formulaDescription:
      "The Mid-Parental Height formula estimates adult height based on parental averages, adjusted for gender.",
    variables: [
      {
        symbol: "M & F",
        name: "Mother's & Father's Height",
        description: "M is the mother's total height in inches. F is the father's total height in inches. Both are summed in the mid-parental height formula.",
      },
      {
        symbol: "+13",
        name: "Male Adjustment",
        description: "Add 13 inches for male children to account for sex-based height differences.",
      },
      {
        symbol: "−13",
        name: "Female Adjustment",
        description: "Subtract 13 inches for female children to account for sex-based height differences.",
      },
    ],
    howToUse: [
      "Enter both parents' heights in feet and inches using the input fields.",
      "Select the child's gender (Male or Female) from the dropdown menu.",
      "View the predicted adult height, expected range, and metric conversion.",
    ],
    explanation:
      "This calculator uses the Mid-Parental Height method (also known as the Tanner method). It provides only a rough estimate — actual adult height is influenced by nutrition, genetics, sleep, and environmental factors. Consult a pediatrician for medical concerns. Practical example: a father is 5 feet 10 inches (70 inches) and a mother is 5 feet 4 inches (64 inches). For a son: (70 + 64 + 13) / 2 = 73.5 inches, or about 6 feet 1.5 inches, with an expected range of 71.5 to 75.5 inches (about 6 feet to 6 feet 3.5 inches). For a daughter: (70 + 64 - 13) / 2 = 60.5 inches, or about 5 feet 0.5 inches, with a range of 58.5 to 62.5 inches. Edge cases: the method assumes both biological parents are of average genetic background — it does not account for ethnic differences in average height distribution. For adopted children or cases where one biological parent's height is unknown, the method cannot provide a meaningful estimate. If either parent has a condition that significantly affected their own growth (such as childhood malnutrition or a growth hormone disorder), the prediction will be less accurate. The ±2 inch range covers about 68% of children, meaning roughly one in three children will fall outside this range. Note also that puberty timing significantly affects growth — early maturers may reach their predicted height sooner but not necessarily taller.",
    workedExamples: [
      {
        scenario: "Dr. Patel, a pediatrician, is counseling the Garcia family about their 4-year-old son's expected adult height. The father is 5 feet 10 inches (70 inches) and the mother is 5 feet 4 inches (64 inches). What is the predicted adult height for their son, and what should Dr. Patel tell them about the reliability of this prediction?",
        inputs: { motherFeet: '5', motherInches: '4', fatherFeet: '5', fatherInches: '10', childGender: 'male' },
        result: "Predicted: 6'1.5\" (73.5 in), Range: 5'11.5\" to 6'3.5\"",
        insight: "Predicted height: (64 + 70 + 13) / 2 = 73.5 inches (6'1.5\") with a range of 5'11.5\" to 6'3.5\". Dr. Patel should explain that this is a screening estimate only — about 68% of children fall within ±2 inches of the prediction, but 32% fall outside this range. The Garcia family should focus on ensuring good nutrition, adequate sleep (9-11 hours for a 4-year-old), and regular pediatric check-ups rather than fixating on a specific predicted number.",
      },
      {
        scenario: "Emma and her husband are both competitive basketball players and are curious about their newborn daughter's genetic height potential. Emma is 6'1\" (73 in) and her husband is 6'7\" (79 in). They want to know if their daughter is likely to be tall enough for competitive basketball.",
        inputs: { motherFeet: '6', motherInches: '1', fatherFeet: '6', fatherInches: '7', childGender: 'female' },
        result: "Predicted: 5'9.5\" (69.5 in), Range: 5'7.5\" to 5'11.5\"",
        insight: "Predicted height: (73 + 79 - 13) / 2 = 69.5 inches (5'9.5\") with a range of 5'7.5\" to 5'11.5\". At 5'9.5\", their daughter would be well above the average female height (5'4\") and in a good range for basketball. However, the formula shows a key insight: even with two exceptionally tall parents, regression to the mean pulls the child's predicted height closer to the population average. The daughter is predicted to be tall, but not as extreme as her parents relative to their respective gender averages.",
      },
      {
        scenario: "Mark is a single father whose wife passed away. He knows his own height (5'9\" / 69 in) and his late wife was 5'2\" (62 in). He wants to predict his 2-year-old son's adult height but is unsure if the formula is appropriate given that he can't directly measure the mother. He has her driver's license height.",
        inputs: { motherFeet: '5', motherInches: '2', fatherFeet: '5', fatherInches: '9', childGender: 'male' },
        result: "Predicted: 6'0\" (72 in), Range: 5'10\" to 6'2\"",
        insight: "Predicted height: (62 + 69 + 13) / 2 = 72 inches (6'0\") with a range of 5'10\" to 6'2\". The prediction works with the mother's known height even if she is not present. However, driver's license heights are often self-reported and may be inaccurate by 1-2 inches. Mark should use the most precise measurement available — if he has her medical records, that would be more reliable. Also, growth patterns from the mother's side of the family (maternal grandparents' heights) provide additional genetic context that this formula does not capture.",
      },
    ],
    proTips: [
      "Use measured heights from a doctor's office rather than self-reported heights. People routinely overestimate their height by 0.5-1.5 inches on driver's licenses and surveys, and this error directly flows into the prediction.",
      "The mid-parental height is a screening tool, not a crystal ball. Think of it as a 'genetic ceiling' estimate — nutrition, illness, and hormonal factors can push actual height above or below the prediction. Use the range (±2 in) rather than the point estimate for realistic expectations.",
      "Consider the heights of both sets of grandparents. If all four grandparents are tall (or short), the child may trend toward the upper (or lower) end of the predicted range. This 'generational regression' effect can shift the actual outcome by 1-2 inches within the range.",
      "For girls, the formula works best before menarche (first period). After menarche, girls typically gain only 2-3 more inches, at which point current height plus 2-3 inches may be a better predictor than the mid-parental formula. For boys, peak growth velocity occurs around age 13-14, with growth continuing into late teens.",
      "Don't over-interpret small differences. A predicted height of 5'11\" vs. 6'0\" is statistically meaningless — both fall well within each other's ±2 inch ranges. Avoid making significant life or medical decisions based on a 1-inch difference in prediction.",
      "Track growth velocity over time rather than fixating on a single prediction. A child consistently growing 2-2.5 inches per year during childhood is likely reaching their genetic potential regardless of what the mid-parental formula predicts.",
    ],
    limitations: [
      "This method provides a rough estimate (±2 inches) and should not replace professional medical advice or growth monitoring by a pediatrician.",
      "The formula assumes both biological parents are of average genetic background for their population — it does not account for ethnic or regional differences in average height distributions, which can shift predictions by 1-3 inches.",
      "For adopted children or cases where one biological parent's height is unknown, the method cannot provide a meaningful estimate. Using a non-biological parent's height will produce a misleading result.",
      "The formula does not incorporate the child's current height, weight, or growth velocity — a bone age X-ray is far more accurate for children who have already entered puberty.",
      "Medical conditions affecting growth (growth hormone deficiency, hypothyroidism, Turner syndrome, Marfan syndrome, childhood malnutrition, chronic steroid use) are not accounted for and can significantly alter actual adult height.",
      "The ±2 inch range covers approximately 68% of children (one standard deviation). This means roughly 1 in 3 children will fall outside this range — half above and half below — making it unsuitable for precision-dependent decisions.",
      "Secular trends in height (each generation tends to be slightly taller than the previous one due to improved nutrition) are not captured by this formula, which was developed based on mid-20th century population data.",
    ],
    quickReference: [
      { label: 'Boy Formula', value: '(Mother + Father + 13) ÷ 2 inches' },
      { label: 'Girl Formula', value: '(Mother + Father − 13) ÷ 2 inches' },
      { label: 'Expected Range', value: '±2 inches (covers ~68% of children)' },
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
          "The mid-parental height method is a simple screening tool with an accuracy of roughly ±2 inches (about 5 cm) for about 68% of children. It is most useful as a rough guideline rather than a precise prediction. Many children grow taller or shorter than this estimate due to factors the formula cannot capture, including nutrition, hormone levels, and the genetic contribution from grandparents and extended family.",
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
        question: "Why does the formula add 13 inches for boys and subtract 13 for girls?",
        answer: "The 13-inch adjustment reflects the average height difference between adult men and women in most populations (approximately 5-6 inches). Since the mid-parental height averages both parents' heights, it would produce the same number for a son or daughter without adjustment. Adding 13 inches for boys shifts the prediction up toward the male average, and subtracting 13 for girls shifts it down toward the female average. The factor of 13 is used because the difference in average heights between sexes is roughly 13 cm (about 5 inches) — the formula uses inches, so the 5-inch gap is 'baked in' as 13 inches in the numerator divided by 2, yielding approximately 6.5 inches of sex-based adjustment in the final prediction.",
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
        answer: "Not necessarily. The formula has wide confidence intervals. A prediction of 5'6\" for a boy with a range of 5'4\" to 5'8\" is statistically unremarkable — it's within the normal distribution of male heights. Concerns should arise only if: (a) the child's current height consistently tracks well below the 3rd percentile or above the 97th percentile on growth charts, (b) growth velocity suddenly drops (less than 1.5 inches per year during childhood), or (c) there are other signs of hormonal imbalance (delayed or precocious puberty). In these cases, consult a pediatric endocrinologist — not because of the prediction, but because of the growth pattern.",
      },
    ],
    citations: [
      { source: 'CDC - Growth Charts', url: 'https://www.cdc.gov/growthcharts/' },
      { source: 'WHO - Child Growth Standards', url: 'https://www.who.int/tools/child-growth-standards' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Mid-Parental Height Method</text><circle cx="55" cy="50" r="9" fill="var(--svg-3b82f6)" opacity="0.5"/><line x1="55" y1="59" x2="55" y2="95" stroke="var(--svg-3b82f6)" stroke-width="3" opacity="0.5"/><line x1="55" y1="70" x2="38" y2="88" stroke="var(--svg-3b82f6)" stroke-width="2" opacity="0.5"/><line x1="55" y1="70" x2="72" y2="88" stroke="var(--svg-3b82f6)" stroke-width="2" opacity="0.5"/><text x="55" y="112" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Mother</text><text x="55" y="126" text-anchor="middle" font-size="9" fill="var(--svg-888888)">5\'4" (64")</text><text x="113" y="60" text-anchor="middle" font-size="16" fill="var(--svg-333333)">+</text><circle cx="145" cy="42" r="9" fill="var(--svg-3b82f6)" opacity="0.9"/><line x1="145" y1="51" x2="145" y2="95" stroke="var(--svg-3b82f6)" stroke-width="3" opacity="0.9"/><line x1="145" y1="62" x2="128" y2="82" stroke="var(--svg-3b82f6)" stroke-width="2" opacity="0.9"/><line x1="145" y1="62" x2="162" y2="82" stroke="var(--svg-3b82f6)" stroke-width="2" opacity="0.9"/><text x="145" y="112" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Father</text><text x="145" y="126" text-anchor="middle" font-size="9" fill="var(--svg-888888)">5\'10" (70")</text><line x1="90" y1="138" x2="165" y2="138" stroke="var(--svg-999999)" stroke-width="1.5"/><polygon points="160,135 170,138 160,141" fill="var(--svg-999999)"/><circle cx="265" cy="52" r="9" fill="var(--svg-ef4444)"/><line x1="265" y1="61" x2="265" y2="95" stroke="var(--svg-ef4444)" stroke-width="3"/><line x1="265" y1="70" x2="250" y2="86" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="265" y1="70" x2="280" y2="86" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="265" y="112" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Child</text><text x="265" y="126" text-anchor="middle" font-size="9" fill="var(--svg-888888)">~6\'1"</text><rect x="10" y="145" width="300" height="20" rx="4" fill="var(--svg-fff5f5)" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="160" y="159" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">Boy: (M+F+13)/2  |  Girl: (M+F−13)/2</text><text x="160" y="185" text-anchor="middle" font-size="9" fill="var(--svg-888888)">Expected range: ±2 inches (covers ~68% of children)</text></svg>',
      alt: 'Mid-parental height method showing mother and father heights adding to predict child height',
      caption: 'The Mid-Parental Height formula estimates adult height from parental heights, with a ±2 inch range.',
    },
  },
};

export default heightCalculatorConfig;
