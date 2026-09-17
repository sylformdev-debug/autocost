import { CONFIG, SOURCE } from './config';
import * as mockApi from './mock/mockApi';
import * as restApi from './rest/restApi';
import { avecPhoto, avecPhotos } from '../constants/photos';

/**
 * Point d'entrée UNIQUE des données pour toute l'application.
 *
 * Les composants importent `getVehicles`, `getVehicleById`, `runSimulation`
 * depuis ici et ignorent totalement d'où viennent les données. Le provider est
 * choisi une seule fois, au chargement, d'après les variables d'environnement.
 */
const provider = CONFIG.source === SOURCE.REST ? restApi : mockApi;

/**
 * Les photos déclarées dans `constants/photos.js` sont appliquées ici, après
 * le provider : elles s'ajoutent aussi bien au jeu de démonstration qu'aux
 * réponses d'une API réelle, sans que ni l'un ni l'autre n'ait à les connaître.
 */
export const getVehicles = async (options) => avecPhotos(await provider.getVehicles(options));
export const getVehicleById = async (id, options) =>
  avecPhoto(await provider.getVehicleById(id, options));
export const runSimulation = (params, options) => provider.runSimulation(params, options);

export { CONFIG, SOURCE };
export { LIBELLE_SOURCE, utiliseMock } from './config';
export { ApiError, CODES } from './errors';
