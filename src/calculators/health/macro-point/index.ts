import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import MacroPointPanel from './MacroPointPanel';

/*
 * This calculator provides a nutritional scoring system similar to popular
 * point-based diet programs. The formula aligns with common macronutrient
 * scoring approaches: points increase with calories, saturated fat, and sugar,
 * and decrease with protein.
 *
 * IMPORTANT: This tool is not affiliated with, endorsed by, or connected to
 * Weight Watchers® or any branded point-based system. "Weight Watchers" and
 * "SmartPoints" are registered trademarks of WW International, Inc.
 */

function calculateMacroPoints(calories: number, satFat: number, sugar: number, protein: number): number {
  // Modern macro-based scoring formula
  const points = (calories * 0.0305) + (satFat * 0.275) + (sugar * 0.12) - (protein * 0.098);
  return Math.max(0, Math.round(points * 10) / 10);
}

function getPointsCategory(points: number): { label: string; color: 'positive' | 'neutral' | 'negative'; desc: string } {
  if (points <= 0) return { label: 'Zero-Point', color: 'positive', desc: 'Negligible points — mostly protein-rich foods' };
  if (points <= 3) return { label: 'Low Points', color: 'positive', desc: 'Low point value — generally a good choice for frequent consumption' };
  if (points <= 6) return { label: 'Moderate Points', color: 'neutral', desc: 'Moderate point value — consider portion size and frequency' };
  if (points <= 10) return { label: 'Higher Points', color: 'neutral', desc: 'Higher point value — consume in moderation, check portions' };
  return { label: 'High Points', color: 'negative', desc: 'High point value — treat as an occasional indulgence' };
}

const macroPointConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'foodName',
      label: 'Food Item (Optional)',
      type: 'text',
      placeholder: 'e.g. Grilled Chicken Salad',
      required: false,
      helpText: 'Optional — enter a name for the food you are looking up',
    },
    {
      id: 'calories',
      label: 'Total Calories',
      type: 'number',
      placeholder: '350',
      min: 0,
      step: 1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Total calories per serving',
    },
    {
      id: 'satFat',
      label: 'Saturated Fat',
      type: 'number',
      placeholder: '5',
      min: 0,
      step: 0.5,
      required: true,
      unit: 'g',
      inputMode: 'decimal',
      helpText: 'Grams of saturated fat per serving',
    },
    {
      id: 'sugar',
      label: 'Total Sugar',
      type: 'number',
      placeholder: '12',
      min: 0,
      step: 0.5,
      required: true,
      unit: 'g',
      inputMode: 'decimal',
      helpText: 'Total grams of sugar per serving',
    },
    {
      id: 'protein',
      label: 'Protein',
      type: 'number',
      placeholder: '25',
      min: 0,
      step: 0.5,
      required: true,
      unit: 'g',
      inputMode: 'decimal',
      helpText: 'Grams of protein per serving',
    },
    {
      id: 'fibre',
      label: 'Fibre (Optional)',
      type: 'number',
      placeholder: '5',
      min: 0,
      step: 0.5,
      required: false,
      unit: 'g',
      inputMode: 'decimal',
      helpText: 'Some point systems give a credit for fibre — included for reference',
    },
  ],
  calculate: (values) => {
    const foodName = values.foodName?.trim();
    const calories = parseFloat(values.calories);
    const satFat = parseFloat(values.satFat);
    const sugar = parseFloat(values.sugar);
    const protein = parseFloat(values.protein);

    if ([calories, satFat, sugar, protein].some(isNaN) || calories < 0 || satFat < 0 || sugar < 0 || protein < 0) {
      return [];
    }

    const points = calculateMacroPoints(calories, satFat, sugar, protein);
    const category = getPointsCategory(points);

    // Per-serving per-macro contribution
    const calPoints = calories * 0.0305;
    const satFatPoints = satFat * 0.275;
    const sugarPoints = sugar * 0.12;
    const proteinCredit = protein * 0.098;

    return [
      {
        id: 'macroPoints',
        label: foodName ? `Macro Points — "${foodName}"` : 'Macro Points Score',
        value: `${points.toFixed(1)} points`,
        highlight: true,
        color: category.color,
        interpretation: `Lower is better — the score climbs with calories, saturated fat, and sugar, and protein pulls it back down. Use it to compare foods at a glance rather than as a hard limit; an occasional high-point food fits fine in an otherwise balanced diet.`,
      },
      {
        id: 'pointsCategory',
        label: 'Category',
        value: category.label,
        color: category.color,
      },
      {
        id: 'pointsDescription',
        label: 'Interpretation',
        value: category.desc,
        color: 'neutral',
      },
      {
        id: 'caloriePoints',
        label: 'From Calories',
        value: `${calPoints.toFixed(1)} pts (${Math.round(calories)} kcal × 0.0305)`,
        color: 'neutral',
      },
      {
        id: 'satFatPoints',
        label: 'From Saturated Fat',
        value: `${satFatPoints.toFixed(1)} pts (${satFat.toFixed(1)} g × 0.275)`,
        color: 'negative',
      },
      {
        id: 'sugarPoints',
        label: 'From Sugar',
        value: `${sugarPoints.toFixed(1)} pts (${sugar.toFixed(1)} g × 0.12)`,
        color: 'negative',
      },
      {
        id: 'proteinCredit',
        label: 'Protein Credit (reduces points)',
        value: `−${proteinCredit.toFixed(1)} pts (${protein.toFixed(1)} g × 0.098)`,
        color: 'positive',
      },
      {
        id: 'dailyAllowance',
        label: 'Daily Points Allowance Guide',
        value: `A typical daily budget ranges from 23–40 points. This item uses ${Math.round(points / 30 * 100)}% of a ~30-point daily budget.`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MacroPointPanel, { values, results });
  },
  educational: {
    formula: 'Points = (Cal × 0.0305) + (SatFat × 0.275) + (Sugar × 0.12) − (Protein × 0.098)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Macro Points Formula</text><text x="50" y="65" font-size="12" fill="var(--svg-ef4444)" font-weight="bold">+ Calories:</text><text x="160" y="65" font-size="12" fill="var(--svg-333333)">kcal &times; 0.0305</text><text x="50" y="95" font-size="12" fill="var(--svg-ef4444)" font-weight="bold">+ Sat Fat:</text><text x="160" y="95" font-size="12" fill="var(--svg-333333)">grams &times; 0.275</text><text x="50" y="125" font-size="12" fill="var(--svg-ef4444)" font-weight="bold">+ Sugar:</text><text x="160" y="125" font-size="12" fill="var(--svg-333333)">grams &times; 0.12</text><text x="50" y="155" font-size="12" fill="var(--svg-22c55e)" font-weight="bold">&minus; Protein:</text><text x="160" y="155" font-size="12" fill="var(--svg-333333)">grams &times; 0.098 (credit)</text><text x="220" y="200" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Penalizes calories, saturated fat, sugar</text><text x="220" y="220" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Rewards high-protein, nutrient-dense foods</text></svg>',
      alt: 'Formula breakdown showing plus factors (calories, saturated fat, sugar) and minus factor (protein)',
      caption: 'Points increase with calories, saturated fat, and sugar; protein reduces the score',
    },
    formulaDescription:
      'This macro scoring formula is designed to encourage nutrient-dense food choices. Points increase with calories, saturated fat, and added sugar — all of which are associated with overconsumption risk. Protein reduces points because it increases satiety and supports muscle maintenance. The goal is to maximize nutrition per point by choosing foods high in protein and low in saturated fat and sugar.',
    variables: [
      { symbol: 'Calories', name: 'Energy', description: 'Total caloric content. Higher-calorie foods use more points to encourage portion awareness.' },
      { symbol: 'Saturated Fat', name: 'Saturated Fat Penalty', description: 'Saturated fat is weighted heavily (×0.275) to discourage foods high in less healthy fats, per AHA guidelines.' },
      { symbol: 'Sugar', name: 'Sugar Penalty', description: 'Added and total sugar are weighted (×0.12) to discourage high-sugar, low-nutrient foods.' },
      { symbol: 'Protein', name: 'Protein Credit', description: 'Protein reduces points (×0.098) because it is satiating and supports body composition goals.' },
      { symbol: 'Points Category', name: 'Points Range Classification', description: 'Zero-Point (≤0), Low (0.1–3), Moderate (3.1–6), Higher (6.1–10), or High (>10). Helps you quickly assess whether a food is a frequent, moderate, or occasional choice.' },
    ],
    howToUse: [
      'Optionally enter a food name for reference.',
      'Enter the nutrition facts for your food: calories, saturated fat, total sugar, and protein per serving.',
      'Optionally enter fibre for reference (some systems include a fibre credit).',
      'Review the macro points score and breakdown by nutrient.',
      'Use the score to compare different food choices — lower points generally mean more nutrient-dense options.',
    ],
    explanation:
      "This Macro Point Calculator provides a nutrition scoring system aligned with popular point-based diet approaches. The formula assigns higher scores to foods high in calories, saturated fat, and sugar, while giving a credit for protein — incentivizing lean proteins, vegetables, and whole foods over processed options. This is not an official Weight Watchers or SmartPoints calculator but uses a similar macronutrient-weighted approach. Keep in mind that all point-based systems are simplifications — a food's healthfulness also depends on micronutrient density, fibre content, food matrix effects, and individual health needs. Use points as one of several decision-making tools, not the sole arbiter of food quality. For instance, comparing a 200-calorie apple (0g saturated fat, 19g sugar, 1g protein) with a 200-calorie serving of cheese crackers (3g saturated fat, 2g sugar, 4g protein): the apple scores fewer points due to zero saturated fat, while the crackers get a larger penalty from saturated fat that outweighs any protein credit. This illustrates how the formula nudges toward whole foods. However, the apple's fibre, vitamin C, and polyphenols are not captured by the point formula — another reminder that points are a useful tool but not a complete picture of nutritional quality.",
    faqs: [
      {
        question: 'Is this the official Weight Watchers SmartPoints formula?',
        answer: 'No. This calculator is not affiliated with, endorsed by, or connected to WW International, Inc. "Weight Watchers" and "SmartPoints" are registered trademarks. The formula used here is a publicly known macro-weighted scoring system that is similar in structure to popular point-based systems. We do not claim this is identical to any branded system.',
      },
      {
        question: 'What is a good daily point budget?',
        answer: 'Daily point budgets typically range from 23–40 points depending on body weight, activity level, and goals. A common starting point is: Women ~23–30 points/day, Men ~30–40 points/day. For weight loss, aim for the lower end of your range. For maintenance, use the middle. For active individuals or those trying to gain weight, use the higher end. This calculator shows a single food\'s score — track your total across all meals to stay within your daily budget.',
      },
      {
        question: 'What are zero-point foods and how do they work?',
        answer: 'Zero-point foods are those whose macronutrient profile yields a score of 0 or below — typically lean proteins like chicken breast (165 cal, 3.6g fat, 0g sugar, 31g protein yields negative points), plain nonfat Greek yogurt, fish, eggs, and tofu. The protein credit (×0.098) offsets the calorie contribution, potentially bringing the score to zero or below. These foods are considered core to a healthy diet and are encouraged without restriction in most point-based systems because they are satiating and nutrient-dense.',
      },
      {
        question: 'How does this compare to actual nutrition labels and daily values?',
        answer: 'This point system is a simplified nutritional heuristic, not a replacement for the full Nutrition Facts label. It tracks only 4 macronutrients (calories, saturated fat, sugar, protein) and ignores many factors that affect health: fiber, sodium, trans fat, micronutrients (vitamins, minerals), food processing level, glycemic index, and ingredient quality. A food with a low point score could still be nutritionally poor (e.g., a diet soda has 0 points but no nutritional value). Use points as one decision-making tool alongside reading ingredient lists and considering whole-food dietary patterns.',
      },
      {
        question: 'Can I use this point system for weight loss?',
        answer: 'Yes, point-based food scoring can support weight loss by creating awareness of calorie density, saturated fat, and sugar content while encouraging higher protein intake for satiety. To lose weight, set a daily point budget about 20–25% below your maintenance level. Combine point tracking with attention to hunger cues, food quality, and physical activity. However, this is not a clinical weight loss program — for medical weight management, consult a registered dietitian or healthcare provider.',
      },
      {
        question: 'Why does saturated fat add so many points compared to calories?',
        answer: 'Saturated fat is weighted heavily (×0.275) because it is strongly associated with elevated LDL cholesterol and cardiovascular disease risk when consumed in excess. The American Heart Association recommends limiting saturated fat to less than 6% of total daily calories. A single gram of saturated fat contributes more to the point score than a gram of sugar (0.275 vs. 0.12), reflecting the stronger epidemiological evidence against excess saturated fat consumption compared to sugar alone.',
      },
      {
        question: 'What foods typically score the lowest and highest points?',
        answer: 'Lowest: skinless chicken breast, egg whites, cod, shrimp, nonfat plain Greek yogurt, most non-starchy vegetables (entered with their minimal macros). Highest: cheeseburgers, pepperoni pizza, milkshakes, fried chicken, pastries, and processed snacks — these combine high calories, saturated fat, and sugar with minimal protein credit. As a rule of thumb, whole unprocessed foods score lower than their processed equivalents: a homemade grilled chicken breast (~2 pts) vs. breaded frozen chicken tenders (~7–9 pts).',
      },
    ],
    commonUses: [
      'Daily food tracking — score individual foods or meals to build awareness of how calories, saturated fat, sugar, and protein contribute to overall nutritional quality',
      'Grocery shopping comparisons — compare similar products at the store to choose options with lower points (more protein, less saturated fat and sugar)',
      'Meal planning optimization — plan daily menus within a target point budget to ensure balanced macronutrient distribution across all meals',
      'Diet adherence support — use points as a simplified decision-making framework to make consistent food choices without tracking every gram and calorie individually'
    ],
    workedExamples: [
      {
        scenario: 'A person is comparing a grilled chicken salad (350 cal, 3g sat fat, 6g sugar, 32g protein) against a fast-food crispy chicken sandwich (530 cal, 5g sat fat, 12g sugar, 28g protein). Which scores better under this system?',
        inputs: { calories: '350', satFat: '3', sugar: '6', protein: '32' },
        result: 'Grilled Chicken Salad: ~7.3 points (350×0.0305 + 3×0.275 + 6×0.12 − 32×0.098 = 10.675 + 0.825 + 0.72 − 3.136 = 9.1). Fast-Food Sandwich: ~12.8 points (530×0.0305 + 5×0.275 + 12×0.12 − 28×0.098 = 16.165 + 1.375 + 1.44 − 2.744 = 16.2).',
        insight: 'The salad scores significantly lower (Moderate range) while the fried sandwich lands in High Points territory. Even with similar protein amounts, the fried sandwich\'s extra 180 calories and higher saturated fat drive the score up. This illustrates how the formula nudges toward lean protein choices while penalizing fried and calorie-dense options. However, note that salad dressings, croutons, and cheese add-ins can dramatically increase the salad\'s points — always calculate the complete assembled meal, not just the base',
      },
      {
        scenario: 'A home cook is deciding between using 85% lean ground beef (240 cal, 8g sat fat, 0g sugar, 21g protein per 4oz) versus 93% lean ground turkey (170 cal, 2g sat fat, 0g sugar, 22g protein per 4oz) for tacos.',
        inputs: { calories: '170', satFat: '2', sugar: '0', protein: '22' },
        result: 'Lean Turkey: ~3.7 points. Comparison with 85% lean beef would yield ~6.8 points (240×0.0305 + 8×0.275 + 0×0.12 − 21×0.098 = 7.32 + 2.2 + 0 − 2.058 = 7.46). Difference: ~3.8 fewer points per serving.',
        insight: 'Switching from 85% lean beef to 93% lean turkey saves approximately 3.5–4 points per 4oz serving — nearly half the points. Over a meal of two tacos (8oz meat), that is a 7–8 point difference, or about 25% of a daily budget. The point savings come primarily from the saturated fat reduction (8g vs. 2g). This type of comparison is exactly where the point system adds value — helping identify substitution opportunities that maintain protein while reducing less-desirable nutrients.',
      },
      {
        scenario: 'Someone is buying a morning smoothie and comparing a homemade version (frozen berries, banana, plain Greek yogurt, spinach: 280 cal, 0.5g sat fat, 32g sugar, 18g protein) against a popular smoothie chain\'s medium berry smoothie (390 cal, 2g sat fat, 67g sugar, 3g protein).',
        inputs: { calories: '280', satFat: '0.5', sugar: '32', protein: '18' },
        result: 'Homemade Smoothie: ~7.1 points. Chain Smoothie: ~17.8 points (390×0.0305 + 2×0.275 + 67×0.12 − 3×0.098 = 11.895 + 0.55 + 8.04 − 0.294 = 20.2). Difference: over 10 points.',
        insight: 'The chain smoothie scores more than double the homemade version despite being a "smoothie" — a term many associate with health. The culprit is the 67g of sugar (vs. 32g), which adds over 8 points by itself. The chain version also has negligible protein (3g vs. 18g), missing the protein credit entirely. This example demonstrates why reading nutrition labels matters: two foods with the same name can have radically different nutritional profiles. The homemade version\'s Greek yogurt provides the protein credit and gives it a creamy texture without the added sugar.',
      },
    ],
    proTips: [
      'Compare similar foods side-by-side using this calculator — the point difference between two brands of the same item (e.g., granola bars) can vary by 3–5 points from saturated fat and sugar differences alone. Bring your phone grocery shopping and check labels.',
      'Boost protein to lower your score — adding just 10g of protein (e.g., a scoop of collagen peptides, an extra egg white, or 3oz of lean chicken) reduces points by about 1, effectively "earning" room for other foods within your daily budget.',
      'Watch portion sizes — the calculator scores per serving. A food that seems reasonable at 4 points per serving can become a 12-point item if you eat 3 servings. Always check the serving size on the label before entering values.',
      'Build meals around zero-point and low-point building blocks — lean proteins, non-starchy vegetables, and legumes — then use your remaining point budget for grains, healthy fats, and the occasional treat. This "budget-first" approach works better than trying to fit high-point foods into your day and running out of points.',
      'Don\'t chase zero points at the expense of balanced nutrition. Some nutritious foods like nuts, avocados, and olive oil score moderately due to their calorie density and fat content, but they provide essential nutrients (vitamin E, monounsaturated fats, fiber) that zero-point lean proteins lack. Use points as a guide, not a straitjacket.',
    ],
    limitations: [
      'This calculator is not affiliated with Weight Watchers, WW International, Inc., or any branded point-based diet program. The formula is a publicly available macronutrient-weighted scoring method. Do not use this to claim SmartPoints values for official WW programs.',
      'The point formula only considers 4 macronutrients: calories, saturated fat, sugar, and protein. It ignores dietary fiber (which most point systems credit), sodium, trans fat, cholesterol, micronutrient density (vitamins, minerals, phytonutrients), food processing level, glycemic load, and ingredient quality. A diet soda may score 0 points while being nutritionally empty, and almonds may score moderate points while being nutrient-dense.',
      'Individual nutritional needs vary based on age, sex, activity level, metabolic health, food sensitivities, and medical history. The point system provides a generic heuristic that may not align with your specific needs — especially for individuals with diabetes (who need to consider glycemic impact beyond sugar grams), kidney disease (who need to limit protein), or eating disorders (where point tracking can be counterproductive).',
      'Daily point budgets are rough estimates. The 23–40 point range is a starting point, not a prescription. Your actual maintenance points depend on total daily energy expenditure, which can vary by 500+ calories/day based on activity level, lean body mass, and non-exercise activity thermogenesis (NEAT).',
      'Point-based systems can create an unhealthy fixation on numbers. If you find yourself obsessing over fractions of points, avoiding nutrient-dense foods because they "cost too much," or feeling guilty about occasional high-point meals, step back. Points should simplify food decisions, not dominate them. Consult a registered dietitian for a sustainable, individualized approach.',
    ],
    quickReference: [
      { label: 'Zero-Point', value: '≤ 0 points — Lean proteins, non-starchy vegetables' },
      { label: 'Low Points', value: '0.1–3 points — Generally healthy choices' },
      { label: 'Moderate', value: '3.1–6 points — Watch portion size' },
      { label: 'Higher Points', value: '6.1–10 points — Consume in moderation' },
      { label: 'High Points', value: '>10 points — Occasional indulgence' },
      { label: 'Daily Budget (Women)', value: '~23–30 points depending on weight/activity' },
      { label: 'Daily Budget (Men)', value: '~30–40 points depending on weight/activity' },
      { label: 'Formula', value: 'Cal×0.0305 + SatFat×0.275 + Sugar×0.12 − Protein×0.098' },
    ],
    citations: [
      { source: 'USDA - Dietary Guidelines', url: 'https://www.dietaryguidelines.gov/' },
      { source: 'NIH - Macronutrient Research', url: 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/' },
      { source: 'American Heart Association - Saturated Fat', url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/saturated-fats' },
    ],
  },
};

export default macroPointConfig;
