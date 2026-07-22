import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import PercentErrorPanel from './PercentErrorPanel';

// Decimal.js for accurate percent error calculations — ensures precision
// when the accepted and experimental values differ by tiny amounts (e.g.,
// comparing 0.001 vs 0.0012), where native JS floating-point subtraction
// could introduce relative errors larger than the percent error itself.
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const percentErrorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'accepted',
      label: 'Accepted / True Value',
      type: 'number',
      placeholder: '100',
      step: 0.0001,
      required: true,
      inputMode: 'decimal',
      helpText: 'The standard or theoretical value (what it should be)',
    },
    {
      id: 'experimental',
      label: 'Experimental / Observed Value',
      type: 'number',
      placeholder: '95',
      step: 0.0001,
      required: true,
      inputMode: 'decimal',
      helpText: 'The measured or approximate value (what you got)',
    },
  ],
  calculate: (values) => {
    const accepted = values.accepted;
    const experimental = values.experimental;

    if (!accepted || !experimental) return [];

    let aDec: Decimal;
    let eDec: Decimal;
    try {
      aDec = new Decimal(accepted);
      eDec = new Decimal(experimental);
    } catch {
      return [];
    }

    if (!aDec.isFinite() || !eDec.isFinite() || aDec.isZero()) return [];

    // Percent error = |(accepted - experimental) / accepted| * 100%
    const absoluteError = aDec.minus(eDec).abs();
    const percentError = absoluteError.div(aDec.abs()).times(100);

    // Signed error (positive = overestimate, negative = underestimate)
    const signedError = eDec.minus(aDec).div(aDec.abs()).times(100);
    const direction = signedError.greaterThanOrEqualTo(0) ? 'overestimate' : 'underestimate';

    const accuracy = new Decimal(100).minus(percentError);
    const relativeError = absoluteError.div(aDec.abs());

    const fmt = (n: Decimal) => {
      const rounded = n.toFixed(4);
      // Remove trailing zeros after decimal
      return parseFloat(rounded).toString();
    };

    const percentErrNum = percentError.toNumber();

    return [
      {
        id: 'percentError',
        label: 'Percent Error',
        value: `${fmt(percentError)}%`,
        highlight: true,
        color: percentErrNum < 5 ? 'positive' : percentErrNum < 15 ? 'neutral' : 'negative',
      },
      {
        id: 'absoluteError',
        label: 'Absolute Error',
        value: fmt(absoluteError),
        color: 'neutral',
      },
      {
        id: 'signedError',
        label: `Signed Error (${direction})`,
        value: `${fmt(signedError.abs())}% ${direction}`,
        color: signedError.greaterThanOrEqualTo(0) ? 'neutral' : 'negative',
      },
      {
        id: 'accuracy',
        label: 'Experimental Accuracy',
        value: `${fmt(accuracy)}%`,
        color: accuracy.greaterThanOrEqualTo(95) ? 'positive' : accuracy.greaterThanOrEqualTo(85) ? 'neutral' : 'negative',
      },
      {
        id: 'relativeError',
        label: 'Relative Error',
        value: fmt(relativeError),
        color: 'neutral',
      },
      {
        id: 'formula',
        label: 'Formula Used',
        value: `δ = |(${fmt(aDec)} - ${fmt(eDec)}) / ${fmt(aDec)}| x 100%`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PercentErrorPanel, { values, results });
  },
  educational: {
    formula: 'δ = |(vA − vE) / vA| × 100% | vA = accepted value, vE = experimental value',
    formulaDescription:
      'Percent error measures how close an experimental value is to the accepted or theoretical value. The absolute value ensures the error is always positive -- we care about the magnitude of the discrepancy, not the direction. In most lab contexts, a percent error under 5% is considered excellent, while over 15% indicates a procedural issue that warrants investigation.',
    variables: [
      { symbol: 'vA', name: 'Accepted Value', description: 'The theoretical, true, or standard reference value. The expected result in a perfect experiment.' },
      { symbol: 'vE', name: 'Experimental Value', description: 'The measured or observed value from your experiment. What you actually got.' },
      { symbol: 'δ', name: 'Percent Error', description: 'The absolute difference between accepted and experimental values, divided by the accepted value, times 100%. Always expressed as a positive percentage.' },
      { symbol: 'Accuracy', name: 'Experimental Accuracy', description: '100% minus the percent error. Represents how close the experimental value is to the truth on a percentage scale.' },
      { symbol: 'Relative Error', name: 'Relative Error', description: 'The absolute error divided by the accepted value. The decimal form of percent error before multiplying by 100.' },
    ],
    howToUse: [
      'Enter the accepted/true value (the theoretical or standard reference).',
      'Enter the experimental/observed value (what you actually measured in your experiment).',
      'Review the percent error, absolute error, accuracy, and relative error.',
      'Check the signed error to see if you overestimated (positive) or underestimated (negative) the true value.',
      'Use the accuracy percentage to quickly assess experimental quality: >95% is excellent, <85% warrants investigation.',
    ],
    explanation:
      'Percent error is a staple of chemistry and physics lab work. It quantifies the accuracy of experimental measurements by comparing them to a known standard. The absolute value in the formula ensures that overestimates and underestimates are treated equally -- the magnitude of the error is typically more important than the direction when assessing experimental technique. However, the signed error is also crucial for diagnosing systematic bias: if all your measurements are consistently above or below the true value, you likely have a calibration or procedural issue that should be corrected. Random variation, on the other hand, produces a mix of positive and negative signed errors and is reduced by taking more measurements and averaging. Percent error differs from percent difference, which compares two experimental values when neither is known to be correct. A common question in lab classes: "I got 15% error -- is that good?" The answer depends on the context. In introductory physics labs, under 5% is excellent, 5-15% is acceptable, and over 15% suggests a problem worth investigating. In advanced analytical chemistry, errors under 1% are expected.',
    commonUses: [
      'Chemistry labs: comparing experimentally determined density, molar mass, or concentration against known literature values',
      'Physics labs: measuring the acceleration due to gravity (g = 9.81 m/s²) with a simple pendulum and computing percent error',
      'Engineering: validating finite element analysis (FEA) simulation results against physical test data',
      'Manufacturing: calibrating sensors and instruments by comparing their readings against NIST-traceable reference standards',
      'Meteorology: evaluating the accuracy of weather prediction models by comparing forecast temperatures against actual recorded temperatures',
    ],
    workedExamples: [
      {
        scenario: 'Aisha, a chemistry student, measured the density of copper in her lab. Her experimental value is 8.65 g/cm³, but the accepted literature value is 8.96 g/cm³. She needs to calculate the percent error and determine if her technique was adequate.',
        inputs: { accepted: '8.96', experimental: '8.65' },
        result: 'Percent error = 3.46%, Accuracy = 96.54%. Signed error = −3.46% (underestimate). Within excellent range for an introductory lab.',
        insight: 'Percent error = |8.96 - 8.65| / 8.96 x 100 = 3.46%. Accuracy = 96.54%. At 3.5% error, Aisha\'s measurement is in the "excellent" range for an introductory lab. The signed error shows she underestimated, which is consistent with a small systematic error like incomplete drying of the copper sample before weighing.',
      },
      {
        scenario: 'Carlos, a quality engineer, is calibrating a new temperature sensor. The reference thermometer (NIST-traceable) reads 100.0°C in boiling water, but the new sensor reads 98.2°C. The sensor spec requires less than 1% error. Should Carlos accept or reject this sensor?',
        inputs: { accepted: '100', experimental: '98.2' },
        result: 'Percent error = 1.80%, Accuracy = 98.20%. Signed error = −1.80% (underestimate). Exceeds the 1% specification — sensor must be rejected or recalibrated.',
        insight: 'Percent error = 1.80%. Accuracy = 98.20%. At 1.8% error, the sensor exceeds the 1% specification. Carlos must reject it and either recalibrate or return it to the manufacturer. The signed error is negative (-1.8%), meaning the sensor reads consistently low -- this is characteristic of a calibration offset that could potentially be corrected with a firmware adjustment.',
      },
      {
        scenario: 'Priya, a data scientist, has built a machine learning model to predict housing prices. On a test house, the model predicted $342,000 but the actual sale price was $355,000. She wants to know the percent error to assess model accuracy.',
        inputs: { accepted: '355000', experimental: '342000' },
        result: 'Percent error = 3.66%, Accuracy = 96.34%. Signed error = −3.66% (underestimate by $13,000). Very good for real estate prediction.',
        insight: 'Percent error = 3.66%. Accuracy = 96.34%. The model underestimated by $13,000, which is about 3.7%. For real estate prediction, this is very good accuracy given the inherent variability of housing markets. Priya notes the consistent underestimate (signed error = -3.66%) and may investigate whether her model systematically undervalues homes in this price range.',
      },
    ],
    proTips: [
      'Always record the signed error alongside percent error. If your signed error is consistently positive or negative across multiple measurements, you have a systematic error (bias) that you can correct -- it is not random noise.',
      'For low accepted values, percent error can be misleadingly large. A difference of 0.1 on an accepted value of 0.5 gives 20% error, even though the absolute error is tiny. Always check the absolute error to contextualize the percent error.',
      'Percent error and percent difference are NOT the same thing. Use percent error when you have a known true value. Use percent difference when comparing two experimental measurements with no known standard.',
      'In analytical chemistry and pharmaceutical labs, percent error targets are often below 2% or even 1%. In social sciences and field biology, 10-20% may be excellent due to inherent variability. Always check your field\'s standards.',
      'If your percent error is suspiciously close to 0%, double-check your work. Perfect agreement with the accepted value can indicate that you inadvertently worked backwards from the known answer rather than making an independent measurement.',
    ],
    limitations: [
      'Do NOT use percent error when the accepted value is zero or extremely close to zero — division by a near-zero value produces meaningless or infinite results.',
      'Do NOT use percent error to compare two experimental values — use percent difference instead.',
      'Do not use percent error when your "accepted" value itself has significant uncertainty — the error in the reference value propagates into your percent error.',
      'Do not use percent error as the sole metric when assessing model accuracy — consider absolute error, RMSE, and R² for regression models.',
      'This calculator assumes the accepted value is the true or reference value. If both values are experimental estimates, use a different comparison metric.',
    ],
    quickReference: [
      { label: 'Percent Error', value: '|vA - vE| / |vA| x 100%' },
      { label: 'Accuracy', value: '100% - Percent Error' },
      { label: 'Absolute Error', value: '|vA - vE| (in original units)' },
      { label: 'Relative Error', value: '|vA - vE| / |vA| (unitless)' },
      { label: 'Signed Error (+)', value: 'Overestimate (experimental > accepted)' },
      { label: 'Signed Error (-)', value: 'Underestimate (experimental < accepted)' },
      { label: 'Excellent', value: '< 5% error (intro lab standard)' },
      { label: 'Acceptable', value: '5-15% error (investigate >15%)' },
    ],
    faqs: [
      {
        question: 'Why do we use absolute value in percent error?',
        answer: 'Absolute value ensures the error is always expressed as a positive percentage. In most lab contexts, the magnitude of the error matters more than whether the measurement was above or below the true value. If you need to know the direction, the signed error is shown separately -- this can reveal systematic bias in your experimental procedure.',
      },
      {
        question: 'What is a "good" percent error?',
        answer: 'In introductory lab settings, under 5% is excellent, 5-10% is acceptable, and over 15% suggests a significant error in procedure or measurement. In advanced analytical chemistry, errors under 1% are expected. In social sciences, 10-20% may be acceptable due to inherent variability. Always check the standards in your specific field.',
      },
      {
        question: 'What is the difference between percent error and percent difference?',
        answer: 'Percent error compares an experimental value to a known standard (accepted value): |vA - vE| / |vA| x 100%. Percent difference compares two experimental values when neither is known to be correct: |v1 - v2| / ((v1 + v2)/2) x 100%. Use percent error when you have a reference value. Use percent difference when comparing two measurements from different methods or different experimenters.',
      },
      {
        question: 'Can percent error be negative?',
        answer: 'By convention, percent error is reported as a positive value (using absolute value). However, the signed error tells you the direction: positive means your experimental value was higher than accepted (overestimate), negative means it was lower (underestimate). For example, if you measured a length as 102cm when the true value is 100cm, percent error = 2%, and signed error = +2% (overestimate).',
      },
      {
        question: 'What if my accepted value is very small?',
        answer: 'When the accepted value is close to zero, percent error becomes unreliable because you are dividing by a tiny number. For example, if the accepted value is 0.001 and your experimental value is 0.002, the percent error is 100% even though the absolute error is only 0.001. In such cases, focus on the absolute error rather than the percent error. Always report the accepted value alongside the error for context.',
      },
      {
        question: 'How accurate is 100% accuracy? What does it mean?',
        answer: '100% accuracy (0% error) means your experimental value exactly matched the accepted value. While this is technically possible, it is suspicious in most lab settings -- perfect agreement often indicates that the student reverse-engineered the measurement from the known answer rather than making an independent measurement. In professional research, extremely low percent error (like 0.01%) typically requires extraordinarily precise instruments and careful technique.',
      },
      {
        question: 'How do I reduce percent error in my experiments?',
        answer: 'To reduce percent error: (1) Take multiple measurements and average them to reduce random error; (2) Use more precise instruments (higher resolution scales, graduated cylinders vs beakers); (3) Control environmental variables (temperature, humidity, vibration); (4) Calibrate instruments against known standards before measuring; (5) Identify and eliminate systematic errors by varying one variable at a time. Remember: systematic errors affect accuracy (percent error), while random errors affect precision (standard deviation).',
      },
    ],
    citations: [
      { source: 'Wikipedia - Approximation Error', url: 'https://en.wikipedia.org/wiki/Approximation_error' },
      { source: 'Wolfram MathWorld - Percent Error', url: 'https://mathworld.wolfram.com/PercentError.html' },
      { source: 'NIST - Measurement Uncertainty', url: 'https://www.nist.gov/pml/owm' },
    ],
  },
};

export default percentErrorConfig;
