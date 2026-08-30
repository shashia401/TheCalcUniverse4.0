import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DogCatPregnancyPanel from './DogCatPregnancyPanel';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const dogCatPregnancyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'species',
      label: 'Species',
      type: 'select',
      required: true,
      helpText: 'Choose Dog (~63 day gestation) or Cat (~65 day gestation)',
      options: [
        { label: 'Dog', value: 'dog' },
        { label: 'Cat', value: 'cat' },
      ],
    },
    {
      id: 'breedingDate',
      label: 'Breeding Date',
      type: 'date',
      required: true,
      helpText: 'Enter the date when mating occurred',
    },
  ],
  calculate: (values) => {
    const species = values.species;
    const breedingStr = values.breedingDate;

    if (!species || (species !== 'dog' && species !== 'cat')) return [];
    if (!breedingStr) return [];

    const breeding = new Date(breedingStr + 'T00:00:00');
    if (isNaN(breeding.getTime())) return [];

    const gestationDays = species === 'dog' ? 63 : 65;
    const gestationRange: [number, number] = species === 'dog' ? [58, 68] : [63, 67];

    const dueDate = new Date(breeding);
    dueDate.setDate(dueDate.getDate() + gestationDays);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffMs = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const elapsedDays = Math.round((now.getTime() - breeding.getTime()) / (1000 * 60 * 60 * 24));

    // Trimester
    let trimester: string;
    if (elapsedDays <= 21) {
      trimester = 'Early (Days 1–21)';
    } else if (elapsedDays <= 42) {
      trimester = 'Mid (Days 22–42)';
    } else {
      trimester = 'Late (Day 43 – Birth)';
    }

    // Week-by-week calendar
    const weeks = Math.ceil(gestationDays / 7);
    const weekLines: string[] = [];
    for (let w = 1; w <= weeks; w++) {
      const weekStart = new Date(breeding);
      weekStart.setDate(weekStart.getDate() + (w - 1) * 7);
      const weekEnd = new Date(breeding);
      weekEnd.setDate(weekEnd.getDate() + Math.min(w * 7 - 1, gestationDays - 1));
      const label = `Week ${w}`;
      const range = `${formatDate(weekStart)} – ${formatDate(weekEnd)}`;
      weekLines.push(`${label}: ${range}`);
    }

    // Due date range
    const dueEarly = new Date(breeding);
    dueEarly.setDate(dueEarly.getDate() + gestationRange[0]);
    const dueLate = new Date(breeding);
    dueLate.setDate(dueLate.getDate() + gestationRange[1]);

    const results: ReturnType<CalculatorConfig['calculate']> = [
      {
        id: 'dueDate',
        label: species === 'dog' ? 'Whelping Due Date' : 'Queening Due Date',
        value: formatDate(dueDate),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'gestationLength',
        label: 'Gestation Period',
        value: `${gestationDays} days (typical range: ${gestationRange[0]}–${gestationRange[1]} days)`,
        color: 'neutral',
      },
      {
        id: 'dueDateRange',
        label: 'Expected Range',
        value: `${formatDate(dueEarly)} – ${formatDate(dueLate)}`,
        color: 'neutral',
      },
      {
        id: 'daysRemaining',
        label: daysRemaining >= 0 ? 'Days Until Due Date' : 'Days Since Due Date',
        value: daysRemaining >= 0 ? `${daysRemaining} days` : `${Math.abs(daysRemaining)} days ago`,
        color: daysRemaining < 0 ? 'negative' : daysRemaining <= 14 ? 'neutral' : 'positive',
      },
      {
        id: 'trimester',
        label: 'Current Trimester',
        value: trimester,
        color: elapsedDays <= 21 ? 'positive' : elapsedDays <= 42 ? 'neutral' : 'negative',
      },
      {
        id: 'weekCalendar',
        label: 'Week-by-Week Calendar',
        value: weekLines.join(' | '),
        color: 'neutral',
      },
    ];

    if (daysRemaining < 0) {
      results.push({
        id: 'postDueAlert',
        label: 'Veterinary Alert',
        value: `If birth has not occurred by ${formatDate(dueLate)}, consult a veterinarian.`,
        color: 'negative',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DogCatPregnancyPanel, { values, results });
  },
  educational: {
    formula: 'Due Date = Breeding Date + Gestation Period (63 days for dogs, 65 days for cats)',
    formulaDescription:
      'The due date is calculated by adding the species-specific gestation period to the breeding date. Dogs average 63 days (range 58–68), while cats average 65 days (range 63–67).',
    diagram: {
      svg: '<svg viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="240" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Pregnancy Timeline — Trimesters</text>' +
        '<!-- Timeline bar -->' +
        '<line x1="30" y1="55" x2="450" y2="55" stroke="var(--svg-cbd5e1)" stroke-width="4" stroke-linecap="round"/>' +
        '<!-- Early -->' +
        '<circle cx="70" cy="55" r="8" fill="var(--svg-22c55e)"/>' +
        '<text x="70" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">Early</text>' +
        '<text x="70" y="92" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Day 1–21</text>' +
        '<!-- Mid -->' +
        '<circle cx="240" cy="55" r="8" fill="var(--svg-f59e0b)"/>' +
        '<text x="240" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">Mid</text>' +
        '<text x="240" y="92" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Day 22–42</text>' +
        '<!-- Late -->' +
        '<circle cx="410" cy="55" r="8" fill="var(--svg-ef4444)"/>' +
        '<text x="410" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">Late</text>' +
        '<text x="410" y="92" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Day 43–Birth</text>' +
        '<!-- Arrow label -->' +
        '<text x="240" y="112" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">~63 days (Dog) / ~65 days (Cat)</text>' +
        '</svg>',
      alt: 'Pregnancy timeline showing early, mid, and late trimesters for dog and cat gestation',
      caption: 'Dog gestation averages 63 days; cat gestation averages 65 days. Both are divided into three trimesters.',
    },
    variables: [
      { symbol: 'Gestation', name: 'Gestation Period', description: 'The duration of pregnancy from conception to birth. For dogs: 63 days on average (58–68 is normal). For cats: 65 days on average (63–67 is normal).' },
      { symbol: 'Breeding Date', name: 'Date of Mating', description: 'The date when breeding occurred. For dogs, ovulation may lag 2–4 days after breeding, so due dates are approximate.' },
      { symbol: 'Trimester', name: 'Three-Stage Division', description: 'Pregnancy is divided into three roughly equal trimesters. Early (days 1–21): embryo implantation and organ formation. Mid (days 22–42): rapid fetal growth and skeletal development. Late (day 43–birth): final maturation and positioning for birth.' },
    ],
    howToUse: [
      'Select whether the pet is a Dog or Cat.',
      'Enter the breeding (mating) date.',
      'View the estimated due date and expected date range.',
      'Check how many days remain until the due date, and what trimester the pregnancy is in.',
      'Review the week-by-week calendar for a full timeline of the pregnancy.',
    ],
    explanation:
      'Canine and feline gestation periods are remarkably efficient compared to human pregnancy, lasting approximately 9 weeks from conception to birth. This brevity reflects an evolutionary adaptation — carnivore mothers need to return to hunting quickly, and shorter gestation reduces vulnerability to predators. Despite the short duration, the developmental progression is sophisticated and well-organized across three distinct trimesters. For dogs, gestation averages 63 days from ovulation, though the range extends from 58 to 68 days. Crucially, the breeding date and the ovulation date are not always the same — canine sperm can survive for 5–7 days in the female reproductive tract, and ovulation can lag 2–4 days after mating. This means that a dog bred on Monday may not ovulate until Thursday, shifting the true due date by several days. Breeders who use progesterone testing to time ovulation precisely can calculate due dates with remarkable accuracy (±1 day). For cats, gestation averages 65 days from breeding with a tighter range of 63–67 days, as cats are induced ovulators — ovulation occurs in response to mating itself, making the conception date more predictable. The first trimester (days 1–21) is a period of cellular organization where fertilized eggs travel to the uterine horns, implant in the uterine lining around day 14–16, and begin forming the primitive streak that will develop into the nervous system. By day 21, the embryos are approximately 5–8mm long and have begun organogenesis — the formation of the heart, brain, and spinal cord. This is also when the placenta establishes, making maternal nutrition critical. Many pet owners do not realize their animal is pregnant during this stage. The second trimester (days 22–42) brings rapid fetal growth and visible changes. By day 28–30, a veterinarian can confirm pregnancy via ultrasound and detect fetal heartbeats. By day 35, the fetuses are easily palpable and have developed distinct facial features, limb buds, and internal organs. Skeletal calcification begins around day 40–45, which is why X-rays become diagnostically useful only after day 45 — before this point, the fetal skeletons are cartilage and invisible on X-ray. The mother\'s nutritional demands increase significantly during this trimester, and she should transition to a higher-calorie puppy or kitten food formulation. The third trimester (day 43 to birth) focuses on final fetal maturation — the lungs produce surfactant, the nervous system completes myelination, and the fetuses position themselves for birth. During the final week, fetal movement is often visible through the mother\'s abdominal wall. The mother\'s mammary glands enlarge, and she may begin producing colostrum 1–3 days before delivery. This is also when owners should begin twice-daily rectal temperature monitoring for dogs (normal: 101–102.5°F/38.3–39.2°C), as a drop below 100°F/37.8°C reliably signals that labor will begin within 12–24 hours. Cats show less pronounced temperature drops, making behavioral signs more important — nesting behavior, restlessness, increased vocalization, and appetite loss in the final 24 hours. Veterinary involvement should be planned proactively. An ultrasound at day 25–30 provides pregnancy confirmation and an initial fetal count. Palpation at day 21–28 (before the fetuses become too small to feel individually after day 35 due to uterine swelling) can also confirm pregnancy. X-rays at day 45+ provide the most accurate fetal count by visualizing calcified skeletons — this is especially valuable for dogs so the owner knows how many puppies to expect and can identify if any are retained after whelping. A pre-labor veterinary checkup at day 50 allows the vet to review the owner\'s whelping/queening plan, confirm fetal viability, and ensure emergency contact information is current. Signs of imminent labor include: nesting behavior (digging, scratching at bedding, seeking seclusion), restlessness or pacing, a drop in body temperature (dogs), loss of appetite in the final 12–24 hours, panting or shivering, and visible abdominal contractions. Stage 1 labor (cervical dilation, contractions without active pushing) may last 6–12 hours in experienced mothers and up to 24 hours in first-timers. Stage 2 labor (active delivery of puppies/kittens) should produce a newborn every 30–60 minutes, though intervals of up to 2 hours can be normal. Owners should be prepared with a clean whelping/queening box, towels, a heating pad, iodine for umbilical cords, a bulb syringe, and the emergency veterinarian\'s phone number. If active straining persists for more than 2 hours without producing a newborn, if green or dark discharge appears without a puppy/kitten following within 15 minutes, or if the mother is distressed or exhausted, immediate veterinary intervention is required. After delivery, each newborn should be weighed daily — a consistent weight loss trend after the first 24 hours signals inadequate nursing and requires supplementation. The mother should be monitored for signs of eclampsia (low calcium: restlessness, muscle tremors, stiffness), mastitis (hot, painful, discolored mammary glands), and metritis (fever, foul-smelling discharge, lethargy) in the postpartum period. This calculator provides an educational framework for understanding and preparing for canine and feline pregnancy, but it is not a substitute for professional veterinary care throughout the gestation, delivery, and postpartum periods.',
    faqs: [
      {
        question: 'How accurate is the due date?',
        answer: 'The due date is an estimate. Dogs average 63 days from ovulation, but the range is 58–68 days. Cats average 65 days with a range of 63–67 days. Actual timing depends on breed, litter size, and individual variation. Always consult a veterinarian for personalized guidance.',
      },
      {
        question: 'What if the breeding date is unknown?',
        answer: 'If the exact breeding date is unknown, a veterinarian can estimate gestational age using ultrasound (from day 25) or by measuring fetal structures. For dogs, the due date can also be estimated based on ovulation timing via progesterone testing. If multiple matings occurred over several days, use the first or middle date as your best estimate and treat the resulting due date as an approximate range rather than a precise date.',
      },
      {
        question: 'What are the signs that labor is imminent?',
        answer: 'Common signs include: restlessness or nesting behavior (scratching, digging, seeking quiet spaces), drop in body temperature (below 100°F/37.8°C in dogs — this is the most reliable predictor, typically occurring 12–24 hours before labor), loss of appetite, panting, shivering, and visible contractions. In dogs, stage 1 labor (contractions without delivery) typically lasts 6–12 hours but can extend to 24 hours in first-time mothers.',
      },
      {
        question: 'When should I contact a veterinarian?',
        answer: 'Contact a veterinarian immediately if: the due date range has passed with no signs of labor, active straining/contractions continue for more than 2 hours without delivering a puppy/kitten, there is green or dark discharge without a puppy/kitten following within 15–20 minutes, the mother appears distressed, weak, or in significant pain, or if she has a fever. Always have your emergency vet contact and a transport plan ready before the due date.',
      },
      {
        question: 'Can I use this calculator for other animals like rabbits or guinea pigs?',
        answer: 'No. This calculator is specifically calibrated for dogs (63-day average gestation) and cats (65-day average gestation). Other animals have very different gestation periods: rabbits average 31 days, guinea pigs 63–68 days, horses 340 days, cows 283 days, and hamsters just 16 days. Using dog or cat gestation lengths for other species would produce dangerously incorrect results. Always consult a veterinarian familiar with exotic or non-canine/feline species for pregnancy guidance.',
      },
      {
        question: 'What should I prepare before the whelping or queening date?',
        answer: 'Prepare a whelping/queening box in a quiet, warm, draft-free area at least 2 weeks before the due date so the mother can get comfortable with it. Stock supplies: clean towels, heating pad (set on low, under half the box only), iodine for umbilical cords, unwaxed dental floss for tying cords if needed, bulb syringe for clearing airways, a digital scale to weigh newborns daily, and emergency vet numbers. Have your veterinarian\'s after-hours number saved. For dogs, monitor rectal temperature twice daily starting 5–7 days before the due date — a drop below 100°F/37.8°C signals labor within 24 hours.',
      },
      {
        question: 'Can a dog or cat get pregnant again while nursing?',
        answer: 'Yes. Both dogs and cats can become pregnant while still nursing a litter, though it is less common during the first few weeks postpartum. Dogs typically return to heat (estrus) approximately 4–6 months after whelping, but this varies by breed and individual. Cats can return to heat as early as 2–4 weeks after queening, making them particularly susceptible to back-to-back pregnancies. Most veterinarians recommend waiting at least one full heat cycle (or 4–6 months) before breeding again to allow the mother\'s body to recover fully.',
      },
      {
        question: 'At what point during pregnancy can a veterinarian confirm it?',
        answer: 'Pregnancy can be confirmed at different stages using different methods: Abdominal palpation by an experienced veterinarian can detect pregnancy as early as day 21–28 (before calcification makes palpation difficult after day 35). Ultrasound can confirm pregnancy from approximately day 25–30 and can detect fetal heartbeats. Relaxin hormone testing (blood test) is reliable from day 21–25. X-rays are most definitive after day 45 when fetal skeletons have calcified — they can also count the number of fetuses, which helps prepare for delivery. Do not rely solely on physical signs like weight gain or mammary development, as false pregnancies (pseudopregnancy) can mimic these signs, especially in dogs.',
      },
    ],
    commonUses: [
      'Breeding management — estimate whelping (dog) or queening (cat) due dates to prepare for birth and arrange veterinary support in advance',
      'Pregnancy monitoring — track trimesters and week-by-week progress to ensure the mother receives appropriate nutrition and care at each developmental stage',
      'Veterinary appointment scheduling — know when to schedule ultrasound (day 25-30), X-ray (day 45+), and pre-labor wellness checkups',
      'Emergency preparedness — identify when the due date range has passed without labor and veterinary intervention may be needed to ensure safe delivery'
    ],
    workedExamples: [
      {
        scenario: 'A Labrador Retriever was bred on March 1, 2026. The owner wants to know the expected whelping date, the date range when birth could occur, and when to start monitoring for labor signs.',
        inputs: { species: 'dog', breedingDate: '2026-03-01' },
        result: 'Whelping Due Date: May 3, 2026 (63 days from breeding). Expected Range: April 28 to May 8, 2026 (58–68 days). Days until due date will vary based on current date. The pregnancy spans 9 weeks across three trimesters.',
        insight: 'For a large breed like a Labrador, the 63-day gestation means puppies should arrive around May 3. However, normal variation allows birth anytime from April 28 to May 8. The owner should prepare a whelping box by mid-April, schedule an ultrasound around March 26–31, and begin twice-daily rectal temperature monitoring from April 26. Labrador litters average 6–8 puppies, so supplies should be prepared accordingly. The week-by-week calendar helps track developmental milestones — for instance, fetal skeletons start calcifying around day 45, which falls on April 15, making that an ideal time for a confirming X-ray.',
      },
      {
        scenario: 'A domestic shorthair cat was observed mating on January 15, 2026. The owner wants to estimate the queening date, understand pregnancy stages, and know when veterinary checkups are needed.',
        inputs: { species: 'cat', breedingDate: '2026-01-15' },
        result: 'Queening Due Date: March 21, 2026 (65 days from mating). Expected Range: March 19 to March 23, 2026 (63–67 days). The pregnancy is divided into Early (days 1–21), Mid (days 22–42), and Late (day 43–birth) trimesters.',
        insight: 'Cat pregnancies are remarkably consistent — the 65-day average with a tight 63–67 day range means this queen will likely deliver between March 19–23. Unlike dogs, cats show less temperature drop before labor, so physical and behavioral signs (restlessness, nesting, vocalizing) are more important to monitor. An ultrasound around February 9–14 (day 25–30) can confirm pregnancy and give an initial kitten count. The queen should transition to a high-quality kitten food by week 3 for increased caloric and nutrient density. By week 7 (late February/early March), the owner should see visible kitten movement. The tight due-date window means veterinary preparation should be finalized by March 18.',
      },
      {
        scenario: 'A small-breed dog (Chihuahua) was bred twice on June 10 and June 12, 2026. The owner is unsure which date to use and wants to understand all relevant pregnancy milestones.',
        inputs: { species: 'dog', breedingDate: '2026-06-11' },
        result: 'Whelping Due Date: August 13, 2026 (using June 11 as midpoint). Expected Range: August 6 to August 16, 2026. Current trimester depends on today\'s date relative to breeding.',
        insight: 'When multiple matings occur over 2–3 days, using the middle date provides the most practical estimate. Small breeds like Chihuahuas sometimes deliver 1–3 days earlier than large breeds, so the owner should be especially watchful starting August 3. Due to the breed\'s tendency for dystocia (difficult birth due to large head-to-pelvis ratio), the owner should schedule a veterinarian to be on standby and discuss planned C-section protocols. The week-by-week calendar helps identify that the first trimester (days 1–21) ends around July 1 — embryo implantation is complete by then. X-rays on July 26 (day 45) can confirm puppy count, which is especially helpful for small breeds where litter size is typically 1–4 puppies.',
      },
    ],
    proTips: [
      'Monitor rectal temperature twice daily starting 5–7 days before the due date. In dogs, a drop from baseline (typically 101–102.5°F) to below 100°F/37.8°C is the most reliable sign that labor will begin within 12–24 hours.',
      'Transition the mother to a high-quality puppy or kitten food during the last trimester (from day 43). These formulas are more calorie-dense and nutrient-rich, supporting fetal growth without requiring the mother to consume an uncomfortably large volume of food.',
      'Prepare a whelping/queening kit at least 2 weeks before the due date: clean towels (6–8), a digital scale for weighing newborns daily, unwaxed dental floss and iodine for umbilical cords, a bulb syringe for clearing airways, a heating pad (set on low, placed under only half the box), and a notebook to record birth times and weights.',
      'Schedule a veterinary "pre-labor" checkup around day 50. This visit can confirm fetal viability via ultrasound, estimate litter size, review your whelping/queening plan, and ensure you have after-hours emergency contact information.',
      'For first-time mothers: expect labor to be slower. Stage 1 labor (panting, restlessness, nesting) can last up to 24 hours in first-timers (vs. 6–12 hours in experienced mothers). Do not panic — observe and call your vet if you are concerned, but understand that first births often take longer.',
      'After delivery, weigh each newborn on a digital scale daily at the same time. A 10% weight loss within the first 24 hours is acceptable, but consistent weight loss after day 2 or failure to regain birth weight by day 7 warrants an immediate veterinary visit.',
    ],
    limitations: [
      'This calculator estimates due dates based on the breeding date, not the ovulation date. In dogs, sperm can survive 5–7 days in the reproductive tract and ovulation can lag 2–4 days after mating. The true gestation from ovulation is approximately 63 days ±1 day, making ovulation-timed due dates more precise than breeding-date estimates. If you have progesterone-timed ovulation data, your veterinarian can provide a more accurate due date.',
      'Breed-specific variation is not accounted for in this calculator. Some breeds tend toward slightly shorter or longer gestations. Small breeds sometimes deliver 1–3 days earlier, while large and giant breeds may go 1–2 days longer. Individual litter size also influences timing — larger litters tend to deliver slightly earlier.',
      'This calculator covers only dogs and cats. It must not be used for other species such as rabbits (31 days), guinea pigs (63–68 days), livestock (cows 283 days, sheep 147 days, pigs 114 days), horses (340 days), or exotic pets. Each species has distinct gestational physiology.',
      'The calculator is for educational and planning purposes only. It does not replace professional veterinary care. Pregnancy complications such as pyometra, dystocia, eclampsia, or fetal distress require immediate veterinary attention regardless of what the estimated due date says.',
      'Week-by-week calendar dates are based on the average gestation midpoint. Individual pregnancies may progress slightly faster or slower. Do not panic if your pet delivers a day or two outside the estimated range — always consult your veterinarian to assess whether intervention is needed.',
    ],
    quickReference: [
      { label: 'Dog Gestation', value: '63 days (range: 58–68 days)' },
      { label: 'Cat Gestation', value: '65 days (range: 63–67 days)' },
      { label: 'First Trimester', value: 'Days 1–21: Implantation, organ formation' },
      { label: 'Second Trimester', value: 'Days 22–42: Rapid fetal growth, skeletal calcification' },
      { label: 'Third Trimester', value: 'Day 43 to birth: Final maturation, positioning' },
      { label: 'Ultrasound Detection', value: 'From day 25–30 post-breeding' },
      { label: 'X-ray for Puppy/Kitten Count', value: 'After day 45 (skeleton calcified)' },
      { label: 'Temperature Drop (Dogs)', value: 'Below 100°F/37.8°C signals labor in 12–24 hrs' },
    ],
    citations: [

      { source: 'VCA Hospitals — Cat Pregnancy', url: 'https://vcahospitals.com/know-your-pet/cat-pregnancy-and-kitten-care' },
      { source: 'Wikipedia — Canine Reproduction', url: 'https://en.wikipedia.org/wiki/Canine_reproduction' },
      { source: 'Merck Veterinary Manual — Small Animal Reproduction', url: 'https://www.merckvetmanual.com/management-and-nutrition/management-of-reproduction-small-animals/the-breeding-of-dogs' },
    ],
  },
};

export default dogCatPregnancyConfig;
