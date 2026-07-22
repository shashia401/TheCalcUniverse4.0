import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CalculatorMeta } from '../types/calculator';

interface BookmarkItem {
  id: string;
  title: string;
  shortTitle?: string;
  category: string;
  categorySlug: string;
  savedAt: number;
}

interface BookmarksContextValue {
  bookmarks: BookmarkItem[];
  isBookmarked: (id: string) => boolean;
  addBookmark: (entry: CalculatorMeta) => void;
  removeBookmark: (id: string) => void;
  toggleBookmark: (entry: CalculatorMeta) => void;
  clearAll: () => void;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

const STORAGE_KEY = 'tcu_bookmarks';

function loadBookmarks(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(items: BookmarkItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) { console.warn('localStorage write failed:', e); }
}

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(loadBookmarks);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  const isBookmarked = useCallback((id: string) => bookmarks.some((b) => b.id === id), [bookmarks]);

  const addBookmark = useCallback((entry: CalculatorMeta) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === entry.id)) return prev;
      return [
        { id: entry.id, title: entry.title, shortTitle: entry.shortTitle, category: entry.category, categorySlug: entry.categorySlug, savedAt: Date.now() },
        ...prev,
      ];
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setBookmarks([]);
  }, []);

  const toggleBookmark = useCallback((entry: CalculatorMeta) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === entry.id)) {
        return prev.filter((b) => b.id !== entry.id);
      }
      return [
        { id: entry.id, title: entry.title, shortTitle: entry.shortTitle, category: entry.category, categorySlug: entry.categorySlug, savedAt: Date.now() },
        ...prev,
      ];
    });
  }, []);

  const value = useMemo(() => ({
    bookmarks, isBookmarked, addBookmark, removeBookmark, toggleBookmark, clearAll,
  }), [bookmarks, isBookmarked, addBookmark, removeBookmark, toggleBookmark, clearAll]);

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarksProvider');
  return ctx;
}
