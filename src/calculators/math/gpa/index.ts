import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import GPAPanel from './GPAPanel';
import GPACoursesInput from './GPACoursesInput';

import { calcGpa, neededGpa, scaleMax, GRADES, SCALES, type CourseInput, type ScaleId } from './gradeScale';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { D, type Dec } from '../../../utils/stats';

/**
 * Parse courses data from either a CSV-like string or JSON.
 * CSV format:  one course per line, comma-separated: name, grade, credits[, weight]
 * JSON format: array of objects with name, grade, credits, weight properties.
 * Rows left completely blank (no grade and no credits, the form starts with two) are skipped; a half-filled row
 * (grade without credits or vice versa) makes the whole list incomplete. Returns null if invalid or empty.
 */
function parseCourses(raw: string, scale: ScaleId): CourseInput[] | null {
  let rows: Array<Record<string, unknown>>;

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
      return { name: parts[0] || '', grade: parts[1] || '', credits: parts[2] || '', weight: parts[3] || 'Regular' };
    });
  }

  if (!Array.isArray(rows) || rows.length === 0) return null;

  const courses: CourseInput[] = [];

  for (const row of rows) {
    const name = String(row.name ?? '').trim();
    const grade = String(row.grade ?? '').trim();
    const creditsStr = String(row.credits ?? '').trim();
    const weight = String(row.weight ?? 'Regular');
    if (!grade && !creditsStr) continue; // untouched blank row

    // Strict number: "3abc" is not 3 credits.
    const credits = parseNumberStrict(creditsStr);
    if (!grade || isNaN(credits) || credits <= 0) return null;
    if (!Object.prototype.hasOwnProperty.call(SCALES[scale], grade)) return null;

    courses.push({ name, grade, credits, weight });
  }

  return courses.length > 0 ? courses : null;
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
      id: 'scale',
      label: 'Grade Point Scale',
      type: 'select',
      options: [
        { label: 'Standard 4.0 (A+ = A = 4.0, A− = 3.7, B+ = 3.3 …)', value: 'standard' },
        { label: 'Thirds (A+ = 4.33, A− = 3.67, B+ = 3.33 …)', value: 'thirds' },
      ],
      helpText: 'Schools differ on A+ and on thirds (4.33 / 3.67) versus tenths (3.7 / 3.3). Use the table in your school\'s grading policy.',
    },
    {
      id: 'courses',
      label: 'Courses',
      type: 'custom',
      required: true,
      component: GPACoursesInput,
      showWhen: (v) => v.mode !== 'target',
      helpText: 'Add each course with its name, letter grade, credits, and optional weight (Regular +0, Honors +0.5, AP/IB +1.0 grade points; no bonus on an F).',
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
    const scale: ScaleId = values.scale === 'thirds' ? 'thirds' : 'standard';
    const fix2 = (d: Dec) => d.toDecimalPlaces(2, D.ROUND_HALF_UP).toFixed(2);

    if (mode === 'calculate') {
      const raw = values.courses?.trim() || '';
      if (!raw || raw === '[]') return [];

      const courses = parseCourses(raw, scale);
      if (!courses) return [];

      // Exact decimal arithmetic (gradeScale.ts): credit-weighted Σ(points × credits) / Σ(credits).
      const result = calcGpa(courses, scale);
      if (!result) return [];
      const hasBonus = result.gpa.minus(result.unweightedGpa).abs().greaterThan(0);

      return [
        {
          id: 'gpa',
          label: hasBonus ? 'Weighted GPA' : 'GPA',
          value: fix2(result.gpa),
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'unweightedGpa',
          label: 'Unweighted GPA',
          value: fix2(result.unweightedGpa),
          highlight: false,
          color: 'neutral' as const,
        },
        {
          id: 'totalCredits',
          label: 'Total Credits',
          value: result.totalCredits.toFixed(),
          highlight: false,
          color: 'neutral' as const,
        },
        {
          id: 'totalGradePoints',
          label: 'Total Grade Points',
          value: fix2(result.totalWeightedPoints),
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
          value: JSON.stringify(result.rows),
          highlight: false,
          color: 'neutral' as const,
        },
        {
          id: '_scale',
          label: '',
          value: scale,
        },
      ];
    }

    // -- Target mode --
    const currentGPA = parseNumberStrict(values.currentGPA);
    const creditsCompleted = parseNumberStrict(values.creditsCompleted);
    const targetGPA = parseNumberStrict(values.targetGPA);
    const remainingCredits = parseNumberStrict(values.remainingCredits);

    // A brand-new student (0 credits completed, no GPA yet) is a valid starting point; negatives and blanks are not.
    if (
      isNaN(currentGPA) ||
      isNaN(creditsCompleted) ||
      isNaN(targetGPA) ||
      isNaN(remainingCredits) ||
      currentGPA < 0 ||
      creditsCompleted < 0 ||
      targetGPA < 0 ||
      remainingCredits <= 0
    ) {
      return [];
    }

    const need = neededGpa(currentGPA, creditsCompleted, targetGPA, remainingCredits, scale);
    const max = scaleMax(scale);
    const neededGrade = need.impossible
      ? `${GRADES[GRADES.length - 1]} in every course is not enough (maximum ${max.toFixed(2)})`
      : need.secured
        ? 'Any grade (target already secured)'
        : need.letter!;

    return [
      {
        id: 'neededGPA',
        label: 'GPA Needed',
        // A negative requirement just means "already secured"; show 0.00 rather than a negative GPA.
        value: need.secured ? '0.00' : fix2(need.needed),
        highlight: true,
        color: (need.impossible ? 'negative' : 'positive') as 'positive' | 'negative' | 'neutral',
        warning: need.impossible
          ? `You would need an average of ${fix2(need.needed)} on the remaining credits, above the maximum of ${max.toFixed(2)} on this scale. Add credits, lower the target, or check whether your remaining courses are weighted.`
          : undefined,
      },
      {
        id: 'neededGrade',
        label: 'Grade Needed Per Course',
        value: neededGrade,
        highlight: false,
        color: (need.impossible ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
      },
      {
        id: 'totalCredits',
        label: 'Total Credits (Current + Remaining)',
        value: `${creditsCompleted} + ${remainingCredits} = ${new D(creditsCompleted).plus(remainingCredits).toFixed()}`,
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
      {
        id: '_targetData',
        label: '',
        value: JSON.stringify({ needed: need.needed.toNumber(), max, impossible: need.impossible, secured: need.secured, current: currentGPA, target: targetGPA }),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GPAPanel, { values, results });
  },
  educational: {
    formula:
      'GPA = Σ[(Grade Points + Bonus) × Credits] / Σ(Credits) | Bonus: Honors +0.5, AP/IB +1.0 (never on an F)',
    formulaDescription:
      'GPA is a credit-weighted average: each course contributes its grade points multiplied by its credit hours, and the sum is divided by the total credits attempted. Unweighted GPA uses the 4.0 scale (A=4.0, B=3.0, C=2.0, D=1.0, F=0.0), while weighted GPA adds a bonus to the grade points of advanced coursework — commonly +0.5 for Honors and +1.0 for AP or International Baccalaureate (IB) classes, so an A in an AP class counts as 5.0. Schools differ on both the bonus and on the A+ value, so use the scale in your school\'s own policy.',
    variables: [
      {
        symbol: 'Grade Points',
        name: 'Grade Points',
        description:
          'Numeric value assigned to each letter grade. Standard scale: A+=A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, C-=1.7, D+=1.3, D=1.0, D-=0.7, F=0.0. The "thirds" scale (used by e.g. Arizona State and the University of Iowa) uses A+=4.33, A-=3.67, B+=3.33 and so on.',
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
      'Click "+ Add Course" to add more courses or the trash icon to remove one. Rows you leave completely blank are ignored; a row needs both a grade and its credits.',
      'For "Target GPA" mode, enter your current GPA, completed credits, target GPA, and remaining credits to find what grades you need in future courses.',
      'Pick the grade point scale your school uses (standard or thirds). Results show both your weighted GPA (with the +0.5 Honors / +1.0 AP/IB bonuses) and your unweighted GPA side by side.',
    ],
    explanation:
      'GPA (Grade Point Average) is the primary metric used by schools and colleges to evaluate academic performance. The unweighted GPA treats all courses equally on a 4.0 scale — an A in gym is worth the same as an A in AP Calculus. Weighted GPA recognizes that some courses demand more work by adding bonus points for advanced coursework. Colleges often recalculate GPA using their own formula, sometimes considering only core academic subjects (English, math, science, social studies, foreign language) and ignoring electives. The Target GPA mode is useful for planning: it tells you the minimum average grade you need in remaining courses to reach your goal. For example, if you have a 3.2 GPA after 60 credits and want a 3.5 after 120 total credits, you need to average a 3.8 in your remaining courses.',
    faqs: [
      {
        question: 'What is the difference between weighted and unweighted GPA?',
        answer:
          'Unweighted GPA treats all courses equally, using a 4.0 scale where an A is worth 4.0 regardless of difficulty. Weighted GPA gives extra credit for harder courses like AP, Honors, or IB — a B in an AP class is worth 4.0 (3.0 + 1.0) rather than 3.0 under the common +1.0 AP/IB scheme. Most high schools report both GPAs: unweighted for college admission comparisons and weighted for class rank. Colleges often recalculate GPA using their own formula to standardize across applicants from different high schools.',
      },
      {
        question: 'What is considered a good GPA?',
        answer:
          'A 3.0 (B average) is generally considered satisfactory, 3.5+ is considered strong, and 4.0+ (possible with weighted courses) is exceptional. Competitive colleges typically look for 3.5+ unweighted. However, course rigor matters too — a 3.5 with multiple AP courses is more impressive than a 4.0 with all easy classes. Different high schools also use different GPA scales (4.0, 5.0, 6.0, or 100-point), so college admissions officers contextualize GPA within the school profile.',
      },
      {
        question: 'How does the Target GPA calculator work?',
        answer:
          'The Target GPA calculator answers the question: "What grades do I need from here on out to reach my goal?" It takes your current GPA, the number of credits completed, your target GPA, and the number of remaining credits. The formula is: Required GPA = (Target × Total Credits − Current GPA × Completed Credits) / Remaining Credits. If the result exceeds the maximum of your scale (4.0 on the standard scale, 4.33 on the thirds scale), the target is not achievable with unweighted grades; if your remaining courses are weighted you can exceed it.',
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
        source: 'Duke University Registrar',
        title: 'Duke University Transcript Guide (grade point values)',
        url: 'https://registrar.duke.edu/sites/default/files/Duke_University_Transcript_Guide.pdf',
      },
      {
        source: 'Arizona State University Registrar',
        title: 'GPA calculator (A+ = 4.33 plus/minus scale)',
        url: 'https://registrar.asu.edu/grades-and-records/gpa-calculator',
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
