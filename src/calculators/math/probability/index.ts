import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import ProbabilityPanel from './ProbabilityPanel';
import Decimal from 'decimal.js';

// Decimal.js ensures precision when computing joint probabilities (products)
// and complementary probabilities (1 - p) for values near 0 or 1 where
// native IEEE 754 double-precision can lose significant digits.

const probabilityConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'pa',
      label: 'P(A) — Probability of Event A',
      type: 'number',
      placeholder: '0.5',
      step: 0.01,
      min: 0,
      max: 1,
      inputMode: 'decimal',
      required: true,
      helpText: 'Enter a value between 0 and 1 (e.g., 0.5 = 50% chance). 0 means impossible, 1 means certain.',
    },
    {
      id: 'pb',
      label: 'P(B) — Probability of Event B',
      type: 'number',
      placeholder: '0.3',
      step: 0.01,
      min: 0,
      max: 1,
      inputMode: 'decimal',
      required: true,
      helpText: 'Enter a value between 0 and 1 (e.g., 0.3 = 30% chance). 0 means impossible, 1 means certain.',
    },
    {
      id: 'type',
      label: 'Event Relationship',
      type: 'select',
      required: true,
      options: [
        { label: 'Independent Events', value: 'Independent' },
        { label: 'Mutually Exclusive Events', value: 'Mutually Exclusive' },
      ],
    },
  ],
  calculate: (values) => {
    const pa = parseFloat(values.pa);
    const pb = parseFloat(values.pb);
    const eventType = values.type || 'Independent';

    // Validate: must be valid numbers between 0 and 1
    if (isNaN(pa) || isNaN(pb)) return [];
    if (pa < 0 || pa > 1 || pb < 0 || pb > 1) return [];

    const isMutuallyExclusive = eventType === 'Mutually Exclusive';

    // P(A and B) — use Decimal for precision when needed
    let pAndB: number;
    if (isMutuallyExclusive) {
      pAndB = 0;
    } else {
      // Use Decimal for high-precision multiplication of close-to-zero probabilities
      try {
        pAndB = new Decimal(pa).mul(pb).toNumber();
      } catch {
        pAndB = pa * pb;
      }
    }

    // P(A or B)
    const exceedsOne = isMutuallyExclusive && pa + pb > 1;
    let pOrB: number;
    if (isMutuallyExclusive) {
      pOrB = Math.min(pa + pb, 1);
    } else {
      // P(A or B) = P(A) + P(B) - P(A and B)
      pOrB = pa + pb - pAndB;
    }

    // P(not A)
    const pNotA = 1 - pa;

    // P(not B)
    const pNotB = 1 - pb;

    // P(A|B) — conditional probability
    let pAGivenB: number;
    if (isMutuallyExclusive) {
      pAGivenB = 0; // If B occurs, A cannot occur (mutually exclusive)
    } else if (pb === 0) {
      pAGivenB = 0; // Cannot condition on an impossible event
    } else {
      // For independent events, P(A|B) = P(A)
      // In general, P(A|B) = P(A∩B) / P(B) = (P(A) × P(B)) / P(B) = P(A)
      pAGivenB = pa;
    }

    // P(B|A) — conditional probability of B given A
    let pBGivenA: number;
    if (isMutuallyExclusive) {
      pBGivenA = 0;
    } else if (pa === 0) {
      pBGivenA = 0;
    } else {
      pBGivenA = pb; // For independent: P(B|A) = P(B)
    }

    const fmt = (n: number) => {
      return parseFloat(n.toFixed(8)).toString();
    };

    const pct = (n: number) => {
      return (n * 100).toFixed(1) + '%';
    };

    const results: CalculatorResult[] = [
      {
        id: 'pa',
        label: 'P(A)',
        value: fmt(pa),
        color: 'neutral',
      },
      {
        id: 'pb',
        label: 'P(B)',
        value: fmt(pb),
        color: 'neutral',
      },
      {
        id: 'pAndB',
        label: 'P(A ∩ B) — Probability of A and B',
        value: fmt(pAndB),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'pOrB',
        label: 'P(A ∪ B) — Probability of A or B',
        value: fmt(pOrB),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'pNotA',
        label: 'P(¬A) — Probability of Not A',
        value: fmt(pNotA),
        color: 'neutral',
      },
      {
        id: 'pNotB',
        label: 'P(¬B) — Probability of Not B',
        value: fmt(pNotB),
        color: 'neutral',
      },
      {
        id: 'pAGivenB',
        label: 'P(A|B) — Conditional Probability of A given B',
        value: fmt(pAGivenB),
        color: 'positive',
      },
      {
        id: 'pBGivenA',
        label: 'P(B|A) — Conditional Probability of B given A',
        value: fmt(pBGivenA),
        color: 'positive',
      },
      {
        id: 'paPct',
        label: 'P(A) as %',
        value: pct(pa),
        color: 'neutral',
      },
      {
        id: 'pbPct',
        label: 'P(B) as %',
        value: pct(pb),
        color: 'neutral',
      },
      {
        id: 'eventType',
        label: 'Event Type',
        value: eventType,
        color: 'neutral',
      },
    ];

    if (exceedsOne) {
      results.push({
        id: 'warning',
        label: 'Warning: Mutually exclusive events',
        value: `P(A) + P(B) = ${(pa + pb).toFixed(4)} exceeds 1. These events cannot sum to more than 100% probability. The union probability has been capped at 1.`,
        color: 'negative',
      });
    }

    return results;
  },
  educational: {
    formula: 'P(A∪B) = P(A) + P(B) − P(A∩B)  |  P(A|B) = P(A∩B) ÷ P(B)  |  P(¬A) = 1 − P(A)',
    diagram: {
      svg: '<svg viewBox="0 0 440 370" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Venn Diagram: Event Probability</text><ellipse cx="170" cy="155" rx="100" ry="90" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><text x="120" y="140" text-anchor="middle" font-size="22" font-weight="bold" fill="var(--svg-3b82f6)">A</text><ellipse cx="270" cy="155" rx="100" ry="90" fill="var(--svg-22c55e)" fill-opacity=".15" stroke="var(--svg-22c55e)" stroke-width="2.5"/><text x="320" y="140" text-anchor="middle" font-size="22" font-weight="bold" fill="var(--svg-22c55e)">B</text><text x="220" y="158" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">A&#8745;B</text><text x="130" y="100" text-anchor="middle" font-size="11" fill="var(--svg-555555)">P(A only)</text><text x="310" y="100" text-anchor="middle" font-size="11" fill="var(--svg-555555)">P(B only)</text><text x="220" y="250" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Key Rules</text><text x="220" y="273" text-anchor="middle" font-size="12" fill="var(--svg-555555)">Addition Rule: P(A&cup;B) = P(A) + P(B) &minus; P(A&cap;B)</text><text x="220" y="295" text-anchor="middle" font-size="12" fill="var(--svg-555555)">Conditional: P(A|B) = P(A&cap;B) / P(B)</text><text x="220" y="317" text-anchor="middle" font-size="12" fill="var(--svg-555555)">Independent: P(A&cap;B) = P(A) &times; P(B)</text><text x="220" y="339" text-anchor="middle" font-size="12" fill="var(--svg-555555)">Mutually Exclusive: P(A&cap;B) = 0</text><text x="220" y="361" text-anchor="middle" font-size="12" fill="var(--svg-555555)">Complement: P(&not;A) = 1 &minus; P(A)</text></svg>',
      alt: 'Venn diagram with two overlapping circles labeled A and B, showing the intersection region and the union of both circles, with key probability formulas annotated below',
      caption: 'Venn diagrams visualize sample spaces: the overlap is the intersection A∩B, the total shaded area is the union A∪B',
    },
    formulaDescription:
      'Probability quantifies the likelihood of events occurring on a scale from 0 (impossible) to 1 (certain). The addition rule finds the probability of A OR B happening — subtract the overlap P(A∩B) to avoid double-counting. Conditional probability P(A|B) measures how the occurrence of B updates the likelihood of A. For independent events (like coin flips), P(A∩B) = P(A) × P(B) — knowing one outcome tells you nothing about the other. For mutually exclusive events (like drawing a heart vs. a spade from one card), P(A∩B) = 0 — they cannot happen together. These rules form the axiomatic foundation of probability theory as formalized by Andrey Kolmogorov in 1933.',
    variables: [
      { symbol: 'P(A)', name: 'Probability of A', description: 'The likelihood of event A occurring, ranging from 0 (impossible) to 1 (certain). Represented as a decimal (0.5) or percentage (50%).' },
      { symbol: 'P(B)', name: 'Probability of B', description: 'The likelihood of event B occurring, ranging from 0 to 1.' },
      { symbol: 'P(A∩B)', name: 'Joint Probability', description: 'The probability that both A and B occur simultaneously. For independent events: P(A) × P(B). For mutually exclusive events: 0 (they cannot both happen).' },
      { symbol: 'P(A∪B)', name: 'Union Probability', description: 'The probability that A OR B (or both) occur. Uses the addition rule: P(A) + P(B) − P(A∩B) to avoid double-counting the overlap.' },
      { symbol: 'P(A|B)', name: 'Conditional Probability', description: 'The probability of A occurring given that B has already occurred. For independent events equals P(A). For mutually exclusive equals 0. This is the foundation of Bayes\' theorem.' },
      { symbol: 'P(¬A)', name: 'Complement', description: 'The probability that A does NOT occur. Always equals 1 − P(A). All probabilities of an event and its complement must sum to 1.' },
    ],
    howToUse: [
      'Enter P(A), the probability of event A as a decimal (0 to 1). For example, a 60% chance is entered as 0.6. The calculator also shows the percentage equivalent.',
      'Enter P(B), the probability of event B, also as a decimal between 0 and 1.',
      'Select whether the events are Independent (do not affect each other, like two coin flips) or Mutually Exclusive (cannot happen together, like rolling a 1 and a 6 on a single die).',
      'Review all computed probabilities: P(A∩B), P(A∪B), P(¬A), P(¬B), P(A|B), and P(B|A). Each is displayed as both a decimal and a percentage.',
      'If mutually exclusive events sum to more than 1, a warning appears — this is mathematically impossible for a proper probability distribution.',
    ],
    explanation:
      'Probability theory is the foundation of statistics, data science, risk assessment, machine learning, and decision-making under uncertainty. Two fundamental concepts govern how events interact: independence and mutual exclusivity. Independent events have no influence on each other — flipping a coin twice yields independent outcomes; knowing the first flip was heads tells you nothing about the second. Mutually exclusive events cannot happen simultaneously — drawing a single card cannot be both a heart and a spade. The addition rule P(A∪B) = P(A) + P(B) − P(A∩B) is one of the most important formulas in probability; the subtraction of P(A∩B) corrects for double-counting the overlap region where both events occur. Conditional probability P(A|B) measures how the occurrence of B updates our belief about A — this is the foundation of Bayes\' theorem, which underlies modern spam filters, medical diagnosis, recommendation systems, and the entire field of Bayesian statistics. The complement rule P(¬A) = 1 − P(A) is deceptively simple but incredibly powerful: sometimes it is much easier to calculate the probability of something NOT happening and subtract from 1. These concepts are essential in medical testing (sensitivity, specificity, false positive rates), quality control (defect probabilities in manufacturing), financial risk modeling (value at risk, default probabilities), weather forecasting (probability of precipitation), A/B testing (statistical significance of experimental results), and game theory (optimal strategies in poker, blackjack, and other games of chance).',
    commonUses: [
      'Medical testing and diagnosis: understanding false positive rates, sensitivity, and specificity — P(disease | positive test) is the key question patients and doctors need answered',
      'Weather forecasting: "30% chance of rain" means P(rain) = 0.3 based on ensemble model outputs; insurance companies use these probabilities to price premiums',
      'Quality control and manufacturing: calculating the probability of a defective product in a batch using binomial probability models',
      'A/B testing in web development: computing the probability that variant B outperforms variant A, and deciding whether the difference is statistically significant',
      'Game design and gambling: calculating expected value for casino games, loot box drop rates, and balancing game mechanics around probability distributions',
      'Risk assessment: insurance underwriting uses probabilities of adverse events (accidents, natural disasters, mortality) to set premiums that ensure profitability across a large pool',
      'Genetics: Punnett squares use probability rules to predict offspring genotypes — the probability of inheriting a recessive trait from two carrier parents is 1/4 (independent assortment)',
    ],
    workedExamples: [
      {
        scenario: 'A startup runs two independent marketing campaigns. Campaign A (email) has a 35% chance of converting a lead; Campaign B (social media) has a 50% chance. What is the probability that a lead exposed to BOTH campaigns converts through at least one? (Assume the conversion events are independent.)',
        inputs: { pa: '0.35', pb: '0.50', type: 'Independent' },
        result: 'P(A∩B) = 0.175 (17.5%), P(A∪B) = 0.675 (67.5%). There is a 67.5% chance the lead converts through at least one campaign.',
        insight: 'P(A∩B) = 0.35 × 0.50 = 0.175 (17.5% chance both convert). P(A∪B) = 0.35 + 0.50 − 0.175 = 0.675. There is a 67.5% chance the lead converts through at least one campaign. This is higher than either alone, which is why multi-channel marketing works. However, note that P(A∪B) is NOT 0.35 + 0.50 = 0.85 — that would double-count the 17.5% of leads that convert through both. The subtraction of the overlap is essential.',
      },
      {
        scenario: 'A cardiologist evaluates a patient with two risk factors that are mutually exclusive: either the patient has Condition X (15% probability based on demographics) OR Condition Y (25% probability). Since the conditions cannot coexist (mutually exclusive), what is the probability the patient has either condition?',
        inputs: { pa: '0.15', pb: '0.25', type: 'Mutually Exclusive' },
        result: 'P(A∩B) = 0, P(A∪B) = 0.40 (40%). P(¬(A∪B)) = 0.60 (60% chance of neither condition).',
        insight: 'P(A∩B) = 0 (mutually exclusive — a patient cannot have both conditions). P(A∪B) = 0.15 + 0.25 = 0.40. There is a 40% chance the patient has either condition, and a 60% chance they have neither. The complement P(¬(A∪B)) = 1 − 0.40 = 0.60 is the probability of being disease-free, which is critical for patient communication: "There is a 60% chance your tests will come back completely normal."',
      },
      {
        scenario: 'A security system has two independent sensors. Sensor A detects intrusions with 90% reliability; Sensor B with 85% reliability. For a real intrusion, what is the probability AT LEAST ONE sensor detects it? What is the probability BOTH miss it?',
        inputs: { pa: '0.90', pb: '0.85', type: 'Independent' },
        result: 'P(both detect) = 0.765 (76.5%), P(at least one) = 0.985 (98.5%), P(both miss) = (1−0.90)×(1−0.85) = 0.015 (1.5%). Redundant sensors dramatically improve reliability.',
        insight: 'P(both detect) = 0.90 × 0.85 = 0.765 (76.5%). P(at least one detects) = 0.90 + 0.85 − 0.765 = 0.985 (98.5%). P(both miss) = P(¬A) × P(¬B) = (1 − 0.90) × (1 − 0.85) = 0.10 × 0.15 = 0.015 (1.5%). This is why redundant safety systems are so effective: the probability of both failing is the PRODUCT of their individual failure rates, which becomes tiny. A 1.5% miss rate is far better than either sensor alone (10% or 15%).',
      },
    ],
    proTips: [
      'The complement rule is your best friend: P(at least one) = 1 − P(none). Instead of adding P(exactly 1) + P(exactly 2) + ..., just compute 1 − P(zero successes). This simplifies many problems dramatically.',
      'For independent events, P(A|B) = P(A) — the conditional probability equals the unconditional probability. If someone tells you "given that B happened, A is 50% likely," and P(A) was already 50%, then the events are independent.',
      'When you see "at least one" in a probability problem, immediately think "1 minus the probability of none." This pattern appears in the Birthday Problem, system reliability, and many exam questions.',
      'Mutually exclusive and independent are NOT the same. In fact, mutually exclusive events with non-zero probability CANNOT be independent — because if one occurs, the other\'s probability drops to 0 (not its original value).',
    ],
    limitations: [
      'This calculator computes probabilities for exactly two events under the assumptions of independence or mutual exclusivity — it does not handle dependent events with a specified conditional probability.',
      'For events with unknown dependency structure, the results will be incorrect — you must know whether events are independent or mutually exclusive.',
      'For conditional probability problems where P(A|B) is known but different from P(A), use a different tool for dependent events.',
      'For continuous probability distributions (normal, exponential, etc.) this calculator works with discrete event probabilities, not continuous random variables.',
      'For sequential events where probabilities change after each trial (drawing cards without replacement), use hypergeometric or conditional probability chains.',
    ],
    quickReference: [
      { label: 'Complement Rule', value: 'P(¬A) = 1 − P(A)' },
      { label: 'Addition Rule (general)', value: 'P(A∪B) = P(A) + P(B) − P(A∩B)' },
      { label: 'Multiplication Rule (ind.)', value: 'P(A∩B) = P(A) × P(B)' },
      { label: 'Conditional Probability', value: 'P(A|B) = P(A∩B) / P(B)' },
      { label: 'Bayes\' Theorem', value: 'P(A|B) = P(B|A)·P(A) / P(B)' },
      { label: 'Mutually Exclusive', value: 'P(A∩B) = 0, cannot happen together' },
      { label: 'Probability Range', value: '0 ≤ P(A) ≤ 1 (0% to 100%)' },
      { label: 'Total Probability', value: 'P(A) + P(¬A) = 1' },
    ],
    faqs: [
      {
        question: 'What is the difference between independent and mutually exclusive events?',
        answer: 'Independent events do not affect each other\'s probability — flipping a coin and rolling a die are independent because the coin result does not change the die odds. Mutually exclusive events cannot happen at the same time — drawing one card cannot be both a heart and a spade. The key difference: independent events have P(A∩B) = P(A) × P(B), while mutually exclusive events have P(A∩B) = 0. Notably, mutually exclusive events with non-zero probability CANNOT be independent — if A occurs, B cannot, so P(B|A) = 0 ≠ P(B).',
      },
      {
        question: 'What does conditional probability P(A|B) mean in everyday terms?',
        answer: 'Conditional probability P(A|B) answers: "Given that B happened, how likely is A now?" For example, the probability of having a disease (A) given a positive test result (B) is a conditional probability. This is fundamentally different from the unconditional probability P(A) of having the disease in the general population. Bayes\' theorem mathematically relates P(A|B) to P(B|A) and is how email spam filters learn to classify messages (P(spam | contains "lottery")), how medical tests are interpreted (P(disease | positive test)), and how recommendation systems predict what you will like next.',
      },
      {
        question: 'What is the law of large numbers and why does it matter?',
        answer: 'The law of large numbers states that as you repeat a random experiment more times, the average result gets closer to the expected value. A coin flipped 10 times might show 70% heads, but after 10,000 flips it will be very close to 50%. This is why casinos always win in the long run despite individual gamblers hitting jackpots — the house edge, even a small 2-5%, compounds across millions of bets. It is also why large sample sizes give more reliable statistical results and why insurance companies can predict aggregate claims accurately even though individual claims are unpredictable.',
      },
      {
        question: 'What does P(A∩B) mean visually in a Venn diagram?',
        answer: 'P(A∩B) — the joint probability of A and B — is the overlapping region where two circles intersect in a Venn diagram. The left circle represents all outcomes where A occurs, the right circle represents all where B occurs, and the overlap is where both A and B occur simultaneously. The size of this overlap relative to the total diagram area (which equals 1, or 100%) represents the probability. If the circles do not touch at all, P(A∩B) = 0 (mutually exclusive). If one circle is entirely inside the other, P(A∩B) = P(the smaller event) — the smaller event is a subset of the larger.',
      },
      {
        question: 'How do I use the complement rule to simplify hard problems?',
        answer: 'The complement rule P(¬A) = 1 − P(A) is one of the most powerful shortcuts in probability. The classic example: "What is the probability that in a room of 23 people, at least two share a birthday?" It is much easier to compute the complement — the probability that NO two people share a birthday — and subtract from 1. P(no shared birthday) = (365/365) × (364/365) × (363/365) × ... × (343/365) ≈ 0.493. Therefore, P(at least one shared birthday) ≈ 1 − 0.493 = 0.507 (greater than 50%!). Always ask yourself: "Is it easier to compute the probability of the opposite event?"',
      },
      {
        question: 'Why does P(A∪B) subtract P(A∩B) instead of just adding?',
        answer: 'The addition rule subtracts P(A∩B) to correct for double-counting. When you add P(A) and P(B), the overlapping region (where both A and B occur) gets counted twice — once as part of A and once as part of B. By subtracting P(A∩B) once, you ensure the overlap is counted exactly once. Think of a Venn diagram: if you shade all of circle A and all of circle B, the lens-shaped overlap gets two layers of shading. The subtraction removes one layer, leaving the total shaded area (the union) correctly shaded. If events are mutually exclusive (P(A∩B)=0), no subtraction is needed because there is no overlap to double-count.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld - Probability', url: 'https://mathworld.wolfram.com/Probability.html' },
      { source: 'Wikipedia - Probability', url: 'https://en.wikipedia.org/wiki/Probability' },
      { source: 'Khan Academy - Probability', url: 'https://www.khanacademy.org/math/statistics-probability/probability-library' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ProbabilityPanel, { values, results });
  },
};

export default probabilityConfig;
