import { useEffect, useState } from 'react';

/** Retarde la propagation d'une valeur — évite une requête à chaque frappe. */
export function useDebounce(valeur, delai = 600) {
  const [differee, setDifferee] = useState(valeur);

  useEffect(() => {
    const timer = setTimeout(() => setDifferee(valeur), delai);
    return () => clearTimeout(timer);
  }, [valeur, delai]);

  return differee;
}
