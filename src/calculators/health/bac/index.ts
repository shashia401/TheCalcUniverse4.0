import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import BACPanel from './BACPanel';

const bacConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sex',
      label: 'Sex',
      type: 'select',
      required: true,
      helpText: 'Used in the Widmark formula — male (0.68) and female (0.55) have different alcohol distribution factors',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    {
      id: 'weight',
      label: 'Body Weight',
      type: 'number',
      placeholder: '170',
      min: 30,
      max: 700,
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'In pounds (lbs). Minimum 30 lbs, maximum 700 lbs.',
    },
    {
      id: 'drinks',
      label: 'Number of Drinks',
      type: 'number',
      placeholder: '3',
      min: 0,
      max: 50,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'One standard drink = 14g pure alcohol (12 oz beer at 5%, 5 oz wine at 12%, 1.5 oz liquor at 40%)',
    },
    {
      id: 'alcoholPct',
      label: 'Alcohol by Volume (ABV) %',
      type: 'number',
      placeholder: '5',
      min: 0.5,
      max: 60,
      step: 0.5,
      required: false,
      inputMode: 'decimal',
      helpText: 'Beer ~5%, Wine ~12%, Liquor ~40%. Leave blank for standard drink equivalents (14g each).',
    },
    {
      id: 'hours',
      label: 'Hours Since First Drink',
      type: 'number',
      placeholder: '2',
      min: 0,
      max: 72,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'How many hours have passed since you started drinking.',
    },
  ],
  calculate: (values) => {
    const sex = values.sex || 'male';
    const weight = parseFloat(values.weight);
    const drinks = parseFloat(values.drinks);
    const hours = parseFloat(values.hours);
    if ([weight, drinks, hours].some(isNaN) || weight < 30 || weight > 700 || drinks <= 0 || hours < 0) return [];

    // Widmark formula
    // Widmark rho: 0.68 for men, 0.55 for women
    const rho = sex === 'male' ? 0.68 : 0.55;

    // Weight in grams (convert from lbs)
    const weightG = weight * 453.592;

    // Total alcohol consumed in grams
    // Default: standard drink = 14g pure ethanol
    let gramsPerDrink = 14;
    let drinkType = 'standard';
    const alcoholPctParsed = parseFloat(values.alcoholPct);
    const showCustomABV = !isNaN(alcoholPctParsed) && alcoholPctParsed > 0 && alcoholPctParsed <= 100;

    if (showCustomABV) {
      // Determine serving size based on ABV range
      let servingMl: number;
      if (alcoholPctParsed <= 15) {
        servingMl = 355; // beer: 12 oz
      } else if (alcoholPctParsed <= 25) {
        servingMl = 148; // wine: 5 oz
      } else {
        servingMl = 44; // liquor: 1.5 oz
      }
      // Alcohol density: 0.789 g/ml
      gramsPerDrink = servingMl * (alcoholPctParsed / 100) * 0.789;
      drinkType = 'custom';
    }

    const totalAlcoholG = drinks * gramsPerDrink;

    // Widmark: BAC = (A / (W × r)) × 100 − (β × t)
    const beta = 0.015; // average alcohol elimination rate per hour

    // Raw BAC before metabolism
    const rawBAC = (totalAlcoholG / (weightG * rho)) * 100;

    // BAC after metabolism
    const bac = Math.max(0, rawBAC - (beta * hours));

    // Time to zero BAC
    const timeToZero = hours > 0 ? bac / beta : rawBAC / beta;

    // Hours until legal limit (0.08%)
    const timeToLegal = bac > 0.08 ? (bac - 0.08) / beta : 0;

    // Impairment level description
    const getImpairment = (b: number): { label: string; color: 'positive' | 'neutral' | 'negative' } => {
      if (b <= 0) return { label: 'No detectable alcohol', color: 'positive' };
      if (b < 0.02) return { label: 'Mildly affected — slight mood elevation', color: 'positive' };
      if (b < 0.05) return { label: 'Mild impairment — reduced coordination, altered mood', color: 'neutral' };
      if (b < 0.08) return { label: 'Moderate impairment — slowed reaction time, reduced judgment', color: 'neutral' };
      if (b < 0.15) return { label: 'Significant impairment — blurred vision, poor coordination, slurred speech', color: 'negative' };
      if (b < 0.30) return { label: 'Severe impairment — confusion, impaired gag reflex, blackout risk', color: 'negative' };
      return { label: 'Life-threatening — high risk of alcohol poisoning, respiratory depression', color: 'negative' };
    };

    const impairment = getImpairment(bac);
    const fmtBAC = (b: number) => b.toFixed(3);

    // Build drink description
    let drinkDesc: string;
    if (showCustomABV) {
      drinkDesc = `${drinks} drink(s) at ${alcoholPctParsed}% ABV · ~${Math.round(totalAlcoholG)} g alcohol (custom)`;
    } else {
      drinkDesc = `${drinks} standard drink(s) · ~${Math.round(totalAlcoholG)} g alcohol`;
    }

    // Build formula note
    let formulaNote: string;
    if (showCustomABV) {
      formulaNote = `Widmark Equation (ρ=${rho}, ABV ${alcoholPctParsed}%, β=0.015/hr)`;
    } else {
      formulaNote = 'Widmark Equation (ρ = 0.68 male / 0.55 female, β = 0.015/hr)';
    }

    return [
      {
        id: 'bac',
        label: 'Estimated Blood Alcohol Concentration',
        value: `${fmtBAC(bac)}% BAC`,
        highlight: true,
        color: impairment.color,
        interpretation: `This is a rough estimate — actual BAC varies with food intake, medication, hydration, and individual metabolism, and can run meaningfully higher or lower than this formula predicts. Never use this number to decide whether it's safe to drive; the only safe choice below any impairment is not getting behind the wheel.`,
      },
      {
        id: 'impairment',
        label: 'Impairment Level',
        value: impairment.label,
        color: impairment.color,
      },
      {
        id: 'rawBac',
        label: 'Peak BAC (Before Metabolism)',
        value: `${fmtBAC(rawBAC)}% BAC`,
        color: rawBAC > 0.08 ? 'negative' : 'neutral',
      },
      {
        id: 'timeToZero',
        label: 'Estimated Time Until Sober (0.00% BAC)',
        value: timeToZero > 0
          ? `~${Math.ceil(timeToZero)} hours (≈ ${Math.ceil(timeToZero * 60)} minutes)`
          : 'Already at 0.00% BAC',
        color: bac > 0.08 ? 'negative' : 'positive',
      },
      {
        id: 'timeToLegal',
        label: 'Time Until Under Legal Limit (0.08%)',
        value: timeToLegal > 0
          ? `~${Math.ceil(timeToLegal)} hours (≈ ${Math.ceil(timeToLegal * 60)} minutes)`
          : bac <= 0.08 && bac > 0 ? 'At or under 0.08% — still, do not drive' : 'No alcohol detected',
        color: timeToLegal > 0 ? 'negative' : 'neutral',
      },
      {
        id: 'standardDrinks',
        label: 'Standard Drinks Consumed',
        value: drinkDesc,
        color: 'neutral',
      },
      {
        id: 'formulaNote',
        label: 'Formula',
        value: formulaNote,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BACPanel, { values, results });
  },
  educational: {
    formula: 'BAC = (A ÷ (W × ρ)) × 100 − (β × t) | A = 14g × drinks | ρ = 0.68 male, 0.55 female | β = 0.015/hr',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">BAC Level Meter</text><rect x="30" y="65" width="380" height="40" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="65" width="140" height="40" rx="4" fill="var(--svg-22c55e)" opacity=".4"/><text x="100" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-22c55e)">Safe 0.00-0.04</text><rect x="170" y="65" width="80" height="40" fill="var(--svg-f59e0b)" opacity=".4"/><text x="210" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-f59e0b)">Caution</text><rect x="250" y="65" width="80" height="40" fill="var(--svg-ef4444)" opacity=".4"/><text x="290" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ef4444)">Illegal</text><rect x="330" y="65" width="80" height="40" rx="4" fill="var(--svg-8b5cf6)" opacity=".4"/><text x="370" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-8b5cf6)">Severe</text><line x1="170" y1="55" x2="170" y2="65" stroke="var(--svg-333333)" stroke-width="1.5"/><text x="170" y="52" text-anchor="middle" font-size="9" fill="var(--svg-333333)">0.04</text><line x1="250" y1="55" x2="250" y2="65" stroke="var(--svg-333333)" stroke-width="1.5"/><text x="250" y="52" text-anchor="middle" font-size="9" fill="var(--svg-333333)">0.08</text><line x1="330" y1="55" x2="330" y2="65" stroke="var(--svg-333333)" stroke-width="1.5"/><text x="330" y="52" text-anchor="middle" font-size="9" fill="var(--svg-333333)">0.15</text><text x="220" y="140" text-anchor="middle" font-size="11" fill="var(--svg-8b5cf6)">Widmark: BAC from drinks, weight, sex and time</text></svg>',
      alt: 'Four-segment BAC meter showing Safe 0.00-0.04, Caution 0.04-0.08, Illegal 0.08-0.15, and Severe 0.15+ zones with threshold markers',
      caption: 'Widmark formula estimates BAC from drinks consumed, body weight, sex, and elapsed time',
    },
    formulaDescription:
      'The Widmark formula estimates blood alcohol concentration based on the amount of alcohol consumed, body weight, sex (affecting alcohol distribution), and time elapsed. The elimination rate (0.015 g/dL per hour) is an average — actual rates vary from 0.010–0.025 based on genetics, liver function, food intake, and tolerance.',
    variables: [
      { symbol: 'BAC', name: 'Blood Alcohol Concentration', description: 'Grams of alcohol per deciliter of blood (g/dL). Expressed as a percentage — 0.08% means 0.08 g/dL.' },
      { symbol: 'Widmark ρ', name: 'Alcohol Distribution Factor', description: '0.68 for men, 0.55 for women. Accounts for differences in body water percentage affecting alcohol concentration.' },
      { symbol: 'β (beta)', name: 'Elimination Rate', description: 'Average 0.015 g/dL per hour. The liver metabolizes ~1 standard drink per hour on average.' },
      { symbol: 'Standard Drink', name: 'Standard Drink', description: '14 g (0.6 oz) pure alcohol. Equivalent to: 12 oz beer (5% ABV), 5 oz wine (12% ABV), or 1.5 oz distilled spirits (40% ABV).' },
      { symbol: 'Peak BAC', name: 'Peak BAC Before Metabolism', description: 'The raw BAC immediately after alcohol absorption, before the liver begins eliminating alcohol. Actual peak depends on how fast you drink and food intake.' },
    ],
    quickReference: [
      { label: 'Standard drink (US)', value: '14 g (0.6 oz) pure alcohol = 12 oz beer (5%), 5 oz wine (12%), 1.5 oz liquor (40%)' },
      { label: 'Legal limit (most US states)', value: '0.08% BAC — driving at or above this is illegal in 49 of 50 states' },
      { label: 'Utah legal limit', value: '0.05% BAC — strictest in the US (since 2018)' },
      { label: 'Commercial drivers (CDL)', value: '0.04% BAC — federal limit for commercial vehicle operators' },
      { label: 'Zero tolerance (under 21)', value: '0.00–0.02% BAC — all US states have zero-tolerance laws for underage drivers' },
      { label: 'Widmark rho (male)', value: '0.68 — average alcohol distribution factor; range 0.60–0.75 depending on body composition' },
      { label: 'Widmark rho (female)', value: '0.55 — average alcohol distribution factor; range 0.45–0.65 depending on body composition' },
      { label: 'Elimination rate (β)', value: '0.015 g/dL per hour — average; range 0.010–0.025 depending on genetics and liver health' },
      { label: 'Time to metabolize 1 drink', value: '~1 hour for average adult — but can be 45 min to 2+ hours depending on individual' },
      { label: 'Peak BAC timing (empty stomach)', value: '30–60 minutes after last drink' },
      { label: 'Peak BAC timing (with food)', value: '60–90 minutes after last drink — food delays gastric emptying' },
      { label: 'BAC 0.02–0.04%', value: 'Mild mood elevation, slight warmth, relaxation. Impairment begins in some individuals.' },
      { label: 'BAC 0.05–0.08%', value: 'Reduced coordination, impaired judgment, slower reaction time. Driving impairment measurable.' },
      { label: 'BAC 0.08–0.15%', value: 'Significant impairment: blurred vision, poor balance, slurred speech. Legally intoxicated in all states.' },
      { label: 'BAC 0.15–0.30%', value: 'Severe impairment: confusion, vomiting, blackouts possible. High risk of injury.' },
      { label: 'BAC > 0.30%', value: 'Life-threatening: risk of coma, respiratory depression, death. Emergency medical attention needed.' },
      { label: 'Binge drinking (CDC definition)', value: '≥5 drinks (male) or ≥4 drinks (female) in ~2 hours — typically produces BAC ≥ 0.08%' },
    ],
    howToUse: [
      'Enter your sex and body weight in pounds.',
      'Enter the number of standard drinks consumed (12 oz beer / 5 oz wine / 1.5 oz liquor = 1 drink each).',
      'Optionally enter the ABV if your drink differs from standard strengths.',
      'Enter the number of hours since you started drinking.',
      'Review the estimated BAC and the bold safety disclaimer. Never drive based on this estimate.',
    ],
    explanation:
      'Blood Alcohol Concentration (BAC) measures the amount of alcohol in your bloodstream. The Widmark formula has been used since 1932 and remains the standard for forensic BAC estimation. Alcohol is absorbed through the stomach and small intestine into the bloodstream, then metabolized primarily by the liver at a rate of approximately 0.015 g/dL per hour (about 1 standard drink per hour). Factors affecting actual BAC include: food intake (slows absorption), body composition (muscle holds more water than fat), liver health, genetics, medications, and tolerance. The same number of drinks produces different BACs at different times due to these factors. For example, a 200 lb man and a 130 lb woman who both consume 3 standard drinks over 2 hours will have very different estimated BACs — the man at approximately 0.055% and the woman at approximately 0.079%, which is just under the legal limit for him but over for her. This illustrates why body weight and sex are critical variables, not mere formality. Food in the stomach can reduce peak BAC by 50–60% compared to drinking on an empty stomach — a full meal before drinking significantly changes the outcome. However, once alcohol is absorbed, nothing speeds up elimination except time: coffee, cold showers, exercise, and vomiting do not lower BAC. This tool provides an estimate and is not legally or medically definitive. Never drive after consuming any alcohol.',
    faqs: [
      {
        question: 'Can I use this to determine if it is safe to drive?',
        answer: 'No. This is a rough estimate and cannot be used to determine whether it is legal or safe to drive. BAC varies significantly between individuals based on genetics, food intake, medications, hydration, and other factors. If you have consumed any alcohol, the safest choice is not to drive. Even at BACs below the legal limit, impairment begins at 0.02% for some individuals. The only truly safe BAC for driving is 0.00%. In the US, drunk driving kills approximately 37 people per day — about one death every 39 minutes. Use this calculator for education, not for driving decisions. If you plan to drink, plan not to drive — arrange a designated driver, rideshare, or public transit in advance.',
      },
      {
        question: 'How accurate is the Widmark formula?',
        answer: 'The Widmark formula provides a reasonable estimate (±0.01–0.02% for most people) but can be off by more for individuals with very high or low body fat, those on medications, or those with liver conditions. The elimination rate (0.015/hr) is an average — actual rates range from 0.010–0.025. This is not a forensic-grade calculation. Forensic BAC determination uses direct measurement (breathalyzer calibrated to NIST standards, blood test by gas chromatography) and retrograde extrapolation accounting for the exact drinking timeline, food intake, and individual elimination rate.',
      },
      {
        question: 'Does eating food affect BAC?',
        answer: 'Yes. Food in the stomach slows alcohol absorption by delaying gastric emptying, resulting in a lower peak BAC and slower onset. A full meal before drinking can reduce peak BAC by 50–60% compared to drinking on an empty stomach. However, food does not speed up metabolism — once absorbed, alcohol is eliminated at the same rate. The pyloric sphincter (valve between stomach and small intestine) closes after eating, keeping alcohol in the stomach longer where absorption is slower. Fatty and protein-rich meals are most effective; carbohydrate-only meals have less effect.',
      },
      {
        question: 'Can I speed up alcohol elimination?',
        answer: 'No. Coffee, cold showers, exercise, and vomiting do not speed up alcohol metabolism. The liver metabolizes alcohol at a fixed rate of ~0.015 g/dL per hour regardless of any interventions. Only time reduces BAC. Drinking water helps with hydration but does not lower BAC. The belief that coffee "sobers you up" is dangerous — caffeine may make you feel more alert, but your BAC is unchanged and your impairment (reaction time, judgment, coordination) remains. Vomiting after alcohol has been absorbed into the bloodstream (30+ minutes after drinking) removes almost no alcohol and adds risks of aspiration and esophageal damage.',
      },
      {
        question: 'What factors most affect how quickly I get drunk?',
        answer: 'The biggest factors are: (1) how fast you drink — your liver processes only about 1 drink per hour, so drinking faster than that accumulates alcohol; (2) food in your stomach — a full meal can reduce peak BAC by 50–60%; (3) your body weight and composition — lower weight and higher body fat percentage both lead to higher BAC for the same number of drinks; and (4) your biological sex — women typically reach higher BAC than men after the same number of drinks due to lower body water volume and lower alcohol dehydrogenase activity. Additional important factors: carbonated mixers (champagne, soda mixers) speed absorption; medications including acetaminophen (Tylenol) compete for liver enzymes and slow alcohol metabolism; and tolerance — chronic heavy drinkers may feel less impaired at a given BAC but have the same actual motor and cognitive deficits.',
      },
      {
        question: 'Why is the legal limit 0.08% BAC?',
        answer: 'The 0.08% limit was established based on research showing that virtually all drivers are significantly impaired at this level — reaction time, tracking ability, divided attention, and information processing are measurably degraded. At 0.08% BAC, the risk of a fatal crash is approximately 4–5 times higher than at 0.00%. Some countries have lower limits: most of Europe uses 0.05%, Sweden and Norway use 0.02%, and several countries (including Czech Republic, Hungary, Romania, Slovakia) have a 0.00% limit. The US National Transportation Safety Board has recommended lowering the US limit to 0.05% since 2013. Utah became the first state to adopt 0.05% in 2018; studies show a 20% reduction in fatal crashes in the first year after the change. The 0.08% is a legal bright line — but impairment begins well below it, typically at 0.02–0.04%.',
      },
      {
        question: 'How does tolerance affect BAC and impairment?',
        answer: 'Tolerance affects how intoxicated you FEEL at a given BAC — not your actual BAC or your actual impairment. A chronic heavy drinker may appear and feel less impaired at 0.15% BAC than an occasional drinker at 0.05%, but their reaction time, judgment, and motor coordination are still objectively degraded. This is called "functional tolerance" and it is dangerous because it divorces subjective feeling from objective risk. Tolerance does NOT change the Widmark formula — your BAC calculation is the same regardless of your drinking history. If you have developed tolerance, your actual impairment at any given BAC is likely to be worse than you perceive. Tolerance is also a warning sign of alcohol use disorder (AUD) per DSM-5 criteria.',
      },
      {
        question: 'What BAC level requires emergency medical attention?',
        answer: 'BAC above 0.30% is potentially life-threatening. Signs of alcohol poisoning requiring immediate 911/emergency call include: mental confusion or stupor (can\'t be roused), vomiting while semi-conscious or unconscious, seizures, slow or irregular breathing (fewer than 8 breaths per minute or gaps of 10+ seconds between breaths), hypothermia (cold, clammy, pale or bluish skin — especially lips and fingernails), and loss of consciousness/unresponsiveness. Do NOT leave an unconscious person to "sleep it off" — BAC can continue to rise from alcohol still in the stomach, and a person who seems merely very drunk can progress to respiratory arrest. Roll them on their side (recovery position) to prevent choking on vomit. The lethal BAC for an average adult is approximately 0.40%, though deaths have occurred at lower levels and some chronic alcoholics have survived higher levels.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A 180 lb man drinks 4 standard beers (5% ABV, 12 oz each) over 3 hours at a barbecue. He ate a full meal beforehand. He wants to know his approximate BAC and whether he should wait before driving home.',
        inputs: { sex: 'male', weight: '180', drinks: '4', hours: '3' },
        result: 'Estimated BAC: approximately 0.043%. Peak BAC (before metabolism): 0.088%. Time until sober (0.00%): ~3 hours. Currently at or under 0.08% but still impaired. Impairment level: Mild impairment — reduced coordination, altered mood.',
        insight: 'Even though this man is technically under 0.08% at the 3-hour mark (0.043%), he is still measurably impaired — his reaction time, divided attention, and coordination are degraded. The food he ate helped keep his peak BAC lower than it would have been on an empty stomach (likely ~0.10% vs ~0.14%). However, at 0.043% his crash risk is still elevated approximately 1.5–2x compared to 0.00%. He should wait at least 3 more hours to reach 0.00%, or use a rideshare/designated driver. Note: his peak BAC (0.088%) occurred about 60 minutes after his last drink — that was when he was most impaired, not when he was actively drinking. This common misperception is why people often drive at their most impaired state thinking they\'ve "sobered up."',
      },
      {
        scenario: 'A 130 lb woman drinks 3 glasses of wine (12% ABV, 5 oz each) over 2 hours at dinner. She did not eat much. She wants to understand why 3 drinks for her is different from 3 drinks for her 200 lb male friend.',
        inputs: { sex: 'female', weight: '130', drinks: '3', hours: '2' },
        result: 'Estimated BAC: approximately 0.079%. Peak BAC (before metabolism): 0.109%. At or just under 0.08%. Time until sober (0.00%): ~5.3 hours. Impairment level: Moderate impairment — slowed reaction time, reduced judgment.',
        insight: 'At 0.079% BAC, this woman is at the legal limit — one more drink would put her clearly over. Compare with her 200 lb male friend who had the same 3 drinks over 2 hours: his estimated BAC would be approximately 0.038% — less than half her BAC. This stark difference is driven by two factors: (1) the Widmark distribution factor (0.55 vs 0.68) accounts for women\'s lower body water percentage, and (2) her lower body weight (130 vs 200 lbs) means less tissue volume to distribute the alcohol. Additionally, women have lower levels of alcohol dehydrogenase (ADH) — the stomach enzyme that begins metabolizing alcohol before it enters the bloodstream — meaning a higher percentage of ingested alcohol reaches the blood. The combination of these factors means that "drink for drink" comparisons between men and women are not valid. A woman drinking the same number of drinks as her male companion will almost always have a significantly higher BAC.',
      },
      {
        scenario: 'A 200 lb man attending a party drinks 6 craft IPAs (7.5% ABV, 12 oz each) over 4 hours. He\'s been drinking steadily and hasn\'t eaten since lunch. He enters the custom ABV to see how these stronger beers differ from standard 5% beer.',
        inputs: { sex: 'male', weight: '200', drinks: '6', hours: '4', alcoholPct: '7.5' },
        result: 'Estimated BAC: approximately 0.091%. Peak BAC: 0.151%. Legal limit threshold reached at approximately hour 4.7. Time until sober (0.00%): ~6 hours. Time until under 0.08%: ~0.7 hours. Impairment level: Significant impairment — blurred vision, poor coordination.',
        insight: 'This is a dangerous situation for several reasons. First, craft IPAs at 7.5% ABV contain significantly more alcohol than standard 5% beer: each 12 oz IPA contains approximately 21g of pure alcohol vs. 14g for standard beer — about 50% more per drink. Six 7.5% ABV beers are equivalent to about 9 standard drinks. Second, without food, absorption is faster and peak BAC is higher. Third, at 0.091%, he is over the legal limit and significantly impaired — this is NOT subtle impairment. He should not drive for at least another hour to reach 0.08%, but even then he should not drive. At 0.091% BAC, his crash risk is approximately 5–10x baseline. The best choice is a rideshare or a sober ride. A common scenario leading to DUIs: the person feels "mostly fine" at hour 4 because most of the alcohol was consumed earlier, but the long tail of metabolism (still several hours from 0.00%) means they are still legally intoxicated. This case illustrates why "I stopped drinking an hour ago so I\'m fine" is dangerous reasoning.',
      },
    ],
    proTips: [
      'The most dangerous time for driving is NOT when you feel most intoxicated — it\'s typically 30–90 minutes after your last drink when BAC peaks but you subjectively feel like you\'re "coming down." This is when people decide they\'re "okay to drive." Your BAC is mathematically highest at this point even though the intense initial buzz has worn off. Plan your ride home BEFORE you start drinking, not after.',
      'Track "standard drinks," not "number of beverages." One craft IPA at 7.5% ABV is roughly 1.5 standard drinks. One 9 oz pour of 14% wine at a restaurant (many places pour more than 5 oz) is about 2 standard drinks. A "double" cocktail made with 3 oz of 40% liquor is 2 standard drinks. Misunderstanding serving sizes is the single biggest cause of BAC estimate errors. Pour 5 oz of wine into a measuring cup once — you may be surprised at how small a "standard drink" actually looks.',
      'Carbonated alcoholic beverages (champagne, prosecco, beer, soda-mixed cocktails) are absorbed faster than non-carbonated ones. The carbonation increases pressure in the stomach, forcing the pyloric sphincter open and accelerating gastric emptying into the small intestine where alcohol is absorbed most rapidly. Studies show peak BAC from champagne can be 20–30% higher than from the same amount of alcohol in a non-carbonated drink consumed at the same rate. If you\'re drinking sparkling wine or beer, your BAC will rise faster and peak higher than this calculator\'s Widmark estimate would suggest.',
      'Medications dramatically affect alcohol metabolism and impairment. Acetaminophen (Tylenol/paracetamol) competes for the same liver enzyme pathway (CYP2E1) and slows alcohol clearance while also increasing the risk of liver damage — the combination is hepatotoxic. Antihistamines, benzodiazepines, opioids, and sleep medications have synergistic sedative effects with alcohol — 0.05% BAC with these medications can produce impairment equivalent to 0.10%+ BAC alone. Read medication labels and consult your pharmacist. If your medication says "do not drink alcohol," it means your BAC estimate from this calculator is an underestimate of your actual impairment.',
      'The Widmark formula assumes alcohol is consumed evenly over the time period. If you consumed all your drinks in the first hour and then nothing for 3 hours, your actual BAC curve looks very different from someone who sipped slowly over 4 hours — even though the "drinks" and "hours" numbers are the same. Binge drinking (rapid consumption) produces a much higher peak BAC followed by a steeper decline. The formula averages this out and will underestimate your peak BAC in binge scenarios. For rapid consumption, add 20–30% to the peak BAC estimate.',
      'Mobile breathalyzers (personal BAC testers) are available for $30–100 but have significant accuracy limitations. Consumer-grade devices use semiconductor sensors that drift with temperature, humidity, and repeated use — they can be off by ±0.02% or more compared to police-grade fuel-cell devices. They require calibration every 6–12 months (which most users never do) and a 15–20 minute wait after your last drink to avoid mouth alcohol contamination giving falsely high readings. If you use one, treat it as confirmatory only when it reads BELOW 0.02% — never as a "barely under 0.08%" permission slip to drive.',
    ],
    limitations: [
      'Individual biological variation — the Widmark distribution factor (rho) varies from 0.60–0.75 for men and 0.45–0.65 for women depending on body fat, age, and health. Alcohol elimination rate (beta) ranges from 0.010–0.025 g/dL/hr, with chronic drinkers eliminating faster and those with liver disease slower.',
      'Consumption pattern effects — drinking faster produces a higher peak BAC than the same drinks consumed slowly. Food, carbonated beverages, and medication interactions all affect absorption and are not modeled quantitatively.',
      'Genetic and health factors — ALDH2 deficiency (affecting ~36% of East Asians) dramatically slows metabolism. Liver disease, kidney disease, and diabetes all alter alcohol processing. Arterial BAC can be 50%+ higher than venous BAC in the first 30–60 minutes after drinking.',
      'This tool is NOT a sobriety test and MUST NOT be used to decide whether to drive. The only safe BAC for driving is 0.00%. If you have consumed any alcohol, do not drive. For emergencies, call 911. For alcohol concerns, contact SAMHSA at 1-800-662-HELP (4357).',
    ],
    commonUses: [
      'Personal safety planning — estimate BAC and time until sober after drinking to make informed decisions about driving and other activities',
      'Legal awareness — understand how BAC relates to legal driving limits (0.08% in most US states) and the impairment levels that appear at different concentrations',
      'Educational demonstrations — the Widmark formula illustrates how body weight, sex, number of drinks, and elapsed time interact to affect blood alcohol concentration',
      'Social event planning — estimate the effects of different drinking patterns to plan safer consumption and understand why the same number of drinks affects people differently'
    ],
    citations: [
      { source: 'NIH - NIAAA BAC', url: 'https://www.niaaa.nih.gov/publications/brochures-and-fact-sheets/understanding-blood-alcohol-concentration' },
      { source: 'CDC - Alcohol and Public Health', url: 'https://www.cdc.gov/alcohol/' },
      { source: 'SAMHSA National Helpline', url: 'https://www.samhsa.gov/find-help/national-helpline' },
    ],
  },
};

export default bacConfig;
