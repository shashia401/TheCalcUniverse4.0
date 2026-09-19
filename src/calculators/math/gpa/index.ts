import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import GPAPanel from './GPAPanel';
import GPACoursesInput from './GPACoursesInput';

const GRADE_TO_GPA: Record<string, number> = {
  'A+': 4.33,
  'A': 4.0,
  'A-': 3.67,
  'B+': 3.33,
  'B': 3.0,
  'B-': 2.67,
  'C+': 2.33,
  'C': 2.0,
  'C-': 1.67,
  'D+': 1.33,
  'D': 1.0,
  'D-': 0.67,
  'F': 0.0,
};

const WEIGHT_ALIASES: Record<string, number> = {
  'regular': 1.0,
  'honors': 1.05,
  'honour': 1.05,
  'ap': 1.1,
  'ib': 1.1,
  'ap/ib': 1.1,
  'ap / ib': 1.1,
};

/**
 * Parse a weight type string into a multiplier.
 * Accepts: Regular, Honors, AP/IB, AP, IB (case-insensitive).
 */
function getWeightMultiplier(raw: string | undefined): number {
  if (!raw) return 1.0;
  const key = raw.trim().toLowerCase();
  return WEIGHT_ALIASES[key] ?? 1.0;
}

/**
 * Parse courses data from either a CSV-like string or JSON.
 * CSV format:  one course per line, comma-separated: name, grade, credits[, weight]
 * JSON format: array of objects with name, grade, credits, weight properties.
 * Returns null if invalid or empty.
 */
function parseCourses(
  raw: string,
): Array<{ name: string; grade: string; credits: number; weight: string }> | null {
  let rows: Array<{ name: string; grade: string; credits: string; weight: string }>;

  // Try JSON first
  try {
    rows = JSON.parse(raw);
  } catch {
    // Not JSON — try CSV lines
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return null;

    rows = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const row: { name: string; grade: string; credits: string; weight: string } = {
        name: parts[0] || '',
        grade: parts[1] || '',
        credits: parts[2] || '',
        weight: parts[3] || 'Regular',
      };
      return row;
    });
  }

  if (!Array.isArray(rows) || rows.length === 0) return null;

  const courses: Array<{
    name: string;
    grade: string;
    credits: number;
    weight: string;
  }> = [];

  for (const row of rows) {
    const name = (row.name || '').trim();
    const grade = (row.grade || '').trim();
    const creditsStr = (row.credits || '').trim();
    const weight = row.weight || 'Regular';
    const credits = parseFloat(creditsStr);

    if (!grade || isNaN(credits) || credits <= 0) return null;
    if (!(grade in GRADE_TO_GPA)) return null;

    courses.push({ name, grade, credits, weight });
  }

  return courses.length > 0 ? courses : null;
}

/**
 * Find the letter grade whose GPA value is the smallest
 * that is >= neededGPA. Returns null if no grade is high enough.
 */
function findClosestGrade(neededGPA: number): string | null {
  let bestGrade: string | null = null;
  let bestGPA = Infinity;

  for (const [grade, gpa] of Object.entries(GRADE_TO_GPA)) {
    if (gpa >= neededGPA && gpa < bestGPA) {
      bestGPA = gpa;
      bestGrade = grade;
    }
  }

  return bestGrade;
}

const gpaConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      required: true,
      options: [
        { label: 'Calculate GPA', value: 'calculate' },
        { label: 'Target GPA — what grades do I need?', value: 'target' },
      ],
    },
    {
      id: 'courses',
      label: 'Courses',
      type: 'custom',
      required: true,
      component: GPACoursesInput,
      helpText: 'Add each course with its name, letter grade, credits, and optional weight (Regular, Honors, or AP/IB).',
    },
    {
      id: 'currentGPA',
      label: 'Current GPA',
      type: 'number',
      step: 0.01,
      min: 0,
      max: 5,
      showWhen: (v) => v.mode === 'target',
      helpText: 'Your current cumulative GPA',
    },
    {
      id: 'creditsCompleted',
      label: 'Credits Completed',
      type: 'number',
      min: 0,
      step: 0.5,
      showWhen: (v) => v.mode === 'target',
      helpText: "Total credits you've earned so far",
    },
    {
      id: 'targetGPA',
      label: 'Target GPA',
      type: 'number',
      step: 0.01,
      min: 0,
      max: 5,
      showWhen: (v) => v.mode === 'target',
      helpText: 'The GPA you want to achieve',
    },
    {
      id: 'remainingCredits',
      label: 'Remaining Credits',
      type: 'number',
      min: 0,
      step: 0.5,
      showWhen: (v) => v.mode === 'target',
      helpText: 'Credits you still need to take',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'calculate';

    if (mode === 'calculate') {
      const raw = values.courses?.trim() || '';
      if (!raw || raw === '[]') return [];

      const courses = parseCourses(raw);
      if (!courses) return [];

      let totalGradePoints = 0;
      let totalUnweightedPoints = 0;
      let totalCredits = 0;

      const gpaData: Array<{
        name: string;
        grade: string;
        credits: number;
        points: number;
      }> = [];

      for (const c of courses) {
        const gpaValue = GRADE_TO_GPA[c.grade];
        const weight = getWeightMultiplier(c.weight);
        const weightedPoints = gpaValue * c.credits * weight;
        totalGradePoints += weightedPoints;
        totalUnweightedPoints += gpaValue * c.credits;
        totalCredits += c.credits;
        gpaData.push({
          name: c.name,
          grade: c.grade,
          credits: c.credits,
          points: parseFloat(weightedPoints.toFixed(2)),
        });
      }

      if (totalCredits === 0) return [];

      const gpa = totalGradePoints / totalCredits;
      const unweightedGpa = totalUnweightedPoints / totalCredits;

      return [
        {
          id: 'gpa',
          label: 'GPA',
          value: gpa.toFixed(2),
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'unweightedGpa',
          label: 'Unweighted GPA',
          value: unweightedGpa.toFixed(2),
          highlight: false,
          color: 'neutral' as const,
        },
        {
          id: 'totalCredits',
          label: 'Total Credits',
          value: String(totalCredits),
          highlight: false,
          color: 'neutral' as const,
        },
        {
          id: 'totalGradePoints',
          label: 'Total Grade Points',
          value: totalGradePoints.toFixed(2),
          highlight: false,
          color: 'neutral' as const,
        },
        {
          id: 'courseCount',
          label: 'Courses',
          value: String(courses.length),
          highlight: false,
          color: 'neutral' as const,
        },
        {
          id: '_gpaData',
          label: '',
          value: JSON.stringify(gpaData),
          highlight: false,
          color: 'neutral' as const,
        },
      ];
    }

    // -- Target mode --
    const currentGPA = parseFloat(values.currentGPA);
    const creditsCompleted = parseFloat(values.creditsCompleted);
    const targetGPA = parseFloat(values.targetGPA);
    const remainingCredits = parseFloat(values.remainingCredits);

    if (
      isNaN(currentGPA) ||
      isNaN(creditsCompleted) ||
      isNaN(targetGPA) ||
      isNaN(remainingCredits) ||
      currentGPA <= 0 ||
      creditsCompleted <= 0 ||
      targetGPA <= 0 ||
      remainingCredits <= 0
    ) {
      return [];
    }

    const neededGPA =
      (targetGPA * (creditsCompleted + remainingCredits) -
        currentGPA * creditsCompleted) /
      remainingCredits;

    const impossible = neededGPA > 4.33;
    let neededGrade: string;

    if (impossible) {
      neededGrade = 'A+ (impossible — need extra credit)';
    } else {
      const closest = findClosestGrade(neededGPA);
      neededGrade = closest ?? 'A+ (impossible — need extra credit)';
    }

    return [
      {
        id: 'neededGPA',
        label: 'GPA Needed',
        value: neededGPA.toFixed(2),
        highlight: true,
        color: (neededGPA > 4.33 ? 'negative' : 'positive') as 'positive' | 'negative' | 'neutral',
      },
      {
        id: 'neededGrade',
        label: 'Grade Needed Per Course',
        value: neededGrade,
        highlight: false,
        color: (impossible ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
      },
      {
        id: 'totalCredits',
        label: 'Total Credits (Current + Remaining)',
        value: `${creditsCompleted} + ${remainingCredits} = ${creditsCompleted + remainingCredits}`,
        highlight: false,
        color: 'neutral' as const,
      },
      {
        id: 'currentGpa',
        label: 'Current GPA',
        value: currentGPA.toFixed(2),
        highlight: false,
        color: 'neutral' as const,
      },
      {
        id: 'targetGpa',
        label: 'Target GPA',
        value: targetGPA.toFixed(2),
        highlight: false,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GPAPanel, { values, results });
  },
  educational: {
    formula:
      'GPA = Σ(GPA Value × Credits × Weight) / Σ(Credits) | Weighted GPA includes course difficulty',
    formulaDescription:
      'GPA is a weighted average where each course contributes its grade points multiplied by its credit hours. The sum of all weighted grade points is divided by the total credits attempted. Unweighted GPA uses the standard 4.0 scale (A=4.0, B=3.0, C=2.0, D=1.0, F=0.0), while weighted GPA adds extra points for advanced coursework like AP, Honors, or International Baccalaureate (IB) classes, typically adding 0.5 to 1.0 points per grade level.',
    variables: [
      {
        symbol: 'Grade Points',
        name: 'Grade Points',
        description:
          'Numeric value assigned to each letter grade. Standard unweighted: A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, D=1.0, F=0.0.',
      },
      {
        symbol: 'Credits',
        name: 'Credits',
        description: 'The weight or units assigned to each course. A typical semester course is 3 credits, while a lab might be 1 credit.',
      },
      {
        symbol: 'GPA & Weighted',
        name: 'GPA & Weighted GPA',
        description:
          'GPA is the weighted average of grade points across all courses, typically on a 4.0 scale. Weighted GPA adds extra points (+0.5 to +1.0) for advanced coursework like AP/IB to reflect increased rigor.',
      },
    ],
    howToUse: [
      'Select "Calculate GPA" mode and add your courses using the dynamic form. For each course, enter the course name (optional), letter grade, credit hours, and optional weight (Regular, Honors, or AP/IB).',
      'Click "+ Add Course" to add more courses or the trash icon to remove one. A minimum of 2 courses is required.',
      'For "Target GPA" mode, enter your current GPA, completed credits, target GPA, and remaining credits to find what grades you need in future courses.',
      'Results show both your weighted GPA (with Honors/AP/IB bonuses) and unweighted GPA (standard 4.0 scale) side by side.',
    ],
    explanation:
      'GPA (Grade Point Average) is the primary metric used by schools and colleges to evaluate academic performance. The unweighted GPA treats all courses equally on a 4.0 scale — an A in gym is worth the same as an A in AP Calculus. Weighted GPA recognizes that some courses demand more work by adding bonus points for advanced coursework. Colleges often recalculate GPA using their own formula, sometimes considering only core academic subjects (English, math, science, social studies, foreign language) and ignoring electives. The Target GPA mode is useful for planning: it tells you the minimum average grade you need in remaining courses to reach your goal. For example, if you have a 3.2 GPA after 60 credits and want a 3.5 after 120 total credits, you need to average a 3.8 in your remaining courses.',
    faqs: [
      {
        question: 'What is the difference between weighted and unweighted GPA?',
        answer:
          'Unweighted GPA treats all courses equally, using a 4.0 scale where an A is worth 4.0 regardless of difficulty. Weighted GPA gives extra credit for harder courses like AP, Honors, or IB — a B in an AP class might be worth 3.66 rather than 3.0. Most high schools report both GPAs: unweighted for college admission comparisons and weighted for class rank. Colleges often recalculate GPA using their own formula to standardize across applicants from different high schools.',
      },
      {
        question: 'What is considered a good GPA?',
        answer:
          'A 3.0 (B average) is generally considered satisfactory, 3.5+ is considered strong, and 4.0+ (possible with weighted courses) is exceptional. Competitive colleges typically look for 3.5+ unweighted. However, course rigor matters too — a 3.5 with multiple AP courses is more impressive than a 4.0 with all easy classes. Different high schools also use different GPA scales (4.0, 5.0, 6.0, or 100-point), so college admissions officers contextualize GPA within the school profile.',
      },
      {
        question: 'How does the Target GPA calculator work?',
        answer:
          'The Target GPA calculator answers the question: "What grades do I need from here on out to reach my goal?" It takes your current GPA, the number of credits completed, your target GPA, and the number of remaining credits. The formula is: Required GPA = (Target × Total Credits − Current GPA × Completed Credits) / Remaining Credits. If the result exceeds 4.0 (or 5.0 for weighted), the target is not achievable.',
      },
      {
        question: 'Do colleges look at weighted or unweighted GPA?',
        answer:
          'Most colleges consider both. Unweighted GPA provides a standardized comparison across all applicants. Weighted GPA and course rigor (how many AP, IB, Honors, and dual-enrollment courses you took) show academic ambition and preparation for college-level work. Some colleges recalculate GPA by assigning their own values to letter grades and considering only core academic subjects.',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Unweighted GPA Scale 0.0–4.0</text><rect x="15" y="35" width="290" height="28" rx="14" fill="var(--svg-eeeeee)"/><rect x="15" y="35" width="58" height="28" rx="14" fill="var(--svg-ef4444)" opacity="0.7"/><rect x="73" y="35" width="44" height="28" fill="var(--svg-f59e0b)" opacity="0.7"/><rect x="117" y="35" width="72" height="28" fill="var(--svg-eab308)" opacity="0.6"/><rect x="189" y="35" width="58" height="28" fill="var(--svg-3b82f6)" opacity="0.4"/><rect x="247" y="35" width="58" height="28" rx="14" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="44" y="52" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">F</text><text x="95" y="52" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">D</text><text x="153" y="52" text-anchor="middle" font-size="10" fill="var(--svg-333333)" font-weight="bold">C</text><text x="218" y="52" text-anchor="middle" font-size="10" fill="var(--svg-333333)" font-weight="bold">B</text><text x="276" y="52" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">A</text><text x="15" y="78" font-size="9" fill="var(--svg-888888)">0.0</text><text x="73" y="78" font-size="9" fill="var(--svg-888888)">1.0</text><text x="160" y="78" text-anchor="middle" font-size="9" fill="var(--svg-888888)">2.0</text><text x="247" y="78" font-size="9" fill="var(--svg-888888)">3.0</text><text x="305" y="78" font-size="9" fill="var(--svg-888888)">4.0</text><text x="160" y="108" text-anchor="middle" font-size="11" fill="var(--svg-555555)">Weighted GPA adds bonus for advanced courses</text><rect x="20" y="118" width="130" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.3"/><text x="85" y="133" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Standard: 4.0 max</text><rect x="170" y="118" width="130" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="235" y="133" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">Weighted: 5.0+ max</text><text x="160" y="168" text-anchor="middle" font-size="10" fill="var(--svg-555555)">GPA = Σ(Grade Points × Credits) / Σ(Credits)</text><text x="160" y="190" text-anchor="middle" font-size="9" fill="var(--svg-888888)">AP/IB/Honors add 0.5–1.0 for weighted GPA</text></svg>',
      alt: 'Unweighted GPA scale bar from 0.0 to 4.0 with letter grade ranges F through A',
      caption: 'GPA is a weighted average of grade points across all courses, on a 4.0 scale (unweighted) or up to 5.0+ (weighted).',
    },
    citations: [
      {
        source: 'College Board',
        title: 'How to Calculate Your GPA',
        url: 'https://bigfuture.collegeboard.org/plan-for-college/college-basics/how-to-calculate-gpa',
      },
      {
        source: 'National Center for Education Statistics',
        title: 'High School Transcript Study — GPA Methodology',
        url: 'https://nces.ed.gov/surveys/hst/',
      },
      {
        source: 'Wikipedia',
        title: 'Grading in Education',
        url: 'https://en.wikipedia.org/wiki/Grading_in_education',
      },
    ],
  },
};

export default gpaConfig;
