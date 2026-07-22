import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import DepreciationPanel from './DepreciationPanel';

const depreciationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'purchasePrice',
      label: 'Vehicle Purchase Price',
      type: 'number',
      placeholder: '45,000',
      prefix: '$',
      min: 0,
      step: 500,
      inputMode: 'decimal',
      required: true,
      helpText: 'Original price paid for the vehicle',
    },
    {
      id: 'vehicleAge',
      label: 'Current Vehicle Age',
      type: 'number',
      placeholder: '0',
      unit: 'years',
      min: 0,
      max: 30,
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: '0 = brand new from dealer',
    },
    {
      id: 'yearsOwned',
      label: 'Years You Plan to Own',
      type: 'number',
      placeholder: '5',
      unit: 'years',
      min: 1,
      max: 30,
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'How long you intend to keep the vehicle',
    },
    {
      id: 'vehicleType',
      label: 'Vehicle Type',
      type: 'select',
      helpText: 'Vehicle type affects depreciation rate significantly',
      options: [
        { label: 'Average (sedan, SUV)', value: 'average' },
        { label: 'Luxury / High Depreciation', value: 'luxury' },
        { label: 'Truck / Slow Depreciation', value: 'truck' },
        { label: 'Electric Vehicle', value: 'ev' },
      ],
    },
  ],
  calculate: (values) => {
    const price = parseFloat(values.purchasePrice);
    const currentAge = parseFloat(values.vehicleAge) || 0;
    const yearsOwned = parseFloat(values.yearsOwned);
    const vType = values.vehicleType || 'average';

    if ([price, yearsOwned].some(isNaN) || price <= 0 || yearsOwned <= 0) return [];

    const rates: Record<string, number[]> = {
      average: [0.20, 0.15, 0.12, 0.10, 0.09, 0.08, 0.07, 0.06, 0.05, 0.05],
      luxury: [0.25, 0.20, 0.15, 0.13, 0.11, 0.09, 0.08, 0.07, 0.06, 0.05],
      truck: [0.15, 0.12, 0.10, 0.08, 0.07, 0.06, 0.05, 0.05, 0.04, 0.04],
      ev: [0.22, 0.18, 0.14, 0.12, 0.10, 0.08, 0.07, 0.06, 0.05, 0.05],
    };

    const rateArr = rates[vType] ?? rates.average;

    let currentValue = price;
    for (let y = 0; y < currentAge && y < rateArr.length; y++) {
      currentValue *= (1 - (rateArr[y] ?? 0.05));
    }

    const valueAtPurchase = currentValue;
    let futureValue = currentValue;
    const endYear = currentAge + yearsOwned;
    for (let y = currentAge; y < endYear && y < rateArr.length; y++) {
      futureValue *= (1 - (rateArr[y] ?? 0.05));
    }
    if (endYear > rateArr.length) {
      futureValue *= Math.pow(0.95, endYear - rateArr.length);
    }

    const totalDepreciation = valueAtPurchase - futureValue;
    const annualAvgDepreciation = totalDepreciation / yearsOwned;
    const depreciationPct = (totalDepreciation / valueAtPurchase) * 100;
    const costPerMonth = totalDepreciation / (yearsOwned * 12);

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return [
      {
        id: 'totalDepreciation',
        label: `Total Depreciation over ${yearsOwned} years`,
        value: `$${fmt(totalDepreciation)} (-${depreciationPct.toFixed(1)}%)`,
        highlight: true,
        color: 'negative',
      },
      {
        id: 'futureValue',
        label: `Estimated Value After ${yearsOwned} Years`,
        value: `$${fmt(futureValue)}`,
        color: 'neutral',
      },
      {
        id: 'annualDepreciation',
        label: 'Average Annual Depreciation',
        value: `$${fmt(annualAvgDepreciation)}/year`,
        color: 'negative',
      },
      {
        id: 'monthlyDepreciation',
        label: 'Monthly Depreciation Cost',
        value: `$${fmt(costPerMonth)}/month`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DepreciationPanel, { values, results });
  },
  educational: {
    formula: 'Value after Year N = Previous Year Value × (1 − Annual Depreciation Rate)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="50" width="320" height="240" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" rx="4"/><line x1="60" y1="250" x2="380" y2="250" stroke="var(--svg-666666)" stroke-width="1"/><text x="380" y="265" text-anchor="end" font-size="11" fill="var(--svg-666666)">Years</text><path d="M80 90 L180 160 L280 200 L360 225" fill="none" stroke="var(--svg-ef4444)" stroke-width="3"/><circle cx="80" cy="90" r="5" fill="var(--svg-ef4444)"/><circle cx="180" cy="160" r="5" fill="var(--svg-ef4444)"/><circle cx="280" cy="200" r="5" fill="var(--svg-ef4444)"/><circle cx="360" cy="225" r="5" fill="var(--svg-ef4444)"/><text x="80" y="80" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">$45K</text><text x="180" y="150" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">$34K</text><text x="280" y="190" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">$24K</text><text x="360" y="215" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">$17K</text><text x="80" y="270" font-size="10" fill="var(--svg-666666)">0</text><text x="180" y="270" text-anchor="middle" font-size="10" fill="var(--svg-666666)">1</text><text x="280" y="270" text-anchor="middle" font-size="10" fill="var(--svg-666666)">3</text><text x="360" y="270" text-anchor="middle" font-size="10" fill="var(--svg-666666)">5</text></svg>',
      alt: 'Line graph showing car value declining over 5 years from $45K to $17K',
      caption: 'Vehicle depreciation — value drops steepest in the first year then slows',
    },
    formulaDescription:
      'Vehicle depreciation is modeled year-by-year using typical depreciation rates that decline over time (new vehicles depreciate fastest in year 1, slowing as the vehicle ages).',
    variables: [
      { symbol: 'Year 1 Rate', name: 'First Year Depreciation', description: 'New vehicles typically lose 15-25% of their value in the first year alone. For a $45,000 car, that is $6,750-$11,250 lost the moment you drive off the lot.' },
      { symbol: 'Vehicle Type', name: 'Depreciation Category', description: 'Different vehicle types depreciate at different rates. Trucks hold value best; luxury sedans and EVs depreciate fastest due to rapid technology changes.' },
    ],
    howToUse: [
      'Enter the original vehicle purchase price.',
      'Enter the current age of the vehicle (0 for brand new).',
      'Enter how many years you plan to own it.',
      'Select the vehicle type for appropriate depreciation rates.',
      'Review the total depreciation cost, annual average, and monthly cost to understand the true ownership expense.',
    ],
    explanation:
      'Depreciation is the single largest cost of vehicle ownership — often exceeding fuel, insurance, and maintenance combined. A new $40,000 car loses $6,000 to $8,000 in its first year. Over 5 years, a typical car loses 40 to 60 percent of its value. This is why financial advisors often recommend buying 2 to 3 year old used vehicles — someone else has absorbed the steepest depreciation, but the vehicle still has most of its useful life remaining. Real-world example: buying a $45,000 luxury sedan and owning it for 5 years. Using luxury depreciation rates, the car loses 25 percent ($11,250) in year one, then 20 percent of the remaining value in year two ($6,750), and so on. After 5 years, the car is worth approximately $14,000 — a loss of $31,000, or $6,200 per year. That is $517 per month in depreciation alone, more than many car payments. The same $45,000 spent on a Toyota Tacoma (truck rates) retains roughly $21,000 after 5 years. The difference of $7,000 in retained value highlights how vehicle choice dramatically impacts total ownership cost. For EV buyers, rapid battery technology improvements and government incentive eligibility for new EVs create additional downward pressure on used EV prices beyond standard depreciation rates.',
    commonUses: [
      'Estimating a vehicle resale value before trading in or selling, to negotiate a fair price with dealers',
      'Comparing total ownership costs between new and used cars by projecting depreciation over planned ownership years',
      'Deciding between vehicle types (truck vs luxury vs EV) based on how well each retains value over time',
      'Budgeting for the true monthly cost of car ownership including depreciation, not just loan or lease payments',
    ],
    workedExamples: [
      {
        scenario: 'Mark buys a new $45,000 average sedan and plans to keep it for 5 years. What will it be worth at trade-in, and what is his monthly depreciation cost?',
        inputs: { purchasePrice: '45000', vehicleAge: '0', yearsOwned: '5', vehicleType: 'average' },
        result: '$22,946 total depreciation (51.0%) — $382/month over 5 years',
        insight: 'Using average depreciation rates: Year 1 (20%): $45,000 x 0.80 = $36,000. Year 2 (15%): $36,000 x 0.85 = $30,600. Year 3 (12%): $30,600 x 0.88 = $26,928. Year 4 (10%): $26,928 x 0.90 = $24,235. Year 5 (9%): $24,235 x 0.91 = $22,054. After 5 years, the car is worth approximately $22,054 — a total loss of $22,946 (51%). Monthly depreciation cost = $22,946 / 60 = $382/month. This $382/month is the hidden cost of ownership that most buyers never calculate. Add loan interest, insurance, fuel, and maintenance for the true total.',
      },
      {
        scenario: 'Sarah is deciding between a new $60,000 luxury SUV and a $60,000 Toyota Tacoma truck. She plans to keep the vehicle for 5 years. How much more will the luxury vehicle cost in depreciation?',
        inputs: { purchasePrice: '60000', vehicleAge: '0', yearsOwned: '5', vehicleType: 'luxury' },
        result: 'Luxury SUV: $36,306 depreciation (60.5%) vs Truck: $25,441 (42.4%) — $10,865 more in depreciation',
        insight: 'Luxury SUV (25% year 1, then 20%, 15%, 13%, 11%): Year 1 = $60,000 x 0.75 = $45,000. Year 2 = $45,000 x 0.80 = $36,000. Year 3 = $36,000 x 0.85 = $30,600. Year 4 = $30,600 x 0.87 = $26,622. Year 5 = $26,622 x 0.89 = $23,694. After 5 years: ~$23,694. Total loss: $36,306 (60.5%). Monthly cost: $605. Toyota Tacoma truck (15%, 12%, 10%, 8%, 7%): Year 1 = $60,000 x 0.85 = $51,000. Year 2 = $51,000 x 0.88 = $44,880. Year 3 = $44,880 x 0.90 = $40,392. Year 4 = $40,392 x 0.92 = $37,161. Year 5 = $37,161 x 0.93 = $34,559. After 5 years: ~$34,559. Total loss: $25,441 (42.4%). Monthly cost: $424. The luxury SUV costs $10,865 more in depreciation over 5 years — $181/month more — for the same purchase price. This difference alone could fund a significant portion of a college savings plan or retirement account.',
      },
    ],
    proTips: [
      'Buy a 2-3 year old used car to let someone else absorb the steepest depreciation. A $45,000 new sedan loses ~$9,000 in year one alone. That same car at 3 years old costs ~$27,000 and will only lose ~$5,000 over the next 3 years. You get 80% of the useful life for 60% of the price.',
      'Choose vehicle color strategically for resale. White, black, silver, and gray account for over 75% of vehicle sales and have the broadest resale appeal. While a bright orange or yellow car may express your personality, it significantly shrinks your buyer pool when it is time to sell, which can reduce the sale price by 5-10%.',
      'Keep detailed maintenance records. A complete service history with receipts can increase resale value by 5-15% because it signals to buyers that the vehicle was well cared for. Create a simple folder or use a vehicle maintenance app to log every oil change, tire rotation, brake job, and repair.',
      'Depreciation is not just a new-car problem — it follows every vehicle forever, just at a declining rate. When buying any used car, calculate the depreciation you will experience over your expected ownership period. A 7-year-old car still depreciates at 5-6% per year. Factor this into your total cost of ownership budget.',
      'For electric vehicles specifically, consider leasing instead of buying. EV technology is advancing so rapidly that a 3-year-old EV may feel outdated — and depreciates accordingly (22% year one for many models). Leasing transfers the technology obsolescence risk to the lessor. If you do buy an EV, the best value is typically a 2-3 year old used model where the initial depreciation hit has already been absorbed.',
    ],
    limitations: [
      'This calculator uses average depreciation rates derived from industry data (Kelley Blue Book, Edmunds, iSeeCars) but cannot account for model-specific factors that significantly impact real-world depreciation.',
      'Brand reputation (Toyota/Lexus and Honda/Acura consistently beat these averages by 5-10%, while some domestic and European brands underperform), vehicle condition (accident history, mechanical issues, cosmetic condition), and mileage (rates assume 12,000-15,000 miles/year; high-mileage vehicles depreciate faster) affect real results.',
      'Market trends (SUV demand has pushed truck/SUV residuals above historical norms; sedan residuals have fallen), color, options packages, regional demand differences, and economic conditions (recessions accelerate depreciation; supply chain disruptions slow it) are not modeled.',
      'The depreciation curves are estimates, not guarantees — always check current market values on Kelley Blue Book, Edmunds, or CarGurus for your specific make, model, year, and mileage before making a financial decision.',
    ],
    quickReference: [
      { label: 'New Car Year-1 Depreciation', value: '15-25% (all vehicle types)' },
      { label: '5-Year Avg Depreciation', value: '40-60% of original price' },
      { label: 'Best Resale: Trucks', value: '~42% loss over 5 years' },
      { label: 'Worst Resale: Luxury/EV', value: '55-60% loss over 5 years' },
      { label: 'Depreciation per Mile', value: '~$0.15-$0.25 above 12K/yr avg' },
      { label: 'Optimal Used Car Age', value: '2-3 years old (best value)' },
      { label: 'Maintenance Records Premium', value: '+5-15% resale value' },
      { label: 'Key Metric', value: 'Monthly depreciation cost ($/month)' },
    ],
    faqs: [
      {
        question: 'What vehicles depreciate the slowest?',
        answer: 'Trucks (Ford F-Series, RAM, Toyota Tacoma) and Japanese brands (Toyota 4Runner, Honda CR-V) consistently hold value best. Luxury brands (BMW, Mercedes, Audi) and most EVs depreciate fastest due to rapid technology improvements and high initial price premiums.',
      },
      {
        question: 'Does mileage affect depreciation?',
        answer: 'Yes significantly. High mileage accelerates depreciation beyond these estimates. The industry benchmark is 12,000 to 15,000 miles per year. Higher mileage reduces resale value proportionally. A car with 20,000 miles per year will be worth substantially less than one with 10,000 miles per year. The typical reduction is about $0.15 to $0.25 per mile above average at trade-in time.',
      },
      {
        question: 'What is the best strategy to minimize depreciation cost?',
        answer: 'Buy a 2 to 3 year old used vehicle from a brand known for reliability (Toyota, Honda, Subaru). The steepest depreciation has already occurred, but the vehicle still has most of its useful life. Keep the vehicle for 8 to 10 years to spread the remaining depreciation over as many years as possible. Maintain the car well and keep service records to support a higher resale value.',
      },
      {
        question: 'Does color affect resale value?',
        answer: 'Yes, to a small degree. Neutral colors like white, black, silver, and gray tend to have broader buyer appeal and slightly higher resale values. Unusual colors (bright yellow, neon green) can reduce the pool of potential buyers and may take longer to sell, though for certain sports cars, bold colors can command a premium with enthusiasts.',
      },
      {
        question: 'How does high mileage affect depreciation compared to age?',
        answer: 'Both matter, but mileage is often more impactful. A 5-year-old car with 30,000 miles is worth significantly more than the same model with 100,000 miles. The industry benchmark is 12,000-15,000 miles per year. Each additional 1,000 miles above average typically reduces resale value by $100-$200, meaning a car with 100,000 miles at 5 years could be worth $7,000-$10,000 less than one with 60,000 miles.',
      },
    ],
    citations: [
      { source: 'Kelley Blue Book', url: 'https://www.kbb.com/car-values/' },
      { source: 'Edmunds', url: 'https://www.edmunds.com/car-depreciation/' },
    ],
  },
};

export default depreciationConfig;
