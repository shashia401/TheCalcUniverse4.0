import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';

const paybackPeriodConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'initialInvestment',
      label: 'Initial Investment',
      type: 'number',
      placeholder: '50,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'The upfront cost of the investment or project.',
    },
    {
      id: 'annualCashFlow',
      label: 'Annual Cash Flow (Inflows)',
      type: 'number',
      placeholder: '12,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Expected annual net cash inflows from the investment.',
    },
    {
      id: 'useDiscounted',
      label: 'Apply TVM (Discounted Payback)?',
      type: 'select',
      required: true,
      helpText: 'Discounted payback accounts for the time value of money — $1 next year is worth less than $1 today.',
      options: [
        { label: 'Simple Payback (No TVM)', value: 'simple' },
        { label: 'Discounted Payback (With TVM)', value: 'discounted' },
      ],
    },
    {
      id: 'discountRate',
      label: 'Discount Rate (WACC / Required Return)',
      type: 'number',
      placeholder: '10',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 50,
      step: 0.1,
      required: false,
      helpText: 'Your cost of capital or minimum required return. Typical WACC: 8–15%. The rate at which future cash flows are discounted.',
      showWhen: (v) => v.useDiscounted === 'discounted',
    },
    {
      id: 'projectLife',
      label: 'Project Life (Years)',
      type: 'number',
      placeholder: '10',
      unit: 'years',
      inputMode: 'decimal',
      min: 1,
      max: 50,
      step: 1,
      required: false,
      helpText: 'If the project has a limited life, enter it here. Leave blank for ongoing investments.',
    },
  ],
  calculate: (values) => {
    const initialInvestment = parseFloat(values.initialInvestment);
    const annualCashFlow = parseFloat(values.annualCashFlow);
    const useDiscounted = values.useDiscounted === 'discounted';
    const discountRate = useDiscounted ? (parseFloat(values.discountRate) / 100 || 0) : 0;
    const projectLife = parseFloat(values.projectLife) || 0;

    if (isNaN(initialInvestment) || isNaN(annualCashFlow) || initialInvestment <= 0 || annualCashFlow <= 0) return [];

    const maxYears = projectLife > 0 ? Math.ceil(projectLife) : 50;

    // Simple payback
    const simplePaybackYears = initialInvestment / annualCashFlow;
    const simplePaybackExceedsLife = projectLife > 0 && simplePaybackYears > projectLife;

    // Discounted payback
    let discountedPaybackYears = Infinity;
    let cumulativeDcf = 0;
    for (let y = 1; y <= maxYears; y++) {
      const dcf = annualCashFlow / Math.pow(1 + discountRate, y);
      cumulativeDcf += dcf;
      if (cumulativeDcf >= initialInvestment) {
        // Interpolate: fraction of year
        const prevCum = cumulativeDcf - dcf;
        const fraction = (initialInvestment - prevCum) / dcf;
        discountedPaybackYears = y - 1 + fraction;
        break;
      }
    }

    // NPV at end of project life
    let npv = -initialInvestment;
    let totalUndiscounted = 0;
    for (let y = 1; y <= maxYears; y++) {
      const cf = y <= (projectLife || maxYears) ? annualCashFlow : 0;
      if (useDiscounted) {
        npv += cf / Math.pow(1 + discountRate, y);
      }
      totalUndiscounted += cf;
    }

    // Total return ratio
    const totalReturn = annualCashFlow * (projectLife > 0 ? projectLife : simplePaybackYears * 2);
    const profitIndex = useDiscounted
      ? (npv + initialInvestment) / initialInvestment
      : totalReturn / initialInvestment;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    const results: CalculatorResult[] = [
      {
        id: 'simplePayback',
        label: 'Simple Payback Period',
        value: simplePaybackExceedsLife
          ? `> ${fmt(projectLife)} years (exceeds project life)`
          : `${fmt(simplePaybackYears)} years`,
        highlight: true,
        color: simplePaybackYears <= 3 ? 'positive' : simplePaybackYears <= 5 ? 'neutral' : 'negative',
        interpretation: `Simple payback ignores the time value of money — it treats a dollar earned in year 5 the same as one earned today. It's a quick screening tool for comparing projects, but for a real investment decision pair it with IRR or NPV, which do account for discounting.`,
      },
      {
        id: 'annualCashFlowResult',
        label: 'Annual Cash Inflow',
        value: `$${annualCashFlow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr`,
        color: 'neutral',
      },
      {
        id: 'totalReturn',
        label: 'Total Undiscounted Return',
        value: projectLife > 0
          ? `$${(annualCashFlow * projectLife).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          : 'Ongoing',
        color: annualCashFlow * (projectLife || 1) > initialInvestment ? 'positive' : 'negative',
      },
      {
        id: 'profitIndex',
        label: projectLife > 0 ? 'Profitability Index' : 'Return Multiple (Annual)',
        value: projectLife > 0 ? `${profitIndex.toFixed(2)}x` : `${(annualCashFlow / initialInvestment * 100).toFixed(1)}%`,
        color: profitIndex >= 1 ? 'positive' : 'negative',
      },
    ];

    if (useDiscounted) {
      results.push({
        id: 'discountedPayback',
        label: 'Discounted Payback Period',
        value: discountedPaybackYears === Infinity
          ? 'Never (TVM-adjusted cash flows do not recoup investment)'
          : `${fmt(discountedPaybackYears)} years`,
        color: discountedPaybackYears <= 5 ? 'positive' : discountedPaybackYears <= 8 ? 'neutral' : discountedPaybackYears === Infinity ? 'negative' : 'neutral',
      });

      if (projectLife > 0) {
        results.push({
          id: 'npv',
          label: 'Net Present Value (NPV)',
          value: npv >= 0
            ? `$${npv.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : `-$${Math.abs(npv).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          color: npv >= 0 ? 'positive' : 'negative',
        });
      }

      results.push({
        id: 'discountRateUsed',
        label: 'Discount Rate Applied',
        value: `${(discountRate * 100).toFixed(1)}%`,
        color: 'neutral',
      });
    }

    return results;
  },
  educational: {
    formula: 'Payback Period = Initial Investment ÷ Annual Cash Flow',
    formulaDescription:
      'The payback period measures how long it takes to recover your initial investment from the cash flows the investment generates. The shorter the payback, the lower the risk. Discounted payback accounts for the time value of money by discounting future cash flows at your cost of capital before summing them. The discounted version is always longer and more realistic.',
    variables: [
      { symbol: 'Payback Period', name: 'Simple & Discounted Payback', description: 'Simple payback is initial investment divided by annual cash flow — quick but ignores TVM. Discounted payback discounts future cash flows by the cost of capital, giving a more conservative and realistic recovery timeline.' },
      { symbol: 'Discount Rate', name: 'Cost of Capital / WACC', description: 'The rate used to discount future cash flows. Represents your minimum required return — typically your weighted average cost of capital. A higher rate means a longer discounted payback.' },
      { symbol: 'NPV', name: 'Net Present Value', description: 'Sum of discounted cash flows minus the initial investment. Positive NPV = value-creating investment. The gold standard for investment decisions, complementary to payback analysis.' },
    ],
    howToUse: [
      'Enter the initial investment amount and the expected annual net cash inflows.',
      'Choose Simple Payback for a quick estimate, or Discounted Payback to account for the time value of money with your discount rate.',
      'Optionally set a project life to calculate NPV alongside the payback metrics.',
    ],
    commonUses: [
      'Calculate how many years it will take to recover your initial investment from expected annual cash inflows.',
      'Compare simple payback versus discounted payback to understand how the time value of money affects your investment recovery timeline.',
      'Evaluate capital projects or equipment purchases by pairing payback analysis with NPV for a complete investment decision.',
    ],
    explanation:
      'The payback period is one of the simplest and most intuitive investment metrics. It answers: "How long until I get my money back?" A shorter payback means less risk — you recover your capital faster, reducing exposure to unforeseen events. However, simple payback ignores the time value of money and completely disregards cash flows after the payback date. A project might have a 2-year payback but then produce no further value. Discounted payback fixes the TVM gap by discounting each future cash flow back to present value using your cost of capital. It is always longer than simple payback and prevents you from accepting projects that look good nominally but fail to meet your return threshold. For comprehensive investment analysis, pair payback with NPV (Net Present Value) and IRR (Internal Rate of Return). This calculator provides all three — simple payback, discounted payback (if enabled), and NPV over the project life — giving you a complete picture of the investment\'s financial viability.',
    
    
    
    
    limitations: [
      'Payback period ignores all cash flows after the payback date. A project with a 2-year payback that produces zero value afterward is worse than one with a 4-year payback that generates decades of profits. Always pair payback analysis with NPV or IRR.',
      'Simple payback ignores the time value of money entirely — a dollar in year 5 is treated the same as a dollar today. For anything beyond a 2-3 year horizon, always use discounted payback with an appropriate cost of capital.',
      'It assumes constant annual cash flows. Most real-world investments have variable year-to-year cash flows. Solar panels degrade; rental income rises with inflation. For uneven cash flows, you need a year-by-year discounted cash flow model.',
      'Tax effects (depreciation shields, ITC credits for solar, Section 179 expensing) can dramatically change payback periods and are not modeled here. A 30% federal solar tax credit, for example, reduces the initial investment by 30% for tax purposes, shortening the effective payback considerably.',
    ],
quickReference: [
      { label: 'Simple Payback', value: 'Investment ÷ Annual Cash Flow' },
      { label: 'Discounted Payback', value: 'Uses TVM-adjusted cash flows' },
      { label: 'Excellent Payback', value: 'Under 2–3 years' },
      { label: 'Typical Equipment', value: '3–5 years' },
      { label: 'Typical Solar', value: '6–10 years (before incentives)' },
      { label: '10% discount, 10yr life', value: '$50K at $12K/yr = 5.3yr simple, 6.6yr disc.' },
    ],
proTips: [
      'Use discounted payback with a rate equal to your weighted average cost of capital (WACC) or your required rate of return — typically 8–15% for most businesses. Simple payback is just a quick screening filter.',
      'If discounted payback returns "never," the project destroys value at your discount rate — even if simple payback looks attractive. Reject it or find a way to increase cash flows or reduce the upfront investment.',
      'Pair payback with NPV: a positive NPV means the project creates value over its life, a short payback means lower risk. The best projects have both. A project with a 1-year payback but negative NPV is rare but possible if costs spike after year 1.',
      'For solar panels, equipment replacement, and energy-efficiency projects, also factor in rising utility costs, maintenance savings, and any available tax credits or rebates — these can easily cut the effective payback by 30–50%.',
    ],
workedExamples: [
      {
        scenario: 'Carlos, a restaurant owner in Miami, is considering a $50,000 kitchen equipment upgrade expected to save $12,000/year in labor and energy costs over a 10-year equipment life. His cost of capital is 8%.',
        inputs: {
          'Initial Investment': '$50,000',
          'Annual Cash Flow (Inflows)': '$12,000',
          'Apply TVM (Discounted Payback)?': 'Discounted Payback (With TVM)',
          'Discount Rate (WACC / Required Return)': '8',
          'Project Life (Years)': '10',
        },
        result: 'Simple Payback: 4.2 years. Discounted Payback: 5.4 years. NPV: $30,520. Profitability Index: 1.61x. Total Undiscounted Return: $120,000.',
        insight: 'Carlos gets his money back in just over 4 years on a simple basis, or 5.4 years when accounting for the time value of money at 8%. The NPV of over $30,000 confirms this is a value-creating investment — the equipment pays for itself and generates an additional $30,520 in present-value terms above the cost of capital. The profitability index of 1.61x means every dollar invested returns $1.61 in present value. With 10 years of useful life, this is a strong investment.',
      },
      {
        scenario: 'Priya runs a small manufacturing business in Ohio and is evaluating a $75,000 automation upgrade expected to save $22,000 annually. She wants to compare simple vs discounted payback at her 10% WACC over an 8-year machine life.',
        inputs: {
          'Initial Investment': '$75,000',
          'Annual Cash Flow (Inflows)': '$22,000',
          'Apply TVM (Discounted Payback)?': 'Discounted Payback (With TVM)',
          'Discount Rate (WACC / Required Return)': '10',
          'Project Life (Years)': '8',
        },
        result: 'Simple Payback: 3.4 years. Discounted Payback: 4.4 years. NPV: $42,369. Profitability Index: 1.56x. Total Undiscounted Return: $176,000.',
        insight: 'Priya\'s automation upgrade has a simple payback of 3.4 years — well within the 8-year life — and a discounted payback of 4.4 years. The NPV of $42,369 means the project creates significant value above her required 10% return. At a 1.56x profitability index, it is a strong investment. If Priya had to choose between this and another project, she would compare NPVs and profitability indices.',
      },
    ],
faqs: [
      {
        question: 'What is a good payback period?',
        answer: 'It depends on the industry and risk level. For equipment purchases or efficiency projects, 2–3 years is excellent. For software/technology projects, 3–4 years is typical. For renewable energy installations like solar panels, 5–10 years is common. Any payback longer than half the expected project life is generally considered too risky. As a rule of thumb: the faster the industry changes, the shorter the acceptable payback period should be.',
      },
      {
        question: 'Why is discounted payback always longer than simple payback?',
        answer: 'Because discounting reduces the present value of future cash flows. A $10,000 cash flow in year 3 is worth only about $7,500 today at a 10% discount rate. It takes more discounted cash flows to recoup the initial investment, so the payback period extends. The higher the discount rate, the larger the gap between simple and discounted payback. At a 20% discount rate, a project with a 4-year simple payback might never reach discounted payback.',
      },
      {
        question: 'Should I use simple or discounted payback?',
        answer: 'Use simple payback for quick screening and when comparing projects with similar risk profiles. Use discounted payback (with TVM) for larger decisions, long-term projects, or when you have a clearly defined cost of capital. Many companies use both: simple payback for initial screening and discounted payback for final approval. Discounted payback prevents you from accepting projects that look good nominally but are value-negative in present value terms.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  },
};

export default paybackPeriodConfig;
