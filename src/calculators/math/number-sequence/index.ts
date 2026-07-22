import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import NumberSequencePanel from './NumberSequencePanel';

interface SequenceResult {
  type: 'Arithmetic' | 'Geometric' | 'Fibonacci' | 'Unknown';
  terms: number[];
  commonDifference?: number;
  commonRatio?: number;
  nthTermFormula: string;
  nextTerms: number[];
  steps: string[];
}

function identifySequence(terms: number[]): SequenceResult {
  const steps: string[] = [];
  const n = terms.length;

  if (n < 3) {
    return {
      type: 'Unknown',
      terms,
      nthTermFormula: 'Need at least 3 terms to identify a sequence pattern.',
      nextTerms: [],
      steps: ['Need at least 3 terms to determine the sequence type.'],
    };
  }

  // Check for Fibonacci (need at least 4 terms to confirm)
  let isFibonacci = n >= 4;
  for (let i = 2; i < n; i++) {
    if (terms[i] !== terms[i - 1] + terms[i - 2]) {
      isFibonacci = false;
      break;
    }
  }
  if (isFibonacci && n >= 3) {
    steps.push('Checking differences: each term is the sum of the two preceding terms.');
    steps.push(`${terms[n - 2]} + ${terms[n - 3]} = ${terms[n - 1]}, confirming Fibonacci pattern.`);

    const nextTerms: number[] = [];
    let a = terms[n - 2], b = terms[n - 1];
    for (let i = 0; i < 5; i++) {
      const next = a + b;
      nextTerms.push(next);
      a = b;
      b = next;
    }

    return {
      type: 'Fibonacci',
      terms,
      nthTermFormula: `F(n) = F(n-1) + F(n-2), where F(1) = ${terms[0]}, F(2) = ${terms[1]}`,
      nextTerms,
      steps,
    };
  }

  // Check for Arithmetic
  const diff1 = terms[1] - terms[0];
  let isArithmetic = true;
  for (let i = 1; i < n; i++) {
    if (terms[i] - terms[i - 1] !== diff1) {
      isArithmetic = false;
      break;
    }
  }
  if (isArithmetic) {
    steps.push(`Common difference d = ${terms[1]} − ${terms[0]} = ${diff1}`);
    steps.push(`Verified: all consecutive differences equal ${diff1}.`);
    steps.push(`nth-term formula: a(n) = ${terms[0]} + (n-1) × ${diff1}`);

    const nextTerms: number[] = [];
    let last = terms[n - 1];
    for (let i = 0; i < 5; i++) {
      last += diff1;
      nextTerms.push(last);
    }

    const firstTerm = terms[0];
    const d = diff1;
    const formula = `a(n) = ${firstTerm}${d >= 0 ? '+' : ''}${d}(n-1) = ${d === 0 ? firstTerm : d === 1 ? 'n' + (firstTerm !== 1 ? `+${firstTerm - 1}` : '') : `${d}n${firstTerm - d >= 0 ? '+' : ''}${firstTerm - d !== 0 ? firstTerm - d : ''}`}`;

    return {
      type: 'Arithmetic',
      terms,
      commonDifference: diff1,
      nthTermFormula: formula,
      nextTerms,
      steps,
    };
  }

  // Check for Geometric
  const ratio1 = terms[1] / terms[0];
  let isGeometric = true;
  for (let i = 1; i < n; i++) {
    if (terms[i] / terms[i - 1] !== ratio1) {
      isGeometric = false;
      break;
    }
  }
  if (isGeometric) {
    steps.push(`Common ratio r = ${terms[1]} ÷ ${terms[0]} = ${ratio1}`);
    steps.push(`Verified: all consecutive ratios equal ${ratio1}.`);
    steps.push(`nth-term formula: a(n) = ${terms[0]} × ${ratio1}^(n-1)`);

    const nextTerms: number[] = [];
    let last = terms[n - 1];
    for (let i = 0; i < 5; i++) {
      last *= ratio1;
      nextTerms.push(last);
    }

    return {
      type: 'Geometric',
      terms,
      commonRatio: ratio1,
      nthTermFormula: `a(n) = ${terms[0]} × ${ratio1}^(n-1)`,
      nextTerms,
      steps,
    };
  }

  return {
    type: 'Unknown',
    terms,
    nthTermFormula: 'The sequence does not follow a simple arithmetic, geometric, or Fibonacci pattern.',
    nextTerms: [],
    steps: ['No consistent arithmetic difference, geometric ratio, or Fibonacci pattern detected.'],
  };
}

const numberSequenceConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sequence',
      label: 'Enter Sequence',
      type: 'text',
      placeholder: '2, 4, 6, 8, 10',
      required: true,
      helpText: 'Enter comma-separated numbers (at least 3 terms)',
    },
    {
      id: 'nextCount',
      label: 'How many next terms?',
      type: 'number',
      placeholder: '5',
      step: 1,
      required: true,
      helpText: 'Number of additional terms to compute',
    },
  ],
  calculate: (values) => {
    const raw = values.sequence || '';
    const nextCount = Math.min(Math.max(parseInt(values.nextCount) || 5, 1), 20);
    const terms = raw.split(',').map(t => parseFloat(t.trim())).filter(t => !isNaN(t));

    if (terms.length < 2) return [];

    const result = identifySequence(terms);
    const fmt = (n: number) => {
      if (Number.isInteger(n)) return n.toString();
      return n.toFixed(4).replace(/\.?0+$/, '');
    };

    // Generate requested number of next terms
    let nextTerms = result.nextTerms;
    if (result.type === 'Arithmetic' && result.commonDifference !== undefined) {
      nextTerms = [];
      let last = terms[terms.length - 1];
      for (let i = 0; i < nextCount; i++) {
        last += result.commonDifference;
        nextTerms.push(last);
      }
    } else if (result.type === 'Geometric' && result.commonRatio !== undefined) {
      nextTerms = [];
      let last = terms[terms.length - 1];
      for (let i = 0; i < nextCount; i++) {
        last *= result.commonRatio;
        nextTerms.push(last);
      }
    } else if (result.type === 'Fibonacci') {
      nextTerms = [];
      let a = terms[terms.length - 2], b = terms[terms.length - 1];
      for (let i = 0; i < nextCount; i++) {
        const next = a + b;
        nextTerms.push(next);
        a = b;
        b = next;
      }
    }

    return [
      {
        id: 'sequenceType',
        label: 'Sequence Type',
        value: result.type,
        highlight: true,
        color: result.type === 'Unknown' ? 'negative' : 'positive',
      },
      {
        id: 'nthTerm',
        label: 'nth-Term Formula',
        value: result.nthTermFormula,
        color: 'neutral',
      },
      {
        id: 'nextTerms',
        label: `Next ${nextTerms.length} Term(s)`,
        value: nextTerms.map(t => fmt(t)).join(', '),
        color: 'neutral',
      },
      ...(result.commonDifference !== undefined ? [{
        id: 'commonDifference' as const,
        label: 'Common Difference (d)',
        value: fmt(result.commonDifference),
        color: 'neutral' as const,
      }] : []),
      ...(result.commonRatio !== undefined ? [{
        id: 'commonRatio' as const,
        label: 'Common Ratio (r)',
        value: fmt(result.commonRatio),
        color: 'neutral' as const,
      }] : []),
      {
        id: 'fullSequence',
        label: 'Extended Sequence',
        value: [...terms, ...nextTerms].map(t => fmt(t)).join(', '),
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(NumberSequencePanel, { values, results });
  },
  educational: {
    formula: 'Arithmetic: a(n) = a₁ + d(n-1) | Geometric: a(n) = a₁ × r^(n-1) | Fibonacci: F(n) = F(n-1) + F(n-2)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Number Sequences</text><text x="220" y="55" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">Arithmetic: add constant difference (d)</text><circle cx="50" cy="90" r="20" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="50" y="95" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">3</text><circle cx="120" cy="90" r="20" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="120" y="95" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">7</text><circle cx="190" cy="90" r="20" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="190" y="95" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">11</text><circle cx="260" cy="90" r="20" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="260" y="95" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">15</text><line x1="70" y1="78" x2="100" y2="78" stroke="var(--svg-ef4444)" stroke-width="1.5" marker-end="url(#ar)"/><text x="85" y="72" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)">+4</text><line x1="140" y1="78" x2="170" y2="78" stroke="var(--svg-ef4444)" stroke-width="1.5" marker-end="url(#ar)"/><text x="155" y="72" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)">+4</text><line x1="210" y1="78" x2="240" y2="78" stroke="var(--svg-ef4444)" stroke-width="1.5" marker-end="url(#ar)"/><text x="225" y="72" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)">+4</text><text x="220" y="140" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-22c55e)">Geometric: multiply by constant ratio (r)</text><circle cx="70" cy="170" r="20" fill="var(--svg-22c55e)" fill-opacity=".15" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="70" y="175" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-22c55e)">2</text><circle cx="160" cy="170" r="20" fill="var(--svg-22c55e)" fill-opacity=".15" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="160" y="175" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-22c55e)">6</text><circle cx="250" cy="170" r="20" fill="var(--svg-22c55e)" fill-opacity=".15" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="250" y="175" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-22c55e)">18</text><circle cx="340" cy="170" r="20" fill="var(--svg-22c55e)" fill-opacity=".15" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="340" y="175" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-22c55e)">54</text><line x1="90" y1="158" x2="140" y2="158" stroke="var(--svg-ef4444)" stroke-width="1.5" marker-end="url(#ar)"/><text x="115" y="152" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)">&times;3</text><line x1="180" y1="158" x2="230" y2="158" stroke="var(--svg-ef4444)" stroke-width="1.5" marker-end="url(#ar)"/><text x="205" y="152" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)">&times;3</text><line x1="270" y1="158" x2="320" y2="158" stroke="var(--svg-ef4444)" stroke-width="1.5" marker-end="url(#ar)"/><text x="295" y="152" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)">&times;3</text><text x="220" y="225" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Sequence Formulas</text><text x="220" y="248" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Arithmetic: a(n) = a&#8321; + d(n&minus;1) &nbsp;|&nbsp; d = common difference</text><text x="220" y="270" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Geometric: a(n) = a&#8321; &times; r&#8319;&#8315;&sup1; &nbsp;|&nbsp; r = common ratio</text><text x="220" y="292" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Fibonacci: F(n) = F(n&minus;1) + F(n&minus;2) &nbsp;|&nbsp; starts 0,1,1,2,3,5,8,13...</text><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="var(--svg-ef4444)"/></marker></defs></svg>',
      alt: 'Visual of arithmetic sequence with circles showing +4 increments between terms, and geometric sequence showing multiplication by 3 between terms',
      caption: 'Sequences follow patterns: arithmetic adds a constant difference, geometric multiplies by a constant ratio',
    },
    formulaDescription:
      'A number sequence is an ordered list of numbers that follow a pattern. An arithmetic sequence has a constant difference between consecutive terms. A geometric sequence has a constant ratio. A Fibonacci sequence adds the two previous terms to produce the next. Identifying the pattern allows you to predict future terms and find a closed-form formula.',
    variables: [
      { symbol: 'a₁', name: 'First Term', description: 'The starting value of the sequence. The foundation for building all subsequent terms.' },
      { symbol: 'd', name: 'Common Difference', description: 'Constant difference between consecutive terms in an arithmetic sequence. Can be positive, negative, or zero.' },
      { symbol: 'r', name: 'Common Ratio', description: 'Constant ratio between consecutive terms in a geometric sequence. Can be any non-zero number including fractions and decimals.' },
      { symbol: 'n', name: 'Term Position', description: 'The index of the term in the sequence, starting at 1 for the first term.' },
    ],
    howToUse: [
      'Enter at least 3 comma-separated numbers from your sequence (more terms improve pattern detection accuracy).',
      'Choose how many additional terms to compute (up to 20).',
      'The calculator identifies the pattern type — arithmetic, geometric, or Fibonacci — and displays the nth-term formula.',
      'Review the step-by-step reasoning for how the pattern was detected, including the common difference or ratio.',
      'For unknown patterns, the calculator reports that no simple pattern was found — your sequence may follow a higher-order rule.',
    ],
    explanation:
      'Sequence recognition is a fundamental skill in mathematics and computer science. Arithmetic sequences describe linear growth (constant addition) — like saving a fixed amount each month. Geometric sequences describe exponential growth (constant multiplication) — like compound interest or population growth. Fibonacci sequences appear throughout nature — from spiral shells and pinecones to branching trees and leaf arrangements (phyllotaxis). The nth-term formula (or closed-form formula) lets you compute any term directly without enumerating all preceding terms, which is essential for large indices. For example, the 100th term of an arithmetic sequence with first term 1 and difference 3 is a(100) = 1 + 3(99) = 298 — much faster than adding 3 ninety-nine times. Similarly, the sum of the first n terms of an arithmetic sequence is S(n) = n(a₁ + aₙ)/2, and for a geometric sequence it is S(n) = a₁(rⁿ − 1)/(r − 1). These summation formulas appear in calculus (Riemann sums), finance (annuity calculations), and computer science (algorithm analysis).',
    faqs: [
      {
        question: 'What if my sequence does not match any pattern?',
        answer: 'The calculator checks for arithmetic, geometric, and Fibonacci patterns — the three most common. Many sequences follow higher-order patterns (quadratic, recursive with more terms, etc.) that are not detected. Consider whether your sequence might follow a different rule or contains errors.',
      },
      {
        question: 'Can I use decimal numbers in my sequence?',
        answer: 'Yes. Decimal numbers work for all sequence types. For geometric sequences, the ratio may be a decimal (e.g., 0.5 for halving). Just enter them as comma-separated values like "100, 50, 25, 12.5".',
      },
      {
        question: 'How many terms do I need?',
        answer: 'At least 3 terms are needed for reliable identification. More terms help confirm the pattern, especially for geometric sequences where rounding could make a few terms appear to follow a pattern by coincidence.',
      },
    ],
    citations: [
      { source: 'OEIS - On-Line Encyclopedia of Integer Sequences', url: 'https://oeis.org/' },
      { source: 'Wolfram MathWorld - Integer Sequence', url: 'https://mathworld.wolfram.com/IntegerSequence.html' },
    ],
  },
};

export default numberSequenceConfig;
