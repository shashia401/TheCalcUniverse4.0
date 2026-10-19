import type { CalculatorResult } from '../types/calculator';

/** The displayed value of one result row (so a worked solution quotes the calculator's own answer, never a second copy of its math). */
export const resultValue = (rows: CalculatorResult[], id: string): string | undefined => rows.find((r) => r.id === id)?.value;

/** True when calculate() produced real answers (not empty, not an error / "No such triangle" row). */
export const hasAnswer = (rows: CalculatorResult[]): boolean => rows.length > 0 && !rows.some((r) => r.id === 'error' || r.id === 'triangleError');
