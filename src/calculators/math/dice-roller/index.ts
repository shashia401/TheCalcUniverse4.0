import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DicePanel from './DicePanel';
import { randomInt, type RandomU32 } from '../../../utils/random';
import { parseNumberStrict } from '../../../utils/parseNumber';

/** Allowed die sizes (the select below offers exactly these). */
const SIDES = [4, 6, 8, 10, 12, 20, 100];

/**
 * Roll `count` dice of `sides` faces with crypto.getRandomValues() and rejection sampling
 * (src/utils/random.ts), so every face is exactly equally likely: `x % sides` over 2^32 values is biased for
 * every size here except D4 and D8 (2^32 is not divisible by 6, 10, 12, 20 or 100).
 * `source` is injectable so tests can supply a deterministic stream.
 */
export function rollDice(count: number, sides: number, source?: RandomU32): number[] {
  return Array.from({ length: count }, () => randomInt(1, sides, source));
}

function formatModifier(modifier: number): string {
  if (modifier === 0) return '+0';
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}

const diceRollerConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'count',
      label: 'Number of Dice',
      type: 'number',
      inputMode: 'numeric',
      min: 1,
      max: 10,
      step: 1,
      placeholder: '2',
      required: true,
    },
    {
      id: 'sides',
      label: 'Number of Sides',
      type: 'select',
      options: [
        { label: 'D4', value: '4' },
        { label: 'D6', value: '6' },
        { label: 'D8', value: '8' },
        { label: 'D10', value: '10' },
        { label: 'D12', value: '12' },
        { label: 'D20', value: '20' },
        { label: 'D100 (percentile)', value: '100' },
      ],
      required: true,
    },
    {
      id: 'modifier',
      label: 'Modifier (+/-)',
      type: 'number',
      inputMode: 'numeric',
      min: -20,
      max: 20,
      step: 1,
      placeholder: '0',
      helpText: 'Add or subtract a flat number (e.g., +5 for D&D proficiency)',
    },
  ],

  calculate: (values) => {
    // Strict integers: parseInt("2.5") used to roll 2 dice silently, and parseInt("3abc") rolled 3.
    const count = parseNumberStrict(values.count);
    const sides = (values.sides ?? '').trim() === '' ? 6 : parseNumberStrict(values.sides);
    const modifier = (values.modifier ?? '').trim() === '' ? 0 : parseNumberStrict(values.modifier);

    if (!Number.isInteger(count) || count < 1 || count > 100) return [];
    if (!SIDES.includes(sides)) return [];
    if (!Number.isInteger(modifier) || Math.abs(modifier) > 1000) return [];

    const rolls = rollDice(count, sides);

    const rawSum = rolls.reduce((a, b) => a + b, 0);
    const total = rawSum + modifier;

    return [
      {
        id: 'total',
        label: 'Total',
        value: String(total),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'rolls',
        label: 'Individual Rolls',
        value: rolls.join(', '),
      },
      {
        id: '_rollData',
        label: 'Roll Data',
        value: JSON.stringify(rolls),
      },
      {
        id: '_sides',
        label: 'Die Sides',
        value: String(sides),
      },
      {
        id: 'count',
        label: 'Dice',
        value: `D${sides} × ${count}`,
      },
      {
        id: 'modifier',
        label: 'Modifier',
        value: formatModifier(modifier),
      },
      {
        id: 'average',
        label: 'Average Roll',
        // Per-die average of the raw rolls, not diluted by the flat modifier
        // (the modifier is added once to the total, not per die).
        value: (rawSum / count).toFixed(1),
      },
      {
        id: 'expected',
        label: 'Expected Total (N × (S + 1) / 2 + modifier)',
        value: String((count * (sides + 1)) / 2 + modifier),
      },
      {
        id: 'totalRange',
        label: 'Possible Total Range',
        value: `${count + modifier} to ${count * sides + modifier}`,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DicePanel, { values, results });
  },

  educational: {
    formula: 'Total = Σ(roll₁, roll₂, …, rollₙ) + modifier',
    formulaDescription:
      'Each die roll is a uniformly distributed random integer between 1 and the number of sides. The total is the sum of all individual rolls, plus any flat modifier (bonus or penalty). Dice notation is commonly written as NdS+M, where N = number of dice, S = sides per die, and M = modifier. For example, 2D6+3 means roll two six-sided dice, sum them, and add 3. The average result is N × (S+1)/2 + M.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">2D6 Probability Distribution</text><rect x="20" y="159" width="15" height="21" rx="1" fill="var(--svg-3b82f6)" opacity="0.7"/><rect x="37" y="138" width="15" height="42" rx="1" fill="var(--svg-3b82f6)" opacity="0.7"/><rect x="54" y="117" width="15" height="63" rx="1" fill="var(--svg-3b82f6)" opacity="0.7"/><rect x="71" y="96" width="15" height="84" rx="1" fill="var(--svg-3b82f6)" opacity="0.8"/><rect x="88" y="75" width="15" height="105" rx="1" fill="var(--svg-3b82f6)" opacity="0.9"/><rect x="105" y="54" width="15" height="126" rx="1" fill="var(--svg-3b82f6)"/><rect x="122" y="75" width="15" height="105" rx="1" fill="var(--svg-3b82f6)" opacity="0.9"/><rect x="139" y="96" width="15" height="84" rx="1" fill="var(--svg-3b82f6)" opacity="0.8"/><rect x="156" y="117" width="15" height="63" rx="1" fill="var(--svg-3b82f6)" opacity="0.7"/><rect x="173" y="138" width="15" height="42" rx="1" fill="var(--svg-3b82f6)" opacity="0.7"/><rect x="190" y="159" width="15" height="21" rx="1" fill="var(--svg-3b82f6)" opacity="0.7"/><line x1="20" y1="180" x2="210" y2="180" stroke="var(--svg-cccccc)" stroke-width="1"/><text x="27" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">2</text><text x="44" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">3</text><text x="61" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">4</text><text x="78" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">5</text><text x="95" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">6</text><text x="112" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">7</text><text x="129" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">8</text><text x="146" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">9</text><text x="163" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">10</text><text x="180" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">11</text><text x="197" y="192" text-anchor="middle" font-size="8" fill="var(--svg-888888)">12</text><rect x="225" y="30" width="85" height="62" rx="4" fill="var(--svg-f0f9ff)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="267" y="46" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-333333)">Key Facts</text><text x="229" y="60" font-size="8" fill="var(--svg-555555)">Range: 2-12</text><text x="229" y="73" font-size="8" fill="var(--svg-555555)">Average: 7.0</text><text x="229" y="86" font-size="8" fill="var(--svg-555555)">Most likely: 7 (1/6)</text></svg>',
      alt: 'Bar chart showing the probability distribution of 2D6 dice rolls forming a bell curve',
      caption: 'Rolling two six-sided dice creates a triangular distribution where 7 is the most likely outcome (1-in-6 chance).',
    },
    variables: [
      {
        symbol: 'N, S',
        name: 'Dice Count & Sides',
        description: 'N dice, each with S sides (D4, D6, D8, D10, D12, D20). More dice produce a tighter bell curve around the average.',
      },
      {
        symbol: 'M',
        name: 'Modifier',
        description: 'A flat bonus (positive) or penalty (negative) added to the total after summing all dice. In D&D, this often represents ability score modifiers or proficiency bonuses.',
      },
      {
        symbol: 'AVG',
        name: 'Average Result',
        description: 'The expected value: N × (S + 1) / 2 + M. For a single D6, average is 3.5. For 2D6, average is 7. For 2D6+3, average is 10.',
      },
    ],
    howToUse: [
      'Choose how many dice to roll (1 to 10 dice per roll).',
      'Select the die type from the dropdown: D4, D6, D8, D10, D12, D20 or D100.',
      'Optionally add a modifier (e.g., +5 for a proficiency bonus, or -2 for a penalty).',
      'Click calculate to see individual die results, the total sum, and the average expected value.',
      'The dice are displayed visually — pip patterns for D6 and numeric faces for other dice types.',
    ],
    explanation:
      'Dice rolling is fundamental to tabletop role-playing games (TTRPGs) like Dungeons & Dragons, as well as board games, war games, and probability simulations. Each die produces a uniformly distributed random integer. For a fair S-sided die, every face has a 1/S probability of appearing. The sum of multiple dice approximates a normal distribution due to the Central Limit Theorem — the more dice you roll, the more the results cluster around the average in a bell curve shape. The average roll of a single die is (S + 1) / 2, so 2D6 averages 7, and 2D6+3 averages 10. All rolls use crypto.getRandomValues() for cryptographically secure randomness with rejection sampling (no modulo bias), which is superior to the default Math.random() for gaming applications where fair results matter.',
    workedExamples: [
      {
        scenario: "During a D&D campaign in Chicago, DM Kevin's player attacks with a +1 longsword. The attack roll is 1D20+5 (Strength +3, proficiency +2). The damage is 1D8+3 on a hit. What are the expected values for both rolls?",
        inputs: { count: '1', sides: '20', modifier: '5' },
        result: '1D20+5 (average: 15.5)',
        insight: 'Attack roll expected value: (20+1)/2 + 5 = 10.5 + 5 = 15.5 average. With this modifier, the player hits AC 15 roughly 55% of the time (needs a 10+ on the D20). Damage roll (1D8+3): average (8+1)/2 + 3 = 4.5 + 3 = 7.5 damage per hit. Over a 4-round combat at 55% hit rate, expected total damage is about 16.5 HP.',
      },
      {
        scenario: "Yuki is playing a board game in Tokyo where she needs to roll 3D6 to determine her character's attribute scores. She wants to know the most likely outcome and the probability of rolling a 10 or higher.",
        inputs: { count: '3', sides: '6', modifier: '0' },
        result: '3D6 (average: 10.5)',
        insight: '3D6 range: 3-18. Average: 3 × 3.5 = 10.5. The distribution is a bell curve centered at 10-11. Probability of 10+: approximately 62.5%. Probability of 18 (all sixes): (1/6)³ = 1/216 ≈ 0.46%. This is why many TTRPG character generation systems use 3D6 — it produces reliably average scores with rare extremes.',
      },
      {
        scenario: "Carlos is game-mastering a sci-fi TTRPG in Madrid. An enemy sniper fires with disadvantage (roll 2D20, take lowest) and needs a 15 to hit the players' ship. What are the odds?",
        inputs: { count: '2', sides: '20', modifier: '0' },
        result: '2D20 (average: 21)',
        insight: 'With disadvantage, the sniper must roll 15+ on BOTH D20s. Probability of 15+ on one D20 = 30% (6/20). Probability on both = 0.30 × 0.30 = 9%. With advantage, the chance would be 1 − (0.70 × 0.70) = 51%. This illustrates why advantage/disadvantage is mathematically equivalent to roughly ±5 on the roll (the "5e advantage rule of thumb").',
      },
    ],
    faqs: [
      {
        question: 'What does dice notation like "2D6+3" mean?',
        answer: '2D6+3 means "roll two 6-sided dice, sum them together, then add 3 to the total." The number before the D is the count of dice, the number after is how many sides each die has, and anything after + or - is a flat modifier applied to the total. Common D&D examples: 1D20+5 for an attack roll, 2D6 for a greatsword damage, 8D6 for a Level 3 Fireball spell. This notation was popularized by Dungeons & Dragons in 1974 and is now the universal standard for TTRPGs.',
      },
      {
        question: 'Is this randomness truly random?',
        answer: 'This calculator uses crypto.getRandomValues(), a cryptographically secure pseudo-random number generator (CSPRNG) available in all modern browsers. It is far better than Math.random() for gaming purposes and is suitable even for security-sensitive applications. While technically still pseudo-random (not quantum-random), it is practically indistinguishable from true randomness for all tabletop gaming and educational probability purposes.',
      },
      {
        question: 'What is a D20 used for?',
        answer: 'The D20 (20-sided die) is the primary die used in Dungeons & Dragons 5th Edition for attack rolls, saving throws, and ability checks. A natural 20 (rolling a 20) is traditionally a critical success that automatically hits and often deals double damage. A natural 1 is a critical failure or fumble. Each face has exactly a 5% (1/20) chance of appearing on any given roll. The D20 system creates a flat probability curve where every outcome is equally likely, unlike multi-dice systems.',
      },
      {
        question: 'Why use multiple dice instead of one big die?',
        answer: 'Multiple dice produce a bell-curve (normal) distribution where middle values are far more likely than extremes. Rolling 2D6 gives results from 2 to 12, but a 7 is six times more likely than a 2 or a 12 (1/6 vs 1/36). A single die produces a flat (uniform) distribution where every outcome is equally likely. Game designers use bell curves for skill checks where reliable, consistent results are desired, and flat distributions for random tables, loot generation, or critical confirmation where unpredictability adds excitement.',
      },
      {
        question: 'What is advantage and disadvantage in D&D 5e?',
        answer: 'Advantage means rolling two D20s and taking the higher result — this significantly increases your chance of success. Disadvantage means rolling two D20s and taking the lower result. With advantage, the chance of rolling a natural 20 increases from 5% to 9.75%, and the average result rises from 10.5 to 13.825. With disadvantage, the average drops to 7.175. A common rule of thumb is that advantage/disadvantage is mathematically equivalent to roughly a ±5 modifier for middle-range target numbers, though the exact effect depends on the target DC.',
      },
      {
        question: 'How does the Central Limit Theorem apply to dice?',
        answer: 'The Central Limit Theorem (CLT) states that the sum of many independent random variables tends toward a normal (bell curve) distribution, regardless of the individual distributions. For dice: roll 1 die and the distribution is flat (uniform). Roll 2 dice and it becomes triangular. Roll 3+ dice and it rapidly approaches a bell curve. By 10 dice, the result is very close to a normal distribution centered at N × (S+1)/2. This is why casino craps uses 2D6 (the triangular distribution at 7 peaks at 16.67%) and why 3D6 ability score generation produces predictable, balanced characters.',
      },
    ],
    proTips: [
      'For D&D 5e players: the "take 10" rule for passive checks means assuming a D20 roll of 10. Add your modifier to 10 for your passive score. This is mathematically the average result of a D20 roll (10.5 rounded down).',
      'When designing a TTRPG system, use 2D6 or 3D6 for skill checks (bell curve rewards consistent skill) and D20 for combat (flat curve makes every bonus matter equally). The difference in feel is significant — players notice the reliability of bell-curve systems.',
      'A CSPRNG (crypto.getRandomValues) is designed so that its output cannot be told apart from true randomness, whereas Math.random() makes no such guarantee. Combined with rejection sampling there is no modulo bias either. For any human-scale game session both are fine, but this is the safer choice when fairness matters.',
      'Expected value quick reference: 1D4=2.5, 1D6=3.5, 1D8=4.5, 1D10=5.5, 1D12=6.5, 1D20=10.5. To find the average of any NdS, multiply N by (S+1)/2 and add the modifier.',
      'For D&D DMs balancing encounters: a creatures average damage per round = (average die roll + modifier) multiplied by (chance to hit). Use 1D20+modifier vs AC to calculate hit chance: (21 + modifier - AC) / 20, clamped to 0.05-0.95.',
    ],
    limitations: [
      'Supported dice types & unsupported mechanics: Supports 1-10 dice of types D4, D6, D8, D10, D12, D20 and D100. Does not support dice pools with success counting (e.g., Vampire: The Masquerade or Shadowrun systems), exploding dice (where max rolls are re-rolled and added), Fudge/Fate dice (with +/blank/− faces), or keeping highest/lowest N dice (advantage/disadvantage can be simulated by rolling twice).',
      'Custom/advanced dice limitations: Does not support custom-sided dice (D3, D30) or dice with faces beyond the standard polyhedral set. D100 is a single 100-sided roll (1 to 100), not a pair of ten-sided dice.',
      'Randomness technical limitation: Uses crypto.getRandomValues() with rejection sampling: 32-bit random values at or above the largest multiple of the die size are discarded and redrawn, so every face is exactly equally likely (a plain "x mod sides" over 2³² values would slightly favour low faces on D6, D10, D12, D20 and D100, because 2³² is not divisible by those sizes). The generator is not certified for all use cases.',
      'When not to use: Do not use for cryptographic key generation (crypto.getRandomValues is qualified for randomness but key generation has additional requirements), for legal gambling (requires certified hardware RNG in most jurisdictions), or for game systems requiring specialized dice mechanics beyond simple NdS+M.',
    ],
    quickReference: [
      { label: 'Dice Notation', value: 'NdS+M (e.g., 2D6+3)' },
      { label: 'Expected Value', value: 'N × (S+1)/2 + M' },
      { label: 'D20 Average', value: '10.5 per die' },
      { label: 'D6 Average', value: '3.5 per die' },
      { label: '2D6 Most Likely', value: '7 (probability 1/6)' },
      { label: 'Advantage Avg', value: '13.825 (vs 10.5 normal)' },
      { label: 'Disadvantage Avg', value: '7.175 (vs 10.5 normal)' },
      { label: 'Critical Hit (nat 20)', value: '5% per roll (1/20)' },
    ],
    citations: [
      { source: 'Wikipedia - Dice', url: 'https://en.wikipedia.org/wiki/Dice' },
      { source: 'Wolfram MathWorld - Dice', url: 'https://mathworld.wolfram.com/Dice.html' },
      { source: 'D&D 5e SRD - Advantage & Disadvantage', url: 'https://5e.d20srd.org/' },
    ],
  },
};

export default diceRollerConfig;
