import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ClosingCostsPanel from './ClosingCostsPanel';

const closingCostsConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Purchase Price',
      type: 'number',
      placeholder: '400,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
    },
    {
      id: 'downPaymentPct',
      label: 'Down Payment',
      type: 'number',
      placeholder: '20',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Used to calculate the loan amount',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      options: [
        { label: '30 years', value: '30' },
        { label: '20 years', value: '20' },
        { label: '15 years', value: '15' },
        { label: '10 years', value: '10' },
      ],
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'number',
      placeholder: '6.8',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      helpText: 'Used to estimate prepaid interest at closing',
    },
    {
      id: 'party',
      label: 'Show Costs For',
      type: 'select',
      required: true,
      options: [
        { label: 'Buyer Closing Costs', value: 'buyer' },
        { label: 'Seller Closing Costs', value: 'seller' },
        { label: 'Both Buyer & Seller', value: 'both' },
      ],
    },
  ],
  calculate: (values) => {
    const homePrice = parseFloat(values.homePrice);
    const downPct = (parseFloat(values.downPaymentPct) || 20) / 100;
    const annualRate = parseFloat(values.interestRate) / 100;
    const party = values.party || 'buyer';

    if (isNaN(homePrice) || homePrice <= 0) return [];

    const loanAmount = homePrice * (1 - downPct);
    if (loanAmount <= 0 && party !== 'seller') return [];

    const fmt = (n: number) =>
      `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    const originationFee = loanAmount * 0.01;
    const appraisalFee = 550;
    const creditReport = 35;
    const underwritingFee = 995;
    const loanFeesTotal = originationFee + appraisalFee + creditReport + underwritingFee;

    const titleSearch = 350;
    const titleInsuranceLender = loanAmount * 0.005;
    const titleInsuranceOwner = homePrice * 0.004;
    const settlementFee = 450;
    const recordingFee = 150;
    const titleFeesTotal = titleSearch + titleInsuranceLender + titleInsuranceOwner + settlementFee + recordingFee;

    const daysInMonth = 15;
    const prepaidInterest = (loanAmount * (annualRate / 365)) * daysInMonth;
    const prepaidHomeInsurance = homePrice * 0.005;
    const propertyTaxEscrow = (homePrice * 0.012) / 12 * 3;
    const escrowSetupFee = 350;
    const prepaidTotal = prepaidInterest + prepaidHomeInsurance + propertyTaxEscrow + escrowSetupFee;

    const totalBuyer = loanFeesTotal + titleFeesTotal + prepaidTotal;

    const agentCommissionBuyer = homePrice * 0.025;
    const agentCommissionSeller = homePrice * 0.025;
    const sellerTitleInsurance = homePrice * 0.004;
    const transferTax = homePrice * 0.002;
    const homeWarranty = 500;
    const totalSeller = agentCommissionBuyer + agentCommissionSeller + sellerTitleInsurance + transferTax + homeWarranty;

    const results = [];

    if (party === 'buyer' || party === 'both') {
      results.push({
        id: 'totalBuyer',
        label: `Total Buyer Closing Costs`,
        value: `${fmt(totalBuyer)} (${((totalBuyer / homePrice) * 100).toFixed(1)}% of price)`,
        highlight: party === 'buyer',
        color: 'neutral' as const,
      });

      results.push({
        id: 'loanFeesHeader',
        label: 'LOAN / LENDER FEES',
        value: fmt(loanFeesTotal),
        color: 'neutral' as const,
      });
      results.push({ id: 'origination', label: '  Loan Origination Fee (1%)', value: fmt(originationFee), color: 'neutral' as const });
      results.push({ id: 'appraisal', label: '  Appraisal Fee', value: fmt(appraisalFee), color: 'neutral' as const });
      results.push({ id: 'creditReport', label: '  Credit Report Fee', value: fmt(creditReport), color: 'neutral' as const });
      results.push({ id: 'underwriting', label: '  Underwriting Fee', value: fmt(underwritingFee), color: 'neutral' as const });

      results.push({
        id: 'titleFeesHeader',
        label: 'TITLE & THIRD-PARTY FEES',
        value: fmt(titleFeesTotal),
        color: 'neutral' as const,
      });
      results.push({ id: 'titleSearch', label: '  Title Search', value: fmt(titleSearch), color: 'neutral' as const });
      results.push({ id: 'titleInsLender', label: "  Lender's Title Insurance", value: fmt(titleInsuranceLender), color: 'neutral' as const });
      results.push({ id: 'titleInsOwner', label: "  Owner's Title Insurance", value: fmt(titleInsuranceOwner), color: 'neutral' as const });
      results.push({ id: 'settlementFee', label: '  Settlement / Escrow Fee', value: fmt(settlementFee), color: 'neutral' as const });
      results.push({ id: 'recording', label: '  Recording Fee', value: fmt(recordingFee), color: 'neutral' as const });

      results.push({
        id: 'prepaidHeader',
        label: 'PREPAIDS & ESCROW SETUP',
        value: fmt(prepaidTotal),
        color: 'neutral' as const,
      });
      results.push({ id: 'prepaidInterest', label: '  Prepaid Interest (~15 days)', value: fmt(prepaidInterest), color: 'neutral' as const });
      results.push({ id: 'prepaidIns', label: '  Prepaid Homeowners Insurance', value: fmt(prepaidHomeInsurance), color: 'neutral' as const });
      results.push({ id: 'taxEscrow', label: '  Property Tax Escrow (3 mo.)', value: fmt(propertyTaxEscrow), color: 'neutral' as const });
      results.push({ id: 'escrowSetup', label: '  Escrow Setup / Cushion', value: fmt(escrowSetupFee), color: 'neutral' as const });
    }

    if (party === 'seller' || party === 'both') {
      results.push({
        id: 'totalSeller',
        label: 'Total Seller Closing Costs',
        value: `${fmt(totalSeller)} (${((totalSeller / homePrice) * 100).toFixed(1)}% of price)`,
        highlight: party === 'seller',
        color: 'neutral' as const,
      });
      results.push({ id: 'commissionBuyer', label: "  Buyer's Agent Commission (2.5%)", value: fmt(agentCommissionBuyer), color: 'negative' as const });
      results.push({ id: 'commissionSeller', label: "  Seller's Agent Commission (2.5%)", value: fmt(agentCommissionSeller), color: 'negative' as const });
      results.push({ id: 'sellerTitle', label: "  Owner's Title Insurance (Seller)", value: fmt(sellerTitleInsurance), color: 'neutral' as const });
      results.push({ id: 'transferTax', label: '  Transfer / Excise Tax', value: fmt(transferTax), color: 'neutral' as const });
      results.push({ id: 'homeWarranty', label: '  Home Warranty (optional)', value: fmt(homeWarranty), color: 'neutral' as const });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ClosingCostsPanel, { values, results });
  },
  educational: {
    formula: 'Buyer Costs ≈ 2–5% of Purchase Price | Seller Costs ≈ 5–6% of Sale Price',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="80" width="320" height="50" fill="var(--svg-3b82f6)" rx="4"/><text x="220" y="110" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Lender Fees (Origination, Appraisal)</text><rect x="60" y="140" width="320" height="50" fill="var(--svg-ef4444)" rx="4"/><text x="220" y="170" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Title & Third-Party Fees</text><rect x="60" y="200" width="320" height="50" fill="var(--svg-22c55e)" rx="4"/><text x="220" y="230" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Prepaids & Escrow</text><text x="220" y="290" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Closing Costs: 2-5% of Purchase Price</text></svg>',
      alt: 'Three stacked categories of closing costs: lender fees, title fees, and prepaids',
      caption: 'Closing costs — lender fees, title and third-party fees, and prepaids/escrow',
    },
    formulaDescription:
      'Closing costs are the fees paid by buyers and sellers to finalize a real estate transaction. For buyers, these fall into three categories: Loan or Lender Fees (origination, appraisal, underwriting), Title and Third-Party Fees (title search, insurance, settlement), and Prepaids or Escrow (upfront interest, insurance reserves, property tax collections). Seller costs are dominated by real estate agent commissions alongside transfer taxes and title-related fees.',
    variables: [
      { symbol: 'Origination Fee', name: 'Loan Origination', description: 'A lender fee for processing and underwriting your mortgage application, typically 1% of the loan amount. This fee can sometimes be negotiated or waived in exchange for a slightly higher interest rate.' },
      { symbol: 'Title Insurance', name: 'Title Insurance', description: 'An insurance policy that protects both the lender and the buyer against claims, liens, or defects in the property\'s title history. The lender\'s policy is typically required; the owner\'s policy is optional but recommended.' },
      { symbol: 'Prepaids', name: 'Prepaid Items', description: 'Upfront amounts collected at closing for items including daily interest from the closing date to month-end, the first year of homeowners insurance, and several months of property tax escrow deposits.' },
      { symbol: 'Commission', name: 'Agent Commission', description: 'The fee paid to real estate agents for facilitating the transaction. Traditionally 5-6% total split between buyer\'s and seller\'s agents, now fully negotiable following the 2024 NAR settlement changes.' },
      { symbol: 'Transfer Tax', name: 'Transfer or Excise Tax', description: 'A government tax imposed when property ownership transfers from seller to buyer. Rates vary widely by state, county, and municipality, typically ranging from 0.1% to 2% of the sale price.' },
    ],
    howToUse: [
      'Enter the home purchase price and your down payment percentage to calculate the estimated loan amount.',
      'Enter the interest rate to estimate the prepaid daily interest amount collected at closing (typically 15 days of interest).',
      'Select whether to view buyer closing costs, seller closing costs, or both sides simultaneously for a full transaction picture.',
      'Review the full itemized breakdown split into Loan Fees, Title and Third-Party Fees, and Prepaids or Escrow categories.',
      'Note that these are national averages — actual costs vary significantly by state, county, and individual lender. Always review your Loan Estimate document for precise figures.',
      'Toggle between buyer and seller views to understand how the total transaction costs are distributed between the two parties.',
    ],
    explanation:
      'Closing costs are the fees and expenses paid to finalize a real estate transaction beyond the purchase price of the home itself. For buyers, these costs typically range from 2% to 5% of the purchase price and fall into three main categories. Loan and Lender Fees include the origination fee (typically 1% of the loan amount), appraisal fee to verify the property value, credit report fee, and underwriting fee. Title and Third-Party Fees cover the title search to verify there are no liens or claims against the property, both lender and owner title insurance policies, the settlement or escrow fee for coordinating the closing, and recording fees to register the deed with the county. Prepaids and Escrow include daily interest from the closing date to the end of the month (prepaid interest), the initial year of homeowners insurance premium, and property tax escrow deposits (typically 2-3 months of taxes). The largest cost for sellers is real estate agent commissions, which traditionally totaled 5-6% of the sale price split between the listing agent and the buyer\'s agent. Following the 2024 National Association of Realtors settlement, these commissions are now fully negotiable, and buyers may need to negotiate and pay their own agent\'s compensation directly. Sellers also typically pay transfer or excise taxes, which vary by location, and may contribute to the buyer\'s closing costs through seller concessions, a common practice in buyer\'s markets.',
    faqs: [
      {
        question: 'Can closing costs be rolled into the mortgage?',
        answer: 'Some lenders offer no-closing-cost mortgages where the closing costs are rolled into the loan balance or offset by a higher interest rate. While this reduces your cash needed at closing, it increases the total interest paid over the life of the loan and may result in a higher monthly payment.',
      },
      {
        question: 'Can the seller pay my closing costs?',
        answer: 'Yes, seller concessions are common, especially in buyer\'s markets. Sellers can credit the buyer for some or all of their closing costs as part of the negotiated purchase agreement. Conventional loans typically limit seller concessions to 3% of the purchase price for down payments under 10%, while FHA and VA loans allow up to 6% and 4% respectively.',
      },
      {
        question: 'What changed with the 2024 NAR settlement on commissions?',
        answer: 'As of August 2024, sellers are no longer required to offer buyer agent compensation through the Multiple Listing Service. Buyers may now need to negotiate and pay their own agent directly, and agent commissions are fully negotiable rather than set at the traditional 5-6%. This has significant implications for how much cash buyers need at closing.',
      },
      {
        question: 'How accurate are these estimates?',
        answer: 'These figures are national averages and will vary by location and lender. Your lender is legally required to provide a Loan Estimate within three business days of receiving your application. This official document gives you the actual costs specific to your transaction and is binding within a tolerance margin.',
      },
      {
        question: 'What is the difference between lender and owner title insurance?',
        answer: 'Lender\'s title insurance protects the mortgage lender\'s financial interest in the property and is typically required. Owner\'s title insurance protects the buyer\'s equity and is optional but highly recommended. The owner\'s policy covers legal fees if someone challenges your ownership, while the lender policy only covers the outstanding loan balance.',
      },
      {
        question: 'Are there ways to reduce closing costs?',
        answer: 'You can reduce closing costs by shopping between lenders for lower origination fees, asking about lender credits in exchange for a higher rate, negotiating seller concessions, closing toward the end of the month to reduce prepaid interest, and comparing title company fees. Some state and local programs also offer closing cost assistance for first-time buyers.',
      },
    ],
    citations: [
      { source: 'National Association of Realtors', url: 'https://www.nar.realtor/research-and-statistics' },
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/owning-a-home/closing-disclosure/' },
    ],
  },
};

export default closingCostsConfig;
