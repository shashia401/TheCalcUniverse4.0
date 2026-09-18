import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import RecipeScalerPanel from './RecipeScalerPanel';

function parseQty(value: string): number | null {
  const trimmed = value.trim();

  // Try simple fraction like "1/2"
  const simpleMatch = /^(\d+)\/(\d+)$/.exec(trimmed);
  if (simpleMatch) {
    const num = parseInt(simpleMatch[1], 10);
    const den = parseInt(simpleMatch[2], 10);
    if (den !== 0) return num / den;
  }

  // Try mixed fraction like "2 1/2"
  const mixedMatch = /^(\d+)\s+(\d+)\/(\d+)$/.exec(trimmed);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) return whole + num / den;
  }

  // Try plain number
  const num = parseFloat(trimmed);
  if (!isNaN(num)) return num;

  return null;
}

function formatQty(value: number): string {
  // If very close to a whole number, show integer
  if (Math.abs(value - Math.round(value)) < 0.001) {
    return Math.round(value).toString();
  }
  // Show up to 2 decimal places, trimming trailing zeros
  return parseFloat(value.toFixed(2)).toString();
}

interface IngredientFields {
  name: string;
  qty: string;
  unit: string;
}

function buildIngredient(prefix: string, values: Record<string, string>): IngredientFields | null {
  const name = values[`${prefix}Name`]?.trim();
  const qty = values[`${prefix}Qty`]?.trim();
  const unit = values[`${prefix}Unit`]?.trim();
  if (!name && !qty) return null;
  return { name: name || '', qty: qty || '', unit: unit || '' };
}

const unitOptions = [
  { label: 'cups', value: 'cups' },
  { label: 'ml', value: 'ml' },
  { label: 'oz', value: 'oz' },
  { label: 'tbsp', value: 'tbsp' },
  { label: 'tsp', value: 'tsp' },
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'lbs', value: 'lbs' },
];

function ingredientInputs(prefix: string, labelNum: number, required: boolean, showWhenFn?: (v: Record<string, string>) => boolean) {
  const showWhen = showWhenFn;
  return [
    {
      id: `${prefix}Name`,
      label: `Ingredient ${labelNum} Name`,
      type: 'text' as const,
      placeholder: 'e.g. Flour',
      required,
      helpText: 'Name of the ingredient',
      ...(showWhen ? { showWhen } : {}),
    },
    {
      id: `${prefix}Qty`,
      label: `Ingredient ${labelNum} Quantity`,
      type: 'text' as const,
      placeholder: 'e.g. 2 1/2',
      required,
      helpText: 'Supports fractions like 1/2 or 2 1/2',
      ...(showWhen ? { showWhen } : {}),
    },
    {
      id: `${prefix}Unit`,
      label: `Ingredient ${labelNum} Unit`,
      type: 'select' as const,
      options: unitOptions,
      required,
      helpText: 'Unit of measurement for this ingredient',
      ...(showWhen ? { showWhen } : {}),
    },
  ];
}

const recipeScalerConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'originalServings',
      label: 'Original Servings',
      type: 'number',
      min: 1,
      step: 1,
      required: true,
      inputMode: 'numeric',
      helpText: 'How many servings the original recipe makes',
    },
    {
      id: 'desiredServings',
      label: 'Desired Servings',
      type: 'number',
      min: 1,
      step: 1,
      required: true,
      inputMode: 'numeric',
      helpText: 'How many servings you want to make',
    },
    ...ingredientInputs('ingredient1', 1, true),
    ...ingredientInputs('ingredient2', 2, false, (v) => !!v.ingredient1Name),
    ...ingredientInputs('ingredient3', 3, false, (v) => !!v.ingredient2Name),
  ],
  calculate: (values) => {
    const originalServings = parseInt(values.originalServings, 10);
    const desiredServings = parseInt(values.desiredServings, 10);

    if (isNaN(originalServings) || originalServings <= 0) return [];
    if (isNaN(desiredServings) || desiredServings <= 0) return [];

    const scaleFactor = desiredServings / originalServings;

    const results: CalculatorResult[] = [
      {
        id: 'scaleFactor',
        label: 'Scale Factor',
        value: `${formatQty(scaleFactor)}x`,
        highlight: true,
        color: scaleFactor >= 1 ? 'positive' : 'neutral',
      },
    ];

    const prefixes = ['ingredient1', 'ingredient2', 'ingredient3'];
    prefixes.forEach((prefix) => {
      const ing = buildIngredient(prefix, values);
      if (!ing) return;
      const parsedQty = parseQty(ing.qty);
      if (parsedQty === null || ing.qty === '') return;

      const scaledQty = parsedQty * scaleFactor;
      const unitLabel = ing.unit ? ` ${ing.unit}` : '';
      const nameLabel = ing.name ? `${ing.name}: ` : '';

      results.push({
        id: `${prefix}-scaled`,
        label: nameLabel.trim() || `Ingredient`,
        value: `${formatQty(scaledQty)}${unitLabel}`,
        color: 'neutral',
      });
    });

    if (results.length <= 1) {
      // No ingredients were parsed
      return [
        {
          id: 'noIngredients',
          label: 'No Ingredients',
          value: 'Add at least one ingredient to see scaled quantities',
          color: 'neutral',
        },
      ];
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RecipeScalerPanel, { values, results });
  },
  educational: {
    formula: 'Scale Factor = Desired Servings / Original Servings | Scaled Qty = Original Qty x Scale Factor',
    formulaDescription:
      'The scale factor is the ratio of desired servings to original servings. Each ingredient quantity is multiplied by this factor to get the scaled amount needed. Fraction inputs like "1/2" and "2 1/2" are automatically parsed into decimal values before scaling.',
    diagram: {
      svg: '<svg viewBox="0 0 440 120" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Recipe Scaling — Multiply by Factor</text><!-- Original --><rect x="20" y="32" width="120" height="75" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-93c5fd)" stroke-width="2"/><text x="80" y="52" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-3b82f6)" font-weight="700" text-anchor="middle">Original</text><text x="80" y="66" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" text-anchor="middle">4 servings</text><line x1="35" y1="72" x2="125" y2="72" stroke="var(--svg-e2e8f0)" stroke-width="1"/><text x="80" y="84" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">2 cups flour</text><text x="80" y="96" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">1 tsp salt</text><!-- Arrow times factor --><text x="155" y="55" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-94a3b8)">→ ×</text><rect x="155" y="60" width="30" height="20" rx="4" fill="var(--svg-22c55e)"/><text x="170" y="74" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">3</text><text x="195" y="55" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-94a3b8)">→</text><!-- Scaled --><rect x="215" y="32" width="120" height="75" rx="6" fill="var(--svg-f0fdf4)" stroke="var(--svg-86efac)" stroke-width="2"/><text x="275" y="52" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-22c55e)" font-weight="700" text-anchor="middle">Scaled</text><text x="275" y="66" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" text-anchor="middle">12 servings</text><line x1="230" y1="72" x2="320" y2="72" stroke="var(--svg-e2e8f0)" stroke-width="1"/><text x="275" y="84" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">6 cups flour</text><text x="275" y="96" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">3 tsp salt</text><text x="375" y="55" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)">Scale Factor</text><text x="375" y="68" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)">= 12 ÷ 4 = 3</text></svg>',
      alt: 'Recipe scaling diagram showing original ingredients multiplied by a scale factor of 3 to get scaled quantities for more servings',
      caption: 'Scale factor = desired servings ÷ original servings. Each ingredient is multiplied by the factor to keep proportions identical.',
    },
    variables: [
      { symbol: 'Original Servings', name: 'Original Recipe Servings', description: 'The number of servings the original recipe yields.' },
      { symbol: 'Desired Servings', name: 'Target Servings', description: 'How many servings you want to make after scaling.' },
      { symbol: 'Scale Factor', name: 'Scaling Multiplier', description: 'The ratio of desired to original servings. A factor greater than 1 increases the recipe; less than 1 decreases it.' },
    ],
    quickReference: [
      { label: 'Scale Up Formula', value: 'Quantity × (Desired / Original)' },
      { label: 'Scale Down Formula', value: 'Quantity × (Desired / Original) — same formula' },
      { label: '1 cup', value: '16 tbsp = 48 tsp = 8 fl oz = 237 ml' },
      { label: '1 tbsp', value: '3 tsp = 0.5 fl oz = 15 ml' },
      { label: '1 oz (weight)', value: '28.35 g' },
      { label: '1 lb', value: '16 oz = 454 g' },
    ],
    proTips: [
      'For baking recipes, scale leavening agents (baking soda, baking powder, yeast) by only 1.5x when doubling the recipe — they do not scale linearly and over-leavening can cause baked goods to rise too quickly and collapse.',
      'When scaling down (e.g., halving a recipe), pay attention to pan sizes. A halved 9×13 cake batter fits better in an 8×8 or 9-inch round pan, and the baking time will decrease by about 15-25%.',
      'Strong spices (cayenne, cloves, cardamom) and salt should be scaled conservatively — start with 75% of the scaled amount, then taste and adjust. Doubling cayenne can make a dish inedibly hot.',
      'Eggs are tricky when scaling: for half an egg, beat a whole egg and measure out 2 tablespoons. For recipes calling for odd numbers of eggs after scaling (e.g., 4.5), round up and slightly reduce other liquids.',
      'For soups and sauces scaled up, reduce the cooking liquid by 5-10% from the calculated amount — evaporation rates do not scale linearly with volume in large pots.',
    ],
    limitations: [
      'Recipe scaling works best for ingredients that scale linearly: flour, sugar, butter, milk, and most dry goods. Leavening agents (baking powder, baking soda, yeast), strong spices, salt, and acidic ingredients (lemon juice, vinegar) often do NOT scale linearly and may need adjustment by taste or experience. The calculator handles the arithmetic — it does NOT adjust for non-linear ingredient behavior, cooking time changes (which do not scale proportionally), or pan size adjustments. For baking recipes in particular, always consult a trusted baking reference for leavening and egg adjustments, and expect to test scaled recipes at least once before serving them to guests.',
    ],
    workedExamples: [
      {
        scenario: 'Doubling a Cookie Recipe for a Bake Sale',
        inputs: {
          originalServings: '24',
          desiredServings: '48',
          ingredient1Name: 'Butter',
          ingredient1Qty: '1',
          ingredient1Unit: 'cups',
          ingredient2Name: 'Sugar',
          ingredient2Qty: '1 1/2',
          ingredient2Unit: 'cups',
          ingredient3Name: 'Vanilla Extract',
          ingredient3Qty: '2',
          ingredient3Unit: 'tsp',
        },
        result: 'Scale factor of 2x. Butter: 2 cups. Sugar: 3 cups. Vanilla Extract: 4 tsp.',
        insight:
          'With a scale factor of 2x (48 ÷ 24), each ingredient quantity doubles: 1 cup butter becomes 2 cups, 1 1/2 cups sugar becomes 3 cups, and 2 tsp vanilla becomes 4 tsp (or 1 tbsp + 1 tsp). A double batch of cookies may need to be baked in two separate trays rather than one larger tray, and the baking time stays roughly the same since the cookie size does not change. The butter and sugar scale linearly, but vanilla extract is a flavoring agent — consider adding only 3.5 tsp instead of 4 to avoid an overpowering vanilla taste.',
      },
      {
        scenario: 'Halving a Dinner Recipe for Two People',
        inputs: {
          originalServings: '6',
          desiredServings: '2',
          ingredient1Name: 'Chicken Breasts',
          ingredient1Qty: '3',
          ingredient1Unit: 'lbs',
          ingredient2Name: 'Olive Oil',
          ingredient2Qty: '3',
          ingredient2Unit: 'tbsp',
          ingredient3Name: 'Garlic Cloves',
          ingredient3Qty: '4',
          ingredient3Unit: '',
        },
        result: 'Scale factor of 0.33x. Chicken Breasts: 1 lb. Olive Oil: 1 tbsp. Garlic Cloves: 1.33.',
        insight:
          'With a scale factor of 0.33x (2 ÷ 6), the quantities become: 1 lb chicken breasts, 1 tbsp olive oil, and about 1.33 garlic cloves. Note that countable items like garlic cloves and chicken breasts are more practical to round to whole numbers — use 1 chicken breast (about 1 lb) and 2 garlic cloves (slightly more than the scaled amount since garlic mellows with cooking). The 3 tbsp oil scaling to exactly 1 tbsp is mathematically correct, but for sauteing, you may still need a minimum amount of oil to coat the pan regardless of scaling. Cooking time for smaller quantities of chicken will be slightly shorter — start checking doneness about 5 minutes earlier than the original recipe suggests.',
      },
    ],
    commonUses: [
      'Scaling a family recipe up for a large gathering or party by entering the desired number of servings',
      'Halving or quartering a recipe when cooking for fewer people without doing mental fraction math',
      'Converting ingredient quantities that use fractions (like "1/2" or "2 1/3") to accurate scaled amounts',
      'Planning meal prep by calculating exact ingredient amounts when batch-cooking a recipe',
    ],
    howToUse: [
      'Enter the number of servings the original recipe makes.',
      'Enter the number of servings you want to make.',
      'Add your ingredients: name, quantity (supports fractions like "1/2" or "2 1/2"), and unit.',
      'Add up to 3 ingredients. Only the first ingredient is required.',
      'View the scaled quantities instantly for each ingredient.',
    ],
    explanation:
      'Scaling recipes is a common kitchen challenge whether you are cooking for a crowd, halving a family recipe, or adjusting serving sizes for meal prep. The math is straightforward: divide your desired number of servings by the original number of servings to get a scale factor, then multiply each ingredient quantity by that factor. However, not all ingredients scale linearly in practice. Salt, spices, and leavening agents (baking soda, baking powder, yeast) often need careful adjustment because they affect chemical reactions in baking. Doubling the salt might make a dish inedibly salty, while doubling baking powder could cause a cake to rise too rapidly and collapse. For best results, scale aromatic spices and salt by about 1.5x when doubling a recipe instead of 2x, and adjust to taste. Liquids also require attention because evaporation rates change with larger volumes. When scaling up a soup or sauce, you may need slightly less additional liquid than the math suggests, then thin it out as needed. For scaling down, be mindful of pan sizes: halving a recipe designed for a 9x13 pan may work better in an 8x8 pan, and cooking times will likely decrease. Egg quantities can be tricky when scaling down since you cannot easily use half an egg. Beat the egg and measure out half by volume, or use a small egg as a substitute. This calculator handles the arithmetic so you can focus on cooking adjustments, but always use your judgment for ingredients that behave non-linearly when scaled.',
    faqs: [
      {
        question: 'How do I measure half of 1/3 cup?',
        answer: 'Half of 1/3 cup is 1/6 cup, or approximately 2 tablespoons plus 2 teaspoons. This calculator handles fraction arithmetic for you: enter "1/3" as the quantity and set the scale factor to 0.5, and the result will show 0.17 cups. In practice, measure 2 tablespoons plus 2 teaspoons for accuracy.',
      },
      {
        question: 'Can I scale baking recipes reliably?',
        answer: 'Baking recipes require more care when scaling because ingredient ratios affect chemical reactions. Leavening agents (baking soda, baking powder, yeast) often do not scale linearly. A good rule of thumb is to scale leavening agents by 1.5x when doubling, rather than 2x. Eggs can be scaled by volume (beat an egg and measure the needed fraction). Flour and sugar scale more reliably linearly than leavening agents.',
      },
      {
        question: 'What about cooking time when scaling?',
        answer: 'Cooking time does not scale proportionally with ingredient quantity. A doubled batch of soup may take only 20% longer to reach a boil. A larger casserole will need more oven time because heat penetrates a thicker mass more slowly. Use visual doneness cues (internal temperature, texture, color) rather than simply multiplying the original cooking time. Always start checking doneness at the original recipe time and add time as needed.',
      },
      {
        question: 'How do I handle irregular ingredient sizes (e.g., onions, chicken breasts)?',
        answer: 'Countable ingredients like chicken breasts, bell peppers, or eggs scale by count rather than by volume or weight. If a recipe calls for 2 chicken breasts for 4 servings and you need 8 servings, simply use 4 chicken breasts. For aromatic vegetables (onions, garlic), rounding to the nearest whole unit and adjusting other flavors to taste is more practical than using partial amounts.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Recipe', url: 'https://en.wikipedia.org/wiki/Recipe' },
      { source: 'Wolfram MathWorld', title: 'Ratio', url: 'https://mathworld.wolfram.com/Ratio.html' },
    ],
  },
};

export default recipeScalerConfig;
