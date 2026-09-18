import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import DiffPanel from './DiffPanel';
import { computeDiff } from './diffUtils';

const codeDiffConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'leftText',
      label: 'Original Text',
      type: 'textarea',
      required: false,
      defaultValue: 'function add(a, b) {\n  console.log(a + b);\n  return a + b;\n}\n\nlet x = 1;\nlet y = 2;\nlet z = 3;',
      placeholder: 'Paste original text here, or use the diff panel below to load files...',
      helpText: 'Enter text or use the panel below to load files via drag & drop or file picker.',
    },
    {
      id: 'rightText',
      label: 'Modified Text',
      type: 'textarea',
      required: false,
      defaultValue: 'function add(a, b) {\n  return a + b;\n}\n\nlet x = 1;\nlet y = 2;\nconst z = 3;\nconst sum = x + z;',
      placeholder: 'Paste modified text here...',
      helpText: 'Enter the modified version of your text',
    },
    {
      id: 'diffMode',
      label: 'Diff Mode',
      type: 'select',
      defaultValue: 'side-by-side',
      helpText: 'Choose between side-by-side comparison or unified diff view',
      options: [
        { label: 'Side by Side', value: 'side-by-side' },
        { label: 'Unified', value: 'unified' },
      ],
      showWhen: (values) => ((values.leftText || '') + (values.rightText || '')).trim().length > 0,
    },
  ],
  calculate: (values) => {
    const leftRaw = values.leftText || '';
    const rightRaw = values.rightText || '';

    if (!leftRaw && !rightRaw) return [{ id: '_empty', label: '', value: '' }];

    const leftLines = leftRaw ? leftRaw.split('\n') : [];
    const rightLines = rightRaw ? rightRaw.split('\n') : [];

    const diff = computeDiff(leftLines, rightLines);

    const additions = diff.rightLines.filter((l) => l.type === 'added').length;
    const deletions = diff.leftLines.filter((l) => l.type === 'removed').length;
    if (isNaN(additions) || isNaN(deletions)) return [];
    const totalChanges = additions + deletions;

    return [
      {
        id: 'additions',
        label: 'Additions',
        value: additions.toLocaleString(),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'deletions',
        label: 'Deletions',
        value: deletions.toLocaleString(),
        highlight: true,
        color: 'negative',
      },
      {
        id: 'totalChanges',
        label: 'Total Changes',
        value: totalChanges.toLocaleString(),
        highlight: true,
        color: 'neutral',
      },
      {
        id: '_diffData',
        label: '',
        value: JSON.stringify(diff),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DiffPanel, { values, results });
  },
  educational: {
    formula:
      'LCS(i, j) = 0 if i=0 or j=0\nLCS(i, j) = 1 + LCS(i-1, j-1) if left[i]=right[j]\nLCS(i, j) = max(LCS(i-1, j), LCS(i, j-1)) otherwise',
    diagram: {
      svg: '<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="20" y="20" width="220" height="260" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><rect x="260" y="20" width="220" height="260" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><text x="130" y="45" text-anchor="middle" font-size="13" fill="var(--svg-1e293b)" font-weight="bold">Original</text><text x="370" y="45" text-anchor="middle" font-size="13" fill="var(--svg-1e293b)" font-weight="bold">Modified</text><rect x="30" y="60" width="200" height="20" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="2"/><text x="38" y="74" font-size="11" fill="var(--svg-64748b)">1</text><text x="55" y="74" font-size="11" fill="var(--svg-1e293b)">const x = 1;</text><rect x="270" y="60" width="200" height="20" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="2"/><text x="278" y="74" font-size="11" fill="var(--svg-64748b)">1</text><text x="295" y="74" font-size="11" fill="var(--svg-1e293b)">const x = 1;</text><rect x="30" y="85" width="200" height="20" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="2"/><text x="38" y="99" font-size="11" fill="var(--svg-64748b)">2</text><text x="55" y="99" font-size="11" fill="var(--svg-1e293b)">let y = 2;</text><rect x="270" y="85" width="200" height="20" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="2"/><text x="278" y="99" font-size="11" fill="var(--svg-64748b)">2</text><text x="295" y="99" font-size="11" fill="var(--svg-1e293b)">let y = 2;</text><rect x="30" y="110" width="200" height="20" fill="var(--svg-fce7f3)" stroke="var(--svg-ef4444)" stroke-width="1" rx="2"/><text x="38" y="124" font-size="11" fill="var(--svg-64748b)">3</text><text x="55" y="124" font-size="11" fill="var(--svg-1e293b)">console.log(y);</text><rect x="30" y="135" width="200" height="20" fill="var(--svg-d1fae5)" stroke="var(--svg-22c55e)" stroke-width="1" rx="2"/><text x="38" y="149" font-size="11" fill="var(--svg-64748b)">4</text><text x="55" y="149" font-size="11" fill="var(--svg-1e293b)">let z = 3;</text><rect x="270" y="110" width="200" height="20" fill="var(--svg-d1fae5)" stroke="var(--svg-22c55e)" stroke-width="1" rx="2"/><text x="278" y="124" font-size="11" fill="var(--svg-64748b)">3</text><text x="295" y="124" font-size="11" fill="var(--svg-1e293b)">let z = 3;</text><rect x="270" y="135" width="200" height="20" fill="var(--svg-d1fae5)" stroke="var(--svg-22c55e)" stroke-width="1" rx="2"/><text x="278" y="149" font-size="11" fill="var(--svg-64748b)">4</text><text x="295" y="149" font-size="11" fill="var(--svg-1e293b)">const sum = x + z;</text><rect x="30" y="160" width="200" height="20" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="2"/><text x="38" y="174" font-size="11" fill="var(--svg-64748b)">5</text><text x="55" y="174" font-size="11" fill="var(--svg-1e293b)">function add(a,b) {</text><rect x="270" y="160" width="200" height="20" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="2"/><text x="278" y="174" font-size="11" fill="var(--svg-64748b)">5</text><text x="295" y="174" font-size="11" fill="var(--svg-1e293b)">function add(a,b) {</text><rect x="30" y="185" width="200" height="20" fill="var(--svg-fce7f3)" stroke="var(--svg-ef4444)" stroke-width="1" rx="2"/><text x="38" y="199" font-size="11" fill="var(--svg-64748b)">6</text><text x="55" y="199" font-size="11" fill="var(--svg-1e293b)">  return a + b;</text><rect x="270" y="185" width="200" height="20" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="2"/><text x="278" y="199" font-size="11" fill="var(--svg-64748b)">6</text><text x="295" y="199" font-size="11" fill="var(--svg-1e293b)">function add(a,b) {</text><rect x="30" y="210" width="200" height="20" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="2"/><text x="38" y="224" font-size="11" fill="var(--svg-64748b)">7</text><text x="55" y="224" font-size="11" fill="var(--svg-1e293b)">}</text><rect x="270" y="210" width="200" height="20" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="2"/><text x="278" y="224" font-size="11" fill="var(--svg-64748b)">7</text><text x="295" y="224" font-size="11" fill="var(--svg-1e293b)">}</text><line x1="245" y1="25" x2="255" y2="25" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="245" y1="275" x2="255" y2="275" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="20" y="280" font-size="10" fill="var(--svg-64748b)">Red = removed | Green = added/unchanged</text></svg>',
      alt: 'Side-by-side code diff showing added lines in green and removed lines in red with line numbers',
      caption: 'Visual line-by-line diff comparison showing additions (green) and deletions (red)',
    },
    formulaDescription:
      'The Code Diff Checker uses a Longest Common Subsequence (LCS) algorithm to compare two blocks of text line by line. It identifies which lines were added, removed, or remained unchanged between the original and modified versions, producing a clear visual diff with color-coded highlights for additions and deletions in a side-by-side or unified view.',
    variables: [
      {
        symbol: 'LCS',
        name: 'Longest Common Subsequence',
        description: 'The longest sequence of lines that appear in both texts in the same order, forming the basis for diff computation.',
      },
      {
        symbol: 'Additions',
        name: 'Added Lines',
        description: 'Lines present in the modified text but not in the original, representing new content.',
      },
      {
        symbol: 'Deletions',
        name: 'Removed Lines',
        description: 'Lines present in the original text but removed in the modified version.',
      },
      {
        symbol: 'Unchanged',
        name: 'Unchanged Lines',
        description: 'Lines that appear identically in both texts, forming the common context between versions.',
      },
    ],
    howToUse: [
      'Paste your original text or code in the left text area labeled "Original Text", or drag and drop a file using the diff panel below.',
      'Paste the modified version of your text in the right text area labeled "Modified Text", or load a second file for comparison.',
      'View the side-by-side diff result with green-highlighted additions and red-highlighted deletions, with line numbers on each side for precise reference.',
      'Check the summary counts at the top for total additions, deletions, and overall changes to quickly assess the scope of modifications.',
      'Switch between side-by-side and unified diff modes using the dropdown to choose the view that works best for your review workflow.',
    ],
    quickReference: [
      { label: 'Green highlight', value: 'Added or new lines in the modified version' },
      { label: 'Red highlight', value: 'Removed or deleted lines from the original' },
      { label: 'No highlight', value: 'Unchanged lines present in both versions' },
      { label: 'Line numbers', value: 'Sequential numbering on each side for easy reference' },
    ],
    commonUses: [
      'Reviewing code changes before committing to version control to catch unintended modifications.',
      'Comparing different versions of configuration files or documents across environments.',
      'Validating that only expected changes were made after code refactoring or automated transformations.',
      'Debugging merge conflicts by understanding what changed between branches in a visual format.',
      'Checking for unintended changes in generated or minified files before deployment.',
    ],
    explanation:
      `A code diff is a tool that visually compares two versions of text to highlight the differences between them. The Code Diff Checker uses the Longest Common Subsequence (LCS) algorithm, a classic dynamic programming approach that has been the foundation of diff tools since the early days of computing. The algorithm was originally developed by Eugene Myers in 1986 with his seminal paper "An O(ND) Difference Algorithm and Its Variations," which established the theoretical basis for modern diff tools. The algorithm works by building a table that tracks the longest sequence of lines common to both inputs while preserving their relative order. Once the LCS is computed, the algorithm backtracks through the table to reconstruct the edit operations needed to transform the original text into the modified text. Lines that are part of the LCS are marked as unchanged. Lines in the original that are skipped during the backtracking represent deletions (shown in red). Lines in the modified version that are not aligned with the original represent additions (shown in green). This approach provides an optimal diff because it minimizes the number of edit operations (additions plus deletions) needed to transform one text into the other. The algorithm runs in O(m x n) time where m and n are the numbers of lines in each text. For most code files under 1000 lines, this completes instantly. The LCS-based diff is the same algorithm used by popular tools like GNU diff (with refinements), git diff, and most modern code review tools. One important nuance is that the basic LCS algorithm matches lines exactly — two lines that differ only by whitespace or a single character are treated as completely different. More advanced diffs (like git's patience diff or histogram diff) add heuristics to produce cleaner results for code by preferring to match unique lines first or by detecting moved blocks.`,
    faqs: [
      {
        question: 'What is the difference between LCS and edit distance?',
        answer: 'LCS finds the longest common subsequence between two sequences. Edit distance (Levenshtein distance) measures the minimum number of single-character edits needed to transform one string into another. For line-based diffs, LCS is preferred because it produces the minimal number of line additions/deletions, which is more intuitive for code review.',
      },
      {
        question: 'Can the diff handle very large files?',
        answer: 'The LCS algorithm has O(m x n) time and space complexity. For files under 1000 lines (roughly 1 million cells in the DP table), the diff completes nearly instantly. For very large files (10,000+ lines), performance may degrade. Most code files in practice are well under this threshold.',
      },
      {
        question: 'Does the diff detect moved or reordered lines?',
        answer: 'The basic LCS algorithm does not detect moved blocks — a line that was moved to a new location will appear as a deletion in its old position and an addition in its new position. Advanced diff algorithms like "patience diff" or "histogram diff" can detect moved blocks, but the basic LCS approach is simpler and works well for most use cases.',
      },
      {
        question: 'How does a diff algorithm handle whitespace changes?',
        answer: 'The basic LCS algorithm treats lines that differ by even a single space as completely different lines. This means a change from let x = 1 to let x = 1 (trailing space added) would show as a deletion and addition. Git and most modern diff tools support --ignore-space-change and --ignore-all-space flags to handle this. This calculator uses exact line matching, so whitespace differences will appear as line changes.',
      },
      {
        question: 'What is a unified diff and how is it different from side-by-side?',
        answer: 'A unified diff (or "unidiff") shows the changes in a compact, inline format with context lines, traditionally used for patches and email-based code review. It uses + for added lines, - for removed lines, and @@ markers to indicate line number positions. Side-by-side diffs, like this calculator produces, show the original and modified versions next to each other in two columns — this format is preferred for visual code review tools (GitHub, GitLab, Bitbucket) because it makes it easier to see both versions at once.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A developer refactored a function to remove a console.log debug statement and changed a variable from let to const. They want to verify their diff shows exactly these intended changes and nothing else before committing.',
        inputs: {
          'Original Text': 'function add(a, b) {\n  console.log(a + b);\n  return a + b;\n}\n\nlet x = 1;\nlet y = 2;\nlet z = 3;',
          'Modified Text': 'function add(a, b) {\n  return a + b;\n}\n\nlet x = 1;\nlet y = 2;\nconst z = 3;\nconst sum = x + z;',
        },
        result: '2 additions, 2 deletions, 4 total changes',
        insight: 'The diff correctly identifies: (1) removal of the console.log line, (2) change from let z to const z, and (3) addition of the new const sum line. The unchanged lines (function declaration, let x, let y, closing brace) provide context to verify the changes are localized. Before committing, this diff would confirm that no unintended changes were introduced — a best practice for clean, atomic commits.',
      },
      {
        scenario: 'A configuration file was updated across environments. The dev version has 5 lines, and the production version has 7 lines with different database credentials and an added caching section. The user needs to understand exactly what differs between the two configs.',
        inputs: {
          'Original Text': 'DATABASE_HOST=localhost\nDATABASE_PORT=5432\nDATABASE_NAME=myapp_dev\nLOG_LEVEL=debug\nMAX_CONNECTIONS=10',
          'Modified Text': 'DATABASE_HOST=prod-db.example.com\nDATABASE_PORT=5432\nDATABASE_NAME=myapp_prod\nDATABASE_USER=app_user\nLOG_LEVEL=info\nMAX_CONNECTIONS=50\nCACHE_TTL=3600',
        },
        result: '4 additions, 4 deletions, 8 total changes',
        insight: 'The side-by-side diff highlights every environment-specific difference. Lines 1, 3, 5, and 6 differ between environments, while DATABASE_PORT=5432 is the only unchanged line serving as an anchor. The added lines (DATABASE_USER, CACHE_TTL) are clearly marked as additions in the modified version. This type of config diff is essential for DevOps workflows — it prevents configuration drift by making environment differences explicit and reviewable.',
      },
    ],
    proTips: [
      'Diff your code before every commit, even for small changes. Use git diff --cached to see exactly what is staged. This 10-second habit catches accidental deletions, leftover debug statements, and unintended whitespace changes before they enter the repository history.',
      'When reviewing a large diff (100+ lines), focus first on the file structure (which files changed) and then drill into files with the most changes. Ignore files with only whitespace or formatting changes.',
      'For configuration files (.env, config.json, docker-compose.yml), always diff before deploying to a new environment. A single misconfigured hostname or port can cause hard-to-diagnose runtime errors.',
      'Use diffs to verify refactoring correctness: make your refactor, diff against the original, and verify that only the structural changes you intended appear. If the diff shows unexpected changes to logic or data, the refactor introduced regressions.',
      'When pair programming or doing code review, diff mode is your shared reference point. Walk through changes top to bottom — the line numbers on each side give you a precise coordinate system for discussion.',
      'For SQL migration files, always diff the before and after schema. A missing column rename or an unintended DEFAULT value change can cause data loss. The diff makes schema evolution explicit and auditable.',
    ],
    limitations: [
      'This calculator uses exact line matching — two lines that differ by a single whitespace character are treated as completely different. For whitespace-insensitive comparison, use a specialized tool like git diff -w. When not to use: for checking formatting-only changes where whitespace differences should be ignored.',
      'The LCS algorithm has O(m x n) time and space complexity. For very large files (50,000+ lines), the diff computation may become slow or run out of memory. When not to use: for comparing very large generated files, minified bundles, or massive data files.',
      'Moved blocks of code are not detected — they appear as deletions and additions in separate locations. For detecting code movement (e.g., a function moved from one part of a file to another), use git diff --color-moved.',
      'The algorithm produces a minimal edit script but not necessarily the most human-readable one. Sometimes, the optimal mathematical diff does not align with how a human would describe the changes. When not to use: for producing patch files intended for human review of complex refactors.',
      'Binary files and non-text content cannot be meaningfully diffed with this tool. For binary file comparison, use a hex diff tool or a format-specific comparison (e.g., git diff with binary drivers for images, PDFs, or office documents).',
    ],
    citations: [
      { title: 'Diff Algorithm on Wikipedia', url: 'https://en.wikipedia.org/wiki/Diff' },
      { title: 'Longest Common Subsequence Problem', url: 'https://en.wikipedia.org/wiki/Longest_common_subsequence_problem' },
    ],
  },
};

export default codeDiffConfig;
