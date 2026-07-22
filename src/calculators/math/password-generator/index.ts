import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PasswordPanel from './PasswordPanel';

// ── Character sets ──────────────────────────────────────────────────────

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?~';

const UPPERCASE_NO_AMBIG = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // removed I, O
const LOWERCASE_NO_AMBIG = 'abcdefghjkmnpqrstuvwxyz'; // removed l, o
const NUMBERS_NO_AMBIG = '23456789'; // removed 0, 1

// ── Word list for passphrase mode (~200 common English words) ───────────

const WORD_LIST = [
  'apple', 'arrow', 'autumn', 'bacon', 'badger', 'balance', 'bamboo',
  'banana', 'basket', 'beach', 'beacon', 'blanket', 'blizzard', 'blossom',
  'blue', 'breeze', 'bridge', 'bright', 'broken', 'bubble', 'bucket',
  'butter', 'cactus', 'candle', 'canyon', 'castle', 'catalog', 'cattle',
  'cavern', 'celery', 'cereal', 'chalk', 'chance', 'change', 'cheese',
  'cherry', 'chrome', 'circle', 'clover', 'coastal', 'cobalt', 'coconut',
  'coffee', 'comet', 'cookie', 'copper', 'coral', 'cotton', 'coyote',
  'cradle', 'cranky', 'crayon', 'creek', 'crimson', 'crystal', 'cuddle',
  'curry', 'daisy', 'dance', 'denim', 'desert', 'detail', 'diamond',
  'diesel', 'dinner', 'dizzy', 'donkey', 'dragon', 'dream', 'drift',
  'drink', 'drive', 'drum', 'dubious', 'duck', 'dune', 'dusty', 'dwarf',
  'eagle', 'earth', 'echo', 'eclipse', 'elder', 'emerald', 'energy',
  'engine', 'equity', 'escape', 'evening', 'export', 'fabric', 'factor',
  'falcon', 'fancy', 'frozen', 'fusion', 'galaxy', 'garden', 'gather',
  'gem', 'genius', 'gentle', 'giant', 'giraffe', 'glacier', 'glider',
  'global', 'glove', 'golden', 'gossip', 'grain', 'grape', 'gravity',
  'grizzly', 'ground', 'growth', 'guitar', 'gum', 'hammer', 'hamster',
  'harbor', 'hazel', 'heart', 'heaven', 'helmet', 'heron', 'hollow',
  'honey', 'horizon', 'horse', 'humble', 'humor', 'hunger', 'hunter',
  'iceberg', 'igloo', 'impact', 'indigo', 'infant', 'injury', 'input',
  'insect', 'island', 'ivory', 'jaguar', 'jelly', 'jewel', 'jungle',
  'jupiter', 'kangaroo', 'kettle', 'key', 'kidney', 'kitchen', 'kitten',
  'kiwi', 'knife', 'ladder', 'lagoon', 'lantern', 'laser', 'laundry',
  'lavender', 'leather', 'legend', 'lemon', 'lichen', 'light', 'lily',
  'linen', 'lizard', 'lobster', 'locket', 'lotus', 'lumber', 'lunar',
  'lunch', 'lyric', 'magnet', 'marine', 'marsh', 'master', 'matter',
  'meadow', 'melody', 'mentor', 'mercury', 'mercy', 'midnight', 'mimic',
  'minute', 'mirror', 'mist', 'mixture', 'model', 'mohawk', 'monitor',
  'monkey', 'moon', 'morning', 'mosaic', 'moth', 'mountain', 'mouse',
  'museum', 'music', 'napkin', 'narrow', 'nature', 'nautilus', 'nebula',
  'nectar', 'needle', 'neon', 'nephew', 'nest', 'network', 'neutral',
  'night', 'noble', 'noodle', 'novel', 'nuclear', 'nugget', 'nurse',
  'nylon', 'oasis', 'ocean', 'octave', 'office', 'olive', 'onion',
  'opener', 'orange', 'orchid', 'origin', 'osprey', 'oven', 'oxygen',
  'oyster', 'paddle', 'paint', 'palace', 'panda', 'panel', 'paper',
  'parade', 'parrot', 'particle', 'pasta', 'patch', 'patrol', 'peach',
  'peanut', 'pearl', 'pelican', 'pepper', 'perfume', 'person', 'petal',
  'pewter', 'phantom', 'photon', 'piano', 'pickle', 'picture', 'piece',
  'pigeon', 'pillow', 'pilot', 'pixel', 'planet', 'plastic', 'platinum',
  'play', 'plum', 'plume', 'pocket', 'poem', 'poetry', 'point', 'polar',
  'police', 'polo', 'pond', 'pony', 'popcorn', 'post', 'potato', 'power',
  'prairie', 'prayer', 'price', 'prince', 'prism', 'puddle', 'puffin',
  'pulse', 'puma', 'pumpkin', 'puzzle', 'pyramid', 'quail', 'quartz',
  'queen', 'quest', 'quiet', 'quiver', 'rabbit', 'raccoon', 'racing',
  'radar', 'radius', 'rain', 'raisin', 'rally', 'ranch', 'ranger',
  'raven', 'razor', 'recipe', 'reef', 'relay', 'repair', 'resin',
  'rest', 'reward', 'rhythm', 'ribbon', 'rider', 'rifle', 'river',
  'robin', 'robot', 'rocket', 'rose', 'royal', 'rubber', 'ruby',
  'rugby', 'ruler', 'rustic', 'saddle', 'safari', 'salmon', 'salt',
  'sample', 'sand', 'saturn', 'sauce', 'saving', 'scanner', 'scene',
  'scope', 'scorpion', 'scratch', 'screen', 'script', 'search', 'season',
  'secret', 'senior', 'shadow', 'shampoo', 'shape', 'shark', 'sheep',
  'shelter', 'shield', 'shift', 'shirt', 'shock', 'shore', 'silver',
  'sketch', 'skill', 'skull', 'sloth', 'smoke', 'snake', 'snow',
  'soccer', 'soda', 'soft', 'solar', 'solid', 'song', 'source',
  'south', 'space', 'spark', 'speed', 'spiral', 'spirit', 'splash',
  'sponge', 'spoon', 'sport', 'spring', 'square', 'squid', 'squirrel',
  'stable', 'stamp', 'star', 'static', 'steel', 'stem', 'stereo',
  'storm', 'stream', 'studio', 'summer', 'sunset', 'surf', 'swamp',
  'swan', 'swift', 'swing', 'switch', 'sword', 'table', 'taco',
  'talent', 'tango', 'tanker', 'target', 'taxi', 'teacup', 'tempo',
  'tennis', 'theater', 'throne', 'ticket', 'tiger', 'timber', 'tissue',
  'toast', 'token', 'tomato', 'tongue', 'topaz', 'tornado', 'torpedo',
  'towel', 'track', 'tractor', 'trade', 'traffic', 'trial', 'tribal',
  'trick', 'trident', 'trophy', 'truck', 'trumpet', 'tulip', 'tuna',
  'tunnel', 'turkey', 'turtle', 'tuxedo', 'twilight', 'umbrella',
  'unique', 'unity', 'update', 'upset', 'urban', 'usage', 'vacuum',
  'valley', 'vapor', 'vault', 'vector', 'velvet', 'vendor', 'venus',
  'verdict', 'vessel', 'veteran', 'viable', 'vibrant', 'violet',
  'virtue', 'vision', 'visitor', 'voice', 'volcano', 'volume', 'voyage',
  'waffle', 'wallet', 'walnut', 'wander', 'warmth', 'warrior', 'water',
  'weapon', 'weather', 'weaver', 'wedding', 'weight', 'whale', 'wheat',
  'winter', 'wisp', 'wizard', 'wolves', 'wonder', 'wool', 'worker',
  'wrench', 'yacht', 'yellow', 'yogurt', 'zebra', 'zenith', 'zigzag',
  'zircon', 'zodiac', 'zombie', 'zone', 'zoom',
];

