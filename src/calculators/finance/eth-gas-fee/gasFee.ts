// Pure gas-fee math shared by index.ts and EthGasFeePanel.tsx.
// Fee (ETH) = gas units x gas price (Gwei) x 1e-9. Prices are whatever the user types in; nothing is fetched live.

export const TX_TYPES: Record<string, { gasLimit: number; label: string; approx: boolean }> = {
  'standard-transfer': { gasLimit: 21000, label: 'Standard ETH Transfer', approx: false },
  'erc20-transfer': { gasLimit: 65000, label: 'ERC-20 Token Transfer', approx: true },
  'uniswap-swap': { gasLimit: 180000, label: 'Uniswap Swap', approx: true },
  'nft-mint': { gasLimit: 300000, label: 'NFT Mint', approx: true },
  'complex-contract': { gasLimit: 500000, label: 'Complex Contract', approx: true },
};

/** Illustrative priority tiers: multiples of the gas price the user enters (not live network data). */
export const SLOW_MULTIPLIER = 0.9;
export const FAST_MULTIPLIER = 1.5;

export function feeEth(gasUnits: number, gweiPrice: number): number {
  return (gasUnits * gweiPrice) / 1e9;
}

/** Returns null for an unknown transaction type or non-positive prices. */
export function computeGasFee(txType: string, gasPriceGwei: number, ethPrice: number) {
  const tx = TX_TYPES[txType];
  if (!tx || !(gasPriceGwei > 0) || !(ethPrice > 0)) return null;
  const std = feeEth(tx.gasLimit, gasPriceGwei);
  const slow = feeEth(tx.gasLimit, gasPriceGwei * SLOW_MULTIPLIER);
  const fast = feeEth(tx.gasLimit, gasPriceGwei * FAST_MULTIPLIER);
  return {
    tx,
    gasLimit: tx.gasLimit,
    eth: { slow, std, fast },
    usd: { slow: slow * ethPrice, std: std * ethPrice, fast: fast * ethPrice },
  };
}

/** "0.00042 ETH": enough digits that sub-Gwei prices never round to zero. */
export function fmtEth(n: number): string {
  const s = n >= 0.001 ? n.toFixed(5) : n.toFixed(9).replace(/0+$/, '').replace(/\.$/, '.0');
  return `${s} ETH`;
}

export function fmtUsd(n: number): string {
  return n >= 1 ? `$${n.toFixed(2)}` : n >= 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(6)}`;
}

/** Gwei with as many decimals as needed (0.05 Gwei must not show as "0.1" or "0.0"). */
export function fmtGwei(n: number): string {
  return `${+n.toFixed(4)} Gwei`;
}
