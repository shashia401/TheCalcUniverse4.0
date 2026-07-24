import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import GradePanel from './GradePanel';

const gradeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'currentGrade',
      label: 'Current Grade (%)',
      type: 'number',
      min: 0,
      max: 100,
      step: 0.1,
      placeholder: '85',
      required: true,
      helpText: 'Enter your current grade percentage before the final exam',
    },
    {
      id: 'desiredGrade',
      label: 'Desired Overall Grade (%)',
      type: 'number',
      min: 0,
      max: 100,
      step: 0.1,
      placeholder: '90',
      required: true,
      helpText: 'Enter the overall grade percentage you want to achieve',
    },
    {
      id: 'examWeight',
      label: 'Final Exam Weight (%)',
      type: 'number',
      min: 0,
      max: 100,
      step: 0.1,
      placeholder: '20',
      required: true,
      helpText: 'Enter the percentage weight of the final exam',
    },
  ],
  calculate: (values) => {
    const currentGrade = parseFloat(values.currentGrade);
    const desiredGrade = parseFloat(values.desiredGrade);
    const examWeight = parseFloat(values.examWeight);

    if (
      isNaN(currentGrade) ||
      isNaN(desiredGrade) ||
      isNaN(examWeight) ||
      examWeight <= 0 ||
      currentGrade < 0 ||
      desiredGrade <= 0
    ) {
      return [];
    }

    // If the student has already reached their target, no exam effort needed.
    let needed: number;
    if (currentGrade >= desiredGrade) {
      needed = 0;
    } else {
      needed =
        (desiredGrade - currentGrade * (1 - examWeight / 100)) /
        (examWeight / 100);
    }

    // Round to 2 decimal places
    needed = Math.round(needed * 100) / 100;

    let status: string;
    let color: 'positive' | 'negative' | 'neutral';

    if (needed <= 0) {
      status = "You've already achieved your target!";
      color = 'positive';
    } else if (needed <= currentGrade) {
      status = 'Easily achievable. Study as planned.';
      color = 'positive';
    } else if (needed <= 100) {
      status = `You need ${needed.toFixed(1)}% on the final exam.`;
      color = 'neutral';
    } else {
      status = 'Likely impossible without extra credit.';
      color = 'negative';
    }

    return [
      {
        id: 'neededGrade',
        label: 'Grade Needed on Final',
        value:
          needed <= 0
            ? '0%'
            : needed > 100
              ? `${needed.toFixed(1)}%`
              : `${needed.toFixed(1)}%`,
        highlight: true,
        color,
        warning:
          needed > 100
            ? `A ${desiredGrade}% target isn't reachable: you'd need ${needed.toFixed(1)}% on the final (over 100%). Consider extra credit or a lower target.`
            : undefined,
      },
      {
        id: 'status',
        label: 'Outlook',
        value: status,
      },
      {
        id: 'currentGrade',
        label: 'Current Grade',
        value: `${currentGrade}%`,
      },
      {
        id: 'desiredGrade',
        label: 'Desired Grade',
        value: `${desiredGrade}%`,
      },
      {
        id: 'examWeight',
        label: 'Final Exam Weight',
        value: `${examWeight}%`,
      },
      {
        id: '_gradeData',
        label: 'Grade Data',
        value: JSON.stringify({
          currentGrade,
          desiredGrade,
          examWeight,
          needed,
        }),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GradePanel, { values, results });
  },
  educational: {
    formula:
      'Grade Needed = (Desired − Current × (1 − Weight)) / Weight',
    formulaDescription:
      'The final exam grade needed to reach a target overall grade depends on your current standing and the exam weight. This formula isolates the required exam score by first determining how much of the final grade is already determined by your current work (Current × (1 − Weight)), subtracting that from your desired grade, and then dividing by the exam weight. If the result exceeds 100%, the target is mathematically impossible without extra credit.',
    variables: [
      {
        symbol: 'Current',
        name: 'Current Grade',
        description:
          'Your current grade in the class before the final exam, expressed as a percentage. This should reflect all graded work so far — assignments, quizzes, midterms, and any other assessments.',
      },
      {
        symbol: 'Desired',
        name: 'Desired Grade',
        description:
          'The overall grade you want to achieve in the class after the final exam is factored in. Common targets are 90% (A-), 80% (B-), or 70% (C-).',
      },
      {
        symbol: 'Weight',
        name: 'Exam Weight',
        description:
          'The percentage of your overall grade that the final exam represents. For example, if the final is worth 20% of your grade, enter 20. Typical exam weights range from 10% to 50%.',
      },
    ],
    howToUse: [
      'Enter your current grade percentage in the class before the final exam (e.g., 85 for 85%).',
      'Enter the overall grade you want to achieve after the final exam is included (e.g., 90 for 90%).',
      'Enter the weight of the final exam as a percentage of your total grade (e.g., 20 for 20%).',
      'The calculator shows the minimum score you need on the final to reach your target grade.',
    ],
    explanation:
      'Final exam grade calculators are essential tools for students planning their study strategy. The formula used here determines the minimum score needed on a final exam to achieve a desired overall course grade. It works by calculating how much of the final grade is already determined by your current performance (current grade times the weight of non-final work), subtracting that from your target, then dividing by the final exam weight. This gives you the exact percentage needed on the final. If the result exceeds 100%, the target is mathematically impossible without extra credit. If it is negative, you have already secured your target grade regardless of final exam performance. Students can use this calculator to make strategic decisions about where to focus their study time by comparing the required final exam scores across different target grades.',
    faqs: [
      {
        question: 'How does the final exam affect my grade?',
        answer:
          'The final exam contributes a percentage of your overall grade equal to its weight. If the final is worth 20% of your grade, then the other 80% is determined by your current work. This means a strong current grade reduces the pressure on the final, but a low current grade means the final carries more weight in determining your outcome. For example, with a current grade of 85% and a final worth 20%, even scoring 100% on the final can only raise your grade to 88%. Conversely, a current grade of 60% would require a 90% on a 40%-weight final to reach a C (70%).',
      },
      {
        question: 'What if the needed grade is over 100%?',
        answer:
          'A needed grade above 100% means it is mathematically impossible to reach your target with just the final exam. You may want to ask your instructor about extra credit opportunities, curve adjustments, or dropping the lowest assignment. Consider whether a slightly lower target grade is acceptable — even small changes can make a big difference. For example, aiming for a B+ (87%) instead of an A- (90%) might reduce the required final exam score by 15 percentage points.',
      },
      {
        question: 'What if the needed grade is negative?',
        answer:
          'A negative required grade means you have already secured your target grade before taking the final. Your current grade is so high that even scoring 0% on the final would still leave you at or above your target. In this case, you can safely skip the final or take it lightly, though some courses require minimum final exam performance regardless.',
      },
      {
        question: 'Does this work for weighted grading systems with categories?',
        answer:
          'This calculator assumes a simple final exam weight model. For courses with multiple weighted categories (homework 20%, quizzes 15%, midterm 25%, final 40%), you need to first calculate your current weighted average, then use that as your Current Grade input. The exam weight would be the remaining category weight. For complex multi-category grading, consider using a dedicated grade calculator that handles all categories.',
      },
      {
        question: 'Can I use this for multiple final exams?',
        answer:
          'If you have multiple finals, you can use this calculator by combining their weights into one total. For example, if you have a written final worth 15% and a practical final worth 10%, enter 25% as the exam weight. The calculator will show what overall score you need across both exams. For per-exam targets, calculate each exam separately using its individual weight.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Grading in Education', url: 'https://en.wikipedia.org/wiki/Grading_in_education' },
      { source: 'College Board - GPA Weighting', url: 'https://bigfuture.collegeboard.org/help-center/what-is-weighted-gpa' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Final Exam Grade Needed</text><text x="15" y="48" font-size="11" fill="var(--svg-555555)">Current Grade</text><rect x="15" y="54" width="200" height="18" rx="4" fill="var(--svg-3b82f6)"/><text x="225" y="68" font-size="11" fill="var(--svg-333333)" font-weight="bold">85%</text><text x="15" y="96" font-size="11" fill="var(--svg-555555)">Contribution (1  −  Weight)</text><rect x="15" y="102" width="160" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.4"/><text x="225" y="116" font-size="11" fill="var(--svg-333333)" font-weight="bold">68%</text><text x="15" y="148" font-size="11" fill="var(--svg-ef4444)">Desired Grade</text><line x1="15" y1="158" x2="220" y2="158" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="4"/><polygon points="220,153 230,158 220,163" fill="var(--svg-ef4444)"/><text x="242" y="162" font-size="11" fill="var(--svg-ef4444)" font-weight="bold">90%</text><rect x="10" y="172" width="300" height="22" rx="4" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="160" y="187" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Needed = (Desired  −  Current×(1−Weight)) / Weight</text></svg>',
      alt: 'Grade needed calculation showing current grade, exam weight, and desired grade target',
      caption: 'The final exam grade needed depends on your current grade and the exam weight percentage.',
    },
  },
};

export default gradeConfig;