// ── Helpers ─────────────────────────────────────────────────────────────

function getRandomInt(max: number): number {
  const array = new Uint32Array(1);
  // Rejection sampling to avoid modulo bias
  const maxUint = 4294967295;
  const remainder = maxUint % max;
  const threshold = maxUint - remainder;
  let result: number;
  do {
    crypto.getRandomValues(array);
    result = array[0];
  } while (result > threshold);
  return result % max;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getCharSets(
  includeUpper: boolean,
  includeLower: boolean,
  includeNumbers: boolean,
  includeSymbols: boolean,
  avoidAmbiguous: boolean,
): string[] {
  const sets: string[] = [];
  if (includeUpper) sets.push(avoidAmbiguous ? UPPERCASE_NO_AMBIG : UPPERCASE);
  if (includeLower) sets.push(avoidAmbiguous ? LOWERCASE_NO_AMBIG : LOWERCASE);
  if (includeNumbers) sets.push(avoidAmbiguous ? NUMBERS_NO_AMBIG : NUMBERS);
  if (includeSymbols) sets.push(SYMBOLS);
  return sets;
}

function getCharsetSize(charSets: string[]): number {
  return charSets.reduce((sum, set) => sum + set.length, 0);
}

function generateRandomPassword(length: number, charSets: string[]): string {
  const charset = charSets.join('');
  const password: string[] = [];

  // Ensure at least one character from each selected set
  for (const set of charSets) {
    password.push(set[getRandomInt(set.length)]);
  }

  // Fill the rest randomly
  while (password.length < length) {
    password.push(charset[getRandomInt(charset.length)]);
  }

  // Shuffle to remove the "selected categories first" pattern
  return shuffleArray(password).join('');
}

function generatePassphrase(length: number): string {
  const wordCount = Math.max(3, Math.min(6, Math.round(length / 4)));
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const word = WORD_LIST[getRandomInt(WORD_LIST.length)];
    words.push(word.charAt(0).toUpperCase() + word.slice(1));
  }

  const number = getRandomInt(1000);
  return words.join('-') + number;
}

