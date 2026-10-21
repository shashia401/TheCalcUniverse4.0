import { describe, it, expect } from 'vitest';
import type { CalculatorConfig } from '../../../src/types/calculator';
import futureValue from '../../../src/calculators/finance/future-value';
import heloc from '../../../src/calculators/finance/heloc';
import homeEquityLoan from '../../../src/calculators/finance/home-equity-loan';
import incomeTax from '../../../src/calculators/finance/income-tax';
import interestRate from '../../../src/calculators/finance/interest-rate';
import investment from '../../../src/calculators/finance/investment';
import ira from '../../../src/calculators/finance/ira-calculator';
import irr from '../../../src/calculators/finance/irr-calculator';
import marriageTax from '../../../src/calculators/finance/marriage-tax';
import mortgageComparison from '../../../src/calculators/finance/mortgage-comparison';
import mortgagePayoff from '../../../src/calculators/finance/mortgage-payoff';
import mutualFund from '../../../src/calculators/finance/mutual-fund';
import netWorth from '../../../src/calculators/finance/net-worth';
import nyMortgage from '../../../src/calculators/finance/new-york-mortgage-calculator';
import paybackPeriod from '../../../src/calculators/finance/payback-period';
import paycheck from '../../../src/calculators/finance/paycheck-calculator';
import pension from '../../../src/calculators/finance/pension';
import refinance from '../../../src/calculators/finance/refinance';

// Oracle: every expected string below was produced by an independent Python script (decimal module, 60-digit
// precision, `python -I`) that never imports or re-runs the calculators: tax slices by hand from the 2026 bracket
// tables, amortisation / future-value closed forms, the payoff and refinance horizons by month-by-month Decimal
// simulation, IRR roots by bisection on a 1% NPV grid. The scripts's output was first checked against the live
// steps (42 scenarios, 0 mismatches), then pinned here.
//
// Paycheck: state tax schedules are unverified (docs/TASKS.md D3b), so the Alabama state figure in that case is
// the calculator's own number, not an independent one; the federal, FICA and net-pay figures are independent.

const CALCS: Record<string, CalculatorConfig> = {
  fv: futureValue, heloc, hel: homeEquityLoan, itx: incomeTax, ir: interestRate, inv: investment, ira, irr,
  mt: marriageTax, mc: mortgageComparison, mp: mortgagePayoff, mf: mutualFund, nw: netWorth, ny: nyMortgage,
  pb: paybackPeriod, pc: paycheck, pen: pension, refi: refinance,
};

