import { createElement } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS = [
  { value: 'ml', label: 'Milliliter (mL)', shortLabel: 'mL', factor: 1 },
  { value: 'l', label: 'Liter (L)', shortLabel: 'L', factor: 1000 },
  { value: 'tsp', label: 'Teaspoon (tsp)', shortLabel: 'tsp', factor: 4.92892 },
  { value: 'tbsp', label: 'Tablespoon (tbsp)', shortLabel: 'tbsp', factor: 14.7868 },
  { value: 'floz', label: 'Fluid Ounce (fl oz)', shortLabel: 'fl oz', factor: 29.5735 },
  { value: 'cup', label: 'US Cup', shortLabel: 'cup', factor: 236.588 },
  { value: 'pt', label: 'US Pint (pt)', shortLabel: 'pt', factor: 473.176 },
  { value: 'qt', label: 'US Quart (qt)', shortLabel: 'qt', factor: 946.353 },
  { value: 'gal', label: 'US Gallon (gal)', shortLabel: 'gal', factor: 3785.41 },
  { value: 'gram', label: 'Gram (g) - water equivalent', shortLabel: 'g', factor: 1 },
  { value: 'oz_weight', label: 'Ounce (oz) - water equivalent', shortLabel: 'oz', factor: 28.3495 },
  { value: 'lb_weight', label: 'Pound (lb) - water equivalent', shortLabel: 'lb', factor: 453.592 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Cooking measurement conversion uses linear scaling factors relative to milliliters (mL). Volume-to-volume conversions are exact. Volume-to-weight conversions assume the ingredient has the same density as water (1 g/mL), which is NOT accurate for most ingredients — see limitations below. For accurate baking, use a kitchen scale.',
  formulaSource: 'The US customary cooking units (cup, tablespoon, teaspoon, fluid ounce) were legally defined in the US by the Metric Conversion Act of 1975 and the FDA Nutrition Labeling regulations. 1 US fluid ounce = 29.5735295625 mL, based on 1 US gallon = 231 in³ exactly, and 1 in = 2.54 cm. The US cup for nutrition labeling is exactly 240 mL (a slight simplification for nutrition facts), while the US customary cup (used in recipes) is exactly 8 US fl oz = 236.5882365 mL. The tablespoon is derived as 1/2 fl oz = 14.78676478125 mL. UK imperial cooking measures differ: 1 UK fl oz = 28.4130625 mL, 1 UK cup = 284.130625 mL (10 UK fl oz), 1 UK pint = 568.26125 mL (20 UK fl oz). This calculator uses US customary units.',
  variables: [
    { symbol: 'cup', name: 'US Cup (Customary)', description: 'The standard US cooking volume: 1 cup = 236.588 mL = 8 fl oz = 16 tbsp = 48 tsp. All standard US cookbooks and recipes use this cup. Not to be confused with the FDA "nutrition labeling cup" of exactly 240 mL or the UK cup of 284 mL.' },
    { symbol: 'tbsp', name: 'US Tablespoon', description: '1 tablespoon = 14.787 mL = 3 teaspoons = 0.5 fl oz. The standard unit for both liquid ingredients (oil, vanilla extract) and dry ingredients (sugar, cocoa powder) in US recipes. 16 tbsp = 1 cup.' },
    { symbol: 'tsp', name: 'US Teaspoon', description: '1 teaspoon = 4.929 mL = 1/3 tablespoon = 1/48 cup. Used for small quantities: spices, baking soda, baking powder, salt, vanilla extract. Historically based on the volume of a typical teaspoon, but now precisely defined by law.' },
    { symbol: 'fl oz', name: 'US Fluid Ounce', description: '1 fl oz = 29.574 mL = 2 tbsp = 6 tsp = 1/8 cup. A volume measure for liquids only — NOT the same as a weight ounce (oz). 1 fl oz of water weighs about 1.04 oz (weight), illustrating the volume-weight distinction.' },
    { symbol: 'mL', name: 'Milliliter', description: '1 mL = 1/1,000 of a liter = 1 cm³. The metric standard for liquid measurement worldwide. 1 mL of water = 1 g of water at 4°C (this exact equivalence is the basis for volume-to-weight water estimates).' },
  ],
  howToUse: [
    'Enter the measurement value you want to convert (e.g., 2 for 2 cups, or 500 for 500 mL).',
    'Select the current measurement unit from the "From" dropdown — volume units (cup, tbsp, tsp, mL, L, fl oz, pt, qt, gal) or weight units for water equivalent (g, oz, lb).',
    'Select the desired measurement unit from the "To" dropdown.',
    'The converted value appears instantly. Volume-to-weight conversions shown are for WATER ONLY. For accurate weight of flour, sugar, butter, or other ingredients, use a kitchen scale or ingredient-specific chart.',
  ],
  quickReference: [
    { label: '1 cup', value: '236.6 mL / 8 fl oz / 16 tbsp / 48 tsp' },
    { label: '1 tbsp', value: '14.79 mL / 3 tsp / 0.5 fl oz' },
    { label: '1 tsp', value: '4.93 mL / 1/3 tbsp / ~1.67 fl dram' },
    { label: '1 fl oz', value: '29.57 mL / 2 tbsp / 0.125 cup' },
    { label: '1 pt', value: '473.2 mL / 2 cups / 16 fl oz' },
    { label: '1 qt', value: '946.4 mL / 4 cups / 2 pt / 32 fl oz' },
    { label: '1 gal', value: '3.785 L = 3,785 mL / 16 cups / 8 pt / 4 qt / 128 fl oz' },
    { label: '1 L', value: '4.227 cups / 33.814 fl oz / 1,000 mL' },
    { label: 'Water: 1 cup', value: '236.6 g / 8.345 oz (weight) / 0.522 lb' },
    { label: 'Water: 1 tbsp', value: '14.79 g / 0.522 oz (weight)' },
    { label: 'All-purpose flour: 1 cup', value: '~120 g (spooned & leveled) / ~4.25 oz' },
    { label: 'Granulated sugar: 1 cup', value: '~200 g / ~7.05 oz' },
    { label: 'Butter: 1 cup (2 sticks)', value: '~227 g / 8 oz (weight) / 0.5 lb' },
  ],
  commonUses: [
    'Baking: accurately measuring flour, sugar, butter, and liquids in cups, tablespoons, grams, or milliliters — baking is chemistry and demands precision',
    'Recipe scaling: adjusting a recipe from 4 servings to 8 or from 12 muffins to 36 — multiply all measurements by the scaling factor using this converter',
    'International cooking: converting between US customary (cups, tbsp, tsp) and metric (mL, L, grams) when following recipes from different countries',
    'Meal prep: scaling ingredient quantities for weekly meal preparation — a recipe for 2 scaled to 10 requires multiplying all measures',
    'Nutrition tracking: converting recipe ingredient volumes to standardized weights for calorie and macronutrient calculation',
    'Canning and preserving: calculating precise liquid-to-solid ratios for safe water bath and pressure canning — insufficient acidity due to mismeasured vinegar can cause spoilage',
    'Bartending: converting between fluid ounces, milliliters, and jiggers (1 jigger = 1.5 fl oz = 44.4 mL) for cocktail recipes from international sources',
  ],
  workedExamples: [
    {
      scenario: 'A home baker in Canada finds a French pastry recipe calling for 250 g of all-purpose flour, 125 g of butter, and 100 mL of milk. Their measuring tools are US cups and tablespoons. How much of each ingredient should they measure?',
      inputs: { value: '250', from: 'gram', to: 'cup' },
      result: 'Flour: 250 g ÷ 120 g/cup ≈ 2.08 cups (using flour-specific density, NOT water equivalent which would give 1.06 cups — dangerously wrong). Butter: 125 g ÷ 227 g/cup ≈ 0.55 cups ≈ 1 stick + 1 tbsp. Milk: 100 mL ≈ 0.42 cups ≈ 3.4 fl oz ≈ 6.8 tbsp.',
      insight: 'This example illustrates exactly why the water-equivalent weight feature MUST be used with caution. Flour, sugar, and butter each have different densities. The water-equivalent grams-to-cups conversion is only accurate for WATER and water-like liquids (milk, stock, juice). For dry ingredients, use an ingredient-specific chart or — much better — invest in a $15 digital kitchen scale and use the original weight measurements directly.',
    },
    {
      scenario: 'A meal-prep enthusiast wants to scale a chili recipe from 4 servings to 15 servings for a party. The recipe calls for 2 cups of diced tomatoes, 1.5 tbsp of chili powder, 2 tsp of cumin, and 3 cups of broth. Calculate the scaled quantities in both volume and metric.',
      inputs: { value: '2', from: 'cup', to: 'ml' },
      result: 'Scaling factor: 15 ÷ 4 = 3.75. Tomatoes: 2 cups × 3.75 = 7.5 cups = 1,774 mL (~1.8 L). Chili powder: 1.5 tbsp × 3.75 = 5.625 tbsp ≈ 5 tbsp + 2 tsp = 83.2 mL. Cumin: 2 tsp × 3.75 = 7.5 tsp = 2.5 tbsp. Broth: 3 cups × 3.75 = 11.25 cups = 2,662 mL (~2.7 L). Requires large stockpot of at least 8-quart capacity.',
      insight: 'When scaling recipes, not everything scales linearly. Spices (especially hot spices like cayenne) should be scaled more conservatively — try 75% of the linear factor and adjust to taste. Salt scales at about 80% of the linear factor. Cooking time does NOT scale linearly: a larger volume of chili may need only 20-30% more time, not 375% more. Use surface area considerations for evaporation: a wider pot evaporates more, potentially concentrating flavors and requiring liquid adjustment.',
    },
    {
      scenario: 'A cocktail enthusiast in London is following a US cocktail recipe that calls for 2 fl oz of bourbon, 0.75 fl oz of simple syrup, and 0.5 fl oz of lemon juice. Their jigger measures in mL (25 mL and 50 mL sides). Convert the recipe to mL and suggest jigger measurements.',
      inputs: { value: '2', from: 'floz', to: 'ml' },
      result: 'Bourbon: 2 fl oz × 29.574 = 59.1 mL (use one 50 mL jigger + one 10 mL pour, or round to 60 mL). Simple syrup: 0.75 fl oz = 22.2 mL (fill 25 mL jigger to ~90%). Lemon juice: 0.5 fl oz = 14.8 mL (about one tablespoon). Total cocktail volume: 3.25 fl oz = 96 mL — fits standard 90-120 mL cocktail glass.',
      insight: 'UK cocktail bars have largely metricated, with 25 mL and 50 mL being the standard jigger measures (the 1984 Weights and Measures Act mandated metric for licensed premises). A "single" in the UK is 25 mL while a "double" is 50 mL. In the US, a standard pour is 1.5 fl oz (44 mL). So a UK bartender making a US recipe needs to decide: follow the US spec precisely (59 mL bourbon) or adapt to UK standard measures (50 mL bourbon for a slightly lighter drink). Most craft bars now stock dual-unit jiggers showing both mL and fl oz.',
    },
  ],
  proTips: [
    'For baking: ALWAYS weigh flour, sugar, and cocoa powder — never use cups. A cup of flour varies from 110 g (scooped and shaken) to 160 g (dipped and packed) — a 45% difference that will ruin a cake. Buy a $15 digital scale. Professional pastry chefs have been weighing ingredients for decades for this reason.',
    'The "dip and sweep" method for flour gives about 140-150 g/cup. The "spoon and level" method gives about 120-125 g/cup. The difference is 20-25% — enough to turn flaky pie crust into tough cardboard. Pick one method and be consistent, or (better) use weight. Most US cookbook authors use the spoon-and-level method unless otherwise specified.',
    'Brown sugar is packed: "1 cup packed brown sugar" means press it firmly into the cup until it holds its shape when turned out. Packed brown sugar is about 220 g/cup versus 160 g/cup loose — a 38% difference. Unlike flour, brown sugar recipes expect the packed measurement.',
    'For liquid ingredients: use a clear liquid measuring cup (Pyrex) on a flat surface, read at eye level from the bottom of the meniscus. Do NOT use dry measuring cups for liquids — they are designed to be filled to the brim and leveled, making them impractical for liquids that would spill during transport to the mixing bowl.',
    'Butter in the US is conveniently marked: 1 stick = 8 tbsp = 1/2 cup = 4 oz (weight) = 113 g. The wrapper has tablespoon markings, so you can cut precisely without measuring spoons. European butter is sold in 250 g blocks without markings — use a scale or the displacement method (water displacement in a measuring cup).',
    'When a recipe says "1 cup of chopped nuts" or "1 cup of sliced strawberries," the volume changes dramatically based on how finely they are chopped. Finely chopped nuts pack tighter (more nuts per cup) than coarsely chopped. Slice strawberries and they settle differently from whole. For these "volume of irregular solids" measures, weight is vastly more consistent: "200 g strawberries, sliced" is unambiguous.',
    'For honey, molasses, corn syrup, and other sticky liquids: spray the measuring cup or spoon with nonstick cooking spray first, or lightly oil it. The sticky ingredient will slide right out, giving you the full measure instead of leaving a coating behind. This trick works for both US cups and mL measures.',
  ],
  limitations: [
    'CRITICAL: Volume-to-weight conversions (cups to grams, tablespoons to ounces) in this calculator use WATER DENSITY (1 g/mL). Flour is ~0.5-0.6 g/mL, sugar is ~0.85 g/mL, honey is ~1.4 g/mL. Using the water-equivalent weight for dry ingredients will give WRONG results for baking. The gram and ounce weight units are provided for water and water-like liquids (milk, broth, juice, vinegar). For dry ingredients, always use a kitchen scale.',
    'This calculator uses US customary units (1 cup = 236.588 mL). UK/imperial units differ significantly: UK tablespoon = 17.76 mL (vs US 14.79 mL), UK cup = 284.1 mL (vs US 236.6 mL), UK pint = 568.3 mL (vs US 473.2 mL), UK gallon = 4.546 L (vs US 3.785 L). A recipe from a British cookbook using "cups" may mean the imperial cup. Australian tablespoons are 20 mL (4 teaspoons), different from both US and UK. Always verify which measuring system a recipe uses.',
    'Temperature matters for volume: water is densest at 4°C (1.000 g/mL) and expands with heating. At boiling (100°C), water density drops to 0.958 g/mL — a 4.2% difference. Room-temperature water (20°C) is 0.998 g/mL. For most cooking purposes, treating mL = g for water is close enough, but for precision canning or candy making, temperature matters.',
    'Altitude affects boiling points but not volume conversion. At 5,000 ft (1,524 m), water boils at 95°C (203°F) instead of 100°C. This does not affect measurement conversion, but it does affect recipe outcomes — cakes rise differently, liquids evaporate faster, and sugar stages change. Measurement conversion is the same at all altitudes, but recipe instructions (baking time, temperature) may need adjustment.',
    'Recipe scaling is not always linear. Doubling a recipe works for most baked goods, but for delicate items (souffles, meringues, some custards), structural integrity may fail at larger volumes. Spices should be scaled at 50-75% of the linear factor when tripling or more — they concentrate during cooking. Salt should be scaled at about 80% — you can always add more, but you cannot remove it.',
  ],
  diagram: {
    svg: '<svg viewBox="0 0 480 170" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">US Cooking Measurement Relationships</text>' +
      '<rect x="20" y="35" width="200" height="22" rx="3" fill="var(--svg-3b82f6)" opacity="0.5"/>' +
      '<text x="120" y="50" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 Cup = 8 fl oz = 236.6 mL</text>' +
      '<rect x="20" y="65" width="200" height="18" rx="2" fill="var(--svg-ef4444)" opacity="0.4"/>' +
      '<text x="120" y="78" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">= 16 tablespoons (3 tsp = 1 tbsp)</text>' +
      '<rect x="20" y="90" width="200" height="18" rx="2" fill="var(--svg-22c55e)" opacity="0.4"/>' +
      '<text x="120" y="103" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">= 48 teaspoons</text>' +
      '<rect x="240" y="35" width="100" height="22" rx="3" fill="var(--svg-8b5cf6)" opacity="0.4"/>' +
      '<text x="290" y="50" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 pint = 2 cups</text>' +
      '<rect x="240" y="65" width="100" height="22" rx="3" fill="var(--svg-f59e0b)" opacity="0.4"/>' +
      '<text x="290" y="80" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 quart = 4 cups</text>' +
      '<rect x="240" y="95" width="100" height="22" rx="3" fill="var(--svg-ec4899)" opacity="0.4"/>' +
      '<text x="290" y="110" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 gallon = 16 cups</text>' +
      '<text x="240" y="150" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">All relationships shown are for US customary units. UK/imperial differ.</text>' +
      '</svg>',
    alt: 'Diagram showing US cooking measurement hierarchy: cups contain tablespoons, which contain teaspoons. Pints, quarts, and gallons are larger units.',
    caption: 'US cooking measurement hierarchy. All standard American recipes use these exact legal relationships.',
  },
  explanation:
    'Cooking measurements sit at the intersection of volume, weight, and culinary tradition. The US customary system — cups, tablespoons, teaspoons, and fluid ounces — dominates American recipes, while the rest of the world uses milliliters and grams. This dual system creates constant conversion needs for anyone cooking from international sources. The US cup was legally standardized at exactly 8 US fluid ounces (236.5882365 mL), derived from the US gallon (231 cubic inches) and the international inch (exactly 2.54 cm since 1959). The UK, by contrast, used imperial measures — the imperial cup of 284.1 mL (10 imperial fl oz) was common in older British cookbooks, though modern UK recipes predominantly use metric. Australia uses an even more divergent tablespoon of 20 mL (4 tsp), while both the US and UK use 3-teaspoon tablespoons (14.79 mL and 17.76 mL respectively). The volume-to-weight problem is the most critical concept in cooking measurement: a cup of flour weighs 120-150 g depending on how it is measured, a cup of sugar weighs 200 g, a cup of honey weighs 340 g, and a cup of water weighs 237 g. This converter provides water-equivalent weight conversions because water density (1 g/mL at 4°C) is the only universal constant — every other ingredient varies. Professional bakers and pastry chefs overwhelmingly prefer weight measurements (grams) because weight is consistent regardless of how an ingredient is scooped, sifted, or packed. A $15 digital kitchen scale is the single best investment for anyone serious about baking — it eliminates the 30-40% variability inherent in volume measurements of dry ingredients. For everyday cooking (soups, stews, sautes), volume measurements are perfectly adequate because precise ratios are less critical. But for baking, where the flour-to-liquid ratio determines gluten development, crumb structure, and rise, precision matters enormously.',
  faqs: [
    {
      question: 'Why is volume-to-weight conversion different for every ingredient?',
      answer: 'Each ingredient has a different density (mass per unit volume). Water has a density of 1 g/mL by definition — this is how the gram was originally defined. All-purpose flour has a density of about 0.5-0.6 g/mL (fills space with air pockets). Granulated sugar is about 0.85 g/mL (crystals pack more efficiently). Butter is about 0.96 g/mL (slightly less dense than water). Honey and maple syrup are about 1.4 g/mL (denser than water). Brown sugar (packed) is about 0.9 g/mL. Cocoa powder is about 0.4 g/mL. This means 1 cup of each ingredient has a dramatically different weight: water = 237 g, flour = ~120 g, sugar = 200 g, honey = 340 g, butter = 227 g, cocoa = ~95 g. For accurate baking, memorize the weights of your commonly used ingredients or (much easier) use a kitchen scale and a recipe that already gives weights in grams.',
    },
    {
      question: 'What are the differences between US, UK, and Australian cooking measurements?',
      answer: 'The differences are substantial and can ruin a recipe if ignored. US cup = 236.6 mL, UK/imperial cup = 284.1 mL (10 UK fl oz) — 20% larger! US tablespoon = 14.79 mL, UK tablespoon = 17.76 mL (20% larger), Australian tablespoon = 20.0 mL (4 tsp — 35% larger than US). US teaspoon = 4.93 mL, UK teaspoon = 5.92 mL (though modern UK uses 5 mL metric). UK fluid ounce = 28.41 mL vs US fl oz = 29.57 mL. UK pint = 568.3 mL (20 UK fl oz) vs US pint = 473.2 mL (16 US fl oz) — UK pint is 20% larger. UK gallon = 4.546 L vs US gallon = 3.785 L. Rule of thumb: modern UK recipes almost always use metric (mL, g), so the imperial differences rarely matter. Australian recipes use metric cups (250 mL) and tablespoons (20 mL). Canadian recipes use a mix — older ones use imperial, newer ones use metric. When in doubt, look at the recipe\'s country of origin and the units it uses — a UK recipe from 1970 saying "1 pint of milk" means 568 mL, not 473 mL.',
    },
    {
      question: 'Why do professional bakers insist on weight measurements?',
      answer: 'Weight measurements (grams) are accurate, consistent, and reproducible across anyone, anywhere, under any conditions. A cup of flour can vary by 30-45% depending on: how you scoop it (dip vs spoon), humidity (flour absorbs moisture), how settled the flour is (a new bag vs a bag that has been jostled in shipping), and the brand (protein content affects density). By contrast, 250 g of flour is always exactly 250 g of flour, whether you measure it in Arizona (dry) or Florida (humid), whether you scoop it or spoon it, whether it is fresh from the mill or has sat for months. Professional kitchens standardized on weight measurements decades ago because consistency is their business model — the croissant you eat today should taste identical to the one you ate last month. Most digital kitchen scales cost under $20, have a tare function (zero out the bowl), and switch between grams and ounces. They are also faster than measuring cups: dump ingredients into one bowl on a scale, hitting tare between each.',
    },
    {
      question: 'How do I convert pan sizes and adjust baking times?',
      answer: 'Pan volume conversion is based on area (not diameter directly): a 9×13 inch rectangular pan = 117 in², while a 9-inch round pan = 63.6 in². To scale a recipe between pans, calculate the area ratio. For round pans, area = π × r². A 9-inch round (r=4.5) has area = 63.6 in². An 8-inch round (r=4) has area = 50.3 in². A 10-inch round (r=5) has area = 78.5 in². For baking time: deeper batters need longer at lower temperatures, shallower batters cook faster at higher temperatures. Thumb rules: if you double the batter depth, increase time by 30-50% and reduce temperature by 14°C (25°F). If you halve the batter depth, reduce time by 25% and increase temperature by 14°C (25°F). Fill pans about 2/3 full — batter rises. Cupcake/muffin tins: standard cups hold about 60 mL (1/4 cup) of batter each and bake in 18-22 minutes at 175°C (350°F).',
    },
    {
      question: 'What is a "pinch," "dash," and "smidgen" in real measurements?',
      answer: 'These traditional informal measures have approximate modern equivalents. A pinch = the amount you can pick up between thumb and forefinger ≈ 1/16 teaspoon (about 0.3 mL). A dash = usually about 1/8 teaspoon (about 0.6 mL) for dry spices, though for liquid measures (like bitters in cocktails), a dash is about 1/32 fl oz or 0.9 mL from a standard dasher bottle. A smidgen = roughly 1/32 teaspoon (about 0.15 mL), smaller than a pinch. A tad = 1/4 teaspoon. You can buy measuring spoon sets that include "pinch," "dash," "smidgen," and "tad" — they are novelty items, but they are fun. In practice, these tiny measures are used for potent ingredients (cayenne, cloves, nutmeg) where precision matters less and personal taste matters more. For baking powder, baking soda, and salt — where chemical reactions depend on exact amounts — always use proper measuring spoons, never "a pinch."',
    },
    {
      question: 'How do I measure sticky ingredients like honey, molasses, or peanut butter by volume?',
      answer: 'Sticky ingredients are notoriously difficult to measure accurately by volume because a significant portion sticks to the measuring tool. Solutions: (1) Spray the measuring cup or spoon with nonstick cooking spray before measuring — the ingredient slides right out. (2) Lightly oil the measuring tool with a neutral oil. (3) For recipes that already include oil, measure the oil first, then use the same (now oiled) cup for honey — this is the oldest kitchen trick and works perfectly. (4) For peanut butter and other nut butters, line the measuring cup with plastic wrap, press the nut butter in, then lift out the wrap — zero waste. (5) Best solution for sticky ingredients: use a scale. Put the mixing bowl on the scale, tare it, and add honey directly by weight (1 tbsp honey ≈ 21 g). No measuring cup to clean, 100% of the ingredient in the bowl.',
    },
  ],
  citations: [
    { source: 'King Arthur Baking - Ingredient Weight Chart', url: 'https://www.kingarthurbaking.com/learn/ingredient-weight-chart' },
    { source: 'NIST - Cooking Measurement Standards and Conversions', url: 'https://www.nist.gov/pml/owm/cooking-measurements' },

  ],
};

const inputs = [
  {
    id: 'value',
    label: 'Value to Convert',
    type: 'number' as const,
    placeholder: 'Enter measurement (e.g., 2)',
    inputMode: 'numeric' as const,
    required: true,
    helpText: 'The numeric cooking measurement value to convert between units',
  },
  {
    id: 'from',
    label: 'From Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: 'cup',
    helpText: 'The cooking unit you are converting from (e.g., cups, tbsp, mL)',
  },
  {
    id: 'to',
    label: 'To Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: 'ml',
    showWhen: (values: Record<string, string>) => !!values.value,
    helpText: 'The cooking unit you are converting to (weight conversions are water-equivalent only)',
  },
];

const calculate = (values: Record<string, string>) => {
  if (!values || Object.keys(values).length === 0) return [];
  if (values.value === undefined || values.value === null || values.value.trim() === '') return [];
  const val = parseFloat(values.value);
  if (isNaN(val) || !isFinite(val)) return [];

  const fromUnit = values.from || 'cup';
  const toUnit = values.to || 'ml';

  const fromDef = UNITS.find((u) => u.value === fromUnit);
  const toDef = UNITS.find((u) => u.value === toUnit);
  if (!fromDef || !toDef) return [];
  if (toDef.factor === 0) return [];

  const result = (val * fromDef.factor) / toDef.factor;

  return [
    {
      id: 'result',
      label: `Result (${fromUnit} → ${toUnit})`,
      value: `${val} ${fromUnit} = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toUnit}`,
      highlight: true,
      color: 'positive' as const,
    },
    {
      id: 'formula',
      label: 'Formula',
      value: `${val} × (${fromDef.factor} ÷ ${toDef.factor}) = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
      color: 'neutral' as const,
    },
  ];
};

const configWithPanel = {
  inputs,
  calculate,
  educational: EDUCATIONAL,
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Cooking Conversion' });
  },
};
export default configWithPanel;
