import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import BodyTypePanel from './BodyTypePanel';

/** Determine fashion body shape from bust/waist/hip circumference */
function getFashionShape(
  bust: number, waist: number, hip: number, unit: string = 'imperial',
): { label: string; value: string; description: string } {
  // Ratio-based classification
  const bustWaistRatio = bust / waist;
  const hipWaistRatio = hip / waist;
  const bustHipDiff = bust - hip;

  if (hipWaistRatio >= 1.15 && bustWaistRatio < 1.15) {
    return { label: 'Pear (Triangle)', value: 'pear', description: 'Hips wider than shoulders and bust. Weight tends to gather below the waist — thighs, hips, and lower body.' };
  }
  if (bustWaistRatio >= 1.15 && hipWaistRatio < 1.15 && bustHipDiff > (unit === 'metric' ? 12.7 : 5)) {
    return { label: 'Inverted Triangle', value: 'invertedTriangle', description: 'Shoulders and bust wider than hips. Weight tends to gather in the upper body — chest, shoulders, and arms.' };
  }
  if (bustWaistRatio >= 1.15 && hipWaistRatio >= 1.15) {
    return { label: 'Hourglass', value: 'hourglass', description: 'Bust and hips are similarly proportioned with a well-defined, narrower waist. The waist is significantly smaller than both bust and hips.' };
  }
  if (waist >= bust * 0.90 || waist >= hip * 0.90) {
    return { label: 'Apple (Round)', value: 'apple', description: 'Weight gathers primarily around the midsection. Bust, waist, and hips are similar in circumference with less waist definition.' };
  }
  return { label: 'Rectangle (Straight)', value: 'rectangle', description: 'Bust, waist, and hips are fairly similar in circumference with minimal waist definition. A balanced, athletic silhouette.' };
}

const bodyTypeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
      helpText: 'Choose Imperial (inches) or Metric (cm) for circumference measurements',
      options: [
        { label: 'Imperial (inches)', value: 'imperial' },
        { label: 'Metric (cm)', value: 'metric' },
      ],
    },
    {
      id: 'bust',
      label: 'Bust / Chest Circumference',
      type: 'number',
      placeholder: '38',
      min: 0,
      step: 0.25,
      required: true,
      inputMode: 'decimal',
      helpText: 'Measure at the fullest part of the bust/chest.',
    },
    {
      id: 'waist',
      label: 'Waist Circumference',
      type: 'number',
      placeholder: '30',
      min: 0,
      step: 0.25,
      required: true,
      inputMode: 'decimal',
      helpText: 'Measure at the narrowest part of your natural waistline.',
    },
    {
      id: 'hip',
      label: 'Hip Circumference',
      type: 'number',
      placeholder: '40',
      min: 0,
      step: 0.25,
      required: true,
      inputMode: 'decimal',
      helpText: 'Measure at the fullest part of the hips/glutes.',
    },
  ],
  calculate: (values) => {
    const unit = values.unit || 'imperial';
    const bust = parseFloat(values.bust);
    const waist = parseFloat(values.waist);
    const hip = parseFloat(values.hip);

    if ([bust, waist, hip].some(isNaN) || bust <= 0 || waist <= 0 || hip <= 0) return [];

    const unitLabel = unit === 'imperial' ? 'in' : 'cm';

    const shape = getFashionShape(bust, waist, hip, unit);

    // Waist-to-hip ratio
    const whr = waist / hip;

    // Waist-to-bust ratio
    const wbr = waist / bust;

    return [
      {
        id: 'bodyShape',
        label: 'Your Body Shape',
        value: shape.label,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'shapeDescription',
        label: 'Shape Description',
        value: shape.description,
        color: 'neutral',
      },
      {
        id: 'waistHipRatio',
        label: 'Waist-to-Hip Ratio (WHR)',
        value: whr.toFixed(2),
        color: 'neutral',
      },
      {
        id: 'waistBustRatio',
        label: 'Waist-to-Bust Ratio',
        value: wbr.toFixed(2),
        color: 'neutral',
      },
      {
        id: 'measurements',
        label: 'Measurements',
        value: `Bust: ${bust} ${unitLabel} · Waist: ${waist} ${unitLabel} · Hip: ${hip} ${unitLabel}`,
        color: 'neutral',
      },
      {
        id: 'whrHealthRisk',
        label: 'WHR Health Risk (WHO)',
        value: whr > 0.85 ? 'Elevated health risk (women) · WHR > 0.85' : whr > 0.90 ? 'Elevated health risk (men) · WHR > 0.90' : 'Standard risk range',
        color: whr > 0.90 ? 'negative' : whr > 0.85 ? 'neutral' : 'positive',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BodyTypePanel, { values, results });
  },
  educational: {
    formula: 'WHR = Waist ÷ Hip | Shape based on Bust:Waist:Hip ratios | Somatotypes: Ectomorph, Mesomorph, Endomorph',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Three Body Types (Somatotypes)</text><path d="M75,40 L60,80 L55,120 L60,170 L70,210 L80,240 L100,240 L110,210 L120,170 L125,120 L120,80 L105,40" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="90" y="280" text-anchor="middle" font-size="11" fill="var(--svg-3b82f6)" font-weight="bold">Ectomorph</text><path d="M200,40 L185,80 L178,130 L180,180 L188,220 L198,250 L242,250 L252,220 L260,180 L262,130 L255,80 L240,40" fill="var(--svg-dbeafe)" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="220" y="280" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)" font-weight="bold">Mesomorph</text><path d="M325,40 L308,90 L302,140 L312,200 L325,240 L338,260 L362,260 L375,240 L388,200 L398,140 L392,90 L375,40" fill="var(--svg-dbeafe)" stroke="var(--svg-f59e0b)" stroke-width="2"/><text x="350" y="280" text-anchor="middle" font-size="11" fill="var(--svg-f59e0b)" font-weight="bold">Endomorph</text></svg>',
      alt: 'Three body type silhouettes: lean ectomorph, muscular mesomorph, and soft endomorph',
      caption: 'Somatotypes describe body composition tendencies: ectomorph (lean), mesomorph (muscular), endomorph (soft)',
    },
    formulaDescription:
      'Body shape is determined by the relative proportions of bust, waist, and hip circumferences. The waist-to-hip ratio (WHR) is also a health indicator — higher WHR indicates more central/visceral fat, which carries greater cardiovascular risk. The fashion shape classification (Pear, Apple, Hourglass, etc.) guides clothing fit, while the somatotype system describes body composition tendencies.',
    variables: [
      { symbol: 'WHR', name: 'Waist-to-Hip Ratio', description: 'Waist circumference divided by hip circumference. A health marker for fat distribution and cardiovascular risk.' },
      { symbol: 'Fashion Shape', name: 'Body Shape Classification', description: 'Categorizes body silhouette based on bust/waist/hip ratios. Used for clothing and style recommendations.' },
      { symbol: 'Somatotype', name: 'Body Type Theory', description: 'Ectomorph (lean, linear), Mesomorph (muscular, athletic), Endomorph (soft, curvy). Modern physiology views these as a spectrum, not rigid categories.' },
    ],
    quickReference: [
      { label: 'Pear (Triangle)', value: 'Hips ≥ 15% wider than waist; bust < 15% wider than waist. Weight gathers below waist.' },
      { label: 'Inverted Triangle', value: 'Bust ≥ 15% wider than waist; hips < 15% wider. Weight gathers in upper body.' },
      { label: 'Hourglass', value: 'Bust and hips both ≥ 15% wider than waist. Well-defined waist with balanced proportions.' },
      { label: 'Apple (Round)', value: 'Waist ≥ 90% of bust or hip. Weight gathers around midsection with minimal waist definition.' },
      { label: 'Rectangle (Straight)', value: 'Bust, waist, and hips similar with minimal waist definition. Athletic, balanced silhouette.' },
      { label: 'Healthy WHR (Women)', value: '≤ 0.85 (WHO threshold for lower cardiovascular risk)' },
      { label: 'Healthy WHR (Men)', value: '≤ 0.90 (WHO threshold for lower cardiovascular risk)' },
      { label: 'High-risk WHR (Women)', value: '> 0.85 — indicates central obesity, increased cardiovascular and metabolic risk' },
      { label: 'Typical WHR (Pear shape)', value: '0.65–0.75 — lowest cardiovascular risk profile' },
      { label: 'Typical WHR (Apple shape)', value: '0.85–1.0+ — highest cardiovascular risk profile among body shapes' },
      { label: 'Waist measurement risk (Women)', value: '> 35 inches (88 cm) — increased metabolic risk per NIH/WHO' },
      { label: 'Waist measurement risk (Men)', value: '> 40 inches (102 cm) — increased metabolic risk per NIH/WHO' },
    ],
    howToUse: [
      'Measure your bust/chest at the fullest point with a soft measuring tape.',
      'Measure your waist at the narrowest point (typically above the belly button).',
      'Measure your hips at the widest point across the glutes.',
      'Select your unit system and enter all three measurements.',
      'Review your body shape classification, WHR, and the somatotype explanation below.',
    ],
    explanation:
      "The body shape classification system used here is based on fashion industry standards: the relative proportions of bust, waist, and hip define the silhouette (Pear, Apple, Hourglass, Rectangle, Inverted Triangle). This is useful for clothing fit but has limited health implications. Separately, the somatotype theory (ectomorph/mesomorph/endomorph) was developed in the 1940s by psychologist William Sheldon, who controversially linked body types to temperament. Modern sports physiology uses somatotype categories descriptively — they describe your current body composition, not a fixed biological destiny. Your body type can change significantly with nutrition and training. The WHR is the most clinically useful metric here: a WHR above 0.85 for women or 0.90 for men indicates higher cardiovascular risk due to central fat distribution, even at a normal BMI. A practical example: a woman with measurements 36-27-39 has an hourglass shape with a WHR of 0.69, which is well within the healthy range. If her waist increased to 36 inches (measurements 36-36-39), she would shift to an apple shape with a WHR of 0.92, indicating significantly elevated cardiovascular risk — even if her weight stayed exactly the same. This illustrates why waist measurement trends over time are more informative than body weight for assessing metabolic health. Losing even 1-2 inches from the waist through diet and exercise can meaningfully reduce disease risk, regardless of whether the scale moves.",
    faqs: [
      {
        question: 'Can my body shape change?',
        answer: 'Yes. Body shape changes with weight loss/gain, muscle building, pregnancy, and aging. While bone structure (shoulder width, hip width) is fixed, fat distribution and muscle mass can shift your shape category. For example, building shoulder and back muscles can shift a Pear toward Rectangle; losing visceral fat can shift an Apple toward Rectangle.',
      },
      {
        question: 'Which body shape is healthiest?',
        answer: 'From a health perspective, what matters most is not your fashion shape but your fat distribution. Lower waist-to-hip ratio (below 0.85 for women, 0.90 for men) is associated with lower cardiovascular risk regardless of shape. Pear shapes (lower-body fat) generally have lower metabolic risk than Apple shapes (central/visceral fat).',
      },
      {
        question: 'How is Waist-to-Hip Ratio (WHR) related to health outcomes?',
        answer: 'WHR is a strong predictor of cardiovascular risk and metabolic disease. A WHR above 0.85 for women or 0.90 for men indicates central obesity (excess abdominal fat around organs) and significantly increased health risk — even in people with normal BMI. WHR is often more predictive of heart disease risk than BMI alone because it captures dangerous visceral fat that BMI misses.',
      },
      {
        question: 'How do I measure my body accurately for this calculator?',
        answer: 'Use a flexible fabric measuring tape (not a metal tape measure). For bust, measure across the fullest part of your chest while wearing a well-fitting bra, keeping the tape parallel to the floor. For waist, find your natural waist by bending to one side — the crease that forms is your natural waistline. Measure at this narrowest point after exhaling normally (don\'t suck in your stomach). For hips, stand with feet together and measure around the widest part of your hips and glutes. Take each measurement at least twice and use the average. For consistency, measure at the same time of day (morning is best, before eating) and wear minimal clothing. The tape should be snug but not compressing your skin — you should be able to slip one finger under it.',
      },
      {
        question: 'Why is WHR more predictive of health risk than BMI?',
        answer: 'BMI doesn\'t distinguish between muscle and fat, nor does it account for fat distribution. Two people with identical BMIs can have dramatically different health profiles: a muscular athlete with 10% body fat and a sedentary person with 30% body fat can both have a BMI of 24. WHR specifically measures central fat distribution — the dangerous visceral fat that surrounds organs and is metabolically active. Visceral fat releases inflammatory cytokines and free fatty acids directly into the portal vein, contributing to insulin resistance, type 2 diabetes, and cardiovascular disease. A 2007 INTERHEART study of 27,000 people across 52 countries found WHR was a stronger predictor of heart attack risk than BMI. Measuring your WHR every 3–6 months is a better health tracking metric than weight alone.',
      },
      {
        question: 'What is the difference between body shape classification and somatotypes?',
        answer: 'Body shape classification (Pear, Apple, Hourglass, Rectangle, Inverted Triangle) is a fashion/retail system based purely on external circumference ratios. It\'s useful for clothing fit and style recommendations. Somatotypes (Ectomorph, Mesomorph, Endomorph) come from 1940s psychological theory by William Sheldon but were adapted by sports physiology to describe body composition tendencies: Ectomorphs tend to be lean with difficulty building muscle, Mesomorphs tend to be naturally muscular and respond well to training, and Endomorphs tend to store fat easily and have a wider bone structure. Modern science views these as descriptive tendencies on a spectrum, not fixed biological categories. Your somatotype can shift with training and nutrition. The two systems address different questions: body shape = "how do your proportions compare?" and somatotype = "what is your body composition tendency?"',
      },
      {
        question: 'Can I be "overweight" by BMI but healthy by WHR?',
        answer: 'Yes — and this is known as the "metabolically healthy obese" phenotype, though "metabolically healthy overweight" is more accurate. If your WHR is below 0.85 (women) or 0.90 (men) and your waist circumference is below 35 inches (women) or 40 inches (men), your cardiovascular risk may be lower than BMI alone suggests, even if your BMI exceeds 25. This typically occurs in people who carry excess weight in the hips and thighs (lower-body fat is metabolically protective — it traps fatty acids and produces beneficial adipokines like adiponectin) rather than the abdomen. However, "metabolically healthy obesity" is often a transient state — about 30-50% of people in this category transition to metabolically unhealthy within 5–10 years. The best health strategy regardless of body shape is to maintain WHR in the healthy range, exercise regularly, and eat a balanced diet.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Emma measures 36-27-39 (bust-waist-hip in inches) and wants to understand her body shape for both clothing fit and health awareness.',
        inputs: { unit: 'imperial', bust: '36', waist: '27', hip: '39' },
        result: 'Body shape: Hourglass. WHR: 0.69 (healthy range). Waist-to-Bust Ratio: 0.75. Measurements: 36-27-39 in.',
        insight: 'Emma has a classic hourglass shape with a WHR of 0.69 — well within the healthy range. Her waist is 25% smaller than her bust and 31% smaller than her hips, meeting the hourglass criterion of ≥15% difference in both ratios. From a health perspective, a WHR of 0.69 is excellent — it\'s associated with the lowest cardiovascular risk profile. From a fashion perspective, Emma can choose clothing that accentuates her defined waist. If her measurements change over time (e.g., the waist increases while bust and hips stay the same), her WHR would rise and she could shift toward an Apple or Rectangle shape, which would increase her health risk even without weight change.',
      },
      {
        scenario: 'Marcus measures 38-38-39 (chest-waist-hip in inches) and is concerned that his waist equals his chest measurement. He wants to know his shape and health risk.',
        inputs: { unit: 'imperial', bust: '38', waist: '38', hip: '39' },
        result: 'Body shape: Apple (Round). WHR: 0.97 (WHO elevated risk for men > 0.90). Waist-to-Bust Ratio: 1.00. Measurements: 38-38-39 in.',
        insight: 'Marcus has an Apple shape because his waist is ≥90% of both his bust and hip measurements. His WHR of 0.97 significantly exceeds the WHO male threshold of 0.90, indicating central obesity with elevated cardiovascular risk — independent of his total body weight. With waist = 38 inches (under the 40-inch risk threshold but with a high WHR), Marcus should focus on reducing abdominal fat. Research shows that a 2-inch (5 cm) reduction in waist circumference is associated with a 10–15% reduction in cardiovascular event risk. Marcus doesn\'t need to reach an "ideal" weight — losing 2-3 inches from his waist alone would shift his shape toward Rectangle and bring his WHR below 0.90, meaningfully reducing his risk. Specific strategies: reduce added sugar and refined carbohydrates, increase soluble fiber (10g/day of viscous fiber from oats, legumes, flaxseed reduces visceral fat accumulation), and add 2–3 sessions of resistance training per week.',
      },
      {
        scenario: 'Lena measures 96-72-100 (bust-waist-hip in cm) and wants to understand what her shape means for clothing fit, as she struggles to find pants that fit both her waist and hips.',
        inputs: { unit: 'metric', bust: '96', waist: '72', hip: '100' },
        result: 'Body shape: Pear (Triangle). WHR: 0.72 (healthy range). Waist-to-Bust Ratio: 0.75. Measurements: 96-72-100 cm.',
        insight: 'Lena is a Pear shape — her hips are significantly wider than her waist and bust. This is actually the healthiest fat distribution pattern because lower-body fat is metabolically protective. Her WHR of 0.72 is excellent. The clothing fit challenge Lena faces (pants fitting hips but gaping at the waist) is typical for Pear shapes. Fashion solutions: look for "curvy fit" jeans/pants that have a smaller waist-to-hip ratio built in, use a tailor to take in waistbands of pants that fit the hips, choose A-line dresses and skirts that skim over the hips, and consider wrap-style tops that emphasize the waist and bust to create visual balance. From a health perspective, Lena should track her waist measurement over time rather than total weight — as long as her waist stays ≤ 80 cm (31.5 inches, the WHO threshold for women), her health risk remains low regardless of hip measurement.',
      },
    ],
    proTips: [
      'Measure accurately — the difference between body shape categories can be as little as 1–2 inches in any single measurement. Even small measurement errors can change your classification. To confirm the calculator\'s result, check the waist-to-bust and waist-to-hip ratios: Hourglass = both ratios ≤ 0.85 (waist is at least 15% smaller than both bust and hips), Pear = WHR ≤ 0.85 but bust-to-waist ratio > 0.85, Inverted Triangle = bust-to-waist ratio ≤ 0.85 but WHR > 0.85, Apple = waist ≥ 90% of both bust and hip, Rectangle = none of the above conditions are met strongly.',
      'Track your WHR every 3–6 months, not just your weight. WHR responds to exercise and diet changes even when the scale doesn\'t move — this is because you can lose visceral fat while gaining muscle, resulting in no net weight change but a significantly healthier fat distribution. A 2018 study in the Journal of the American College of Cardiology found that people who reduced WHR by 0.05 had a 20% lower risk of major cardiovascular events regardless of weight change. This makes WHR arguably a better progress metric than pounds on the scale. Record your WHR alongside your measurements in a note or spreadsheet.',
      'Body shape does not determine what clothing you "should" wear — it simply explains why certain cuts and styles consistently fit or flatter you better. The most useful application is: when shopping, check whether a garment is designed for your proportions. For Pears, look for retailers that offer "curvy" or "fit-and-flare" cuts. For Inverted Triangles, consider open necklines and A-line skirts that create balance. For Apples, empire waistlines and structured fabrics provide definition. For Rectangles, belting and peplum details create waist illusion. Use the shape knowledge to filter options, not to limit yourself.',
      'The WHR health risk thresholds (0.85 for women, 0.90 for men) are from the WHO and are validated across multiple ethnic populations, but there are ethnicity-specific nuances. South Asian populations tend to develop metabolic complications (insulin resistance, type 2 diabetes) at lower WHR thresholds than European populations — some guidelines recommend WHR ≤ 0.80 for South Asian women and ≤ 0.85 for South Asian men. East Asian populations may also be at risk at slightly lower thresholds. If you have family history of type 2 diabetes or heart disease, aim for a WHR well below the general WHO thresholds rather than just at them.',
      'If you want to shift your body shape for health reasons, exercise selection matters as much as diet. To reduce WHR, prioritize: (1) high-intensity interval training (HIIT) — studies show it reduces visceral fat more effectively than steady-state cardio even at matched calorie burn, (2) compound resistance exercises (squats, deadlifts, rows, presses) that build total-body muscle and increase resting metabolic rate, and (3) adequate protein intake (1.6–2.2 g/kg body weight) to support muscle maintenance during fat loss. For Pears wanting more upper-body balance: add shoulder press, lateral raises, and lat pulldowns. For Apples wanting to reduce waist proportion: focus on HIIT and total-body compound lifts — spot reduction doesn\'t work, but visceral fat responds well to overall activity.',
      'Pregnancy, menopause, and aging all change body shape distribution in predictable ways. During pregnancy, the waist disappears as the uterus expands — postpartum measurements should be taken at least 3–4 months after delivery to allow tissues to settle. Menopause (typically ages 45–55) causes a hormonal shift where fat distribution moves from a Pear pattern (estrogen-driven, hip/thigh storage) toward an Apple pattern (lower estrogen, more central storage). This is why many women find their body shape "changes" in midlife even without weight gain — it is a normal hormonal transition, not a failure of diet or exercise. Adjust your health tracking accordingly: waist circumference monitoring becomes especially important after menopause.',
    ],
    limitations: [
      'Circumference-based only — body shape is classified from external measurements alone and does not account for body composition. An athletic person with broad shoulders from muscle may be classified as Inverted Triangle, which describes silhouette correctly but does not imply excess upper-body fat.',
      'Measurement variability — body shape can change with posture, breathing, bloating, and time of day. Morning vs. evening measurements can differ by 1–2 inches at the waist alone. Frame size (bone structure) is genetically determined and cannot be changed.',
      'Continuous spectrum oversimplification — many people fall between categories. The binary classification oversimplifies the natural diversity of human body shapes. The WHR health thresholds are population-level screening tools, not individual diagnostic criteria.',
      'The fashion shape system was developed for clothing fit, not health assessment. Do not interpret your shape category as a judgment on your body. For medical assessment of cardiovascular risk, consult a healthcare provider who can combine WHR with blood panels, family history, and lifestyle factors.',
    ],
    commonUses: [
      'Clothing and fashion fit — identify your body shape (pear, apple, hourglass, rectangle, inverted triangle) to choose clothing styles that flatter your proportions',
      'Health risk screening — use waist-to-hip ratio (WHR) to assess cardiovascular risk from central fat distribution, which is often more predictive of health outcomes than BMI alone',
      'Fitness programming — understand your somatotype tendencies (ectomorph, mesomorph, endomorph) to tailor training and nutrition approaches for your body composition',
      'Weight loss progress monitoring — track changes in waist-to-hip ratio over time as a meaningful health indicator that captures dangerous visceral fat reduction beyond scale weight'
    ],
    citations: [

      { source: 'NIH - Assessing Your Weight and Health Risk', url: 'https://www.nhlbi.nih.gov/health/educational/lose_wt/risk.htm' },
      { source: 'INTERHEART Study - WHR vs BMI', url: 'https://pubmed.ncbi.nlm.nih.gov/16271645/' },
    ],
  },
};

export default bodyTypeConfig;
