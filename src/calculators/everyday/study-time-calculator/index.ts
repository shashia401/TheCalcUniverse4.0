import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import StudyTimePanel from './StudyTimePanel';
import { studyPlan, studyHoursRows } from './studyMath';

const studyTimeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'totalPages',
      label: 'Total Pages',
      type: 'number',
      placeholder: '200',
      required: true,
      min: 1,
      max: 100000,
      helpText: 'Total number of pages you need to study',
    },
    {
      id: 'pagesPerHour',
      label: 'Pages Per Hour',
      type: 'number',
      min: 1,
      max: 1000,
      placeholder: '30',
      helpText: 'Your average reading pace for study material',
    },
    {
      id: 'sessionsPerWeek',
      label: 'Sessions Per Week',
      type: 'number',
      min: 1,
      max: 14,
      placeholder: '5',
      helpText: 'How many study sessions you can fit each week',
    },
    {
      id: 'sessionLength',
      label: 'Session Length',
      type: 'number',
      min: 15,
      max: 480,
      placeholder: '60',
      unit: 'minutes',
      helpText: 'Length of each study session in minutes',
    },
    {
      id: 'daysUntilExam',
      label: 'Days Until Exam',
      type: 'number',
      min: 1,
      max: 3650,
      placeholder: '14',
      helpText: 'Number of days until your exam or deadline',
    },
    {
      id: 'difficulty',
      label: 'Estimated Difficulty',
      type: 'select',
      options: [
        { label: 'Easy', value: 'Easy' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Hard', value: 'Hard' },
      ],
      helpText: 'Stretches reading time for note-taking and review: Easy x0.8, Medium x1.0, Hard x1.5 (rules of thumb, not measured values)',
    },
  ],
  calculate: (values) => {
    const p = studyPlan(values);
    if (!p) return [];
    const avail = Math.floor(p.sessionsAvailable + 1e-9);

    return [
      {
        id: 'totalHoursNeeded',
        label: 'Total Study Hours Needed',
        value: p.adjustedHours.toFixed(2),
        highlight: true,
        color: 'positive' as const,
        interpretation: `${p.totalPages} pages ÷ ${p.pagesPerHour} pages/hour = ${p.readingHours.toFixed(2)} h of reading × ${p.multiplier} (${p.difficulty.toLowerCase()} material).`,
      },
      { id: 'hoursPerWeek', label: 'Hours Needed Per Week', value: p.hoursPerWeek.toFixed(2), color: 'neutral' as const, interpretation: `${p.adjustedHours.toFixed(2)} h over ${p.weeksAvailable.toFixed(1)} weeks.` },
      { id: 'hoursPerSession', label: 'Hours Per Session', value: p.hoursPerSession.toFixed(2), color: 'neutral' as const },
      { id: 'weeklyCapacity', label: 'Weekly Study Capacity', value: p.weeklyCapacity.toFixed(2), color: 'neutral' as const },
      { id: 'sessionsNeeded', label: 'Sessions Needed / Available', value: `${p.sessionsNeeded} / ${avail}`, color: p.sessionsNeeded <= avail ? 'positive' as const : 'negative' as const, interpretation: 'Sessions of the chosen length needed to cover the total hours, versus the sessions that fit before the exam at your weekly rate.' },
      { id: 'daysUntilExam', label: 'Days Until Exam', value: p.daysUntilExam.toString(), color: 'neutral' as const },
      { id: 'recommendedDaily', label: 'Recommended Daily Study', value: p.dailyHours.toFixed(2), unit: 'hours/day', color: 'neutral' as const, interpretation: 'Average over all 7 days of the week.' },
      { id: 'difficultyMultiplier', label: 'Difficulty Multiplier', value: `${p.multiplier}x`, color: 'neutral' as const },
      {
        id: 'scheduleFeasible',
        label: 'Schedule Feasible?',
        value: p.feasible ? 'Yes' : 'No — more time or sessions needed',
        color: p.feasible ? 'positive' as const : 'negative' as const,
        highlight: true,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(StudyTimePanel, { values, results });
  },
  educational: {
    formula: 'Study Hours = (Total Pages / Pages Per Hour) x Difficulty Multiplier | Weekly Hours = Study Hours / Weeks Available',
    formulaDescription:
      'Estimating study time begins with calculating the total raw reading hours (total pages divided by your reading speed), then adjusting for material difficulty. A difficulty multiplier of 0.8x (Easy), 1.0x (Medium), or 1.5x (Hard) stretches the time to cover comprehension, note-taking, and review; these are rules of thumb, not measured values. The result is then divided by the number of weeks available to determine your required weekly study commitment, which is compared against your available session capacity.',
    diagram: {
      svg: '<svg viewBox=\'0 0 440 220\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><text x=\'220\' y=\'24\' font-family=\'system-ui,sans-serif\' font-size=\'13\' font-weight=\'700\' fill=\'var(--svg-1e293b)\' text-anchor=\'middle\'>Hours per week: needed vs available (example)</text><rect x=\'70\' y=\'60\' width=\'167\' height=\'30\' rx=\'4\' fill=\'var(--svg-3b82f6)\'/><text x=\'64\' y=\'80\' text-anchor=\'end\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>Needed</text><text x=\'244\' y=\'80\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>3.33 h</text><rect x=\'70\' y=\'110\' width=\'250\' height=\'30\' rx=\'4\' fill=\'var(--svg-22c55e)\'/><text x=\'64\' y=\'130\' text-anchor=\'end\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>Capacity</text><text x=\'327\' y=\'130\' font-size=\'11\' fill=\'var(--svg-1e293b)\'>5.00 h</text><text x=\'220\' y=\'180\' text-anchor=\'middle\' font-size=\'10\' fill=\'var(--svg-64748b)\'>200 pages / 30 pages per hour = 6.67 h over 2 weeks = 3.33 h/week; capacity = 5 sessions x 60 min</text></svg>',
      alt: 'Two bars: study hours needed per week (3.33) is below weekly study capacity (5.00) in the example',
      caption: 'The schedule is feasible when the hours needed per week do not exceed the weekly study capacity.',
    },
    variables: [
      { symbol: 'Total Pages', name: 'Material Volume', description: 'The total number of pages you need to study or read.' },
      { symbol: 'Reading Speed', name: 'Pages Per Hour', description: 'Your average reading pace, which varies by material density and your familiarity with the subject.' },
      { symbol: 'Study Time', name: 'Total Hours Required', description: 'The adjusted total hours needed after accounting for material difficulty and study efficiency.' },
    ],
    howToUse: [
      'Enter the total number of pages you need to study and your average reading speed in pages per hour.',
      'Set your weekly study schedule (sessions per week and session length in minutes) along with the days until your exam.',
      'Select the estimated difficulty level and click calculate to see your total required hours, weekly plan, and whether your schedule is feasible.',
    ],
    quickReference: [
      { label: 'Easy Difficulty', value: '0.8x multiplier' },
      { label: 'Medium Difficulty', value: '1.0x multiplier' },
      { label: 'Hard Difficulty', value: '1.5x multiplier' },
      ...studyHoursRows(),
    ],
    commonUses: [
      'Exam preparation — plan your study schedule leading up to final exams or standardized tests',
      'Semester planning — estimate total study time across multiple courses for the entire semester',
      'Certification study — allocate weekly study hours for professional certifications like PMP, CPA, or AWS',
    ],
    explanation:
      'Effective study time estimation starts from the volume of material, your reading speed and how demanding the material is. This calculator divides pages by your reading pace, scales the result by a difficulty multiplier (a rule of thumb for note-taking and review), and spreads it over the weeks before your exam to compare the weekly hours needed with the hours your sessions provide. Research on learning supports spreading study over time: a meta-analysis of distributed-practice studies (Cepeda et al. 2006) found that spaced study generally produces better retention than the same time spent in one block, and a review of study techniques (Dunlosky et al. 2013) rated distributed practice and practice testing as high-utility methods. Ebbinghaus\'s 1885 experiments on forgetting are the classic starting point for this idea. The Pomodoro Technique (focused intervals of about 25 minutes with short breaks, devised by Francesco Cirillo) is a popular way to structure sessions, though evidence for its specific intervals is limited. Consistency beats intensity: an hour a day for two weeks usually works better than fourteen hours in one weekend. Treat the result as a planning estimate and adjust it after your first week using the pace you actually achieve.',
    faqs: [
      {
        question: 'What is the optimal study session length?',
        answer: 'There is no single proven optimum; it depends on you and the task. Many students find 45-90 minute blocks with a short break workable, and the Pomodoro Technique uses 25-minute intervals with 5-minute breaks. Dense theory often suits shorter, focused blocks, while problem-solving or writing can sustain longer ones. Pick a length you can keep up consistently and adjust it from experience.',
      },
      {
        question: 'Does spaced study really beat cramming?',
        answer: 'Generally yes. A meta-analysis of distributed-practice studies (Cepeda et al. 2006) found better retention when study is spread over time than when the same time is massed in one block, and the benefit grows when the final test comes later. Exact retention percentages depend heavily on the material and the delay, so treat any specific figure you see quoted with caution. Reviewing material a few times at growing intervals (for example after a day, a few days, and a week or more) is a common, effective pattern.',
      },
      {
        question: 'How should I adjust my reading speed estimate for dense academic material?',
        answer: 'Reading speeds vary dramatically depending on material density and purpose. Light fiction or familiar topics can be read at 200-400 words per minute, but dense academic textbooks with equations, diagrams, and new terminology may slow you to 50-150 words per minute. As a practical rule of thumb, a typical textbook page (approximately 400-500 words) takes about 2-3 minutes for a first pass with comprehension, translating to roughly 20-30 pages per hour. However, if you are highlighting, annotating, or solving embedded problems, expect 5-15 pages per hour for dense STEM material. When estimating your reading speed, time yourself for 30 minutes on representative material, count the pages you covered (including time spent on diagrams, equations, and re-reading), and multiply by 2 to get pages per hour. Use this measured value rather than an optimistic guess — underestimating reading time is the most common study planning mistake.',
      },
      {
        question: 'What if my calculated study hours exceed my available capacity?',
        answer: 'When the calculator flags your schedule as infeasible, you have several evidence-based options. Increase your session length to the upper end of the effective range (90 minutes). Add a weekend session — each extra session adds its full length to your weekly capacity. Reduce the effective difficulty by seeking supplementary materials (video lectures, study guides, or a tutor) that present the same material more accessibly. Prioritize material by exam weighting — focus extra time on high-stakes topics and use lighter review for low-weight material. If none of these adjustments are sufficient, you may need to renegotiate non-essential commitments or accept that full coverage is not realistic. Acknowledging a capacity gap early and making strategic choices about what to prioritize is far better than attempting an impossible schedule, burning out, and retaining nothing.',
      },
      {
        question: 'How should I schedule breaks within and between study sessions?',
        answer: 'Short breaks help many people keep concentration. The Pomodoro Technique (25 minutes focus, 5 minutes break) is the best-known pattern; writing or design tasks may flow better with longer cycles such as 50/10. During breaks, stand up, stretch, hydrate or look out of a window; the 20-20-20 rule (every 20 minutes look at something 20 feet away for 20 seconds) is a common suggestion to reduce eye strain. For multi-subject days, interleaving subjects instead of blocking them is another technique studied in the learning literature. These are practical suggestions rather than precise prescriptions.',
      },
    ],
    citations: [
      { source: 'Cepeda et al. (2006), Distributed practice in verbal recall tasks: a review and quantitative synthesis. Psychological Bulletin 132(3)', url: 'https://doi.org/10.1037/0033-2909.132.3.354' },
      { source: 'Dunlosky et al. (2013), Improving students\' learning with effective learning techniques. Psychological Science in the Public Interest 14(1)', url: 'https://doi.org/10.1177/1529100612453266' },
    ],
  },
};

export default studyTimeConfig;
