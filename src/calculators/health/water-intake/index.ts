import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import WaterIntakePanel from './WaterIntakePanel';

const waterIntakeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'weight',
      label: 'Body Weight',
      type: 'number',
      placeholder: '170',
      min: 0,
      step: 0.5,
      required: true,
      helpText: 'Base water intake is 0.5 oz per pound of body weight',
    },
    {
      id: 'unit',
      label: 'Weight Unit',
      type: 'select',
      required: true,
      helpText: 'Choose pounds (lbs) or kilograms (kg) for your body weight',
      options: [
        { label: 'Pounds (lbs)', value: 'lbs' },
        { label: 'Kilograms (kg)', value: 'kg' },
      ],
    },
    {
      id: 'activityLevel',
      label: 'Daily Activity Level',
      type: 'select',
      required: true,
      helpText: 'More activity means more water needed to replace sweat losses',
      options: [
        { label: 'Sedentary (office work, minimal movement)', value: 'sedentary' },
        { label: 'Lightly Active (light exercise 1-3 days)', value: 'light' },
        { label: 'Moderately Active (moderate exercise 3-5 days)', value: 'moderate' },
        { label: 'Very Active (hard exercise 6-7 days)', value: 'active' },
        { label: 'Athlete (2x daily training or physical job)', value: 'athlete' },
      ],
    },
    {
      id: 'climate',
      label: 'Climate / Environment',
      type: 'select',
      helpText: 'Hot or high-altitude environments increase your water needs',
      options: [
        { label: 'Temperate (mild climate, indoors)', value: 'normal' },
        { label: 'Hot / Humid (summer, tropical)', value: 'hot' },
        { label: 'Very Hot / Desert', value: 'extreme' },
        { label: 'High Altitude (above 8,000 ft / 2,400 m)', value: 'altitude' },
      ],
    },
  ],
  calculate: (values) => {
    const weight = parseFloat(values.weight);
    const unit = values.unit || 'lbs';
    const activity = values.activityLevel || 'sedentary';
    const climate = values.climate || 'normal';

    if (isNaN(weight) || weight <= 0) return [];

    const weightLbs = unit === 'lbs' ? weight : weight / 0.45359237;
    const baseOz = weightLbs * 0.5;

    const activityAdd: Record<string, number> = {
      sedentary: 0,
      light: 8,
      moderate: 16,
      active: 24,
      athlete: 32,
    };

    const climateAdd: Record<string, number> = {
      normal: 0,
      hot: 16,
      extreme: 24,
      altitude: 16,
    };

    const totalOz = baseOz + (activityAdd[activity] ?? 0) + (climateAdd[climate] ?? 0);
    const totalLiters = totalOz * 0.0295735;
    const totalCups = totalOz / 8;
    const totalMl = totalLiters * 1000;

    const fmt = (n: number) => n.toFixed(1);

    return [
      {
        id: 'liters',
        label: 'Daily Water Intake',
        value: `${fmt(totalLiters)} liters (${fmt(totalOz)} oz)`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'cups',
        label: 'In Cups (8 oz each)',
        value: `${Math.ceil(totalCups)} cups/day`,
        color: 'neutral',
      },
      {
        id: 'ml',
        label: 'In Milliliters',
        value: `${Math.round(totalMl)} mL/day`,
        color: 'neutral',
      },
      {
        id: 'baseIntake',
        label: 'Base Intake (weight-based)',
        value: `${fmt(baseOz * 0.0295735)} liters`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WaterIntakePanel, { values, results });
  },
  educational: {
    formula: 'Base Water (oz) = Body Weight (lbs) × 0.5 + Activity Adjustment + Climate Adjustment',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Daily Water Intake Guide</text><rect x="165" y="60" width="110" height="230" rx="8" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><rect x="167" y="180" width="106" height="108" rx="4" fill="var(--svg-3b82f6)" opacity=".4"/><ellipse cx="220" cy="180" rx="53" ry="5" fill="var(--svg-3b82f6)" opacity=".5"/><line x1="155" y1="110" x2="165" y2="110" stroke="var(--svg-333333)" stroke-width="1"/><text x="150" y="114" text-anchor="end" font-size="10" fill="var(--svg-333333)">~33%</text><line x1="155" y1="180" x2="165" y2="180" stroke="var(--svg-333333)" stroke-width="1"/><text x="150" y="184" text-anchor="end" font-size="10" fill="var(--svg-333333)">~66%</text><text x="220" y="315" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Base: 0.5 oz per lb body weight</text></svg>',
      alt: 'Water glass visual with fill levels showing approximate daily water intake fractions',
      caption: 'Daily water intake is 0.5 oz per pound of body weight plus adjustments for activity and climate',
    },
    formulaDescription:
      'Daily water intake is estimated at 0.5 oz per pound of body weight as a baseline, adjusted upward for physical activity and environmental heat. Individual needs vary significantly, so this provides a starting point for personal hydration planning.',
    variables: [
      { symbol: 'Base', name: 'Weight-Based Baseline', description: '0.5 oz of water per pound of body weight (or ~33 mL per kg). A 170 lb person needs ~85 oz (2.5 L) at baseline.' },
      { symbol: 'Activity Add', name: 'Activity Adjustment', description: 'Additional 8-32 oz based on exercise intensity and duration. A 60-minute run in warm weather can require 24+ oz of additional water.' },
      { symbol: 'Climate Add', name: 'Environment Adjustment', description: 'Additional 16-24 oz in hot or high-altitude environments. High altitude increases respiratory water loss and urination, raising total needs.' },
    ],
    howToUse: [
      'Enter your body weight and select the unit (lbs or kg).',
      'Select your daily activity level honestly — a desk job is very different from construction work.',
      'Select your climate or environment — hot, humid, or high-altitude conditions significantly increase needs.',
      'The result is your estimated daily water intake target in liters, ounces, and cups for practical tracking.',
      'Use this as a starting guideline, then adjust based on your thirst, urine color, and individual response.',
    ],
    explanation:
      'The common "drink 8 glasses of water a day" rule is an oversimplification. Individual water needs vary dramatically based on body size, activity level, climate, and diet. This calculator uses the widely cited 0.5 oz per pound of body weight as a baseline, then adds adjustments for exercise and environmental conditions. Note that roughly 20% of daily water intake typically comes from food, especially fruits and vegetables like watermelon, cucumbers, oranges, and lettuce. Coffee and tea also count toward hydration — despite being mild diuretics, the net hydration effect is positive in normal amounts. Dehydration of just 1-2% of body weight can impair cognitive function, mood, and physical performance. Athletes in particular need to pay attention to hydration before, during, and after exercise. In hot weather, sweat losses can exceed 2 liters per hour during intense activity. For most people, drinking when thirsty and monitoring urine color (pale yellow = well hydrated, dark yellow = drink more) are reliable daily hydration strategies. Older adults have reduced thirst sensation and should be more intentional about regular water intake throughout the day.',
    faqs: [
      {
        question: 'Does coffee or tea count toward my water intake?',
        answer: 'Yes. Despite being mild diuretics, caffeinated beverages still contribute net hydration. The fluid in coffee and tea exceeds the diuretic effect in normal consumption amounts. A cup of coffee provides roughly 80% of the hydration of the same volume of water.',
      },
      {
        question: 'What are signs of dehydration?',
        answer: 'Dark yellow urine, thirst, dry mouth, fatigue, and headache are early signs. Pale yellow urine is the goal. Clear urine may indicate overhydration. For athletes, a good rule is to weigh yourself before and after exercise — any weight lost is mostly water, and you should drink 16-24 oz per pound lost during your workout.',
      },
      {
        question: 'Can you drink too much water?',
        answer: 'Yes. Hyponatremia (water intoxication) can occur when drinking excessive water dilutes blood sodium levels. This is rare and primarily a risk for endurance athletes drinking only water without electrolytes during prolonged exercise lasting 4+ hours. Symptoms include nausea, headache, confusion, and in severe cases, seizures. Drink to thirst and include electrolytes during long workouts.',
      },
    ],
    commonUses: [
      'Daily hydration planning — get a personalized water intake target based on body weight, activity level, and climate instead of following the generic "8 glasses" rule',
      'Athletic hydration strategy — calculate additional water needs for exercise and hot conditions to prevent dehydration and maintain performance during training and competition',
      'Health optimization — use pale yellow urine as a daily hydration check, since even 1-2% dehydration can impair cognitive function, mood, and physical performance',
      'High altitude and hot climate adjustment — determine the extra water needed when traveling to hot destinations, high altitude locations, or during summer training blocks'
    ],
  
    citations: [
      { source: 'National Academies - Water Intake', url: 'https://www.nap.edu/catalog/10925/dietary-reference-intakes-for-water-potassium-sodium-chloride-and-sulfate' },
      { source: 'CDC - Water and Healthier Drinks', url: 'https://www.cdc.gov/nutrition/data-statistics/plain-water-the-healthier-choice.html' },
    ],
  },
};

export default waterIntakeConfig;
