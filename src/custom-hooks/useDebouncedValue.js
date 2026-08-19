import { useEffect, useState } from "react";

/**
 * Debounces a fast-changing value (typically a search box) so callers only
 * react to it `delay`ms after the user stops typing.
 *
 *   const search = useDebouncedValue(rawSearchInput, 400);
 */
export default function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
