import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import EthGasFeePanel from './EthGasFeePanel';

const TX_TYPES: Record<string, { gasLimit: number; label: string }> = {
  'standard-transfer': { gasLimit: 21000, label: 'Standard ETH Transfer' },
  'erc20-transfer': { gasLimit: 65000, label: 'ERC-20 Token Transfer' },
  'uniswap-swap': { gasLimit: 180000, label: 'Uniswap Swap' },
  'nft-mint': { gasLimit: 300000, label: 'NFT Mint' },
  'complex-contract': { gasLimit: 500000, label: 'Complex Contract' },
};

const ethGasFeeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'transactionType',
      label: 'Transaction Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Standard ETH Transfer', value: 'standard-transfer' },
        { label: 'ERC-20 Token Transfer', value: 'erc20-transfer' },
        { label: 'Uniswap Swap', value: 'uniswap-swap' },
        { label: 'NFT Mint', value: 'nft-mint' },
        { label: 'Complex Contract', value: 'complex-contract' },
      ],
      helpText: 'Type of Ethereum transaction to estimate gas fees for.',
    },
    {
      id: 'gasPriceGwei',
      label: 'Gas Price (Gwei)',
      type: 'number',
      placeholder: '20',
      min: 0,
      step: 0.1,
      helpText: 'Price per unit of gas in Gwei. Check Etherscan for current rates.',
    },
    {
      id: 'ethPrice',
      label: 'ETH Price (USD)',
      type: 'number',
      placeholder: '3500',
      min: 0,
      step: 1,
      helpText: 'Current Ethereum price in USD to estimate the dollar cost of gas.',
    },
  ],
  calculate: (values) => {
    const txType = values.transactionType || 'standard-transfer';
    const txInfo = TX_TYPES[txType];
    if (!txInfo) return [];

    const rawGasPrice = parseFloat(values.gasPriceGwei);
    const rawEthPrice = parseFloat(values.ethPrice);
    if (isNaN(rawGasPrice) || rawGasPrice <= 0) return [];
    if (isNaN(rawEthPrice) || rawEthPrice <= 0) return [];

    const gasPriceGwei = rawGasPrice;
    const gasLimit = txInfo.gasLimit;
    const ethPrice = rawEthPrice;

    // Fee calculation
    const feeEth = (gasLimit * gasPriceGwei) / 1e9;
    const feeUsd = feeEth * ethPrice;

    // Speed tiers
    const slowGwei = gasPriceGwei * 0.9;
    const fastGwei = gasPriceGwei * 1.5;
    const slowFeeEth = (gasLimit * slowGwei) / 1e9;
    const fastFeeEth = (gasLimit * fastGwei) / 1e9;
    const slowFeeUsd = slowFeeEth * ethPrice;
    const fastFeeUsd = fastFeeEth * ethPrice;

    const fmtEth = (n: number) => `${n < 0.001 ? n.toFixed(6) : n.toFixed(5)} ETH`;
    const fmtUsd = (n: number) =>
      n >= 1
        ? `$${n.toFixed(2)}`
        : n >= 0.01
          ? `$${n.toFixed(4)}`
          : `$${n.toFixed(6)}`;

    return [
      { id: 'transactionType', label: 'Transaction Type', value: txInfo.label },
      { id: 'gasPriceGwei', label: 'Gas Price', value: `${gasPriceGwei.toFixed(1)} Gwei`, color: 'neutral' },
      { id: 'gasLimit', label: 'Gas Limit', value: `${gasLimit.toLocaleString(undefined)} units`, color: 'neutral' },
      { id: 'ethPrice', label: 'ETH Price', value: `$${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'neutral' },
      { id: 'gasFeeEth', label: 'Gas Fee (ETH)', value: fmtEth(feeEth), highlight: true, color: 'positive' },
      { id: 'gasFeeUsd', label: 'Gas Fee (USD)', value: fmtUsd(feeUsd), highlight: true, color: 'positive' },
      { id: 'gasFeeUsdSlow', label: 'Slow Fee (USD)', value: fmtUsd(slowFeeUsd), color: 'neutral' },
      { id: 'gasFeeUsdFast', label: 'Fast Fee (USD)', value: fmtUsd(fastFeeUsd), color: 'neutral' },
      { id: 'feeRange', label: 'Fee Range (Slow – Fast)', value: `${fmtEth(slowFeeEth)} – ${fmtEth(fastFeeEth)} (${fmtUsd(slowFeeUsd)} – ${fmtUsd(fastFeeUsd)})`, color: 'neutral' },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(EthGasFeePanel, { values, results });
  },
  educational: {
    formula: 'Gas Fee (ETH) = Gas Limit × Gas Price (Gwei) / 1,000,000,000 | Gas Fee (USD) = Fee (ETH) × ETH Price',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Ethereum Gas Fee Calculation</text><text x="160" y="34" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Gas Limit × Gas Price = Total Transaction Fee</text><rect x="20" y="48" width="120" height="45" rx="6" fill="var(--svg-3b82f6)"/><text x="80" y="67" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Gas Limit</text><text x="80" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-dbeafe)">21,000 units</text><text x="158" y="75" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-94a3b8)">×</text><rect x="180" y="48" width="120" height="45" rx="6" fill="var(--svg-8b5cf6)"/><text x="240" y="67" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Gas Price</text><text x="240" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-e9d5ff)">20 Gwei</text><text x="158" y="115" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-94a3b8)">=</text><rect x="60" y="120" width="200" height="30" rx="8" fill="var(--svg-22c55e)"/><text x="160" y="140" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Fee: 0.00042 ETH ($1.47)</text><rect x="15" y="160" width="290" height="32" rx="6" fill="var(--svg-f1f5f9)"/><text x="60" y="176" font-size="8" fill="var(--svg-3b82f6)">Transfer: 21K</text><text x="120" y="176" font-size="8" fill="var(--svg-8b5cf6)">Token: 65K</text><text x="178" y="176" font-size="8" fill="var(--svg-f59e0b)">Swap: 180K</text><text x="240" y="176" font-size="8" fill="var(--svg-ef4444)">NFT: 300K+</text><text x="160" y="194" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">L2 networks (Arbitrum, Base) offer 10-100× lower fees</text></svg>',
      alt: 'Ethereum gas fee calculation diagram showing Gas Limit (21,000 units) times Gas Price (20 Gwei) equals a total fee of 0.00042 ETH ($1.47), with transaction type gas limits compared',
      caption: 'Simple ETH transfers use 21,000 gas; complex DeFi transactions can use 300,000+ gas. L2 networks dramatically reduce fees',
    },
    formulaDescription:
      'Ethereum transaction fees are calculated as Gas Used × Gas Price. Gas Limit is the maximum gas your transaction can consume. Gas Price (in Gwei = 10⁻⁹ ETH) is what you pay per unit of gas. Simple transfers use 21,000 gas, while complex contract interactions can use 300,000+ gas. The total fee in USD depends on the current ETH price, which adds a layer of volatility to transaction cost planning.',
    variables: [
      { symbol: 'Gas Limit', name: 'Gas Units Allowed', description: 'Maximum computational work your transaction can consume. Simpler transactions need less gas. Standard ETH transfer: 21,000. ERC-20 token transfer: ~65,000. Complex DeFi interaction: 300,000–500,000.' },
      { symbol: 'Gas Price (Gwei)', name: 'Price per Gas Unit', description: 'Amount you pay per unit of gas, denominated in Gwei (1 Gwei = 10⁻⁹ ETH). Higher price = faster confirmation. Typical range: 5–100 Gwei depending on network congestion.' },
      { symbol: 'EIP-1559 Fee', name: 'Base Fee + Priority Fee', description: 'EIP-1559 split the fee into the base fee (protocol-mandated, burned, adjusts with congestion) and the priority fee (optional tip to validators). Total price = Base Fee + Priority Fee. Setting a competitive priority fee alone is usually sufficient for timely inclusion.' },
    ],
    howToUse: [
      'Select your transaction type — each type has a preset gas limit based on typical computation required.',
      'Adjust the gas price in Gwei (default 20 Gwei). Slow/standard/fast tiers are auto-calculated at 0.9× and 1.5× of your entered price.',
      'Enter the current ETH price in USD to see your gas fee in dollar terms.',
      'View the estimated fee in both ETH and USD across all speed tiers.',
      'Use the slow tier for non-urgent transfers and the fast tier for time-sensitive DeFi trades or NFT mints.',
    ],
    commonUses: [
      'Estimate the cost of an Ethereum transaction in both ETH and USD before sending to avoid overpaying during network congestion.',
      'Compare gas fees across slow, standard, and fast priority tiers to choose the right balance of cost and confirmation speed.',
      'Plan DeFi trades and NFT minting around low-volume hours to minimize transaction costs on the Ethereum network.',
    ],
    explanation:
      'Ethereum gas fees are the cost of computation on the Ethereum network. Every operation — from simple ETH transfers to complex smart contract interactions — costs gas denominated in Gwei (1 Gwei = 0.000000001 ETH). EIP-1559 (London Fork, August 2021) introduced a base fee that adjusts based on network congestion, plus an optional priority fee (tip) to validators. Gas prices spike during high-demand periods like NFT mints, DeFi liquidations, or popular airdrop claims. To save on fees, use Layer 2 solutions (Arbitrum, Optimism, Base) which offer 10–100x lower costs, or time your transactions during low-volume hours (weekends, late nights UTC). The "Gas Limit" for simple ETH transfers is exactly 21,000 — any unused gas is refunded, but you cannot exceed the limit without the transaction failing. For complex smart contract interactions, setting the gas limit too low causes the transaction to fail while still consuming the gas, resulting in a wasted fee.',
    faqs: [
      {
        question: 'What is Gwei?',
        answer: 'Gwei is a denomination of ETH: 1 Gwei = 0.000000001 ETH (10⁻⁹). Gas prices are typically quoted in Gwei because ETH prices per gas unit would be too small to work with conveniently. At $3,500/ETH, 20 Gwei costs about $0.00007 per gas unit. One Ether equals 1,000,000,000 Gwei (1 billion Gwei). Other common denominations include Kwei (10³), Mwei (10⁶), and Twei (10¹²), but Gwei is the standard for gas pricing.',
      },
      {
        question: 'Why do complex transactions cost more?',
        answer: 'Complex transactions execute more computational operations on the Ethereum Virtual Machine (EVM). Each operation (ADD, MUL, SSTORE, SLOAD, etc.) has a predefined gas cost. A simple transfer just updates two balances (21,000 gas), while a Uniswap swap involves multiple token transfers, pool state updates, and price calculations (~180,000 gas). An NFT mint involves contract storage writes and state changes (~300,000 gas). Every storage operation (SSTORE) is particularly expensive because it permanently changes the blockchain state.',
      },
      {
        question: 'How can I reduce gas fees?',
        answer: 'Use Layer 2 solutions (Arbitrum, Optimism, Base, zkSync) for 10–100x cheaper transactions. Time transactions during low network congestion (weekends, late night UTC). Use gas trackers like Etherscan Gas Tracker or BlockNative to find optimal gas prices. Consider using EIP-1559 MaxFee/MaxPriorityFee fields to avoid overpaying during short congestion spikes. For DeFi users, consider protocols that offer "gasless" transactions or fee rebates. For regular transfers, consider the slow tier — it confirms eventually and saves significant fees.',
      },
    ],
  citations: [
    { source: 'Ethereum Gas Tracker', url: 'https://etherscan.io/gastracker' },
    { source: 'Ethereum Foundation', url: 'https://ethereum.org/en/developers/docs/gas/' },
  ],
  },
};

export default ethGasFeeConfig;
