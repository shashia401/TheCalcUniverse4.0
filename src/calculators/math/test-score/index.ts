import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import TestScorePanel from './TestScorePanel';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { finalExamNeeded, fmtPct } from '../../../utils/finalGrade';

const testScoreConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'currentGrade',
      label: 'Current Grade (%)',
      type: 'number',
      placeholder: '85',
      min: 0,
      max: 100,
      step: 0.5,
      required: true,
      helpText: 'Your current overall grade in the class as a percentage.',
    },
    {
      id: 'desiredGrade',
      label: 'Desired Grade (%)',
      type: 'number',
      placeholder: '90',
      min: 0,
      max: 100,
      step: 0.5,
      required: true,
      helpText: 'The grade you want to have after the final exam.',
    },
    {
      id: 'examWeight',
      label: 'Final Exam Weight (%)',
      type: 'number',
      placeholder: '20',
      min: 0,
      max: 100,
      step: 1,
      required: true,
      helpText: 'How much the final exam counts toward your overall grade.',
    },
  ],
  calculate: (values) => {
    const current = parseNumberStrict(values.currentGrade);
    const desired = parseNumberStrict(values.desiredGrade);
    const weight = parseNumberStrict(values.examWeight);

    // One shared formula (src/utils/finalGrade.ts) for this calculator and the grade calculator.
    const exam = finalExamNeeded(current, desired, weight);
    if (!exam) return [];
    const { needed } = exam;

    const results: CalculatorResult[] = [
      {
        id: 'needed',
        label: 'Grade Needed on Final',
        value: fmtPct(needed),
        highlight: true,
        color: exam.status === 'impossible' ? 'negative' : needed <= current ? 'positive' : 'neutral',
      },
    ];

    if (exam.status === 'impossible') {
      results.push({
        id: 'impossible',
        label: 'Target Not Reachable',
        value: `Even scoring 100% on the final gives only ${fmtPct(exam.ceiling)} overall`,
        highlight: true,
        color: 'negative',
      });
    } else if (needed > 95) {
      results.push({
        id: 'warning',
        label: 'Warning',
        value: 'You need near-perfect score — consider adjusting your target',
        highlight: true,
        color: 'negative',
      });
    } else if (exam.status === 'secured') {
      results.push({
        id: 'note',
        label: 'Note',
        value: 'You already have the desired grade — no studying needed!',
        highlight: false,
        color: 'positive',
      });
    }

    if (exam.status === 'reachable') {
      // Scoring exactly `needed` lands exactly on the target by construction.
      results.push({
        id: 'projected',
        label: 'Projected Overall Grade',
        value: fmtPct(desired),
        highlight: false,
        color: 'neutral',
      });
    }
    results.push({
      id: 'bestPossible',
      label: 'Best Possible Overall Grade (100% on final)',
      value: fmtPct(exam.ceiling),
      color: 'neutral',
    });
    results.push({
      id: '_examData',
      label: '',
      value: JSON.stringify({ needed, status: exam.status, ceiling: exam.ceiling, desired }),
    });

    return results;
  },
  explainSteps: (values) => {
    const current = parseNumberStrict(values.currentGrade);
    const desired = parseNumberStrict(values.desiredGrade);
    const weight = parseNumberStrict(values.examWeight);
    const exam = finalExamNeeded(current, desired, weight);
    if (!exam) return [];
    const t = (x: number) => parseFloat(x.toFixed(10));
    const w = t(weight / 100);
    const keep = t(1 - weight / 100);
    const status =
      exam.status === 'secured'
        ? { label: 'You are already safe: even 0% on the final reaches the target', expr: `0% on the final gives ${fmtPct(exam.floor)} ≥ ${fmtPct(desired)}` }
        : exam.status === 'impossible'
          ? { label: 'The target is out of reach: even a perfect final falls short', expr: `100% on the final gives ${fmtPct(exam.ceiling)} < ${fmtPct(desired)}` }
          : { label: 'The overall grade you can end with runs from this range', expr: `${fmtPct(exam.floor)} (0% on the final) to ${fmtPct(exam.ceiling)} (100% on the final)` };
    return [
      { label: 'The overall grade mixes the graded work with the final exam', expr: `${fmtPct(desired)} = ${fmtPct(current)} × ${keep} + final × ${w}` },
      { label: 'Solve for the final exam score', expr: `final = (${fmtPct(desired)} − ${fmtPct(current)} × ${keep}) ÷ ${w} = ${fmtPct(exam.needed)}` },
      status,
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TestScorePanel, { values, results });
  },
  educational: {
    formula: 'Score Needed = (Desired - Current × (1 - Weight)) / Weight',
    diagram: { svg: '', alt: '', caption: '' },
    formulaDescription: 'This calculator uses the weighted grade formula to determine what score you need on your final exam to reach your target grade. The formula takes your current grade, weights it by everything except the final exam, then calculates what you need on the final to reach your desired overall grade.',
    variables: [
      { symbol: 'G', name: 'Current Grade', description: 'Your current overall grade before the final exam, as a percentage (0-100).' },
      { symbol: 'D', name: 'Desired Grade', description: 'The grade you want to achieve after the final exam is included.' },
      { symbol: 'w', name: 'Exam Weight', description: 'The percentage of your total grade that the final exam represents (0-100).' },
    ],
    howToUse: [
      'Enter your current grade in the class as a percentage.',
      'Enter the grade you want to achieve after the final.',
      'Enter how much the final exam counts toward your overall grade.',
      'The calculator will tell you the minimum score needed on the final.',
    ],
    explanation: 'Final exam grades are calculated using a weighted average formula. If your current grade is 85% and the final is worth 20% of your total grade, your current grade accounts for 80% of the total. To calculate what you need on the final, subtract the weighted current grade from your desired grade, then divide by the exam weight. If the result is over 100%, your target is mathematically impossible. If it is negative, you have already achieved your goal regardless of exam performance. Teachers often curve exams or offer extra credit, so even an impossible result is not the end of the world — talk to your instructor about options.',
    faqs: [
      { question: 'What if the calculator says my target is impossible?', answer: 'If your needed score exceeds 100%, your desired grade is mathematically impossible given your current grade and the exam weight. For example, with an 80% current grade and 90% desired with a 20% exam weight, you would need 130% on the final. Options: adjust your target grade, ask about extra credit, or request a curve from your instructor.' },
      { question: 'What if the result is negative?', answer: 'A negative needed score means you have already secured your desired grade regardless of exam performance. For example, if you have 95% and want 70% with a 20% exam weight, the needed score is (70 − 95×0.8)/0.2 = −30%, meaning you have more than enough points banked. You can still take the exam to improve your grade further.' },
      { question: 'How is the final grade calculated?', answer: 'Your final grade = (Current Grade × (1 - Exam Weight)) + (Exam Score × Exam Weight). For example, 85% current with a 20% final: 85 × 0.8 + 90 × 0.2 = 68 + 18 = 86% final grade. The calculator works backwards from your desired final grade to find the exam score needed.' },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Grading in Education', url: 'https://en.wikipedia.org/wiki/Grading_in_education' },
      { source: 'Khan Academy', url: 'https://www.khanacademy.org/math/statistics-probability' },
    ],
  },
};

export default testScoreConfig;
