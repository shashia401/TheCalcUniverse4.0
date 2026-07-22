import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import YarnYardagePanel from './YarnYardagePanel';

const PROJECT_BASE_YARDAGE: Record<string, Record<string, number>> = {
  Scarf: { S: 300, M: 400, L: 500 },
  Blanket: { S: 1200, M: 1800, L: 2400 },
  Sweater: { S: 800, M: 1000, L: 1200 },
  Hat: { S: 200, M: 250, L: 300 },
  Socks: { S: 250, M: 300, L: 350 },
  Shawl: { S: 500, M: 700, L: 900 },
  Dishcloth: { S: 100, M: 150, L: 200 },
};

const PRECUT_CONVERTER: Record<string, number> = {
  'Jelly Roll': 2.75,
  'Layer Cake': 0.5,
  'Charm Pack': 0.75,
  'Fat Quarter': 0.5,
  'Fat Eighth': 0.25,
};

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
      inputMode: 'numeric',
      helpText: 'Length of your custom project in inches. For metric conversions, 1 inch = 2.54 cm.',
      showWhen: (values) => values.projectType === 'Custom',
    },
    {
      id: 'yarnWeight',
      label: 'Yarn Weight',
      type: 'select',
      helpText: 'Thickness of your yarn affects yardage needed. Thicker yarn covers more area per yard.',
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
      required: true,
      inputMode: 'numeric',
      helpText: 'Your row gauge from a 4-inch swatch — count rows across 4 inches vertically. Gauge changes significantly after blocking with natural fibers.',
    },
    {
      id: 'precutType',
      label: 'Precut Fabric Type (optional)',
      type: 'select',
      helpText: 'Optional precut bundle type for quilting projects. Select None to skip precut calculations.',
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
      inputMode: 'numeric',
      helpText: 'How many precut bundles you plan to use. Each precut type provides a specific yardage equivalent.',
      showWhen: (values) => (values.precutType || '') !== '',
    },
  ],
  calculate: (values) => {
    const projectType = values.projectType || 'Scarf';
    const size = values.size || 'M';
    const stitchesPer4in = parseInt(values.stitchesPer4in, 10);
    const rowsPer4in = parseInt(values.rowsPer4in, 10);

    if (isNaN(stitchesPer4in) || isNaN(rowsPer4in) || stitchesPer4in < 1 || rowsPer4in < 1) {
      return [];
    }

    let baseYardage = 0;

    if (projectType === 'Custom') {
      const customWidth = parseFloat(values.customWidth);
      const customLength = parseFloat(values.customLength);
      if (isNaN(customWidth) || isNaN(customLength) || customWidth <= 0 || customLength <= 0) {
        return [];
      }
      const stitchesPerInch = stitchesPer4in / 4;
      const rowsPerInch = rowsPer4in / 4;
      baseYardage = ((customWidth * customLength) / (stitchesPerInch * rowsPerInch)) * 1.2;
    } else {
      const projectSizes = PROJECT_BASE_YARDAGE[projectType];
      if (!projectSizes) return [];
      baseYardage = projectSizes[size];
      if (!baseYardage) return [];
    }

    const gaugeFactor = (stitchesPer4in / 20) * (rowsPer4in / 24);
    const gaugeAdjustedYardage = baseYardage * gaugeFactor;

    const precutType = values.precutType || '';
    const precutCount = parseInt(values.precutCount, 10) || 0;
    let precutYardage = 0;
    if (precutType && precutCount > 0 && PRECUT_CONVERTER[precutType]) {
      precutYardage = PRECUT_CONVERTER[precutType] * precutCount;
    }

    const yardageNeeded = gaugeAdjustedYardage;
    const metersNeeded = yardageNeeded * 0.9144;

    const fmtYards = (n: number) => `${Math.round(n).toLocaleString(undefined)} yards`;
    const fmtMeters = (n: number) => `${Math.round(n).toLocaleString(undefined)} meters`;

    const results: CalculatorResult[] = [
      {
        id: 'yardageNeeded',
        label: 'Estimated Yardage Needed',
        value: fmtYards(yardageNeeded),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'metersNeeded',
        label: 'Estimated Meters Needed',
        value: fmtMeters(metersNeeded),
        color: 'neutral',
      },
      {
        id: 'baseYardage',
        label: projectType === 'Custom' ? 'Calculated Base Yardage' : `Base Yardage for ${projectType} (Size ${size})`,
        value: `${Math.round(baseYardage).toLocaleString(undefined)} yards`,
        color: 'neutral',
      },
      {
        id: 'gaugeAdjustment',
        label: `Gauge Adjustment (${stitchesPer4in} st / ${rowsPer4in} rows per 4")`,
        value: `× ${gaugeFactor.toFixed(2)} factor`,
        color: 'neutral',
      },
    ];

    if (yardageNeeded > 0) {
      const weightName = values.yarnWeight || 'Worsted';
      const weightDesc = YARN_WEIGHT_DESCRIPTIONS[weightName] || '';
      results.push({
        id: 'yarnWeightInfo',
        label: `Yarn Weight: ${weightName}`,
        value: weightDesc,
        color: 'neutral',
      });
    }

    if (precutYardage > 0) {
      results.push({
        id: 'precutYardage',
        label: `Yardage from ${precutCount} ${precutType}(s)`,
        value: fmtYards(precutYardage),
        color: 'neutral',
      });
      const remaining = yardageNeeded - precutYardage;
      results.push({
        id: 'remainingYardage',
        label: remaining > 0 ? 'Additional Yardage Needed' : 'Yardage Surplus',
        value: fmtYards(Math.abs(remaining)),
        color: remaining > 0 ? 'negative' : 'positive',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(YarnYardagePanel, { values, results });
  },
  educational: {
    formula: 'Yardage = (Width × Length) ÷ ((St/in) × (Rows/in)) × 1.2  |  Adjusted = Base × (StGauge÷20) × (RowGauge÷24)  |  Meters = Yards × 0.9144',
    formulaDescription:
      'Yarn yardage estimation combines project dimensions with your personal gauge to calculate how much yarn you need. The base yardage uses pre-calculated estimates for common project types and sizes at a standard worsted-weight gauge of 20 stitches and 24 rows per 4 inches. The gauge adjustment factor scales these base values proportionally to match your individual knitting or crochet tension. For custom-sized projects, the calculator uses the fabric area method: total square inches divided by the area covered per yard of yarn (determined by your stitch and row gauge), with a 20% waste buffer for seaming, pattern repeats, and swatching. Tighter gauge (more stitches per inch) requires more yarn; looser gauge requires less. The result is also shown in metric meters by multiplying yards by 0.9144 for those using metric yarn labels sold outside the United States.',
    diagram: {
      svg: '<svg viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Yardage Estimates by Project (Worsted Weight, Size M)</text><rect x="15" y="40" width="60" height="16" rx="4" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="45" y="52" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Hat</text><text x="45" y="35" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">200 yd</text><rect x="85" y="32" width="80" height="24" rx="4" fill="var(--svg-22c55e)" opacity="0.8"/><text x="125" y="48" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Scarf</text><text x="125" y="28" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">350 yd</text><rect x="175" y="38" width="70" height="18" rx="4" fill="var(--svg-f59e0b)" opacity="0.8"/><text x="210" y="50" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Shawl</text><text x="210" y="33" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">500 yd</text><rect x="255" y="28" width="90" height="28" rx="4" fill="var(--svg-8b5cf6)" opacity="0.8"/><text x="300" y="46" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Sweater</text><text x="300" y="23" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">1200 yd</text><rect x="355" y="20" width="90" height="36" rx="4" fill="var(--svg-ef4444)" opacity="0.8"/><text x="400" y="42" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Blanket</text><text x="400" y="17" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">2500 yd</text><text x="230" y="107" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Gauge adjustment: Actual = Base × (your_st ÷ 20) × (your_rows ÷ 24)</text><text x="230" y="119" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="middle">Tighter gauge (more st/in) = more yarn | Looser gauge = less yarn</text></svg>',
      alt: 'Horizontal bar chart comparing yardage estimates for hat (200 yd), scarf (350 yd), shawl (500 yd), sweater (1200 yd), and blanket (2500 yd)',
      caption: 'Yardage varies significantly by project type and size. Adjust base yardage by your personal gauge ratio for accurate estimates.',
    },
    variables: [
      {
        symbol: 'Base Yardage',
        name: 'Base Yardage by Project',
        description: 'Pre-calculated yardage estimates for common project types and sizes at standard worsted-weight gauge. These are starting points compiled from averages across thousands of knitting patterns and should be adjusted for your specific gauge.',
      },
      {
        symbol: 'Gauge',
        name: 'Knitting Gauge (Stitches & Rows per 4")',
        description: 'Your personal knitting or crochet tension measured in stitches and rows over 4 inches. Always measure from a blocked swatch using the same yarn, needles, and stitch pattern you will use for the final project.',
      },
      {
        symbol: 'Gauge Factor',
        name: 'Gauge Adjustment Multiplier',
        description: 'A multiplier that scales base yardage proportionally for your specific gauge. Computed as (your stitch gauge ÷ 20) × (your row gauge ÷ 24). Values above 1.0 mean you need more yarn than the baseline estimate.',
      },
      {
        symbol: 'Precut',
        name: 'Precut Fabric Yardage',
        description: 'Standardized fabric bundles used in quilting. Jelly Rolls contain 40 strips of 2.5"×WOF (~2.75 yds). Layer Cakes have 42 squares of 10"×10" (~2.75 yds). Charm Packs have 42 squares of 5"×5" (~0.75 yds). Fat Quarters are 18"×22" (~0.5 yds). Fat Eighths are 9"×22" (~0.25 yds).',
      },
      {
        symbol: 'Waste Factor',
        name: '20% Waste Buffer',
        description: 'The custom project mode automatically adds 20% to account for seam allowances, pattern repeat matching, swatching, weaving in ends, and the inevitable small errors that require ripping back. For complex cable or lace patterns, consider purchasing an additional 5-10%.',
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
      'Choose your yarn weight category to understand how the fiber thickness affects the yardage estimate.',
      'Enter your personal gauge — stitches per 4 inches and rows per 4 inches — measured from a properly blocked gauge swatch.',
      'Optionally, select a precut fabric type and quantity if you plan to incorporate precut bundles into your quilting or knitting project.',
      'Review the estimated yardage in both yards and meters, check the gauge adjustment factor, and determine if additional yarn is needed beyond any precuts.',
    ],
    explanation:
      'Yarn yardage estimation is one of the most common challenges knitters and crocheters face. Running out of yarn mid-project is frustrating — dye lots change over time, and finding a matching skein months later is nearly impossible. Buying too much is wasteful and expensive, especially with premium natural fibers. This calculator helps you get it right the first time by combining project-specific base yardages with your personal gauge. The concept of standardized yarn weights emerged in the mid-20th century as the Craft Yarn Council of America developed the yarn weight system in the 1970s, building on centuries of handspinning traditions dating back to medieval European guilds. The base yardages are compiled from averages across thousands of projects for common items like scarves, blankets, sweaters, hats, socks, shawls, and dishcloths. These base values assume a standard worsted-weight yarn at a typical gauge of 20 stitches and 24 rows per 4 inches. The gauge adjustment is critical because everyone knits differently — a loose knitter might use significantly less yarn for the same project than a tight knitter using the same pattern and yarn. The adjustment formula scales the base yardage proportionally: if you knit 18 stitches per 4 inches instead of 20, you need approximately 10% less yarn (18/20 = 0.9). Conversely, if your gauge is 22 stitches per 4 inches, you need about 10% more. For custom-sized projects, the calculator uses the fabric area method: total square inches divided by the area covered per yard of yarn (determined by your gauge), with a 20% waste buffer for seaming, pattern repeats, and swatching. The result is also shown in meters (multiply yards by 0.9144) for those using metric yarn labels commonly sold in Europe, Australia, and Asia. Understanding your personal gauge and how it affects yardage is a valuable skill that will save you money, reduce waste, and prevent the heartbreak of an unfinished project.',
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
        answer: 'The calculator handles this through the gauge adjustment automatically. Enter your actual gauge (stitches and rows per 4 inches) regardless of yarn weight. Lace-weight yarn will have a much higher stitch count per 4 inches (typically 28 to 34 stitches), resulting in a larger yardage estimate because finer yarn covers less area per yard. Bulky and super bulky yarns have lower stitch counts (10 to 16 stitches per 4 inches) and need less yardage. The base yardage assumes worsted-weight at standard gauge, but the gauge multiplier corrects for any weight you use.',
      },
      {
        question: 'Can I use this calculator for crochet projects too?',
        answer: 'Yes, the calculator works for both knitting and crochet. Simply enter your crochet gauge (stitches and rows per 4 inches in your chosen stitch pattern). Note that crochet typically uses 20 to 30 percent more yarn than knitting for the same project dimensions because crochet stitches are structurally thicker and consume more yarn per stitch. The estimates may be slightly conservative for crochet — adding an extra 10 to 15 percent to the yardage result is a good practice specifically for crochet projects.',
      },
      {
        question: 'How does the gauge adjustment factor work mathematically?',
        answer: 'The gauge adjustment is a multiplier that scales the base yardage proportionally to your personal gauge. The formula is: multiplier = (your stitches per 4 inches divided by 20) multiplied by (your rows per 4 inches divided by 24). If your gauge is tighter than the baseline (more stitches per inch), the multiplier exceeds 1 and you need more yarn. If your gauge is looser (fewer stitches per inch), the multiplier is less than 1 and you need less yarn. For example, a gauge of 22 stitches and 26 rows gives a multiplier of (22/20) × (26/24) = 1.1 × 1.083 = 1.19 — meaning you need about 19 percent more yarn than the base yardage.',
      },
      {
        question: 'What are precut fabrics and how do I account for them in my project?',
        answer: 'Precut fabrics are standardized fabric bundles used primarily in quilting. A Jelly Roll contains 40 strips of 2.5 inches by width-of-fabric (about 2.75 yards total). A Layer Cake has 42 squares of 10 by 10 inches (about 2.75 yards). A Charm Pack has 42 squares of 5 by 5 inches (about 0.75 yards). A Fat Quarter measures 18 by 22 inches (about 0.5 yards). A Fat Eighth measures 9 by 22 inches (about 0.25 yards). The calculator converts your selected precut type and quantity into equivalent yardage and subtracts it from your total need, showing whether you have enough or need additional fabric.',
      },
      {
        question: 'Why does the custom project mode add a 20 percent waste factor?',
        answer: 'The 20 percent waste factor in custom mode accounts for several real-world considerations: pattern repeat matching (especially for stripes, plaids, or directional prints), seaming and seam allowances, swatching (you should always make a gauge swatch before starting), weaving in ends, and the inevitable small errors that require ripping back and re-knitting a section. For complex cable or lace patterns, the effective waste can be even higher at 25 to 30 percent. For simple stockinette projects with no pattern matching, you might reduce it to 10 percent. The factor is built into custom mode as a reasonable default to ensure you do not run out of yarn mid-project.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Emma is knitting a medium-sized scarf in worsted-weight yarn. Her gauge swatch shows 18 stitches and 22 rows per 4 inches — she knits slightly looser than the baseline gauge of 20 st / 24 rows per 4 inches. She wants to know exactly how much yarn to buy.',
        inputs: { projectType: 'Scarf', size: 'M', yarnWeight: 'Worsted', stitchesPer4in: '18', rowsPer4in: '22' },
        result: 'Estimated 330 yards needed (base 400 adjusted by gauge factor 0.83). Equivalent to ~302 meters.',
        insight: 'Base yardage for a medium scarf is 400 yards at the standard gauge. Emma\'s looser gauge has a factor of (18/20) × (22/24) = 0.9 × 0.917 = 0.825. So 400 × 0.825 = 330 yards — she needs about 17% less yarn than the standard estimate because her looser tension covers more area per yard. She should still buy a 400-yard skein to account for swatching, pattern modifications, and dye lot matching. If she switches to a tighter gauge pattern, she should re-calculate.',
      },
      {
        scenario: 'Marcus is quilting a custom throw blanket measuring 50 inches by 60 inches with bulky yarn. He knits at a gauge of 10 stitches and 12 rows per 4 inches. He also plans to use one Jelly Roll. How much additional yarn does he need?',
        inputs: { projectType: 'Custom', customWidth: '50', customLength: '60', stitchesPer4in: '10', rowsPer4in: '12', precutType: 'Jelly Roll', precutCount: '1' },
        result: 'Estimated 480 yards needed (400 base + 20% waste). Jelly Roll provides ~3 yards. 477 additional yards needed.',
        insight: 'Custom area method: stitches per inch = 2.5, rows per inch = 3. Fabric area = (50 × 60) / (2.5 × 3) = 3,000 / 7.5 = 400 yards. With 20% waste: 400 × 1.2 = 480 yards. The Jelly Roll contributes about 2.75 yards of fabric — barely a dent in the total. Marcus needs approximately 477 additional yards. For quilting, precuts are supplemental — the main fabric comes from yardage. Marcus should buy approximately 6 yards of 44-inch wide quilting fabric as his primary material.',
      },
      {
        scenario: 'Lily is crocheting a large lace shawl using lace-weight yarn. She measured her crochet gauge at 30 stitches and 36 rows per 4 inches. The pattern suggests a large shawl needs about 900 yards in lace weight. She wants to verify the estimate.',
        inputs: { projectType: 'Shawl', size: 'L', yarnWeight: 'Lace/Fingering', stitchesPer4in: '30', rowsPer4in: '36' },
        result: 'Estimated 2,025 yards needed (base 900 adjusted by gauge factor 2.25). Equivalent to ~1,852 meters.',
        insight: 'Base yardage for a large shawl is 900 yards. Gauge factor: (30/20) × (36/24) = 1.5 × 1.5 = 2.25. Adjusted: 900 × 2.25 = 2,025 yards. This seems high, but lace-weight projects use significantly more yardage because the fine yarn covers less area. Realistically, Lily\'s tighter gauge means she needs about 2,025 yards. For crochet, she should add 15% more: 2,025 × 1.15 = 2,329 yards. Large lace shawls commonly need 1,500 to 2,400 yards. Lily should also verify her gauge after blocking, as lace opens up significantly and may change the effective gauge.',
      },
    ],
    proTips: [
      'Always make your gauge swatch larger than 4 inches by 4 inches — aim for 6 inches by 6 inches at minimum. Edge stitches have different tension, and measuring only 4 inches in the center of a 4-inch swatch gives unreliable numbers.',
      'Block your swatch before measuring gauge. Many fibers (especially wool, alpaca, and cotton) change gauge significantly after washing. A swatch that is perfect unblocked can grow 5 to 15 percent after blocking, which translates to significant yardage differences.',
      'When buying yarn for a project, buy all skeins from the same dye lot number. Dye lots are printed on the label — even the same color name can vary noticeably between lots, creating visible stripes in your finished project that cannot be fixed.',
      'For projects with multiple colors, calculate yardage for each color separately. A striped blanket with 4 colors does not use equal amounts of each — estimate each color\'s proportion of the total surface area and multiply by total yardage.',
      'The gauge adjustment assumes stockinette stitch (knitting) or single crochet. Cable patterns, lace, bobbles, and heavily textured stitches can use 30 to 50 percent more yarn than stockinette for the same dimensions — factor this in manually.',
      'Yarn is typically sold in skeins of specific yardage (e.g., 220 yards per 100g skein of worsted). Divide the calculator\'s yardage estimate by your skein\'s yardage to determine how many skeins to buy — and always round up, never down.',
    ],
    limitations: [
      'The base yardage values assume standard worsted-weight projects at 20 stitches and 24 rows per 4 inches. Heavily cabled, lace, or complex stitch patterns can require significantly more yarn — up to 50 percent more for intricate cable work. The gauge adjustment is a linear approximation; in reality, the relationship between gauge and yardage is not perfectly linear at extreme gauge differences. The 20 percent waste factor for custom projects is a general estimate — extensive pattern matching, directional prints, or frequent modifications may require 30 percent or more. This calculator estimates total yardage, not individual color requirements, so you must estimate each color\'s proportion separately when not to rely on this for multi-color projects without additional planning. Precut fabric yardage is approximate — actual usable fabric varies based on cutting and piecing efficiency within your specific design layout. The calculator does not account for yarn substitutions where a different fiber content may change the yardage requirement even at the same gauge due to differences in fiber density and elasticity.',
    ],
    quickReference: [
      { label: 'Scarf (S/M/L)', value: '300 / 400 / 500 yds — a standard 6"×60" scarf in worsted weight at baseline gauge.' },
      { label: 'Hat (S/M/L)', value: '200 / 250 / 300 yds — adult beanie or slouch hat. Most patterns need 1 skein of worsted (~220 yds).' },
      { label: 'Sweater (S/M/L)', value: '800 / 1000 / 1200 yds — adult pullover. Add 200 yds for cables, 300 yds for long sleeves.' },
      { label: 'Blanket (S/M/L)', value: '1200 / 1800 / 2400 yds — throw to full-size. Bulky yarn needs about 30% less yardage.' },
      { label: 'Shawl (S/M/L)', value: '500 / 700 / 900 yds — triangle or crescent shawl. Lace shawls often need 1000+ yds.' },
      { label: 'Jelly Roll', value: '~2.75 yds of fabric from 40 strips of 2.5"×WOF. Great for strip quilting and log cabin blocks.' },
      { label: 'Layer Cake', value: '~2.75 yds from 42 squares of 10"×10". Pre-cut convenience for patchwork quilts.' },
      { label: 'Fat Quarter', value: '~0.5 yds from 18"×22" cut. Quarter-yard cut with more usable width than a standard quarter yard.' },
    ],
    citations: [
      { source: 'Craft Yarn Council - Standard Yarn Weight System', url: 'https://www.craftyarncouncil.com/standards/yarn-weight-system' },
      { source: 'Wikipedia - Yarn Weight', url: 'https://en.wikipedia.org/wiki/Yarn_weight' },
    ],
  },
};

export default yarnYardageConfig;
