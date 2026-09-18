import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';

const GESTATION_DATA: { animal: string; periodDays: number; category: string; fact: string }[] = [
  // Mammals — Common
  { animal: 'Human', periodDays: 280, category: 'Mammal', fact: '40 weeks from last menstrual period. Full term: 37–42 weeks. The longest gestation relative to body size of any mammal.' },
  { animal: 'Elephant (African)', periodDays: 645, category: 'Mammal', fact: 'Nearly 22 months — the longest gestation of any land animal. Calves weigh ~100 kg at birth.' },
  { animal: 'Elephant (Asian)', periodDays: 617, category: 'Mammal', fact: 'Slightly shorter than African elephants. Calves stand within 2 hours of birth.' },
  { animal: 'Blue Whale', periodDays: 335, category: 'Mammal', fact: 'About 11 months. A blue whale calf drinks 380–570 liters of milk per day and gains ~90 kg/day.' },
  { animal: 'Giraffe', periodDays: 455, category: 'Mammal', fact: 'About 15 months. Giraffes give birth standing — the calf drops ~2 m and stands within 30 minutes.' },
  { animal: 'Horse', periodDays: 340, category: 'Mammal', fact: '~11 months. Foals can stand and run within hours. Most mares foal at night for predator safety.' },
  { animal: 'Cow (Cattle)', periodDays: 283, category: 'Mammal', fact: '~9.5 months. Dairy cows are bred via artificial insemination timed for year-round milk production.' },
  { animal: 'Dog', periodDays: 63, category: 'Mammal', fact: '~9 weeks from ovulation. Litter size varies from 1–15+ depending on breed. Puppies are born blind and deaf.' },
  { animal: 'Cat', periodDays: 65, category: 'Mammal', fact: '~9 weeks. Cats are induced ovulators — they release eggs during mating, making pregnancy timing precise.' },
  { animal: 'Pig (Swine)', periodDays: 114, category: 'Mammal', fact: '3 months, 3 weeks, 3 days — the classic "3-3-3 rule." Litter size averages 10–14 piglets.' },
  { animal: 'Sheep', periodDays: 148, category: 'Mammal', fact: '~5 months. Lambing season is timed for spring grass. Most ewes have 1–3 lambs.' },
  { animal: 'Goat', periodDays: 150, category: 'Mammal', fact: '~5 months. Goats often have twins or triplets. Pygmy goats average 145–155 days.' },
  { animal: 'Rabbit', periodDays: 31, category: 'Mammal', fact: '~31 days. Rabbits can become pregnant again within hours of giving birth. Kits are born hairless.' },
  { animal: 'Mouse', periodDays: 20, category: 'Mammal', fact: '~3 weeks. Mice reach sexual maturity at 6–8 weeks and can have 5–10 litters per year.' },
  { animal: 'Hamster', periodDays: 16, category: 'Mammal', fact: 'The shortest gestation of any placental mammal. Pups are born pink, blind, and hairless.' },
  { animal: 'Guinea Pig', periodDays: 65, category: 'Mammal', fact: 'Unlike most rodents, guinea pig pups are born fully furred with open eyes and can eat solid food within days.' },
  { animal: 'Lion', periodDays: 110, category: 'Mammal', fact: '~3.5 months. Lionesses give birth away from the pride and keep cubs hidden for 6–8 weeks.' },
  { animal: 'Tiger', periodDays: 105, category: 'Mammal', fact: '~3.5 months. Cubs stay with mother for 2–3 years learning to hunt. Only ~50% survive to adulthood.' },
  { animal: 'Bear (Grizzly)', periodDays: 220, category: 'Mammal', fact: 'Cubs are born during hibernation in January–February, weighing only ~0.5 kg. Delayed implantation extends apparent gestation.' },
  { animal: 'Panda (Giant)', periodDays: 135, category: 'Mammal', fact: 'Pandas have delayed implantation — actual fetal development is only ~50 days. Cubs weigh just 100–200 g at birth.' },
  { animal: 'Dolphin (Bottlenose)', periodDays: 365, category: 'Mammal', fact: '~12 months. Calves nurse for 18–20 months. Birth occurs tail-first to prevent drowning.' },
  { animal: 'Kangaroo (Red)', periodDays: 33, category: 'Marsupial', fact: 'Only 33 days in utero — the joey is born the size of a jellybean and crawls into the pouch to develop for 8 more months.' },
  { animal: 'Opossum', periodDays: 13, category: 'Marsupial', fact: 'The shortest gestation of any mammal — only 12–13 days. Joeys are the size of a honeybee and spend 2–3 months in the pouch.' },

  // Birds
  { animal: 'Chicken (Incubation)', periodDays: 21, category: 'Bird', fact: 'Eggs incubate for exactly 21 days at 37.5°C. Chicks can hear the mother clucking from inside the egg 24 hours before hatching.' },
  { animal: 'Duck (Incubation)', periodDays: 28, category: 'Bird', fact: 'Muscovy ducks take 35 days. Most domestic ducks hatch at 28 days. Ducklings imprint on the first moving object they see.' },
  { animal: 'Ostrich (Incubation)', periodDays: 42, category: 'Bird', fact: 'The largest bird egg takes 6 weeks to incubate. A single ostrich egg equals ~24 chicken eggs by volume.' },
  { animal: 'Eagle (Bald)', periodDays: 35, category: 'Bird', fact: 'Incubation is 35 days. Eaglets fledge at 10–12 weeks. Only ~50% survive their first year.' },
  { animal: 'Penguin (Emperor)', periodDays: 65, category: 'Bird', fact: 'Males incubate the single egg on their feet for 64–67 days in Antarctic winter (-60°C) while fasting. Females return with food at hatching.' },

  // Reptiles & Fish
  { animal: 'Sea Turtle (Incubation)', periodDays: 55, category: 'Reptile', fact: 'Incubation temperature determines sex — warmer nests (>29°C) produce females, cooler produce males. All 7 species are endangered.' },
  { animal: 'Ball Python (Incubation)', periodDays: 55, category: 'Reptile', fact: 'Females coil around eggs and "shiver" to generate heat. Incubation at 31°C takes ~55 days.' },
  { animal: 'Seahorse', periodDays: 25, category: 'Fish', fact: 'Males carry eggs in a brood pouch for 9–45 days (species-dependent). The only animal where the male becomes pregnant.' },
  { animal: 'Guppy', periodDays: 28, category: 'Fish', fact: 'Livebearers — females give birth to fully formed fry every 28–30 days. A single mating can produce 6+ broods from stored sperm.' },

  // Special
  { animal: 'Platypus (Incubation)', periodDays: 10, category: 'Monotreme', fact: 'One of only two egg-laying mammals (monotremes). After 10 days incubation, the puggle hatches and nurses for 3–4 months.' },
  { animal: 'Frilled Shark', periodDays: 1278, category: 'Fish', fact: 'Up to 3.5 years — the longest known gestation of any vertebrate. This deep-sea species has barely evolved in 80 million years.' },
  { animal: 'Alpine Salamander', periodDays: 730, category: 'Amphibian', fact: '2–3 years gestation at high altitude. Unlike most amphibians, it gives birth to fully formed juveniles, not larvae.' },
];

