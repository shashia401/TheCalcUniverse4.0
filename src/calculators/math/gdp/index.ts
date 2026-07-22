import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import GdpPanel from './GdpPanel';

function fmtLargeCurrency(n: number): string {
  const abs = Math.abs(n);
  const prefix = n < 0 ? '-$' : '$';
  if (abs >= 1e12) return `${prefix}${(abs / 1e12).toFixed(2)} trillion`;
  if (abs >= 1e9) return `${prefix}${(abs / 1e9).toFixed(2)} billion`;
  if (abs >= 1e6) return `${prefix}${(abs / 1e6).toFixed(2)} million`;
  return `${prefix}${abs.toFixed(2)}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

const gdpConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'GDP Type',
      type: 'select',
      options: [
        { label: 'Nominal GDP', value: 'nominal' },
        { label: 'Real GDP (with deflator)', value: 'real' },
      ],
    },
    {
      id: 'consumption',
      label: 'Consumption (C)',
      type: 'number',
      step: 1,
      min: 0,
      placeholder: 'e.g., 10000000000000',
      helpText: 'Household spending on goods and services',
    },
    {
      id: 'investment',
      label: 'Investment (I)',
      type: 'number',
      step: 1,
      min: 0,
      placeholder: 'e.g., 3500000000000',
      helpText: 'Business spending on capital goods',
    },
    {
      id: 'governmentSpending',
      label: 'Government Spending (G)',
      type: 'number',
      step: 1,
      min: 0,
      placeholder: 'e.g., 3500000000000',
      helpText: 'Government expenditure',
    },
    {
      id: 'exports',
      label: 'Exports (X)',
      type: 'number',
      step: 1,
      min: 0,
      placeholder: 'e.g., 2500000000000',
    },
    {
      id: 'imports',
      label: 'Imports (M)',
      type: 'number',
      step: 1,
      min: 0,
      placeholder: 'e.g., 3200000000000',
    },
    {
      id: 'gdpDeflator',
      label: 'GDP Deflator',
      type: 'number',
      step: 0.1,
      min: 0,
      placeholder: 'e.g., 125',
      helpText: 'Price index (e.g., 125 means 25% inflation since base year)',
      showWhen: (v) => v.mode === 'real',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'nominal';
    const C = parseFloat(values.consumption);
    const I = parseFloat(values.investment);
    const G = parseFloat(values.governmentSpending);
    const X = parseFloat(values.exports);
    const M = parseFloat(values.imports);

    if (isNaN(C) || isNaN(I) || isNaN(G) || isNaN(X) || isNaN(M)) return [];

    const netExports = X - M;
    const nominalGDP = C + I + G + netExports;

    let gdpValue = nominalGDP;
    let gdpLabel = 'Nominal GDP';
    let deflatorNote = '';

    if (mode === 'real') {
      const deflator = parseFloat(values.gdpDeflator);
      if (isNaN(deflator) || deflator <= 0) return [];
      gdpValue = nominalGDP / (deflator / 100);
      gdpLabel = 'Real GDP';
      deflatorNote = `Adjusted for inflation. Nominal GDP: ${fmtLargeCurrency(nominalGDP)} | Deflator: ${deflator.toFixed(1)} | Real GDP: ${fmtLargeCurrency(gdpValue)}`;
    }

    const consumptionShare = nominalGDP > 0 ? (C / nominalGDP) * 100 : 0;
    const investmentShare = nominalGDP > 0 ? (I / nominalGDP) * 100 : 0;
    const governmentShare = nominalGDP > 0 ? (G / nominalGDP) * 100 : 0;
    const netExportShare = nominalGDP > 0 ? (netExports / nominalGDP) * 100 : 0;

    const results: Array<{
      id: string;
      label: string;
      value: string;
      highlight?: boolean;
      color?: 'positive' | 'negative' | 'neutral';
    }> = [
      {
        id: 'gdp',
        label: gdpLabel,
        value: fmtLargeCurrency(gdpValue),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'gdpNumeric',
        label: 'GDP (raw)',
        value: String(gdpValue),
      },
      {
        id: 'gdpFormula',
        label: 'GDP = C + I + G + (X − M)',
        value: [
          `C = ${fmtLargeCurrency(C)}`,
          `I = ${fmtLargeCurrency(I)}`,
          `G = ${fmtLargeCurrency(G)}`,
          `X = ${fmtLargeCurrency(X)}`,
          `M = ${fmtLargeCurrency(M)}`,
          `X−M = ${fmtLargeCurrency(netExports)}`,
        ].join(' | '),
      },
      {
        id: 'consumptionShare',
        label: 'Consumption Share',
        value: fmtPct(consumptionShare),
      },
      {
        id: 'investmentShare',
        label: 'Investment Share',
        value: fmtPct(investmentShare),
      },
      {
        id: 'governmentShare',
        label: 'Government Share',
        value: fmtPct(governmentShare),
      },
      {
        id: 'netExportShare',
        label: 'Net Export Share',
        value: fmtPct(netExportShare),
      },
      {
        id: 'netExports',
        label: 'Net Exports',
        value: fmtLargeCurrency(netExports),
      },
      {
        id: 'netExportsNumeric',
        label: 'Net Exports (raw)',
        value: String(netExports),
      },
      {
        id: 'gdpType',
        label: 'Type',
        value: mode === 'real' ? 'Real GDP' : 'Nominal GDP',
      },
    ];

    if (deflatorNote) {
      results.push({
        id: 'deflatorNote',
        label: 'Note',
        value: deflatorNote,
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GdpPanel, { values, results });
  },
  educational: {
    formula: 'GDP = C + I + G + (X − M)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">GDP Components (Expenditure Approach)</text><rect x="55" y="160" width="60" height="120" rx="3" fill="var(--svg-3b82f6)" fill-opacity=".8"/><text x="85" y="295" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-3b82f6)">C</text><text x="85" y="310" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Consumption</text><rect x="145" y="200" width="60" height="80" rx="3" fill="var(--svg-22c55e)" fill-opacity=".8"/><text x="175" y="295" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-22c55e)">I</text><text x="175" y="310" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Investment</text><rect x="235" y="220" width="60" height="60" rx="3" fill="var(--svg-8b5cf6)" fill-opacity=".8"/><text x="265" y="295" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-8b5cf6)">G</text><text x="265" y="310" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Govt Spend</text><rect x="325" y="250" width="60" height="30" rx="3" fill="var(--svg-ef4444)" fill-opacity=".8"/><text x="355" y="295" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">X&minus;M</text><text x="355" y="310" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Net Exports</text><text x="220" y="200" text-anchor="middle" font-size="24" font-weight="bold" fill="var(--svg-444444)">+</text><text x="310" y="240" text-anchor="middle" font-size="24" font-weight="bold" fill="var(--svg-444444)">+</text><text x="220" y="260" text-anchor="middle" font-size="24" font-weight="bold" fill="var(--svg-444444)">+</text><text x="220" y="135" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">GDP = C + I + G + (X &minus; M)</text><text x="220" y="155" text-anchor="middle" font-size="12" fill="var(--svg-666666)">C = Personal consumption &nbsp;|&nbsp; I = Business investment</text><text x="220" y="170" text-anchor="middle" font-size="12" fill="var(--svg-666666)">G = Government spending &nbsp;|&nbsp; X&minus;M = Net exports</text></svg>',
      alt: 'Bar chart showing the four GDP components as vertical bars: Consumption (C), Investment (I), Government Spending (G), and Net Exports (X-M) with plus signs between them',
      caption: 'GDP equals the sum of consumption, investment, government spending, and net exports',
    },
    formulaDescription:
      'Gross Domestic Product measures the total market value of all final goods and services produced within a country in a given period. The expenditure approach sums consumption, investment, government spending, and net exports.',
    variables: [
      { symbol: 'C', name: 'Consumption', description: 'Household spending on goods and services, typically the largest component of GDP.' },
      { symbol: 'I', name: 'Investment', description: 'Business spending on capital goods, residential construction, and inventory changes.' },
      { symbol: 'G', name: 'Government Spending', description: 'Federal, state, and local government expenditures on goods and services.' },
      { symbol: 'X', name: 'Exports', description: 'Goods and services produced domestically and sold to foreign entities.' },
      { symbol: 'M', name: 'Imports', description: 'Goods and services produced abroad and purchased domestically.' },
      { symbol: 'NX', name: 'Net Exports', description: 'Exports minus imports; positive adds to GDP, negative subtracts.' },
    ],
    howToUse: [
      'Enter consumption (C), investment (I), and government spending (G) in dollars.',
      'Enter exports (X) and imports (M) to calculate net exports.',
      'Select "Real GDP" mode and enter the GDP deflator to adjust for inflation.',
      'Review the GDP breakdown, component shares, and inflation-adjusted values.',
    ],
    explanation:
      'GDP is the broadest measure of economic output. The expenditure approach (GDP = C + I + G + NX) breaks down who is spending in the economy. Consumption is typically 60-70% of GDP in developed economies. Investment includes business equipment, structures, and residential construction. Government spending covers all levels of government. Net exports can be positive (trade surplus) or negative (trade deficit). Using the GDP deflator converts nominal GDP to real GDP, removing the effects of inflation. Practical example: the United States GDP for 2023 in trillions of dollars: Consumption (C) = $18.6T, Investment (I) = $4.8T, Government Spending (G) = $4.7T, Exports (X) = $3.1T, Imports (M) = $3.8T. Net Exports = $3.1T - $3.8T = -$0.7T (trade deficit). Nominal GDP = $18.6 + $4.8 + $4.7 + (-$0.7) = $27.4T. With a GDP deflator of 123.4, Real GDP = $27.4 / (123.4/100) = $22.2T in constant base-year dollars. Consumption share = 67.9%, Investment = 17.5%, Government = 17.2%, Net Exports = -2.6%. Edge cases: GDP does not account for non-market transactions like unpaid household labor, volunteer work, or the underground economy, which the Bureau of Economic Analysis estimates at about 10-15% of true economic output. GDP also does not subtract environmental damage or resource depletion — cutting down a forest and selling the timber adds to GDP, but the loss of the forest\'s ecosystem services is not subtracted. For countries with large informal economies (e.g., India, Nigeria), official GDP figures may significantly understate actual economic activity. GDP per capita is a better measure of average living standards than total GDP, but it still does not capture income inequality. The United Nations Human Development Index (HDI) is a more comprehensive measure that includes GDP, education, and life expectancy.',
    faqs: [
      {
        question: 'What is the difference between Nominal and Real GDP?',
        answer: 'Nominal GDP measures output at current market prices, while Real GDP adjusts for inflation using a price deflator. Real GDP reflects true economic growth by removing price changes. For example, if Nominal GDP grows by 5% but inflation is 3%, Real GDP grew by only about 2%.',
      },
      {
        question: 'What is the GDP deflator?',
        answer: 'The GDP deflator is a price index that measures the average price level of all goods and services included in GDP. It is calculated as (Nominal GDP / Real GDP) x 100. A deflator of 125 means prices are 25% higher than the base year.',
      },
      {
        question: 'Can net exports be negative?',
        answer: 'Yes. When a country imports more than it exports, net exports are negative, which reduces GDP. This is called a trade deficit. The United States, for example, has run a trade deficit for many years.',
      },
      {
        question: 'What is the largest component of GDP?',
        answer: 'Consumption (C) is typically the largest component, accounting for about 60-70% of GDP in the United States and most developed economies. Investment usually accounts for 15-20%, government spending for 15-20%, and net exports vary from -5% to +5%.',
      },
      {
        question: 'What is the difference between GDP and GNP (Gross National Product)?',
        answer: 'GDP measures all production within a country\'s borders, regardless of who owns the factors of production. GNP (or GNI, Gross National Income) measures the income earned by a country\'s residents and businesses, regardless of where that production occurs. For example, if a Japanese automaker operates a factory in the United States, the factory\'s output is counted in US GDP but in Japan\'s GNP. The difference between GDP and GNP is net factor income from abroad: GNP = GDP + income earned by residents from foreign investments - income earned by foreigners from domestic investments. For the United States, GDP and GNP are very close because the country has large amounts of both inward and outward investment that roughly balance out. For countries like Ireland, which hosts many multinational corporations that repatriate profits, GDP is significantly larger than GNP — sometimes by 20-30%. For developing countries that receive substantial foreign aid and remittances from citizens working abroad, GNP may be larger than GDP. India, for example, receives over $100 billion annually in remittances from its diaspora, making its GNP meaningfully higher than its GDP. The World Bank uses GNI (formerly GNP) per capita to classify countries into income categories.',
      },
    ],
    citations: [
      { source: 'World Bank - GDP Data', url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD' },
      { source: 'Wikipedia - Gross Domestic Product', url: 'https://en.wikipedia.org/wiki/Gross_domestic_product' },
    ],
  },
};

export default gdpConfig;
