import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HealthyWeightPanel from './HealthyWeightPanel';

const healthyWeightConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
      helpText: 'Choose Imperial (lbs, ft/in) or Metric (kg, cm) for your measurements',
      options: [
        { label: 'Imperial (lbs, ft & in)', value: 'imperial' },
        { label: 'Metric (kg, cm)', value: 'metric' },
      ],
    },
    {
      id: 'sex',
      label: 'Biological Sex',
      type: 'select',
      required: true,
      helpText: 'Used for Devine formula and WHtR health risk thresholds',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      placeholder: '30',
      unit: 'years',
      min: 18,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Used for general assessment context alongside BMI and WHtR',
    },
    {
      id: 'weight',
      label: 'Current Weight',
      type: 'number',
      placeholder: '170',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'For calculating Waist-to-Height Ratio and BMI.',
    },
    {
      id: 'waist',
      label: 'Waist Circumference',
      type: 'number',
      placeholder: '34',
      unit: 'in / cm',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'Measured at navel level (men) or narrowest point (women). Used for WHtR.',
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
      helpText: 'Imperial only',
      showWhen: (v) => v.unit === 'imperial',
    },
    {
      id: 'heightIn',
      label: 'Height — Inches',
      type: 'number',
      placeholder: '10',
      unit: 'in',
      min: 0,
      max: 11,
      step: 1,
      helpText: 'Imperial only — remaining inches (0–11)',
      showWhen: (v) => v.unit === 'imperial',
    },
    {
      id: 'heightCm',
      label: 'Height — Centimeters',
      type: 'number',
      placeholder: '178',
      unit: 'cm',
      min: 0,
      step: 0.1,
      helpText: 'Metric only',
      showWhen: (v) => v.unit === 'metric',
    },
    {
      id: 'frameSize',
      label: 'Frame Size',
      type: 'select',
      options: [
        { label: 'Small Frame', value: 'small' },
        { label: 'Medium Frame (Default)', value: 'medium' },
        { label: 'Large Frame', value: 'large' },
      ],
      helpText: 'Based on wrist circumference or elbow breadth. Medium is the default.',
    },
  ],
  calculate: (values) => {
    const unit = values.unit || 'imperial';
    const sex = values.sex || 'male';
    const age = parseFloat(values.age);
    const weight = parseFloat(values.weight);
    const waist = parseFloat(values.waist);
    const frameSize = values.frameSize || 'medium';

    let weightKg: number;
    let heightCm: number;
    let waistCm: number;

    if (unit === 'imperial') {
      weightKg = weight * 0.45359237;
      const ft = parseFloat(values.heightFt) || 0;
      const inches = parseFloat(values.heightIn) || 0;
      const totalInches = ft * 12 + inches;
      if (totalInches <= 0) return [];
      heightCm = totalInches * 2.54;
      waistCm = waist * 2.54;
    } else {
      weightKg = weight;
      heightCm = parseFloat(values.heightCm) || 0;
      if (heightCm <= 0) return [];
      waistCm = waist;
    }

    if ([weightKg, heightCm, waistCm, age].some(isNaN) || weightKg <= 0 || heightCm <= 0 || waistCm <= 0) return [];

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    // Healthy BMI range
    const bmiHealthyLow = 18.5;
    const bmiHealthyHigh = 24.9;
    const healthyWeightLowKg = bmiHealthyLow * heightM * heightM;
    const healthyWeightHighKg = bmiHealthyHigh * heightM * heightM;

    // Frame-adjusted target (within healthy BMI range)
    const frameAdjust: Record<string, number> = { small: 0.45, medium: 0.5, large: 0.55 };
    const frameMid = frameAdjust[frameSize] ?? 0.5;
    const adjustedTargetKg = healthyWeightLowKg + (healthyWeightHighKg - healthyWeightLowKg) * frameMid;

    // Waist-to-Height Ratio (WHtR)
    const whtr = waistCm / heightCm;
    const whtrCategory = whtr <= 0.4
      ? 'Underweight (may indicate nutritional deficiency)'
      : whtr <= 0.5
      ? 'Healthy — low health risk'
      : whtr <= 0.6
      ? 'Increased health risk — consider weight management'
      : 'High health risk — action recommended';

    const whtrColor: 'positive' | 'negative' | 'neutral' = whtr <= 0.5 ? 'positive' : whtr <= 0.6 ? 'neutral' : 'negative';

    // BMI category
    const bmiCategory = bmi < 18.5
      ? 'Underweight'
      : bmi < 25
      ? 'Normal weight'
      : bmi < 30
      ? 'Overweight'
      : 'Obese';

    // Ideal body weight (Devine, for reference)
    const totalInches = heightCm / 2.54;
    const inchesOver5ft = Math.max(0, totalInches - 60);
    const devineKg = sex === 'male' ? 50 + 2.3 * inchesOver5ft : 45.5 + 2.3 * inchesOver5ft;

    const fmt1 = (n: number) => n.toFixed(1);
    const displayKg = (n: number) => unit === 'imperial' ? `${(n / 0.45359237).toFixed(0)} lbs` : `${fmt1(n)} kg`;

    return [
      {
        id: 'healthyWeightRange',
        label: `Healthy Weight Range (BMI 18.5–24.9 for ${heightM.toFixed(2)}m)`,
        value: `${displayKg(healthyWeightLowKg)} – ${displayKg(healthyWeightHighKg)}`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'adjustedTarget',
        label: `Adjusted Target (${frameSize} frame)`,
        value: displayKg(adjustedTargetKg),
        color: 'neutral',
      },
      {
        id: 'devineIdeal',
        label: 'Devine Ideal Weight (reference)',
        value: displayKg(devineKg),
        color: 'neutral',
      },
      {
        id: 'bmi',
        label: `BMI — ${bmiCategory}`,
        value: fmt1(bmi),
        color: bmiCategory === 'Normal weight' ? 'positive' : bmiCategory === 'Underweight' ? 'neutral' : 'negative',
      },
      {
        id: 'whtr',
        label: `Waist-to-Height Ratio (WHtR)`,
        value: `${fmt1(whtr)} — ${whtrCategory}`,
        color: whtrColor,
      },
      {
        id: 'whtrThreshold',
        label: 'WHtR Health Threshold',
        value: `Healthy: < 0.5 · Waist should be less than half your height`,
        color: whtr <= 0.5 ? 'positive' : 'negative',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HealthyWeightPanel, { values, results });
  },
  educational: {
    formula: 'WHtR = Waist (cm) ÷ Height (cm) | Healthy BMI = 18.5–24.9 | Both metrics combined give a holistic assessment',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">BMI Scale with Healthy Zone Highlighted</text><rect x="30" y="70" width="380" height="50" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="70" width="117" height="50" rx="4" fill="var(--svg-f59e0b)" opacity=".3"/><text x="88" y="100" text-anchor="middle" font-size="11" fill="var(--svg-f59e0b)" font-weight="bold">Underweight &lt; 18.5</text><rect x="147" y="70" width="101" height="50" fill="var(--svg-22c55e)" opacity=".3"/><text x="197" y="100" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)" font-weight="bold">Healthy 18.5-24.9</text><rect x="248" y="70" width="98" height="50" fill="var(--svg-f59e0b)" opacity=".3"/><text x="297" y="100" text-anchor="middle" font-size="11" fill="var(--svg-f59e0b)" font-weight="bold">Overweight 25-29.9</text><rect x="346" y="70" width="64" height="50" rx="4" fill="var(--svg-ef4444)" opacity=".3"/><text x="378" y="100" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)" font-weight="bold">Obese &ge; 30</text><text x="220" y="155" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)">WHtR: keep waist less than half your height</text><text x="220" y="180" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Frame size shifts ideal within the healthy zone</text></svg>',
      alt: 'BMI scale bar from underweight through healthy to obese with healthy zone in green',
      caption: 'Healthy BMI range is 18.5-24.9; WHtR under 0.5 provides a second independent health target',
    },
    formulaDescription:
      'Healthy weight is a range, not a single number. BMI provides population-level screening, WHtR adds abdominal fat assessment, and frame size adjusts for skeletal structure. Using all three metrics together provides a more complete picture than BMI alone.',
    variables: [
      { symbol: 'BMI', name: 'Body Mass Index', description: 'Weight-to-height ratio used for population screening. Inaccurate for athletes, elderly, and muscular individuals.' },
      { symbol: 'WHtR', name: 'Waist-to-Height Ratio', description: 'Waist circumference divided by height. A WHtR under 0.5 ("keep your waist to less than half your height") is a strong predictor of metabolic health.' },
      { symbol: 'Frame Size', name: 'Frame Size Adjustment', description: 'Small/medium/large based on skeletal structure affects where within the healthy BMI range your ideal weight falls.' },
    ],
    howToUse: [
      'Enter your sex, age, current weight, and waist circumference.',
      'Enter your height.',
      'Select your frame size (small, medium, or large) — medium is default.',
      'Review your healthy weight range, WHtR, BMI, and frame-adjusted target.',
      'The WHtR metric ("waist less than half your height") is a simple health benchmark independent of your weight.',
    ],
    explanation:
      '"Healthy weight" is a range derived from population data where morbidity and mortality are lowest. It is not a cosmetic ideal or a one-size-fits-all prescription. BMI 18.5–24.9 corresponds to the weight range where all-cause mortality is lowest at the population level. Waist-to-Height Ratio (WHtR) is a superior metric because it captures abdominal fat distribution — the type of fat most strongly linked to metabolic disease. The "waist less than half your height" rule (WHtR < 0.5) is simple, cross-culturally valid, and independent of weight. Frame size adjusts for the fact that people with larger skeletons can carry more weight healthfully within the normal BMI range. A person with a large frame might be healthy at BMI 24, while someone with a small frame might be healthier at BMI 20. These three metrics together provide a much more complete picture than BMI alone. For instance, a 5\'8" (173 cm) person weighing 165 lbs has a BMI of 25.1, technically "overweight." But if their waist is 31 inches (WHtR 0.45), they have low cardiovascular risk and their BMI classification is misleading. The converse is also true: a person with a "normal" BMI of 22 but a waist of 36 inches (WHtR 0.53) has elevated health risk despite their healthy scale weight — a condition called normal weight obesity.',
    faqs: [
      {
        question: 'Is BMI outdated?',
        answer: 'BMI is not outdated — it remains the standard population screening tool. But it was never designed for individual diagnosis. BMI misses sarcopenic obesity (normal weight but low muscle, high fat) and misclassifies athletes. Modern assessments pair BMI with WHtR or body fat % for individual accuracy.',
      },
      {
        question: 'What is the "waist less than half your height" rule?',
        answer: 'The WHtR < 0.5 guideline, popularized by Dr. Margaret Ashwell, is a simple health screen: measure your waist circumference and keep it below half your height. For a 5\'10" (70"/178cm) person, that means a waist under 35"/89cm. This correlates strongly with metabolic health markers.',
      },
      {
        question: 'How do I determine my frame size?',
        answer: 'Frame size is estimated from wrist circumference or elbow breadth relative to height. Wrap your thumb and middle finger around your opposite wrist — if they overlap, you have a small frame; if they touch, medium; if they do not touch, large. Alternatively, measure your wrist circumference: small (< 6.25" for women, < 6.5" for men), medium (6.25–6.75" women, 6.5–7.5" men), large (> 6.75" women, > 7.5" men). Height-adjusted elbow breadth measurements (using a caliper) are the most accurate method. Frame size shifts where within the healthy BMI range your target weight falls — small frames tend toward the lower end, large frames toward the upper end.',
      },
    ],
    commonUses: [
      'Weight management goal setting — determine your healthy weight range using BMI, WHtR, and frame size for a personalized target rather than a single number',
      'Metabolic health screening — combine BMI and WHtR to identify "normal weight obesity" where a normal BMI masks elevated waist-to-height ratio and cardiovascular risk',
      'Fitness baseline assessment — use the frame-adjusted healthy weight target to set realistic body weight goals that account for skeletal structure',
      'Annual health checkup reference — track healthy weight metrics year over year to catch gradual changes in body composition or fat distribution before they become health concerns'
    ],
  
    citations: [
      { source: 'CDC - Healthy Weight', url: 'https://www.cdc.gov/healthyweight/' },
      { source: 'NIH - NHLBI Obesity Guidelines', url: 'https://www.nhlbi.nih.gov/health/overweight-and-obesity' },
    ],
  },
};

export default healthyWeightConfig;
