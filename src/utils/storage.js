import { DEFAULT_REGION, isValidRegion } from '../constants/regions';
import { DUREE, KILOMETRAGE, MAX_VEHICULES } from '../constants/simulation';

/**
 * Persistance locale (§22).
 *
 * `localStorage` peut être indisponible (navigation privée, stockage bloqué,
 * quota dépassé) : chaque accès est protégé et l'application fonctionne
 * normalement sans lui.
 */
const CLE = 'autocost:v1:session';

const disponible = (() => {
  try {
    const test = '__autocost_test__';
    window.localStorage.setItem(test, '1');
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
})();

/** Une valeur venant du stockage est une donnée non fiable : on la revalide entièrement. */
function assainirSession(brut) {
  if (!brut || typeof brut !== 'object') return null;
  const p = brut.parametres;
  if (!p || typeof p !== 'object') return null;

  const vehiculeIds = Array.isArray(p.vehiculeIds)
    ? p.vehiculeIds.filter((id) => typeof id === 'string' && id.length < 120).slice(0, MAX_VEHICULES)
    : [];

  const km = Number(p.kilometrageAnnuel);
  const duree = Number(p.dureeAnnees);

  if (vehiculeIds.length === 0) return null;
  if (!Number.isFinite(km) || km < KILOMETRAGE.min || km > KILOMETRAGE.max) return null;
  if (!Number.isInteger(duree) || duree < DUREE.min || duree > DUREE.max) return null;

  const resultats = Array.isArray(brut.resultats) ? brut.resultats : null;

  return {
    parametres: {
      vehiculeIds,
      kilometrageAnnuel: km,
      dureeAnnees: duree,
      region: isValidRegion(p.region) ? p.region : DEFAULT_REGION,
    },
    resultats,
    date: typeof brut.date === 'string' ? brut.date : null,
  };
}

export function lireSession() {
  if (!disponible) return null;
  try {
    const brut = window.localStorage.getItem(CLE);
    return brut ? assainirSession(JSON.parse(brut)) : null;
  } catch {
    return null;
  }
}

export function ecrireSession(session) {
  if (!disponible) return;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(session));
  } catch {
    /* quota dépassé : la persistance est un confort, jamais une dépendance */
  }
}

export function effacerSession() {
  if (!disponible) return;
  try {
    window.localStorage.removeItem(CLE);
  } catch {
    /* ignoré volontairement */
  }
}
