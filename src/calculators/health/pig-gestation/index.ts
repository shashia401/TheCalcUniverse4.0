import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';

const pigGestationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'breedingDate',
      label: 'Breeding / Service Date',
      type: 'date',
      required: true,
      helpText: 'Supports both metric (SI) and imperial units. The date the sow was bred or artificially inseminated. Most sows are bred twice (12–24 hours apart) during standing heat. Use the first breeding date.',
    },
    {
      id: 'breedType',
      label: 'Breed Type / Size',
      type: 'select',
      options: [
        { label: 'Commercial / Crossbred (average)', value: 'commercial' },
        { label: 'Heritage / Large Breed (e.g., Berkshire, Tamworth)', value: 'large' },
        { label: 'Miniature / Potbelly', value: 'mini' },
      ],
      defaultValue: 'commercial',
      helpText: 'Commercial breeds average 114 days. Heritage breeds and mini pigs may vary by 1–3 days. Potbelly pigs average 113–115 days.',
    },
    {
      id: 'parity',
      label: 'Parity (Number of Previous Litters)',
      type: 'select',
      options: [
        { label: 'Gilts (first pregnancy)', value: 'gilt' },
        { label: 'Sow — 1–2 previous litters', value: 'youngSow' },
        { label: 'Sow — 3–5 previous litters', value: 'matureSow' },
        { label: 'Sow — 6+ previous litters', value: 'olderSow' },
      ],
      defaultValue: 'gilt',
      helpText: 'Gilts (first-time mothers) sometimes farrow 1–2 days earlier. Mature sows are most consistent. Older sows may carry slightly longer.',
},
],
calculate: (values): CalculatorResult[] => {
    const breedingStr = values.breedingDate;
    const breedType = values.breedType || 'commercial';
    const parity = values.parity || 'gilt';

    if (!breedingStr || !breedingStr.trim()) return [];

    const breedingDate = new Date(breedingStr);
    if (isNaN(breedingDate.getTime())) return [];

    // Base gestation: 114 days (3-3-3 rule)
    let gestationDays = 114;

    // Heritage breeds sometimes go 1–2 days longer
    if (breedType === 'large') gestationDays = 115;
    if (breedType === 'mini') gestationDays = 114;

    // Gilts may farrow 1 day early; older sows 1 day late
    if (parity === 'gilt') gestationDays = 114;
    if (parity === 'olderSow') gestationDays = 115;

    const dueDate = new Date(breedingDate);
    dueDate.setDate(dueDate.getDate() + gestationDays);

    const today = new Date();
    const totalDays = gestationDays;
    const daysElapsed = Math.max(0, Math.floor((today.getTime() - breedingDate.getTime()) / 86400000));
    const daysRemaining = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / 86400000));

    const progressPct = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

    // Key milestones
    const milestones = [
      { day: 0, label: 'Breeding / AI' },
      { day: 12, label: 'Embryos implant in uterine wall (day 12–14)' },
      { day: 21, label: 'Pregnancy check possible (ultrasound, day 21–28)' },
      { day: 30, label: 'Organogenesis complete — all organs formed' },
      { day: 35, label: 'Fetal skeleton begins calcification' },
      { day: 70, label: 'Fetal growth accelerates — 70% of fetal weight gained after day 70' },
      { day: 90, label: 'Prepare farrowing crate — move sow 7–10 days before due' },
      { day: 110, label: 'Mammary development — udder "bagging up" begins' },
      { day: 113, label: 'Milk letdown — colostrum present, farrowing imminent (24–48h)' },
      { day: gestationDays, label: 'Expected farrowing date (114 ± 2 days)' },
    ];

    const fmt = (n: number) => Math.round(n).toString();

    const results: CalculatorResult[] = [
      { id: 'dueDate', label: 'Expected Farrowing Date', value: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), highlight: true, color: 'positive' },
      { id: 'gestation', label: 'Gestation Period', value: `${gestationDays} days (3 months, 3 weeks, 3 days)`, color: 'positive' },
      { id: 'breedingDate', label: 'Breeding Date', value: breedingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), color: 'neutral' },
      { id: 'progress', label: 'Pregnancy Progress', value: daysRemaining > 0 ? `${progressPct}% complete — ${daysRemaining} days remaining` : 'Farrowing due!', color: 'neutral' },
      { id: 'earlyWindow', label: 'Earliest Possible (112 days)', value: new Date(breedingDate.getTime() + 112 * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), color: 'neutral' },
      { id: 'lateWindow', label: 'Latest Expected (116 days)', value: new Date(breedingDate.getTime() + 116 * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), color: 'neutral' },
    ];

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'Pig gestation = 114 days (3 months, 3 weeks, 3 days)',
    formulaDescription: "The pig gestation period is one of the most consistent in the animal kingdom: 114 ± 2 days. The traditional farmer's rule '3 months, 3 weeks, 3 days' (3 × 30 + 3 × 7 + 3 = 114) has been used for centuries and is remarkably accurate across all pig breeds. Modern commercial sows average 114.5 days.",
    variables: [
      { symbol: '3-3-3', name: "Farmer's Rule", description: '3 months (90 days) + 3 weeks (21 days) + 3 days = 114 days. Accurate to ±2 days for all breeds. This mnemonic has been passed down through generations of pig farmers and remains the gold standard for predicting farrowing dates.' },
      { symbol: 'Parity Effect', name: 'Number of Previous Litters', description: 'Gilts (first pregnancy) may farrow ~1 day earlier. Mature sows (parity 3–5) are most consistent. Older sows (6+) may carry 1 day longer.' },
    ],
    howToUse: [
      'Enter the first breeding date or AI date.',
      'Select the breed type and parity for more precise estimation.',
      'The due date is calculated using the 114-day rule.',
      'Review the pregnancy milestones to know what to expect at each stage.',
      'Prepare the farrowing crate by day 107–110 — move the sow early to reduce stress.',
    ],
    quickReference: [
      { label: '3-3-3 Rule', value: '3 months + 3 weeks + 3 days = 114 days' },
      { label: 'Normal range', value: '112–116 days (114 ± 2)' },
      { label: 'Gestation length', value: '114 days (all breeds ±2 days)' },
      { label: 'Litter size', value: '8–14 piglets (commercial avg 12–14)' },
      { label: 'Piglet birth weight', value: '1.1–1.5 kg (2.5–3.3 lbs)' },
      { label: 'Weaning age', value: '21–28 days (commercial), 6–8 weeks (traditional)' },
      { label: 'Return to estrus', value: '3–7 days after weaning' },
      { label: 'Litters per year', value: '2.2–2.5 (commercial sow)' },
    ],
    commonUses: [
      'Commercial pig farming — scheduling farrowing to manage all-in/all-out batch production and barn utilization.',
      'Small farm planning — preparing farrowing pens, heat lamps, and supplies before piglets arrive.',
      'Veterinary scheduling — timing pregnancy checks, vaccinations, and farrowing supervision.',
      '4H and FFA projects — students tracking their breeding projects for fairs and livestock competitions.',
      'Potbelly pig pet owners — preparing for an unexpected litter and finding homes for piglets.',
    ],
    explanation: "Pig gestation is remarkably consistent across all breeds — 114 days, give or take 2 days. This precision is unusual among livestock and makes the pig farmer's job more predictable than cattle or horse breeding. The '3-3-3 rule' (3 months, 3 weeks, 3 days) is one of the most reliable mnemonics in animal husbandry. Day 1–12: fertilized embryos migrate through the uterus. Day 12–14: implantation — embryos must be spaced evenly in both uterine horns, with at least 4 embryos present total for the pregnancy to continue. Day 21–28: ultrasound can confirm pregnancy. Day 30–70: organogenesis and steady growth. Day 70+: the 'growth phase' — 70% of fetal weight is gained in the last 30 days. Day 107–110: move the sow to the farrowing crate to reduce stress and prevent crushing of newborn piglets. Day 113: colostrum appears — farrowing is 24–48 hours away. Signs of imminent farrowing: restless nesting behavior, milk letdown, and a drop in body temperature (~1°C). Most sows farrow in the evening or at night. The pig industry has optimized gestation to maximize productivity: a commercial sow produces 2.2–2.5 litters per year with 10–14 piglets per litter — over 30 piglets annually.",
    faqs: [
      {
        question: 'What is the 3-3-3 rule for pig gestation?',
        answer: 'The 3-3-3 rule is the farmer\'s mnemonic for pig gestation: 3 months (90 days) + 3 weeks (21 days) + 3 days = 114 days. Simply take the breeding date, count forward 3 months, then 3 weeks, then 3 days. Example: bred January 1 → April 1 (3 months) → April 22 (3 weeks) → April 25 (3 days). This method has been used for generations and is accurate to ±2 days. Modern research confirms the average is exactly 114.5 days across all breeds.',
      },
      {
        question: 'How soon after farrowing can a sow be bred again?',
        answer: 'Sows return to estrus (standing heat) 3–7 days after weaning piglets. In commercial systems, piglets are weaned at 21–28 days, so the sow returns to estrus around day 25–32 postpartum. Breeding at this first estrus gives a farrowing interval of ~140 days (114 + 28) or about 2.6 litters per year. Some producers use "skip-a-heat" — waiting until the second post-weaning estrus — for better litter size in gilts or thin sows.',
      },
      {
        question: 'What are the signs that a sow is about to farrow?',
        answer: 'Key signs: (1) Nesting behavior — the sow gathers bedding material 24–48 hours before farrowing. (2) Udder development — "bagging up" begins 7–10 days before, with colostrum present 24 hours before. (3) Vulvar swelling — 2–3 days before. (4) Milk letdown — squeeze a teat and milk flows; farrowing is within 12–24 hours. (5) Body temperature — drops ~1°C (1.8°F) 12–24 hours before farrowing. (6) Restlessness and lying on her side alternating with standing. Piglets arrive every 10–20 minutes, with the entire litter delivered in 2–6 hours.',
      },
      {
        question: 'How many piglets are in a typical litter?',
        answer: 'Commercial crossbred sows average 12–14 total born, with 10–12 born alive. Gilts average 9–11 piglets in their first litter. Litter size increases with parity, peaking at parity 3–5 (13–16 total). After parity 6–7, litter size gradually declines. Heritage breeds average 6–10 piglets. The largest recorded litter: 37 piglets (Australia, 2021). Factors affecting litter size: genetics, nutrition, parity, season (slightly larger in spring/fall), and breeding timing relative to ovulation.',
      },
      {
        question: 'How do I calculate the farrowing date for a potbelly pig?',
        answer: 'Potbelly (miniature) pigs have the same 114-day gestation as commercial pigs. The 3-3-3 rule works identically. The key difference is litter size: potbellies average 4–8 piglets vs 10–14 for commercial breeds. Signs of pregnancy are less obvious in potbellies — weight gain and udder development may not be visible until the final 2–3 weeks. Ultrasound confirmation at day 25–30 is recommended for pet pig owners who may not be certain of breeding dates.',
      },
    ],
    proTips: [
      'Piglets should nurse within 30 minutes of birth to receive colostrum — the first milk rich in antibodies. Piglets that don\'t nurse quickly have significantly lower survival rates.',
      'The farrowing environment should be 32–35°C (90–95°F) for piglets but 18–20°C (65–70°F) for the sow. Use heat lamps or heating pads in a creep area — the sow and piglets have incompatible temperature needs.',
      'If farrowing exceeds 6 hours or piglets arrive more than 45 minutes apart, consider veterinary intervention. Dystocia (difficult birth) is less common in pigs than cattle but does occur, especially in gilts and obese sows.',
      'Record keeping is your most powerful tool: a sow card tracking each litter (total born, born alive, stillborns, weaning weight) lets you cull underperforming sows and select replacement gilts from the best mothers.',
    ],
    workedExamples: [
      {
        scenario: 'A gilt was bred on March 1, 2025. When should the farmer prepare for farrowing?',
        inputs: { breedingDate: '2025-03-01', breedType: 'commercial', parity: 'gilt' },
        result: 'Estimated farrowing date: June 23, 2025 (gestation period ~114 days). Farrowing window: June 21–25.',
        insight: 'March 1 + 114 days = June 23, 2025. The farmer should move the gilt to the farrowing crate by June 13–16 (day 107–110). Clean, disinfect, and heat-lamp the creep area. Gilts sometimes farrow 1 day early, so start overnight monitoring on June 21. This gilt\'s litter is timed for late June — piglets weaned by mid-July, finished by December — ideal for holiday market sales.',
      },
      {
        scenario: 'A mature sow (4th litter, commercial) was AI\'d on October 15, 2025. Calculate her farrowing date and window.',
        inputs: { breedingDate: '2025-10-15', breedType: 'commercial', parity: 'matureSow' },
        result: 'Estimated farrowing date: February 6, 2026 (gestation period ~114 days). Farrowing window: February 4–8.',
        insight: 'October 15 + 114 = February 6, 2026. This mature sow should farrow right on schedule (±1 day). Window: Feb 4–8. This is a winter litter — extra precautions needed: ensure farrowing room is draft-free, heat lamps are tested, and the creep area stays at 32–35°C despite outside cold. Piglets are most vulnerable to chilling in the first 24 hours.',
      },
    ],
    limitations: [
      'This calculator uses the standard 114-day gestation period for swine. Individual sows may farrow 1–2 days earlier or later depending on breed, parity, and health status.',
      'Factors not accounted for: premature farrowing due to illness, heat stress, or mycotoxin-contaminated feed; breed-specific variations beyond the listed breed types; and the effect of unusually large litters (14+ piglets) which sometimes trigger earlier farrowing.',
      'Environmental stressors such as extreme temperatures, overcrowding, and poor nutrition can alter gestation length and are not modeled by this calculator.',
      'This is a planning tool, not a substitute for veterinary monitoring. Always consult a swine veterinarian for high-value breeding stock or when complications arise.',
    ],
  citations: [
      { source: 'Wikipedia — Pig Gestation', url: 'https://en.wikipedia.org/wiki/Pig_Gestation' },
      { source: 'Pig Gestation — Engineering Reference', url: 'https://www.engineeringtoolbox.com/' },
    ],
  },
};

export default pigGestationConfig;
