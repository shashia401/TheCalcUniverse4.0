import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PregnancyGainPanel from './PregnancyGainPanel';

const IOM_BY_BMI: Record<string, { label: string; totalMin: number; totalMax: number; t1Min: number; t1Max: number; weeklyMin: number; weeklyMax: number }> = {
  underweight: { label: 'Underweight (< 18.5)', totalMin: 28, totalMax: 40, t1Min: 1, t1Max: 4.4, weeklyMin: 1, weeklyMax: 1.3 },
  normal: { label: 'Normal (18.5–24.9)', totalMin: 25, totalMax: 35, t1Min: 1, t1Max: 4.4, weeklyMin: 0.8, weeklyMax: 1 },
  overweight: { label: 'Overweight (25–29.9)', totalMin: 15, totalMax: 25, t1Min: 1, t1Max: 4.4, weeklyMin: 0.5, weeklyMax: 0.7 },
  obese: { label: 'Obese (≥ 30)', totalMin: 11, totalMax: 20, t1Min: 1, t1Max: 4.4, weeklyMin: 0.4, weeklyMax: 0.6 },
};

const pregnancyGainConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
      helpText: 'Choose Imperial (lbs) or Metric (kg) for weight measurements',
      options: [
        { label: 'Imperial (lbs)', value: 'imperial' },
        { label: 'Metric (kg)', value: 'metric' },
      ],
    },
    {
      id: 'prepregnancyWeight',
      label: 'Pre-Pregnancy Weight',
      type: 'number',
      placeholder: '150',
      min: 0,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Your weight before becoming pregnant (or at very beginning of pregnancy).',
    },
    {
      id: 'currentWeight',
      label: 'Current Weight',
      type: 'number',
      placeholder: '165',
      min: 0,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Your current weight to calculate how much you have gained so far.',
    },
    {
      id: 'heightFt',
      label: 'Height — Feet',
      type: 'number',
      placeholder: '5',
      unit: 'ft',
      min: 0,
      max: 9,
      step: 1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Imperial only — feet portion of your height',
    },
    {
      id: 'heightIn',
      label: 'Height — Inches',
      type: 'number',
      placeholder: '5',
      unit: 'in',
      min: 0,
      max: 11,
      step: 1,
      inputMode: 'decimal',
      helpText: 'Remaining inches (0–11)',
    },
    {
      id: 'heightCm',
      label: 'Height — Centimeters',
      type: 'number',
      placeholder: '163',
      unit: 'cm',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Metric only — total height in centimeters',
    },
    {
      id: 'currentWeek',
      label: 'Current Week of Pregnancy',
      type: 'number',
      placeholder: '20',
      unit: 'weeks',
      min: 0,
      max: 42,
      step: 1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Gestational week to determine trimester and track progress',
    },
  ],
  calculate: (values) => {
    const unit = values.unit || 'imperial';
    const preWeight = parseFloat(values.prepregnancyWeight);
    const curWeight = parseFloat(values.currentWeight);
    const currentWeek = parseFloat(values.currentWeek);

    // BMI calculation
    let heightM: number;
    let preWeightKg: number;
    let curWeightKg: number;

    if (unit === 'imperial') {
      const ft = parseFloat(values.heightFt) || 0;
      const inches = parseFloat(values.heightIn) || 0;
      const totalInches = ft * 12 + inches;
      if (totalInches <= 0) return [];
      heightM = totalInches * 0.0254;
      preWeightKg = preWeight * 0.45359237;
      curWeightKg = curWeight * 0.45359237;
    } else {
      heightM = (parseFloat(values.heightCm) || 0) / 100;
      if (heightM <= 0) return [];
      preWeightKg = preWeight;
      curWeightKg = curWeight;
    }

    if ([preWeightKg, curWeightKg, currentWeek].some(isNaN) || preWeightKg <= 0 || curWeightKg <= 0 || currentWeek < 0) return [];

    const preBmi = preWeightKg / (heightM * heightM);

    let bmiCategory: string;
    if (preBmi < 18.5) bmiCategory = 'underweight';
    else if (preBmi < 25) bmiCategory = 'normal';
    else if (preBmi < 30) bmiCategory = 'overweight';
    else bmiCategory = 'obese';

    const iom = IOM_BY_BMI[bmiCategory];
    const gainSoFar = curWeightKg - preWeightKg;
    const gainSoFarDisplay = unit === 'imperial' ? (gainSoFar / 0.45359237).toFixed(1) + ' lbs' : gainSoFar.toFixed(1) + ' kg';

    // Projected gain: estimate based on weekly rate so far
    // Week 0–13: ~1-4.4 lbs total. After week 13, gain at second/third trimester rate
    const weeksPostT1 = Math.max(0, currentWeek - 13);
    const weeklyRate = iom.weeklyMin + (iom.weeklyMax - iom.weeklyMin) / 2; // midpoint
    const projectedGainKg = iom.t1Max + weeksPostT1 * weeklyRate;
    const projectedGainDisplay = unit === 'imperial' ? (projectedGainKg / 0.45359237).toFixed(0) + ' lbs' : projectedGainKg.toFixed(1) + ' kg';

    const gainStatus = (gainSoFarKg: number) => {
      // Convert to lbs for IOM comparison
      const gainLbs = gainSoFarKg / 0.45359237;
      if (currentWeek <= 13) {
        if (gainLbs < iom.t1Min) return 'below';
        if (gainLbs > iom.t1Max) return 'above';
        return 'within';
      }
      if (gainLbs < (iom.totalMin * 0.5)) return 'below';
      if (gainLbs > iom.totalMax) return 'above';
      return 'within';
    };

    const status = gainStatus(gainSoFar);
    const statusLabel = status === 'below' ? 'Below Recommended Range' : status === 'above' ? 'Above Recommended Range' : 'Within Recommended Range';
    const statusColor: 'positive' | 'negative' | 'neutral' = status === 'within' ? 'positive' : status === 'above' ? 'negative' : 'neutral';

    const fmtBmi = (n: number) => n.toFixed(1);
    const fmtKg = (n: number) => `${n.toFixed(1)} kg`;

    return [
      {
        id: 'bmiCategory',
        label: 'Pre-Pregnancy BMI Category',
        value: `BMI ${fmtBmi(preBmi)} — ${iom.label}`,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'totalRange',
        label: 'IOM Recommended Total Gain',
        value: unit === 'imperial' ? `${iom.totalMin}–${iom.totalMax} lbs` : `${fmtKg(iom.totalMin)}–${fmtKg(iom.totalMax)}`,
        color: 'positive',
      },
      {
        id: 'gainSoFar',
        label: `Weight Gained So Far (Week ${currentWeek.toFixed(0)})`,
        value: gainSoFarDisplay,
        color: statusColor,
      },
      {
        id: 'gainStatus',
        label: 'Gain Status vs IOM Guidelines',
        value: statusLabel,
        color: statusColor,
      },
      {
        id: 'projectedGain',
        label: 'Projected Total Gain (at current rate)',
        value: projectedGainDisplay,
        color: 'neutral',
      },
      {
        id: 't1Gain',
        label: 'First Trimester Target',
        value: unit === 'imperial' ? `1–4.4 lbs total` : `0.5–2.0 kg total`,
        color: 'neutral',
      },
      {
        id: 'weeklyGain',
        label: 'Weekly Gain Target (2nd/3rd Trimester)',
        value: unit === 'imperial' ? `${iom.weeklyMin}–${iom.weeklyMax} lbs/week` : `${(iom.weeklyMin * 0.45359237).toFixed(1)}–${(iom.weeklyMax * 0.45359237).toFixed(1)} kg/week`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PregnancyGainPanel, { values, results });
  },
  educational: {
    formula: 'IOM Guidelines: BMI-based total gain range + trimester-specific weekly rates',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Weight Gain by Trimester</text><rect x="20" y="55" width="128" height="70" rx="6" fill="var(--svg-3b82f6)" opacity=".15"/><text x="84" y="78" text-anchor="middle" font-size="12" fill="var(--svg-3b82f6)" font-weight="bold">1st Tri</text><text x="84" y="98" text-anchor="middle" font-size="10" fill="var(--svg-333333)">Weeks 1-13 &middot; 1-4.4 lbs</text><rect x="153" y="55" width="128" height="70" rx="6" fill="var(--svg-22c55e)" opacity=".15"/><text x="217" y="78" text-anchor="middle" font-size="12" fill="var(--svg-22c55e)" font-weight="bold">2nd Tri</text><text x="217" y="98" text-anchor="middle" font-size="10" fill="var(--svg-333333)">Weeks 14-27 &middot; 0.8-1 lb/wk</text><rect x="286" y="55" width="128" height="70" rx="6" fill="var(--svg-f59e0b)" opacity=".15"/><text x="350" y="78" text-anchor="middle" font-size="12" fill="var(--svg-f59e0b)" font-weight="bold">3rd Tri</text><text x="350" y="98" text-anchor="middle" font-size="10" fill="var(--svg-333333)">Weeks 28-40 &middot; 0.8-1 lb/wk</text><text x="220" y="170" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)" font-weight="bold">Total Gain by Pre-Preg BMI:</text><text x="220" y="195" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Underweight 28-40 &middot; Normal 25-35 &middot; Overweight 15-25 &middot; Obese 11-20 lbs</text></svg>',
      alt: 'Three-column chart showing pregnancy weight gain by trimester with IOM BMI-based totals',
      caption: 'IOM guidelines recommend trimester-specific gain rates with total ranges varying by pre-pregnancy BMI',
    },
    formulaDescription:
      'The Institute of Medicine (IOM) 2009 guidelines provide evidence-based weight gain recommendations by pre-pregnancy BMI category. The guidelines aim to balance optimal fetal growth with maternal health outcomes.',
    variables: [
      { symbol: 'BMI', name: 'Pre-Pregnancy BMI', description: 'Your BMI before pregnancy determines which IOM gain range applies. Underweight women need more gain; obese women need less.' },
      { symbol: 'Total Gain', name: 'Full-Term Gain Range', description: 'Total weight gain recommended at 40 weeks. Varies from 11–20 lbs (obese) to 28–40 lbs (underweight).' },
      { symbol: 'Weekly Rate', name: 'Second/Third Trimester Rate', description: 'Gain per week after week 13. Underweight: 1–1.3 lbs. Normal: 0.8–1 lbs. Overweight: 0.5–0.7 lbs. Obese: 0.4–0.6 lbs.' },
    ],
    howToUse: [
      'Enter your pre-pregnancy weight and current weight (same unit system).',
      'Enter your height to calculate pre-pregnancy BMI.',
      'Enter your current week of pregnancy (0–42).',
      'Review your IOM category, recommended range, current gain status, and projected outcomes.',
      'Use the weekly gain target to monitor your rate of gain going forward.',
    ],
    explanation:
      'The Institute of Medicine (IOM) 2009 gestational weight gain guidelines are the clinical standard in the US. They reflect research showing that both inadequate and excessive gain increase risks for mother and baby. Inadequate gain is associated with small-for-gestational-age infants and preterm birth. Excessive gain is associated with large-for-gestational-age infants, cesarean delivery, and postpartum weight retention. The guidelines differ by pre-pregnancy BMI because underweight women need more gain to support fetal growth, while obese women carry more reserves and need less incremental gain. First trimester gain is minimal (1–4.4 lbs total regardless of BMI), with most gain occurring in the second and third trimesters at the recommended weekly rate. The total recommended gain reflects the weight of the baby (7–8 lbs), placenta (1.5 lbs), amniotic fluid (2 lbs), increased blood volume (3–4 lbs), enlarged uterus (2 lbs), breast tissue (1–2 lbs), and maternal fat stores (5–9 lbs). These are guidelines, not rigid targets — individual variation is normal and expected. Women carrying multiples (twins, triplets) have different guidelines with higher weight gain targets. Women who start pregnancy at a BMI above 30 are advised to gain only 11–20 lbs total, as their existing fat reserves provide additional energy for fetal development. Always discuss your weight gain with your healthcare provider, as individual circumstances may warrant adjustments to these general guidelines.',
    faqs: [
      {
        question: 'What happens if I gain too much or too little?',
        answer: 'Gaining below recommendations increases the risk of preterm birth and low birth weight. Gaining above recommendations increases the risk of gestational diabetes, preeclampsia, C-section, and postpartum weight retention. The IOM ranges balance these risks. Discuss any concerns with your provider.',
      },
      {
        question: 'Should I try to lose weight during pregnancy?',
        answer: 'Weight loss during pregnancy is generally not recommended except in specific medical circumstances supervised by a healthcare provider. For women with obesity, the goal is to minimize gain (11–20 lbs total), not to lose weight. Focus on nutrient-dense foods.',
      },
      {
        question: 'Do the IOM guidelines apply to twin pregnancies?',
        answer: 'The IOM also has twin pregnancy guidelines: Underweight/Normal BMI: 37–54 lbs. Overweight: 31–50 lbs. Obese: 25–42 lbs. This calculator uses singleton pregnancy guidelines. Consult your provider for twin or higher-order multiples.',
      },
      {
        question: 'What if I am in my first trimester and losing weight?',
        answer: 'First trimester nausea and vomiting can cause mild weight loss (0–5 lbs) in some women. This is usually not concerning if you are staying hydrated and taking prenatal vitamins. Contact your provider if weight loss is severe or accompanied by inability to keep fluids down.',
      },
      {
        question: 'Do the guidelines change for women having twins or triplets?',
        answer: 'Yes. The IOM has separate guidelines for twin pregnancies: Normal BMI: 37–54 lbs total gain. Overweight: 31–50 lbs. Obese: 25–42 lbs. Twin pregnancies almost always deliver earlier than singletons, so the weekly gain rate in the second and third trimesters is higher. This calculator covers singleton guidelines only — consult your provider for multiples.',
      },
    ],
    commonUses: [
      'Prenatal weight monitoring — track weight gain against IOM guidelines by pre-pregnancy BMI category to ensure both maternal health and optimal fetal growth',
      'Trimester-specific planning — use first trimester gain targets (1-4.4 lbs) and second/third trimester weekly rates to pace weight gain appropriately',
      'High-risk pregnancy management — for women with pre-pregnancy obesity, use the lower gain ranges (11-20 lbs) to minimize complications while supporting fetal development',
      'Postpartum preparation — track projected total gain to anticipate postpartum weight retention and plan for healthy post-delivery weight management'
    ],
    workedExamples: [
      {
        scenario: 'A woman with a pre-pregnancy weight of 140 lbs at 5\'5" (BMI 23.3, Normal category) is at week 20 of pregnancy. Her current weight is 155 lbs. She wants to know if her 15 lb gain is on track and what her total gain should be.',
        inputs: { unit: 'imperial', prepregnancyWeight: '140', currentWeight: '155', heightFt: '5', heightIn: '5', currentWeek: '20' },
        result: 'BMI: 23.3 (Normal category). IOM Recommended Total Gain: 25–35 lbs. Weight Gained So Far: 15.0 lbs at Week 20. Gain Status: Within Recommended Range. Weekly Gain Target (2nd/3rd Tri): 0.8–1.0 lbs/week. Projected Total Gain: ~31 lbs.',
        insight: 'At 20 weeks (halfway through pregnancy) with 15 lbs gained, this woman is tracking comfortably within the IOM normal-BMI range. By week 20, total gain should be roughly 10–15 lbs (including 1–4.4 lbs from first trimester plus 10–13 weeks of second-trimester gain at ~0.8–1 lb/week). Her 15 lbs at the midpoint suggests she is on the higher side of normal but still within range. If she continues at the recommended 0.8–1 lb/week, her projected total gain of ~31 lbs lands squarely within the 25–35 lb recommendation. She should continue monitoring weekly but no intervention is needed.',
      },
      {
        scenario: 'A woman who was underweight before pregnancy (pre-pregnancy BMI 17.8, 105 lbs at 5\'4") is at week 30. She has gained 22 lbs so far. She eats well but worries the gain is not enough.',
        inputs: { unit: 'imperial', prepregnancyWeight: '105', currentWeight: '127', heightFt: '5', heightIn: '4', currentWeek: '30' },
        result: 'BMI: 17.8 (Underweight category). IOM Recommended Total Gain: 28–40 lbs. Weight Gained So Far: 22.0 lbs at Week 30. Gain Status: Below Recommended Range. Weekly Gain Target (2nd/3rd Tri): 1.0–1.3 lbs/week. Projected Total Gain: ~29 lbs.',
        insight: 'For the underweight category, the IOM recommends a higher total gain of 28–40 lbs to support optimal fetal growth. At week 30 with 22 lbs gained, she is tracking below the recommended range — she should have gained approximately 25–32 lbs by now given the higher weekly rate target (1.0–1.3 lbs/week for underweight women in the 2nd/3rd trimester). With 10 weeks remaining, she would need to gain about 1.5 lbs/week to reach the lower end of the target range (28 lbs). She should discuss this with her provider, focusing on calorie-dense nutritious additions: nut butters, avocados, full-fat dairy, olive oil on vegetables, and possibly a protein supplement. This is not alarm-level but warrants attention — inadequate gain in underweight women is associated with higher preterm birth and small-for-gestational-age risks.',
      },
      {
        scenario: 'A woman with pre-pregnancy obesity (BMI 34.5, 220 lbs at 5\'7") is at week 16 of pregnancy. She gained 3 lbs in the first trimester (within normal limits) and wants to understand her targets for the full pregnancy.',
        inputs: { unit: 'imperial', prepregnancyWeight: '220', currentWeight: '223', heightFt: '5', heightIn: '7', currentWeek: '16' },
        result: 'BMI: 34.5 (Obese category, ≥30). IOM Recommended Total Gain: 11–20 lbs. Weight Gained So Far: 3.0 lbs at Week 16. Gain Status: Within Recommended Range. Weekly Gain Target (2nd/3rd Tri): 0.4–0.6 lbs/week. First Trimester Target: 1–4.4 lbs.',
        insight: 'For women with obesity (BMI ≥30), the IOM recommends a restricted total gain of 11–20 lbs — notably less than other categories because existing maternal fat stores provide energy for fetal development. At 16 weeks with 3 lbs gained, she is within range. Her remaining budget is approximately 8–17 lbs over 24 weeks, requiring a gain rate of about 0.3–0.7 lbs/week — right at the 0.4–0.6 lb target. Weight loss during pregnancy is not recommended even with obesity; the goal is controlled minimal gain. She should focus on nutrient density (lean proteins, vegetables, whole grains) rather than "eating for two," which is a harmful myth. Regular monitoring with her provider is recommended, and she may benefit from a referral to a registered dietitian specializing in prenatal nutrition for individualized meal planning.',
      },
    ],
    proTips: [
      'Track weight weekly, not daily. Weigh yourself on the same day each week, at the same time (morning, after using the bathroom, before eating), wearing similar clothing. Daily fluctuations of 1–3 lbs from water retention, food intake, and bowel movements are normal and can cause unnecessary anxiety.',
      'First trimester gain is minimal by design — the fetus weighs less than 1 ounce at 12 weeks. Nausea, food aversions, and fatigue often limit intake. Do not panic if you gain nothing or even lose 1–5 lbs in the first trimester, so long as you stay hydrated and take prenatal vitamins. The substantial weight gain happens in the second and third trimesters when weekly rates kick in.',
      'Focus on nutrition quality over calorie counting. The "eating for two" adage is dangerously misleading — you need only about 340 extra calories/day in the second trimester and 450 extra calories/day in the third (equivalent to a sandwich and a glass of milk, not a second dinner). Prioritize protein (70–100g/day), iron-rich foods, calcium, folate, and DHA omega-3s from food sources.',
      'Don\'t compare your gain to other pregnant women\'s numbers. Pre-pregnancy BMI, genetics, starting muscle mass, fluid retention patterns, and whether you are carrying multiples all influence gain trajectory. Two women at the same week with the same pre-pregnancy BMI can have appropriately different weights.',
      'Physical activity during pregnancy supports healthy weight gain. The ACOG recommends 150 minutes of moderate-intensity activity per week for women with uncomplicated pregnancies. Walking, swimming, stationary cycling, and prenatal yoga are excellent options. Exercise does not increase the risk of miscarriage, preterm birth, or low birth weight in uncomplicated pregnancies.',
      'If your gain is consistently above the recommended range, do not attempt weight loss during pregnancy. Instead, focus on slowing the rate of gain by improving food quality while maintaining adequate nutrition. Swap refined carbohydrates for whole grains, reduce liquid calories (soda, juice, sweetened coffee drinks), and increase non-starchy vegetables. Involve your provider or a registered dietitian rather than self-restricting.',
    ],
    limitations: [
      'These IOM 2009 guidelines are for singleton pregnancies only. Women carrying twins, triplets, or higher-order multiples have different weight gain targets: Normal BMI twin pregnancy: 37–54 lbs; Overweight twin: 31–50 lbs; Obese twin: 25–42 lbs. This calculator does not adjust for multiples.',
      'The IOM guidelines provide population-level recommendations, not individual prescriptions. Your optimal weight gain may differ based on age, ethnicity, medical history (gestational diabetes, preeclampsia, hyperemesis gravidarum), and fetal growth patterns. Always follow your healthcare provider\'s individualized guidance, which may differ from the IOM ranges based on your specific clinical picture.',
      'Pre-pregnancy BMI is a screening tool with limitations. It does not distinguish between fat mass and lean mass (a muscular athlete may have a high BMI but low body fat), and it was developed from primarily white European populations. The IOM acknowledges that BMI-based categories may not equally predict outcomes across all racial and ethnic groups.',
      'This calculator uses self-reported weights and provides a snapshot comparison, not a continuous medical monitoring tool. Weight gain interpretation should consider the overall trajectory over multiple prenatal visits, not a single data point. A woman who tracks "above range" at one visit may be "within range" at the next if gain rate adjusts.',
      'Projected total gain uses the midpoint of the weekly rate range and assumes consistent gain through delivery. Actual gain trajectories are rarely linear — many women experience a plateau or slight loss near term, and fluid retention can spike in the final weeks. The projection is an estimate, not a prediction.',
    ],
    quickReference: [
      { label: 'Underweight BMI (<18.5)', value: 'Gain 28–40 lbs (12.7–18.1 kg) total' },
      { label: 'Normal BMI (18.5–24.9)', value: 'Gain 25–35 lbs (11.3–15.9 kg) total' },
      { label: 'Overweight BMI (25–29.9)', value: 'Gain 15–25 lbs (6.8–11.3 kg) total' },
      { label: 'Obese BMI (≥30)', value: 'Gain 11–20 lbs (5.0–9.1 kg) total' },
      { label: 'First Trimester (all BMI)', value: '1–4.4 lbs (0.5–2.0 kg) total' },
      { label: 'Underweight Weekly Rate', value: '1.0–1.3 lbs/week in 2nd/3rd trimester' },
      { label: 'Normal Weekly Rate', value: '0.8–1.0 lbs/week in 2nd/3rd trimester' },
      { label: 'Overweight Weekly Rate', value: '0.5–0.7 lbs/week in 2nd/3rd trimester' },
      { label: 'Obese Weekly Rate', value: '0.4–0.6 lbs/week in 2nd/3rd trimester' },
    ],
    citations: [
      { source: 'ACOG - Weight Gain in Pregnancy (Committee Opinion 548)', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2013/01/weight-gain-during-pregnancy' },
      { source: 'Institute of Medicine (IOM) 2009 — Weight Gain During Pregnancy: Reexamining the Guidelines', url: 'https://www.nap.edu/catalog/12584/weight-gain-during-pregnancy-reexamining-the-guidelines' },
      { source: 'CDC - Gestational Weight Gain Guidelines', url: 'https://www.cdc.gov/reproductivehealth/maternalinfanthealth/pregnancy-weight-gain.htm' },
    ],
  },
};

export default pregnancyGainConfig;