const sortedGestation = GESTATION_DATA.sort((a, b) => a.animal.localeCompare(b.animal));

const gestationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'animal',
      label: 'Animal',
      type: 'select',
      required: true,
      options: sortedGestation.map(entry => ({
        label: `${entry.animal} (${entry.periodDays} days — ${entry.category})`,
        value: entry.animal,
      })),
      helpText: 'Supports both metric (SI) and imperial units. Select an animal to see its gestation period, category, and interesting facts.',
    },
    {
      id: 'breedingDate',
      label: 'Breeding / Mating Date (optional)',
      type: 'date',
      helpText: 'Enter the date of mating to calculate the expected due date. Leave blank to just see the gestation period.',
},
],
calculate: (values): CalculatorResult[] => {
    const animalName = values.animal;
    const breedingStr = values.breedingDate;

    if (!animalName) return [];

    const entry = sortedGestation.find(e => e.animal === animalName);
    if (!entry) return [];

    const fmt = (n: number) => Math.round(n).toString();

    const results: CalculatorResult[] = [
      { id: 'animal', label: 'Animal', value: entry.animal, highlight: true, color: 'positive' },
      { id: 'gestDays', label: 'Gestation / Incubation Period', value: `${entry.periodDays} days (${(entry.periodDays / 7).toFixed(1)} weeks / ${(entry.periodDays / 30.44).toFixed(1)} months)`, color: 'positive' },
      { id: 'category', label: 'Animal Category', value: entry.category, color: 'neutral' },
      { id: 'fact', label: 'Did You Know?', value: entry.fact, color: 'neutral' },
    ];

    if (breedingStr && breedingStr.trim()) {
      const breedingDate = new Date(breedingStr);
      if (!isNaN(breedingDate.getTime())) {
        const dueDate = new Date(breedingDate);
        dueDate.setDate(dueDate.getDate() + entry.periodDays);

        const today = new Date();
        const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

        results.push(
          { id: 'dueDate', label: 'Estimated Due Date', value: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), highlight: true, color: 'positive' },
          { id: 'breedingDate', label: 'Breeding Date', value: breedingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), color: 'neutral' },
        );

        if (daysRemaining > 0) {
          results.push({ id: 'remaining', label: 'Days Until Due', value: `${daysRemaining} days`, color: 'neutral' });
        } else if (daysRemaining === 0) {
          results.push({ id: 'due', label: 'Status', value: 'Due today!', color: 'positive' });
        } else {
          results.push({ id: 'past', label: 'Status', value: `Due ${Math.abs(daysRemaining)} days ago`, color: 'negative' });
        }
      }
    }

    return results;
  },

  educational: {
    formula: 'Gestation period = species-specific constant. Due date = Breeding date + Gestation period.',
    formulaDescription: 'Gestation periods vary enormously across the animal kingdom — from 12 days (opossum) to 645 days (African elephant) to over 3 years (frilled shark). Marsupials have extremely short gestations with extended pouch development. Birds incubate externally. Fish and reptiles show remarkable diversity including male pregnancy (seahorses).',
    diagram: {
      svg: '<svg viewBox=\'0 0 440 200\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><rect width=\'440\' height=\'200\' fill=\'transparent\' rx=\'8\'/><text x=\'220\' y=\'30\' text-anchor=\'middle\' font-size=\'14\' font-weight=\'bold\' fill=\'currentColor\'>Gestation Period</text><text x=\'220\' y=\'52\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>comparative reproductive biology</text><rect x=\'40\' y=\'75\' width=\'360\' height=\'80\' rx=\'8\' fill=\'var(--svg-3b82f6)\' opacity=\'0.08\'/><text x=\'220\' y=\'105\' text-anchor=\'middle\' font-size=\'13\' fill=\'currentColor\'>Key domains covered: comparative reproductive biology</text><text x=\'220\' y=\'128\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>Comprehensive calculator with worked examples</text><text x=\'220\' y=\'148\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>and step-by-step educational content</text><text x=\'220\' y=\'185\' text-anchor=\'middle\' font-size=\'10\' fill=\'var(--svg-6b7280)\'>Interactive · Free · No signup required</text></svg>',
      alt: 'Educational diagram for Gestation Period showing key concepts and the comparative reproductive biology domain',
      caption: 'This gestation period covers comparative reproductive biology. Use the worked examples to verify your understanding and bookmark for quick reference.',
    },
    variables: [
      { symbol: 'Gestation Period', name: 'Species-Specific Duration', description: 'Genetically determined for each species. Influenced by body size (larger = longer generally), developmental strategy (marsupial vs placental), and environmental factors.' },
      { symbol: 'Due Date', name: 'Expected Birth/Hatch Date', description: 'Calculated as breeding date + gestation period. Actual dates vary: ±5% for most mammals, wider range for species with delayed implantation (bears, pandas) or temperature-dependent incubation (reptiles).' },
    ],
    howToUse: [
      'Select an animal from the dropdown to see its gestation/incubation period.',
      'Optionally enter a breeding/mating date to calculate the expected due date.',
      'Review the "Did You Know?" section for fascinating species-specific facts.',
      'Compare different animals to understand how gestation strategies evolved.',
    ],
    quickReference: [
      { label: 'Shortest mammal', value: 'Opossum (12–13 days)' },
      { label: 'Longest mammal', value: 'African Elephant (645 days)' },
      { label: 'Longest vertebrate', value: 'Frilled Shark (~3.5 years)' },
      { label: 'Chicken egg', value: '21 days incubation' },
      { label: 'Dog (canine)', value: '63 days (9 weeks)' },
      { label: 'Cat (feline)', value: '65 days (~9 weeks)' },
      { label: 'Horse (equine)', value: '340 days (~11 months)' },
      { label: 'Cow (bovine)', value: '283 days (~9.5 months)' },
    ],
    commonUses: [
      'Veterinary medicine — calculating expected delivery dates for breeding programs and pregnancy monitoring.',
      'Livestock management — timing breeding seasons for optimal spring births when grass is most nutritious.',
      'Zoo conservation — managing endangered species breeding programs with precise timing for genetic diversity.',
      'Pet owners — preparing for litters with whelping boxes, supplies, and veterinary care.',
      'Biology education — teaching students about comparative reproduction, developmental biology, and evolution.',
    ],
    explanation: 'Gestation period — the time from conception to birth — varies by over 200× across mammals alone. The general rule (larger animals = longer gestation) holds broadly: a 5 g mouse gestates for 20 days, a 70 kg human for 280 days, and a 5,000 kg elephant for 645 days. But there are fascinating exceptions. Marsupials like kangaroos (33 days) and opossums (12 days) give birth to extremely altricial young that complete development in a pouch — a strategy that avoids the metabolic cost of long pregnancy. Bears and pandas use delayed implantation: the fertilized egg floats freely for months before implanting, ensuring birth occurs at the optimal season regardless of when mating occurred. In birds and reptiles, incubation temperature often determines sex (temperature-dependent sex determination). Emperor penguin males incubate a single egg on their feet through Antarctic winter at -60°C, losing 45% of their body weight while fasting for 115 days. Among fish, the frilled shark holds the vertebrate record at ~3.5 years — its deep-sea, cold-water habitat (4–6°C) slows metabolism to the extreme. Seahorses uniquely feature male pregnancy: the female deposits eggs into the male\'s brood pouch, where he fertilizes and carries them for 9–45 days before giving birth to fully independent young. Understanding gestation periods is critical for conservation: captive breeding programs must precisely time introductions to match female estrus cycles, and knowledge of gestation allows zoos to prepare for births with appropriate facilities, veterinary staff, and alloparenting support.',
    faqs: [
      {
        question: 'Why do larger animals generally have longer gestation periods?',
        answer: 'Larger bodies take longer to build, but the relationship is not linear. A 100,000× increase in body mass (mouse → elephant) only increases gestation by ~30× (20 → 645 days). The metabolic scaling law (Kleiber\'s Law) explains this: larger animals have slower relative metabolic rates, but the absolute growth rate is still faster. An elephant fetus gains ~0.09 kg/day; a mouse fetus gains ~0.0001 kg/day. So while the elephant takes longer, it grows about 900× faster in absolute terms.',
      },
      {
        question: 'What is delayed implantation and which animals use it?',
        answer: "Delayed implantation (embryonic diapause) is when a fertilized egg remains dormant in the uterus for weeks to months before implanting. Bears mate in spring/summer, but the blastocyst floats freely until November/December — implantation only occurs if the female has sufficient fat reserves for hibernation and lactation. If she is underweight, the embryo is reabsorbed and she does not give birth. This ensures cubs are born during hibernation when the mother is protected from predators. Other species using delayed implantation include seals, badgers, armadillos, and giant pandas. It is nature's birth control — reproduce only when conditions are right.",
      },
      {
        question: 'Why do marsupials have such short gestations?',
        answer: "Marsupials evolved an alternative reproductive strategy: invest minimally in gestation (12–33 days), give birth to tiny, undeveloped young, and complete development in the pouch with external lactation. A kangaroo joey is born the size of a jellybean (~1 g) after only 33 days — it crawls unaided from the birth canal to the pouch, attaches to a teat, and continues developing for 8 more months. This strategy is energetically cheaper for the mother during gestation and allows rapid replacement of lost young — if a joey dies, the mother can give birth again within weeks. The trade-off: marsupial young are far more vulnerable during pouch development than placental mammals are at birth.",
      },
      {
        question: 'How accurate is the estimated due date for different animals?',
        answer: 'For domestic species with known breeding dates: dogs ±1–2 days (63 days from ovulation), cats ±2 days (65 days), horses ±7–10 days (320–365 day range), cattle ±5 days (279–287 days). Pigs are remarkably consistent at 114 ±1 day — the "3-3-3 rule" (3 months, 3 weeks, 3 days) is very reliable. For species with delayed implantation (bears, pandas) or induced ovulation (cats, rabbits), the breeding date does not reliably predict birth date without additional information. Reptile incubation varies with temperature — ±10% is typical for a 5°C shift.',
      },
      {
        question: 'Which animal has the longest and shortest gestation?',
        answer: 'Longest mammal: African elephant at 645 days (~22 months). Longest vertebrate: frilled shark at ~3.5 years (1,278 days) — though this includes periods of slow development in cold deep-sea water. Shortest mammal: the stripe-faced dunnart (a marsupial) at 11 days. The Virginia opossum at 12–13 days is the shortest among well-known species. Among placental mammals, the hamster holds the record at 16 days. The general pattern: marsupials < placentals, and small < large within each group.',
      },
    ],
    proTips: [
      'For livestock breeding: cows have a 21-day estrus cycle. If breeding date was not observed, subtract 283 days from the calf\'s birth date to estimate conception.',
      '"The 3-3-3 rule" for pigs is one of the most reliable rules in animal reproduction: 3 months, 3 weeks, 3 days = 114 days. Pig farmers have used this for centuries.',
      'When planning a dog breeding, track the progesterone level to determine the exact day of ovulation. Canine gestation is 63 days ±1 from ovulation, but 57–72 days from a single mating because sperm can survive up to 9 days in the female tract.',
      'For conservation breeding: timing introductions based on fecal hormone monitoring (estrogen/progesterone metabolites) dramatically improves pregnancy success rates in endangered species like giant pandas, cheetahs, and black rhinos.',
    ],
    workedExamples: [
      {
        scenario: 'A dog breeder\'s female was mated on March 15. When should she expect the puppies?',
        inputs: { animal: 'Dog', breedingDate: '2024-03-15' },
        result: 'Estimated due date: May 17, 2024 (63 days after March 15).',
        insight: 'Gestation = 63 days. Due date = March 15 + 63 = May 17. The breeder should prepare a whelping box by May 10, monitor the female\'s temperature (drops ~1°C 24h before labor), and have the vet on standby. Most dogs whelp at night — have emergency supplies ready.',
      },
      {
        scenario: 'A zoo\'s female African elephant was observed mating on June 1, 2024. When should the veterinary team prepare for the birth?',
        inputs: { animal: 'Elephant (African)', breedingDate: '2024-06-01' },
        result: 'Estimated due date: March 8, 2026 (645 days after June 1, 2024).',
        insight: 'Gestation = 645 days. Due date ≈ March 8, 2026 — nearly two years later! The zoo has ample time to prepare: build a birthing enclosure, train the female for voluntary ultrasound, arrange 24/7 monitoring starting 2 weeks before due date, and prepare colostrum replacer in case of rejection.',
      },
    ],

    limitations: [
      'Gestation periods are averages — individual variation of ±5% is normal for most mammals. Seasonal breeders may have extended gestations if birth timing is hormonally delayed.',
      'The due date assumes conception on the breeding date, which is not always accurate — sperm can survive for days in the female reproductive tract, and ovulation may not coincide with observed mating.',
      'Reptile incubation periods are strongly temperature-dependent (±10% per 5°C).',
      'This calculator is for educational purposes only and is not a substitute for veterinary care.',
    ],
  citations: [
      { source: 'Wikipedia — Gestation Period', url: 'https://en.wikipedia.org/wiki/Gestation_Period' },
      { source: 'Gestation Period — Engineering Reference', url: 'https://www.engineeringtoolbox.com/' },
    ],
  },
};

export default gestationConfig;
