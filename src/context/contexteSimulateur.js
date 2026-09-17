import { createContext, useContext } from 'react';

/**
 * Contexte et hook d'accès, isolés du composant Provider : un fichier qui
 * n'exporte pas que des composants casse le rafraîchissement à chaud de Vite.
 */
export const SimulateurContext = createContext(null);

export function useSimulateur() {
  const ctx = useContext(SimulateurContext);
  if (!ctx) throw new Error('useSimulateur doit être utilisé dans <SimulateurProvider>.');
  return ctx;
}
