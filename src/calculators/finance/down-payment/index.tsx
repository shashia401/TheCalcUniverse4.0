import { CalculatorConfig } from '../../../types/calculator';
import { pmt } from '../../../utils/financial';

const PMI_ANNUAL_RATE = 0.008; // assumed PMI cost, share of the original loan per year
const DEFAULT_MORTGAGE_RATE = 6.8; // % APR, 30-year fixed

/**
 * Months of scheduled payments until the balance falls to 80% of the purchase price
 * (the point at which a conventional borrower can ask to drop PMI). 0 when already at or below 80%.
 */
export function monthsToEightyPercentLtv(price: number, loan: number, annualRatePct: number, years = 30): number {
  if (loan <= 0.8 * price) return 0;
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  const payment = pmt(loan, r, n);
  let balance = loan;
  for (let m = 1; m <= n; m++) {
    balance = balance * (1 + r) - payment;
    if (balance <= 0.8 * price + 1e-9) return m;
  }
  return n;
}

const downPaymentConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Target Home Price',
      type: 'number',
      placeholder: '350,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'The price of the home you want to buy.',
    },
    {
      id: 'targetDownPct',
      label: 'Target Down Payment',
      type: 'select',
      required: true,
      helpText: '20% avoids PMI. Lower options available for FHA (3.5%) or conventional (3–5%) loans.',
      options: [
        { label: '3.5% (FHA Minimum)', value: '3.5' },
        { label: '5% (Common Conventional Minimum)', value: '5' },
        { label: '10%', value: '10' },
        { label: '15%', value: '15' },
        { label: '20% (Avoid PMI)', value: '20' },
        { label: '25%', value: '25' },
      ],
    },
    {
      id: 'currentSavings',
      label: 'Current Savings for Down Payment',
      type: 'number',
      placeholder: '20,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'How much you have already saved toward the down payment.',
    },
    {
      id: 'monthlySavings',
      label: 'Monthly Savings Contribution',
      type: 'number',
      placeholder: '1,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'How much you can save each month toward the down payment goal.',
    },
    {
      id: 'expectedReturn',
      label: 'Expected Annual Return on Savings',
      type: 'number',
      placeholder: '3',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 25,
      step: 0.1,
      required: false,
      helpText: 'Annual return on your savings, compounded monthly (use the current APY of your account). Investments may earn more but are riskier.',
    },
    {
      id: 'mortgageRate',
      label: 'Assumed Mortgage Rate (optional)',
      type: 'number',
      placeholder: '6.8',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 15,
      step: 0.05,
      required: false,
      helpText: 'Used for the estimated monthly payment and how long PMI lasts (30-year fixed). Blank = 6.8%.',
    },
  ],
  calculate: (values) => {
    const homePrice = parseFloat(values.homePrice);
    const targetDownPct = parseFloat(values.targetDownPct || '20') / 100;
    const currentSavingsRaw = parseFloat(values.currentSavings);
    const currentSavings = isNaN(currentSavingsRaw) ? NaN : currentSavingsRaw;
    const monthlySavings = parseFloat(values.monthlySavings) || 0;
    const annualReturn = parseFloat(values.expectedReturn) / 100 || 0;
    const mortgageRatePct = isNaN(parseFloat(values.mortgageRate)) ? DEFAULT_MORTGAGE_RATE : parseFloat(values.mortgageRate);

    if (isNaN(homePrice) || isNaN(currentSavings) || homePrice <= 0) return [];

    const targetDownPayment = homePrice * targetDownPct;
    const currentDownPct = (currentSavings / homePrice) * 100;
    const savingsGap = Math.max(0, targetDownPayment - currentSavings);

    // Calculate months to reach goal (compounding monthly savings)
    let monthsToGoal = Infinity;
    if (savingsGap > 0 && (monthlySavings > 0 || annualReturn > 0)) {
      const monthlyRate = annualReturn / 12; // contributions are made at the end of each month
      let balance = currentSavings;
      for (let m = 1; m <= 600; m++) {
        balance = balance * (1 + monthlyRate) + monthlySavings;
        if (balance >= targetDownPayment) {
          monthsToGoal = m;
          break;
        }
      }
    } else if (savingsGap <= 0) {
      monthsToGoal = 0;
    }

    const isPmiRequired = targetDownPct < 0.2;
    const loanAmount = homePrice - targetDownPayment;
    const annualPmiCost = isPmiRequired ? loanAmount * PMI_ANNUAL_RATE : 0;
    // PMI is charged on the original loan until scheduled payments bring the balance to 80% of the price
    const pmiMonths = isPmiRequired ? monthsToEightyPercentLtv(homePrice, loanAmount, mortgageRatePct) : 0;
    const totalPmiIfNoExtra = (annualPmiCost * pmiMonths) / 12;

    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return [
      {
        id: 'targetDownPayment',
        label: 'Down Payment Needed',
        value: `$${fmtInt(targetDownPayment)}`,
        highlight: true,
        color: 'neutral',
        interpretation: `At ${(targetDownPct * 100).toFixed(0)}% down, ${isPmiRequired ? `you'll pay roughly $${fmtInt(annualPmiCost)}/year in PMI (about $${fmtInt(totalPmiIfNoExtra)} over roughly ${(pmiMonths / 12).toFixed(0)} years of scheduled payments) until you reach 20% equity — putting 20% down up front removes that cost.` : `you're at or above 20%, so you skip PMI (private mortgage insurance) entirely.`} A bigger down payment also shrinks the loan and total interest — but don't drain your emergency fund to get there.`,
      },
      {
        id: 'savingsGap',
        label: 'Additional Savings Needed',
        value: savingsGap > 0 ? `$${fmtInt(savingsGap)}` : 'Already saved!',
        color: savingsGap <= 0 ? 'positive' : 'neutral',
      },
      {
        id: 'currentDownPct',
        label: 'Current Down Payment %',
        value: `${currentDownPct.toFixed(1)}%`,
        color: currentDownPct >= 20 ? 'positive' : 'negative',
      },
      {
        id: 'targetDownPct',
        label: 'Target Down Payment %',
        value: `${(targetDownPct * 100).toFixed(1)}%`,
        color: targetDownPct >= 20 ? 'positive' : targetDownPct >= 10 ? 'neutral' : 'negative',
      },
      {
        id: 'monthsToGoal',
        label: 'Time to Reach Goal',
        value: monthsToGoal === Infinity
          ? 'Increase savings rate'
          : monthsToGoal === 0
            ? 'Goal already met!'
            : `${monthsToGoal} months (${(monthsToGoal / 12).toFixed(1)} years)`,
        color: monthsToGoal === Infinity ? 'negative' : monthsToGoal <= 60 ? 'positive' : monthsToGoal <= 120 ? 'neutral' : 'negative',
      },
      {
        id: 'pmiWarning',
        label: 'PMI Required?',
        value: isPmiRequired ? `Yes — add ~$${fmtInt(annualPmiCost)}/yr to your payment` : 'No — 20% or more down',
        color: isPmiRequired ? 'negative' : 'positive',
      },
      {
        id: 'totalPmiCost',
        label: 'Estimated PMI Cost Until 20% Equity',
        value: isPmiRequired ? `~$${fmtInt(totalPmiIfNoExtra)} total (about ${(pmiMonths / 12).toFixed(1)} years)` : '$0',
        color: isPmiRequired ? 'negative' : 'positive',
      },
      {
        id: 'monthlyPayment',
        label: 'Est. Monthly Payment (P&I)',
        value: `$${fmtInt(loanAmount > 0 ? pmt(loanAmount, mortgageRatePct / 100 / 12, 360) : 0)}`,
        color: 'neutral',
        unit: `at ${mortgageRatePct}% APR, 30yr`,
      },
      {
        id: 'loanAmount',
        label: 'Loan Amount Needed',
        value: `$${fmtInt(loanAmount)}`,
        color: 'neutral',
      },
    ];
  },
  educational: {
    formula: 'Down Payment = Home Price × Target %',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="#f8fafc" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">Down Payment & PMI Explained</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="#64748b">Your down payment determines loan terms and insurance costs</text><g transform="translate(30,65)"><!-- House icon with price --><polygon points="170,0 230,20 230,40 110,40 110,20" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/><rect x="140" y="14" width="60" height="26" rx="4" fill="#f1f5f9"/><text x="170" y="32" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">$350K</text><text x="170" y="55" text-anchor="middle" font-size="9" fill="#475569">Target Home Price</text><!-- Stacked bar showing down payment tiers --><rect x="30" y="68" width="340" height="30" rx="6" fill="#f1f5f9"/><text x="200" y="88" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">$350,000 Home</text><!-- 20% down: No PMI --><rect x="302" y="108" width="68" height="30" rx="4" fill="#22c55e"/><text x="336" y="128" text-anchor="middle" font-size="8" font-weight="bold" class="fill-white">20%</text><rect x="30" y="108" width="270" height="30" rx="4" fill="#3b82f6"/><text x="165" y="128" text-anchor="middle" font-size="10" font-weight="bold" class="fill-white">Loan: $280,000</text><text x="336" y="150" text-anchor="middle" font-size="8" fill="#15803d">No PMI ✓</text><text x="336" y="160" text-anchor="middle" font-size="7" fill="#64748b">$70K down</text><!-- 10% down: PMI --><rect x="262" y="170" width="108" height="30" rx="4" fill="#f59e0b"/><text x="316" y="190" text-anchor="middle" font-size="8" font-weight="bold" class="fill-white">10%</text><rect x="30" y="170" width="230" height="30" rx="4" fill="#3b82f6"/><text x="145" y="190" text-anchor="middle" font-size="10" font-weight="bold" class="fill-white">Loan: $315,000</text><text x="316" y="212" text-anchor="middle" font-size="8" fill="#b91c1c">+PMI ~$210/mo</text><text x="316" y="222" text-anchor="middle" font-size="7" fill="#64748b">$35K down</text></g><!-- PMI cost comparison --><g transform="translate(40,232)"><rect x="10" y="0" width="370" height="95" rx="10" fill="#f1f5f9"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">The Cost of a Low Down Payment</text><text x="65" y="38" text-anchor="middle" font-size="9" fill="#64748b">20% Down</text><text x="65" y="52" text-anchor="middle" font-size="9" fill="#15803d">$0 PMI</text><text x="65" y="66" text-anchor="middle" font-size="9" fill="#64748b">$0/yr wasted</text><text x="175" y="38" text-anchor="middle" font-size="9" fill="#64748b">10% Down</text><text x="175" y="52" text-anchor="middle" font-size="9" fill="#b91c1c">~$2,520/yr PMI</text><text x="175" y="66" text-anchor="middle" font-size="9" fill="#64748b">~$20.6K over ~8yr</text><text x="295" y="38" text-anchor="middle" font-size="9" fill="#64748b">5% Down</text><text x="295" y="52" text-anchor="middle" font-size="9" fill="#b91c1c">~$2,660/yr PMI</text><text x="295" y="66" text-anchor="middle" font-size="9" fill="#64748b">~$28.2K over ~10.6yr</text><text x="195" y="86" text-anchor="middle" font-size="9" font-weight="bold" fill="#1e293b">20% down saves $20K+ in PMI. But 5% gets you in the door now.</text></g></svg>',
      alt: 'Down payment diagram showing a $350K house with stacked bars comparing 20% down (no PMI) vs 10% down (with PMI), plus PMI cost comparison table',
      caption: '20% down eliminates PMI and saves thousands -- but lower down payment options get you into a home sooner',
    },
    formulaDescription:
      'The down payment is the cash you bring to the home purchase. 20% is the magic number — at 20%, you eliminate PMI (Private Mortgage Insurance), which costs roughly 0.8% of the loan amount per year. The calculator also factors in the time value of your savings: money you save each month earns compounding returns in a savings account, accelerating your timeline to reach the down payment goal.',
    variables: [
      { symbol: 'Target DP', name: 'Required Down Payment', description: 'Home price multiplied by your target down payment percentage. This is your savings goal. For a $350,000 home with a 20% target, you need $70,000.' },
      { symbol: 'PMI', name: 'Private Mortgage Insurance', description: 'Required when down payment < 20%. Costs ~0.8% of loan amount/year. You can request removal when equity reaches 20%. On a $300K loan, PMI costs about $2,400/year.' },
      { symbol: 'Monthly Savings', name: 'Monthly Contribution', description: 'How much you save each month toward your down payment. Compounding returns on savings accelerate the timeline. Even a 4% annual return on a high-yield savings account meaningfully shortens the time to reach your goal.' },
    ],
    howToUse: [
      'Enter the price of the home you are targeting. Be realistic — include your target price range.',
      'Select your target down payment percentage — 20% eliminates PMI, 3.5% is FHA minimum, 5% is conventional minimum.',
      'Enter what you have already saved and how much you can save monthly toward the goal.',
      'Enter your expected annual return on savings (use the current APY of your account; investments may earn more but can lose value).',
      'The calculator shows your timeline to reach the goal, PMI costs you will pay if under 20% (until scheduled payments bring the loan to 80% of the price), and an estimated monthly mortgage payment at the mortgage rate you assume (default 6.8%).',
    ],
    commonUses: [
      'Calculate how long it will take to save enough for a down payment on a home based on your current savings and monthly contribution.',
      'Compare the cost of a 20 percent down payment that eliminates PMI versus a smaller down payment that gets you into a home sooner.',
      'Estimate the total PMI or MIP costs you will incur if your down payment is below the conventional or FHA minimum thresholds.',
    ],
    explanation:
      'The down payment is the biggest barrier to homeownership for most buyers. A 20% down payment eliminates PMI — Private Mortgage Insurance that costs roughly 0.8% of the loan amount per year. On a $300,000 loan, that is $2,400/year you pay until you reach 20% equity. FHA loans allow as little as 3.5% down but require MIP (Mortgage Insurance Premium) for the life of the loan if under 10% down. Conventional loans with less than 20% down require PMI but it can be removed once you hit 20% equity. This calculator shows you the exact savings timeline and the true cost of a low down payment. It also shows an estimated monthly mortgage payment so you can see the full picture of homeownership costs beyond just the down payment. The key trade-off: a smaller down payment gets you into a home sooner, but you pay more each month and spend thousands on PMI. A larger down payment requires more patience but saves significant money in the long run.',
    
    
    
    
    limitations: [
      'This calculator provides estimates based on standard formulas and your inputs. Mortgage insurance rates (PMI, MIP) are approximate averages — actual premiums vary by lender, credit score, and loan program. The savings timeline projection assumes a constant monthly contribution and a steady annual return, neither of which is guaranteed. Real estate prices, interest rates, and personal financial situations change over time. For critical financial decisions including mortgage qualification, always consult a licensed mortgage professional who can evaluate your specific financial profile and provide accurate, binding estimates.',
    ],
    quickReference: [
      { label: 'Conventional Minimum Down', value: '3-5% (with PMI)' },
      { label: 'FHA Minimum Down', value: '3.5% with a 580+ credit score (annual MIP of 0.55% for the life of the loan when under 5% down)' },
      { label: 'No PMI Threshold', value: '20% down payment' },
      { label: 'VA Loan Minimum Down', value: '0% (eligible veterans)' },
      { label: 'USDA Loan Minimum Down', value: '0% (rural areas)' },
      { label: 'PMI Annual Cost Range', value: '0.5% to 1.5% of loan amount' },
      { label: 'Conforming Loan Limit (2026)', value: '$832,750 in most areas (FHFA); loans above it are jumbo' },
    ],
    proTips: [
      'Ask your lender about lender-paid PMI (LPMI): the lender pays the PMI premium upfront in exchange for a slightly higher interest rate. This can lower your monthly payment compared to borrower-paid PMI, but the higher rate is permanent. Compare both options before deciding.',
      'Look into first-time homebuyer programs in your state. Many states offer down payment assistance grants or low-interest second mortgages that can cover 3-5% of the purchase price. These programs often have income limits but can dramatically accelerate your timeline to homeownership.',
      'If your credit score is above 740, ask for a reduced PMI rate. PMI premiums are risk-based — excellent credit can qualify you for the lowest tier (around 0.5% of the loan annually vs. 1.5% for lower scores). A 1% difference on a $300K loan saves $3,000/year.',
      'Consider house hacking: buy a multi-unit property (duplex, triplex) with an FHA loan at 3.5% down, live in one unit, and rent the others. The rental income counts toward your mortgage qualification and can cover most or all of your monthly payment, effectively letting you build equity with minimal cash outlay.',
    ],
    workedExamples: [
      {
        scenario: 'David and Michelle in Denver are first-time homebuyers targeting a $450,000 home. They have $35,000 saved and can set aside $2,000/month. They want to know if they should buy now with 7.8% down plus PMI or wait for a full 20% down payment.',
        inputs: { homePrice: '450000', targetDownPct: '20', currentSavings: '35000', monthlySavings: '2000', expectedReturn: '4' },
        result: '20% down target: $90,000. Additional savings needed: $55,000. At $2,000/month with 4% return, it takes about 25 months (just over 2 years) to reach the 20% goal. If they buy now with 7.8% down ($35,000): the loan is $415,000, PMI at 0.8% is about $3,320/year, and it lasts roughly 9 years of scheduled payments at 6.8% = about $31,000 total.',
        insight: 'David and Michelle face the classic buy-now-or-wait dilemma. Waiting 25 months saves them roughly $31,000 in PMI. However, if home prices appreciate 4% annually during those 2 years, the same $450,000 home would cost about $486,700 — an increase of about $36,700, which exceeds the PMI savings. In a rising market, buying sooner with a smaller down payment and accepting PMI may be the financially smarter move. They should also explore whether their $450,000 target is realistic in Denver\'s competitive market.',
      },
      {
        scenario: 'Keisha is a single teacher in Atlanta earning $58,000/year. She has $12,000 saved and can save $800/month toward a down payment on a $250,000 starter home. She qualifies for both FHA and conventional loans.',
        inputs: { homePrice: '250000', targetDownPct: '3.5', currentSavings: '12000', monthlySavings: '800' },
        result: 'FHA (3.5%): $8,750 down needed — she already has enough. Conventional (5%): $12,500 down — just $500 short of her $12,000 saved, covered in under a month at $800/month. PMI on conventional (0.8% of the $237,500 loan): ~$1,900/year, cancellable at 20% equity (about 10.6 years of scheduled payments at 6.8%, roughly $20,100 in total). FHA annual MIP (0.55% of the $241,250 loan): ~$1,327 in year one, falling with the balance, for the life of the loan (roughly $26,200 over 30 years), plus a 1.75% upfront premium (~$4,200).',
        insight: 'Keisha should go with the conventional loan at 5% even though it requires a slightly larger down payment. The key reason: FHA MIP is permanent when the down payment is under 10%, while conventional PMI drops off automatically at 20% equity. Over 30 years, FHA mortgage insurance would cost Keisha roughly $30,400 (annual MIP plus the upfront premium) versus about $20,100 of conventional PMI that ends after roughly 10.6 years. The roughly $10,000 difference outweighs the extra $500 she needs to save for the conventional down payment, provided she qualifies for a conventional rate and PMI price (FHA is more forgiving of lower credit scores).',
      },
      {
        scenario: 'Marcus is an Army veteran in San Antonio looking to buy a $325,000 home. He qualifies for a VA loan with 0% down but wants to understand whether making a down payment anyway would benefit him.',
        inputs: { homePrice: '325000', targetDownPct: '10', currentSavings: '50000', monthlySavings: '1500', expectedReturn: '4' },
        result: 'VA loan at 0% down: full $325,000 financed at ~6.5%, monthly P&I = $2,054. VA loan with 10% down ($32,500): $292,500 financed, monthly P&I = $1,849, saving $205/month. VA funding fee at 0% down: 2.15% ($6,988) vs 10% down: 1.25% ($3,656) — the down payment saves $3,331 on the funding fee alone.',
        insight: 'The VA loan is one of the best mortgage products available, but making a down payment still has significant benefits. Marcus saves $205/month on the mortgage payment and $3,331 on the VA funding fee by putting 10% down. Over 30 years, the $205/month savings adds up to $73,800 in reduced payments. Since Marcus has $50,000 saved, putting down 10% ($32,500) still leaves him with a $17,500 emergency fund — a smart balance between equity building and maintaining a financial safety net.',
      },
    ],
    faqs: [
      {
        question: 'Is 20% down really necessary?',
        answer: 'No — but it saves you thousands. Without 20% down, you pay PMI (roughly 0.8%/yr of the loan). On a $300K loan, that is ~$2,400/year. With 5-10% down it typically takes about 8-11 years of scheduled payments at current rates to reach 20% equity, which is roughly $20,000-$25,000 in PMI on a $300K loan. A 5% down payment gets you in the door faster, but 20% costs less in the long run. FHA loans avoid PMI but require MIP, which cannot be removed if the down payment is under 10%.',
      },
      {
        question: 'How long does it take to save a 20% down payment?',
        answer: 'On a $350,000 home, 20% is $70,000. With $1,000/month saved in a high-yield account earning 4%, starting from $10,000: it takes about 54 months (4.5 years). Increasing savings to $1,500/month cuts it to 37 months. If you can save $2,000/month, you reach the goal in about 29 months. The rate of savings matters far more than the return rate for most people — focus on increasing your monthly contribution.',
      },
      {
        question: 'Should I use retirement savings for a down payment?',
        answer: 'Generally no — withdrawing from a 401(k) before 59½ triggers a 10% penalty plus income tax on the withdrawal. Some first-time homebuyer exceptions exist for IRAs (up to $10,000 penalty-free), but you lose years of compounding growth. Exhaust all other options first: cut expenses, increase income, use gift funds from family, or explore down payment assistance programs. Many states offer grants or low-interest loans specifically for first-time homebuyer down payments.',
      },
      {
        question: 'What is the difference between PMI and MIP?',
        answer: 'PMI (Private Mortgage Insurance) applies to conventional loans with less than 20% down and is provided by private insurers. It can be canceled once you reach 20% equity through payments or appreciation. MIP (Mortgage Insurance Premium) applies to FHA loans and is government-backed. For FHA loans with less than 10% down, MIP lasts the entire life of the loan — it cannot be canceled even after reaching 20% equity. This makes FHA loans significantly more expensive long-term for borrowers who can qualify for conventional financing.',
      },
      {
        question: 'What down payment assistance programs are available?',
        answer: 'Thousands of programs exist at the federal, state, and local levels. The most common are: state housing finance agency grants (typically 3-5% of purchase price, often forgivable after 5 years), employer-assisted housing programs (some universities and hospitals offer $5,000-$25,000 toward a down payment), and HUD\'s Good Neighbor Next Door program (a 50% discount off the list price of HUD-owned homes in revitalization areas for teachers, law enforcement officers, firefighters, and EMTs). Search HUD\'s website for programs in your state, and ask your loan officer about local programs you may qualify for.',
      },
      {
        question: 'Can I use gift funds for my down payment?',
        answer: 'Yes, most loan programs allow gift funds from family members. Conventional loans: gifts from relatives are acceptable; the donor must provide a gift letter stating no repayment is expected. FHA loans: gifts from relatives, employers, labor unions, and charitable organizations are allowed. The donor cannot be anyone with a financial interest in the transaction (seller, real estate agent, builder). You typically need documentation showing the gift funds being transferred and the donor\'s ability to give (bank statement). There is no limit on the gift amount, but you should check lender-specific overlays.',
      },
      {
        question: 'How does my credit score affect my down payment requirements?',
        answer: 'Your credit score can significantly change your minimum down payment. FHA loans: 580+ score qualifies for 3.5% down; 500-579 requires 10% down. Conventional loans: minimum 620 score for most lenders, but rates and PMI premiums increase substantially below 740. A borrower with a 620 score might pay PMI at 1.5% of the loan vs. 0.5% for a 760+ score — a 3x difference. VA loans: no official minimum credit score, but most lenders require 620+. USDA loans: typically 640+. Improving your credit score from 650 to 740 before applying can save tens of thousands over the loan\'s life.',
      },
    ],
  },
};

export default downPaymentConfig;
