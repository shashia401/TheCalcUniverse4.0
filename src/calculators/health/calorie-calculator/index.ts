import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import CaloriePanel from './CaloriePanel';

const calorieConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
      helpText: 'Choose Metric (kg, cm) or Imperial (lbs, ft/in) for your measurements',
      options: [
        { label: 'Metric (kg, cm)', value: 'metric' },
        { label: 'Imperial (lbs, ft & in)', value: 'imperial' },
      ],
    },
    {
      id: 'gender',
      label: 'Gender',
      type: 'select',
      required: true,
      helpText: 'Used in the Mifflin-St Jeor BMR equation — male and female use different formulas',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      defaultValue: '30',
      placeholder: '30',
      unit: 'years',
      min: 15,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Your age in years — used in the Mifflin-St Jeor BMR equation',
    },
    {
      id: 'weight',
      label: 'Weight',
      type: 'number',
      defaultValue: '70',
      placeholder: '70',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'Kilograms (kg) for Metric · Pounds (lbs) for Imperial',
    },
    {
      id: 'heightCm',
      label: 'Height — Centimeters',
      type: 'number',
      defaultValue: '175',
      placeholder: '175',
      unit: 'cm',
      min: 0,
      step: 0.1,
      helpText: 'Metric only',
      showWhen: (v) => v.unit === 'metric',
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
      helpText: 'Imperial only — remaining inches (0-11)',
      showWhen: (v) => v.unit === 'imperial',
    },
    {
      id: 'activityLevel',
      label: 'Activity Level',
      type: 'select',
      required: true,
      options: [
        { label: 'Sedentary (desk job, little/no exercise)', value: '1.2' },
        { label: 'Light Exercise (1-2 days/week)', value: '1.375' },
        { label: 'Moderate Exercise (3-5 days/week)', value: '1.55' },
        { label: 'Active (6-7 days/week)', value: '1.725' },
        { label: 'Very Active (physical job + daily training)', value: '1.9' },
      ],
      helpText: 'Multiplies BMR to estimate your total daily calorie burn (TDEE)',
    },
    {
      id: 'dailyIntake',
      label: 'Daily Calorie Intake (Optional)',
      type: 'number',
      placeholder: '2000',
      unit: 'kcal',
      min: 0,
      step: 1,
      required: false,
      helpText: 'Enter to see deficit/surplus vs. your TDEE',
    },
  ],

  explainSteps: (values) => {
    const unit = values.unit;
    const gender = values.gender;
    const age = parseFloat(values.age);
    const activityLevel = values.activityLevel;

    if (isNaN(age) || !gender || !activityLevel) return [];

    let weightKg: number;
    let heightCm: number;

    if (unit === 'imperial') {
      weightKg = parseFloat(values.weight) * 0.45359237;
      const ft = parseFloat(values.heightFt);
      const inches = parseFloat(values.heightIn);
      if (isNaN(ft) || isNaN(inches)) return [];
      heightCm = (ft * 12 + inches) * 2.54;
    } else {
      weightKg = parseFloat(values.weight);
      heightCm = parseFloat(values.heightCm);
      if (isNaN(heightCm)) return [];
    }

    if (isNaN(weightKg) || weightKg <= 0 || isNaN(heightCm) || heightCm <= 0) return [];

    const activityMultipliers: Record<string, number> = {
      '1.2': 1.2,
      '1.375': 1.375,
      '1.55': 1.55,
      '1.725': 1.725,
      '1.9': 1.9,
    };
    const activityMultiplier = activityMultipliers[activityLevel];
    if (isNaN(activityMultiplier) || activityMultiplier === undefined) return [];

    const bmr = gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    const tdee = bmr * activityMultiplier;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const fmt = (n: number) => Math.round(n).toLocaleString(undefined);

    const steps: { label: string; expr: string; note?: string }[] = [];

    if (unit === 'imperial') {
      steps.push({
        label: 'Convert your measurements to metric',
        expr: `${values.weight} lb → ${weightKg.toFixed(1)} kg · height → ${heightCm.toFixed(1)} cm`,
        note: 'The Mifflin-St Jeor equation uses kilograms and centimeters.',
      });
    }
    steps.push({
      label: `Mifflin-St Jeor BMR (${gender})`,
      expr: `10×${weightKg.toFixed(1)} + 6.25×${heightCm.toFixed(1)} − 5×${age} ${gender === 'male' ? '+ 5' : '− 161'} = ${fmt(bmr)} kcal/day`,
      note: 'Calories your body burns at complete rest.',
    });
    steps.push({
      label: 'Multiply by your activity factor for TDEE',
      expr: `${bmr.toFixed(1)} × ${activityMultiplier} = ${fmt(tdee)} kcal/day`,
      note: 'Total daily calories needed to maintain your weight.',
    });
    steps.push({
      label: 'Body Mass Index for context',
      expr: `BMI = ${weightKg.toFixed(1)} ÷ ${(heightM * heightM).toFixed(3)} = ${bmi.toFixed(1)} kg/m²`,
    });

    return steps;
  },
  calculate: (values) => {
    const unit = values.unit;
    const gender = values.gender;
    const age = parseFloat(values.age);
    const activityLevel = values.activityLevel;

    if (isNaN(age) || !gender || !activityLevel) return [];

    let weightKg: number;
    let heightCm: number;

    if (unit === 'imperial') {
      weightKg = parseFloat(values.weight) * 0.45359237;
      const ft = parseFloat(values.heightFt);
      const inches = parseFloat(values.heightIn);
      if (isNaN(ft) || isNaN(inches)) return [];
      heightCm = (ft * 12 + inches) * 2.54;
    } else {
      weightKg = parseFloat(values.weight);
      heightCm = parseFloat(values.heightCm);
      if (isNaN(heightCm)) return [];
    }

    if (isNaN(weightKg) || weightKg <= 0 || isNaN(heightCm) || heightCm <= 0) return [];

    const activityMultipliers: Record<string, number> = {
      '1.2': 1.2,
      '1.375': 1.375,
      '1.55': 1.55,
      '1.725': 1.725,
      '1.9': 1.9,
    };

    const activityMultiplier = activityMultipliers[activityLevel];
    if (isNaN(activityMultiplier) || activityMultiplier === undefined) return [];

    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    const tdee = bmr * activityMultiplier;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    const fmt = (n: number) => Math.round(n).toLocaleString(undefined);

    const results: CalculatorResult[] = [
      {
        id: 'bmr',
        label: 'Basal Metabolic Rate (BMR)',
        value: `${fmt(bmr)} kcal/day`,
        highlight: true,
        color: 'neutral',
        interpretation: `This is what your body burns at complete rest just to stay alive — about ${Math.round((bmr / tdee) * 100)}% of your total daily burn. It's the floor, not a diet target: eating below your BMR long-term is how people stall progress and lose muscle.`,
      },
      {
        id: 'tdee',
        label: 'Total Daily Energy Expenditure (TDEE)',
        value: `${fmt(tdee)} kcal/day`,
        highlight: true,
        color: 'neutral',
        interpretation: `Eat around this to maintain your weight, roughly 500 fewer to lose about a pound a week, or 500 more to gain. It's an estimate from population averages — track your weight for two weeks and adjust, since real metabolism varies by ±10%.`,
      },
      {
        id: 'bmi',
        label: 'Body Mass Index (BMI)',
        value: `${bmi.toFixed(1)} kg/m²`,
        color: 'neutral',
      },
      {
        id: 'maintenance',
        label: 'Daily Calories for Weight Maintenance',
        value: `${fmt(tdee)} kcal/day`,
        color: 'neutral',
      },
    ];

    const dailyIntake = values.dailyIntake !== '' ? parseFloat(values.dailyIntake) : NaN;

    if (!isNaN(dailyIntake) && dailyIntake > 0) {
      const difference = dailyIntake - tdee;
      const weeklyChange = (difference * 7) / 7700;
      const isDeficit = difference < 0;

      results.push({
        id: 'calorieDifference',
        label: isDeficit ? 'Daily Calorie Deficit' : 'Daily Calorie Surplus',
        value: `${isDeficit ? '' : '+'}${fmt(Math.abs(difference))} kcal/day`,
        color: 'neutral',
      });

      results.push({
        id: 'weeklyWeightChange',
        label: 'Projected Weekly Weight Change',
        value: `${isDeficit ? '-' : '+'}${Math.abs(weeklyChange).toFixed(2)} kg/week`,
        color: isDeficit ? 'positive' : 'negative',
      });
    }

    return results;
  },

  educational: {
    formula:
      "Mifflin-St Jeor: BMR = 10W + 6.25H − 5A + 5 (Male) | BMR = 10W + 6.25H − 5A − 161 (Female) | TDEE = BMR × Activity Factor",
    formulaDescription:
      'TDEE is the total number of calories your body burns in a day, calculated by multiplying your BMR (calories at complete rest) by an activity factor. Comparing your actual intake to your TDEE reveals your calorie deficit or surplus, which directly determines whether you lose, maintain, or gain weight.',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="220" y="24" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Calorie Balance — Intake vs. Expenditure</text>' +
        '<!-- Left side: Calories In (intake plate) -->' +
        '<rect x="30" y="50" width="160" height="120" rx="10" fill="var(--svg-f0f9ff)" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
        '<text x="110" y="80" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Calories In</text>' +
        '<rect x="50" y="95" width="120" height="14" rx="5" fill="var(--svg-3b82f6)" opacity="0.7"/>' +
        '<rect x="50" y="115" width="90" height="14" rx="5" fill="var(--svg-3b82f6)" opacity="0.5"/>' +
        '<rect x="50" y="135" width="140" height="14" rx="5" fill="var(--svg-3b82f6)" opacity="0.6"/>' +
        '<text x="110" y="160" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Food &amp; Drinks</text>' +
        '<!-- Right side: Calories Out (expenditure) -->' +
        '<rect x="250" y="50" width="160" height="120" rx="10" fill="var(--svg-fef2f2)" stroke="var(--svg-ef4444)" stroke-width="2"/>' +
        '<text x="330" y="80" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Calories Out</text>' +
        '<rect x="270" y="95" width="100" height="14" rx="5" fill="var(--svg-ef4444)" opacity="0.6"/>' +
        '<rect x="270" y="115" width="70" height="14" rx="5" fill="var(--svg-ef4444)" opacity="0.5"/>' +
        '<rect x="270" y="135" width="120" height="14" rx="5" fill="var(--svg-ef4444)" opacity="0.7"/>' +
        '<text x="330" y="160" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">BMR + Activity + TEF</text>' +
        '<!-- Balance scale beam -->' +
        '<rect x="140" y="195" width="160" height="6" rx="3" fill="var(--svg-94a3b8)"/>' +
        '<line x1="220" y1="201" x2="220" y2="235" stroke="var(--svg-94a3b8)" stroke-width="3"/>' +
        '<polygon points="205,235 235,235 220,248" fill="var(--svg-94a3b8)"/>' +
        '<!-- Deficit label (left side heavier arrow pointing down) -->' +
        '<text x="110" y="280" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-16a34a)" font-weight="600" text-anchor="middle">Deficit ↓</text>' +
        '<text x="110" y="298" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Weight Loss</text>' +
        '<!-- Surplus label (right side) -->' +
        '<text x="330" y="280" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-dc2626)" font-weight="600" text-anchor="middle">Surplus ↑</text>' +
        '<text x="330" y="298" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Weight Gain</text>' +
        '<!-- Balanced label (center) -->' +
        '<text x="220" y="280" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-2563eb)" font-weight="600" text-anchor="middle">Balanced =</text>' +
        '<text x="220" y="298" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Weight Maintenance</text>' +
        '<text x="220" y="335" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-94a3b8)" text-anchor="middle">~7,700 kcal deficit = ~1 kg of body fat lost</text>' +
        '</svg>',
      alt: 'Calorie balance scale comparing calories in (food and drinks) versus calories out (BMR, activity, TEF) with deficit, surplus, and balanced zones',
      caption: 'Weight change is determined by the balance between calories consumed and calories expended. A daily deficit of ~500 kcal leads to ~0.5 kg weight loss per week.',
    },
    variables: [
      { symbol: 'W', name: 'Weight (kg)', description: 'Total body weight in kilograms. Heavier individuals have higher BMR and TDEE.' },
      { symbol: 'H', name: 'Height (cm)', description: 'Height in centimeters. Taller individuals have higher BMR due to greater body surface area.' },
      { symbol: 'A', name: 'Age', description: 'Age in years. BMR decreases ~2% per decade after age 20 due to muscle loss.' },
      { symbol: 'AF', name: 'Activity Factor', description: 'Multiplier from 1.2 (sedentary) to 1.9 (very active) that accounts for all physical activity on top of BMR.' },
    ],
    howToUse: [
      'Select your unit system (Metric or Imperial) and enter your gender.',
      'Enter your age, weight, and height. Choose the activity level that best matches your typical weekly routine.',
      'Optionally enter your daily calorie intake to see whether you are in a deficit or surplus compared to your TDEE.',
      'Review your BMR, TDEE, BMI, and projected weekly weight change to plan your nutrition and fitness goals.',
      'Adjust your activity level or daily intake to model different scenarios and find a sustainable calorie target.',
    ],
    explanation:
      'Your daily calorie needs are determined by two primary factors: your Basal Metabolic Rate (BMR) and your activity level. BMR is the number of calories your body burns at complete rest to sustain vital functions such as breathing, circulation, cell repair, and temperature regulation. The Mifflin-St Jeor equation, developed in 1990 from a sample of 498 healthy adults, is considered the most accurate formula for estimating BMR in the general population. For men, BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5. For women, BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161. To find your Total Daily Energy Expenditure (TDEE), multiply your BMR by an activity factor ranging from 1.2 (sedentary) to 1.9 (very active). Your TDEE represents the number of calories needed to maintain your current weight. If you consume fewer calories than your TDEE, you are in a calorie deficit, which leads to weight loss. A deficit of approximately 500 kcal per day results in roughly 0.5 kg (1 lb) of weight loss per week, as 1 kg of body fat contains about 7,700 kcal. Conversely, consuming more than your TDEE creates a surplus, leading to weight gain. The key to sustainable weight management is understanding your individual energy balance and making gradual, consistent adjustments rather than drastic calorie restrictions that can slow metabolism and cause muscle loss.',
    faqs: [
      {
        question: 'How accurate is the Mifflin-St Jeor equation for BMR?',
        answer: 'The Mifflin-St Jeor equation is the most validated formula for the general population, with an accuracy of about ±100 kcal/day for 70% of people. It was developed in 1990 and has been consistently shown to estimate BMR within 10% of measured values in healthy adults. Athletes and very lean individuals may find Katch-McArdle more accurate, while older adults may be slightly overestimated.',
      },
      {
        question: 'What is a safe and sustainable calorie deficit for weight loss?',
        answer: 'A deficit of 300-500 kcal per day (approximately 0.5-1 lb or 0.2-0.5 kg per week) is considered safe and sustainable for most people. Larger deficits may cause rapid weight loss initially but often lead to muscle loss, metabolic adaptation, nutrient deficiencies, and rebound weight gain. Women should generally not eat below 1,200 kcal/day and men not below 1,500 kcal/day without medical supervision.',
      },
      {
        question: 'Do I need to recalculate my calorie needs as I lose weight?',
        answer: 'Yes. As you lose weight, your BMR and TDEE decrease because a smaller body requires less energy. For every 10 kg lost, your TDEE drops by approximately 100-150 kcal/day. Recalculate every 5-10 kg lost to ensure your calorie target remains accurate and your weight loss does not plateau prematurely.',
      },
      {
        question: 'What is the difference between BMR, TDEE, and RMR?',
        answer: 'BMR (Basal Metabolic Rate) is the calories your body burns at complete rest in a temperature-controlled environment after 12 hours of fasting — it is the minimum energy needed to keep you alive. RMR (Resting Metabolic Rate) is similar but measured under less strict conditions and is typically 5-10% higher. TDEE (Total Daily Energy Expenditure) is your BMR multiplied by an activity factor, representing the total calories you burn in a day including all activity, digestion, and non-exercise activity thermogenesis (NEAT — fidgeting, standing, walking around the house). TDEE is the most practically useful number for weight management.',
      },
      {
        question: 'Why does my calorie target change when I switch from sedentary to active?',
        answer: 'Physical activity is the most variable component of daily energy expenditure. A sedentary person (1.2x BMR) burns far fewer calories than someone who exercises daily (1.725x BMR). For a BMR of 1,600 kcal, the difference between sedentary (1,920 kcal TDEE) and very active (3,040 kcal TDEE) is over 1,100 kcal/day — equivalent to about 3 hours of brisk walking. This is why combining diet and exercise is far more effective for weight loss than diet alone.',
      },
      {
        question: 'Can I lose weight without counting calories?',
        answer: 'Yes, but it requires being in a consistent calorie deficit regardless of whether you formally count. Strategies like portion control, increasing protein and fiber intake (which promote satiety), eliminating liquid calories, using smaller plates, intermittent fasting, and focusing on whole unprocessed foods all help create a natural calorie deficit without counting every gram. However, calorie counting is the most precise method and can be instructive when starting — many people underestimate their intake by 30-50%.',
      },
      {
        question: 'How does age affect my calorie needs?',
        answer: 'BMR decreases approximately 2% per decade after age 20, primarily due to loss of lean muscle mass (sarcopenia). A 50-year-old has roughly a 6% lower BMR than a 20-year-old of the same weight and height, all else being equal. However, this age-related decline is largely preventable through resistance training and adequate protein intake. The Mifflin-St Jeor equation accounts for age directly, so your calculated BMR and TDEE will decrease as you enter a higher age — but know that maintaining muscle mass through strength training can counteract much of this decline.',
      },
    ],
    quickReference: [
      { label: 'Sedentary (desk job)', value: 'BMR × 1.2' },
      { label: 'Light Exercise (1-2 days/wk)', value: 'BMR × 1.375' },
      { label: 'Moderate Exercise (3-5 days/wk)', value: 'BMR × 1.55' },
      { label: 'Active (6-7 days/wk)', value: 'BMR × 1.725' },
      { label: 'Very Active (physical + training)', value: 'BMR × 1.9' },
      { label: '1 kg body fat', value: '~7,700 kcal' },
      { label: 'Safe weight loss rate', value: '0.5-1 kg per week (500 kcal/day deficit)' },
    ],
    commonUses: [
      'Weight loss planning — set a personalized calorie deficit to lose 0.5-1 kg per week while preserving muscle mass by tracking daily intake against TDEE',
      'Weight gain / muscle building — calculate the calorie surplus needed for lean mass gains (typically +250-500 kcal above TDEE) with adequate protein intake',
      'Weight maintenance — determine your exact maintenance calories and adjust intake on training vs. rest days to stay at a stable, healthy weight',
      'Fitness benchmarking — track your BMR and TDEE over time to measure how changes in body composition and activity level affect your energy expenditure',
    ],
    workedExamples: [
      {
        scenario: 'A 30-year-old woman, 165 cm tall, weighing 65 kg, exercises moderately 3-5 days per week and wants to lose weight. She currently eats about 2,000 kcal/day and has been frustrated by a weight loss plateau.',
        inputs: { Gender: 'Female', Age: '30', Weight: '65 kg', Height: '165 cm', Activity: 'Moderate (1.55)' },
        result: 'BMR: 1,370 kcal/day. TDEE: 2,124 kcal/day. At 2,000 kcal/day intake, her deficit is only 124 kcal/day — meaning roughly 0.11 kg/week weight loss, easily masked by water weight fluctuations.',
        insight: 'Her plateau makes sense mathematically. With a daily deficit of only 124 kcal, it would take 62 days to lose 1 kg of body fat. At this rate, normal daily weight fluctuations of 0.5-1.5 kg from water, food, and waste completely hide the fat loss on the scale. To lose 0.5 kg/week (a visible and motivating rate), she needs a 500 kcal/day deficit — meaning she should eat about 1,624 kcal/day, or increase her activity to burn 376 more calories daily while eating 2,000 kcal. The calculator reveals that her "plateau" is actually slow but real progress, and a modest adjustment will produce visible results.',
      },
      {
        scenario: 'A 22-year-old male athlete, 180 cm, 75 kg, trains 6 days/week at high intensity. He wants to gain 5 kg of lean muscle over the next 4 months and currently eats about 2,800 kcal/day.',
        inputs: { Gender: 'Male', Age: '22', Weight: '75 kg', Height: '180 cm', Activity: 'Very Active (1.9)' },
        result: 'BMR: 1,770 kcal/day. TDEE: 3,363 kcal/day. He is currently eating 2,800 kcal — a deficit of 563 kcal below TDEE. To gain lean mass, he needs a 250-500 kcal surplus above TDEE: 3,613-3,863 kcal/day.',
        insight: 'The calculator reveals a critical problem: this athlete is severely under-eating for his activity level. He is in a significant calorie deficit (-563 kcal/day) while trying to gain weight — physiologically impossible. He would actually be losing weight at his current intake. To gain 5 kg over 16 weeks (0.31 kg/week), he needs roughly a 340 kcal daily surplus, putting his target at approximately 3,703 kcal/day — over 900 kcal more than he currently eats. He should increase intake gradually over 2-3 weeks to allow digestive adaptation, focusing on calorie-dense nutritious foods (nuts, avocado, olive oil, whole grains, dried fruit) rather than junk food.',
      },
      {
        scenario: 'A 45-year-old sedentary office worker, 175 cm, 90 kg, wants to understand his maintenance calories and how adding a daily 30-minute walk would affect his energy balance. He does no structured exercise currently.',
        inputs: { Gender: 'Male', Age: '45', Weight: '90 kg', Height: '175 cm', Activity: 'Sedentary (1.2)' },
        result: 'BMR: 1,774 kcal/day. TDEE: 2,129 kcal/day (sedentary). Adding a 30-minute daily brisk walk burns ~150 extra kcal and shifts activity factor to ~1.32, yielding a new TDEE of ~2,341 kcal/day — a 212 kcal/day increase.',
        insight: 'This is an empowering result: a single 30-minute daily walk increases his TDEE by 212 kcal/day. Over a year, that is 77,380 kcal — equivalent to about 10.0 kg (22 lbs) of body fat, assuming no change in diet. Even a modest addition of daily walking, sustained over months and years, has a profound cumulative effect. This illustrates that sustainable weight management does not require extreme exercise or drastic dieting — small, consistent changes compound dramatically. If he also reduced his intake by 250 kcal/day (e.g., cutting out one soda or snack), the combined 462 kcal/day deficit would produce roughly 0.42 kg/week of weight loss.',
      },
    ],
    proTips: [
      'Use a food scale for at least 2 weeks when starting calorie tracking — most people underestimate portion sizes by 30-50% when eyeballing. A digital kitchen scale costs under $20 and is the single most impactful tool for accurate calorie tracking.',
      'Set your activity level one notch lower than your instinct tells you. Most people overestimate their activity. If you exercise 3-5 days/week but have a desk job, you are likely "Light Exercise" (1.375), not "Moderate" (1.55). Being conservative prevents accidental over-eating.',
      'Recalculate your TDEE every 5 kg (11 lbs) of weight change. A 10 kg weight loss reduces TDEE by roughly 100-150 kcal/day — failing to adjust is a common cause of plateaus and regain.',
      'Do not eat back all exercise calories. Fitness trackers and machines typically overestimate calorie burn by 20-40%. If your watch says you burned 500 kcal running, consider eating back only 250-300 kcal to maintain your planned deficit.',
      'Track the trend, not the daily number. Daily scale weight fluctuates 0.5-2 kg from water retention (salt, carbs, hormones, inflammation). Use a 7-day rolling average and look at the direction over 3-4 weeks — not day to day.',
      'Prioritize protein during a calorie deficit. Eating 1.6-2.2 g of protein per kg of body weight helps preserve lean muscle mass when dieting. More muscle means a higher BMR, creating a positive feedback loop for long-term weight management.',
    ],
    limitations: [
      'This calculator uses the Mifflin-St Jeor equation, which estimates BMR within ±10% for about 70% of the population. Individual BMR can differ by 200-300 kcal/day due to genetics, body composition, hormonal status, and thyroid function. A lab-measured RMR (indirect calorimetry) is the gold standard if you need precise values for medical or athletic purposes.',
      'The activity factors (1.2-1.9) are broad population averages and do not capture individual variation. Two people who both "exercise 3-5 days/week" can have TDEEs that differ by 300-500 kcal due to exercise intensity, non-exercise activity thermogenesis (NEAT), occupation, and genetic differences in movement efficiency.',
      'This calculator does not account for metabolic adaptation (adaptive thermogenesis). When you maintain a calorie deficit for extended periods, your body reduces BMR by 5-15% beyond what weight loss alone would predict — an evolutionary survival response. Diet breaks, reverse dieting, and cycling between deficit and maintenance phases can help mitigate this effect.',
      'The 7,700 kcal per kg of body fat rule (3,500 kcal per pound) is a useful approximation that becomes less accurate as weight loss progresses. In reality, the energy content of body fat changes with body composition, and the body catabolizes some lean mass alongside fat. Expect slightly slower progress than the formula predicts, especially as you get leaner.',
      'When not to use: This calculator provides educational estimates and is not a substitute for professional medical or nutritional advice. Do not use this calculator if you have an eating disorder, are pregnant or breastfeeding, have a metabolic condition (diabetes, thyroid disorders), or are under 18. Consult a registered dietitian or healthcare provider for personalized nutrition guidance, especially for medical weight management.',
    ],
    citations: [
      { source: 'CDC - Healthy Weight, Nutrition, and Physical Activity', url: 'https://www.cdc.gov/healthyweight/index.html' },
      { source: 'NIH - Body Weight Planner & Energy Balance', url: 'https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner' },
      { source: 'Mifflin MD, St Jeor ST et al. (1990) - A new predictive equation for resting energy expenditure', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
      { source: 'AND - Academy of Nutrition and Dietetics Evidence Analysis Library', url: 'https://www.eatright.org/health/wellness/weight-management' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CaloriePanel, { values, results });
  },
};

export default calorieConfig;
