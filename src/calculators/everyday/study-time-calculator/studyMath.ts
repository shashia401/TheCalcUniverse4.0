// Pure study-plan maths shared by index.ts and the panel (the panel must not parse result strings).
// Difficulty multipliers are rules of thumb (not measured constants): they stretch plain reading time to cover
// note-taking, comprehension and review.

export const DIFFICULTY_MULTIPLIERS: Record<string, number> = { Easy: 0.8, Medium: 1.0, Hard: 1.5 };

export interface StudyPlan {
  totalPages: number;
  pagesPerHour: number;
  difficulty: string;
  multiplier: number;
  /** raw reading hours before the difficulty multiplier */
  readingHours: number;
  adjustedHours: number;
  weeksAvailable: number;
  hoursPerWeek: number;
  weeklyCapacity: number;
  hoursPerSession: number;
  dailyHours: number;
  sessionHours: number;
  sessionsNeeded: number;
  sessionsAvailable: number;
  feasible: boolean;
  daysUntilExam: number;
  sessionsPerWeek: number;
}

export function studyPlan(values: Record<string, string>): StudyPlan | null {
  const totalPages = parseFloat(values.totalPages);
  const pagesPerHour = parseFloat(values.pagesPerHour);
  const sessionsPerWeek = parseFloat(values.sessionsPerWeek);
  const sessionLength = parseFloat(values.sessionLength);
  const daysUntilExam = parseFloat(values.daysUntilExam);
  if (![totalPages, pagesPerHour, sessionsPerWeek, sessionLength, daysUntilExam].every(Number.isFinite)) return null;
  if (totalPages <= 0 || pagesPerHour <= 0 || sessionsPerWeek <= 0 || sessionLength <= 0 || daysUntilExam <= 0) return null;

  const difficulty = DIFFICULTY_MULTIPLIERS[values.difficulty] !== undefined ? values.difficulty : 'Medium';
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty];
  const readingHours = totalPages / pagesPerHour;
  const adjustedHours = readingHours * multiplier;
  const weeksAvailable = daysUntilExam / 7;
  const hoursPerWeek = adjustedHours / weeksAvailable;
  const sessionHours = sessionLength / 60;
  const weeklyCapacity = sessionsPerWeek * sessionHours;
  return {
    totalPages, pagesPerHour, difficulty, multiplier, readingHours, adjustedHours, weeksAvailable, hoursPerWeek,
    weeklyCapacity,
    hoursPerSession: hoursPerWeek / sessionsPerWeek,
    dailyHours: hoursPerWeek / 7,
    sessionHours,
    sessionsNeeded: Math.ceil(adjustedHours / sessionHours - 1e-9),
    sessionsAvailable: sessionsPerWeek * weeksAvailable,
    feasible: hoursPerWeek <= weeklyCapacity + 1e-9,
    daysUntilExam,
    sessionsPerWeek,
  };
}

/** Reading paces (pages/hour) shown in the reference table; 30 is the calculator's placeholder pace. */
export const REFERENCE_PACES = [10, 20, 30, 40];

/** Quick-reference rows: total study hours for 100 pages at each pace under each difficulty multiplier. */
export function studyHoursRows(pages = 100, paces: number[] = REFERENCE_PACES): { label: string; value: string }[] {
  return paces.map((pace) => ({
    label: `${pages} pages at ${pace} pages/hour`,
    value: Object.keys(DIFFICULTY_MULTIPLIERS)
      .map((difficulty) => {
        const plan = studyPlan({
          totalPages: String(pages), pagesPerHour: String(pace), sessionsPerWeek: '5',
          sessionLength: '60', daysUntilExam: '14', difficulty,
        });
        return `${difficulty} ${plan ? plan.adjustedHours.toFixed(2) : '–'} h`;
      })
      .join(' · '),
  }));
}
