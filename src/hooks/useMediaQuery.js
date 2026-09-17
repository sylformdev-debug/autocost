import { useCallback, useSyncExternalStore } from 'react';

/**
 * Écoute une media query — utilisé pour adapter la densité des graphiques.
 *
 * `useSyncExternalStore` est l'API prévue par React pour s'abonner à une
 * source extérieure : pas d'état local à resynchroniser, pas de rendu
 * intermédiaire avec une valeur fausse, et le serveur reçoit `false`.
 */
export function useMediaQuery(query) {
  const sabonner = useCallback(
    (notifier) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notifier);
      return () => mql.removeEventListener('change', notifier);
    },
    [query],
  );

  const lire = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(sabonner, lire, () => false);
}
