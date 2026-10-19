// Healthy-weight (BMI 18.5-24.9) maths shared by calculate() and the educational reference table,
// so the table on the page can never disagree with the calculator.

export const KG_PER_LB = 0.45359237;
export const M_PER_INCH = 0.0254;
export const BMI_HEALTHY_LOW = 18.5;
export const BMI_HEALTHY_HIGH = 24.9;

/** Weight range (kg) that keeps BMI inside the WHO "normal" band for a height in metres. */
export function healthyWeightRangeKg(heightM: number): { low: number; high: number } {
  return { low: BMI_HEALTHY_LOW * heightM * heightM, high: BMI_HEALTHY_HIGH * heightM * heightM };
}

/** Heights shown in the reference table, in total inches (4'10" to 6'4"). */
export const REFERENCE_HEIGHTS_IN = [58, 60, 62, 64, 66, 68, 70, 72, 74, 76];

/** Quick-reference rows: healthy weight range by height, rounded the same way as the calculator's own result. */
export function healthyRangeRows(inches: number[] = REFERENCE_HEIGHTS_IN): { label: string; value: string }[] {
  return inches.map((inch) => {
    const { low, high } = healthyWeightRangeKg(inch * M_PER_INCH);
    return {
      label: `Healthy weight at ${Math.floor(inch / 12)}'${inch % 12}" (${Math.round(inch * 2.54)} cm)`,
      value: `${(low / KG_PER_LB).toFixed(0)} – ${(high / KG_PER_LB).toFixed(0)} lb · ${low.toFixed(1)} – ${high.toFixed(1)} kg`,
    };
  });
}
