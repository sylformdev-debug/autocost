import { request } from '../httpClient';
import { ApiError, CODES } from '../errors';
import {
  normaliserListeVehicules,
  normaliserSimulation,
  normaliserVehicule,
} from '../normalize';

/**
 * Provider « API réelle ».
 *
 * Implémente exactement le contrat du cahier des charges :
 *   GET  /vehicules
 *   GET  /vehicules/:id
 *   POST /simulation
 *
 * Si l'enseignant fournit des chemins différents, ils se changent ICI et
 * nulle part ailleurs.
 */
export const ENDPOINTS = {
  vehicules: '/vehicules',
  vehicule: (id) => `/vehicules/${encodeURIComponent(id)}`,
  simulation: '/simulation',
};

export async function getVehicles({ signal } = {}) {
  const brut = await request(ENDPOINTS.vehicules, { signal });
  return normaliserListeVehicules(brut);
}

export async function getVehicleById(id, { signal } = {}) {
  if (!id) throw new ApiError(CODES.NOT_FOUND, { debug: 'id manquant' });
  const brut = await request(ENDPOINTS.vehicule(id), { signal });
  const vehicule = normaliserVehicule(brut?.vehicule ?? brut?.data ?? brut);
  if (!vehicule) throw new ApiError(CODES.NOT_FOUND, { debug: 'véhicule illisible' });
  return vehicule;
}

export async function runSimulation(params, { signal } = {}) {
  const brut = await request(ENDPOINTS.simulation, {
    method: 'POST',
    signal,
    body: {
      vehicule_ids: params.vehiculeIds,
      kilometrage_annuel: params.kilometrageAnnuel,
      duree_annees: params.dureeAnnees,
      region: params.region,
    },
  });
  return normaliserSimulation(brut);
}
