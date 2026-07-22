import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RegexTesterPanel from './RegexTesterPanel';

const regexTesterConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'pattern',
      label: 'Regex Pattern',
      type: 'text',
      inputMode: 'text',
      placeholder: 'Enter regex pattern...',
      required: true,
      helpText: 'Enter regex pattern without delimiters (e.g., \\d+)',
    },
    {
      id: 'flags',
      label: 'Flags',
      type: 'select',
      helpText: 'Modifiers for how the pattern is applied',
      options: [
        { label: 'None', value: '' },
        { label: 'g (global)', value: 'g' },
        { label: 'gi (global, case-insensitive)', value: 'gi' },
        { label: 'gm (global, multiline)', value: 'gm' },
        { label: 'gmi (all)', value: 'gmi' },
      ],
    },
    {
      id: 'testString',
      label: 'Test String',
      type: 'textarea',
      placeholder: 'Enter test string...',
      required: true,
      helpText: 'Text to search against the regex pattern',
    },
  ],
  calculate: (values: Record<string, string>) => {
    const pattern = values.pattern || '';
    const rawFlags = values.flags || '';
    const testString = values.testString || '';

    if (!pattern.trim() || !testString) return [];

    try {
      const regex = new RegExp(pattern, rawFlags);
      const isMatch = regex.test(testString);
      regex.lastIndex = 0;

      const countingFlags = rawFlags.includes('g') ? rawFlags : rawFlags + 'g';
      const countingRe = new RegExp(pattern, countingFlags);

      let matchCount = 0;
      const matchList: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = countingRe.exec(testString)) !== null) {
        matchCount++;
        if (matchList.length < 10) {
          matchList.push(m[0]);
        }
      }

      return [
        { id: 'isMatch', label: 'Match Found', value: isMatch ? 'Yes' : 'No', color: isMatch ? 'positive' : 'negative' },
        { id: 'matchCount', label: 'Match Count', value: `${matchCount}`, color: matchCount > 0 ? 'positive' : 'neutral' },
        { id: 'matches', label: 'Matches (first 10)', value: matchList.length > 0 ? matchList.join(', ') : '(none)', highlight: matchList.length > 0 },
        { id: 'pattern', label: 'Pattern Used', value: `/${pattern}/${rawFlags}`, color: 'neutral' },
      ];
    } catch {
      return [];
    }
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RegexTesterPanel, { values, results });
  },
  educational: {
    formula: '/pattern/flags  →  RegExp.prototype.test()  →  boolean match result',
    diagram: {
      svg: '<svg viewBox="0 0 440 320" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="30" y="15" width="380" height="290" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="8"/><text x="220" y="45" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e293b)">Regex Matching</text><rect x="50" y="65" width="120" height="55" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="110" y="90" text-anchor="middle" font-size="11" fill="var(--svg-2563eb)">Pattern</text><text x="110" y="107" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">/[A-Z]+/g</text><rect x="250" y="65" width="130" height="55" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="315" y="90" text-anchor="middle" font-size="11" fill="var(--svg-2563eb)">Test String</text><text x="315" y="107" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">"Hello World"</text><line x1="170" y1="92" x2="250" y2="92" stroke="var(--svg-64748b)" stroke-width="1.5"/><polygon points="250,87 262,92 250,97" fill="var(--svg-64748b)"/><rect x="120" y="150" width="200" height="50" fill="var(--svg-8b5cf6)" rx="8"/><text x="220" y="170" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">RegExp Engine</text><text x="220" y="188" text-anchor="middle" font-size="10" fill="var(--svg-ddd6fe)">Compile + Execute</text><line x1="220" y1="200" x2="220" y2="225" stroke="var(--svg-64748b)" stroke-width="1.5"/><polygon points="215,225 220,235 225,225" fill="var(--svg-64748b)"/><rect x="95" y="240" width="110" height="40" fill="var(--svg-22c55e)" rx="6"/><text x="150" y="263" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">Match Found</text><rect x="235" y="240" width="110" height="40" fill="var(--svg-ef4444)" rx="6"/><text x="290" y="263" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">No Match</text><line x1="195" y1="225" x2="150" y2="240" stroke="var(--svg-22c55e)" stroke-width="1.5"/><polygon points="155,242 150,240 158,237" fill="var(--svg-22c55e)"/><line x1="245" y1="225" x2="290" y2="240" stroke="var(--svg-ef4444)" stroke-width="1.5"/><polygon points="285,242 290,240 288,237" fill="var(--svg-ef4444)"/></svg>',
      alt: 'Diagram showing regex pattern and test string flowing into the RegExp engine producing match or no match',
      caption: 'Regular expression matching pipeline — pattern compilation, string testing, and result output',
    },
    formulaDescription:
      'Regular expressions (regex) are patterns used to match character combinations in strings. A regex pattern is compiled into a finite state machine that scans the input string character by character, attempting to find matches according to the pattern rules. Flags modify matching behavior: g (global) finds all matches, i (case-insensitive) ignores case, and m (multiline) treats ^ and $ as line boundaries.',
    variables: [
      {
        symbol: 'Pattern',
        name: 'Regex Pattern',
        description: 'The regular expression pattern string defining the matching rules using special syntax like character classes, quantifiers, and groups.',
      },
      {
        symbol: 'Flags',
        name: 'Regex Flags',
        description: 'Modifiers that change matching behavior: g for global (find all matches), i for case-insensitive, m for multiline (^/$ match line boundaries).',
      },
      {
        symbol: 'Test String',
        name: 'Input Text',
        description: 'The string of text that the regex pattern is applied to for finding matches.',
      },
      {
        symbol: 'Match',
        name: 'Matched Substring',
        description: 'A portion of the test string that satisfies the regex pattern. Multiple matches can be found with the global (g) flag.',
      },
      {
        symbol: 'Quantifier',
        name: 'Repetition Operator',
        description: 'Symbols like *, +, ?, and {n,m} that specify how many times a character or group should appear in the match.',
      },
    ],
    howToUse: [
      'Enter your regex pattern in the Pattern field (without delimiters).',
      'Select optional flags: g for global matching, i for case-insensitive, m for multiline.',
      'Enter or paste a test string to search against in the Test String field.',
      'View match count, matched substrings, and whether a match was found.',
    ],
    quickReference: [
      { label: '.', value: 'Any character except newline' },
      { label: '* / + / ?', value: 'Zero-or-more / One-or-more / Zero-or-one' },
      { label: '\\d / \\w / \\s', value: 'Digit / Word char / Whitespace' },
      { label: '^ / $', value: 'Start of string / End of string' },
      { label: '[abc] / [^abc]', value: 'Character class / Negated class' },
      { label: '(group)', value: 'Capture group (backreference via \\1)' },
    ],
    commonUses: [
      'Validating input formats like email addresses, phone numbers, and URLs.',
      'Searching and replacing text patterns in code editors and data pipelines.',
      'Extracting specific data from unstructured text logs and documents.',
      'Parsing and tokenizing strings in compilers, interpreters, and data processors.',
    ],
    explanation:
      'Regular expressions are a powerful tool for pattern matching and text manipulation that exist in virtually every programming language. The regex engine compiles a pattern into an internal finite automaton and processes the input string left to right. Patterns can include literal characters, metacharacters with special meaning (., *, +, ?, [], (), {}, ^, $), character classes (\\d, \\w, \\s), and anchors (^ for start, $ for end). The global flag (g) is critical for finding all matches rather than just the first one. Case-insensitive flag (i) matches both uppercase and lowercase letters. Multiline flag (m) changes the behavior of ^ and $ anchors to match at every line boundary rather than just the string boundaries. Understanding greedy vs. lazy matching is also important: by default quantifiers are greedy (match as much as possible), adding ? makes them lazy (match as little as possible). Care must be taken with complex patterns as catastrophic backtracking can cause performance issues on certain inputs.',
    faqs: [
      {
        question: 'What is the difference between greedy and lazy matching?',
        answer: 'Greedy quantifiers (*, +) match as much text as possible while still allowing the overall pattern to match. Lazy quantifiers (*?, +?) match as little as possible. For example, on the string "<div><p>text</p></div>", the pattern "<.+>" greedily matches the entire string, while "<.+?>" matches only "<div>".',
      },
      {
        question: 'Why does my regex cause the browser to hang?',
        answer: 'This is called catastrophic backtracking. It happens when a regex with nested quantifiers (like (a+)+b) is applied to a string that almost matches but fails at the end. The engine tries every possible way the quantifiers could distribute the characters, which grows exponentially. Avoid nested quantifiers and use atomic groups or possessive quantifiers where supported.',
      },
      {
        question: 'How do I match a literal special character like "." or "*"?',
        answer: 'Escape the special character with a backslash. Use \\. to match a literal dot, \\* to match a literal asterisk, \\\\ to match a literal backslash, etc. Inside character classes [...], most metacharacters lose their special meaning and don\'t need escaping.',
      },
      {
        question: 'What is the difference between test() and exec()?',
        answer: 'test() returns a boolean (true/false) indicating whether a match was found. exec() returns an array with the matched text, capture groups, and properties for the position. Use test() for simple validation and exec() when you need detailed match information or capture groups.',
      },
      {
        question: 'How do I validate common formats like email, URL, or phone number with regex?',
        answer: 'Email validation: a basic pattern is /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ but the full RFC 5322 email spec requires a much more complex regex (hundreds of characters). For practical use, a simple pattern plus a verification email is often more reliable than a perfect regex. URL validation: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/. Phone (US): /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/ handles (123) 456-7890, 123-456-7890, and 1234567890. Remember that regex validation is a first line of defense — always sanitize and validate server-side as well.',
      },
    ],
    proTips: [
      'Use non-capturing groups (?: ... ) instead of regular parentheses when you do not need to extract the group. They are faster and avoid cluttering your match results with unwanted capture groups.',
      'The g flag changes exec() behavior: with g, each call advances the lastIndex pointer and returns the next match. Without g, exec() always returns the first match. Always reset lastIndex to 0 or use a fresh regex when switching between test strings with the same pattern.',
      'For password validation, use multiple separate regex tests rather than one monster regex. Test for length, uppercase, lowercase, digits, and special characters separately — this produces clearer error messages and is easier to maintain.',
      'When building regex patterns, test them incrementally. Start with the simplest case, verify it works, then add complexity. Our tool shows match count and first 10 matches — use these to confirm your pattern behaves as expected before deploying it in code.',
      'Escape user-provided strings used in dynamic regex patterns to prevent regex injection and catastrophic backtracking. Use a function to escape special characters: function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, \'\\\\$&\'); }. Never directly interpolate user input into a regex pattern.',
    ],
    limitations: [
      'This regex tester uses the JavaScript RegExp engine (ECMAScript specification). Regex patterns that work here may behave differently in other regex flavors: Python\'s re module, PCRE (PHP/Perl), .NET, Java, and POSIX regex each have their own feature sets and syntax variations.',
      'Features NOT supported by JavaScript\'s engine include: lookbehind assertions (supported in ES2018+ but with limitations — must be fixed-width), possessive quantifiers (++, *+, ?+), atomic groups (?> ... ), recursive patterns, and named capture groups with the (?P<name>... ) syntax.',
      'Unicode property escapes (\\p{L}, \\p{N}) require the u flag in JavaScript and are not supported in this tool if the u flag cannot be combined with the selected flags.',
      'The regex engine can hang (catastrophic backtracking) on certain pathological patterns with nested quantifiers — our tool does not implement a timeout or regex interrupt mechanism.',
    ],
    workedExamples: [
      {
        scenario: 'Testing an Email Extraction Pattern',
        inputs: { pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g', testString: 'Contact us at support@example.com or sales@company.co.uk for inquiries. Invalid: not-an-email@' },
        result: 'Match Found: Yes — 2 matches (support@example.com, sales@company.co.uk)',
        insight:
          'This pattern matches 2 email addresses: "support@example.com" and "sales@company.co.uk". The character class [a-zA-Z0-9._%+-]+ matches the local part (before @), followed by @, then the domain with at least one dot and a TLD of 2+ characters. The "not-an-email@" fragment does not match because it lacks a TLD after the @. This pattern handles common email formats but would reject valid emails with quoted local parts or IP-address domains.',
      },
      {
        scenario: 'Extracting All Numbers from a Log File',
        inputs: { pattern: '\\d+\\.?\\d*', flags: 'g', testString: 'Temperature: 72.5 F | Humidity: 45% | Wind: 12.3 mph | Pressure: 1013.25 hPa | UV Index: 6' },
        result: 'Match Found: Yes — 5 matches (72.5, 45, 12.3, 1013.25, 6)',
        insight:
          'The pattern \\d+\\.?\\d* matches one or more digits, optionally followed by a decimal point and more digits. Applied to this sensor log, it extracts 5 matches: "72.5", "45", "12.3", "1013.25", "6". Notice that "45" and "6" are matched as integers because the decimal portion \\d* is optional (zero or more). The percent sign and units are not matched because they are not digits. This pattern is useful for parsing sensor data, financial logs, or any text containing mixed measurements.',
      },
    ],
    citations: [
      { title: 'MDN — Regular Expressions (RegExp)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions' },
      { title: 'Regular-Expressions.info', url: 'https://www.regular-expressions.info/' },
    ],
  },
};

export default regexTesterConfig;