const CASES: Record<string, { v: Record<string, string>; steps: string[][] }> = {
 "fv-defaults": {
  "v": {
   "presentValue": "10000",
   "annualRate": "7",
   "years": "10",
   "compounding": "1",
   "monthlyContribution": "500"
  },
  "steps": [
   [
    "= 0.07000000"
   ],
   [
    "N = 10 years × 1 = 10"
   ],
   [
    "$19,671.51"
   ],
   [
    "= 0.00565415",
    "$85,525.87"
   ],
   [
    "$19,671.51 + $85,525.87 = $105,197.38",
    "shown as $105,197"
   ]
  ]
 },
 "fv-monthly-nocontrib": {
  "v": {
   "presentValue": "10000",
   "annualRate": "6",
   "years": "5",
   "compounding": "12",
   "monthlyContribution": ""
  },
  "steps": [
   [
    "= 0.00500000"
   ],
   [
    "N = 5 years × 12 = 60"
   ],
   [
    "$13,488.50"
   ],
   [
    "$13,488.50 (shown as $13,489)"
   ]
  ]
 },
 "heloc-defaults": {
  "v": {
   "homeValue": "550000",
   "mortgageBalance": "320000",
   "maxLTV": "80",
   "helocRate": "8.75",
   "drawAmount": "50000"
  },
  "steps": [
   [
    "Equity = $550,000.00 − $320,000.00 = $230,000.00",
    "LTV = $320,000.00 ÷ $550,000.00 = 58.2%"
   ],
   [
    "$550,000.00 × 80% = $440,000.00"
   ],
   [
    "max(0, $440,000.00 − $320,000.00) = $120,000.00"
   ],
   [
    "= $364.58",
    "Draw = min($50,000.00, $120,000.00) = $50,000.00"
   ]
  ]
 },
 "heloc-over": {
  "v": {
   "homeValue": "550000",
   "mortgageBalance": "320000",
   "maxLTV": "80",
   "helocRate": "8.75",
   "drawAmount": "999999"
  },
  "steps": [
   [
    "Equity = $550,000.00 − $320,000.00 = $230,000.00",
    "LTV = $320,000.00 ÷ $550,000.00 = 58.2%"
   ],
   [
    "$550,000.00 × 80% = $440,000.00"
   ],
   [
    "max(0, $440,000.00 − $320,000.00) = $120,000.00"
   ],
   [
    "= $875.00",
    "Draw = min($999,999.00, $120,000.00) = $120,000.00"
   ]
  ]
 },
 "heloc-nodraw": {
  "v": {
   "homeValue": "550000",
   "mortgageBalance": "320000",
   "maxLTV": "80",
   "helocRate": "8.75",
   "drawAmount": ""
  },
  "steps": [
   [
    "Equity = $550,000.00 − $320,000.00 = $230,000.00",
    "LTV = $320,000.00 ÷ $550,000.00 = 58.2%"
   ],
   [
    "$550,000.00 × 80% = $440,000.00"
   ],
   [
    "max(0, $440,000.00 − $320,000.00) = $120,000.00"
   ],
   [
    "= $875.00",
    "full line: $120,000.00"
   ]
  ]
 },
 "hel-defaults": {
  "v": {
   "homeValue": "400000",
   "currentMortgage": "250000",
   "creditProfile": "excellent",
   "desiredLoan": "50000",
   "interestRate": "8.5",
   "loanTerm": "60",
   "closingCosts": "2000"
  },
  "steps": [
   [
    "$400,000.00 × 85% = $340,000.00",
    "= $90,000.00 available"
   ],
   [
    "min($50,000.00, $90,000.00) = $50,000.00 approved"
   ],
   [
    "$50,000.00 + $2,000.00 = $52,000.00 financed"
   ],
   [
    "= 0.00708333",
    "n = 60 months"
   ],
   [
    "= $1,066.86"
   ],
   [
    "= $12,012"
   ]
  ]
 },
 "hel-capped-costs": {
  "v": {
   "homeValue": "400000",
   "currentMortgage": "250000",
   "creditProfile": "fair",
   "desiredLoan": "500000",
   "interestRate": "8.5",
   "loanTerm": "60",
   "closingCosts": "3000"
  },
  "steps": [
   [
    "$400,000.00 × 75% = $300,000.00",
    "= $50,000.00 available"
   ],
   [
    "min($500,000.00, $50,000.00) = $50,000.00 approved"
   ],
   [
    "$50,000.00 + $3,000.00 = $53,000.00 financed"
   ],
   [
    "= 0.00708333",
    "n = 60 months"
   ],
   [
    "= $1,087.38"
   ],
   [
    "= $12,243"
   ]
  ]
 },
 "itx-defaults": {
  "v": {
   "grossIncome": "75000",
   "filingStatus": "single",
   "state": "AL",
   "retirement401k": "6000",
   "healthInsurance": "3000",
   "otherPreTax": "0"
  },
  "steps": [
   [
    "= $66,000.00",
    "= $72,000.00"
   ],
   [
    "= $49,900.00 taxable income",
    "$16,100.00"
   ],
   [
    "10% × $12,400.00 = $1,240.00 + 12% × $37,500.00 = $4,500.00",
    "= $5,740.00 (top bracket 12%)"
   ],
   [
    "$4,464.00",
    "$1,044.00",
    "$0.00",
    "→ $5,508.00"
   ],
   [
    "$66,000.00 × 4% = $2,640.00"
   ],
   [
    "= $52,112.00",
    "$9,000.00 pre-tax deductions"
   ]
  ]
 },
 "itx-tx": {
  "v": {
   "grossIncome": "120000",
   "filingStatus": "mfj",
   "state": "TX",
   "retirement401k": "10000",
   "healthInsurance": "4000",
   "otherPreTax": "1000"
  },
  "steps": [
   [
    "= $105,000.00",
    "= $115,000.00"
   ],
   [
    "= $72,800.00 taxable income",
    "$32,200.00"
   ],
   [
    "10% × $24,800.00 = $2,480.00 + 12% × $48,000.00 = $5,760.00",
    "= $8,240.00 (top bracket 12%)"
   ],
   [
    "$7,130.00",
    "$1,667.50",
    "$0.00",
    "→ $8,797.50"
   ],
   [
    "no state income tax → $0.00"
   ],
   [
    "= $87,962.50",
    "$15,000.00 pre-tax deductions"
   ]
  ]
 },
 "itx-ca": {
  "v": {
   "grossIncome": "250000",
   "filingStatus": "single",
   "state": "CA",
   "retirement401k": "20000",
   "healthInsurance": "",
   "otherPreTax": ""
  },
  "steps": [
   [
    "= $230,000.00",
    "= $250,000.00"
   ],
   [
    "= $213,900.00 taxable income",
    "$16,100.00"
   ],
   [
    "10% × $12,400.00 = $1,240.00 + 12% × $38,000.00 = $4,560.00 + 22% × $55,300.00 = $12,166.00 + 24% × $96,075.00 = $23,058.00 + 32% × $12,125.00 = $3,880.00",
    "= $44,904.00 (top bracket 32%)"
   ],
   [
    "$11,439.00",
    "$3,625.00",
    "$450.00",
    "→ $15,514.00"
   ],
   [
    "$230,000.00 × 6.5% = $14,950.00"
   ],
   [
    "= $154,632.00",
    "$20,000.00 pre-tax deductions"
   ]
  ]
 },
 "ir-defaults": {
  "v": {
   "principal": "10000",
   "finalAmount": "14500",
   "timePeriod": "5",
   "timeUnit": "years",
   "compoundFrequency": "12"
  },
  "steps": [
   [
    "t = 5 years"
   ],
   [
    "= 1.450000"
   ],
   [
    "= 1.00621194"
   ],
   [
    "0.00621194 = 7.4543%"
   ],
   [
    "= 7.7144%"
   ]
  ]
 },
 "ir-simple": {
  "v": {
   "principal": "5000",
   "finalAmount": "6000",
   "timePeriod": "18",
   "timeUnit": "months",
   "compoundFrequency": "0"
  },
  "steps": [
   [
    "t = 18 months ÷ 12 = 1.5 years"
   ],
   [
    "= $1,000.00"
   ],
   [
    "= 13.3333%"
   ]
  ]
 },
 "inv-defaults": {
  "v": {
   "startingAmount": "10000",
   "contribution": "500",
   "contributionFrequency": "weekly",
   "years": "20",
   "returnRate": "8",
   "returnVariance": "2"
  },
  "steps": [
   [
    "= 0.00666667"
   ],
   [
    "$49,268.03"
   ],
   [
    "= 0.00153453"
   ],
   [
    "$1,279,478.78"
   ],
   [
    "$49,268.03 + $1,279,478.78 = $1,328,746.80",
    "shown as $1.33M"
   ],
   [
    "= $530,000 invested",
    "growth = $798,747"
   ]
  ]
 },
 "inv-monthly": {
  "v": {
   "startingAmount": "20000",
   "contribution": "300",
   "contributionFrequency": "monthly",
   "years": "15",
   "returnRate": "7",
   "returnVariance": "2"
  },
  "steps": [
   [
    "= 0.00583333"
   ],
   [
    "$56,978.93"
   ],
   [
    "= 0.00583333"
   ],
   [
    "$95,088.69"
   ],
   [
    "$56,978.93 + $95,088.69 = $152,067.62",
    "shown as $152,068"
   ],
   [
    "= $74,000 invested",
    "growth = $78,068"
   ]
  ]
 },
 "inv-annual": {
  "v": {
   "startingAmount": "0",
   "contribution": "5000",
   "contributionFrequency": "annually",
   "years": "10",
   "returnRate": "6",
   "returnVariance": "2"
  },
  "steps": [
   [
    "= 0.00500000"
   ],
   [
    "$0.00"
   ],
   [
    "= 0.06167781"
   ],
   [
    "$66,425.57"
   ],
   [
    "$0.00 + $66,425.57 = $66,425.57",
    "shown as $66,426"
   ],
   [
    "= $50,000 invested",
    "growth = $16,426"
   ]
  ]
 },
 "ira-defaults": {
  "v": {
   "currentAge": "30",
   "retirementAge": "65",
   "currentBalance": "15000",
   "annualContribution": "7500",
   "expectedReturn": "7.00",
   "marginalTaxRate": "10",
   "retirementTaxRate": "0"
  },
  "steps": [
   [
    "= 0.00583333",
    "420 months",
    "$172,592.28",
    "$1,125,659.13",
    "total $1,298,251.40"
   ],
   [
    "$1,298,251.40 → after 0% tax on the new money = $1,298,251.40"
   ],
   [
    "$7,500.00 × 10% = $750.00 a year",
    "grows to $112,565.91"
   ],
   [
    "$1,410,817.32",
    "Traditional"
   ]
  ]
 },
 "ira-overlimit": {
  "v": {
   "currentAge": "52",
   "retirementAge": "67",
   "currentBalance": "50000",
   "annualContribution": "20000",
   "expectedReturn": "6",
   "marginalTaxRate": "24",
   "retirementTaxRate": "12"
  },
  "steps": [
   [
    "min($20,000.00, $8,600.00) = $8,600.00 a year"
   ],
   [
    "= 0.00500000",
    "180 months",
    "$122,704.68",
    "$208,420.08",
    "total $331,124.76"
   ],
   [
    "$331,124.76 → after 12% tax on the new money = $306,114.35"
   ],
   [
    "$8,600.00 × 24% = $2,064.00 a year",
    "grows to $50,020.82"
   ],
   [
    "$356,135.16",
    "Traditional"
   ]
  ]
 },
 "irr-defaults": {
  "v": {
   "initialInvestment": "100000",
   "discountRate": "10",
   "year1": "25000",
   "year2": "30000",
   "year3": "35000",
   "year4": "40000",
   "year5": "45000",
   "year6": "0",
   "year7": "0",
   "year8": "0",
   "year9": "0",
   "year10": "0"
  },
  "steps": [
   [
    "Year 0: −$100,000.00",
    "Year 1: $25,000.00",
    "Year 2: $30,000.00",
    "Year 3: $35,000.00",
    "Year 4: $40,000.00",
    "Year 5: $45,000.00",
    "Year 6: $0.00",
    "Year 7: $0.00",
    "Year 8: $0.00",
    "Year 9: $0.00",
    "Year 10: $0.00"
   ],
   [
    "r = 19.71%",
    "NPV at 19.71% = $0.00"
   ],
   [
    "Year 0: −$100,000.00 ÷ (1 + 0.1)^0 = −$100,000.00",
    "Year 1: $25,000.00 ÷ (1 + 0.1)^1 = $22,727.27",
    "Year 2: $30,000.00 ÷ (1 + 0.1)^2 = $24,793.39",
    "Year 3: $35,000.00 ÷ (1 + 0.1)^3 = $26,296.02"
   ],
   [
    "= $29,078.68"
   ],
   [
    "Still −$10,000.00 after year 3",
    "= 3.3 years"
   ]
  ]
 },
 "irr-npv": {
  "v": {
   "initialInvestment": "100000",
   "discountRate": "8",
   "year1": "30000",
   "year2": "40000",
   "year3": "50000",
   "year4": "",
   "year5": "",
   "year6": "0",
   "year7": "0",
   "year8": "0",
   "year9": "0",
   "year10": "0"
  },
  "steps": [
   [
    "Year 0: −$100,000.00",
    "Year 1: $30,000.00",
    "Year 2: $40,000.00",
    "Year 3: $50,000.00",
    "Year 4: $0.00",
    "Year 5: $0.00",
    "Year 6: $0.00",
    "Year 7: $0.00",
    "Year 8: $0.00",
    "Year 9: $0.00",
    "Year 10: $0.00"
   ],
   [
    "r = 8.90%",
    "NPV at 8.90% = $0.00"
   ],
   [
    "Year 0: −$100,000.00 ÷ (1 + 0.08)^0 = −$100,000.00",
    "Year 1: $30,000.00 ÷ (1 + 0.08)^1 = $27,777.78",
    "Year 2: $40,000.00 ÷ (1 + 0.08)^2 = $34,293.55",
    "Year 3: $50,000.00 ÷ (1 + 0.08)^3 = $39,691.61"
   ],
   [
    "= $1,762.94"
   ],
   [
    "Still −$30,000.00 after year 2",
    "= 2.6 years"
   ]
  ]
 },
 "irr-multi": {
  "v": {
   "initialInvestment": "100",
   "discountRate": "",
   "year1": "230",
   "year2": "-132",
   "year3": "",
   "year4": "",
   "year5": "",
   "year6": "",
   "year7": "",
   "year8": "",
   "year9": "",
   "year10": ""
  },
  "steps": [
   [
    "Year 0: −$100.00",
    "Year 1: $230.00",
    "Year 2: −$132.00"
   ],
   [
    "r = 10.00%",
    "NPV at 10.00% = $0.00"
   ],
   [
    "Still −$100.00 after year 0",
    "= 0.4 years"
   ]
  ]
 },
 "mt-defaults": {
  "v": {
   "income1": "85000",
   "income2": "65000",
   "deductionType": "standard",
   "itemized1": "14000",
   "itemized2": "10000",
   "itemizedJoint": "24000"
  },
  "steps": [
   [
    "Partner 1: $85,000.00 − $16,100.00 = $68,900.00",
    "Partner 2: $65,000.00 − $16,100.00 = $48,900.00",
    "Together: $150,000.00 − $32,200.00 = $117,800.00"
   ],
   [
    "10% × $12,400.00 = $1,240.00 + 12% × $38,000.00 = $4,560.00 + 22% × $18,500.00 = $4,070.00 = $9,870.00"
   ],
   [
    "10% × $12,400.00 = $1,240.00 + 12% × $36,500.00 = $4,380.00 = $5,620.00"
   ],
   [
    "$9,870.00 + $5,620.00 = $15,490.00",
    "(shown as $15,490)"
   ],
   [
    "10% × $24,800.00 = $2,480.00 + 12% × $76,000.00 = $9,120.00 + 22% × $17,000.00 = $3,740.00 = $15,340.00",
    "(shown as $15,340)"
   ],
   [
    "$15,340 joint − $15,490 as two singles = −$150.00",
    "→ Save $150"
   ]
  ]
 },
 "mt-itemized": {
  "v": {
   "income1": "200000",
   "income2": "30000",
   "deductionType": "itemized",
   "itemized1": "30000",
   "itemized2": "5000",
   "itemizedJoint": "45000"
  },
  "steps": [
   [
    "Partner 1: $200,000.00 − $30,000.00 = $170,000.00",
    "Partner 2: $30,000.00 − $16,100.00 = $13,900.00",
    "Together: $230,000.00 − $45,000.00 = $185,000.00"
   ],
   [
    "10% × $12,400.00 = $1,240.00 + 12% × $38,000.00 = $4,560.00 + 22% × $55,300.00 = $12,166.00 + 24% × $64,300.00 = $15,432.00 = $33,398.00"
   ],
   [
    "10% × $12,400.00 = $1,240.00 + 12% × $1,500.00 = $180.00 = $1,420.00"
   ],
   [
    "$33,398.00 + $1,420.00 = $34,818.00",
    "(shown as $34,818)"
   ],
   [
    "10% × $24,800.00 = $2,480.00 + 12% × $76,000.00 = $9,120.00 + 22% × $84,200.00 = $18,524.00 = $30,124.00",
    "(shown as $30,124)"
   ],
   [
    "$30,124 joint − $34,818 as two singles = −$4,694.00",
    "→ Save $4,694"
   ]
  ]
 },
 "mc-defaults": {
  "v": {
   "homePrice": "400000",
   "downPayment": "80000",
   "rate15": "5.5",
   "rate30": "6.5",
   "propertyTaxRate": "1.2",
   "annualInsurance": "1200",
   "pmiRate": "0.5"
  },
  "steps": [
   [
    "$400,000.00 − $80,000.00 down = $320,000.00"
   ],
   [
    "= $400.00",
    "= $100.00",
    "$0.00 (20% or more down)"
   ],
   [
    "= $2,614.67"
   ],
   [
    "= $2,022.62"
   ],
   [
    "$2,614.67 + $400.00 + $100.00 + $0.00 = $3,114.67",
    "$2,022.62 + $400.00 + $100.00 + $0.00 = $2,522.62"
   ],
   [
    "= $150,640",
    "= $408,142"
   ],
   [
    "= $257,502",
    "$2,614.67 − $2,022.62 = $592.05"
   ]
  ]
 },
 "mc-20down": {
  "v": {
   "homePrice": "400000",
   "downPayment": "100000",
   "rate15": "5.5",
   "rate30": "6.5",
   "propertyTaxRate": "1.2",
   "annualInsurance": "1200",
   "pmiRate": "0.5"
  },
  "steps": [
   [
    "$400,000.00 − $100,000.00 down = $300,000.00"
   ],
   [
    "= $400.00",
    "= $100.00",
    "$0.00 (20% or more down)"
   ],
   [
    "= $2,451.25"
   ],
   [
    "= $1,896.20"
   ],
   [
    "$2,451.25 + $400.00 + $100.00 + $0.00 = $2,951.25",
    "$1,896.20 + $400.00 + $100.00 + $0.00 = $2,396.20"
   ],
   [
    "= $141,225",
    "= $382,633"
   ],
   [
    "= $241,408",
    "$2,451.25 − $1,896.20 = $555.05"
   ]
  ]
 },
 "mc-pmi": {
  "v": {
   "homePrice": "400000",
   "downPayment": "40000",
   "rate15": "5.5",
   "rate30": "6.5",
   "propertyTaxRate": "1.2",
   "annualInsurance": "1200",
   "pmiRate": "0.5"
  },
  "steps": [
   [
    "$400,000.00 − $40,000.00 down = $360,000.00"
   ],
   [
    "= $400.00",
    "= $100.00",
    "= $150.00 (down payment under 20%)"
   ],
   [
    "= $2,941.50"
   ],
   [
    "= $2,275.44"
   ],
   [
    "$2,941.50 + $400.00 + $100.00 + $150.00 = $3,591.50",
    "$2,275.44 + $400.00 + $100.00 + $150.00 = $2,925.44"
   ],
   [
    "= $169,470",
    "= $459,160"
   ],
   [
    "after 30 months (15-year) and 95 months (30-year)",
    "→ 2.5 yrs / 7.9 yrs"
   ],
   [
    "= $299,440",
    "$3,091.50 − $2,425.44 = $666.06"
   ]
  ]
 },
 "mp-defaults": {
  "v": {
   "originalAmount": "350000",
   "currentBalance": "280000",
   "interestRate": "6.75",
   "monthlyPayment": "2270",
   "extraMonthly": "300",
   "yearlyLumpSum": "2000",
   "singleLumpSum": "10000"
  },
  "steps": [
   [
    "= 0.00562500"
   ],
   [
    "Interest = $280,000.00 × 0.00562500 = $1,575.00",
    "principal = $2,270.00 − $1,575.00 = $695.00"
   ],
   [
    "after 212 payments (17 yr 8 mo)",
    "total interest = $198,999.98"
   ],
   [
    "after 145 payments (12 yr 1 mo)",
    "total interest = $126,325.86"
   ],
   [
    "212 − 145 = 67 months",
    "= $72,674.13"
   ]
  ]
 },
 "mp-noextra": {
  "v": {
   "originalAmount": "",
   "currentBalance": "280000",
   "interestRate": "6.75",
   "monthlyPayment": "2270",
   "extraMonthly": "",
   "yearlyLumpSum": "",
   "singleLumpSum": ""
  },
  "steps": [
   [
    "= 0.00562500"
   ],
   [
    "Interest = $280,000.00 × 0.00562500 = $1,575.00",
    "principal = $2,270.00 − $1,575.00 = $695.00"
   ],
   [
    "after 212 payments (17 yr 8 mo)",
    "total interest = $198,999.98"
   ]
  ]
 },
 "mf-defaults": {
  "v": {
   "initialInvestment": "10000",
   "monthlyContribution": "500",
   "expectedReturn": "8",
   "expenseRatio": "0.75",
   "investmentYears": "20"
  },
  "steps": [
   [
    "Net return = 8% − 0.75% = 7.25%",
    "= 0.00604167"
   ],
   [
    "$42,445.57",
    "$268,515.03",
    "→ $310,960.59"
   ],
   [
    "$49,268.03",
    "$294,510.21",
    "→ $343,778.24"
   ],
   [
    "$343,778.24 − $310,960.59",
    "9.5% of the no-fee balance"
   ],
   [
    "$10,000.00 + $500.00 × 240",
    "= $130K contributed"
   ]
  ]
 },
 "nw-defaults": {
  "v": {
   "cash": "15000",
   "investments": "50000",
   "retirement": "80000",
   "realEstate": "300000",
   "otherAssets": "10000",
   "mortgage": "220000",
   "carLoans": "12000",
   "studentLoans": "25000",
   "creditCardDebt": "3000",
   "otherDebts": "5000"
  },
  "steps": [
   [
    "= $455,000.00"
   ],
   [
    "= $265,000.00"
   ],
   [
    "Net worth = $455,000.00 − $265,000.00 = $190,000.00"
   ],
   [
    "= 58.2%"
   ]
  ]
 },
 "ny-defaults": {
  "v": {
   "homePrice": "500000",
   "downPayment": "100000",
   "interestRate": "6.7",
   "loanTerm": "15",
   "propertyTaxRate": "1.3",
   "starEligible": "none",
   "mrtRegion": "nyc"
  },
  "steps": [
   [
    "$500,000.00 − $100,000.00 down = $400,000"
   ],
   [
    "n = 180",
    "= $3,528.56"
   ],
   [
    "= $541.67",
    "$0.00 (20% or more down)",
    "→ $4,070.23"
   ],
   [
    "= $235,141"
   ],
   [
    "$400,000.00 (loan rounded to $100) × 2.05% = $8,200.00 total",
    "($1,000.00) = $7,200.00"
   ],
   [
    "Price is under $1,000,000.00 → $0.00"
   ]
  ]
 },
 "ny-mansion": {
  "v": {
   "homePrice": "1500000",
   "downPayment": "150000",
   "interestRate": "6.7",
   "loanTerm": "20",
   "propertyTaxRate": "1.3",
   "starEligible": "basic",
   "mrtRegion": "nyc"
  },
  "steps": [
   [
    "$1,500,000.00 − $150,000.00 down = $1,350,000"
   ],
   [
    "n = 240",
    "= $10,224.82"
   ],
   [
    "= $1,625.00",
    "$1,350,000.00 × 0.5% ÷ 12 = $562.50",
    "→ $12,412.32"
   ],
   [
    "= $1,103,957"
   ],
   [
    "= $11,700.00 a year",
    "= 0.78%",
    "$234/yr"
   ],
   [
    "$1,350,000.00 (loan rounded to $100) × 2.175% = $29,362.50 total",
    "($3,375.00) = $25,987.50"
   ],
   [
    "$1,500,000.00 × 1% = $15,000.00"
   ]
  ]
 },
 "pb-defaults": {
  "v": {
   "initialInvestment": "50000",
   "annualCashFlow": "12000",
   "useDiscounted": "simple",
   "discountRate": "10",
   "projectLife": "10"
  },
  "steps": [
   [
    "$50,000.00 ÷ $12,000.00 = 4.2 years"
   ],
   [
    "$12,000.00 × 10 years = $120,000",
    "= 2.40x"
   ]
  ]
 },
 "pb-discounted": {
  "v": {
   "initialInvestment": "50000",
   "annualCashFlow": "12000",
   "useDiscounted": "discounted",
   "discountRate": "10",
   "projectLife": "10"
  },
  "steps": [
   [
    "$50,000.00 ÷ $12,000.00 = 4.2 years"
   ],
   [
    "year 1 = $10,909.09",
    "year 2 = $9,917.36"
   ],
   [
    "After year 5 the running total is $45,489.44",
    "year 6 adds $6,773.69",
    "= 5.7 years"
   ],
   [
    "= $23,735",
    "= 1.47x"
   ]
  ]
 },
 "pb-simple-life": {
  "v": {
   "initialInvestment": "50000",
   "annualCashFlow": "12000",
   "useDiscounted": "simple",
   "discountRate": "10",
   "projectLife": "8"
  },
  "steps": [
   [
    "$50,000.00 ÷ $12,000.00 = 4.2 years"
   ],
   [
    "$12,000.00 × 8 years = $96,000",
    "= 1.92x"
   ]
  ]
 },
 "pb-nolife": {
  "v": {
   "initialInvestment": "50000",
   "annualCashFlow": "12000",
   "useDiscounted": "simple",
   "discountRate": "10",
   "projectLife": ""
  },
  "steps": [
   [
    "$50,000.00 ÷ $12,000.00 = 4.2 years"
   ],
   [
    "$12,000.00 ÷ $50,000.00 = 24.0%"
   ]
  ]
 },
 "pb-never": {
  "v": {
   "initialInvestment": "50000",
   "annualCashFlow": "3000",
   "useDiscounted": "discounted",
   "discountRate": "10",
   "projectLife": ""
  },
  "steps": [
   [
    "$50,000.00 ÷ $3,000.00 = 16.7 years"
   ],
   [
    "year 1 = $2,727.27",
    "year 2 = $2,479.34"
   ],
   [
    "Never"
   ]
  ]
 },
 "pc-defaults": {
  "v": {
   "payMode": "salary",
   "annualSalary": "75000",
   "hourlyWage": "25.00",
   "hoursPerWeek": "40",
   "payFrequency": "weekly",
   "filingStatus": "single",
   "state": "AL",
   "retirementContributions": "5000",
   "preTaxDeductions": "2000"
  },
  "steps": [
   [
    "Annual salary = $75,000.00"
   ],
   [
    "FICA wages = $75,000.00 − $2,000.00 benefits = $73,000.00",
    "income-tax wages = $73,000.00 − $5,000.00 401(k) = $68,000.00"
   ],
   [
    "= $51,900.00 taxable income",
    "$16,100.00"
   ],
   [
    "10% × $12,400.00 = $1,240.00 + 12% × $38,000.00 = $4,560.00 + 22% × $1,500.00 = $330.00",
    "= $6,130.00"
   ],
   [
    "$4,526.00",
    "$1,058.50",
    "$0.00",
    "→ $5,584.50"
   ],
   [
    "→ $3,210.00 a year"
   ],
   [
    "= $53,075.50",
    "÷ 52 pay periods = $1,020.68"
   ]
  ]
 },
 "pc-hourly-tx": {
  "v": {
   "payMode": "hourly",
   "annualSalary": "75000",
   "hourlyWage": "30",
   "hoursPerWeek": "40",
   "payFrequency": "semimonthly",
   "filingStatus": "mfj",
   "state": "TX",
   "retirementContributions": "6000",
   "preTaxDeductions": "2400"
  },
  "steps": [
   [
    "$30.00 × 40 hours × 52 weeks = $62,400.00"
   ],
   [
    "FICA wages = $62,400.00 − $2,400.00 benefits = $60,000.00",
    "income-tax wages = $60,000.00 − $6,000.00 401(k) = $54,000.00"
   ],
   [
    "= $21,800.00 taxable income",
    "$32,200.00"
   ],
   [
    "10% × $21,800.00 = $2,180.00",
    "= $2,180.00"
   ],
   [
    "$3,720.00",
    "$870.00",
    "$0.00",
    "→ $4,590.00"
   ],
   [
    "does not tax wages → $0.00"
   ],
   [
    "= $47,230.00",
    "÷ 24 pay periods = $1,967.92"
   ]
  ]
 },
 "pen-defaults": {
  "v": {
   "currentAge": "35",
   "retirementAge": "65",
   "currentBalance": "100000",
   "monthlyContribution": "500",
   "growthRate": "6.0",
   "inflationAdjust": "nominal"
  },
  "steps": [
   [
    "n = (65 − 35) × 12 = 360 months (30 years)"
   ],
   [
    "= 0.00500000"
   ],
   [
    "$602,257.52"
   ],
   [
    "$502,257.52"
   ],
   [
    "$602,257.52 + $502,257.52 = $1,104,515"
   ],
   [
    "= $280,000 contributed",
    "growth = $824,515",
    "(74.6% of the balance)"
   ],
   [
    "= $3,681.72/mo"
   ]
  ]
 },
 "pen-adj": {
  "v": {
   "currentAge": "40",
   "retirementAge": "62",
   "currentBalance": "50000",
   "monthlyContribution": "800",
   "growthRate": "5",
   "inflationAdjust": "adjusted"
  },
  "steps": [
   [
    "n = (62 − 40) × 12 = 264 months (22 years)"
   ],
   [
    "= 0.00416667"
   ],
   [
    "$149,865.42"
   ],
   [
    "$383,483.21"
   ],
   [
    "$149,865.42 + $383,483.21 = $533,349"
   ],
   [
    "= $261,200 contributed",
    "growth = $272,149",
    "(51.0% of the balance)"
   ],
   [
    "$533,349 ÷ (1 + 0.03)^22 = $278,351"
   ],
   [
    "= $1,777.83/mo",
    "$927.84/mo"
   ]
  ]
 },
 "refi-defaults": {
  "v": {
   "currentBalance": "250000",
   "currentRate": "7.5",
   "currentTerm": "300",
   "newRate": "6.0",
   "newTerm": "360",
   "closingCosts": "6000",
   "plannedStay": "60"
  },
  "steps": [
   [
    "r = 7.5% ÷ 12 = 0.00625000",
    "n = 300",
    "= $1,847"
   ],
   [
    "r = 6% ÷ 12 = 0.00500000",
    "n = 360",
    "= $1,499"
   ],
   [
    "$1,847.48 − $1,498.88 = $348.60"
   ],
   [
    "$6,000.00 ÷ $348.60 = 17.21",
    "→ 18 months (1.5 years)"
   ],
   [
    "$304,243 vs $289,595",
    "saved before closing costs: $14,648"
   ],
   [
    "$304,243 vs $277,193, with $77,530 still owed on the new loan"
   ],
   [
    "$348.60 × 60 months − $6,000.00 closing costs = $14,916.10"
   ],
   [
    "Yes — Refinance now"
   ]
  ]
 },
 "refi-shorter": {
  "v": {
   "currentBalance": "250000",
   "currentRate": "7.5",
   "currentTerm": "300",
   "newRate": "5.5",
   "newTerm": "180",
   "closingCosts": "6000",
   "plannedStay": "60"
  },
  "steps": [
   [
    "r = 7.5% ÷ 12 = 0.00625000",
    "n = 300",
    "= $1,847"
   ],
   [
    "r = 5.5% ÷ 12 = 0.00458333",
    "n = 180",
    "= $2,043"
   ],
   [
    "$1,847.48 − $2,042.71 = −$195.23"
   ],
   [
    "never paid back",
    "→ Never"
   ],
   [
    "$304,243 vs $117,688",
    "saved before closing costs: $186,556"
   ],
   [
    "$304,243 vs $117,688"
   ],
   [
    "−$195.23 × 60 months − $6,000.00 closing costs = −$17,713.84"
   ],
   [
    "Yes — shorter term saves $180,556 in interest after closing costs",
    "payment rises $195/mo"
   ]
  ]
 }
};

