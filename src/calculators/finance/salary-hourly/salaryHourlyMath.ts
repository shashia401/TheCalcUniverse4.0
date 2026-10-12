/** Pure salary <-> hourly maths shared by salary-hourly, salary-to-hourly and their panels. */

export const WORK_DAYS_PER_WEEK = 5;

export interface PayRates {
  /** Salary / (hours per week x weeks worked). */
  hourly: number;
  /** One day of a five-day week at the hourly rate. */
  daily: number;
  /** Pay per week worked (salary / weeks worked; equals salary / 52 for a full year). */
  weekly: number;
  biweekly: number;
  monthly: number;
  annualHours: number;
}

/** Standard conversion. Both calculators call this with the same inputs, so they cannot disagree. */
export function payRates(salary: number, hoursPerWeek: number, weeksPerYear = 52): PayRates {
  const annualHours = hoursPerWeek * weeksPerYear;
  const hourly = salary / annualHours;
  return {
    hourly,
    daily: (hourly * hoursPerWeek) / WORK_DAYS_PER_WEEK,
    weekly: salary / weeksPerYear,
    biweekly: salary / 26,
    monthly: salary / 12,
    annualHours,
  };
}

export interface TrueHourlyInput {
  salary: number;
  hoursPerWeek: number;
  /** Round-trip commute hours per day. */
  commuteHoursPerDay: number;
  commuteCostPerDay: number;
  unpaidOvertimeHours: number;
  /** Paid days off per year (PTO + holidays). */
  ptoDays: number;
}

/**
 * True hourly rate: the salary (less commute spend) over every hour of life the job takes. Paid time off removes
 * working weeks (days / 5) from the 52 paid weeks; commute and unpaid overtime add hours to each week worked.
 */
export function trueHourly(i: TrueHourlyInput) {
  const workingWeeks = Math.max(0, 52 - i.ptoDays / WORK_DAYS_PER_WEEK);
  const effectiveHoursPerWeek = i.hoursPerWeek + i.commuteHoursPerDay * WORK_DAYS_PER_WEEK + i.unpaidOvertimeHours;
  const effectiveAnnualHours = effectiveHoursPerWeek * workingWeeks;
  const commuteCostsAnnual = i.commuteCostPerDay * WORK_DAYS_PER_WEEK * workingWeeks;
  return {
    workingWeeks,
    effectiveHoursPerWeek,
    effectiveAnnualHours,
    commuteCostsAnnual,
    trueHourly: effectiveAnnualHours > 0 ? (i.salary - commuteCostsAnnual) / effectiveAnnualHours : NaN,
  };
}
