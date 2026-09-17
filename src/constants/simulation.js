/**
 * Bornes métier partagées par la validation, le formulaire et le moteur local.
 * Une seule source de vérité pour éviter des seuils divergents entre l'UI et
 * la validation.
 */
export const KILOMETRAGE = {
  min: 1000,
  max: 100000,
  step: 500,
  defaut: 15000,
  seuilAvertissement: 60000,
};

export const DUREE = {
  min: 1,
  max: 15,
  step: 1,
  defaut: 5,
  seuilAvertissement: 12,
};

/** Au-delà, les graphiques deviennent illisibles. */
export const MAX_VEHICULES = 4;
export const MIN_VEHICULES = 1;

/** Libellés des postes de dépense, dans l'ordre d'affichage. */
export const POSTES_COUT = [
  { key: 'carburant', label: 'Carburant / Énergie' },
  { key: 'entretien', label: 'Entretien' },
  { key: 'assurance', label: 'Assurance' },
  { key: 'decote_estimee', label: 'Décote' },
  { key: 'autres', label: 'Autres frais' },
];

export const MOTORISATIONS = {
  essence: { label: 'Essence', unite: 'L/100 km' },
  diesel: { label: 'Diesel', unite: 'L/100 km' },
  hybride: { label: 'Hybride', unite: 'L/100 km' },
  electrique: { label: 'Électrique', unite: 'kWh/100 km' },
};

export const getMotorisation = (code) =>
  MOTORISATIONS[code] ?? { label: code || 'Inconnue', unite: '' };
