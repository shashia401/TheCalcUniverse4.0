import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import CommissionPanel from './CommissionPanel';

// ─── Commission Table Generator ────────────────────────────────────────
function generateCommissionTable(sale: number, effectiveRate: number): string {
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const volumes = [5000, 10000, 25000, 50000, 75000, 100000, 250000, 500000, 750000, 1000000];
  const maxVol = Math.max(sale * 2, 1000000);
  const lines = volumes
    .filter((v) => v <= maxVol)
    .map((v) => {
      const comm = v * (effectiveRate / 100);
      return `• $${fmt(v)} → $${fmt(comm)} (${effectiveRate.toFixed(2)}%)`;
    });
  return `At your effective rate of ${effectiveRate.toFixed(2)}%:\n${lines.join('\n')}`;
}

const commissionConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'structure',
      label: 'Commission Structure',
      type: 'select',
      required: true,
      options: [
        { label: 'Flat Rate (Straight Commission)', value: 'flat' },
        { label: 'Tiered / Graduated Commission', value: 'tiered' },
        { label: 'Real Estate Agent Split', value: 'realestate' },
      ],
      helpText: 'Choose the type of commission plan that applies to your role.',
    },
    {
      id: 'saleAmount',
      label: 'Sale Amount / Revenue',
      type: 'number',
      placeholder: '250,000',
      prefix: '$',
      required: true,
      helpText: 'The total transaction value or gross revenue for this deal.',
    },
    // ─── Base Salary (optional, for all structures) ───
    {
      id: 'baseSalary',
      label: 'Base Salary (optional)',
      type: 'number',
      placeholder: '40,000',
      prefix: '$',
      helpText: 'Annual base salary. If entered, total annual compensation (OTE) is shown.',
    },
    // ─── Flat rate ───
    {
      id: 'flatRate',
      label: 'Commission Rate',
      type: 'number',
      placeholder: '10',
      unit: '%',
      step: 0.1,
      required: true,
      showWhen: (v) => (v.structure || 'flat') === 'flat',
      helpText: 'Single percentage rate applied to the entire sale amount.',
    },
    // ─── Tiered (up to 3 tiers) ───
    {
      id: 'tier1Limit',
      label: 'Tier 1 Limit',
      type: 'number',
      placeholder: '50,000',
      prefix: '$',
      helpText: 'Sales up to this amount earn the Tier 1 rate. Must be greater than 0.',
      required: true,
      showWhen: (v) => v.structure === 'tiered',
    },
    {
      id: 'tier1Rate',
      label: 'Tier 1 Rate',
      type: 'number',
      placeholder: '5',
      unit: '%',
      step: 0.1,
      required: true,
      showWhen: (v) => v.structure === 'tiered',
      helpText: 'Commission percentage applied to sales within the Tier 1 limit.',
    },
    {
      id: 'tier2Limit',
      label: 'Tier 2 Limit (leave blank for 2 tiers)',
      type: 'number',
      placeholder: '150,000',
      prefix: '$',
      showWhen: (v) => v.structure === 'tiered',
      helpText: 'Sales above Tier 1 and up to this amount earn the Tier 2 rate.',
    },
    {
      id: 'tier2Rate',
      label: 'Tier 2 Rate',
      type: 'number',
      placeholder: '8',
      unit: '%',
      step: 0.1,
      showWhen: (v) => v.structure === 'tiered',
      helpText: 'Commission rate for sales falling within Tier 2 range.',
    },
    {
      id: 'tier3Rate',
      label: 'Tier 3 Rate (applied above Tier 2 Limit)',
      type: 'number',
      placeholder: '12',
      unit: '%',
      step: 0.1,
      showWhen: (v) => v.structure === 'tiered',
      helpText: 'Commission rate for all sales above the Tier 2 limit.',
    },
    // ─── Real estate ───
    {
      id: 'reGrossPct',
      label: 'Gross Commission % (paid by seller)',
      type: 'number',
      placeholder: '6',
      unit: '%',
      step: 0.1,
      required: true,
      helpText: 'Total commission paid by the seller — typically 5–6%.',
      showWhen: (v) => v.structure === 'realestate',
    },
    {
      id: 'reAgentSplitPct',
      label: 'Agent Split % of side commission',
      type: 'number',
      placeholder: '60',
      unit: '%',
      step: 1,
      required: true,
      helpText: 'After the 50/50 listing/buyer side split, what % of YOUR side goes to you (vs broker).',
      showWhen: (v) => v.structure === 'realestate',
    },
    {
      id: 'reFranchisePct',
      label: 'Franchise / Royalty Fee %',
      type: 'number',
      placeholder: '6',
      unit: '%',
      step: 0.1,
      helpText: 'Skimmed off the top of the side commission BEFORE the agent/broker split.',
      showWhen: (v) => v.structure === 'realestate',
    },
  ],

  calculate: (values) => {
    const structure = values.structure || 'flat';
    const sale = parseFloat(values.saleAmount);
    const baseSalary = parseFloat(values.baseSalary) || 0;
    if (isNaN(sale) || sale <= 0) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let gross = 0;
    let effectiveRate = 0;
    let commissionTable = '';

    // ─── Helper to append results common to all structures ───
    function buildResults(extraResults: CalculatorResult[]): CalculatorResult[] {
      const results: CalculatorResult[] = [
        { id: 'net', label: 'Your Net Commission', value: `$${fmt(gross)}`, highlight: true, color: 'positive' as const },
        { id: 'sale', label: 'Sale Amount', value: `$${fmt(sale)}`, color: 'neutral' as const },
        ...extraResults,
      ];
      if (baseSalary > 0) {
        const totalComp = baseSalary + gross;
        results.push(
          { id: 'baseSalary', label: 'Base Salary (annual)', value: `$${fmt(baseSalary)}`, color: 'neutral' as const },
          { id: 'totalComp', label: 'Total Annual Compensation (OTE = Salary + Commission)', value: `$${fmt(totalComp)}`, highlight: true, color: 'positive' as const },
        );
      }
      // Commission Table — always appended for SEO
      results.push({
        id: 'commTable',
        label: 'Earnings by Volume',
        value: commissionTable,
        color: 'neutral' as const,
      });
      return results;
    }

    // ─── FLAT RATE ──────────────────────────────────────────────
    if (structure === 'flat') {
      const rate = parseFloat(values.flatRate);
      if (isNaN(rate)) return [];
      if (rate < 0 || rate > 100) {
        return [
          { id: 'err', label: 'Flat Rate Error', value: 'Commission Rate must be between 0% and 100%.', color: 'negative' as const, highlight: true },
        ];
      }
      gross = sale * (rate / 100);
      effectiveRate = rate;
      commissionTable = generateCommissionTable(sale, effectiveRate);
      return buildResults([
        { id: 'rate', label: 'Commission Rate', value: `${rate.toFixed(2)}%`, color: 'neutral' as const },
      ]);
    }

    // ─── TIERED / GRADUATED ─────────────────────────────────────
    if (structure === 'tiered') {
      const t1Limit = parseFloat(values.tier1Limit);
      const t1Rate = parseFloat(values.tier1Rate);
      const t2Limit = parseFloat(values.tier2Limit);
      const t2Rate = parseFloat(values.tier2Rate);
      const t3Rate = parseFloat(values.tier3Rate);

      if (isNaN(t1Limit) || isNaN(t1Rate) || t1Limit <= 0 || t1Rate < 0 || t1Rate > 100) return [];

      // Validate tier configuration
      const errs: string[] = [];
      if (!isNaN(t2Limit) && isNaN(t2Rate)) {
        errs.push('Tier 2 Limit was set but Tier 2 Rate is blank — please enter a Tier 2 Rate or clear the Tier 2 Limit.');
      }
      if (!isNaN(t2Limit) && t2Limit <= t1Limit) {
        errs.push(`Tier 2 Limit ($${fmt(t2Limit)}) must be greater than Tier 1 Limit ($${fmt(t1Limit)}).`);
      }
      if (!isNaN(t2Rate) && (t2Rate < 0 || t2Rate > 100)) {
        errs.push('Tier 2 Rate must be between 0% and 100%.');
      }
      if (!isNaN(t3Rate) && (t3Rate < 0 || t3Rate > 100)) {
        errs.push('Tier 3 Rate must be between 0% and 100%.');
      }
      if (!isNaN(t3Rate) && isNaN(t2Limit)) {
        errs.push('Tier 3 Rate requires a Tier 2 Limit (defines where Tier 3 begins).');
      }
      if (errs.length > 0) {
        return errs.map((e, i) => ({
          id: `err${i}`,
          label: 'Tiered Configuration Error',
          value: e,
          color: 'negative' as const,
          highlight: i === 0,
        }));
      }

      let tierGross = 0;
      const breakdown: string[] = [];

      const inT1 = Math.min(sale, t1Limit);
      const c1 = inT1 * (t1Rate / 100);
      tierGross += c1;
      breakdown.push(`Tier 1 (0 – $${fmt(t1Limit)}): $${fmt(inT1)} × ${t1Rate}% = $${fmt(c1)}`);

      let remaining = sale - inT1;
      if (remaining > 0 && !isNaN(t2Limit) && !isNaN(t2Rate)) {
        const tier2Span = t2Limit - t1Limit;
        const inT2 = Math.min(remaining, tier2Span);
        const c2 = inT2 * (t2Rate / 100);
        tierGross += c2;
        breakdown.push(`Tier 2 ($${fmt(t1Limit)} – $${fmt(t2Limit)}): $${fmt(inT2)} × ${t2Rate}% = $${fmt(c2)}`);
        remaining -= inT2;
        if (remaining > 0 && !isNaN(t3Rate)) {
          const c3 = remaining * (t3Rate / 100);
          tierGross += c3;
          breakdown.push(`Tier 3 (> $${fmt(t2Limit)}): $${fmt(remaining)} × ${t3Rate}% = $${fmt(c3)}`);
        }
      } else if (remaining > 0 && !isNaN(t2Rate) && isNaN(t2Limit)) {
        const c2 = remaining * (t2Rate / 100);
        tierGross += c2;
        breakdown.push(`Tier 2 (> $${fmt(t1Limit)}): $${fmt(remaining)} × ${t2Rate}% = $${fmt(c2)}`);
      }

      gross = tierGross;
      effectiveRate = (gross / sale) * 100;
      commissionTable = generateCommissionTable(sale, effectiveRate);

      return buildResults([
        ...breakdown.map((b, i) => {
          const [labelPart, ...valParts] = b.split(': ');
          return { id: `tier${i}`, label: labelPart, value: valParts.join(': '), color: 'neutral' as const };
        }),
        { id: 'effective', label: 'Blended Effective Rate', value: `${effectiveRate.toFixed(2)}%`, color: 'neutral' as const },
      ]);
    }

    // ─── REAL ESTATE SPLIT ──────────────────────────────────────
    const reGross = parseFloat(values.reGrossPct);
    const agentSplit = parseFloat(values.reAgentSplitPct);
    const franchise = parseFloat(values.reFranchisePct) || 0;
    if (isNaN(reGross) || isNaN(agentSplit)) return [];
    if (reGross < 0 || reGross > 100 || agentSplit < 0 || agentSplit > 100 || franchise < 0 || franchise > 100) {
      return [
        { id: 'err', label: 'Real Estate Configuration Error', value: 'Gross Commission %, Agent Split %, and Franchise Fee % must each be between 0 and 100.', color: 'negative' as const, highlight: true },
      ];
    }

    const totalCommission = sale * (reGross / 100);
    const sideCommission = totalCommission / 2;
    const franchiseFee = sideCommission * (franchise / 100);
    const afterFranchise = sideCommission - franchiseFee;
    const agentTakeHome = afterFranchise * (agentSplit / 100);
    const brokerTakeHome = afterFranchise - agentTakeHome;
    gross = agentTakeHome;
    effectiveRate = (gross / sale) * 100;
    commissionTable = generateCommissionTable(sale, effectiveRate);

    return buildResults([
      { id: 'totalComm', label: `Total Commission (${reGross}% paid by seller)`, value: `$${fmt(totalCommission)}`, color: 'neutral' as const },
      { id: 'sideComm', label: 'Your Side Commission (50% of total)', value: `$${fmt(sideCommission)}`, color: 'neutral' as const },
      { id: 'franchise', label: `Franchise / Royalty Fee (${franchise}%)`, value: `−$${fmt(franchiseFee)}`, color: 'negative' as const },
      { id: 'broker', label: `To Broker (${(100 - agentSplit).toFixed(0)}%)`, value: `−$${fmt(brokerTakeHome)}`, color: 'negative' as const },
      { id: 'effective', label: 'Effective Rate of Sale Price', value: `${effectiveRate.toFixed(2)}%`, color: 'neutral' as const },
    ]);
  },

  educational: {
    formula: 'Flat: Net = Sale × Rate | Tiered: Net = Σ(Tier Spanₙ × Tier Rateₙ) | Real Estate: Net = (Sale × Gross% / 2) × (1 − Franchise%) × Agent Split%',
    formulaDescription:
      'For flat structures the math is straightforward. Tiered (graduated) commissions apply increasing rates to different revenue brackets — much like income tax brackets, the blended effective rate always sits between the lowest and highest tier rate. Real estate splits follow a waterfall: franchise fee off the top of the side commission, then the remainder split between agent and broker. Adding a base salary produces On-Target Earnings (OTE).',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">Commission Structure Flow</text><rect x="50" y="30" width="220" height="30" rx="5" fill="var(--svg-f0f9ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="160" y="49" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Flat: Sale × Rate = Commission</text><rect x="50" y="68" width="220" height="30" rx="5" fill="var(--svg-f0f9ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="160" y="87" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Tiered: Σ(Tier × Rate) per bracket</text><rect x="50" y="106" width="220" height="55" rx="5" fill="var(--svg-fef2f2)" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="160" y="125" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Real Estate Waterfall:</text><text x="55" y="143" font-size="9" fill="var(--svg-555555)">Gross → /2 (side) → −Franchise →</text><text x="55" y="156" font-size="9" fill="var(--svg-555555)">× AgentSplit → Net Commission</text><rect x="15" y="170" width="290" height="24" rx="5" fill="var(--svg-f0f9ff)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="186" text-anchor="middle" font-size="9" fill="var(--svg-555555)">OTE = Base Salary + Commission (blended effective rate)</text></svg>',
      alt: 'Commission structure comparison showing flat, tiered, and real estate waterfall models',
      caption: 'Flat rate applies a single percentage; tiered uses brackets; real estate follows a waterfall from gross to net.',
    },
    variables: [
      { symbol: 'Sale', name: 'Sale Amount / Revenue', description: 'The transaction value or gross revenue the commission is calculated from.' },
      { symbol: 'Rate', name: 'Commission Rate', description: 'A percentage of the sale paid to the salesperson.' },
      { symbol: 'Tier Span', name: 'Tier Bracket', description: 'The dollar range of the sale falling within a given tier (e.g., $0 to $50K).' },
      { symbol: 'Gross%', name: 'Gross Commission %', description: 'Total commission percentage paid by the seller (typically 5–6% in real estate).' },
      { symbol: 'Agent Split', name: 'Agent / Broker Split', description: "The agent's share of their side commission after the broker's cut." },
      { symbol: 'Base Salary', name: 'Base Salary', description: 'Fixed annual salary paid regardless of commission earnings.' },
      { symbol: 'OTE', name: 'On-Target Earnings', description: 'Total compensation = Base Salary + Commission (OTE in sales terminology).' },
    ],
    howToUse: [
      'Select your commission structure: Flat Rate (straight commission), Tiered/Graduated, or Real Estate Agent Split.',
      'Enter the sale amount or total revenue for this deal.',
      'Optionally enter a base salary to see total annual compensation (OTE = salary + commission).',
      'For flat rate: just enter the commission percentage. For tiered: enter each tier limit and rate. For real estate: enter gross commission %, your agent split %, and any franchise fee.',
      'After calculating, scroll down to view the "Commission Table" — earnings at different volume levels ($5K, $10K, $25K, $50K, $100K, $250K, $500K, $1M).',
    ],
    commonUses: [
      'Calculate total commission earnings under tiered or graduated structures to set monthly and quarterly sales targets.',
      'Compare flat-rate versus tiered commission plans to understand which compensation structure benefits your income the most.',
      'Determine the agent commission split after brokerage fees and franchise deductions for real estate transactions.',
    ],
    explanation:
      'Tiered/graduated commission structures are the industry standard for high-performance sales roles: your first dollars earn a lower rate, and as you sell more you "graduate" into higher rates on each marginal dollar. This creates a powerful incentive to push past quotas. In real estate, the franchise fee is subtracted BEFORE the agent/broker split (the "waterfall" order of operations matters enormously — a 6% franchise fee on a 60/40 split effectively reduces the agent\'s share to ~56.4%). The Commission Table visualizes earnings at standard volume milestones, making it easy to set monthly sales targets.',
    faqs: [
      {
        question: 'How is a tiered (graduated) commission different from a flat commission?',
        answer:
          'A flat commission applies a single rate to the entire sale (e.g., 10% of $200K = $20K). A tiered/graduated commission splits the sale into brackets, applying a higher rate to each successive bracket — for example, the first $50K earns 5%, the next $100K earns 8%, and anything above earns 12%. This incentivizes closing larger deals because the marginal commission rate increases. The blended effective rate will always sit between your lowest and highest tier rate.',
      },
      {
        question: 'What does the Commission Table show and why is it useful?',
        answer:
          'The Commission Table displays what you would earn at different transaction volumes — $5K, $10K, $25K, $50K, $100K, $250K, $500K, $750K, and $1M — at your effective commission rate. It\'s the fastest way to visualize how volume scales your income and to set monthly or quarterly sales targets. For example, if your effective rate is 7.5%, you instantly see that $100K in sales generates $7,500 in commission.',
      },
      {
        question: 'What is OTE (On-Target Earnings) and does base salary affect commission?',
        answer:
          'OTE stands for On-Target Earnings — the sum of your base salary plus expected commission. Many sales roles offer a base salary to provide income stability while the commission provides upside. When you enter a base salary, the calculator shows your total annual compensation. For example, a $40K base plus $60K in commissions = $100K OTE. Use this to evaluate total job offers, not just the commission rate.',
      },
      {
        question: 'What is a typical real estate commission split for a new vs. experienced agent?',
        answer:
          'New agents typically start at 50/50 to 60/40 (agent/broker), graduating to 70/30, 80/20, or even 100% after hitting "caps" at their brokerage. Top producers at cap-based brokerages keep nearly all commission after paying a fixed annual fee. The waterfall order (franchise → broker split → agent) matters more than the headline percentage — always model your actual take-home using the fee waterfall.',
      },
    ],
  citations: [
    { source: 'IRS Publication 15', url: 'https://www.irs.gov/publications/p15' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/c/commission.asp' },
  ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CommissionPanel, { values, results });
  },
};

export default commissionConfig;
