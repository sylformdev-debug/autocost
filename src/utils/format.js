import { DEFAULT_REGION, getRegion } from '../constants/regions';

/**
 * Formatage centralisé. Toute valeur affichée à l'écran passe par ici :
 * aucun composant ne fait de `toFixed()` ni de concaténation d'unité.
 *
 * Les `Intl.*Format` sont coûteux à instancier — on les met en cache par clé.
 */
const cache = new Map();

const getFormatter = (key, factory) => {
  if (!cache.has(key)) cache.set(key, factory());
  return cache.get(key);
};

/** Convertit toute entrée douteuse (null, '', NaN, '12,5') en nombre fini ou null. */
export const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/** 28 450 € — arrondi à l'euro, jamais de décimales parasites. */
export const formatPrix = (value, regionCode = DEFAULT_REGION) => {
  const n = toNumber(value);
  if (n === null) return '—';
  const { locale, devise } = getRegion(regionCode);
  return getFormatter(`prix:${locale}:${devise}`, () =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: devise,
      maximumFractionDigits: 0,
    }),
  ).format(n);
};

/** 474 €/mois */
export const formatPrixMensuel = (value, regionCode = DEFAULT_REGION) => {
  const n = toNumber(value);
  if (n === null) return '—';
  return `${formatPrix(n, regionCode)}/mois`;
};

/** 0,38 €/km — 2 décimales, l'unité pertinente à cette échelle. */
export const formatCoutParKm = (value, regionCode = DEFAULT_REGION) => {
  const n = toNumber(value);
  if (n === null) return '—';
  const { locale, devise } = getRegion(regionCode);
  const montant = getFormatter(`km:${locale}:${devise}`, () =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: devise,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  ).format(n);
  return `${montant}/km`;
};

/** 15 000 km */
export const formatKm = (value, suffixe = 'km') => {
  const n = toNumber(value);
  if (n === null) return '—';
  const formatted = getFormatter('km:fr-FR', () =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }),
  ).format(n);
  return suffixe ? `${formatted} ${suffixe}` : formatted;
};

/** 15 000 km/an */
export const formatKmParAn = (value) => {
  const n = toNumber(value);
  return n === null ? '—' : `${formatKm(n)}/an`;
};

/** 24 % */
export const formatPourcentage = (value, decimales = 0) => {
  const n = toNumber(value);
  if (n === null) return '—';
  return getFormatter(`pct:${decimales}`, () =>
    new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }),
  ).format(n);
};

/** 1 an / 5 ans */
export const formatAnnees = (value) => {
  const n = toNumber(value);
  if (n === null) return '—';
  return `${formatKm(n, '')} ${Math.abs(n) <= 1 ? 'an' : 'ans'}`;
};

/** 5,5 L/100 km — l'unité dépend de la motorisation. */
export const formatConsommation = (value, unite) => {
  const n = toNumber(value);
  if (n === null) return '—';
  const formatted = getFormatter('conso', () =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }),
  ).format(n);
  return unite ? `${formatted} ${unite}` : formatted;
};

/** 15 septembre 2026 à 14:32 */
export const formatDateHeure = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return getFormatter('datetime', () =>
    new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }),
  ).format(date);
};

/** Libellé complet d'un véhicule, utilisé partout (cartes, tableau, légendes). */
export const nomVehicule = (vehicule) => {
  if (!vehicule) return 'Véhicule inconnu';
  return [vehicule.marque, vehicule.modele].filter(Boolean).join(' ') || 'Véhicule';
};

/** Nom compact pour les axes de graphiques, qui manquent de place. */
export const nomCourt = (vehicule, longueurMax = 18) => {
  const nom = nomVehicule(vehicule);
  return nom.length > longueurMax ? `${nom.slice(0, longueurMax - 1)}…` : nom;
};
