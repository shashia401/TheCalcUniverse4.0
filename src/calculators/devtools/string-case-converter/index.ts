import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import StringCasePanel from './StringCasePanel';

function toCamelCase(input: string): string {
  const words = input.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0].toLowerCase();
  const rest = words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return first + rest.join('');
}

function toPascalCase(input: string): string {
  const words = input.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (words.length === 0) return '';
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function toSnakeCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .join('_')
    .toLowerCase();
}

function toKebabCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .join('-')
    .toLowerCase();
}

function toUpperCase(input: string): string {
  return input.toUpperCase();
}

function toLowerCase(input: string): string {
  return input.toLowerCase();
}

function toTitleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function toStartCase(input: string): string {
  return input.replace(/(^|[^a-zA-Z0-9])([a-zA-Z])/g, (_, before, char) => {
    return before + char.toUpperCase();
  });
}

function toDotCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .join('.')
    .toLowerCase();
}

const stringCaseConverterConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'input',
      label: 'Input Text',
      type: 'text',
      inputMode: 'text',
      required: true,
      placeholder: 'Enter text to convert...',
      helpText: 'Any text to convert between different naming conventions',
    },
  ],
  calculate: (values) => {
    const input = values.input || '';
    if (!input.trim()) return [];

    return [
      {
        id: 'camelCase',
        label: 'camelCase',
        value: toCamelCase(input),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'PascalCase',
        label: 'PascalCase',
        value: toPascalCase(input),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'snake_case',
        label: 'snake_case',
        value: toSnakeCase(input),
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'kebab-case',
        label: 'kebab-case',
        value: toKebabCase(input),
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'UPPER CASE',
        label: 'UPPER CASE',
        value: toUpperCase(input),
        highlight: false,
        color: 'neutral',
      },
      {
        id: 'lower case',
        label: 'lower case',
        value: toLowerCase(input),
        highlight: false,
        color: 'neutral',
      },
      {
        id: 'Title Case',
        label: 'Title Case',
        value: toTitleCase(input),
        highlight: false,
        color: 'neutral',
      },
      {
        id: 'Start Case',
        label: 'Start Case',
        value: toStartCase(input),
        highlight: false,
        color: 'neutral',
      },
      {
        id: 'dot.case',
        label: 'dot.case',
        value: toDotCase(input),
        highlight: false,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(StringCasePanel, { values, results });
  },
  educational: {
    formula:
      'camelCase: first word lowercase, subsequent words capitalized\nPascalCase: all words capitalized\nsnake_case: lowercase with underscores\nkebab-case: lowercase with hyphens',
    diagram: {
      svg: '<svg viewBox="0 0 500 380" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="100" y="10" width="300" height="36" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="250" y="33" text-anchor="middle" font-size="13" fill="var(--svg-1e293b)" font-weight="bold">hello world example</text><line x1="250" y1="46" x2="250" y2="65" stroke="var(--svg-94a3b8)" stroke-width="1.5" stroke-dasharray="4,3"/><polygon points="250,68 244,58 256,58" fill="var(--svg-94a3b8)"/><text x="15" y="95" font-size="11" fill="var(--svg-64748b)">camelCase:</text><rect x="120" y="80" width="260" height="26" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><text x="250" y="97" text-anchor="middle" font-size="12" fill="var(--svg-3b82f6)" font-weight="bold">helloWorldExample</text><line x1="250" y1="106" x2="250" y2="115" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="4,2"/><text x="20" y="135" font-size="11" fill="var(--svg-64748b)">PascalCase:</text><rect x="120" y="120" width="260" height="26" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><text x="250" y="137" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)" font-weight="bold">HelloWorldExample</text><line x1="250" y1="146" x2="250" y2="155" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="4,2"/><text x="15" y="175" font-size="11" fill="var(--svg-64748b)">snake_case:</text><rect x="120" y="160" width="260" height="26" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><text x="250" y="177" text-anchor="middle" font-size="12" fill="var(--svg-22c55e)" font-weight="bold">hello_world_example</text><line x1="250" y1="186" x2="250" y2="195" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="4,2"/><text x="15" y="215" font-size="11" fill="var(--svg-64748b)">kebab-case:</text><rect x="120" y="200" width="260" height="26" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><text x="250" y="217" text-anchor="middle" font-size="12" fill="var(--svg-ef4444)" font-weight="bold">hello-world-example</text><line x1="250" y1="226" x2="250" y2="235" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="4,2"/><text x="25" y="255" font-size="11" fill="var(--svg-64748b)">UPPER:</text><rect x="120" y="240" width="260" height="26" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><text x="250" y="257" text-anchor="middle" font-size="12" fill="var(--svg-1e293b)" font-weight="bold">HELLO WORLD EXAMPLE</text><text x="25" y="295" font-size="11" fill="var(--svg-64748b)">Title:</text><rect x="120" y="280" width="260" height="26" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><text x="250" y="297" text-anchor="middle" font-size="12" fill="var(--svg-1e293b)">Hello World Example</text><line x1="250" y1="306" x2="250" y2="315" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="4,2"/><text x="25" y="335" font-size="11" fill="var(--svg-64748b)">dot.case:</text><rect x="120" y="320" width="260" height="26" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><text x="250" y="337" text-anchor="middle" font-size="12" fill="var(--svg-2563eb)">hello.world.example</text></svg>',
      alt: 'Diagram showing the input "hello world example" converted to camelCase, PascalCase, snake_case, kebab-case, UPPER CASE, Title Case, and dot.case',
      caption: 'Visual comparison of different text case formats applied to the same input string',
    },
    formulaDescription:
      'String case conversion transforms text between naming conventions used in programming and writing. Each format has specific rules for word separation, capitalization, and delimiter characters. Case converters are essential for maintaining consistent code style across projects and adapting identifiers between different programming language conventions.',
    variables: [
      {
        symbol: 'camelCase',
        name: 'camelCase',
        description: 'First word lowercase, subsequent words capitalized, no separators. Commonly used for variable and function names in JavaScript, Java, and C#.',
      },
      {
        symbol: 'PascalCase',
        name: 'PascalCase',
        description: 'Every word starts with an uppercase letter, no separators. Standard for class names, components, and type definitions in many languages.',
      },
      {
        symbol: 'snake_case',
        name: 'snake_case',
        description: 'All lowercase words separated by underscores. Used in Python, Ruby, and database column names for readability.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Converting database column names (snake_case) to JavaScript variables (camelCase)',
        inputs: { input: 'user_first_name' },
        result: 'camelCase: userFirstName, PascalCase: UserFirstName, snake_case: user_first_name, kebab-case: user-first-name',
        insight: 'Enter "user_first_name" to get "userFirstName" (camelCase). When fetching data from a PostgreSQL or MySQL database where columns are snake_case, you need to convert them to camelCase for your JavaScript/TypeScript frontend. The same input also shows PascalCase ("UserFirstName") for TypeScript interfaces and kebab-case ("user-first-name") for CSS classes or URL slugs.',
      },
      {
        scenario: 'Generating CSS class names and HTML data attributes from a component label',
        inputs: { input: 'Hero Section Title' },
        result: 'kebab-case: hero-section-title, camelCase: heroSectionTitle, snake_case: hero_section_title, PascalCase: HeroSectionTitle',
        insight: 'Enter a human-readable label like "Hero Section Title" to generate "hero-section-title" (kebab-case for CSS classes), "heroSectionTitle" (camelCase for JSX component props), and "hero_section_title" (snake_case for database columns or Python variables). This cross-format conversion from one input saves significant manual renaming effort when building full-stack features.',
      },
      {
        scenario: 'Converting a REST API response (camelCase) to Python data model fields (snake_case)',
        inputs: { input: 'customerBillingAddress' },
        result: 'snake_case: customer_billing_address, PascalCase: CustomerBillingAddress, camelCase: customerBillingAddress, kebab-case: customer-billing-address',
        insight: 'Enter a camelCase field name from a JavaScript API response to get "customer_billing_address" (snake_case) for your Python backend or database schema. Also shows PascalCase ("CustomerBillingAddress") for your Pydantic model class name. The converter handles the full round-trip: JavaScript -> Python -> database schema, keeping naming conventions consistent across the stack.',
      },
      {
        scenario: 'Standardizing user-entered form data to a consistent identifier format',
        inputs: { input: '  User-Entered   DATA_Field!!  ' },
        result: 'camelCase: userEnteredDataField, UPPER CASE: USER_ENTERED_DATA_FIELD, Title Case: User Entered Data Field',
        insight: 'Real user input is messy — spaces, mixed delimiters, special characters. Entering "  User-Entered   DATA_Field!!  " produces clean "userEnteredDataField" (camelCase), "USER_ENTERED_DATA_FIELD" (upper snake for constants), and "User Entered Data Field" (Title Case for display). Use this to sanitize and normalize free-form user input into consistent identifiers for your backend.',
      },
    ],
    proTips: [
      'Use UPPER CASE for environment variables and constants (REACT_APP_API_URL, MAX_RETRY_COUNT) — it is the universal convention across JavaScript, Python, Ruby, and shell scripts.',
      'When creating CSS class names, always use kebab-case (not camelCase). CSS is case-insensitive for selectors, but kebab-case is the conventional style and what frameworks like Tailwind CSS expect.',
      'For TypeScript interfaces and React component names, always use PascalCase. This distinguishes types/components from variables at a glance: UserProfile (type) vs userProfile (variable). Most ESLint rulesets enforce this.',
      'When designing REST APIs, pick one JSON key convention and stick with it across every endpoint. camelCase is most common in the JavaScript ecosystem; snake_case is standard in Python/Ruby communities. Mixing conventions within an API is confusing for consumers and often flags in code review.',
    ],
    limitations: [
      'The converter works with standard ASCII alphanumeric characters. Non-ASCII Unicode characters (accented letters, CJK characters, emoji) are treated as word separators in some conversion modes but may produce unexpected results.',
      'camelCase conversion from already-camelCase input strips the casing and starts fresh (e.g., "helloWorld" -> "hello_world" in snake_case) which loses the internal word boundary — this is a known limitation of plain-text case converters without semantic word boundary detection.',
      'The Start Case conversion capitalizes the first letter after any non-alphanumeric character, which may not match strict Title Case rules that lowercase articles and prepositions.',
      'For production code generation where preservation of original word boundaries matters, use AST-aware tools rather than string-based converters.',
    ],
    howToUse: [
      'Enter or paste the text you want to convert into the input field.',
      'The converter automatically displays results in all nine case formats as you type.',
      'Click the copy button next to any result to copy that formatted version to your clipboard.',
    ],
    quickReference: [
      { label: 'camelCase →', value: 'variableName, getUserData, calculateTotal' },
      { label: 'PascalCase →', value: 'ClassName, UserProfile, GetRequestHandler' },
      { label: 'snake_case →', value: 'user_name, db_table, http_response_code' },
      { label: 'kebab-case →', value: 'css-class, data-attribute, url-slug' },
    ],
    commonUses: [
      'Converting between naming conventions when switching programming languages',
      'Standardizing API response field names to match a project style guide',
      'Generating clean database column names from user-facing form labels',
      'Creating URL-friendly slugs and CSS class names from arbitrary text',
      'Formatting user input for consistent storage and display in applications',
    ],
    explanation:
      'String case conversion is a fundamental operation in software development, enabling developers to seamlessly transition between the diverse naming conventions used across programming languages, frameworks, and coding standards. Each case format serves a specific purpose in the ecosystem of code style. camelCase (also called lowerCamelCase) is the standard for variables and functions in JavaScript, Java, TypeScript, and Swift. PascalCase (also called UpperCamelCase) is reserved for class names, constructors, and React components across the same languages. snake_case dominates in Python and Ruby communities and is the standard for database column names in SQL, as underscores are more readable than alternatives in all-caps SQL queries. kebab-case is the web standard for CSS class names, HTML data attributes, and URL slugs because hyphens are URL-safe and visually clean. UPPER CASE is used for constants in many languages, environment variable names, and acronyms. The choice of naming convention often follows community standards: JavaScript ecosystem favors camelCase for variables and PascalCase for classes, Python\'s PEP 8 recommends snake_case for everything except classes (PascalCase), and Ruby follows similar conventions. CSS property names are always kebab-case (e.g., background-color, font-size). When moving between languages or contributing to projects with different style guides, a case converter saves significant time and eliminates manual errors. It also helps when generating code from external data sources, where you might need to convert database column names (snake_case) into JavaScript variable names (camelCase) or TypeScript interface properties.',
    faqs: [
      {
        question: 'What is the difference between Title Case and Start Case?',
        answer: 'Title Case typically capitalizes every word but may leave short articles, prepositions, and conjunctions lowercase depending on the style guide (e.g., APA, Chicago). Start Case (also called Initial Caps or Capital Case) capitalizes the first letter of every word without exceptions. Our Title Case implementation capitalizes all words, making it equivalent to Start Case for most practical purposes.',
      },
      {
        question: 'Why are there so many naming conventions?',
        answer: 'Different naming conventions evolved from different language communities and historical constraints. camelCase emerged from C and Java traditions where special characters were restricted in identifiers. snake_case was popularized by C\'s standard library and later by Python. kebab-case is natural for URLs and CSS where hyphens are valid. Each convention optimizes for readability in its specific context.',
      },
      {
        question: 'Which case format should I use for JSON keys?',
        answer: 'There is no official JSON standard for key naming, but camelCase is most common in JavaScript/TypeScript ecosystems, while snake_case is preferred in Python and Ruby communities. For public APIs, consistency matters more than the specific choice. Many APIs adopt camelCase for JSON keys to match JavaScript conventions.',
      },
      {
        question: 'What is the difference between camelCase and PascalCase?',
        answer: 'The only difference is the first character: camelCase starts with a lowercase letter (e.g., "userName"), while PascalCase starts with an uppercase letter (e.g., "UserName"). In practice, camelCase is used for variables and functions, while PascalCase is used for classes, types, and constructors.',
      },
      {
        question: 'Does the converter handle Unicode characters?',
        answer: 'The converter works with standard ASCII alphanumeric characters. Non-ASCII Unicode characters (like accented letters or CJK characters) are treated as word separators in some conversion modes, while in others they pass through. For best results with special characters, preprocess your input to standard ASCII.',
      },
    ],
    citations: [
      { title: 'Naming Convention (Programming) on Wikipedia', url: 'https://en.wikipedia.org/wiki/Naming_convention_(programming)' },
      { title: 'Coding Style Conventions on Google Style Guide', url: 'https://google.github.io/styleguide/' },
    ],
  },
};

export default stringCaseConverterConfig;
