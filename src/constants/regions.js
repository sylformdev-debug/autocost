/**
 * Régions supportées par le simulateur.
 *
 * Ajouter une région = ajouter une entrée ici. Aucun autre fichier n'a besoin
 * d'être modifié : le <select>, la validation, le formatage monétaire et le
 * moteur de simulation local lisent tous cette source unique.
 *
 * - prixCarburant : € (ou CHF) par litre
 * - prixElectricite : prix du kWh à domicile
 * - coefAssurance / coefEntretien : multiplicateurs locaux (1 = référence FR)
 */
export const REGIONS = {
  FR: {
    code: 'FR',
    label: 'France',
    devise: 'EUR',
    locale: 'fr-FR',
    prixCarburant: { essence: 1.86, diesel: 1.74 },
    prixElectricite: 0.2516,
    coefAssurance: 1,
    coefEntretien: 1,
    carteGrise: 260,
  },
  BE: {
    code: 'BE',
    label: 'Belgique',
    devise: 'EUR',
    locale: 'fr-BE',
    prixCarburant: { essence: 1.79, diesel: 1.81 },
    prixElectricite: 0.3411,
    coefAssurance: 1.12,
    coefEntretien: 1.05,
    carteGrise: 495,
  },
  DE: {
    code: 'DE',
    label: 'Allemagne',
    devise: 'EUR',
    locale: 'de-DE',
    prixCarburant: { essence: 1.75, diesel: 1.68 },
    prixElectricite: 0.3951,
    coefAssurance: 0.94,
    coefEntretien: 1.1,
    carteGrise: 120,
  },
  ES: {
    code: 'ES',
    label: 'Espagne',
    devise: 'EUR',
    locale: 'es-ES',
    prixCarburant: { essence: 1.62, diesel: 1.52 },
    prixElectricite: 0.2237,
    coefAssurance: 0.83,
    coefEntretien: 0.88,
    carteGrise: 180,
  },
  CH: {
    code: 'CH',
    label: 'Suisse',
    devise: 'CHF',
    locale: 'fr-CH',
    prixCarburant: { essence: 1.79, diesel: 1.85 },
    prixElectricite: 0.3216,
    coefAssurance: 1.35,
    coefEntretien: 1.42,
    carteGrise: 390,
  },
};

export const REGION_CODES = Object.keys(REGIONS);

export const REGION_OPTIONS = REGION_CODES.map((code) => ({
  value: code,
  label: REGIONS[code].label,
}));

export const DEFAULT_REGION = 'FR';

export const isValidRegion = (code) =>
  typeof code === 'string' && Object.prototype.hasOwnProperty.call(REGIONS, code);

export const getRegion = (code) => REGIONS[code] ?? REGIONS[DEFAULT_REGION];
