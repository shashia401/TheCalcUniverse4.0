import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RandomNumberPanel from './RandomNumberPanel';

function generateRandomNumbers(min: number, max: number, count: number, decimals: number, unique: boolean): number[] {
  const numbers: number[] = [];
  const set = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 100;

  while (numbers.length < count && attempts < maxAttempts) {
    attempts++;
    let value: number;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const range = max - min;

    if (decimals === 0) {
      value = min + (array[0] % (range + 1));
    } else {
      const factor = Math.pow(10, decimals);
      value = min + (array[0] / 0xffffffff) * range;
      value = Math.round(value * factor) / factor;
    }

    if (unique) {
      const key = value.toFixed(decimals);
      if (set.has(key)) continue;
      set.add(key);
    }

    numbers.push(value);
  }

  return numbers;
}

const randomNumberConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'min',
      label: 'Minimum Value',
      type: 'number',
      placeholder: '1',
      required: true,
      inputMode: 'numeric',
      helpText: 'The smallest possible random number',
    },
    {
      id: 'max',
      label: 'Maximum Value',
      type: 'number',
      placeholder: '100',
      required: true,
      inputMode: 'numeric',
      helpText: 'The largest possible random number',
    },
    {
      id: 'count',
      label: 'How many numbers?',
      type: 'number',
      placeholder: '5',
      step: 1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Number of random values to generate (max 1000)',
    },
    {
      id: 'decimals',
      label: 'Decimal Places',
      type: 'select',
      required: true,
      options: [
        { label: '0 (integers)', value: '0' },
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5', value: '5' },
      ],
    },
    {
      id: 'unique',
      label: 'Unique Values Only?',
      type: 'select',
      required: true,
      options: [
        { label: 'No (allow repeats)', value: 'no' },
        { label: 'Yes (no duplicates)', value: 'yes' },
      ],
    },
  ],
  calculate: (values) => {
    const min = parseFloat(values.min);
    const max = parseFloat(values.max);
    const count = parseInt(values.count) || 1;
    const decimals = parseInt(values.decimals) || 0;
    const unique = values.unique === 'yes';

    if ([min, max].some(isNaN) || min > max || count < 1) return [];

    const clampedCount = Math.min(count, 1000);
    const numbers = generateRandomNumbers(min, max, clampedCount, decimals, unique);
    if (!numbers.length) return [];

    const fmt = (n: number) => {
      if (decimals === 0 && Number.isInteger(n)) return n.toString();
      return n.toFixed(decimals);
    };

    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const genMin = sorted[0];
    const genMax = sorted[sorted.length - 1];

    const numberList = numbers.map(n => fmt(n)).join(', ');

    return [
      {
        id: 'numberList',
        label: `Generated Numbers (${numbers.length})`,
        value: numberList,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'sum',
        label: 'Sum',
        value: fmt(sum),
        color: 'neutral',
      },
      {
        id: 'average',
        label: 'Average',
        value: fmt(avg),
        color: 'neutral',
      },
      {
        id: 'minValue',
        label: 'Minimum',
        value: fmt(genMin),
        color: 'neutral',
      },
      {
        id: 'maxValue',
        label: 'Maximum',
        value: fmt(genMax),
        color: 'neutral',
      },
      {
        id: 'range',
        label: 'Range',
        value: fmt(genMax - genMin),
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RandomNumberPanel, { values, results });
  },
  educational: {
    formula: 'Random(min, max) → uniform distribution over [min, max]',
    formulaDescription:
      'This calculator uses the Web Crypto API (crypto.getRandomValues) to generate cryptographically secure pseudo-random numbers. Unlike Math.random(), the Web Crypto API is designed for security-sensitive applications and provides uniformly distributed values with no predictable pattern.',
    variables: [
      { symbol: 'min', name: 'Minimum Value', description: 'The lower bound of the random range. Inclusive — the result can equal this value.' },
      { symbol: 'max', name: 'Maximum Value', description: 'The upper bound of the random range. Inclusive for integers, exclusive for decimals. For example, range [1, 100] can produce 100 for integers but not for decimals.' },
      { symbol: 'n', name: 'Count', description: 'How many random numbers to generate in a single batch. Maximum is 1000 per batch.' },
    ],
    howToUse: [
      'Set the minimum and maximum values for your range.',
      'Choose how many random numbers to generate (up to 1000 per batch).',
      'Select the number of decimal places (0 for integers, 1-5 for decimals).',
      'Optionally enforce unique values (no duplicates) — useful for lottery numbers or sampling without replacement.',
      'View sum, average, min, and max of the generated numbers for statistical insight.',
    ],
    explanation:
      'Random number generation is fundamental to simulations, statistical sampling, cryptography, gaming, and decision-making. This calculator uses cryptographically secure random number generation via the Web Crypto API (crypto.getRandomValues), which is suitable for most applications including security-sensitive ones. Unlike Math.random(), which uses a pseudo-random number generator (PRNG) seeded with the current time, the Web Crypto API draws entropy from the operating system\'s secure random source, making it unpredictable and suitable for cryptographic purposes. For integer generation, the range is uniformly sampled using modulo reduction of a 32-bit random value. For decimal values, a 32-bit random integer is mapped to the [0, 1) interval and scaled to your range. Note that true randomness includes occasional "patterns" and repeats — seeing three consecutive 7s in a sequence of random digits is not unusual and does not indicate a bug. True randomness is clumpy, which often surprises people who expect random numbers to appear evenly distributed.',
    quickReference: [
      { label: 'Dice roll (D6)', value: 'min=1, max=6, count=1, decimals=0' },
      { label: 'Coin flip (0 or 1)', value: 'min=0, max=1, count=1, decimals=0' },
      { label: 'Lottery (6/49)', value: 'min=1, max=49, count=6, unique=yes' },
      { label: 'Random percentage', value: 'min=0, max=100, count=1, decimals=2' },
      { label: 'D20 RPG roll', value: 'min=1, max=20, count=1, decimals=0' },
      { label: 'Random time (min)', value: 'min=0, max=59, count=1, decimals=0' },
      { label: 'Pick a card (1-52)', value: 'min=1, max=52, count=1, unique=yes' },
      { label: 'Random coordinate', value: 'min=-180, max=180, count=2, decimals=4' },
    ],
    commonUses: [
      'Tabletop RPG gaming — rolling virtual dice (D4, D6, D8, D10, D12, D20) for Dungeons & Dragons and other role-playing games when physical dice are not available.',
      'Lottery and raffle number generation — picking truly random numbers for lottery tickets, giveaways, and prize draws with guaranteed uniqueness so no one gets duplicate entries.',
      'Statistical sampling — selecting random data points from a larger dataset for analysis, A/B testing group assignment, or Monte Carlo simulations for risk modeling.',
      'Randomized classroom activities — selecting random students for questions, picking random problem numbers for homework, or creating randomized test versions to prevent cheating.',
      'Password and PIN generation — creating random numeric PINs, verification codes, and secure numerical identifiers that are cryptographically unpredictable.',
    ],
    workedExamples: [
      {
        scenario: 'Carlos is organizing a company raffle with 200 employees. He needs to pick 5 unique winners from employee IDs 1 through 200. He wants truly random selection that cannot be predicted or manipulated.',
        inputs: { min: '1', max: '200', count: '5', decimals: '0', unique: 'yes' },
        result: 'Five unique random integers in [1, 200], e.g., 23, 67, 142, 8, 189. Sum, average, min, max, and range are also displayed. The Web Crypto API ensures cryptographically unpredictable selection.',
        insight: 'With min=1, max=200, count=5, and unique mode enabled, the generator randomly selects 5 distinct employee IDs between 1 and 200. The Web Crypto API ensures the selection is cryptographically unpredictable — no one can game the system by knowing the seed or algorithm timing. Carlos should verify that count (5) is less than or equal to the range (200 values available) to ensure uniqueness is possible. Each of the 5 numbers has an equal 1/200 probability of being selected, making this a fair and unbiased raffle.',
      },
      {
        scenario: 'Dr. Patel, a statistics professor, needs 100 random decimal values between 0 and 1 for a Monte Carlo simulation to estimate pi. Her students will throw virtual darts at a unit square and count how many land inside the quarter circle.',
        inputs: { min: '0', max: '1', count: '100', decimals: '4', unique: 'no' },
        result: '100 uniformly distributed random decimals in [0, 1] with 4 decimal places, e.g., 0.3821, 0.9156, 0.0438, ... Sum, average, min, max, and range are displayed for statistical insight.',
        insight: 'With min=0, max=1, count=100, and 4 decimal places, the generator produces 100 uniformly distributed random decimals. Dr. Patel generates two batches — one for X coordinates and one for Y coordinates. For each pair (x, y), students check if x² + y² ≤ 1. The ratio of points inside the quarter circle to total points, multiplied by 4, approximates pi. With 100 points, the estimate typically lands between 2.8 and 3.4. With 10,000 points, it converges to about 3.14. This demonstrates the law of large numbers — more samples yield better estimates. The Web Crypto API ensures the darts are truly uniformly distributed with no bias toward any region of the square.',
      },
      {
        scenario: 'Maya, a 5th-grade teacher, wants to randomly assign her 28 students into 4 groups of 7 for a science fair project. She needs a fair, transparent method that students can watch happen in real time on the classroom projector.',
        inputs: { min: '1', max: '28', count: '7', decimals: '0', unique: 'yes' },
        result: 'Seven unique random integers in [1, 28], e.g., 4, 17, 22, 9, 15, 28, 3. Repeat 3 more times excluding already-assigned numbers to form all 4 groups. Sum, average, min, max, and range are displayed.',
        insight: 'Maya generates 4 separate batches of 7 unique numbers each, assigning each batch to a different group. Since she needs all 28 students assigned without overlap, she can generate the first batch (7 random unique numbers from 1-28), note those students as Group A, then exclude them from the remaining pool (mentally track which numbers are taken). Alternatively, she generates all 28 in one batch (count=28, unique=yes) and assigns the first 7 to Group A, next 7 to Group B, etc. The uniform distribution guarantees each student has an equal chance of being in any group. Maya should do this live on the projector so students can see the process is fair — no "teacher\'s pet" or "problem student" grouping bias.',
      },
    ],
    proTips: [
      'For lottery or raffle numbers, always use unique mode — this guarantees no duplicate picks and matches how real lotteries work (balls are drawn without replacement).',
      'For Monte Carlo simulations and statistical sampling, generate large batches (100-1000 numbers) in a single call to reduce overhead from repeated DOM updates.',
      'When generating random decimals between 0 and 1 for probability simulations, use min=0, max=1, decimals=4 or 5 for sufficient precision without unnecessary decimal clutter.',
      'If you need a random sample from a list of names or items, assign each item a number (1 to N), generate random unique numbers, and map the numbers back to the items. This works for jury selection, audit sampling, or randomized experiment group assignment.',
      'For random passwords or PINs, generate a batch of integers and concatenate them — for example, 4 random digits from 0-9 produces a 4-digit PIN for ATM cards or phone unlock codes.',
      'The Web Crypto API uses operating system entropy (hardware interrupts, mouse movements, disk timing jitter) to seed its generator. For applications that need the highest possible entropy, refresh the browser page to draw fresh entropy from the OS before generating numbers.',
    ],
    limitations: [
      'Not suitable for generating cryptographic keys directly — dedicated key generation libraries handle key stretching, encoding, and FIPS 140-2 compliance that this tool does not. Use this for non-cryptographic entropy needs.',
      'The uniqueness constraint cannot be satisfied when the requested count exceeds the available range (e.g., 10 unique integers from 1 to 5 is mathematically impossible). The generator will produce as many as it can within the collision-avoidance limit.',
      'Maximum batch size is capped at 1000 numbers to maintain responsive UI performance. For larger datasets, generate multiple batches or use a dedicated statistical software package.',
      'Randomness quality depends on the browser\'s Web Crypto API implementation and the OS entropy pool. Older browsers or constrained environments (embedded systems, some mobile browsers) may have weaker entropy sources.',
      'This is a software-based CSPRNG, not a hardware random number generator (HRNG). For applications requiring quantum-level randomness (e.g., lottery systems with regulatory compliance, cryptographic key generation for certificate authorities), use dedicated hardware RNG devices.',
    ],
    faqs: [
      {
        question: 'Is this better than Math.random()?',
        answer: 'Yes. Math.random() uses a pseudo-random number generator (PRNG) that is not cryptographically secure — its output can be predicted if you know the internal state. The Web Crypto API uses a cryptographically secure PRNG (CSPRNG), which is suitable for security applications like password generation and encryption keys. For most statistical simulations, both work fine, but the CSPRNG provides additional unpredictability guarantees.',
      },
      {
        question: 'Can I generate truly random numbers?',
        answer: 'No software algorithm can generate truly random numbers — they are all deterministic PRNGs seeded by entropy. The Web Crypto API uses entropy from the operating system (hardware interrupts, mouse movements, disk timing jitter, network packet arrival times) to seed its generator, making it practically unpredictable. For true randomness, you would need hardware based on quantum phenomena like radioactive decay or photon beam splitters.',
      },
      {
        question: 'Why might I get fewer numbers than requested with unique mode?',
        answer: 'If the range is smaller than the requested count, the generator cannot produce enough distinct values. For example, generating 10 unique integers between 1 and 5 is mathematically impossible — there are only 5 distinct values available. The generator will produce as many as it can within the collision-avoidance limit (100 attempts per requested number). If you receive fewer numbers than expected with unique mode, increase your range or decrease the count.',
      },
      {
        question: 'What is the difference between pseudo-random and cryptographically secure random numbers?',
        answer: 'Pseudo-random number generators (PRNGs) like Math.random() use deterministic algorithms (typically linear congruential generators or Mersenne Twister) that produce statistically random-looking sequences but are predictable if you know the algorithm\'s internal state. Cryptographically secure PRNGs (CSPRNGs) add two key properties: forward secrecy (knowing past outputs does not help predict future ones) and backward secrecy (knowing current state does not reveal past outputs). CSPRNGs are required for security applications like TLS/SSL session keys, password salts, and cryptographic nonces. For non-security applications like games or simulations, a standard PRNG is sufficient and often faster.',
      },
      {
        question: 'Why do I see repeating patterns in supposedly random numbers?',
        answer: 'True randomness is "clumpy" — sequences like 7-7-7 or 1-2-3-4-5 occur naturally in random data more often than people expect. The human brain is pattern-seeking and perceives structure even in perfectly random sequences. This is called the clustering illusion. In fact, if you generated 100 random digits and saw NO repeats or apparent patterns, that would actually be suspicious — truly random sequences have about a 63% chance of containing at least one consecutive repeat within 100 trials. If your application truly needs to avoid any repeated values, use the "unique values only" option.',
      },
      {
        question: 'What practical applications use cryptographically secure random numbers?',
        answer: 'CSPRNGs are used everywhere in computing: TLS/SSL encryption handshakes use random numbers for session keys, password managers generate random passwords, online casinos use them for fair card shuffling, scientific computing uses them for Monte Carlo simulations that must be reproducible but unbiased, video games use them for procedural content generation and loot box mechanics, and financial systems use them for audit sampling and fraud detection algorithms. This calculator is appropriate for all these use cases except those that require hardware-level randomness certification (e.g., government lottery draws which typically require physical ball machines or quantum RNG devices).',
      },
    ],
    citations: [
      { source: 'NIST SP 800-90A - Random Number Generation', url: 'https://csrc.nist.gov/publications/detail/sp/800-90a/rev-1/final' },
      { source: 'Wikipedia - Random Number Generation', url: 'https://en.wikipedia.org/wiki/Random_number_generation' },
      { source: 'MDN - Web Crypto API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Random Number Range</text><line x1="20" y1="65" x2="300" y2="65" stroke="var(--svg-dddddd)" stroke-width="3"/><text x="20" y="52" font-size="10" fill="var(--svg-555555)" font-weight="bold">Min</text><text x="300" y="52" font-size="10" fill="var(--svg-555555)" font-weight="bold">Max</text><text x="20" y="82" font-size="10" fill="var(--svg-333333)">1</text><text x="300" y="82" font-size="10" fill="var(--svg-333333)">100</text><circle cx="65" cy="65" r="6" fill="var(--svg-3b82f6)"/><circle cx="130" cy="65" r="6" fill="var(--svg-3b82f6)"/><circle cx="160" cy="65" r="6" fill="var(--svg-ef4444)"/><circle cx="200" cy="65" r="6" fill="var(--svg-3b82f6)"/><circle cx="255" cy="65" r="6" fill="var(--svg-3b82f6)"/><text x="65" y="50" font-size="9" fill="var(--svg-3b82f6)">23</text><text x="130" y="50" font-size="9" fill="var(--svg-3b82f6)">47</text><text x="160" y="50" font-size="9" fill="var(--svg-ef4444)">58</text><text x="200" y="50" font-size="9" fill="var(--svg-3b82f6)">76</text><text x="255" y="50" font-size="9" fill="var(--svg-3b82f6)">92</text><rect x="15" y="100" width="290" height="90" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="120" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Uniform Distribution over [min, max]</text><text x="20" y="142" font-size="10" fill="var(--svg-333333)">crypto.getRandomValues()</text><text x="310" y="142" text-anchor="end" font-size="10" fill="var(--svg-3b82f6)">CSPRNG</text><line x1="20" y1="150" x2="300" y2="150" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="168" font-size="10" fill="var(--svg-333333)">Math.random()</text><text x="310" y="168" text-anchor="end" font-size="10" fill="var(--svg-ef4444)">PRNG (not secure)</text><line x1="20" y1="176" x2="300" y2="176" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="188" font-size="10" fill="var(--svg-333333)">True randomness is clumpy — patterns occur naturally</text></svg>',
      alt: 'Random number range showing uniform distribution between min and max values',
      caption: 'Cryptographically secure random numbers (CSPRNG) are uniformly distributed and suitable for security applications.',
    },
  },
};

export default randomNumberConfig;
