import { ApiError, CODES } from './errors';
import { toNumber } from '../utils/format';
import { MOTORISATIONS } from '../constants/simulation';

/**
 * Normalisation défensive des réponses.
 *
 * Objectif : une donnée incomplète, mal typée ou partiellement absente ne doit
 * JAMAIS faire planter un composant. On convertit tout en une forme interne
 * stable, et on marque explicitement ce qui manque (`detail: null`,
 * `evolution: []`) pour que l'UI puisse afficher un état dégradé honnête
 * plutôt qu'inventer des valeurs.
 */

const MOTORISATIONS_CONNUES = Object.keys(MOTORISATIONS);

const normaliserMotorisation = (valeur) => {
  const v = String(valeur ?? '').trim().toLowerCase();
  if (MOTORISATIONS_CONNUES.includes(v)) return v;
  if (v.includes('électri') || v.includes('electri') || v === 'ev') return 'electrique';
  if (v.includes('hybrid')) return 'hybride';
  if (v.includes('gasoil') || v.includes('gazole')) return 'diesel';
  if (v.includes('essence') || v.includes('petrol') || v.includes('gasoline')) return 'essence';
  return 'essence';
};

/**
 * URL d'image fournie par le catalogue. La donnée vient de l'extérieur : on
 * n'accepte qu'un chemin local absolu (`/vehicules/clio.webp`) ou une URL
 * http(s). Tout le reste — `javascript:`, `data:`, chemin relatif ambigu — est
 * écarté, ce qui empêche qu'un attribut `src` piloté par l'API devienne un
 * vecteur d'injection.
 */
function normaliserImage(valeur) {
  const v = String(valeur ?? '').trim();
  if (!v) return null;
  if (/^\/[^/]/.test(v)) return v;
  if (/^https:\/\/[\w.-]+\//i.test(v) || /^http:\/\/[\w.-]+\//i.test(v)) return v;
  return null;
}

/** Un véhicule sans identifiant est inutilisable : on le rejette en amont. */
export function normaliserVehicule(brut) {
  if (!brut || typeof brut !== 'object') return null;
  const id = brut.id ?? brut.vehicule_id ?? brut.identifiant;
  if (id === undefined || id === null || String(id).trim() === '') return null;

  return {
    id: String(id),
    marque: String(brut.marque ?? brut.make ?? '').trim() || 'Marque inconnue',
    modele: String(brut.modele ?? brut.model ?? '').trim() || 'Modèle inconnu',
    motorisation: normaliserMotorisation(brut.motorisation ?? brut.energie),
    prixAchat: toNumber(brut.prix_achat ?? brut.prixAchat),
    consommation: toNumber(brut.consommation_moyenne ?? brut.consommation),
    annee: toNumber(brut.annee ?? brut.year),
    segment: brut.segment ? String(brut.segment) : null,
    places: toNumber(brut.places),
    image: normaliserImage(brut.image ?? brut.image_url ?? brut.photo),
  };
}

export function normaliserListeVehicules(brut) {
  const liste = Array.isArray(brut)
    ? brut
    : Array.isArray(brut?.vehicules)
      ? brut.vehicules
      : Array.isArray(brut?.data)
        ? brut.data
        : null;

  if (liste === null) throw new ApiError(CODES.FORMAT, { debug: 'Liste de véhicules absente' });

  return liste.map(normaliserVehicule).filter(Boolean);
}

function normaliserDetail(brut) {
  if (!brut || typeof brut !== 'object') return null;
  const detail = {
    carburant: toNumber(brut.carburant) ?? 0,
    entretien: toNumber(brut.entretien) ?? 0,
    assurance: toNumber(brut.assurance) ?? 0,
    decote_estimee: toNumber(brut.decote_estimee ?? brut.decote) ?? 0,
    autres: toNumber(brut.autres) ?? 0,
  };
  const total = Object.values(detail).reduce((a, b) => a + b, 0);
  return total > 0 ? detail : null;
}

function normaliserEvolution(brut) {
  if (!Array.isArray(brut)) return [];
  return brut
    .map((point) => ({
      annee: toNumber(point?.annee),
      coutCumule: toNumber(point?.cout_cumule ?? point?.coutCumule),
    }))
    .filter((p) => p.annee !== null && p.coutCumule !== null)
    .sort((a, b) => a.annee - b.annee);
}

export function normaliserResultat(brut) {
  if (!brut || typeof brut !== 'object') return null;
  const vehiculeId = brut.vehicule_id ?? brut.vehiculeId ?? brut.id;
  if (vehiculeId === undefined || vehiculeId === null) return null;

  const coutTotal = toNumber(brut.cout_total ?? brut.coutTotal);
  if (coutTotal === null) return null; // sans coût total, le résultat n'a pas de sens

  return {
    vehiculeId: String(vehiculeId),
    coutTotal,
    coutMensuel: toNumber(brut.cout_mensuel_moyen ?? brut.coutMensuel),
    coutParKm: toNumber(brut.cout_par_km ?? brut.coutParKm),
    detail: normaliserDetail(brut.detail),
    evolution: normaliserEvolution(brut.evolution_annuelle ?? brut.evolution),
  };
}

export function normaliserSimulation(brut) {
  const liste = Array.isArray(brut?.resultats)
    ? brut.resultats
    : Array.isArray(brut)
      ? brut
      : null;

  if (liste === null) throw new ApiError(CODES.FORMAT, { debug: 'Champ `resultats` absent' });

  const resultats = liste.map(normaliserResultat).filter(Boolean);
  if (resultats.length === 0) {
    throw new ApiError(CODES.FORMAT, { debug: 'Aucun résultat exploitable' });
  }

  return { resultats };
}
