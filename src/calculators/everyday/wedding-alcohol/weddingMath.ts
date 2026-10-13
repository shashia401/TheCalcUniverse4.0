// Pure drink-planning maths shared by index.ts and the panel (the panel used to parse result strings).
// The per-hour rates below are PLANNING RULES OF THUMB, not measured data: each drinker in a category is assumed to have
// 1.5 beers, 1.0 glasses of wine or 0.75 cocktails per hour of bar service. Bottle yields: a 750 ml bottle of wine pours
// 5 glasses of 5 oz (25.4 oz / 5), a 750 ml bottle of spirits holds 25.4 fl oz = about 17 shots of 1.5 oz.

export const BEER_PER_HOUR = 1.5;
export const WINE_PER_HOUR = 1.0;
export const COCKTAILS_PER_HOUR = 0.75;
export const GLASSES_PER_WINE_BOTTLE = 5;
export const SHOTS_PER_LIQUOR_BOTTLE = 17;

export interface AlcoholPlan {
  guests: number;
  drinkingGuests: number;
  duration: number;
  beerPct: number;
  winePct: number;
  liquorPct: number;
  splitTotal: number;
  beer: number;
  wineGlasses: number;
  wineBottles: number;
  liquorDrinks: number;
  liquorBottles: number;
  totalDrinks: number;
}

export function alcoholPlan(values: Record<string, string>): AlcoholPlan | null {
  const guests = parseInt(values.guests, 10);
  if (!Number.isFinite(guests) || guests <= 0) return null;
  const num = (v: string | undefined, d: number) => (v === undefined || v === '' ? d : parseFloat(v));
  const drinkersPct = num(values.drinkersPct, 80);
  const duration = num(values.duration, 4);
  const beerPct = num(values.beerPct, 40);
  const winePct = num(values.winePct, 30);
  const liquorPct = num(values.liquorPct, 30);
  if (![drinkersPct, duration, beerPct, winePct, liquorPct].every(Number.isFinite)) return null;
  if (drinkersPct < 0 || drinkersPct > 100 || duration <= 0 || beerPct < 0 || winePct < 0 || liquorPct < 0) return null;

  const drinkingGuests = (guests * drinkersPct) / 100;
  const beer = drinkingGuests * (beerPct / 100) * duration * BEER_PER_HOUR;
  const wineGlasses = drinkingGuests * (winePct / 100) * duration * WINE_PER_HOUR;
  const liquorDrinks = drinkingGuests * (liquorPct / 100) * duration * COCKTAILS_PER_HOUR;
  return {
    guests, drinkingGuests, duration, beerPct, winePct, liquorPct,
    splitTotal: beerPct + winePct + liquorPct,
    beer, wineGlasses, wineBottles: wineGlasses / GLASSES_PER_WINE_BOTTLE,
    liquorDrinks, liquorBottles: liquorDrinks / SHOTS_PER_LIQUOR_BOTTLE,
    totalDrinks: beer + wineGlasses + liquorDrinks,
  };
}
