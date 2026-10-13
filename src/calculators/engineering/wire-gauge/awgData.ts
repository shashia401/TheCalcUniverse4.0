/**
 * AWG conductor data shared by wire-gauge, voltage-drop and the math/voltage-drop twin.
 *
 * Resistance: NEC Chapter 9, Table 8, uncoated stranded conductors, ohms per 1000 ft at 75 °C.
 * Ampacity: NEC Table 310.16 (formerly 310.15(B)(16)), not more than 3 current-carrying conductors, 30 °C ambient.
 * Small-conductor overcurrent limits: NEC 240.4(D). Aluminium building wire starts at 12 AWG (NEC 310.106(B)).
 * 4/0 is the largest size covered.
 */
export type Material = 'copper' | 'aluminum';

export const AWG_SIZES = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0'] as const;
export type Awg = (typeof AWG_SIZES)[number];

/** Ohms per 1000 ft, NEC Chapter 9 Table 8 (stranded, 75 °C). Aluminium has no 14 AWG entry. */
export const OHMS_PER_KFT: Record<Material, Partial<Record<Awg, number>>> = {
  copper: { '14': 3.14, '12': 1.98, '10': 1.24, '8': 0.778, '6': 0.491, '4': 0.308, '3': 0.245, '2': 0.194, '1': 0.154, '1/0': 0.122, '2/0': 0.0967, '3/0': 0.0766, '4/0': 0.0608 },
  aluminum: { '12': 3.25, '10': 2.04, '8': 1.28, '6': 0.808, '4': 0.508, '3': 0.403, '2': 0.319, '1': 0.253, '1/0': 0.201, '2/0': 0.159, '3/0': 0.126, '4/0': 0.1 },
};

/** Allowable ampacity, NEC Table 310.16, by insulation temperature rating. */
export const AMPACITY: Record<'copper60' | 'copper75' | 'copper90' | 'aluminum75', Partial<Record<Awg, number>>> = {
  copper60: { '14': 15, '12': 20, '10': 30, '8': 40, '6': 55, '4': 70, '3': 85, '2': 95, '1': 110, '1/0': 125, '2/0': 145, '3/0': 165, '4/0': 195 },
  copper75: { '14': 20, '12': 25, '10': 35, '8': 50, '6': 65, '4': 85, '3': 100, '2': 115, '1': 130, '1/0': 150, '2/0': 175, '3/0': 200, '4/0': 230 },
  copper90: { '14': 25, '12': 30, '10': 40, '8': 55, '6': 75, '4': 95, '3': 115, '2': 130, '1': 145, '1/0': 170, '2/0': 195, '3/0': 225, '4/0': 260 },
  aluminum75: { '12': 20, '10': 30, '8': 40, '6': 50, '4': 65, '3': 75, '2': 90, '1': 100, '1/0': 120, '2/0': 135, '3/0': 155, '4/0': 180 },
};

/** NEC 240.4(D): maximum overcurrent device rating for the smallest conductors (amps). */
export const SMALL_CONDUCTOR_MAX_OCPD: Record<Material, Partial<Record<Awg, number>>> = {
  copper: { '14': 15, '12': 20, '10': 30 },
  aluminum: { '12': 15, '10': 25 },
};

/** NEC 310.15(C)(1) adjustment factors for more than 3 current-carrying conductors in a raceway/cable. */
export function conduitDerating(currentCarrying: number): number {
  if (currentCarrying <= 3) return 1;
  if (currentCarrying <= 6) return 0.8;
  if (currentCarrying <= 9) return 0.7;
  if (currentCarrying <= 20) return 0.5;
  if (currentCarrying <= 30) return 0.45;
  if (currentCarrying <= 40) return 0.4;
  return 0.35;
}

/** One-way-length voltage drop in volts: single-phase 2·I·R·L/1000, three-phase √3·I·R·L/1000. */
export function voltageDropVolts(currentA: number, oneWayFt: number, ohmsPerKft: number, phase: 'single' | 'three' = 'single'): number {
  const k = phase === 'three' ? Math.sqrt(3) : 2;
  return (k * currentA * oneWayFt * ohmsPerKft) / 1000;
}
