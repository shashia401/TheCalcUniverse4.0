import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import OverweightPanel from './OverweightPanel';

const overweightConfig: CalculatorConfig = {
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
      label: 'Sex',
      type: 'select',
      required: true,
      helpText: 'Used for waist circumference thresholds (88 cm female, 102 cm male)',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      placeholder: '40',
      unit: 'years',
      min: 18,
      max: 120,
      step: 1,
      required: true,
      helpText: 'Used for risk assessment context, not directly in formulas',
    },
    {
      id: 'weight',
      label: 'Weight',
      type: 'number',
      placeholder: '200',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'Pounds (lbs) for Imperial · Kilograms (kg) for Metric',
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
      helpText: 'Imperial only — feet portion',
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
      id: 'waist',
      label: 'Waist Circumference',
      type: 'number',
      placeholder: '38',
      min: 0,
      step: 0.25,
      required: true,
      helpText: 'Measure at belly button level. Inches for Imperial, cm for Metric.',
    },
  ],
  calculate: (values) => {
    const unit = values.unit || 'imperial';
    const sex = values.sex || 'male';
    const age = parseFloat(values.age);

    let weightKg: number;
    let heightCm: number;
    let waistCm: number;

    if (unit === 'imperial') {
      weightKg = parseFloat(values.weight) * 0.45359237;
      const ft = parseFloat(values.heightFt) || 0;
      const inches = parseFloat(values.heightIn) || 0;
      const totalInches = ft * 12 + inches;
      if (totalInches <= 0) return [];
      heightCm = totalInches * 2.54;
      waistCm = parseFloat(values.waist) * 2.54;
    } else {
      weightKg = parseFloat(values.weight);
      heightCm = parseFloat(values.heightCm) || 0;
      waistCm = parseFloat(values.waist);
    }

    if ([weightKg, heightCm, waistCm, age].some(isNaN) || weightKg <= 0 || heightCm <= 0 || waistCm <= 0) return [];

    // BMI
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    const getBmiCategory = (b: number): { label: string; color: 'positive' | 'neutral' | 'negative' } => {
      if (b < 18.5) return { label: 'Underweight', color: 'negative' };
      if (b < 25) return { label: 'Normal Weight', color: 'positive' };
      if (b < 30) return { label: 'Overweight', color: 'neutral' };
      if (b < 35) return { label: 'Obese (Class I)', color: 'negative' };
      if (b < 40) return { label: 'Obese (Class II)', color: 'negative' };
      return { label: 'Obese (Class III — Severe)', color: 'negative' };
    };

    const bmiCategory = getBmiCategory(bmi);

    // WHtR
    const whtr = waistCm / heightCm;

    const getWhtrRisk = (w: number): { label: string; color: 'positive' | 'neutral' | 'negative'; desc: string } => {
      if (w < 0.4) return { label: 'Underweight range', color: 'negative', desc: 'Waist less than 40% of height — may indicate underweight' };
      if (w < 0.5) return { label: 'Healthy range', color: 'positive', desc: 'Waist less than half your height — low cardiovascular risk' };
      if (w < 0.6) return { label: 'Increased risk', color: 'neutral', desc: 'Waist 50–60% of height — elevated cardiovascular risk' };
      return { label: 'High risk', color: 'negative', desc: 'Waist over 60% of height — significantly elevated risk' };
    };

    const whtrRisk = getWhtrRisk(whtr);

    // Combined risk assessment
    const isHighWhtr = whtr >= 0.5;
    const isHighBmi = bmi >= 25;

    let riskNarrative: string;
    let riskColor: 'positive' | 'neutral' | 'negative';

    if (!isHighBmi && !isHighWhtr) {
      riskNarrative = 'Low risk — both BMI and WHtR are in the healthy range. Maintain current lifestyle.';
      riskColor = 'positive';
    } else if (isHighWhtr && !isHighBmi) {
      riskNarrative = 'Moderate risk — your weight is in the normal BMI range but your waist-to-height ratio is elevated. This suggests central fat distribution ("normal weight obesity") which carries cardiovascular risk independent of BMI.';
      riskColor = 'neutral';
    } else if (isHighBmi && !isHighWhtr) {
      riskNarrative = 'Moderate risk — your BMI is elevated but your waist-to-height ratio is healthy. If you carry significant muscle mass, BMI may overestimate body fat. WHtR is a better metabolic risk predictor for athletic individuals.';
      riskColor = 'neutral';
    } else {
      riskNarrative = 'Elevated risk — both BMI and waist-to-height ratio indicate increased cardiovascular risk. This combination of high weight and central fat distribution is associated with higher risk of type 2 diabetes, hypertension, and cardiovascular disease.';
      riskColor = 'negative';
    }

    // "Metabolic age" at waist threshold
    const waistThreshold = sex === 'male' ? 102 : 88; // cm — IDF criteria
    const waistExcess = waistCm - waistThreshold;

    return [
      {
        id: 'bmiScore',
        label: 'BMI',
        value: `${bmi.toFixed(1)} — ${bmiCategory.label}`,
        highlight: true,
        color: bmiCategory.color,
      },
      {
        id: 'whtr',
        label: 'Waist-to-Height Ratio (WHtR)',
        value: `${whtr.toFixed(3)} — ${whtrRisk.label}`,
        highlight: true,
        color: whtrRisk.color,
      },
      {
        id: 'combinedRisk',
        label: 'Cardiovascular Risk Assessment',
        value: riskNarrative,
        color: riskColor,
      },
      {
        id: 'waistStatus',
        label: 'Waist Circumference Status',
        value: waistExcess > 0
          ? waistCm.toFixed(1) + ' cm — ' + Math.round(waistExcess) + ' cm above the ' + (sex === 'male' ? '102 cm' : '88 cm') + ' threshold for metabolic syndrome risk'
          : waistCm.toFixed(1) + ' cm — Below the ' + (sex === 'male' ? '102 cm' : '88 cm') + ' metabolic syndrome threshold',
        color: waistExcess > 0 ? 'negative' : 'positive',
      },
      {
        id: 'visceralFatNote',
        label: 'Visceral Fat Context',
        value: whtr >= 0.5
          ? 'Elevated WHtR suggests excess visceral fat (belly fat stored around organs), which is more metabolically harmful than subcutaneous fat.'
          : 'WHtR below 0.5 suggests healthy fat distribution with minimal visceral fat.',
        color: whtr >= 0.5 ? 'negative' : 'positive',
      },
      {
        id: 'healthDisclaimer',
        label: 'Medical Context',
        value: 'This assessment combines BMI and WHtR for a more complete risk picture. However, it is a screening tool — not a diagnosis. Individual risk depends on genetics, lifestyle, blood pressure, cholesterol, blood sugar, and other factors.',
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(OverweightPanel, { values, results });
  },
  educational: {
    formula: 'BMI = Weight(kg) ÷ Height²(m) | WHtR = Waist(cm) ÷ Height(cm) | Visceral fat threshold: Waist > 88cm (F) / 102cm (M)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">BMI Categories with Overweight Highlighted</text><rect x="30" y="70" width="380" height="50" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="70" width="130" height="50" rx="4" fill="var(--svg-22c55e)" opacity=".3"/><text x="95" y="100" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)" font-weight="bold">Normal &lt; 25</text><rect x="160" y="70" width="80" height="50" fill="var(--svg-f59e0b)" opacity=".6"/><text x="200" y="100" text-anchor="middle" font-size="11" fill="var(--svg-f59e0b)" font-weight="bold">Overweight</text><rect x="240" y="70" width="170" height="50" rx="4" fill="var(--svg-ef4444)" opacity=".3"/><text x="325" y="100" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)" font-weight="bold">Obese &ge; 30</text><text x="220" y="160" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)">Overweight is BMI 25-29.9</text><text x="220" y="185" text-anchor="middle" font-size="11" fill="var(--svg-666666)">WHtR gives a more complete risk picture</text></svg>',
      alt: 'BMI scale with the overweight range (25-29.9) highlighted in amber',
      caption: 'Overweight is defined as BMI 25-29.9; combining with WHtR gives a fuller cardiovascular risk picture',
    },
    formulaDescription:
      'This calculator combines two key metrics: BMI (body mass index) and WHtR (waist-to-height ratio). While BMI is a useful population-level screening tool, it cannot distinguish muscle from fat. WHtR captures fat distribution — specifically dangerous visceral fat stored around internal organs. Research shows WHtR is a stronger predictor of cardiovascular risk than BMI alone.',
    variables: [
      { symbol: 'BMI', name: 'Body Mass Index', description: 'Weight-to-height ratio. Screening tool — does not measure body fat directly or account for fat distribution.' },
      { symbol: 'WHtR', name: 'Waist-to-Height Ratio', description: 'Waist circumference divided by height. A WHtR below 0.5 ("keep your waist to less than half your height") is associated with low cardiovascular risk.' },
      { symbol: 'Visceral Fat', name: 'Visceral Adipose Tissue', description: 'Fat stored around abdominal organs (liver, pancreas, intestines). Metabolically active — releases inflammatory cytokines and free fatty acids that drive insulin resistance.' },
    ],
    howToUse: [
      'Select your unit system and enter your sex, age, weight, and height.',
      'Measure your waist at the level of your belly button while standing relaxed.',
      'Enter your waist circumference and review both your BMI and WHtR.',
      'Read the combined cardiovascular risk assessment — this is the key output.',
      'Discuss results with a healthcare provider for a complete risk evaluation.',
    ],
    explanation:
      'The term "overweight" is traditionally defined by BMI (25–29.9), but this tells only part of the story. A more clinically meaningful approach combines BMI with the waist-to-height ratio (WHtR) because fat distribution matters more than fat quantity. Visceral fat — the fat stored deep in the abdomen around the liver, pancreas, and intestines — is metabolically active and drives insulin resistance, inflammation, and cardiometabolic disease. Two people with the same BMI can have vastly different health risks depending on where they store fat. This is why waist circumference and WHtR are better predictors of health outcomes than BMI alone in most populations. The simple rule "keep your waist less than half your height" (WHtR < 0.5) is a practical, evidence-based target. For practical context: a 5\'10" person weighing 210 lbs has a BMI of 30.1 (obese). If their waist is 38 inches, their WHtR is 0.54 — elevated risk. But if they are a muscular athlete with a 34-inch waist, their WHtR is 0.49 (healthy), putting them in a much lower risk category despite the obese BMI classification. This combined assessment approach provides more individualized and clinically useful information than BMI alone. Visceral fat is particularly dangerous because it releases inflammatory cytokines (chemicals that promote systemic inflammation) and free fatty acids directly into the portal vein, which flows to the liver, contributing to fatty liver disease and disrupting glucose and lipid metabolism. Even modest weight loss of 5-10% can significantly reduce visceral fat stores and improve metabolic health markers such as blood pressure, triglycerides, and fasting glucose.',
    faqs: [
      {
        question: 'Can I be "overweight" by BMI but still healthy?',
        answer: 'Yes. Research shows that metabolically healthy obesity exists — some people with a BMI over 30 have normal blood pressure, cholesterol, and blood sugar. However, metabolically healthy obesity is often a transient state, and the risk of developing cardiometabolic disease increases over time. WHtR < 0.5 in an overweight individual suggests lower risk.',
      },
      {
        question: 'How do I reduce visceral fat?',
        answer: 'Visceral fat is highly responsive to lifestyle changes. The most effective strategies: calorie deficit (even modest 5% weight loss significantly reduces visceral fat), aerobic exercise (brisk walking, running, cycling 150+ min/week), adequate protein (preserves lean mass during weight loss), stress management (cortisol drives visceral fat storage), and adequate sleep (<7 hours is linked to more visceral fat). Spot reduction is impossible — overall fat loss reduces visceral fat.',
      },
      {
        question: 'Is WHtR more accurate than BMI?',
        answer: 'For predicting cardiovascular risk, WHtR is generally more accurate than BMI in most populations. A 2012 meta-analysis found WHtR was a significantly better predictor of diabetes, hypertension, and cardiovascular events than BMI. The "waist less than half height" rule (<0.5) is simple and has strong evidence backing it across age groups, sexes, and ethnicities.',
      },
    ],
    commonUses: [
      'Health risk screening — combine BMI with WHtR to get a more complete cardiovascular risk picture than BMI alone, especially for identifying "normal weight obesity"',
      'Weight management motivation — use the dual-metric assessment (BMI + WHtR) with combined risk narrative to set informed weight and waist reduction goals',
      'Visceral fat awareness — learn how waist circumference above metabolic syndrome thresholds (88 cm female / 102 cm male) indicates dangerous visceral fat around internal organs',
      'Annual checkup preparation — assess your own risk metrics before a doctor visit to have an informed discussion about cardiovascular health and weight management strategies'
    ],
  
    citations: [
      { source: 'CDC - Adult Obesity Facts', url: 'https://www.cdc.gov/obesity/data/adult.html' },
      { source: 'WHO - Obesity and Overweight', url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight' },
    ],
  },
};

export default overweightConfig;
