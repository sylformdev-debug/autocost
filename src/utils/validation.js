import { DUREE, KILOMETRAGE, MAX_VEHICULES, MIN_VEHICULES } from '../constants/simulation';
import { isValidRegion } from '../constants/regions';
import { formatKm } from './format';

/**
 * Validation des paramètres AVANT tout appel réseau.
 * Retourne { valide, erreurs, avertissements } :
 *  - erreurs        → bloquent la simulation (bouton désactivé)
 *  - avertissements → informent sans bloquer
 */
export function validerParametres({ vehiculeIds = [], kilometrageAnnuel, dureeAnnees, region }) {
  const erreurs = {};
  const avertissements = {};

  // --- Véhicules ---
  if (!Array.isArray(vehiculeIds) || vehiculeIds.length < MIN_VEHICULES) {
    erreurs.vehicules = 'Sélectionnez au moins un véhicule à comparer.';
  } else if (vehiculeIds.length > MAX_VEHICULES) {
    erreurs.vehicules = `La comparaison est limitée à ${MAX_VEHICULES} véhicules pour rester lisible.`;
  }

  // --- Kilométrage ---
  const km = Number(kilometrageAnnuel);
  if (kilometrageAnnuel === '' || kilometrageAnnuel === null || kilometrageAnnuel === undefined) {
    erreurs.kilometrageAnnuel = 'Indiquez votre kilométrage annuel.';
  } else if (!Number.isFinite(km)) {
    erreurs.kilometrageAnnuel = 'Le kilométrage doit être un nombre.';
  } else if (!Number.isInteger(km)) {
    // Sinon l'affichage arrondirait (15 001 km) alors que le calcul
    // utiliserait la valeur décimale : deux chiffres différents à l'écran.
    erreurs.kilometrageAnnuel = 'Le kilométrage doit être un nombre entier de kilomètres.';
  } else if (km <= 0) {
    erreurs.kilometrageAnnuel = 'Le kilométrage doit être supérieur à zéro.';
  } else if (km < KILOMETRAGE.min) {
    erreurs.kilometrageAnnuel = `Minimum ${formatKm(KILOMETRAGE.min)} par an.`;
  } else if (km > KILOMETRAGE.max) {
    erreurs.kilometrageAnnuel = `Maximum ${formatKm(KILOMETRAGE.max)} par an.`;
  } else if (km >= KILOMETRAGE.seuilAvertissement) {
    avertissements.kilometrageAnnuel =
      'Kilométrage très élevé : les coûts d’entretien réels peuvent dépasser l’estimation.';
  }

  // --- Durée ---
  const duree = Number(dureeAnnees);
  if (dureeAnnees === '' || dureeAnnees === null || dureeAnnees === undefined) {
    erreurs.dureeAnnees = 'Indiquez une durée de possession.';
  } else if (!Number.isFinite(duree)) {
    erreurs.dureeAnnees = 'La durée doit être un nombre.';
  } else if (!Number.isInteger(duree)) {
    erreurs.dureeAnnees = 'La durée doit être un nombre entier d’années.';
  } else if (duree <= 0) {
    erreurs.dureeAnnees = 'La durée doit être d’au moins 1 an.';
  } else if (duree > DUREE.max) {
    erreurs.dureeAnnees = `La durée est limitée à ${DUREE.max} ans.`;
  } else if (duree >= DUREE.seuilAvertissement) {
    avertissements.dureeAnnees =
      'Au-delà de 12 ans, la projection de décote devient peu fiable.';
  }

  // --- Région ---
  if (!region) {
    erreurs.region = 'Sélectionnez une région.';
  } else if (!isValidRegion(region)) {
    erreurs.region = 'Cette région n’est pas prise en charge.';
  }

  return {
    valide: Object.keys(erreurs).length === 0,
    erreurs,
    avertissements,
  };
}

/**
 * Contraint une saisie numérique dans ses bornes et l'arrondit (utilisé au
 * blur des champs). Les deux paramètres du simulateur — kilométrage et durée —
 * sont des entiers : on ne laisse pas une décimale s'installer dans l'état.
 */
export const clamp = (value, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.round(Math.min(Math.max(n, min), max));
};
