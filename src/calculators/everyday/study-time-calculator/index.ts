import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import StudyTimePanel from './StudyTimePanel';

const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  Easy: 0.8,
  Medium: 1.0,
  Hard: 1.5,
};

const studyTimeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'totalPages',
      label: 'Total Pages',
      type: 'number',
      placeholder: '200',
      required: true,
      min: 1,
      helpText: 'Total number of pages you need to study',
    },
    {
      id: 'pagesPerHour',
      label: 'Pages Per Hour',
      type: 'number',
      min: 1,
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
      helpText: 'Affects comprehension time',
    },
  ],
  calculate: (values) => {
    const totalPages = parseFloat(values.totalPages);
    const pagesPerHour = parseFloat(values.pagesPerHour);
    const sessionsPerWeek = parseFloat(values.sessionsPerWeek);
    const sessionLength = parseFloat(values.sessionLength);
    const daysUntilExam = parseFloat(values.daysUntilExam);
    const difficulty = values.difficulty || 'Medium';

    if (isNaN(totalPages) || isNaN(pagesPerHour)) return [];
    if (isNaN(sessionsPerWeek) || isNaN(sessionLength) || isNaN(daysUntilExam)) return [];
    if (totalPages <= 0 || pagesPerHour <= 0) return [];

    const totalHours = totalPages / pagesPerHour;
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;
    const adjustedHours = totalHours * difficultyMultiplier;
    const weeksAvailable = daysUntilExam / 7;
    const hoursPerWeek = adjustedHours / weeksAvailable;
    const weeklyCapacity = sessionsPerWeek * (sessionLength / 60);
    const hoursPerSession = hoursPerWeek / sessionsPerWeek;
    const recommendedDaily = hoursPerWeek / 7;

    const feasible = hoursPerWeek <= weeklyCapacity;

    const results = [
      {
        id: 'totalHoursNeeded',
        label: 'Total Study Hours Needed',
        value: adjustedHours.toFixed(2),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'hoursPerWeek',
        label: 'Hours Needed Per Week',
        value: hoursPerWeek.toFixed(2),
        color: 'neutral' as const,
      },
      {
        id: 'hoursPerSession',
        label: 'Hours Per Session',
        value: hoursPerSession.toFixed(2),
        color: 'neutral' as const,
      },
      {
        id: 'weeklyCapacity',
        label: 'Weekly Study Capacity',
        value: weeklyCapacity.toFixed(2),
        color: 'neutral' as const,
      },
      {
        id: 'daysUntilExam',
        label: 'Days Until Exam',
        value: daysUntilExam.toString(),
        color: 'neutral' as const,
      },
      {
        id: 'recommendedDaily',
        label: 'Recommended Daily Study',
        value: recommendedDaily.toFixed(2),
        unit: 'hours/day',
        color: 'neutral' as const,
      },
      {
        id: 'difficultyMultiplier',
        label: 'Difficulty Multiplier',
        value: `${difficultyMultiplier}x`,
        color: 'neutral' as const,
      },
      {
        id: 'scheduleFeasible',
        label: 'Schedule Feasible?',
        value: feasible ? 'Yes' : 'No — more time or sessions needed',
        color: feasible ? 'positive' as const : 'negative' as const,
        highlight: true,
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(StudyTimePanel, { values, results });
  },
  educational: {
    formula: 'Study Hours = (Total Pages / Pages Per Hour) x Difficulty Multiplier | Weekly Hours = Study Hours / Weeks Available',
    formulaDescription:
      'Estimating study time begins with calculating the total raw reading hours (total pages divided by your reading speed), then adjusting for material difficulty. A difficulty multiplier of 0.8x (Easy), 1.0x (Medium), or 1.5x (Hard) accounts for the extra time needed for comprehension, note-taking, and review. The result is then divided by the number of weeks available to determine your required weekly study commitment, which is compared against your available session capacity.',
    diagram: {
      svg: '<svg viewBox="0 0 440 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="0" y="0" width="440" height="300" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="28" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="var(--svg-1e293b)" text-anchor="middle">Weekly Study Schedule — Hours Per Day</text><!-- Bar chart --><rect x="40" y="220" width="45" height="0" fill="var(--svg-3b82f6)" rx="3"/><text x="62" y="270" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Mon</text><rect x="100" y="220" width="45" height="0" fill="var(--svg-3b82f6)" rx="3"/><text x="122" y="270" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Tue</text><rect x="160" y="220" width="45" height="0" fill="var(--svg-3b82f6)" rx="3"/><text x="182" y="270" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Wed</text><rect x="220" y="220" width="45" height="0" fill="var(--svg-3b82f6)" rx="3"/><text x="242" y="270" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Thu</text><rect x="280" y="220" width="45" height="0" fill="var(--svg-3b82f6)" rx="3"/><text x="302" y="270" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Fri</text><rect x="340" y="220" width="45" height="0" fill="var(--svg-f59e0b)" rx="3"/><text x="362" y="270" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Sat</text><rect x="390" y="220" width="45" height="0" fill="var(--svg-f59e0b)" rx="3"/><text x="412" y="270" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Sun</text><!-- Y-axis label --><text x="15" y="140" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle" transform="rotate(-90,15,140)">Hours</text><!-- Legend --><rect x="40" y="285" width="10" height="10" fill="var(--svg-3b82f6)" rx="2"/><text x="55" y="294" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">Study Session</text><rect x="140" y="285" width="10" height="10" fill="var(--svg-f59e0b)" rx="2"/><text x="155" y="294" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">Rest/Light Review</text></svg>',
      alt: 'Weekly study schedule bar chart showing study hours per day from Monday to Sunday',
      caption: 'Effective study schedules distribute focused sessions across the week with lighter review on weekends',
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
    ],
    commonUses: [
      'Exam preparation — plan your study schedule leading up to final exams or standardized tests',
      'Semester planning — estimate total study time across multiple courses for the entire semester',
      'Certification study — allocate weekly study hours for professional certifications like PMP, CPA, or AWS',
    ],
    explanation:
      'Effective study time estimation is a critical skill for academic success and professional development. Rather than guessing how much time you need, this calculator uses a structured approach based on material volume, reading speed, and material difficulty. The core principle is simple: divide your material by your reading speed, then adjust for how challenging the content is. Research in cognitive science strongly supports spaced repetition as one of the most effective study strategies. Spreading study sessions across multiple days — rather than cramming the night before — dramatically improves long-term retention. The spacing effect, first documented by Hermann Ebbinghaus, shows that information reviewed at increasing intervals is retained significantly longer than information reviewed in a single massed session. The Pomodoro Technique, developed by Francesco Cirillo, is another evidence-based method that enhances focus and prevents burnout. By breaking study time into focused 25-minute intervals separated by short breaks, you maintain higher concentration levels and reduce mental fatigue. Combining spaced repetition with active recall techniques — such as self-testing, flashcards, and teaching concepts to others — further strengthens neural pathways and improves exam performance. When planning your study schedule, aim for consistency rather than intensity. Studying one hour daily for two weeks is far more effective than studying for fourteen hours in a single weekend. This calculator helps you find the right balance between your available time and the volume of material you need to cover, ensuring you can approach your exams with confidence and a realistic plan.',
    faqs: [
      {
        question: 'What is the optimal study session length for retention?',
        answer: 'Research suggests that study sessions of 45-90 minutes are optimal for most learners. Sessions shorter than 45 minutes may not allow enough time to enter a focused state of concentration, while sessions longer than 90 minutes often lead to diminishing returns due to mental fatigue. The Pomodoro Technique recommends 25-minute focused intervals with 5-minute breaks, which can be particularly effective for subjects that require intense concentration. The key is to match session length to the type of material: dense theoretical content benefits from shorter, more focused sessions, while practice-oriented tasks like solving problems or writing can sustain longer sessions.',
      },
      {
        question: 'How do retention rates differ between cramming and spaced study?',
        answer: 'Research consistently shows that spaced study dramatically outperforms cramming. Studies indicate that after 24 hours, crammed information retention drops to approximately 50%, while spaced study maintains retention rates of 80-90% even after several days. After one week, crammed recall falls to around 20%, compared to 60-70% for spaced repetition. Ebbinghaus\'s forgetting curve demonstrates that without review, we forget about 50% of new information within an hour and up to 70% within 24 hours. Spaced repetition counteracts this by reviewing material at increasing intervals, strengthening the memory trace each time. For long-term retention, reviewing material at 1-day, 3-day, 7-day, and 30-day intervals is highly effective.',
      },
      {
        question: 'How should I adjust my reading speed estimate for dense academic material?',
        answer: 'Reading speeds vary dramatically depending on material density and purpose. Light fiction or familiar topics can be read at 200-400 words per minute, but dense academic textbooks with equations, diagrams, and new terminology may slow you to 50-150 words per minute. As a practical rule of thumb, a typical textbook page (approximately 400-500 words) takes about 2-3 minutes for a first pass with comprehension, translating to roughly 20-30 pages per hour. However, if you are highlighting, annotating, or solving embedded problems, expect 5-15 pages per hour for dense STEM material. When estimating your reading speed, time yourself for 30 minutes on representative material, count the pages you covered (including time spent on diagrams, equations, and re-reading), and multiply by 2 to get pages per hour. Use this measured value rather than an optimistic guess — underestimating reading time is the most common study planning mistake.',
      },
      {
        question: 'What if my calculated study hours exceed my available capacity?',
        answer: 'When the calculator flags your schedule as infeasible, you have several evidence-based options. Increase your session length to the upper end of the effective range (90 minutes). Add weekend sessions — even one extra session per weekend adds 14% more capacity. Reduce the effective difficulty by seeking supplementary materials (video lectures, study guides, or a tutor) that present the same material more accessibly. Prioritize material by exam weighting — focus extra time on high-stakes topics and use lighter review for low-weight material. If none of these adjustments are sufficient, you may need to renegotiate non-essential commitments or accept that full coverage is not realistic. Acknowledging a capacity gap early and making strategic choices about what to prioritize is far better than attempting an impossible schedule, burning out, and retaining nothing.',
      },
      {
        question: 'How should I schedule breaks within and between study sessions?',
        answer: 'Intra-session breaks preserve cognitive performance. The Pomodoro Technique (25 minutes focus, 5 minutes break) is the most studied approach, but the optimal work-break ratio varies: focused tasks like math problem sets benefit from 25/5 cycles, while writing or design tasks may flow better with 50/10 or 90/20 cycles. During breaks, avoid your phone — scrolling social media is not cognitively restorative. Instead, stand up, stretch, hydrate, or look out a window (the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds reduces eye strain). Between study sessions, aim for at least 2-3 hours of separation to allow memory consolidation, and incorporate physical exercise — aerobic activity increases BDNF (brain-derived neurotrophic factor), a protein that supports learning and memory formation. For multi-subject study days, interleave subjects rather than blocking them: studying math, then history, then math again produces better long-term retention than a single long math session followed by a single long history session.',
      },
    ],
    citations: [

      { source: 'National Institutes of Health', url: 'https://pubmed.ncbi.nlm.nih.gov/21261492/' },
    ],
  },
};

export default studyTimeConfig;
