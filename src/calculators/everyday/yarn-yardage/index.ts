import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import YarnYardagePanel from './YarnYardagePanel';
import { BASELINE_ROWS, K_STITCH, WASTE, yarnPlan } from './yarnMath';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';

const YARN_WEIGHT_DESCRIPTIONS: Record<string, string> = {
  'Lace/Fingering': 'Lightest weight, used for delicate shawls and socks',
  Sport: 'Light weight, good for lightweight garments and baby clothes',
  DK: 'Medium-light weight, versatile for garments and accessories',
  Worsted: 'Medium weight, most common for sweaters and blankets',
  Bulky: 'Heavy weight, quick projects like hats and blankets',
  'Super Bulky': 'Extra heavy weight, very quick projects',
};

const yarnYardageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'projectType',
      label: 'Project Type',
      type: 'select',
      helpText: 'Type of knitting or crochet project. Choose Custom to enter your own width and length dimensions.',
      options: [
        { label: 'Scarf', value: 'Scarf' },
        { label: 'Blanket', value: 'Blanket' },
        { label: 'Sweater', value: 'Sweater' },
        { label: 'Hat', value: 'Hat' },
        { label: 'Socks', value: 'Socks' },
        { label: 'Shawl', value: 'Shawl' },
        { label: 'Dishcloth', value: 'Dishcloth' },
        { label: 'Custom', value: 'Custom' },
      ],
    },
    {
      id: 'size',
      label: 'Size',
      type: 'select',
      helpText: 'Project size: small, medium, large, or extra-large. Affects base yardage for standard projects.',
      options: [
        { label: 'S (Small)', value: 'S' },
        { label: 'M (Medium)', value: 'M' },
        { label: 'L (Large)', value: 'L' },
        { label: 'XL (Extra Large)', value: 'XL' },
      ],
      showWhen: (values) => values.projectType !== 'Custom',
    },
    {
      id: 'customWidth',
      label: 'Width (inches)',
      type: 'number',
      placeholder: '60',
      min: 1,
      max: 1000,
      inputMode: 'numeric',
      helpText: 'Width of your custom project in inches. Use imperial measurements for best results with this calculator.',
      showWhen: (values) => values.projectType === 'Custom',
    },
    {
      id: 'customLength',
      label: 'Length (inches)',
      type: 'number',
      placeholder: '80',
      min: 1,
      max: 1000,
      inputMode: 'numeric',
      helpText: 'Length of your custom project in inches. For metric conversions, 1 inch = 2.54 cm.',
      showWhen: (values) => values.projectType === 'Custom',
    },
    {
      id: 'yarnWeight',
      label: 'Yarn Weight',
      type: 'select',
      helpText: 'Used to check that your stitch gauge is plausible for this yarn (Craft Yarn Council ranges). Preset yardages are for worsted weight.',
      options: [
        { label: 'Lace/Fingering', value: 'Lace/Fingering' },
        { label: 'Sport', value: 'Sport' },
        { label: 'DK', value: 'DK' },
        { label: 'Worsted', value: 'Worsted' },
        { label: 'Bulky', value: 'Bulky' },
        { label: 'Super Bulky', value: 'Super Bulky' },
      ],
    },
    {
      id: 'stitchesPer4in',
      label: 'Stitches per 4 inches (gauge)',
      type: 'number',
      placeholder: '20',
      min: 1,
      max: 100,
      required: true,
      inputMode: 'numeric',
      helpText: 'Your stitch gauge from a 4-inch swatch — count stitches across 4 inches horizontally. Always block your swatch before measuring.',
    },
    {
      id: 'rowsPer4in',
      label: 'Rows per 4 inches (gauge)',
      type: 'number',
      placeholder: '24',
      min: 1,
      max: 150,
      required: true,
      inputMode: 'numeric',
      helpText: 'Your row gauge from a 4-inch swatch — count rows across 4 inches vertically. Gauge changes significantly after blocking with natural fibers.',
    },
    {
      id: 'precutType',
      label: 'Precut Fabric Type (optional)',
      type: 'select',
      helpText: 'Optional quilting precut bundle. Shows its size in yards of 44-inch fabric; this is fabric, so it is not subtracted from the yarn you need.',
      options: [
        { label: 'None', value: '' },
        { label: 'Jelly Roll (2.5" strips)', value: 'Jelly Roll' },
        { label: 'Layer Cake (10" squares)', value: 'Layer Cake' },
        { label: 'Charm Pack (5" squares)', value: 'Charm Pack' },
        { label: 'Fat Quarter (18" × 22")', value: 'Fat Quarter' },
        { label: 'Fat Eighth (9" × 22")', value: 'Fat Eighth' },
      ],
    },
    {
      id: 'precutCount',
      label: 'Number of Precuts',
      type: 'number',
      placeholder: '1',
      min: 1,
      max: 1000,
      inputMode: 'numeric',
      helpText: 'How many precut bundles you plan to use. Each precut type provides a specific yardage equivalent.',
      showWhen: (values) => (values.precutType || '') !== '',
    },
  ],
  calculate: (values) => {
    const p = yarnPlan(values);
    if (!p) return [];
    const fmtYards = (n: number) => `${Math.round(n).toLocaleString('en-US')} yards`;
    const fmtMeters = (n: number) => `${Math.round(n).toLocaleString('en-US')} meters`;
    const custom = p.projectType === 'Custom';

    const results: CalculatorResult[] = [
      {
        id: 'yardageNeeded',
        label: 'Estimated Yardage Needed',
        value: fmtYards(p.yards),
        highlight: true,
        color: 'positive',
        interpretation: 'An estimate for stockinette or single crochet. Buy 10-20% extra and all skeins from one dye lot.',
        warning: p.gaugeWarning ?? undefined,
      },
      { id: 'metersNeeded', label: 'Estimated Meters Needed', value: fmtMeters(p.meters), color: 'neutral' },
      {
        id: 'baseYardage',
        label: custom ? 'Calculated Base Yardage (before 20% waste)' : `Base Yardage for ${p.projectType} (Size ${p.size})`,
        value: `${Math.round(p.baseYardage).toLocaleString('en-US')} yards`,
        color: 'neutral',
      },
      {
        id: 'gaugeAdjustment',
        label: `Gauge Adjustment (${p.stitches} st / ${p.rows} rows per 4")`,
        value: custom ? `${K_STITCH} × width × length × rows per inch ÷ 36, × ${WASTE} waste` : `× ${p.rowFactor.toFixed(2)} (your rows ÷ ${24})`,
        color: 'neutral',
      },
    ];

    const weightName = p.yarnWeight;
    results.push({ id: 'yarnWeightInfo', label: `Yarn Weight: ${weightName}`, value: YARN_WEIGHT_DESCRIPTIONS[weightName] || '', color: 'neutral' });

    if (p.precutFabricYards > 0) {
      results.push({
        id: 'precutYardage',
        label: `Fabric in ${p.precutCount} ${p.precutType}(s)`,
        value: fmtYards(p.precutFabricYards),
        color: 'neutral',
        interpretation: 'Equivalent yards of 44-inch-wide quilting fabric (area basis). This is fabric, not yarn, so it does not reduce the yarn estimate.',
      });
    }
    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(YarnYardagePanel, { values, results });
  },
  explainSteps: (values) => {
    const p = yarnPlan(values);
    if (!p) return [];
    const results = yarnYardageConfig.calculate(values);
    const val = (id: string) => resultValue(results, id) ?? '';
    const n = (x: number) => x.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const steps: ExplainStep[] = [];
    if (p.projectType === 'Custom') {
      steps.push(
        {
          label: 'Yarn for the piece before waste',
          expr: `${K_STITCH} × ${n(parseFloat(values.customWidth))} in × ${n(parseFloat(values.customLength))} in × (${p.rows} ÷ 4 rows per inch) ÷ 36 = ${n(p.baseYardage)} yards`,
          note: 'A row uses about 3.5 times its width in yarn (an estimate for stockinette or single crochet).',
        },
        { label: 'Add waste', expr: `${n(p.baseYardage)} yards × ${WASTE} = ${val('yardageNeeded')}`, note: p.gaugeWarning ?? undefined },
      );
    } else {
      steps.push(
        {
          label: `Base yardage for a ${p.projectType}, size ${p.size}`,
          expr: `${n(p.baseYardage)} yards`,
          note: `Preset yardages are for worsted weight at ${BASELINE_ROWS} rows per 4 in.`,
        },
        { label: 'Scale by your row gauge', expr: `${n(p.baseYardage)} × (${p.rows} ÷ ${BASELINE_ROWS}) = ${val('yardageNeeded')}`, note: p.gaugeWarning ?? undefined },
      );
    }
    steps.push({ label: 'Convert to metres', expr: `${n(p.yards)} yards × 0.9144 = ${val('metersNeeded')}` });
    return finiteSteps(steps);
  },
  educational: {
    formula: 'Preset: Yards = Base × (Rows per 4" ÷ 24)  |  Custom: Yards = 3.5 × Width × Length × (Rows per inch) ÷ 36 × 1.2  |  Meters = Yards × 0.9144',
    formulaDescription:
      'Yarn yardage is an estimate. A row of knitting or crochet uses roughly 3.5 times its width in yarn (typically 3 to 4 times for stockinette), and finer stitches are proportionally shorter, so the yarn in a row does not depend on the stitch count; total yarn grows with the number of rows. For custom pieces the calculator multiplies 3.5 × width × length × rows per inch, divides by 36 to get yards and adds 20% for waste. For the preset projects it scales a base yardage (typical worsted-weight values at 24 rows per 4 inches, rounded rules of thumb rather than published data) by your row gauge ÷ 24. The stitch gauge is used to check that your swatch is plausible for the yarn weight you selected, using the Craft Yarn Council standard ranges.',
    diagram: {
      svg: '<svg viewBox=\'0 0 460 200\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><text x=\'230\' y=\'18\' font-family=\'system-ui,sans-serif\' font-size=\'13\' font-weight=\'700\' fill=\'var(--svg-1e293b)\' text-anchor=\'middle\'>Preset yardage, size M (worsted, 24 rows per 4 in)</text><text x=\'78\' y=\'50\' text-anchor=\'end\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>Hat</text><rect x=\'84\' y=\'34\' width=\'42\' height=\'22\' rx=\'4\' fill=\'var(--svg-3b82f6)\'/><text x=\'132\' y=\'50\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>250 yd</text><text x=\'78\' y=\'82\' text-anchor=\'end\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>Scarf</text><rect x=\'84\' y=\'66\' width=\'67\' height=\'22\' rx=\'4\' fill=\'var(--svg-3b82f6)\'/><text x=\'157\' y=\'82\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>400 yd</text><text x=\'78\' y=\'114\' text-anchor=\'end\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>Shawl</text><rect x=\'84\' y=\'98\' width=\'117\' height=\'22\' rx=\'4\' fill=\'var(--svg-3b82f6)\'/><text x=\'207\' y=\'114\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>700 yd</text><text x=\'78\' y=\'146\' text-anchor=\'end\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>Sweater</text><rect x=\'84\' y=\'130\' width=\'167\' height=\'22\' rx=\'4\' fill=\'var(--svg-3b82f6)\'/><text x=\'257\' y=\'146\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>1000 yd</text><text x=\'78\' y=\'178\' text-anchor=\'end\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>Blanket</text><rect x=\'84\' y=\'162\' width=\'300\' height=\'22\' rx=\'4\' fill=\'var(--svg-3b82f6)\'/><text x=\'390\' y=\'178\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>1800 yd</text></svg>',
      alt: 'Horizontal bar chart of preset size M yardage: hat 250 yd, scarf 400 yd, shawl 700 yd, sweater 1000 yd, blanket 1800 yd',
      caption: 'Preset yardages are rough anchors for worsted weight; the estimate scales with your row gauge.',
    },
    variables: [
      {
        symbol: 'Base Yardage',
        name: 'Base Yardage by Project',
        description: 'Pre-calculated yardage estimates for common project types and sizes at standard worsted-weight gauge. These are rule-of-thumb starting points, not published data, and should be adjusted for your specific gauge and pattern.',
      },
      {
        symbol: 'Gauge',
        name: 'Knitting Gauge (Stitches & Rows per 4")',
        description: 'Your personal knitting or crochet tension measured in stitches and rows over 4 inches. Always measure from a blocked swatch using the same yarn, needles, and stitch pattern you will use for the final project.',
      },
      {
        symbol: 'Gauge Factor',
        name: 'Row Gauge Multiplier',
        description: 'Scales preset yardage by your row gauge: your rows per 4 inches ÷ 24. More rows per inch means more rows to knit and more yarn.',
      },
      {
        symbol: 'Precut',
        name: 'Precut Fabric Yardage',
        description: 'Standardized fabric bundles used in quilting, shown as the equivalent yards of 44-inch-wide fabric by area: a Jelly Roll (40 strips of 2.5" × 42") is about 2.65 yd, a Layer Cake (42 squares of 10") about 2.65 yd, a Charm Pack (42 squares of 5") about 0.66 yd, a Fat Quarter (18" × 22") 0.25 yd and a Fat Eighth (9" × 22") 0.125 yd. Fabric precuts are not yarn.',
      },
      {
        symbol: 'Waste Factor',
        name: '20% Waste Buffer',
        description: 'The custom project mode adds 20% as a safety margin for seaming, weaving in ends, swatching and mistakes. This is a rule of thumb; complex cable or lace patterns can need more.',
      },
    ],
    commonUses: [
      'Estimating how many skeins of yarn to buy for a knitting or crochet project before starting to avoid running out mid-project',
      'Adjusting yardage based on your personal gauge (tight vs. loose knitting) for accurate yarn shopping and dye lot matching',
      'Planning a custom-sized project like a blanket or scarf by calculating yardage from specific dimensions instead of relying on pattern estimates',
      'Converting between yards and meters when following patterns from different countries or using yarn labels with metric measurements',
    ],
    howToUse: [
      'Select your project type (Scarf, Blanket, Sweater, etc.) or choose Custom to enter your own width and length dimensions in inches.',
      'For standard projects, pick the size (S, M, L, XL). For custom projects, enter the exact width and length of your finished piece.',
      'Choose your yarn weight so the calculator can check your stitch gauge is plausible for that yarn.',
      'Enter your personal gauge — stitches per 4 inches and rows per 4 inches — measured from a properly blocked gauge swatch.',
      'Optionally, select a quilting precut type and quantity to see how many yards of fabric it equals (this is separate from the yarn estimate).',
      'Review the estimated yardage in both yards and meters, check the gauge adjustment, and add a safety margin before buying.',
    ],
    explanation:
      'Yarn yardage estimation is one of the most common challenges knitters and crocheters face. Running out of yarn mid-project is frustrating because dye lots change over time and a matching skein can be hard to find later; buying far too much is wasteful. This calculator gives an estimate in two ways. For preset projects (scarf, blanket, sweater, hat, socks, shawl, dishcloth) it starts from rule-of-thumb base yardages for worsted-weight yarn at 24 rows per 4 inches and scales them by your row gauge. For a custom piece it uses a simple physical model: a row of stockinette uses roughly 3.5 times its width in yarn, so yardage = 3.5 × width × length × rows per inch ÷ 36, plus 20% waste. The stitch gauge does not change that estimate (finer stitches use proportionally less yarn each), but the calculator checks it against the Craft Yarn Council standard stitch-gauge range for the yarn weight you selected, which catches mismatched swatches. The preset values are anchors, not measured data; textured stitches, cables, lace, crochet and fiber differences all change real consumption. The result is also shown in meters (multiply yards by 0.9144). Always swatch, block the swatch, and buy a safety margin.',
    faqs: [
      {
        question: 'Should I always buy extra yarn beyond the calculated estimate?',
        answer: 'Yes, it is strongly recommended to buy 10 to 20 percent more yarn than the calculator suggests. This accounts for gauge swatching, pattern modifications, seaming, weaving in ends, dye lot matching, and the inevitable desire to add a few more rows. It is much easier to buy the correct dye lot upfront than to find matching yarn later — dye lots can vary noticeably even from the same brand. Most reputable yarn shops accept returns on unused, unopened skeins. The custom project mode already includes a 20 percent waste buffer; for standard projects, multiply the result by 1.15 to add your safety margin.',
      },
      {
        question: 'How do I measure my gauge accurately?',
        answer: 'Knit or crochet a swatch at least 5 to 6 inches square using the same needles or hook, yarn, and stitch pattern you plan to use for your project. Block the swatch the same way you will block the finished item — this is absolutely critical because blocking can significantly change gauge, especially with natural fibers like wool and alpaca. Then measure the number of stitches and rows over a 4-inch section in the center of the swatch, avoiding the edges where tension may be uneven. Count stitches in at least 3 different spots and average them for the most reliable number. If your gauge does not match the pattern, do not try to knit tighter or looser — your natural tension will return within a few rows. Change needle size and swatch again.',
      },
      {
        question: 'What if I am using a different yarn weight than worsted?',
        answer: 'Select your yarn weight and enter your real swatch gauge. The preset yardages are anchored to worsted weight, so for a very different weight (for example lace or super bulky) the custom mode, which works from your dimensions and row gauge, is usually the better starting point. The calculator warns if your stitch gauge is outside the Craft Yarn Council range for the selected weight (for example 16-20 stitches per 4 inches for worsted, 12-15 for bulky, 27-40 for lace and fingering).',
      },
      {
        question: 'Can I use this calculator for crochet projects too?',
        answer: 'You can enter a crochet gauge, but the model is built around knitted stockinette. Crochet fabric is typically denser and many crocheters report using noticeably more yarn than for the same size in knitting, so add a larger safety margin (for example 15-25%) and check against a pattern written for your stitch.',
      },
      {
        question: 'How does the gauge adjustment factor work mathematically?',
        answer: 'For preset projects the base yardage is multiplied by your rows per 4 inches divided by 24. For example 22 rows gives 22/24 = 0.92 (about 8% less yarn) and 26 rows gives 26/24 = 1.08 (about 8% more). The stitch count per row does not change the result because tighter stitches are shorter, so a row of the same width uses about the same length of yarn. For custom pieces the same idea gives yards = 3.5 × width × length × (rows per inch) ÷ 36, times 1.2 for waste.',
      },
      {
        question: 'What are precut fabrics and why are they in a yarn calculator?',
        answer: 'Precuts are standardized quilting fabric bundles. The optional precut selector only converts them to yards of 44-inch-wide fabric by area (Jelly Roll of 40 strips 2.5 by 42 inches about 2.65 yd, Layer Cake of 42 ten-inch squares about 2.65 yd, Charm Pack of 42 five-inch squares about 0.66 yd, Fat Quarter 0.25 yd, Fat Eighth 0.125 yd). Fabric cannot replace yarn, so these numbers are shown separately and are not subtracted from the yarn estimate.',
      },
      {
        question: 'Why does the custom project mode add a 20 percent waste factor?',
        answer: 'The 20 percent margin covers seaming, weaving in ends, swatching and the occasional mistake that needs ripping back. It is a rule of thumb, not a measured value; complex cables, lace or heavy texture can need more, and simple stockinette without seams may need less.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Emma is knitting a medium-sized scarf in worsted-weight yarn. Her gauge swatch shows 18 stitches and 22 rows per 4 inches. She wants to know how much yarn to buy.',
        inputs: { projectType: 'Scarf', size: 'M', yarnWeight: 'Worsted', stitchesPer4in: '18', rowsPer4in: '22' },
        result: 'Estimated 367 yards needed (base 400 × 22/24). Equivalent to ~335 meters.',
        insight: 'The preset medium scarf is 400 yards at 24 rows per 4 inches. Emma gets fewer rows per inch (22), so the scarf needs 22/24 = 0.917 of the base: 400 × 0.917 = 367 yards. Her 18 stitches per 4 inches is inside the usual 16-20 range for worsted yarn. She should still buy extra (two 220-yard skeins give 440 yards) to allow for swatching and dye-lot matching.',
      },
      {
        scenario: 'Marcus is knitting a custom throw 50 inches by 60 inches with super bulky yarn at 10 stitches and 12 rows per 4 inches.',
        inputs: { projectType: 'Custom', customWidth: '50', customLength: '60', yarnWeight: 'Super Bulky', stitchesPer4in: '10', rowsPer4in: '12' },
        result: 'Estimated 1,050 yards needed (875 base + 20% waste). Equivalent to ~960 meters.',
        insight: 'Rows per inch = 12 ÷ 4 = 3. Yarn = 3.5 × 50 × 60 × 3 ÷ 36 = 875 yards, plus 20% waste = 1,050 yards. His 10 stitches per 4 inches is inside the usual 7-11 range for super bulky yarn. As a sanity check, an average throw in chunky yarn commonly takes on the order of a thousand yards, but his own swatch and stitch pattern decide the real figure.',
      },
      {
        scenario: 'Lily is crocheting a large lace shawl. She measured 30 stitches and 36 rows per 4 inches in lace-weight yarn; the preset large shawl is 900 yards.',
        inputs: { projectType: 'Shawl', size: 'L', yarnWeight: 'Lace/Fingering', stitchesPer4in: '30', rowsPer4in: '36' },
        result: 'Estimated 1,350 yards needed (900 × 36/24). Equivalent to ~1,234 meters.',
        insight: 'Her row gauge of 36 per 4 inches is 1.5 times the 24-row baseline, so the shawl needs about 1.5 × 900 = 1,350 yards. Her 30 stitches per 4 inches is inside the usual 27-40 range for lace and fingering weight. Crochet generally uses more yarn than knitting for the same size, so she should add 15-20% and check the gauge again after blocking.',
      },
    ],
    proTips: [
      'Always make your gauge swatch larger than 4 inches by 4 inches — aim for 6 inches by 6 inches at minimum. Edge stitches have different tension, and measuring only 4 inches in the center of a 4-inch swatch gives unreliable numbers.',
      'Block your swatch before measuring gauge. Many fibers (especially wool, alpaca, and cotton) change gauge significantly after washing. A swatch that is perfect unblocked can grow 5 to 15 percent after blocking, which translates to significant yardage differences.',
      'When buying yarn for a project, buy all skeins from the same dye lot number. Dye lots are printed on the label — even the same color name can vary noticeably between lots, creating visible stripes in your finished project that cannot be fixed.',
      'For projects with multiple colors, calculate yardage for each color separately. A striped blanket with 4 colors does not use equal amounts of each — estimate each color\'s proportion of the total surface area and multiply by total yardage.',
      'The estimate assumes stockinette (knitting) or single crochet. Cables, bobbles, lace and heavily textured stitches can use noticeably more yarn for the same dimensions, so add a larger margin for them.',
      'Yarn is typically sold in skeins of specific yardage (e.g., 220 yards per 100g skein of worsted). Divide the calculator\'s yardage estimate by your skein\'s yardage to determine how many skeins to buy — and always round up, never down.',
    ],
    limitations: [
      'These are estimates, not measurements. Preset yardages are rule-of-thumb values for worsted-weight projects at 24 rows per 4 inches, and custom mode assumes about 3.5 times the fabric width in yarn per row (stockinette). Cables, lace, texture, crochet stitches, seams and fiber differences change real consumption, and the calculator does not estimate yarn per color for multi-color projects. Always swatch, block the swatch, and buy a safety margin of 10-20% from one dye lot.',
    ],
    quickReference: [
      { label: 'Scarf (S/M/L)', value: '300 / 400 / 500 yds — a standard 6"×60" scarf in worsted weight at baseline gauge.' },
      { label: 'Hat (S/M/L)', value: '200 / 250 / 300 yds — adult beanie or slouch hat. Most patterns need 1 skein of worsted (~220 yds).' },
      { label: 'Sweater (S/M/L)', value: '800 / 1000 / 1200 yds - adult pullover; cables and long sleeves need more.' },
      { label: 'Blanket (S/M/L)', value: '1200 / 1800 / 2400 yds - throw to full-size, worsted weight.' },
      { label: 'Shawl (S/M/L)', value: '500 / 700 / 900 yds — triangle or crescent shawl. Lace shawls often need 1000+ yds.' },
      { label: 'Jelly Roll', value: '~2.65 yds of 44-inch fabric by area (40 strips of 2.5" x 42").' },
      { label: 'Layer Cake', value: '~2.65 yds by area (42 squares of 10").' },
      { label: 'Fat Quarter', value: '0.25 yd by area (18" x 22").' },
    ],
    citations: [
      { source: 'Craft Yarn Council - Standard Yarn Weight System', url: 'https://www.craftyarncouncil.com/standards/yarn-weight-system' },
      { source: 'Wikipedia - Yarn Weight', url: 'https://en.wikipedia.org/wiki/Yarn_weight' },
    ],
  },
};

export default yarnYardageConfig;
