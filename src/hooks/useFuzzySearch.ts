import { useMemo } from 'react';
import Fuse from 'fuse.js';

interface SearchOptions<T> {
  keys: (keyof T)[];
  threshold?: number;
}

export function useFuzzySearch<T>(
  items: T[] | undefined,
  searchTerm: string,
  options: SearchOptions<T>
) {
  const fuse = useMemo(() => {
    if (!items) return null;
    
    return new Fuse(items, {
      keys: options.keys as string[],
      threshold: options.threshold ?? 0.4, // 0 = exact match, 1 = match anything
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
    });
  }, [items, options.keys, options.threshold]);

  const results = useMemo(() => {
    if (!fuse || !searchTerm.trim()) {
      return items || [];
    }

    return fuse.search(searchTerm).map(result => result.item);
  }, [fuse, searchTerm, items]);

  return results;
}
