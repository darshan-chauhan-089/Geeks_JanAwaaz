import { useEffect, useRef, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of inactivity.  Perfect for search inputs — prevents an API call on every
 * keystroke.
 *
 * @template T
 * @param {T}      value  - The value to debounce
 * @param {number} delay  - Milliseconds to wait (default 400)
 * @returns {T}            Debounced value
 *
 * Usage:
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery    = useDebounce(query, 400);
 *
 *   useEffect(() => {
 *     if (debouncedQuery) fetchResults(debouncedQuery);
 *   }, [debouncedQuery]);
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timerRef.current);
  }, [value, delay]);

  return debouncedValue;
}
