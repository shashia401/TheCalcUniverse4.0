import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Review, AggregateRatingData } from '../types/calculator';

interface ReviewsContextValue {
  getCalculatorReviews: (calculatorId: string) => Review[];
  getAggregateRating: (calculatorId: string) => AggregateRatingData | null;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Review;
}

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

const STORAGE_KEY = 'calcuniverse_reviews';

function loadAllReviews(): Record<string, Review[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllReviews(reviews: Record<string, Review[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (e) { console.warn('localStorage write failed:', e); }
}

function computeAggregate(reviews: Review[]): AggregateRatingData | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    ratingValue: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  };
}

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [allReviews, setAllReviews] = useState<Record<string, Review[]>>(loadAllReviews);

  useEffect(() => {
    saveAllReviews(allReviews);
  }, [allReviews]);

  const getCalculatorReviews = useCallback(
    (calculatorId: string): Review[] => allReviews[calculatorId] ?? [],
    [allReviews],
  );

  const getAggregateRating = useCallback(
    (calculatorId: string): AggregateRatingData | null =>
      computeAggregate(allReviews[calculatorId] ?? []),
    [allReviews],
  );

  const lastReviewTimestamps = useRef<Record<string, number>>({});

  const addReview = useCallback(
    (review: Omit<Review, 'id' | 'createdAt'>): Review => {
      const now = Date.now();
      const lastTime = lastReviewTimestamps.current[review.calculatorId] ?? 0;
      if (now - lastTime < 30000) {
        throw new Error('Please wait 30 seconds between reviews.');
      }
      lastReviewTimestamps.current[review.calculatorId] = now;
      const full: Review = {
        ...review,
        id: `${review.calculatorId}-${Date.now()}-${typeof crypto !== 'undefined' && crypto.randomUUID ? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)) : Math.random().toString(36).slice(2) + Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      };
      setAllReviews((prev) => ({
        ...prev,
        [review.calculatorId]: [full, ...(prev[review.calculatorId] ?? [])],
      }));
      return full;
    },
    [],
  );

  const value = useMemo(() => ({
    getCalculatorReviews, getAggregateRating, addReview,
  }), [getCalculatorReviews, getAggregateRating, addReview]);

  return (
    <ReviewsContext.Provider value={value}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}
