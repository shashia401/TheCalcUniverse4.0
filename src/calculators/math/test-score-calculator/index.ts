import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import TestScoreCalculatorPanel from './TestScoreCalculatorPanel';

const testScoreConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'score',
      label: 'Score',
      type: 'number',
      min: 0,
      placeholder: '85',
      required: true,
    },
    {
      id: 'total',
      label: 'Total',
      type: 'number',
      min: 0,
      placeholder: '100',
      required: true,
    },
    {
      id: 'passingScore',
      label: 'Passing Score',
      type: 'number',
      min: 0,
      placeholder: '60',
      helpText: 'Minimum score to pass',
    },
    {
      id: 'numQuestions',
      label: 'Number of Questions',
      type: 'number',
      min: 1,
      placeholder: '20',
      helpText: 'Optional: total test questions',
    },
    {
      id: 'wrongAnswers',
      label: 'Wrong Answers',
      type: 'number',
      min: 0,
      placeholder: '3',
      helpText: 'Optional: number answered incorrectly',
    },
    {
      id: 'currentGpa',
      label: 'Current GPA',
      type: 'number',
      min: 0,
      max: 4,
      step: 0.1,
      placeholder: '3.0',
      helpText: 'Optional: for GPA impact',
    },
    {
      id: 'creditHours',
      label: 'Credit Hours',
      type: 'number',
      min: 0.5,
      max: 6,
      step: 0.5,
      placeholder: '3',
      showWhen: (v) => v.currentGpa !== '' && v.currentGpa !== undefined,
    },
  ],
  calculate: (values) => {
    const score = parseFloat(values.score);
    const total = parseFloat(values.total);

    if (isNaN(score) || isNaN(total) || score < 0 || total <= 0) {
      return [];
    }

    const percentage = Math.round((score / total) * 100 * 100) / 100;

    // Determine letter grade, description, and grade points
    let letterGrade: string;
    let gradeDescription: string;
    let gradePoints: number;

    if (percentage >= 90) {
      letterGrade = 'A';
      gradeDescription = 'Excellent';
      gradePoints = 4.0;
    } else if (percentage >= 80) {
      letterGrade = 'B';
      gradeDescription = 'Good';
      gradePoints = 3.0;
    } else if (percentage >= 70) {
      letterGrade = 'C';
      gradeDescription = 'Satisfactory';
      gradePoints = 2.0;
    } else if (percentage >= 60) {
      letterGrade = 'D';
      gradeDescription = 'Poor';
      gradePoints = 1.0;
    } else {
      letterGrade = 'F';
      gradeDescription = 'Failing';
      gradePoints = 0.0;
    }

    // Pass/Fail status based on passing score
    const passingScore = parseFloat(values.passingScore);
    const hasPassingScore = !isNaN(passingScore) && passingScore >= 0;

    // Build results
    const results: CalculatorResult[] = [
      {
        id: 'percentage',
        label: 'Percentage',
        value: `${percentage.toFixed(2)}%`,
        highlight: true,
        color: percentage >= 60 ? 'positive' : 'negative',
      },
      {
        id: 'letterGrade',
        label: 'Letter Grade',
        value: letterGrade,
        highlight: true,
      },
      {
        id: 'gradeDescription',
        label: 'Grade Description',
        value: gradeDescription,
      },
    ];

    if (hasPassingScore) {
      const passed = score >= passingScore;
      results.push({
        id: 'passFail',
        label: 'Status',
        value: passed ? 'Pass' : 'Fail',
        color: passed ? 'positive' : 'negative',
      });
    }

    // Correct answers analysis from wrong answers
    const numQuestions = parseFloat(values.numQuestions);
    const wrongAnswers = parseFloat(values.wrongAnswers);
    if (
      !isNaN(numQuestions) &&
      !isNaN(wrongAnswers) &&
      numQuestions > 0 &&
      wrongAnswers >= 0
    ) {
      const correct = numQuestions - wrongAnswers;
      const correctPercentage =
        Math.round((correct / numQuestions) * 100 * 100) / 100;
      results.push({
        id: 'correctAnswers',
        label: 'Correct Answers',
        value: `${correct} / ${numQuestions}`,
      });
      results.push({
        id: 'correctPercentage',
        label: 'Correct %',
        value: `${correctPercentage.toFixed(2)}%`,
      });
    }

    // GPA impact
    const currentGpa = parseFloat(values.currentGpa);
    const creditHours = parseFloat(values.creditHours);
    if (
      !isNaN(currentGpa) &&
      currentGpa >= 0 &&
      currentGpa <= 4 &&
      !isNaN(creditHours) &&
      creditHours > 0
    ) {
      const totalCredits = 30;
      const newGpa =
        (currentGpa * (totalCredits - creditHours) +
          gradePoints * creditHours) /
        totalCredits;
      const gpaChange = newGpa - currentGpa;
      results.push({
        id: 'newGpa',
        label: 'New GPA',
        value: newGpa.toFixed(2),
        highlight: true,
        color: gpaChange >= 0 ? 'positive' : 'negative',
      });
      results.push({
        id: 'gpaChange',
        label: 'GPA Change',
        value: `${gpaChange >= 0 ? '+' : ''}${gpaChange.toFixed(2)}`,
        color: gpaChange >= 0 ? 'positive' : 'negative',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TestScoreCalculatorPanel, { values, results });
  },
  educational: {
    formula: 'Percentage = (Score / Total) × 100',
    formulaDescription:
      'The test score percentage is calculated by dividing the score earned by the total possible points and multiplying by 100. Letter grades are then assigned based on standard percentage ranges: A (90-100%), B (80-89%), C (70-79%), D (60-69%), and F (below 60%). For GPA impact, each letter grade maps to a grade point value (A=4.0, B=3.0, C=2.0, D=1.0, F=0.0) which is used to recalculate the cumulative GPA.',
    variables: [
      {
        symbol: 'S',
        name: 'Score',
        description:
          'The number of points earned on the test or exam.',
      },
      {
        symbol: 'T',
        name: 'Total',
        description:
          'The maximum possible points on the test or exam.',
      },
      {
        symbol: 'P',
        name: 'Percentage',
        description:
          'The score expressed as a percentage of the total, calculated as (S / T) × 100.',
      },
      {
        symbol: 'G',
        name: 'Grade',
        description:
          'The letter grade assigned based on the percentage, using the standard 10-point scale (A, B, C, D, F).',
      },
    ],
    howToUse: [
      'Enter your test score (points earned) and the total possible points.',
      'Optionally enter a passing score to check whether you passed or failed.',
      'Provide the number of questions and wrong answers to see your correct count and percentage.',
      'Enter your current cumulative GPA and the course credit hours to see how this score affects your overall GPA.',
      'Review the results: percentage score, letter grade, pass/fail status, and GPA impact.',
    ],
    explanation:
      'Test score calculators are essential tools for students to understand their academic performance. The percentage score is the most basic metric — it normalizes your raw score against the total possible points so you can compare results across different tests. Letter grades provide a categorical assessment of performance, with the standard scale being A (90-100%), B (80-89%), C (70-79%), D (60-69%), and F (below 60%). Some institutions use plus/minus grading (e.g., B+, A-) for finer granularity. The GPA impact calculation shows how a single test score, when converted to grade points, affects your cumulative Grade Point Average. This is useful for understanding the relative weight of each assessment. Weighted grades assign different values to the same letter grade based on course difficulty (e.g., AP, Honors), while unweighted grades treat all courses equally. What-if analysis — testing different score scenarios — helps students set target grades and plan their study strategies.',
    quickReference: [
      { label: 'A (90-100%)', value: '4.0 GPA' },
      { label: 'B (80-89%)', value: '3.0 GPA' },
      { label: 'C (70-79%)', value: '2.0 GPA' },
      { label: 'D (60-69%)', value: '1.0 GPA' },
      { label: 'F (0-59%)', value: '0.0 GPA' },
    ],
    commonUses: [
      'Calculate your percentage score and letter grade after any exam, quiz, or assignment.',
      'Determine whether you passed or failed a test based on a custom passing threshold.',
      'Estimate how a test score will impact your cumulative GPA for academic planning.',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 440 300" xmlns="http://www.w3.org/2000/svg">\n' +
        '  <rect x="0" y="0" width="440" height="300" fill="transparent" rx="8"/>\n' +
        '  <text x="220" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor">Letter Grade Distribution</text>\n' +
        '  <text x="220" y="50" text-anchor="middle" font-size="12" fill="currentColor" opacity="0.6">Percentage Scale 0% - 100%</text>\n' +
        '\n' +
        '  <!-- Grade bar segments -->\n' +
        '  <rect x="20" y="80" width="88" height="40" fill="var(--svg-e74c3c)" rx="4"/>\n' +
        '  <rect x="108" y="80" width="44" height="40" fill="var(--svg-e67e22)" rx="0"/>\n' +
        '  <rect x="152" y="80" width="44" height="40" fill="var(--svg-f1c40f)" rx="0"/>\n' +
        '  <rect x="196" y="80" width="44" height="40" fill="var(--svg-2ecc71)" rx="0"/>\n' +
        '  <rect x="240" y="80" width="180" height="40" fill="var(--svg-27ae60)" rx="4"/>\n' +
        '\n' +
        '  <!-- Grade labels -->\n' +
        '  <text x="64" y="105" text-anchor="middle" font-size="18" font-weight="bold" fill="white">F</text>\n' +
        '  <text x="130" y="105" text-anchor="middle" font-size="18" font-weight="bold" fill="white">D</text>\n' +
        '  <text x="174" y="105" text-anchor="middle" font-size="18" font-weight="bold" fill="var(--svg-333333)">C</text>\n' +
        '  <text x="218" y="105" text-anchor="middle" font-size="18" font-weight="bold" fill="white">B</text>\n' +
        '  <text x="330" y="105" text-anchor="middle" font-size="18" font-weight="bold" fill="white">A</text>\n' +
        '\n' +
        '  <!-- Percentage labels -->\n' +
        '  <text x="20" y="145" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">0%</text>\n' +
        '  <text x="108" y="145" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">60%</text>\n' +
        '  <text x="152" y="145" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">70%</text>\n' +
        '  <text x="196" y="145" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">80%</text>\n' +
        '  <text x="240" y="145" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">90%</text>\n' +
        '  <text x="420" y="145" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">100%</text>\n' +
        '\n' +
        '  <!-- Tick marks -->\n' +
        '  <line x1="20" y1="135" x2="20" y2="140" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>\n' +
        '  <line x1="108" y1="135" x2="108" y2="140" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>\n' +
        '  <line x1="152" y1="135" x2="152" y2="140" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>\n' +
        '  <line x1="196" y1="135" x2="196" y2="140" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>\n' +
        '  <line x1="240" y1="135" x2="240" y2="140" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>\n' +
        '  <line x1="420" y1="135" x2="420" y2="140" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>\n' +
        '\n' +
        '  <!-- Description -->\n' +
        '  <text x="220" y="180" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.6">Grade distribution on the standard percentage scale</text>\n' +
        '\n' +
        '  <!-- Legend box -->\n' +
        '  <rect x="30" y="200" width="380" height="85" fill="transparent" stroke="currentColor" stroke-opacity="0.2" rx="4"/>\n' +
        '  <text x="220" y="220" text-anchor="middle" font-size="12" font-weight="bold" fill="currentColor">Grade Point Scale</text>\n' +
        '  <text x="60" y="242" font-size="11" fill="currentColor" opacity="0.8">A = 4.0 (Excellent)</text>\n' +
        '  <text x="250" y="242" font-size="11" fill="currentColor" opacity="0.8">B = 3.0 (Good)</text>\n' +
        '  <text x="60" y="260" font-size="11" fill="currentColor" opacity="0.8">C = 2.0 (Satisfactory)</text>\n' +
        '  <text x="250" y="260" font-size="11" fill="currentColor" opacity="0.8">D = 1.0 (Poor)</text>\n' +
        '  <text x="60" y="278" font-size="11" fill="currentColor" opacity="0.8">F = 0.0 (Failing)</text>\n' +
        '</svg>',
      alt: 'Letter grade distribution bar chart showing F (0-59%), D (60-69%), C (70-79%), B (80-89%), and A (90-100%) with corresponding GPA values.',
      caption:
        'Standard letter grade distribution on the percentage scale from 0% to 100%.',
    },
    faqs: [
      {
        question: 'What is a grading curve and how does it affect my score?',
        answer:
          'A grading curve adjusts raw scores to account for test difficulty. Curving can be absolute (e.g., adding a fixed number of points), relative (e.g., ranking students and assigning grades based on percentile), or formula-based (e.g., square root curve). If an instructor curves a test, your curved score may be higher than your raw percentage. Some curves only help students (floor curve), while others can also lower scores. Always check with your instructor whether a curve will be applied before relying on this calculator for a curved test.',
      },
      {
        question:
          'What is the difference between weighted and unweighted grades?',
        answer:
          'Unweighted grades treat all courses equally — an A is worth 4.0 regardless of whether the course is remedial or Advanced Placement. Weighted grades assign extra value to more challenging courses, such as AP, IB, or Honors, where an A might be worth 4.5 or 5.0. High schools often use weighted GPAs for class rank and unweighted for college applications. Colleges typically recalculate GPA using their own formula. This calculator uses the standard unweighted 4.0 scale (A=4.0, B=3.0, C=2.0, D=1.0, F=0.0).',
      },
      {
        question: 'How can I use this calculator for what-if analysis?',
        answer:
          'You can use this calculator to explore different scenarios: enter your actual scores to determine your current grade, then change the inputs to test hypothetical situations. For example, you can compare what happens if you score 85/100 vs. 95/100 on an exam. By adjusting the Current GPA and Credit Hours fields, you can see how different scores would impact your cumulative GPA. This helps with academic planning — you can calculate the minimum score needed to maintain a target GPA or to improve your overall average.',
      },
    ],
    citations: [
      {
        source: 'College Board - GPA Weighting',
        url: 'https://bigfuture.collegeboard.org/help-center/what-is-weighted-gpa',
      },
      {
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/math/statistics-probability',
      },
    ],
  },
};

export default testScoreConfig;
