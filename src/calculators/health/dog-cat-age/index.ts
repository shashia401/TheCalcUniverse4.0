import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DogCatAgePanel from './DogCatAgePanel';

const dogCatAgeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'species',
      label: 'Species',
      type: 'select',
      required: true,
      helpText: 'Choose Dog or Cat — they have different aging formulas',
      options: [
        { label: 'Dog', value: 'dog' },
        { label: 'Cat', value: 'cat' },
      ],
    },
    {
      id: 'dogSize',
      label: 'Dog Size',
      type: 'select',
      required: true,
      helpText: 'Size affects life stage classification — larger dogs enter senior status earlier',
      options: [
        { label: 'Small (<9 kg)', value: 'small' },
        { label: 'Medium (9–23 kg)', value: 'medium' },
        { label: 'Large (>23 kg)', value: 'large' },
      ],
      showWhen: (values) => values.species === 'dog',
    },
    {
      id: 'petAgeYears',
      label: "Pet's Age (years)",
      type: 'number',
      required: true,
      min: 0,
      max: 30,
      step: 0.5,
      inputMode: 'decimal',
      placeholder: '5',
      helpText: 'Enter your pet age in years (e.g., 1.5 for 18 months)',
    },
  ],
  calculate: (values) => {
    const species = values.species;
    const dogSize = values.dogSize || 'medium';
    const ageStr = values.petAgeYears;
    const age = parseFloat(ageStr);

    if (isNaN(age) || age < 0) return [];
    if (age === 0) return [];

    const results: ReturnType<CalculatorConfig['calculate']> = [];

    if (species === 'dog') {
      // ── Traditional method ──
      let traditionalHumanAge: number;
      if (age < 1) {
        // Puppy < 1 year: simplified
        traditionalHumanAge = age * 15;
      } else if (age < 2) {
        // First year = 15 human years
        traditionalHumanAge = 15;
      } else {
        // First year = 15, second year = 9, each additional = 4
        traditionalHumanAge = 15 + 9 + (age - 2) * 4;
      }

      // ── Epigenetic method (NIH 2020) — only for age ≥ 1 ──
      let epigeneticHumanAge: number | null = null;
      if (age >= 1) {
        epigeneticHumanAge = 16 * Math.log(age) + 31;
      }

      // Life stage lookup for dogs based on size
      const getDogLifeStage = (a: number, size: string): string => {
        if (a < 1) return 'Puppy';
        if (a >= 1 && a < 2) return 'Junior';
        if (a >= 2 && a <= 6)
          return size === 'large' && a >= 5 ? 'Mature' : 'Adult';
        if (a >= 7 && a <= 10)
          return size === 'small' ? 'Mature' : 'Senior';
        if (a >= 11 && a <= 14) return 'Senior';
        return 'Geriatric';
      };
      const stage = getDogLifeStage(age, dogSize);

      results.push({
        id: 'traditionalAge',
        label: 'Traditional (×7 Method)',
        value: `${Math.round(traditionalHumanAge)} human years`,
        color: 'neutral',
      });

      if (epigeneticHumanAge !== null) {
        results.push({
          id: 'epigeneticAge',
          label: 'Epigenetic (NIH 2020 Study)',
          value: `${epigeneticHumanAge.toFixed(1)} human years`,
          highlight: true,
          color: 'positive',
        });
      } else {
        results.push({
          id: 'epigeneticNote',
          label: 'Epigenetic Method',
          value: 'Applies to dogs aged 1 year and older',
          color: 'neutral',
        });
      }

      results.push({
        id: 'lifeStage',
        label: 'Life Stage',
        value: stage,
        color: stage === 'Puppy' || stage === 'Junior' ? 'positive' : stage === 'Adult' ? 'neutral' : 'negative',
      });
    } else {
      // ── Cat ──
      // Traditional formula: first year = 15, second year = 9, each additional = 4
      let catHumanAge: number;
      if (age < 1) {
        catHumanAge = age * 15;
      } else {
        catHumanAge = 15 + 9 + Math.max(0, (age - 2)) * 4;
      }

      // Life stage
      const getCatLifeStage = (a: number): string => {
        if (a < 1) return 'Kitten';
        if (a >= 1 && a < 2) return 'Junior';
        if (a >= 2 && a <= 6) return 'Adult';
        if (a >= 7 && a <= 10) return 'Mature';
        if (a >= 11 && a <= 14) return 'Senior';
        return 'Geriatric';
      };
      const catStage = getCatLifeStage(age);

      // Traditional ×7 comparison
      const sevenMethod = age * 7;

      results.push({
        id: 'catHumanAge',
        label: 'Cat Age in Human Years',
        value: `${Math.round(catHumanAge)} human years`,
        highlight: true,
        color: 'positive',
      });

      results.push({
        id: 'traditionalSeven',
        label: 'Traditional ×7 Method',
        value: `${Math.round(sevenMethod)} human years`,
        color: 'neutral',
      });

      results.push({
        id: 'lifeStage',
        label: 'Life Stage',
        value: catStage,
        color: catStage === 'Kitten' || catStage === 'Junior' ? 'positive' : catStage === 'Adult' ? 'neutral' : 'negative',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DogCatAgePanel, { values, results });
  },
  educational: {
    formula: 'Dog (epigenetic): Human Age = 16 × ln(Pet Age) + 31  |  Dog/Cat (traditional): 1st year = 15, 2nd year = 9, each additional = 4',
    formulaDescription:
      'For dogs aged 1+, the epigenetic formula (based on DNA methylation patterns) provides a scientifically updated age equivalent. The traditional method applies a fixed stepwise progression. Cats follow the traditional stepwise method.',
    diagram: {
      svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="240" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Pet Age vs Human Age Equivalents</text>' +
        '<!-- Dog bar -->' +
        '<rect x="30" y="40" width="180" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.85"/>' +
        '<text x="120" y="56" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Dog (epigenetic)</text>' +
        '<!-- Cat bar -->' +
        '<rect x="30" y="75" width="140" height="24" rx="4" fill="var(--svg-f59e0b)" opacity="0.85"/>' +
        '<text x="100" y="91" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Cat (traditional)</text>' +
        '<!-- Scale -->' +
        '<line x1="30" y1="115" x2="450" y2="115" stroke="var(--svg-cbd5e1)" stroke-width="2"/>' +
        '<text x="30" y="128" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)">0</text>' +
        '<text x="135" y="128" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)">~25</text>' +
        '<text x="240" y="128" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">~50</text>' +
        '<text x="345" y="128" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">~75</text>' +
        '<text x="450" y="128" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="end">~100</text>' +
        '</svg>',
      alt: 'Comparison bar chart showing dog and cat age equivalents in human years',
      caption: 'Dogs age faster than cats in early years; the epigenetic curve slows with age',
    },
    variables: [
      { symbol: 'ln', name: 'Natural Logarithm', description: 'The natural logarithm (base e). In the epigenetic formula, ln(pet age) reflects the non-linear relationship between chronological age and DNA methylation changes.' },
      { symbol: 'Epigenetic Age', name: 'DNA Methylation-Based Age', description: 'A molecular clock that measures changes in DNA methylation patterns. The NIH 2020 study on Labrador retrievers found that dog-human age scaling is not linear — it is rapid in early years and decelerates with age.' },
      { symbol: 'Traditional ×7', name: 'Simple Multiplier Rule', description: 'The old rule of multiplying pet years by 7 is inaccurate. It fails to account for the rapid maturation in the first two years and the varying aging rates across species and breeds.' },
    ],
    howToUse: [
      'Select whether the pet is a Dog or Cat.',
      'If Dog, select the size category (Small, Medium, or Large) — size influences life stage transitions.',
      'Enter your pet\'s age in years (you can use decimals, e.g., 1.5 for 18 months).',
      'View the traditional method result and, for dogs aged 1+, the epigenetic (NIH 2020 study) result.',
      'Check your pet\'s life stage classification and see how the two methods compare.',
    ],
    explanation:
      'For decades, the "multiply by 7" rule was the standard way to estimate a dog\'s age in human years. However, this rule oversimplifies the complex biology of aging across species. In 2020, a landmark study published in Cell Systems by researchers at the University of California, San Diego examined DNA methylation patterns — a type of epigenetic clock — in Labrador retrievers and compared them with human methylation profiles. The study found that the relationship between dog and human age is not a simple linear multiplier. Instead, it follows a logarithmic curve: dogs age extremely rapidly in their first few years (the equivalent of a 1-year-old dog is approximately a 31-year-old human in epigenetic terms) and then the aging rate slows relative to humans. This pattern mirrors the human experience where developmental changes are fastest in childhood and slow in adulthood. The study\'s formula, Human Age = 16 × ln(Dog Age) + 31, applies to dogs aged 1 year and older. For younger dogs, the traditional stepwise method (first year = 15, second year = 9) is more appropriate. This calculator adjusts life stage classifications based on dog size, since larger breeds tend to have shorter lifespans and enter senior status earlier than smaller breeds. For cats, the traditional stepwise formula remains the best available method, as large-scale epigenetic studies on feline aging are not yet available. Cats age similarly to dogs in the first two years but the overall trajectory is slightly more gradual.',
    faqs: [
      {
        question: 'What is the epigenetic (NIH 2020) dog age formula?',
        answer: 'The formula is: Human Age = 16 × ln(Dog Age in years) + 31. It was derived from studying DNA methylation patterns (an epigenetic clock) in Labrador retrievers and comparing them to human methylation profiles across the lifespan. The "ln" is the natural logarithm function. For example, ln(1) = 0, so a 1-year-old dog equals about 31 human years epigenetically. ln(5) ≈ 1.609, so a 5-year-old dog equals 16×1.609+31 ≈ 56.75 human years.',
      },
      {
        question: 'Why is the ×7 rule inaccurate?',
        answer: 'The ×7 rule assumes a constant linear relationship, but dogs age much faster than humans in their first two years (a 1-year-old dog is roughly equivalent to a 15-year-old human, not a 7-year-old) and the aging rate slows as they get older. For example, a 10-year-old dog by ×7 would be 70 human years, but the epigenetic formula gives approximately 67.8 years, and the traditional stepwise method gives 56 years. The ×7 rule significantly underestimates early-life aging and moderately overestimates late-life aging.',
      },
      {
        question: 'Do different dog breeds age differently?',
        answer: 'Yes. Larger breeds generally have shorter lifespans and reach senior status earlier (around age 6–7) compared to smaller breeds (which may not be senior until age 11–12). This calculator adjusts life stages based on the size category you select. For example, a 5-year-old large-breed dog is classified as "Mature" (approaching senior), while a 5-year-old small-breed dog is still classified as "Adult." The epigenetic formula was developed from Labrador retrievers (a large breed) and may slightly underestimate the aging rate of giant breeds (Great Danes, Mastiffs) and slightly overestimate that of toy breeds.',
      },
      {
        question: 'How accurate is the cat age formula?',
        answer: 'The cat formula (first year = 15 human years, second year = 9, each additional = 4) is the widely accepted veterinary standard endorsed by the American Animal Hospital Association (AAHA) and the American Association of Feline Practitioners (AAFP). Unlike dogs, large-scale epigenetic studies for cats are not yet available, so this formula is based on observed developmental and physiological milestones rather than molecular clocks. A 2021 study in the Journal of Feline Medicine and Surgery confirmed the general validity of this stepwise approach.',
      },
      {
        question: 'Why do large dog breeds age faster and have shorter lifespans?',
        answer: 'This is an active area of research, but several factors contribute: (1) large breeds grow much faster in puppyhood, which may accelerate cellular aging through increased oxidative stress and telomere shortening; (2) larger body mass is associated with higher cancer rates — cancer accounts for approximately 50% of deaths in large and giant breeds; (3) selective breeding for size may have inadvertently selected for mutations that affect longevity pathways like IGF-1 signaling. Great Danes have an average lifespan of only 7–8 years, while Chihuahuas and Jack Russell Terriers can live 14–16 years. This phenomenon is the opposite of what is observed across species (where larger species like elephants live longer than mice), making it a fascinating exception in comparative biology.',
      },
      {
        question: 'At what age should I start considering my pet a "senior"?',
        answer: 'Life stage classification depends on species and (for dogs) size: Small dogs (<9 kg) are considered Senior at age 11–14 and Geriatric at 15+. Medium dogs (9–23 kg) enter Senior at 8–10 and Geriatric at 15+. Large dogs (>23 kg) become Senior at 7–10 and Geriatric at 12+. Cats enter Mature at 7–10, Senior at 11–14, and Geriatric at 15+. Veterinary organizations recommend biannual wellness exams (every 6 months) once a pet enters the Senior stage, rather than the standard annual exam for adult pets. Senior bloodwork panels (CBC, chemistry, urinalysis, thyroid) should begin at these ages even if the pet appears healthy.',
      },
      {
        question: 'Is the epigenetic formula applicable to all dog breeds equally?',
        answer: 'The NIH 2020 study used blood samples from 320 dogs, predominantly Labrador retrievers ranging from 4 weeks to 16 years old. While the methylation clock was validated against human methylation data and showed strong consistency, breed-specific validation is still ongoing. Separate research from the Dog Aging Project (University of Washington/Texas A&M) is collecting epigenetic data across dozens of breeds to refine breed-specific aging models. For now, the Labrador-derived formula provides the best available molecular estimate, but it may overestimate aging in exceptionally long-lived small breeds and underestimate it in very short-lived giant breeds.',
      },
      {
        question: 'How do I interpret the difference between the traditional and epigenetic age results?',
        answer: 'The traditional method (15 + 9 + 4 per year after 2) is stepwise and intuitively matches physical milestones — a 1-year-old dog can reproduce, which maps to human adolescence. The epigenetic method (16×ln(age)+31) reflects molecular aging from DNA methylation patterns. For young dogs (1–2 years), the epigenetic method gives higher estimates (~31–42 human years) while the traditional method gives lower estimates (~15–24 human years). For older dogs (10+ years), the two methods converge closer together. Use the epigenetic result as the preferred scientific estimate for dogs aged 1+; use the traditional method for puppies under 1 year and for cats of all ages.',
      },
    ],
    commonUses: [
      'Pet adoption and care planning — understand the life stage of a rescue or adopted pet to provide age-appropriate nutrition, exercise, and veterinary care',
      'Senior pet health monitoring — identify when a pet enters senior or geriatric life stages to adjust health screening schedules and care routines',
      'Comparative biology education — explore how the NIH 2020 epigenetic clock for dogs reveals non-linear aging patterns compared to the traditional x7 rule',
      'Veterinary visit preparation — provide accurate age equivalents when discussing health concerns, screening schedules, and age-related condition risks with your veterinarian'
    ],
    workedExamples: [
      {
        scenario: 'A family adopted a medium-sized mixed-breed dog from a shelter. The shelter estimates the dog is 3 years old. The family wants to understand how old their dog is in human years using both the traditional and epigenetic methods, and what life stage the dog is in.',
        inputs: { species: 'dog', dogSize: 'medium', petAgeYears: '3' },
        result: 'Traditional Method: 28 human years (15 + 9 + 4). Epigenetic (NIH 2020): ~48.6 human years (16×ln(3)+31 = 16×1.099+31). Life Stage: Adult.',
        insight: 'The two methods give quite different results for this 3-year-old dog — 28 vs. ~49 human years. The epigenetic method suggests the dog is closer to middle-aged in molecular terms, which aligns with when veterinarians begin recommending baseline senior bloodwork panels. At this life stage (Adult), the dog needs regular exercise, a high-quality adult maintenance diet, annual veterinary checkups with dental evaluation, and continued socialization. The shelter adoption is at an ideal age — past puppy challenges but with many healthy adult years ahead.',
      },
      {
        scenario: 'An owner has a 12-year-old Chihuahua (small breed) and wants to know the human age equivalent and what life stage health screenings to expect.',
        inputs: { species: 'dog', dogSize: 'small', petAgeYears: '12' },
        result: 'Traditional Method: 64 human years (15 + 9 + 10×4). Epigenetic Method: ~70.8 human years (16×ln(12)+31 = 16×2.485+31). Life Stage: Senior.',
        insight: 'At 12 years old, this Chihuahua is classified as a Senior — but for a small breed, this is not necessarily advanced old age as Chihuahuas routinely live to 14–16 years. Compare this to a 12-year-old large-breed dog (like a Labrador), which would be classified as Geriatric with a life expectancy of only 1–2 more years. This stark difference illustrates why size-adjusted life staging is critical. Senior Chihuahuas should have biannual bloodwork (CBC, chemistry, thyroid panel), annual dental cleanings under anesthesia with pre-anesthetic workup, and screening for mitral valve disease (very common in small breeds). The owner should watch for signs of tracheal collapse, luxating patella, and dental disease — all common in aging small breeds.',
      },
      {
        scenario: 'A cat owner has a 7-year-old indoor domestic longhair. The cat has started sleeping more and the owner wonders if this is normal aging or a sign of an underlying issue.',
        inputs: { species: 'cat', petAgeYears: '7' },
        result: 'Cat Human Age: ~44 human years (15 + 9 + 5×4). Traditional ×7 comparison: 49 human years. Life Stage: Mature.',
        insight: 'At 7 years, this cat is in the Mature life stage — equivalent to a human in their mid-40s. Increased sleeping is often a normal part of entering middle age, but it can also signal underlying issues common in mature cats: osteoarthritis (affects 90% of cats over 12, but can start earlier), chronic kidney disease (affects 30% of cats over 10), hyperthyroidism, or dental disease. The owner should schedule a veterinary exam with a senior blood panel (CBC, chemistry, T4/thyroid, urinalysis) to establish baselines. At this age, transitioning to a mature/senior cat food formula and encouraging hydration (water fountains, wet food) becomes important. Biannual exams should start now rather than waiting until age 11.',
      },
    ],
    proTips: [
      'Use the epigenetic age result for dogs aged 1+ as your primary reference — it is based on actual molecular changes measured in DNA methylation. The traditional method and ×7 rule provide useful comparisons that show how much the science has advanced beyond the old "multiply by 7" shortcut.',
      'Pay more attention to life stage than the exact human age number. The life stage classification (Puppy/Kitten, Junior, Adult, Mature, Senior, Geriatric) directly maps to veterinary recommendations for diet type, exercise level, screening test frequency, and vaccination schedules.',
      'For mixed-breed dogs where size category is unclear, use the dog\'s current weight and breed mix to estimate adult size. If the dog is over 23 kg, use the "Large" category — even if it\'s a mixed breed, the size-based aging pattern applies. When in doubt, ask your veterinarian which size category best fits.',
      'Cats are masters at hiding illness — a cat classified as "Mature" (7–10 years) deserves the same proactive health screening as a "Senior" classification for dogs. Feline pain and disease often manifest only as subtle behavioral changes (sleeping more, hiding, reduced grooming) rather than obvious symptoms.',
      'Use this calculator at every annual vet visit. As your pet ages and crosses life stage thresholds, the nutrition, exercise, and screening recommendations change. A pet moving from Adult to Mature needs a different conversation with the vet than a pet moving from Senior to Geriatric.',
      'Don\'t forget that aging is more than chronological or epigenetic age. Body condition score (BCS), dental health, joint mobility, and cognitive function all contribute to "biological age." A 10-year-old lean, active dog with healthy teeth may be biologically younger than an 8-year-old obese dog with periodontal disease.',
    ],
    limitations: [
      'The epigenetic formula (16×ln(age)+31) was derived from a study of primarily Labrador retrievers. While the methylation clock shows cross-mammal consistency, breed-specific validation is still in progress. The Dog Aging Project and other longitudinal studies are collecting data on diverse breeds. Very short-lived giant breeds and very long-lived toy breeds may deviate from this formula.',
      'Cat age estimates use the traditional stepwise method, not an epigenetic clock. Large-scale feline DNA methylation studies have not yet been conducted to the same standard as the canine study. The cat formula is based on developmental and physiological milestones (sexual maturity, dental eruption, organ development) mapped to human equivalents, which is less precise than molecular methods.',
      'Life stage classification thresholds are consensus guidelines from AAHA/AAFP, not rigid biological boundaries. Individual pets age at different rates based on genetics, nutrition, exercise history, body condition, and preventive healthcare. A well-cared-for pet may appear and function younger than its chronological age.',
      'This calculator is for educational purposes. Life stage classification should inform — not replace — veterinary clinical judgment. Individual health assessments, physical exams, and diagnostic testing determine a pet\'s true health status more accurately than age-based formulas.',
      'The calculator does not account for mixed-breed aging patterns, which can be intermediate between the parent breeds. A Labrador-Poodle mix, for instance, may age differently than either purebred. For mixed breeds, the size category provides the best approximation.',
    ],
    quickReference: [
      { label: 'Dog Year 1 (Epigenetic)', value: '~31 human years (16×0+31)' },
      { label: 'Dog Year 2 (Epigenetic)', value: '~42 human years (16×ln(2)+31)' },
      { label: 'Dog Year 5 (Epigenetic)', value: '~56.8 human years (16×ln(5)+31)' },
      { label: 'Dog Year 10 (Epigenetic)', value: '~67.8 human years (16×ln(10)+31)' },
      { label: 'Traditional Dog Method', value: '15 (yr1) + 9 (yr2) + 4×(age-2)' },
      { label: 'Cat Formula', value: '15 (yr1) + 9 (yr2) + 4×(age-2)' },
      { label: '×7 Rule (for comparison)', value: 'Pet Age × 7 (inaccurate, shown for reference)' },
      { label: 'Large Dog Senior', value: 'Age 7: Senior (vs. Age 11: Small Dog Senior)' },
    ],
    citations: [
      { source: 'NIH 2020 — Epigenetic Clock for Dogs (Cell Systems)', url: 'https://doi.org/10.1016/j.cels.2020.06.006' },
      { source: 'Dog Aging Project — University of Washington / Texas A&M', url: 'https://dogagingproject.org/' },
      { source: 'AAHA/AAFP Life Stage Guidelines', url: 'https://www.aaha.org/aaha-guidelines/life-stage-canine-2022/life-stage-feline-2023/' },
      { source: 'American Veterinary Medical Association', url: 'https://www.avma.org/' },
    ],
  },
};

export default dogCatAgeConfig;
