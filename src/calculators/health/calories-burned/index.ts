import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import CaloriesBurnedPanel from './CaloriesBurnedPanel';
import { ACTIVITIES } from './activities';

const caloriesBurnedConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Weight Unit',
      type: 'select',
      required: true,
      helpText: 'Choose pounds (lbs) or kilograms (kg) for your body weight',
      options: [
        { label: 'Pounds (lbs)', value: 'imperial' },
        { label: 'Kilograms (kg)', value: 'metric' },
      ],
    },
    {
      id: 'weight',
      label: 'Body Weight',
      type: 'number',
      placeholder: '170',
      inputMode: 'decimal',
      min: 0,
      step: 0.5,
      required: true,
      helpText: 'Heavier individuals burn more calories for the same activity',
    },
    {
      id: 'activity',
      label: 'Activity',
      type: 'select',
      required: true,
      helpText: 'Choose your activity — MET values come from the Compendium of Physical Activities',
      options: ACTIVITIES.flatMap(cat => cat.items.map(item => ({
        label: `${item.label} (${cat.category})`,
        value: item.id,
      }))),
    },
    {
      id: 'duration',
      label: 'Duration',
      type: 'number',
      placeholder: '30',
      unit: 'minutes',
      inputMode: 'decimal',
      min: 1,
      max: 600,
      step: 1,
      required: true,
      helpText: 'Total minutes spent performing the selected activity',
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const unit = values.unit || 'imperial';
    const weight = parseFloat(values.weight);
    const activityId = values.activity || 'run_6mph';
    const durationMin = parseFloat(values.duration);

    const weightKg = unit === 'imperial' ? weight * 0.45359237 : weight;
    if ([weightKg, durationMin].some(isNaN) || weightKg <= 0 || durationMin <= 0) return [];

    // Find activity MET
    const allActivities = ACTIVITIES.flatMap(cat => cat.items);
    const activityObj = allActivities.find(a => a.id === activityId);
    if (!activityObj) return [];

    const met = activityObj.met;
    const hours = durationMin / 60;

    // Calories = MET × weight(kg) × time(hrs)
    const calories = met * weightKg * hours;
    const caloriesPerMin = calories / durationMin;

    return [
      {
        id: 'caloriesBurned',
        label: `Calories Burned — ${activityObj.label}`,
        value: `${Math.round(calories)} kcal`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'calPerMin',
        label: 'Calories Per Minute',
        value: `${caloriesPerMin.toFixed(1)} kcal/min`,
        color: 'neutral',
      },
      {
        id: 'metValue',
        label: 'MET Value (Compendium of Physical Activities)',
        value: `${met.toFixed(1)} METs`,
        color: 'neutral',
      },
      {
        id: 'formulaLine',
        label: 'Calculation',
        value: `${met} MET × ${weightKg.toFixed(1)} kg × ${hours.toFixed(2)} hr = ${Math.round(calories)} kcal`,
        color: 'neutral',
      },
      {
        id: 'activityLabel',
        label: 'Activity',
        value: activityObj.label,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CaloriesBurnedPanel, { values, results });
  },
  educational: {
    formula: 'Calories = MET × Weight (kg) × Duration (hours)',
    formulaDescription:
      'The Metabolic Equivalent of Task (MET) system provides standardized energy cost values for hundreds of physical activities. One MET = 1 kcal/kg/hour (the energy cost of sitting quietly). This formula derives from the 2011 Compendium of Physical Activities.',
    diagram: {
      svg: '<svg viewBox="0 0 420 230" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="210" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Calories Burned by Activity (per hour)</text>' +
        '<!-- Walking --><rect x="30" y="35" width="80" height="24" rx="4" fill="var(--svg-22c55e)"/><text x="120" y="52" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">Walking (3 mph)</text>' +
        '<!-- Yoga --><rect x="30" y="67" width="100" height="24" rx="4" fill="var(--svg-3b82f6)"/><text x="140" y="84" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">Yoga</text>' +
        '<!-- Cycling --><rect x="30" y="99" width="150" height="24" rx="4" fill="var(--svg-f59e0b)"/><text x="190" y="116" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">Cycling (12-14 mph)</text>' +
        '<!-- Running --><rect x="30" y="131" width="200" height="24" rx="4" fill="var(--svg-ef4444)"/><text x="240" y="148" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">Running (6 mph)</text>' +
        '<!-- Swimming --><rect x="30" y="163" width="160" height="24" rx="4" fill="var(--svg-8b5cf6)"/><text x="200" y="180" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">Swimming</text>' +
        '<text x="210" y="215" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Based on a 155 lb (70 kg) person — actual burn varies by weight and intensity</text>' +
        '</svg>',
      alt: 'Horizontal bar chart comparing calories burned per hour across walking, yoga, cycling, running, and swimming',
      caption: 'Higher intensity and weight-bearing activities burn significantly more calories per hour',
    },
    variables: [
      { symbol: 'MET', name: 'Metabolic Equivalent of Task', description: 'A standardized unit representing the energy cost of a specific activity. 1 MET = energy expended at rest. Running at 6 mph is ~9.8 METs.' },
      { symbol: 'Weight', name: 'Body Weight (kg)', description: 'Heavier individuals burn more calories doing the same activity because more mass requires more energy to move.' },
      { symbol: 'Duration', name: 'Exercise Duration', description: 'Total time spent performing the activity. Longer durations proportionally increase total calorie burn.' },
    ],
    howToUse: [
      'Select your weight unit and enter your body weight.',
      'Choose an activity from the categorized list (100+ activities from the Compendium of Physical Activities).',
      'Enter the duration of your activity in minutes.',
      'Review your estimated calorie burn, MET value, and per-minute rate.',
      'Compare different activities at the same duration to see which burns more calories for your body weight.',
    ],
    explanation:
      'The Compendium of Physical Activities is the gold-standard reference for MET values, maintained by researchers at Arizona State University and the National Cancer Institute. It provides standardized energy cost estimates for 800+ activities. The formula Calories = MET × weight(kg) × time(hours) estimates the total energy expenditure of an activity above and beyond resting metabolism (the MET value already excludes the 1 MET baseline). Actual calorie burn varies by individual due to fitness level, body composition, exercise efficiency, and environmental conditions. Fitter individuals may burn slightly fewer calories doing the same activity because their bodies are more efficient. For example, a 155 lb person running at 6 mph for 30 minutes burns approximately 355 calories, while a 185 lb person doing the same run burns about 425 calories — the 30 lb weight difference accounts for roughly 70 additional calories burned. Similarly, running on a treadmill (no wind resistance, flat surface) burns about 5% fewer calories than outdoor running on a flat route. The MET values assume "steady state" effort — stop-and-go activities like basketball or tennis have variable intensity that the average MET smooths out. The values here are estimates, not precise measurements. Using a heart rate monitor provides more individualized calorie burn data because it accounts for your actual physiological response rather than population averages.',
    faqs: [
      {
        question: 'How accurate are MET-based calorie estimates?',
        answer: 'MET estimates are ±15–20% for most people. Individual factors like fitness level, body composition, terrain, temperature, and exercise efficiency cause significant variation. Heart rate-based estimates are more accurate for individuals. These values are best used for general planning.',
      },
      {
        question: 'Do I burn more calories if I am less fit?',
        answer: 'Yes — for the same activity, less fit individuals typically burn more calories because their bodies are less efficient. As you become more conditioned, your body performs the same work with less energy. This is called "metabolic efficiency."',
      },
      {
        question: 'Why are there different MET values for different speeds?',
        answer: 'Energy expenditure increases non-linearly with speed. Running at 5 mph (~8.3 METs) uses less than 60% of the energy of running at 10 mph (~14.5 METs), even though the speed is doubled. At higher speeds, biomechanical efficiency decreases.',
      },
      {
        question: 'Does running on a treadmill burn fewer calories than running outdoors?',
        answer: 'Yes — by approximately 5%. Treadmill running eliminates wind resistance and the need to propel yourself forward against air drag. Outdoor running on a flat route requires about 5% more energy than treadmill running at the same speed and grade. Adding a 1% incline to the treadmill can compensate for this difference.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    commonUses: [
      'Exercise program design — estimate calorie burn for 100+ activities to plan workouts that match your energy expenditure goals',
      'Weight management — track exercise calories to manage your daily energy balance alongside dietary intake',
      'Activity comparison — compare different exercises and intensities to find activities that match your fitness preferences and calorie burn goals',
      'Training logging — estimate per-session and per-minute calorie expenditure for training logs and fitness tracking apps'
    ],
  
    
    workedExamples: [
      {
        scenario: 'Sarah, 32, weighs 155 lbs (70 kg) and runs at 6 mph (10 min/mile pace) on a treadmill for 30 minutes, 3 times per week. She wants to know how many calories each session burns and how this contributes to her weight management goals.',
        inputs: { Weight: '155 lbs', Activity: 'Running 6 mph (9.8 METs)', 'Duration': '30 minutes' },
        result: 'Each 30-minute run at 6 mph burns approximately 343 kcal for a 155 lb person. Over 3 weekly sessions, the total is about 1,029 kcal — roughly equivalent to 0.13 kg (0.29 lb) of body fat per week, or 6.8 kg (15 lbs) over a year if diet remains constant.',
        insight: 'Sarah\'s running habit is a substantial contributor to her energy balance. The 1,029 kcal/week from running means she can eat ~147 kcal more per day and still maintain her weight compared to if she were completely sedentary. This is why regular exercisers can eat more while staying lean — their TDEE is simply higher. However, she should be aware that the "afterburn effect" (EPOC) from moderate steady-state running is minimal — only about 5-10% of the exercise calories, or ~17-34 extra kcal per session. High-intensity interval training (HIIT) produces a larger EPOC (10-15%), but steady-state cardio\'s primary calorie burn happens during the activity itself. To lose 0.5 kg/week, Sarah would need to create a total 3,850 kcal weekly deficit through a combination of diet and exercise — her running provides about 27% of that target.',
      },
      {
        scenario: 'Mike, 28, weighs 200 lbs (90.7 kg) and is comparing two options for his lunch break: a 45-minute walk at 3 mph, or a 20-minute vigorous swim. He has a knee injury and wants to maximize calorie burn within his fitness constraints.',
        inputs: { Weight: '200 lbs', 'Activity (Option A)': 'Walking 3 mph (3.3 METs)', 'Duration A': '45 min', 'Activity (Option B)': 'Swimming vigorous (10.0 METs)', 'Duration B': '20 min' },
        result: 'Option A (walking 45 min): ~225 kcal. Option B (vigorous swimming 20 min): ~302 kcal. Swimming burns 34% more calories in less than half the time, and is joint-friendly for Mike\'s knee.',
        insight: 'MET values reveal a critical training principle: intensity drives efficiency. Swimming at 10 METs packs 10 kcal per kg per hour of energy expenditure, while walking at 3.3 METs delivers only 3.3 kcal per kg per hour. For Mike\'s 90.7 kg body, swimming delivers roughly 908 kcal/hour vs. 300 kcal/hour for walking — a 3:1 advantage. The trade-off is recovery cost: a 20-minute vigorous swim imposes significantly more central nervous system and muscular fatigue than a 45-minute leisurely walk. For daily activity (active recovery), the walk is sustainable. For a targeted calorie-burning session 2-3 times per week, swimming is superior. Given his knee injury, swimming also provides zero-impact exercise that walking (even at a slow pace) may aggravate. The optimal approach: walk most days for general activity and recovery, with 2-3 vigorous swim sessions per week for targeted calorie burning.',
      },
      {
        scenario: 'Emma, 40, weighs 130 lbs (59 kg) and cycles at a moderate pace (12-14 mph, 8.0 METs) for her 60-minute weekend ride. She wants to know how many calories she actually burns, and whether the post-ride café stop (latte and muffin: ~550 kcal) offsets her entire workout.',
        inputs: { Weight: '130 lbs', Activity: 'Cycling 12-14 mph (8.0 METs)', 'Duration': '60 minutes' },
        result: '60 minutes of moderate cycling at 12-14 mph burns approximately 472 kcal for a 130 lb person. The latte and muffin (550 kcal) exceeds the workout burn by 78 kcal — meaning the net energy impact of "ride + café" is a slight surplus.',
        insight: 'Emma\'s experience is a classic "reward calories" trap. The cycling session burns 472 kcal — a respectable effort — but the post-ride treat at 550 kcal converts the workout from a calorie deficit into a surplus. Over a year of weekly rides with the same café stop, that 78 kcal surplus per ride amounts to 4,056 kcal — about 0.53 kg (1.2 lbs) of fat gained annually from the post-exercise eating habit alone. This does not mean Emma should skip the social café ritual — the cardiovascular benefits, mental health boost, and social connection of the ride far outweigh the small caloric impact. If weight management is a concern, a simple swap to a black coffee and a banana (~130 kcal) would preserve 342 kcal of the deficit from the ride. The lesson: exercising to "earn" food is a psychologically fraught approach. Better to view exercise calories and food intake as separate pillars of health, not a transactional relationship.',
      },
    ],

    proTips: [
      'Compare activities by "calories per minute" rather than total session burn. A 10-minute HIIT session might only burn 120 kcal total (12 kcal/min), while a 60-minute walk burns 240 kcal (4 kcal/min). The walk burns more total calories, but the HIIT session is more than twice as time-efficient per minute — and produces a larger EPOC "afterburn" effect lasting hours after the workout.',
      'Heavier individuals burn more calories doing the same activity — use this as motivation during weight loss. A 200 lb person running at 6 mph burns ~465 kcal in 30 minutes, while a 150 lb person burns ~350 kcal. As you lose weight, your calorie burn per session decreases (because you are moving less mass), which is one reason weight loss slows over time. Adding intensity or duration compensates for this natural decline.',
      'Do not trust the calorie readout on cardio machines. Studies show treadmills overestimate by 10-20%, ellipticals by 20-40%, and stationary bikes by 7-15%. This calculator\'s MET-based estimates (±15-20%) are generally more accurate than machine readouts. For the most accurate individual measurement, use a chest-strap heart rate monitor paired with a fitness watch that accounts for your VO2max estimate.',
      'Use the "calories per minute" result to rank activities by efficiency. If you only have 20 minutes, choose a high-MET activity (running, swimming, jump rope, rowing) to maximize calorie burn in limited time. If you have unlimited time and want sustainability, lower-MET activities (walking, leisurely cycling, yoga) produce less fatigue and can be done daily without burnout or injury risk.',
      'Factor in environmental conditions. Running outdoors in 90°F heat or 0°F cold burns 2-5% more calories than running in 70°F conditions because your body expends extra energy on thermoregulation. Running on sand or trails adds 10-20% more calorie burn compared to pavement at the same speed. Swimming in cold water (below 78°F) increases calorie burn by 5-10% as your body works to maintain core temperature.',
    ],

    quickReference: [
      { label: 'MET Definition', value: '1 MET = 3.5 mL O₂/kg/min = 1 kcal/kg/hr (resting metabolic rate)' },
      { label: 'Walking (3.5 mph)', value: '4.3 METs — ~300 kcal/hr for a 155 lb person' },
      { label: 'Running (6 mph)', value: '9.8 METs — ~690 kcal/hr for a 155 lb person' },
      { label: 'Cycling (12-14 mph)', value: '8.0 METs — ~563 kcal/hr for a 155 lb person' },
      { label: 'Swimming (moderate)', value: '7.0 METs — ~493 kcal/hr for a 155 lb person' },
      { label: 'HIIT / Circuit Training', value: '8.0 METs — high EPOC "afterburn" effect for hours post-exercise' },
      { label: 'Formula', value: 'Calories = MET × weight(kg) × duration(hours)' },
      { label: 'Accuracy Range', value: '±15–20% for MET estimates; individual metabolism varies' },
    ],

    limitations: [
      'MET values are population averages and do not account for individual fitness level, body composition, age, or genetics. A trained athlete and a sedentary person of the same weight will burn different amounts for the same activity.',
      'Environmental factors (temperature, humidity, altitude, wind resistance, terrain, water current) are not modeled and can change calorie burn by 5–20%.',
      'EPOC (excess post-exercise oxygen consumption, the "afterburn effect") is not included. High-intensity exercise can elevate metabolism for 2–24 hours post-workout, adding 6–15% to total calorie expenditure.',
      'This calculator uses MET values from the Compendium of Physical Activities, which are laboratory-derived averages. For weight management purposes, treat these estimates as a starting point and adjust based on your actual results over 2–4 weeks.',
    ],
citations: [
      { source: 'ACSM - Exercise Testing and Prescription', url: 'https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription' },
      { source: 'NIH - Physical Activity and Weight', url: 'https://www.niddk.nih.gov/health-information/weight-management' },
    ],
  },
};

export default caloriesBurnedConfig;
