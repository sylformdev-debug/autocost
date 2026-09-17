import { useCallback, useEffect, useRef, useState } from 'react';
import { getVehicles } from '../services';
import { toApiError } from '../services/errors';

/**
 * Chargement du catalogue de véhicules.
 * États explicites : chargement / erreur / vide / succès.
 *
 * L'état initial est déjà « en chargement » : l'effet de montage se contente
 * de lancer la requête, sans repasser par un setState synchrone qui
 * provoquerait un rendu supplémentaire pour rien.
 */
export function useVehicules() {
  const [vehicules, setVehicules] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const controleurRef = useRef(null);

  const executer = useCallback(() => {
    controleurRef.current?.abort();
    const controleur = new AbortController();
    controleurRef.current = controleur;

    getVehicles({ signal: controleur.signal })
      .then((liste) => {
        if (controleur.signal.aborted) return;
        setVehicules(liste);
        setErreur(null);
        setChargement(false);
      })
      .catch((e) => {
        if (controleur.signal.aborted || e?.name === 'CancelledError') return;
        setErreur(toApiError(e));
        setVehicules([]);
        setChargement(false);
      });
  }, []);

  /** Nouvelle tentative déclenchée par l'utilisateur : on réaffiche l'attente. */
  const recharger = useCallback(() => {
    setChargement(true);
    setErreur(null);
    executer();
  }, [executer]);

  useEffect(() => {
    executer();
    return () => controleurRef.current?.abort();
  }, [executer]);

  return { vehicules, chargement, erreur, recharger };
}
