// Activity multipliers, the Mifflin-St Jeor BMR and the reference-person table, shared by the
// calculator's inputs/calculate() and the educational quick-reference so they cannot drift apart.

export const KG_PER_LB = 0.45359237;

/** Standard activity factors (value is the multiplier as the select's string value). */
export const ACTIVITY_LEVELS = [
  { label: 'Sedentary (desk job, little/no exercise)', short: 'Sedentary (desk job)', value: '1.2' },
  { label: 'Light Exercise (1–2 days/week)', short: 'Light Exercise (1-2 days/wk)', value: '1.375' },
  { label: 'Moderate Exercise (3–5 days/week)', short: 'Moderate Exercise (3-5 days/wk)', value: '1.55' },
  { label: 'Heavy Exercise (6–7 days/week)', short: 'Heavy Exercise (6-7 days/wk)', value: '1.725' },
  { label: 'Athlete / Physical Job (2× per day)', short: 'Athlete (2x/day)', value: '1.9' },
] as const;

/** Mifflin-St Jeor resting energy expenditure, kcal/day. */
export function mifflinBmr(sex: string, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
}

/** The calculator's default person: 30-year-old man, 170 lb, 5 ft 10 in. */
export const REFERENCE_PERSON = { sex: 'male', age: 30, weightLb: 170, heightIn: 70 };

const kcal = (n: number) => Math.round(n).toLocaleString('en-US');

/** Quick-reference rows: each activity factor applied to the reference person's BMR. */
export function activityRows(): { label: string; value: string }[] {
  const { sex, age, weightLb, heightIn } = REFERENCE_PERSON;
  const bmr = mifflinBmr(sex, weightLb * KG_PER_LB, heightIn * 2.54, age);
  return [
    ...ACTIVITY_LEVELS.map((a) => ({
      label: a.short,
      value: `TDEE = BMR × ${a.value} = ${kcal(bmr * parseFloat(a.value))} kcal/day`,
    })),
    {
      label: 'Example person (the calculator defaults)',
      value: `30-year-old man, 170 lb, 5'10" — Mifflin-St Jeor BMR ${kcal(bmr)} kcal/day`,
    },
  ];
}
