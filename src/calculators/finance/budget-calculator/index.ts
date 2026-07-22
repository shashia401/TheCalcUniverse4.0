import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import BudgetPanel from './BudgetPanel';

const budgetSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">50/30/20 Budget Rule</text>
  <rect x="30" y="35" width="260" height="32" rx="6" fill="var(--svg-3b82f6)"/>
  <text x="160" y="56" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ffffff)" font-family="system-ui,sans-serif">Needs: 50% (Rent, Bills, Groceries)</text>
  <rect x="30" y="77" width="156" height="32" rx="6" fill="var(--svg-10b981)"/>
  <text x="108" y="97" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ffffff)" font-family="system-ui,sans-serif">Wants: 30%</text>
  <rect x="30" y="119" width="104" height="32" rx="6" fill="var(--svg-ef4444)"/>
  <text x="82" y="139" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ffffff)" font-family="system-ui,sans-serif">Savings: 20%</text>
  <text x="160" y="178" text-anchor="middle" font-size="9" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">After-tax income allocation framework</text>
  <text x="160" y="192" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Leftover = Income - (Needs + Wants + Savings)</text>
</svg>`;

const budgetCalculatorConfig: CalculatorConfig = {
  inputs: [
    // Group: Monthly Income
    {
      id: 'monthlyIncome',
      label: 'Monthly After-Tax Income',
      type: 'number',
      placeholder: '6,500',
      prefix: '$',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Your total monthly take-home pay after all taxes and deductions.',
    },

    // Group: Needs (Target: 50%)
    {
      id: 'rent',
      label: 'Rent or Mortgage',
      type: 'number',
      placeholder: '1,800',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Your monthly housing payment — rent or mortgage principal and interest.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'utilities',
      label: 'Utilities (Electric, Water, Internet)',
      type: 'number',
      placeholder: '200',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Average monthly cost for electricity, water, internet, and other utilities.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'groceries',
      label: 'Groceries',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Monthly spending on food and household supplies from grocery stores.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'autoGas',
      label: 'Auto Loan & Gas',
      type: 'number',
      placeholder: '450',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Car payment and estimated monthly fuel costs combined.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'insurance',
      label: 'Health & Auto Insurance',
      type: 'number',
      placeholder: '300',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Monthly premiums for health, auto, and other insurance policies.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'childcare',
      label: 'Childcare / Daycare',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Monthly daycare, after-school programs, or babysitting costs.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'otherNeeds',
      label: 'Other Needs (Medical, Minimum Debt Payments)',
      type: 'number',
      placeholder: '150',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Other essential expenses like medical bills or minimum debt payments.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },

    // Group: Wants (Target: 30%)
    {
      id: 'diningOut',
      label: 'Dining Out & Takeout',
      type: 'number',
      placeholder: '300',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Monthly spending on restaurants, takeout, coffee shops, and food delivery.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'entertainment',
      label: 'Entertainment & Hobbies',
      type: 'number',
      placeholder: '150',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Movies, concerts, hobbies, games, and other recreational activities.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions (Streaming, Apps, Gym)',
      type: 'number',
      placeholder: '80',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Monthly fees for streaming, apps, gym memberships, and other subscriptions.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'shopping',
      label: 'Shopping & Clothing',
      type: 'number',
      placeholder: '200',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Clothing, accessories, electronics, and other discretionary shopping.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'travel',
      label: 'Travel & Vacations (Monthly avg)',
      type: 'number',
      placeholder: '100',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Average monthly amount saved or spent on trips and vacations.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'otherWants',
      label: 'Other Wants',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Any other discretionary spending not covered in the categories above.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },

    // Group: Savings & Debt Payoff (Target: 20%)
    {
      id: 'emergencyFund',
      label: 'Emergency Fund / Savings Account',
      type: 'number',
      placeholder: '200',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Monthly deposit into your emergency savings or general savings account.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'retirement401k',
      label: '401(k) / IRA Contributions',
      type: 'number',
      placeholder: '300',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Monthly contributions to retirement accounts like 401(k) or IRA.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'investmentBrokerage',
      label: 'Investment / Brokerage',
      type: 'number',
      placeholder: '100',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Monthly contributions to taxable brokerage or other investment accounts.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'extraDebtPayoff',
      label: 'Extra Debt Payoff (Above Minimums)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Extra monthly payments toward debt beyond the required minimum amounts.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
    {
      id: 'otherSavings',
      label: 'Other Savings / Sinking Funds',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Any other savings or sinking funds not listed in categories above.',
      showWhen: (v) => parseFloat(v.monthlyIncome) > 0,
    },
  ],

  calculate: (values) => {
    const parse = (key: string) => parseFloat(values[key]) || 0;

    const monthlyIncome = parseFloat(values.monthlyIncome);
    if (isNaN(monthlyIncome) || monthlyIncome <= 0) return [];

    const totalNeeds =
      parse('rent') +
      parse('utilities') +
      parse('groceries') +
      parse('autoGas') +
      parse('insurance') +
      parse('childcare') +
      parse('otherNeeds');

    const totalWants =
      parse('diningOut') +
      parse('entertainment') +
      parse('subscriptions') +
      parse('shopping') +
      parse('travel') +
      parse('otherWants');

    const totalSavings =
      parse('emergencyFund') +
      parse('retirement401k') +
      parse('investmentBrokerage') +
      parse('extraDebtPayoff') +
      parse('otherSavings');

    const totalSpending = totalNeeds + totalWants + totalSavings;
    const leftover = monthlyIncome - totalSpending;

    const targetNeeds = monthlyIncome * 0.50;
    const targetWants = monthlyIncome * 0.30;
    const targetSavings = monthlyIncome * 0.20;

    const needsPct = (totalNeeds / monthlyIncome) * 100;
    const wantsPct = (totalWants / monthlyIncome) * 100;
    const savingsPct = (totalSavings / monthlyIncome) * 100;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const leftoverAbs = Math.abs(leftover);

    return [
      {
        id: 'leftover',
        label: 'Monthly Surplus / (Deficit)',
        value: `${leftover >= 0 ? '' : '-'}$${fmt(leftoverAbs)}`,
        highlight: true,
        color: leftover >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'totalSpendingResult',
        label: 'Total Monthly Spending',
        value: `$${fmt(totalSpending)}`,
        color: 'neutral',
      },
      {
        id: 'needsResult',
        label: `Needs \u2014 ${needsPct.toFixed(1)}% of income (target: 50%)`,
        value: `$${fmt(totalNeeds)}`,
        color: needsPct <= 50 ? 'positive' : 'negative',
      },
      {
        id: 'wantsResult',
        label: `Wants \u2014 ${wantsPct.toFixed(1)}% of income (target: 30%)`,
        value: `$${fmt(totalWants)}`,
        color: wantsPct <= 30 ? 'positive' : 'negative',
      },
      {
        id: 'savingsResult',
        label: `Savings \u2014 ${savingsPct.toFixed(1)}% of income (target: 20%)`,
        value: `$${fmt(totalSavings)}`,
        color: savingsPct >= 20 ? 'positive' : 'negative',
      },
      {
        id: '_budgetData',
        label: '_budgetData',
        value: JSON.stringify({
          monthlyIncome,
          totalNeeds,
          totalWants,
          totalSavings,
          totalSpending,
          leftover,
          targetNeeds,
          targetWants,
          targetSavings,
          needsPct,
          wantsPct,
          savingsPct,
        }),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BudgetPanel, { values, results });
  },

  educational: {
    formula: 'Leftover = Income \u2212 (Needs + Wants + Savings)',
    formulaDescription:
      'The 50/30/20 rule is a simple but powerful budgeting framework that provides a clear structure for managing your after-tax income. Your monthly surplus or deficit is simply your income minus everything you spend across the three categories. The framework works best when you track every dollar and review your spending patterns monthly.',
    diagram: {
      svg: budgetSvg,
      alt: 'Three horizontal bars showing the 50/30/20 budget rule: 50% needs in blue, 30% wants in green, 20% savings in red',
      caption: 'The 50/30/20 framework: half your income covers essentials, a third for lifestyle, and a fifth for future goals',
    },
    commonUses: [
      'Apply the 50/30/20 budgeting rule to your after-tax income by allocating needs, wants, and savings into clear spending categories.',
      'Identify whether your current spending patterns leave a monthly surplus or deficit across the three budget categories.',
      'Track your essential expenses, discretionary spending, and savings rate to find opportunities for better financial balance.',
    ],
    explanation:
      'The 50/30/20 rule is a simple budgeting framework popularized by Senator Elizabeth Warren. Allocate 50% of after-tax income to needs (essential living expenses), 30% to wants (lifestyle spending), and 20% to savings and debt elimination. The goal is not perfection \u2014 it is awareness. The categories are intentionally wide to make budgeting sustainable rather than restrictive. Needs include anything you must pay to survive and work: housing, utilities, groceries, transportation, insurance, and minimum loan payments. Wants are everything else you spend money on by choice: dining out, entertainment, subscriptions, travel, and shopping. Savings encompass not just retirement and emergency funds but also any extra payments on debt above the minimum required amount. If you have a surplus at the end of the month, consider directing it toward an emergency fund (3-6 months of expenses is the standard target) or increasing retirement contributions. A deficit means you are spending more than you earn and need to cut back \u2014 typically starting with wants before considering reductions in needs like downsizing housing or refinancing loans. The 50/30/20 rule is especially useful for people new to budgeting because it is flexible enough to accommodate different lifestyles while still enforcing financial discipline.',
    variables: [
      {
        symbol: 'Needs (50%)',
        name: 'Essential Expenses',
        description:
          'Rent/mortgage, utilities, groceries, transportation, minimum debt payments. These are non-negotiable expenses required for daily living and maintaining your job.',
      },
      {
        symbol: 'Wants (30%)',
        name: 'Lifestyle Spending',
        description:
          'Dining out, entertainment, subscriptions, travel, shopping. You choose these but could reduce or eliminate them if needed.',
      },
      {
        symbol: 'Savings (20%)',
        name: 'Financial Goals',
        description:
          'Emergency fund, retirement contributions, investing, and extra debt payoff above minimums. Building toward long-term financial security.',
      },
    ],
    howToUse: [
      'Enter your total monthly after-tax income \u2014 this is your take-home pay after all deductions.',
      'Fill in your needs expenses: rent/mortgage, utilities, groceries, transportation, insurance, minimum debt payments, and childcare.',
      'Add your wants: dining out, entertainment, subscriptions, shopping, travel, and any other discretionary spending.',
      'Enter your savings contributions: emergency fund, retirement accounts (401k, IRA), brokerage investments, and any extra debt payments above the minimum.',
      'Compare your actual percentages to the 50/30/20 targets. If you are overspending in one area, the dashboard shows exactly where to cut back.',
      'Use the surplus indicator to guide next steps \u2014 a positive surplus means you can increase savings or treat yourself; a deficit means immediate adjustments are needed.',
    ],
    faqs: [
      {
        question: 'What if my needs are already over 50%?',
        answer:
          'This is common in high cost-of-living cities like New York, San Francisco, or Boston, where housing alone can consume 40% or more of your income. The 50/30/20 is a guideline, not a rule. If your needs are at 60%, try rebalancing to 20% wants and 20% savings anyway. Focus on reducing fixed costs when possible \u2014 consider refinancing your mortgage, moving to a less expensive area, reducing transportation costs, or negotiating bills. Even small reductions in needs have a compounding effect because those savings flow directly into the other categories.',
      },
      {
        question: 'Does the 50/30/20 rule work for all income levels?',
        answer:
          'Higher earners often find they can save far more than 20% without much sacrifice, and the rule encourages that. Lower earners may find needs exceed 50% and leave little for savings and wants. In that situation, focus first on reducing needs (roommates, cheaper housing, public transit) and then on increasing income. The important thing is tracking your spending and being intentional about every dollar, regardless of the specific percentages.',
      },
      {
        question: 'Should I use gross or net income?',
        answer:
          "Use your net (after-tax) take-home pay. 401(k) contributions made pre-tax are counted in the savings bucket even though they don't appear in your take-home. If your employer deducts them before your paycheck, add them back to your \"savings\" total. Similarly, health insurance premiums deducted from your paycheck are a need, so include them in that category even though they are deducted before you receive your net pay. This ensures an accurate picture of your true spending allocation.",
      },
      {
        question: 'What counts as a "need" vs. a "want"?',
        answer:
          'The line can be blurry. A general rule: if you could eliminate the expense without a major life disruption, it is probably a want. Internet is a need for most remote workers; premium cable is a want. Basic groceries are a need; restaurant takeout is a want. A reliable used car is a need; a luxury vehicle lease is a want. Be honest with yourself about which category each expense truly belongs in.',
      },
      {
        question: 'How often should I review and update my budget?',
        answer:
          'Review your budget monthly at minimum. Income changes (raises, job changes), expense creep (subscription price increases, lifestyle inflation), and life events (moving, having a child, buying a car) all shift your allocation. Set a recurring calendar reminder for the 1st of each month to review the previous month\'s actual spending versus your budget. Use a budgeting app or spreadsheet to track automatically. The key is consistency \u2014 five minutes each month reviewing your numbers prevents years of unnoticed spending drift.',
      },
      {
        question: 'How do I handle irregular or variable income?',
        answer:
          'For freelancers, commission-based workers, or anyone with variable income, base your budget on your lowest-earning month from the past 12 months, not your average. This conservative approach ensures your needs are always covered. In high-earning months, direct the extra income proportionally: 50% to catch up on any deficit, 30% to a "wants" splurge fund, and 20% to extra savings or debt payoff. Building a 3-6 month emergency fund is especially critical when income is irregular.',
      },
      {
        question: 'What should I do with my monthly surplus?',
        answer:
          'If you consistently have a surplus after covering all three categories, allocate it strategically. First priority: build an emergency fund covering 3-6 months of expenses in a high-yield savings account. Second: pay down high-interest debt (credit cards, personal loans above 7% APR). Third: increase retirement contributions to at least 15% of gross income. Fourth: fund medium-term goals (home down payment, car replacement, education). Only after these are on track should surplus flow to additional lifestyle spending.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Alex is a software engineer in Chicago earning $7,200/month after taxes. They rent a studio apartment and want to optimize their budget for an early retirement goal.',
        inputs: { monthlyIncome: '7200', rent: '1800', utilities: '250', groceries: '400', autoGas: '300', insurance: '350', diningOut: '500', entertainment: '200', subscriptions: '80', shopping: '150', travel: '100', emergencyFund: '400', retirement401k: '1200', investmentBrokerage: '600' },
        result: 'Needs: 43.1% ($3,100) \u2014 under the 50% target. Wants: 14.3% ($1,030) \u2014 well under 30%. Savings: 30.6% ($2,200) \u2014 exceeding the 20% target. Monthly surplus: $870.',
        insight: 'Alex is in an excellent position. By keeping housing costs low (25% of income) and aggressively saving over 30%, they are on track for financial independence. The $870 monthly surplus could be directed to maxing out a Roth IRA or building a taxable brokerage account for bridge funds before retirement age.',
      },
      {
        scenario: 'Maria is a teacher in Austin with $4,500/month take-home. She has student loans, a car payment, and wants to balance debt payoff with building an emergency fund.',
        inputs: { monthlyIncome: '4500', rent: '1400', utilities: '200', groceries: '500', autoGas: '350', insurance: '300', childcare: '600', otherNeeds: '200', diningOut: '150', entertainment: '50', subscriptions: '30', shopping: '100', emergencyFund: '200', retirement401k: '150', extraDebtPayoff: '300' },
        result: 'Needs: 78.9% ($3,550) \u2014 significantly over the 50% target. Wants: 7.3% ($330) \u2014 minimal discretionary spending. Savings: 14.4% ($650) \u2014 approaching but not hitting 20%. Deficit: -$30/month.',
        insight: 'Maria\'s budget is tight but realistic for a single-income household with childcare costs. The 78.9% needs ratio reflects the reality of a teacher\'s salary in an urban area, not poor money management. Her $30 monthly deficit is small enough to close by reducing groceries by $10/week. Once the car is paid off, that $350/month can be redirected to savings, bringing her to the 20% target.',
      },
      {
        scenario: 'James and Priya are a dual-income couple in Seattle with a combined $11,000/month take-home, a mortgage, and one child. They want to know if they can afford a larger home.',
        inputs: { monthlyIncome: '11000', rent: '3200', utilities: '400', groceries: '900', autoGas: '500', insurance: '600', childcare: '1200', diningOut: '600', entertainment: '300', subscriptions: '100', shopping: '400', travel: '300', emergencyFund: '500', retirement401k: '1500', investmentBrokerage: '300', extraDebtPayoff: '200' },
        result: 'Needs: 61.8% ($6,800) \u2014 over the 50% target, driven by high housing and childcare. Wants: 15.5% ($1,700). Savings: 22.7% ($2,500). Surplus: $0.',
        insight: 'James and Priya\'s budget is exactly balanced with zero surplus \u2014 no room for unexpected expenses. Their housing cost ($3,200) at 29% of take-home is manageable, but upgrading to a larger home (likely $4,500+/month mortgage) would push needs past 70%, risking a monthly deficit. They should wait until childcare costs decrease (approximately $1,200/month) before upsizing their home.',
      },
    ],
    proTips: [
      'Track every dollar for 30 days before setting your budget. Most people underestimate their "wants" spending by 20-30% because small daily purchases (coffee, lunch, apps) add up without being noticed. Use a budgeting app that auto-categorizes transactions.',
      'Treat savings as your most important "bill." Automate transfers to savings and investment accounts on payday \u2014 before you see the money in checking. This "pay yourself first" approach makes saving effortless and removes the temptation to spend first and save what is left.',
      'Use separate bank accounts for needs, wants, and savings. Many banks now offer "buckets" or sub-accounts. When your wants account is empty for the month, you stop discretionary spending \u2014 no mental math required.',
      'Re-evaluate subscriptions quarterly. The average American spends $219/month on subscriptions, many of which go unused. Set a calendar reminder every 3 months to audit all recurring charges. Cancel anything you have not used in the past 30 days.',
    ],
    limitations: [
      'The 50/30/20 rule is a guideline, not a one-size-fits-all prescription. In very high cost-of-living areas (NYC, SF, Boston), housing alone may consume 40-50% of take-home pay, making a strict 50% needs target unrealistic.',
      'This calculator does not account for irregular or seasonal expenses (annual insurance premiums, holiday spending, car repairs). Budget for these by creating "sinking funds" \u2014 set aside 1/12th of each expected annual expense every month.',
      'If you have high-interest debt (credit cards, payday loans), prioritize paying it off before following the 50/30/20 split \u2014 the guaranteed return from eliminating 20%+ APR debt outweighs any investment return.',
      'This is a planning tool that provides estimates based on the numbers you enter. It does not replace professional financial advice.',
    ],
  citations: [
    { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/b/budget.asp' },
  ],
  },
};

export default budgetCalculatorConfig;