const blank = (c: CalculatorConfig) => Object.fromEntries(c.inputs.map((i) => [i.id, '']));
const calcOf = (name: string) => CALCS[name.split('-')[0]];
const steps = (c: CalculatorConfig, v: Record<string, string>) => c.explainSteps!(v);
const row = (c: CalculatorConfig, v: Record<string, string>, id: string) => c.calculate(v).find((r) => r.id === id)?.value;
const clean = (c: CalculatorConfig, v: Record<string, string>) =>
  steps(c, v).every((s) => !/NaN|Infinity|∞|undefined/.test(`${s.label} ${s.expr} ${s.note ?? ''}`));

describe('explainSteps: finance batch F2', () => {
  describe('pinned values (independent Python oracle)', () => {
    for (const [name, { v, steps: expected }] of Object.entries(CASES)) {
      it(name, () => {
        const c = calcOf(name);
        const out = steps(c, v);
        expect(out).toHaveLength(expected.length);
        expected.forEach((subs, i) => {
          for (const s of subs) expect(out[i].expr, `${name} step ${i + 1} (${out[i].label})`).toContain(s);
        });
        for (const s of out) {
          expect(s.label.length).toBeGreaterThan(0);
          expect(`${s.label} ${s.expr} ${s.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
        }
      });
    }
  });

  describe('the steps quote the answer the calculator shows', () => {
    // [scenario prefix, result row id]: some step must contain that row's displayed value
    const LINKS: [string, string][] = [
      ['fv', 'futureValue'], ['heloc', 'maxCreditLine'], ['heloc', 'monthlyInterestPayment'], ['hel', 'totalInterest'],
      ['itx', 'netPay'], ['ir', 'nominalRate'], ['ir', 'ear'], ['inv', 'expected'], ['ira', 'winner'], ['irr', 'irrResult'],
      ['mt', 'hero'], ['mc', 'monthly15'], ['mc', 'monthly30'], ['mc', 'savings'], ['mp', 'standardInterest'],
      ['mf', 'withFees'], ['mf', 'withoutFees'], ['nw', 'netWorth'], ['ny', 'totalMonthly'], ['ny', 'recordingTax'],
      ['pb', 'simplePayback'], ['pc', 'netPaycheck'], ['pen', 'projectedBalance'], ['refi', 'recommendation'], ['refi', 'newPayment'],
    ];
    for (const [prefix, id] of LINKS) {
      it(`${prefix}: ${id}`, () => {
        const c = CALCS[prefix];
        const names = Object.keys(CASES).filter((n) => n.split('-')[0] === prefix);
        expect(names.length).toBeGreaterThan(0);
        for (const n of names) {
          const shown = row(c, CASES[n].v, id);
          if (shown === undefined) continue;
          expect(steps(c, CASES[n].v).some((s) => s.expr.includes(shown)), `${n} should show "${shown}"`).toBe(true);
        }
      });
    }
    it('home-equity-loan: the payment step shows the displayed payment', () => {
      for (const n of ['hel-defaults', 'hel-capped-costs']) {
        const shown = row(homeEquityLoan, CASES[n].v, 'monthlyPayment')!.replace(' (costs rolled in)', '');
        expect(steps(homeEquityLoan, CASES[n].v).some((s) => s.expr.endsWith(`= ${shown}`))).toBe(true);
      }
    });
    it('mortgage-payoff never prints the payoff date (it depends on today)', () => {
      for (const n of ['mp-defaults', 'mp-noextra']) {
        const text = steps(mortgagePayoff, CASES[n].v).map((s) => s.expr).join(' ');
        expect(text).not.toMatch(/January|February|March|April|May |June|July|August|September|October|November|December/);
      }
    });
  });

  describe('empty input returns []', () => {
    for (const [name, c] of Object.entries(CALCS)) it(name, () => expect(steps(c, blank(c))).toEqual([]));
  });

  describe('invalid input returns [] (and never prints NaN / Infinity)', () => {
    const BAD: [string, string, Record<string, string>][] = [
      ['fv', 'zero principal', { presentValue: '0' }],
      ['fv', 'zero years', { years: '0' }],
      ['fv', 'negative years', { years: '-3' }],
      ['heloc', 'zero home value', { homeValue: '0' }],
      ['heloc', 'negative mortgage', { mortgageBalance: '-1' }],
      ['heloc', 'blank rate', { helocRate: '' }],
      ['hel', 'zero home value', { homeValue: '0' }],
      ['hel', 'negative rate', { interestRate: '-1' }],
      ['hel', 'no loan term', { loanTerm: '' }],
      ['hel', 'no equity available (nothing to borrow)', { currentMortgage: '400000' }],
      ['itx', 'zero income', { grossIncome: '0' }],
      ['itx', 'negative income', { grossIncome: '-5' }],
      ['ir', 'final not above principal', { finalAmount: '9000' }],
      ['ir', 'zero principal', { principal: '0' }],
      ['ir', 'zero time', { timePeriod: '0' }],
      ['ir', 'absurd implied rate', { timePeriod: '0.0001', timeUnit: 'days' }],
      ['inv', 'zero years', { years: '0' }],
      ['inv', 'blank return', { returnRate: '' }],
      ['ira', 'retire before now', { currentAge: '60', retirementAge: '55' }],
      ['ira', 'blank return', { expectedReturn: '' }],
      ['irr', 'zero investment', { initialInvestment: '0' }],
      ['irr', 'no later cash flows and no discount rate', { year1: '', year2: '', year3: '', year4: '', year5: '', discountRate: '' }],
      ['mt', 'negative income', { income1: '-1' }],
      ['mt', 'itemized with amounts missing', { deductionType: 'itemized', itemized1: '', itemized2: '', itemizedJoint: '' }],
      ['mc', 'down payment covers the price', { downPayment: '400000' }],
      ['mc', 'blank 15-year rate', { rate15: '' }],
      ['mp', 'balance already zero', { currentBalance: '0' }],
      ['mp', 'payment too low to ever pay off', { monthlyPayment: '100' }],
      ['mp', 'blank rate', { interestRate: '' }],
      ['mf', 'zero years', { investmentYears: '0' }],
      ['mf', 'blank return', { expectedReturn: '' }],
      ['nw', 'nothing entered', { cash: '0', investments: '0', retirement: '0', realEstate: '0', otherAssets: '0', mortgage: '0', carLoans: '0', studentLoans: '0', creditCardDebt: '0', otherDebts: '0' }],
      ['ny', 'down payment covers the price', { downPayment: '500000' }],
      ['ny', 'blank rate', { interestRate: '' }],
      ['pb', 'zero cash flow', { annualCashFlow: '0' }],
      ['pb', 'zero investment', { initialInvestment: '0' }],
      ['pc', 'zero salary', { annualSalary: '0' }],
      ['pc', 'hourly with zero hours', { payMode: 'hourly', hourlyWage: '30', hoursPerWeek: '0' }],
      ['pen', 'retire before now', { currentAge: '60', retirementAge: '55' }],
      ['pen', 'under 18', { currentAge: '10' }],
      ['refi', 'zero balance', { currentBalance: '0' }],
      ['refi', 'blank new rate', { newRate: '' }],
    ];
    for (const [prefix, label, over] of BAD) {
      it(`${prefix}: ${label}`, () => {
        const c = CALCS[prefix];
        const base = CASES[`${prefix}-defaults`].v;
        expect(steps(c, { ...base, ...over })).toEqual([]);
      });
    }

    const HUGE: [string, Record<string, string>][] = [
      ['fv', { presentValue: '1e999' }], ['heloc', { homeValue: '1e999' }], ['hel', { homeValue: '1e999' }],
      ['itx', { grossIncome: '1e999' }], ['ir', { finalAmount: '1e999' }], ['inv', { startingAmount: '1e999' }],
      ['ira', { currentBalance: '1e999' }], ['irr', { year1: '1e999' }], ['mt', { income1: '1e999' }],
      ['mc', { homePrice: '1e999' }], ['mp', { currentBalance: '1e999' }], ['mf', { initialInvestment: '1e999' }],
      ['nw', { cash: '1e999' }], ['ny', { homePrice: '1e999' }], ['pb', { initialInvestment: '1e999' }],
      ['pc', { annualSalary: '1e999' }], ['pen', { currentBalance: '1e999' }], ['refi', { currentBalance: '1e999' }],
    ];
    for (const [prefix, over] of HUGE) {
      it(`${prefix}: overflowing number prints clean`, () => {
        const c = CALCS[prefix];
        expect(clean(c, { ...CASES[`${prefix}-defaults`].v, ...over })).toBe(true);
      });
    }
  });

  describe('edge cases', () => {
    it('income-tax: income under the standard deduction pays no federal tax', () => {
      const out = steps(incomeTax, { ...CASES['itx-defaults'].v, grossIncome: '10000', retirement401k: '', healthInsurance: '' });
      expect(out[1].expr).toContain('= $0.00 taxable income');
      expect(out[2].expr).toContain('No taxable income');
    });
    it('future-value: zero rate still reads', () => {
      const out = steps(futureValue, { ...CASES['fv-defaults'].v, annualRate: '0' });
      expect(out.at(-1)!.expr).toContain('$10,000.00 + $60,000.00 = $70,000.00');
    });
    it('payback: the discounted block states "Never" when the investment is not recovered', () => {
      const out = steps(paybackPeriod, CASES['pb-never'].v);
      expect(out.at(-1)!.expr).toContain('Never');
    });
    it('irr: several IRRs are flagged and NPV is the advice', () => {
      expect(steps(irr, CASES['irr-multi'].v)[1].note).toContain('10.00%, 20.00%');
    });
  });
});
