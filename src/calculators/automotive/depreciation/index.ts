import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { depreciation } from './depreciationMath';
import { createElement } from 'react';
import DepreciationPanel from './DepreciationPanel';

const depreciationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'purchasePrice',
      label: 'Price When New',
      type: 'number',
      placeholder: '45,000',
      prefix: '$',
      min: 0,
      step: 500,
      inputMode: 'decimal',
      required: true,
      helpText: 'What the vehicle cost new (or will cost new). For a used car, enter its original price — the value today is estimated from the age below.',
    },
    {
      id: 'vehicleAge',
      label: 'Current Vehicle Age',
      type: 'number',
      placeholder: '0',
      unit: 'years',
      min: 0,
      max: 30,
      step: 0.5,
      inputMode: 'decimal',
      required: true,
      helpText: '0 = brand new from the dealer. Fractions like 2.5 are allowed.',
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
    const d = depreciation(values);
    if (!d) return [];
    const { yearsOwned, totalDepreciation, depreciationPct, futureValue, annual, monthly } = d;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const results: CalculatorResult[] = [
      {
        id: 'totalDepreciation',
        label: `Total Depreciation over ${yearsOwned} years`,
        value: `$${fmt(totalDepreciation)} (-${depreciationPct.toFixed(1)}%)`,
        highlight: true,
        color: 'negative',
        interpretation: `That's about $${fmt(monthly)}/month in lost value — the single biggest cost of car ownership that doesn't show up on a receipt. Depreciation is steepest in the first 1-3 years, which is why buying a lightly used car often means someone else absorbs the sharpest drop.`,
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
        value: `$${fmt(annual)}/year`,
        color: 'negative',
      },
      {
        id: 'monthlyDepreciation',
        label: 'Monthly Depreciation Cost',
        value: `$${fmt(monthly)}/month`,
        color: 'neutral',
      },
    ];
    if (d.age > 0) {
      results.splice(1, 0, {
        id: 'currentValue',
        label: `Estimated Value Today (${d.age} ${d.age === 1 ? 'year' : 'years'} old)`,
        value: `$${fmt(d.valueNow)}`,
        color: 'neutral',
      });
    }
    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DepreciationPanel, { values, results });
  },
  educational: {
    formula: 'Value after Year N = Previous Year Value × (1 − Annual Depreciation Rate)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="50" width="320" height="240" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" rx="4"/><line x1="60" y1="250" x2="380" y2="250" stroke="var(--svg-666666)" stroke-width="1"/><text x="380" y="265" text-anchor="end" font-size="11" fill="var(--svg-666666)">Years</text><path d="M80 90 L180 160 L280 200 L360 225" fill="none" stroke="var(--svg-ef4444)" stroke-width="3"/><circle cx="80" cy="90" r="5" fill="var(--svg-ef4444)"/><circle cx="180" cy="160" r="5" fill="var(--svg-ef4444)"/><circle cx="280" cy="200" r="5" fill="var(--svg-ef4444)"/><circle cx="360" cy="225" r="5" fill="var(--svg-ef4444)"/><text x="80" y="80" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">$45K</text><text x="180" y="150" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">$34K</text><text x="280" y="190" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">$23K</text><text x="360" y="215" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">$18K</text><text x="80" y="270" font-size="10" fill="var(--svg-666666)">0</text><text x="180" y="270" text-anchor="middle" font-size="10" fill="var(--svg-666666)">1</text><text x="280" y="270" text-anchor="middle" font-size="10" fill="var(--svg-666666)">3</text><text x="360" y="270" text-anchor="middle" font-size="10" fill="var(--svg-666666)">5</text></svg>',
      alt: 'Line graph showing a $45K luxury vehicle losing value over 5 years to about $18K',
      caption: 'Vehicle depreciation — value drops steepest in the first year then slows (example: $45,000 luxury vehicle)',
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
      'Depreciation is the single largest cost of vehicle ownership — often exceeding fuel, insurance, and maintenance combined. A new $40,000 car can easily lose $6,000 to $8,000 in its first year. Over 5 years, a typical car commonly loses somewhere around 40 to 55 percent of its value (the average curve used here gives 51%). This is why many financial advisors recommend buying 2 to 3 year old used vehicles — someone else has absorbed the steepest depreciation, but the vehicle still has most of its useful life remaining. Real-world example: buying a $45,000 luxury sedan and owning it for 5 years. Using luxury depreciation rates, the car loses 25 percent ($11,250) in year one, then 20 percent of the remaining value in year two ($6,750), and so on. After 5 years, the car is worth approximately $17,770 — a loss of $27,230, or $5,446 per year. That is $454 per month in depreciation alone, more than many car payments. The same $45,000 spent on a vehicle with the truck rates used here retains roughly $25,920 after 5 years. The difference of about $8,150 in retained value highlights how vehicle choice dramatically impacts total ownership cost. For EV buyers, rapid battery technology improvements and government incentive eligibility for new EVs create additional downward pressure on used EV prices beyond standard depreciation rates.',
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
        result: 'Luxury SUV: $36,306 depreciation (60.5%) vs Truck: $25,441 (42.4%) — $10,866 more in depreciation',
        insight: 'Luxury SUV (25% year 1, then 20%, 15%, 13%, 11%): Year 1 = $60,000 x 0.75 = $45,000. Year 2 = $45,000 x 0.80 = $36,000. Year 3 = $36,000 x 0.85 = $30,600. Year 4 = $30,600 x 0.87 = $26,622. Year 5 = $26,622 x 0.89 = $23,694. After 5 years: ~$23,694. Total loss: $36,306 (60.5%). Monthly cost: $605. Toyota Tacoma truck (15%, 12%, 10%, 8%, 7%): Year 1 = $60,000 x 0.85 = $51,000. Year 2 = $51,000 x 0.88 = $44,880. Year 3 = $44,880 x 0.90 = $40,392. Year 4 = $40,392 x 0.92 = $37,161. Year 5 = $37,161 x 0.93 = $34,559. After 5 years: ~$34,559. Total loss: $25,441 (42.4%). Monthly cost: $424. The luxury SUV costs $10,866 more in depreciation over 5 years — $181/month more — for the same purchase price. This difference alone could fund a significant portion of a college savings plan or retirement account.',
      },
    ],
    proTips: [
      'Buy a 2-3 year old used car to let someone else absorb the steepest depreciation. A $45,000 new sedan loses ~$9,000 in year one alone (20% in this model). The same car at 3 years old is worth ~$26,900 and loses ~$6,600 over the next 3 years, versus ~$18,100 in its first 3.',
      'Choose vehicle color strategically for resale. White, black, silver, and gray account for over 75% of vehicle sales and have the broadest resale appeal. While a bright orange or yellow car may express your personality, it narrows your buyer pool when it is time to sell, which can mean a longer wait or a lower offer.',
      'Keep detailed maintenance records. A complete service history with receipts can increase resale value by 5-15% because it signals to buyers that the vehicle was well cared for, and it usually helps you sell faster or at a better price. Keep a simple folder or use a vehicle maintenance app to log every oil change, tire rotation, brake job, and repair.',
      'Depreciation is not just a new-car problem — it follows every vehicle forever, just at a declining rate. When buying any used car, calculate the depreciation you will experience over your expected ownership period. A 7-year-old car still depreciates at roughly 6% per year in this model. Factor this into your total cost of ownership budget.',
      'For electric vehicles specifically, consider leasing instead of buying. EV technology is advancing so rapidly that a 3-year-old EV may feel outdated — and depreciates accordingly (this calculator assumes 22% in year one for EVs). Leasing transfers the technology obsolescence risk to the lessor. If you do buy an EV, the best value is typically a 2-3 year old used model where the initial depreciation hit has already been absorbed.',
    ],
    limitations: [
      'This calculator uses illustrative depreciation curves (a fixed table of yearly rates for each vehicle type, not a data feed from Kelley Blue Book, Edmunds, or iSeeCars) and cannot account for model-specific factors that significantly impact real-world depreciation.',
      'Brand reputation (some brands tend to beat these averages and others underperform), vehicle condition (accident history, mechanical issues, cosmetic condition), and mileage (rates assume 12,000-15,000 miles/year; high-mileage vehicles depreciate faster) affect real results.',
      'Market trends (SUV demand has pushed truck/SUV residuals above historical norms; sedan residuals have fallen), color, options packages, regional demand differences, and economic conditions (recessions accelerate depreciation; supply chain disruptions slow it) are not modeled.',
      'The depreciation curves are estimates, not guarantees — always check current market values on Kelley Blue Book, Edmunds, or CarGurus for your specific make, model, year, and mileage before making a financial decision.',
    ],
    quickReference: [
      { label: 'Year-1 Depreciation (this model)', value: '15% (truck) to 25% (luxury)' },
      { label: '5-Year Depreciation (this model)', value: '42% (truck) to 60% (luxury)' },
      { label: 'Best Resale (model): Trucks', value: '42% loss over 5 years' },
      { label: 'Worst Resale (model): Luxury/EV', value: '56-60% loss over 5 years' },
      { label: 'Commonly Cited Used-Car Sweet Spot', value: '2-3 years old' },
      { label: 'Maintenance Records', value: 'Help resale — keep them' },
      { label: 'Key Metric', value: 'Monthly depreciation cost ($/month)' },
    ],
    faqs: [
      {
        question: 'What vehicles depreciate the slowest?',
        answer: 'Pickup trucks and body-on-frame SUVs (such as the Toyota Tacoma, Toyota 4Runner, and Jeep Wrangler) tend to hold value best in published resale studies. Luxury brands (BMW, Mercedes, Audi) and most EVs depreciate fastest due to rapid technology improvements and high initial price premiums.',
      },
      {
        question: 'Does mileage affect depreciation?',
        answer: 'Yes significantly. High mileage accelerates depreciation beyond these estimates. The industry benchmark is 12,000 to 15,000 miles per year. Higher mileage reduces resale value proportionally. A car with 20,000 miles per year will be worth substantially less than one with 10,000 miles per year. Check Kelley Blue Book or Edmunds with your exact mileage for a real number.',
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
        answer: 'Both matter, but mileage is often more impactful. A 5-year-old car with 30,000 miles is worth significantly more than the same model with 100,000 miles. The industry benchmark is 12,000-15,000 miles per year. Every extra mile above average lowers resale value, which is why you should check a valuation guide with the exact mileage.',
      },
    ],
    citations: [
      { source: 'Kelley Blue Book', url: 'https://www.kbb.com/car-values/' },
      { source: 'Edmunds', url: 'https://www.edmunds.com/car-depreciation/' },
    ],
  },
};

export default depreciationConfig;
