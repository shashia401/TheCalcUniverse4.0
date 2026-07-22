import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CalculatorResult, InputField } from '../types/calculator';

export interface SavedCalculation {
  id: string;
  calculatorId: string;
  calculatorTitle: string;
  categorySlug: string;
  savedAt: Date;
  inputs: Array<{ label: string; value: string; display: string }>;
  results: CalculatorResult[];
}

interface SessionHistoryContextValue {
  history: SavedCalculation[];
  save: (calc: Omit<SavedCalculation, 'id' | 'savedAt'>) => void;
  upsertLatest: (calc: Omit<SavedCalculation, 'id' | 'savedAt'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const SessionHistoryContext = createContext<SessionHistoryContextValue | null>(null);

const STORAGE_KEY = 'calcuniverse_session_history';
const MAX_HISTORY = 20;

function loadFromStorage(): SavedCalculation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: SavedCalculation) => ({
      ...item,
      savedAt: new Date(item.savedAt),
    }));
  } catch {
    return [];
  }
}

function saveToStorage(history: SavedCalculation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function SessionHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<SavedCalculation[]>(loadFromStorage);

  useEffect(() => {
    saveToStorage(history);
  }, [history]);

  const save = useCallback((calc: Omit<SavedCalculation, 'id' | 'savedAt'>) => {
    const entry: SavedCalculation = {
      ...calc,
      id: `${calc.calculatorId}-${Date.now()}`,
      savedAt: new Date(),
    };
    setHistory((prev) => [entry, ...prev]);
  }, []);

  const upsertLatest = useCallback((calc: Omit<SavedCalculation, 'id' | 'savedAt'>) => {
    setHistory((prev) => {
      const top = prev[0];
      if (top && top.calculatorId === calc.calculatorId) {
        const updated: SavedCalculation = { ...top, ...calc, savedAt: new Date() };
        return [updated, ...prev.slice(1)];
      }
      const entry: SavedCalculation = {
        ...calc,
        id: `${calc.calculatorId}-${Date.now()}`,
        savedAt: new Date(),
      };
      return [entry, ...prev];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setHistory((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }, []);

  return (
    <SessionHistoryContext.Provider value={{ history, save, upsertLatest, remove, clear }}>
      {children}
    </SessionHistoryContext.Provider>
  );
}

export function useSessionHistory() {
  const ctx = useContext(SessionHistoryContext);
  if (!ctx) throw new Error('useSessionHistory must be used inside SessionHistoryProvider');
  return ctx;
}

export function buildInputDisplays(
  fields: InputField[],
  values: Record<string, string>
): Array<{ label: string; value: string; display: string }> {
  return fields
    .filter((f) => values[f.id] && values[f.id].trim() !== '')
    .map((f) => {
      const val = values[f.id];
      const display = f.prefix ? `${f.prefix}${val}` : f.unit ? `${val} ${f.unit}` : val;
      return { label: f.label, value: val, display };
    });
}
