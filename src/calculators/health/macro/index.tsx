import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';

const DIET_PRESETS: Record<string, { label: string; proteinPct: number; carbPct: number; fatPct: number }> = {
  standard: { label: 'Standard (Balanced)', proteinPct: 20, carbPct: 50, fatPct: 30 },
  lowCarb: { label: 'Low-Carb', proteinPct: 30, carbPct: 25, fatPct: 45 },
  keto: { label: 'Keto', proteinPct: 25, carbPct: 5, fatPct: 70 },
  highProtein: { label: 'High-Protein', proteinPct: 35, carbPct: 35, fatPct: 30 },
  mediterranean: { label: 'Mediterranean', proteinPct: 20, carbPct: 45, fatPct: 35 },
};

const CAL_PER_G: Record<string, number> = { protein: 4, carbs: 4, fat: 9 };

const macroConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
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
      inputMode: 'decimal',
      min: 15,
      max: 100,
      step: 1,
      required: true,
    },
    {
      id: 'weight',
      label: 'Weight',
      type: 'number',
      placeholder: '170',
      inputMode: 'decimal',
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
      inputMode: 'decimal',
      min: 0,
      max: 9,
      step: 1,
      helpText: 'Imperial only',
    },
    {
      id: 'heightIn',
      label: 'Height — Inches',
      type: 'number',
      placeholder: '10',
      unit: 'in',
      inputMode: 'decimal',
      min: 0,
      max: 11,
      step: 1,
      helpText: 'Imperial only — remaining inches (0–11)',
    },
    {
      id: 'heightCm',
      label: 'Height — Centimeters',
      type: 'number',
      placeholder: '178',
      unit: 'cm',
      inputMode: 'decimal',
      min: 0,
      step: 0.1,
      helpText: 'Metric only',
    },
    {
      id: 'activityLevel',
      label: 'Activity Level',
      type: 'select',
      required: true,
      options: [
        { label: 'Sedentary (desk job, little/no exercise)', value: '1.2' },
        { label: 'Light Exercise (1–2 days/week)', value: '1.375' },
        { label: 'Moderate Exercise (3–5 days/week)', value: '1.55' },
        { label: 'Heavy Exercise (6–7 days/week)', value: '1.725' },
        { label: 'Athlete / Physical Job (2× per day)', value: '1.9' },
      ],
    },
    {
      id: 'goal',
      label: 'Goal',
      type: 'select',
      required: true,
      options: [
        { label: 'Maintain Weight', value: 'maintain' },
        { label: 'Mild Weight Loss (0.5 lb/wk)', value: 'mildLoss' },
        { label: 'Weight Loss (1 lb/wk)', value: 'moderateLoss' },
        { label: 'Lean Muscle Gain', value: 'leanGain' },
        { label: 'Aggressive Gain', value: 'aggressiveGain' },
      ],
    },
    {
      id: 'diet',
      label: 'Diet Preference',
      type: 'select',
      required: true,
      options: [
        { label: 'Standard (Balanced) — 50% carbs, 20% protein, 30% fat', value: 'standard' },
        { label: 'Low-Carb — 25% carbs, 30% protein, 45% fat', value: 'lowCarb' },
        { label: 'Keto — 5% carbs, 25% protein, 70% fat', value: 'keto' },
        { label: 'High-Protein — 35% carbs, 35% protein, 30% fat', value: 'highProtein' },
        { label: 'Mediterranean — 45% carbs, 20% protein, 35% fat', value: 'mediterranean' },
      ],
    },
    {
      id: 'bodyFatPct',
      label: 'Body Fat % (Optional)',
      type: 'number',
      placeholder: '20',
      unit: '%',
      inputMode: 'decimal',
      min: 2,
      max: 70,
      step: 0.5,
      helpText: 'Switches BMR formula to Katch-McArdle for more accuracy',
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const unit = values.unit || 'imperial';
    const sex = values.sex || 'male';
    const age = parseFloat(values.age);
    const activityFactor = parseFloat(values.activityLevel || '1.55');
    const goal = values.goal || 'maintain';
    const dietKey = values.diet || 'standard';
    const bodyFatPct = parseFloat(values.bodyFatPct);

    let weightKg: number;
    let heightCm: number;

    if (unit === 'imperial') {
      weightKg = parseFloat(values.weight) * 0.45359237;
      const ft = parseFloat(values.heightFt) || 0;
      const inches = parseFloat(values.heightIn) || 0;
      heightCm = (ft * 12 + inches) * 2.54;
    } else {
      weightKg = parseFloat(values.weight);
      heightCm = parseFloat(values.heightCm) || 0;
    }

    if ([weightKg, heightCm, age, activityFactor].some(isNaN) || weightKg <= 0 || heightCm <= 0) return [];

    // BMR
    let bmr: number;
    let bmrMethod: string;
    if (!isNaN(bodyFatPct) && bodyFatPct > 0 && values.bodyFatPct !== '') {
      const leanMass = weightKg * (1 - bodyFatPct / 100);
      bmr = 370 + 21.6 * leanMass;
      bmrMethod = 'Katch-McArdle';
    } else if (sex === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
      bmrMethod = 'Mifflin-St Jeor';
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      bmrMethod = 'Mifflin-St Jeor';
    }

    const tdee = bmr * activityFactor;

    // Adjust calories based on goal
    const goalAdjust: Record<string, number> = {
      maintain: 0,
      mildLoss: -250,
      moderateLoss: -500,
      leanGain: 250,
      aggressiveGain: 500,
    };
    const calAdj = goalAdjust[goal] ?? 0;
    const adjustedCalories = tdee + calAdj;
    const safeMin = sex === 'female' ? 1200 : 1500;
    const finalCalories = Math.max(adjustedCalories, safeMin);

    // Calculate macros
    const diet = DIET_PRESETS[dietKey] ?? DIET_PRESETS.standard;
    const proteinG = Math.round((finalCalories * diet.proteinPct / 100) / CAL_PER_G.protein);
    const carbG = Math.round((finalCalories * diet.carbPct / 100) / CAL_PER_G.carbs);
    const fatG = Math.round((finalCalories * diet.fatPct / 100) / CAL_PER_G.fat);

    // Gram-range recommendations
    const proteinRange = `${Math.round(weightKg * 1.6)}–${Math.round(weightKg * 2.2)} g`;
    const fatMin = Math.round((finalCalories * 0.2) / 9);
    const fatMax = Math.round((finalCalories * 0.35) / 9);

    const fmt = (n: number) => Math.round(n).toLocaleString(undefined);

    return [
      {
        id: 'dailyCalories',
        label: 'Daily Calories',
        value: `${fmt(finalCalories)} kcal/day`,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'proteinGrams',
        label: `Protein (${diet.proteinPct}% of calories)`,
        value: `${proteinG} g · ${Math.round(proteinG * CAL_PER_G.protein)} kcal`,
        color: 'positive',
      },
      {
        id: 'carbGrams',
        label: `Carbs (${diet.carbPct}% of calories)`,
        value: `${carbG} g · ${Math.round(carbG * CAL_PER_G.carbs)} kcal`,
        color: 'neutral',
      },
      {
        id: 'fatGrams',
        label: `Fat (${diet.fatPct}% of calories)`,
        value: `${fatG} g · ${Math.round(fatG * CAL_PER_G.fat)} kcal`,
        color: 'neutral',
      },
      {
        id: 'proteinRange',
        label: 'Recommended Protein Range (1.6–2.2 g/kg)',
        value: proteinRange,
        color: 'positive',
      },
      {
        id: 'fatRange',
        label: 'Recommended Fat Range (20–35% of calories)',
        value: `${fatMin}–${fatMax} g · ${Math.round(fatMin * 9)}–${Math.round(fatMax * 9)} kcal`,
        color: 'neutral',
      },
      {
        id: 'dietLabel',
        label: 'Diet Pattern',
        value: diet.label,
        color: 'neutral',
      },
      {
        id: 'tdeeForMacros',
        label: 'Base TDEE (before goal adjustment)',
        value: `${fmt(tdee)} kcal`,
        color: 'neutral',
      },
      {
        id: 'bmrValue',
        label: 'BMR Formula Used',
        value: `${bmrMethod}: ${fmt(bmr)} kcal`,
        color: 'neutral',
      },
      {
        id: 'carbRange',
        label: 'Recommended Carbohydrate Range (45-65% of calories)',
        value: `${Math.round((finalCalories * 0.45) / 4)}-${Math.round((finalCalories * 0.65) / 4)} g`,
        color: 'neutral',
      },
      {
        id: 'calorieAdjustment',
        label: 'Calorie Adjustment for Goal',
        value: `${calAdj >= 0 ? '+' : ''}${calAdj} kcal`,
        color: calAdj >= 0 ? 'positive' : 'neutral',
      },
    ];
  },
  educational: {
    formula: 'Macro grams = (Daily Calories × Macro %) ÷ Calories per gram (P:4, C:4, F:9)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">Macro Split (Standard)</text><rect x="30" y="60" width="380" height="50" rx="4" fill="#eee"/><rect x="30" y="60" width="76" height="50" fill="#ef4444"/><text x="68" y="90" text-anchor="middle" font-size="12" font-weight="bold" class="fill-white">20%</text><rect x="106" y="60" width="190" height="50" fill="#f59e0b"/><text x="201" y="90" text-anchor="middle" font-size="12" font-weight="bold" class="fill-white">50% Carbs</text><rect x="296" y="60" width="114" height="50" fill="#3b82f6"/><text x="353" y="90" text-anchor="middle" font-size="12" font-weight="bold" class="fill-white">30%</text><circle cx="50" cy="145" r="5" fill="#ef4444"/><text x="65" y="149" font-size="11" fill="#333">Protein 20%</text><circle cx="180" cy="145" r="5" fill="#f59e0b"/><text x="195" y="149" font-size="11" fill="#333">Carbs 50%</text><circle cx="310" cy="145" r="5" fill="#3b82f6"/><text x="325" y="149" font-size="11" fill="#333">Fat 30%</text><text x="220" y="200" text-anchor="middle" font-size="11" fill="#666">Splits: Standard &middot; Low-Carb &middot; Keto &middot; High-Protein &middot; Mediterranean</text></svg>',
      alt: 'Stacked bar chart showing 20% protein, 50% carbs, 30% fat macro split',
      caption: 'Macronutrient split varies by diet preference; standard is 50% carbs, 20% protein, 30% fat',
    },
    formulaDescription:
      'Macronutrients are calculated based on your total daily calorie target (derived from TDEE plus goal adjustment) and the selected diet split. Protein and carbs provide 4 kcal/g; fat provides 9 kcal/g.',
    variables: [
      { symbol: 'Protein', name: 'Protein (4 kcal/g)', description: 'Essential for muscle repair, enzymatic function, and satiety. Higher intake supports muscle gain and fat loss.' },
      { symbol: 'Carbs', name: 'Carbohydrates (4 kcal/g)', description: 'Primary fuel source for the brain and high-intensity exercise. Modulated based on diet preference.' },
      { symbol: 'Fat', name: 'Dietary Fat (9 kcal/g)', description: 'Essential for hormone production, nutrient absorption, and cell membrane integrity. Calorie-dense, so small portions add up.' },
      { symbol: 'TDEE', name: 'Total Daily Energy Expenditure', description: 'Your total daily calorie burn used as the starting point before goal adjustment.' },
    ],
    howToUse: [
      'Enter your stats and activity level (same as TDEE calculator).',
      'Select your goal — maintain, lose, or gain weight.',
      'Select a diet preference that matches your lifestyle.',
      'Review your personalized macros in both grams and calories.',
      'Use the protein range guide to ensure adequate intake for your weight.',
    ],
    explanation:
      'Macronutrient ratios are personal — there is no single "best" macro split. The Standard split (50/20/30) works well for most active people. Low-carb diets are effective for blood sugar management and initial fat loss. Keto is medically restrictive and should generally be pursued with professional guidance. High-protein splits are excellent for body recomposition (losing fat while gaining muscle). The Mediterranean split emphasizes healthy fats and is well-supported by longevity research. Regardless of the split, hitting your total calorie target matters most for weight change — macros primarily affect body composition and how you feel. The protein range of 1.6–2.2 g per kg of body weight is evidence-based for most goals. A practical example: a 180 lb (82 kg) person on a 2,200-calorie weight loss plan with a high-protein split (35% protein, 35% carbs, 30% fat) would get 193g protein, 193g carbs, and 73g fat. The same person on a standard split (20% protein, 50% carbs, 30% fat) at the same calories would get only 110g protein but 275g carbs. Both plans would produce similar weight loss at the same calorie deficit, but the high-protein version better preserves muscle mass and may produce greater satiety, making adherence easier for many people. The best macro split is ultimately the one you can sustain consistently over time.',
    faqs: [
      {
        question: 'Are all calories the same?',
        answer: 'For weight change (loss or gain), total calories matter most. For body composition, satiety, and health, macro distribution matters. A 2000-calorie keto diet and a 2000-calorie balanced diet will produce different hormonal responses, satiety levels, and body composition outcomes.',
      },
      {
        question: 'Which macro split is best for fat loss?',
        answer: 'The best split is the one you can stick to. High-protein (30-35%) is strongly supported by evidence for preserving muscle during a calorie deficit. Low-carb can accelerate initial water weight loss. The key is maintaining a calorie deficit regardless of split.',
      },
      {
        question: 'Is keto safe for weight loss?',
        answer: 'Keto can be effective for short-term weight loss but is restrictive and may be difficult to maintain long-term. The long-term health effects of very low carbohydrate intake are still being studied. Consult a healthcare provider before starting keto, especially if you have metabolic or cardiovascular conditions.',
      },
      {
        question: 'How much protein do I actually need?',
        answer: 'The general recommendation: 1.6–2.2 g per kg of body weight (0.73–1.0 g per lb). For muscle gain, aim for the higher end. For maintenance, the lower end. Even 2.2+ g/kg is safe for healthy individuals but provides diminishing returns. Spread protein across 3–4 meals for optimal muscle protein synthesis.',
      },
    
      {
        question: 'What happens if I don\'t hit my macro targets exactly?',
        answer: 'Consistency over weeks matters more than daily precision. Being within ±10 g of your protein and ±20 g of carbs/fat on any given day is effectively on-target. The stress of perfect tracking can be counterproductive — aim for the weekly average to match your targets rather than stressing over individual days.',
      },],
  
    quickReference: [
      { label: 'Protein', value: '4 kcal per gram — muscle repair, enzymes, satiety' },
      { label: 'Carbohydrates', value: '4 kcal per gram — primary fuel for brain and exercise' },
      { label: 'Fat', value: '9 kcal per gram — hormones, absorption, energy storage' },
      { label: 'Standard Split', value: '50% Carbs, 20% Protein, 30% Fat' },
      { label: 'High-Protein Split', value: '35% Carbs, 35% Protein, 30% Fat' },
      { label: 'Keto Split', value: '5% Carbs, 25% Protein, 70% Fat' },
      { label: 'Protein Recommendation', value: '1.6–2.2 g per kg of body weight' },
      { label: 'Fat Minimum', value: '20% of total calories for hormone health' },
    ],
    commonUses: [
      'Meal planning — design daily eating plans that hit precise gram targets for protein, carbs, and fat based on your body and goals',
      'Body recomposition — adjust macros to lose fat while preserving or building muscle by setting a calorie deficit with high protein',
      'Athletic performance — optimize carb intake around training sessions for energy and protein timing for recovery',
      'Medical nutrition — manage conditions like diabetes (low-carb), kidney disease (protein restriction), or metabolic syndrome with targeted macro splits',
      'Flexible dieting ("If It Fits Your Macros") — track daily intake against targets without eliminating any food groups, improving long-term diet adherence',
    ],
    
    workedExamples: [
      {
        scenario: 'David is 28 years old, male, 5\'10" tall, weighs 180 lbs, and exercises moderately (3–5 days/week). He wants to lose weight at a mild pace while eating a high-protein diet to preserve muscle mass during his cut.',
        inputs: {
          'Unit System': 'Imperial',
          'Biological Sex': 'Male',
          'Age': '28',
          'Weight': '180 lbs',
          'Height': '5\'10"',
          'Activity Level': 'Moderate (3–5 days/week)',
          'Goal': 'Mild Weight Loss',
          'Diet Preference': 'High-Protein',
        },
        result: 'Daily Calories: 2,529 kcal. Protein: 221 g (884 kcal). Carbs: 221 g (884 kcal). Fat: 84 g (756 kcal). BMR: 1,793 kcal (Mifflin-St Jeor). TDEE: 2,779 kcal. Calorie Adjustment: -250 kcal.',
        insight: 'David\'s body burns about 2,779 calories per day at his current activity level (BMR × 1.55). His mild weight loss goal subtracts 250 calories, targeting 2,529 kcal/day — a deficit that should produce roughly 0.5 lb of fat loss per week. The high-protein split at 35% protein delivers 221 g of protein, which at 2.7 g/kg (180 lbs = 81.6 kg) exceeds the recommended 1.6–2.2 g/kg range. David might find this level of protein challenging to eat daily and could consider dropping to the standard split for more carbs (which reduce to ~316 g) while still getting ~126 g of protein (1.5 g/kg — adequate but less optimal for muscle preservation). The best split is the one David can sustain — if the high-protein plan feels restrictive, the standard or Mediterranean split with the same 2,529 calorie target will produce identical weight loss.',
      },
      {
        scenario: 'Lina is 35, female, 165 cm tall, weighs 70 kg, and has a desk job (sedentary). She wants to maintain her weight and follows a Mediterranean-style eating pattern. She does not know her body fat percentage.',
        inputs: {
          'Unit System': 'Metric',
          'Biological Sex': 'Female',
          'Age': '35',
          'Weight': '70 kg',
          'Height': '165 cm',
          'Activity Level': 'Sedentary (desk job)',
          'Goal': 'Maintain Weight',
          'Diet Preference': 'Mediterranean',
        },
        result: 'Daily Calories: 1,674 kcal. Protein: 84 g (336 kcal). Carbs: 188 g (752 kcal). Fat: 65 g (585 kcal). BMR: 1,395 kcal (Mifflin-St Jeor). TDEE: 1,674 kcal. Calorie Adjustment: 0 kcal.',
        insight: 'At 70 kg with a sedentary lifestyle, Lina\'s daily energy expenditure is 1,674 calories. The Mediterranean split allocates 20% protein (84 g, or 1.2 g/kg), 45% carbs (188 g), and 35% fat (65 g). Her protein intake at 1.2 g/kg is below the 1.6 g/kg evidence-based optimum for muscle preservation, but adequate for a sedentary maintenance goal. The higher fat allocation (35%) from the Mediterranean pattern supports hormone health and fat-soluble vitamin absorption. If Lina begins exercising, she should recalculate with a higher activity level — even switching to "Light Exercise" would raise her TDEE to ~1,918 kcal and push her protein to ~96 g at 1.4 g/kg. Lina could also enter her body fat percentage if known — this would switch the BMR formula from Mifflin-St Jeor to Katch-McArdle (BMR = 370 + 21.6 × lean mass in kg), which can be more accurate for individuals at the extremes of body composition.',
      },
    ],

    proTips: [
      'Hitting your calorie target matters far more for weight change than hitting exact macro ratios. If you go over on fat but stay under on calories, you will still lose weight. The macros primarily affect body composition quality and satiety, not the calorie math.',
      'Protein timing matters almost as much as total intake. Spread your protein across 3–4 meals (30–40 g each) rather than one large portion, to maximize muscle protein synthesis throughout the day. A pre-sleep casein-rich snack (~30 g) can improve overnight recovery.',
      'If you log your body fat percentage, the calculator switches to the Katch-McArdle BMR formula which is more accurate for lean or muscular individuals. Mifflin-St Jeor (used without BF%) assumes average body composition and can underestimate BMR by 5–10% in muscular people.',
      'The "Mild Weight Loss" goal at -250 kcal creates roughly a 0.5 lb/week deficit. This is more sustainable long-term than the -500 kcal "Weight Loss" option, which can trigger hunger-related non-compliance. Choose mild for cuts longer than 8 weeks; aggressive only for short-term goals.',
    ],

    limitations: [
      'BMR formulas (Mifflin-St Jeor and Katch-McArdle) are population-level estimates with a standard error of ~10% for individuals. Your actual BMR can differ by 150–300 kcal from the calculated value depending on genetics, thyroid function, and body composition.',
      'TDEE multipliers (1.2–1.9) are coarse estimates of activity. Someone with a desk job who does 3 intense CrossFit sessions per week may not fit neatly into any single category — the calculator cannot account for the timing and intensity distribution of exercise.',
      'This calculator is not suitable for clinical nutrition planning (eating disorders, metabolic diseases, pre-/post-surgery nutrition). These conditions require individualized medical nutrition therapy from a registered dietitian.',
      'The keto preset at 5% carbs is extremely restrictive and should only be used with medical supervision for specific therapeutic purposes (e.g., drug-resistant epilepsy). For general weight loss, ketosis is not superior to other diets when calories and protein are equated.',
    ],
citations: [
      { source: 'USDA - Dietary Guidelines', url: 'https://www.dietaryguidelines.gov/' },
      { source: 'NIH - Macronutrient Research', url: 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/' },
    ],
  },
};

export default macroConfig;
