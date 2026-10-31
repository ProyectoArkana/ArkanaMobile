import { useEffect, useState } from 'react';

// Devuelve `value` solo después de que deja de cambiar durante `delayMs`
// (evita llamar al servidor en cada tecla).
export const useDebouncedValue = <T>(value: T, delayMs = 350): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}