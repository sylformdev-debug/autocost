import { VEHICULES } from './vehicules.data';
import { calculerTCO } from './simulationEngine';
import { ApiError, CODES } from '../errors';
import {
  normaliserListeVehicules,
  normaliserSimulation,
  normaliserVehicule,
} from '../normalize';

/**
 * Provider « démonstration ».
 *
 * Il expose la MÊME signature que `rest/restApi.js` et renvoie des données au
 * même format brut, qui passent par les mêmes normalisateurs. Basculer de l'un
 * à l'autre ne change donc rien côté React.
 *
 * La latence artificielle sert à exercer réellement les états de chargement.
 */
const LATENCE = 420;

const annulation = () => {
  const erreur = new Error('cancelled');
  erreur.name = 'CancelledError';
  return erreur;
};

const attendre = (ms, signal) =>
  new Promise((resolve, reject) => {
    // Même contrat que le client HTTP : un signal déjà annulé rejette
    // immédiatement, et l'écouteur est retiré dans tous les cas.
    if (signal?.aborted) {
      reject(annulation());
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(annulation());
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
  });

export async function getVehicles({ signal } = {}) {
  await attendre(LATENCE, signal);
  return normaliserListeVehicules(VEHICULES);
}

export async function getVehicleById(id, { signal } = {}) {
  await attendre(LATENCE / 2, signal);
  const brut = VEHICULES.find((v) => v.id === String(id));
  if (!brut) throw new ApiError(CODES.NOT_FOUND, { status: 404, debug: `id=${id}` });
  return normaliserVehicule(brut);
}

export async function runSimulation(params, { signal } = {}) {
  await attendre(LATENCE + 180, signal);

  const demandes = Array.isArray(params?.vehiculeIds) ? params.vehiculeIds.map(String) : [];
  if (demandes.length === 0) {
    throw new ApiError(CODES.VALIDATION, { status: 400, debug: 'vehicule_ids vide' });
  }

  const connus = demandes
    .map((id) => VEHICULES.find((v) => v.id === id))
    .filter(Boolean)
    .map(normaliserVehicule);

  // Comportement d'une vraie API : si AUCUN identifiant n'existe, c'est un 404.
  // Si seuls certains existent, on renvoie ce qui est calculable et l'interface
  // signalera les véhicules devenus indisponibles.
  if (connus.length === 0) {
    throw new ApiError(CODES.NOT_FOUND, { status: 404, debug: demandes.join(',') });
  }

  const resultats = connus.map((vehicule) => calculerTCO(vehicule, params));
  return normaliserSimulation({ resultats });
}