function calculateEntropy(length: number, charsetSize: number): number {
  return length * Math.log2(charsetSize);
}

function classifyStrength(entropy: number): string {
  if (entropy < 40) return 'Weak';
  if (entropy < 60) return 'Fair';
  if (entropy < 80) return 'Good';
  if (entropy < 120) return 'Strong';
  return 'Very Strong';
}

function formatCrackTime(entropy: number): string {
  const seconds = Math.pow(2, entropy) / 1e9;

  if (seconds < 1) return 'less than a second';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  if (seconds < 86400) {
    const hours = Math.round(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  if (seconds < 31536000) {
    const days = Math.round(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  if (seconds < 315360000) {
    const years = seconds / 31536000;
    return `${years.toFixed(1)} year${years !== 1 ? 's' : ''}`;
  }
  const years = Math.round(seconds / 31536000);
  return `${years} year${years !== 1 ? 's' : ''}`;
}

// ── Config ──────────────────────────────────────────────────────────────

const passwordGeneratorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'length',
      label: 'Password Length',
      type: 'number',
      min: 4,
      max: 128,
      step: 1,
      placeholder: '16',
      required: true,
    },
    {
      id: 'includeUppercase',
      label: 'Uppercase Letters',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      required: true,
    },
    {
      id: 'includeLowercase',
      label: 'Lowercase Letters',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      required: true,
    },
    {
      id: 'includeNumbers',
      label: 'Numbers',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      required: true,
    },
    {
      id: 'includeSymbols',
      label: 'Symbols',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      required: true,
    },
    {
      id: 'avoidAmbiguous',
      label: 'Avoid Ambiguous Characters',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      helpText: 'Excludes O, 0, I, l, 1, | to avoid confusion',
    },
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      options: [
        { label: 'Random String', value: 'random' },
        { label: 'Human-Readable (passphrase)', value: 'passphrase' },
      ],
    },
  ],

  calculate: (values) => {
    const length = parseInt(values.length) || 16;
    const includeUpper = values.includeUppercase !== 'no';
    const includeLower = values.includeLowercase !== 'no';
    const includeNums = values.includeNumbers !== 'no';
    const includeSym = values.includeSymbols !== 'no';
    const avoidAmbiguous = values.avoidAmbiguous === 'yes';
    const mode = values.mode || 'random';

    // Ensure at least one character set is selected
    if (!includeUpper && !includeLower && !includeNums && !includeSym) {
      return [];
    }

    const charSets = getCharSets(includeUpper, includeLower, includeNums, includeSym, avoidAmbiguous);
    const charsetSize = getCharsetSize(charSets);

    let password: string;
    let actualLength: number;

    if (mode === 'passphrase') {
      password = generatePassphrase(length);
      actualLength = password.length;
    } else {
      const clampedLength = Math.max(4, Math.min(128, length));
      password = generateRandomPassword(clampedLength, charSets);
      actualLength = clampedLength;
    }

    const entropy = calculateEntropy(actualLength, charsetSize);
    const strength = classifyStrength(entropy);
    const crackTime = formatCrackTime(entropy);

    return [
      {
        id: 'password',
        label: 'Generated Password',
        value: password,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'length',
        label: 'Length',
        value: String(actualLength),
      },
      {
        id: 'entropy',
        label: 'Entropy',
        value: `${entropy.toFixed(1)} bits`,
      },
      {
        id: 'strength',
        label: 'Strength',
        value: strength,
      },
      {
        id: 'crackTime',
        label: 'Time to Crack (Brute Force)',
        value: crackTime,
      },
      {
        id: 'charset',
        label: 'Character Set Size',
        value: String(charsetSize),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PasswordPanel, { values, results });
  },

  educational: {
    formula: 'E = L × log₂(S)',
    formulaDescription:
      'Entropy (E) = Password Length (L) × log₂(Character Set Size (S)). Higher entropy means exponentially stronger resistance to brute-force attacks. Each additional bit of entropy doubles the number of guesses an attacker must try. For example, a password with 40 bits of entropy requires about 1 trillion guesses (2^40), which a modern GPU cluster can crack in seconds. A password with 80 bits of entropy requires about 1.2 × 10^24 guesses — essentially uncrackable by brute force with current technology.',
    variables: [
      {
        symbol: 'E',
        name: 'Entropy (bits)',
        description:
          'A measure of password strength. Each bit of entropy doubles the number of guesses required for a brute-force attack. 60+ bits is decent, 80+ is strong, 100+ is extremely strong.',
      },
      {
        symbol: 'L',
        name: 'Password Length',
        description:
          'The total number of characters in the password. Every extra character multiplies the guess space by S (the character set size), making length the single most important factor for password strength.',
      },
      {
        symbol: 'S',
        name: 'Character Set Size',
        description:
          'The number of possible characters for each position in the password. Lowercase alone = 26, + uppercase = 52, + digits = 62, + symbols = 95+. Mixing types dramatically increases S.',
      },
    ],
    howToUse: [
      'Select at least one character type to include in your password (lowercase, uppercase, digits, symbols).',
      'Adjust the password length slider — each additional character multiplies the number of possible passwords.',
      'Choose "Random String" for maximum security or "Passphrase" for a password of random words that is easier to remember.',
      'Enable "Avoid Ambiguous Characters" to exclude easily confused characters like O/0 and I/l/1.',
      'Review the calculated entropy (bits) and estimated time-to-crack to decide if the password is strong enough.',
    ],
    explanation:
      'Password strength is measured in bits of entropy. A password with N bits of entropy requires roughly 2^N guesses to crack via brute force. Modern password-cracking hardware — including GPU clusters and purpose-built ASICs — can attempt billions of guesses per second against unsalted, unhashed passwords, and millions per second against properly hashed passwords using algorithms like bcrypt, argon2, or PBKDF2. This is why we recommend passwords with at least 80 bits of entropy for important accounts like email and banking. Using a mix of character types (uppercase, lowercase, digits, symbols) dramatically increases the character set size S from 26 (lowercase only) to 95+ (all types). Increasing length L has a multiplicative effect on total entropy. For memorability, passphrases composed of 4-6 random words from a large dictionary offer 44-66 bits of entropy depending on word count, which is comparable to a moderately strong random string but significantly easier to remember and type. For maximum security, a long random string of 16+ characters is still the gold standard.',
    faqs: [
      {
        question: 'What is entropy and why does it matter?',
        answer:
          'Entropy measures how unpredictable your password is, expressed in bits. Each bit of entropy doubles the number of guesses needed to crack it. A password with 40 bits (like a typical 8-character lowercase password) can be cracked in seconds by modern hardware. An 80-bit password provides strong protection against brute-force attacks even with dedicated hardware. For context, most security experts recommend 60-80 bits for standard accounts and 100+ bits for high-value accounts like password managers and financial services.',
      },
      {
        question: 'Is a passphrase as secure as a random string?',
        answer:
          'A passphrase of 4-5 random words from a large dictionary (e.g., the EFF long word list with 7,776 words) provides roughly 52-65 bits of entropy, which is comparable to a 10-12 character random alphanumeric string. Passphrases are primarily beneficial because they are easier to remember, type accurately, and transcribe over the phone. However, for maximum security, a long random string (16+ characters with all character types) is still superior, providing 100+ bits of entropy.',
      },
      {
        question: 'What does "Time to Crack" mean?',
        answer:
          'This is an estimate of how long it would take an attacker to guess your password by trying every possible combination (brute force), assuming 1 billion guesses per second — a conservative estimate for modern GPU-based cracking hardware. Real-world attacks may be faster (using specialized ASICs) or slower (against well-hashed databases using bcrypt/argon2). The estimate assumes the attacker knows your password\'s character set and length. For properly hashed passwords, the cracking speed is dramatically reduced by the hash algorithm\'s computational cost.',
      },
      {
        question: 'Should I use ambiguous characters?',
        answer:
          'Ambiguous characters like O (letter) vs 0 (zero) and I (uppercase i) vs l (lowercase L) vs 1 (one) can cause problems when manually typing, reading over the phone, or transcribing passwords from paper. If you need to share passwords verbally or write them down temporarily, avoiding these characters reduces errors. For password managers (where you copy-paste the password), ambiguous characters are perfectly fine and add to the entropy.',
      },
      {
        question: 'Why does this use crypto.getRandomValues() instead of Math.random()?',
        answer:
          'crypto.getRandomValues() is a cryptographically secure pseudo-random number generator (CSPRNG) designed for security-sensitive applications like password generation, encryption key generation, and secure tokens. Math.random() is a general-purpose PRNG optimized for speed, not security — it is predictable if an attacker can obtain enough samples. Math.random() should never be used for passwords, session IDs, CSRF tokens, or any security-critical randomness.',
      },
      {
        question: 'How should I store my generated passwords?',
        answer:
          'The safest way to store passwords is in a dedicated password manager like 1Password, Bitwarden, LastPass, or KeePassXC. These tools encrypt your password vault with a strong master password and automatically fill passwords on websites. Writing passwords on paper is also secure if stored safely. Never store passwords in plain text files, spreadsheets, sticky notes on your monitor, or unencrypted digital notes.',
      },
    ],
    citations: [
      { source: 'NIST SP 800-63B - Digital Identity Guidelines', url: 'https://pages.nist.gov/800-63-3/sp800-63b.html' },
      { source: 'Wikipedia - Password Strength', url: 'https://en.wikipedia.org/wiki/Password_strength' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Password Strength Meter</text><text x="160" y="42" text-anchor="middle" font-size="11" fill="var(--svg-555555)">Entropy = Length × log₂(CharacterSet)</text><rect x="15" y="55" width="290" height="24" rx="12" fill="var(--svg-eeeeee)"/><rect x="15" y="55" width="174" height="24" rx="12" fill="var(--svg-3b82f6)"/><text x="160" y="72" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Strong (80 bits)</text><text x="15" y="94" font-size="9" fill="var(--svg-888888)">Weak</text><text x="75" y="94" font-size="9" fill="var(--svg-888888)">Fair</text><text x="140" y="94" font-size="9" fill="var(--svg-888888)">Good</text><text x="205" y="94" font-size="9" fill="var(--svg-888888)">Strong</text><text x="290" y="94" font-size="9" fill="var(--svg-888888)">Very Strong</text><text x="160" y="118" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Character types expand the keyspace</text><rect x="15" y="128" width="55" height="18" rx="3" fill="var(--svg-3b82f6)" opacity="0.4"/><text x="42" y="141" text-anchor="middle" font-size="9" fill="var(--svg-333333)">lowercase</text><rect x="78" y="128" width="55" height="18" rx="3" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="105" y="141" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">UPPER</text><rect x="141" y="128" width="55" height="18" rx="3" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="168" y="141" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">1234</text><rect x="204" y="128" width="55" height="18" rx="3" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="231" y="141" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">$#@!</text><text x="160" y="170" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Passphrase (easier to remember)</text><text x="160" y="190" text-anchor="middle" font-size="9" fill="var(--svg-888888)">Example: "Correct-Horse-Battery-Staple42" — 4 words + digits</text></svg>',
      alt: 'Password strength meter showing entropy scale and character type options',
      caption: 'Password entropy (bits) = Length × log₂(Character Set). Higher entropy means exponentially more guesses needed to crack.',
    },
  },
};

export default passwordGeneratorConfig;
