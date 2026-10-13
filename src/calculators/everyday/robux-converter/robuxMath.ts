// Pure pack-pricing maths shared by index.ts and the panel (the panel used to keep its own copy of the price tables).
//
// PRICES ARE AN ILLUSTRATIVE SNAPSHOT of US store prices (2025). Roblox and Epic change pack sizes, bonuses and prices
// (for example Epic reduced the V-Bucks in each pack in March 2026; Roblox pays more Robux on the web than in mobile apps),
// so the calculator always tells the user to confirm in the official store.

export interface Package {
  amount: number;
  cost: number;
}

export const PRICES_NOTE =
  'Illustrative US store prices (2025 snapshot). Pack sizes, bonuses and prices change by region, platform and date - check the official Roblox or Epic Games store before buying.';

export const ROBUX_PACKAGES: Package[] = [
  { amount: 400, cost: 4.99 },
  { amount: 800, cost: 9.99 },
  { amount: 1700, cost: 19.99 },
  { amount: 4500, cost: 49.99 },
  { amount: 10000, cost: 99.99 },
];

/** Roblox Premium members: 10% more Robux for the same price (snapshot; reportedly being phased out). */
export const ROBUX_PREMIUM_PACKAGES: Package[] = ROBUX_PACKAGES.map((p) => ({ amount: Math.round(p.amount * 1.1), cost: p.cost }));

export const VBUCK_PACKAGES: Package[] = [
  { amount: 1000, cost: 8.99 },
  { amount: 2800, cost: 22.99 },
  { amount: 5000, cost: 36.99 },
  { amount: 13500, cost: 89.99 },
];

export function packagesFor(currencyType: string): { packages: Package[]; bonusPercent: number; display: string } {
  if (currencyType === 'Roblox Premium') return { packages: ROBUX_PREMIUM_PACKAGES, bonusPercent: 10, display: 'Robux (Premium)' };
  if (currencyType === 'V-Bucks') return { packages: VBUCK_PACKAGES, bonusPercent: 0, display: 'V-Bucks' };
  return { packages: ROBUX_PACKAGES, bonusPercent: 0, display: 'Robux' };
}

/** Pack with the lowest price per unit (ties go to the first listed). */
export function findBestPackage(packages: Package[]): Package {
  let best = packages[0];
  for (const p of packages) if (p.cost / p.amount < best.cost / best.amount) best = p;
  return best;
}

export interface Purchase {
  /** how many of each pack, e.g. [{ pkg: 1700 pack, count: 2 }] */
  items: { pkg: Package; count: number }[];
  units: number;
  cents: number;
}

/** Cheapest mix of packs that delivers AT LEAST `amount` units (unbounded knapsack over whole cents). */
export function cheapestCover(packages: Package[], amount: number): Purchase {
  const maxPack = Math.max(...packages.map((p) => p.amount));
  const limit = amount + maxPack;
  const INF = Number.MAX_SAFE_INTEGER;
  const cost = new Float64Array(limit + 1).fill(INF);
  const pick = new Int8Array(limit + 1).fill(-1);
  cost[0] = 0;
  const cents = packages.map((p) => Math.round(p.cost * 100));
  for (let j = 1; j <= limit; j++) {
    for (let i = 0; i < packages.length; i++) {
      const a = packages[i].amount;
      if (j >= a && cost[j - a] + cents[i] < cost[j]) {
        cost[j] = cost[j - a] + cents[i];
        pick[j] = i;
      }
    }
  }
  let best = amount;
  for (let j = amount; j <= limit; j++) if (cost[j] < cost[best]) best = j;
  const counts = new Map<number, number>();
  for (let j = best; j > 0; j -= packages[pick[j]].amount) counts.set(pick[j], (counts.get(pick[j]) ?? 0) + 1);
  const items = [...counts.entries()]
    .sort((a, b) => packages[b[0]].amount - packages[a[0]].amount)
    .map(([i, count]) => ({ pkg: packages[i], count }));
  return { items, units: best, cents: cost[best] };
}

/** Buying only one pack size, as many as needed. */
export function singlePackPurchase(pkg: Package, amount: number): Purchase {
  const count = Math.ceil(amount / pkg.amount);
  return { items: [{ pkg, count }], units: count * pkg.amount, cents: count * Math.round(pkg.cost * 100) };
}
