import { getRegion } from '../../constants/regions';

/**
 * Moteur de calcul du coût total de possession (TCO).
 *
 * Il n'existe QUE pour le provider mock : quand l'API réelle est branchée,
 * c'est elle qui calcule, et ce fichier n'est jamais exécuté.
 *
 * Hypothèses assumées (documentées dans le README) :
 *  - consommation homologuée corrigée d'un facteur d'usage réel ;
 *  - décote par courbe de rétention annuelle, aggravée par un fort kilométrage ;
 *  - entretien et assurance dépendants de la motorisation, du prix et de l'âge.
 */

const ANNEE_REFERENCE = 2026;

/** Écart entre consommation homologuée et consommation réelle (pertes de charge incluses pour l'électrique). */
const FACTEUR_USAGE_REEL = {
  essence: 1.15,
  diesel: 1.12,
  hybride: 1.18,
  electrique: 1.14,
};

const PROFILS = {
  essence: {
    entretienBase: 340,
    entretienParKm: 0.031,
    assuranceBase: 372,
    assuranceTaux: 0.0105,
    pneusParKm: 0.0115,
    retention: [0.8, 0.86, 0.88, 0.89, 0.9],
  },
  diesel: {
    entretienBase: 395,
    entretienParKm: 0.034,
    assuranceBase: 388,
    assuranceTaux: 0.0102,
    pneusParKm: 0.0121,
    retention: [0.78, 0.85, 0.87, 0.88, 0.89],
  },
  hybride: {
    entretienBase: 305,
    entretienParKm: 0.026,
    assuranceBase: 398,
    assuranceTaux: 0.0108,
    pneusParKm: 0.0124,
    retention: [0.82, 0.88, 0.89, 0.9, 0.91],
  },
  electrique: {
    entretienBase: 195,
    entretienParKm: 0.017,
    assuranceBase: 425,
    assuranceTaux: 0.0112,
    pneusParKm: 0.0146,
    retention: [0.74, 0.84, 0.86, 0.88, 0.89],
  },
};

const FRAIS_DIVERS_ANNUELS = 96; // lavage, petits accessoires, menus consommables
const CONTROLE_TECHNIQUE = 86; // à partir de 4 ans, puis tous les 2 ans
const VALEUR_RESIDUELLE_PLANCHER = 0.07;
const RENDEMENT_RECHARGE = 0.9; // pertes entre la prise et la batterie

const profil = (motorisation) => PROFILS[motorisation] ?? PROFILS.essence;

const arrondir = (n) => Math.round(n);

/** Facteur de rétention de l'année `i` (1-indexée), dégradé par le kilométrage. */
function retentionAnnuelle(motorisation, i, kilometrageAnnuel) {
  const courbe = profil(motorisation).retention;
  const base = courbe[Math.min(i, courbe.length) - 1];
  const malusKm = Math.max(0, kilometrageAnnuel - 15000) / 1_000_000;
  return Math.max(0.6, base - malusKm);
}

/** Valeur résiduelle après `n` années, plancher inclus. */
function valeurResiduelle(prixAchat, motorisation, n, kilometrageAnnuel) {
  let valeur = prixAchat;
  for (let i = 1; i <= n; i += 1) {
    valeur *= retentionAnnuelle(motorisation, i, kilometrageAnnuel);
  }
  return Math.max(valeur, prixAchat * VALEUR_RESIDUELLE_PLANCHER);
}

function coutEnergieAnnuel(vehicule, region) {
  const { motorisation, consommation } = vehicule;
  if (!consommation || consommation <= 0) return 0;
  const facteur = FACTEUR_USAGE_REEL[motorisation] ?? 1.15;
  const consoReelle = (consommation * facteur) / 100; // par km

  if (motorisation === 'electrique') {
    return (consoReelle / RENDEMENT_RECHARGE) * region.prixElectricite;
  }
  const prixLitre =
    motorisation === 'diesel' ? region.prixCarburant.diesel : region.prixCarburant.essence;
  return consoReelle * prixLitre;
}

/**
 * Calcule le TCO d'un véhicule.
 * @returns un résultat au format EXACT du cahier des charges (snake_case),
 *          pour qu'il traverse les mêmes normalisateurs que l'API réelle.
 */
export function calculerTCO(vehicule, { kilometrageAnnuel, dureeAnnees, region: codeRegion }) {
  const region = getRegion(codeRegion);
  const p = profil(vehicule.motorisation);
  const prixAchat = vehicule.prixAchat ?? 0;
  const ageInitial = Math.max(0, ANNEE_REFERENCE - (vehicule.annee ?? ANNEE_REFERENCE));

  const energieParKm = coutEnergieAnnuel(vehicule, region);

  let carburant = 0;
  let entretien = 0;
  let assurance = 0;
  let autres = 0;
  let cumul = 0;
  const evolution = [];

  for (let i = 1; i <= dureeAnnees; i += 1) {
    const age = ageInitial + i;

    const carburantAnnee = energieParKm * kilometrageAnnuel;

    const facteurVieillissement = 1 + 0.06 * (age - 1);
    const entretienAnnee =
      (p.entretienBase + p.entretienParKm * kilometrageAnnuel) *
      facteurVieillissement *
      region.coefEntretien;

    const decoteAssurance = Math.max(0.72, 0.97 ** (i - 1));
    const assuranceAnnee =
      (p.assuranceBase + prixAchat * p.assuranceTaux) * decoteAssurance * region.coefAssurance;

    let autresAnnee = FRAIS_DIVERS_ANNUELS + p.pneusParKm * kilometrageAnnuel;
    if (i === 1) autresAnnee += region.carteGrise;
    if (age >= 4 && (age - 4) % 2 === 0) autresAnnee += CONTROLE_TECHNIQUE;

    const decoteAnnee =
      valeurResiduelle(prixAchat, vehicule.motorisation, i - 1, kilometrageAnnuel) -
      valeurResiduelle(prixAchat, vehicule.motorisation, i, kilometrageAnnuel);

    carburant += carburantAnnee;
    entretien += entretienAnnee;
    assurance += assuranceAnnee;
    autres += autresAnnee;

    cumul += carburantAnnee + entretienAnnee + assuranceAnnee + autresAnnee + decoteAnnee;
    evolution.push({ annee: i, cout_cumule: arrondir(cumul) });
  }

  const decote =
    prixAchat - valeurResiduelle(prixAchat, vehicule.motorisation, dureeAnnees, kilometrageAnnuel);
  const coutTotal = carburant + entretien + assurance + autres + decote;
  const kmTotal = kilometrageAnnuel * dureeAnnees;

  return {
    vehicule_id: vehicule.id,
    cout_total: arrondir(coutTotal),
    cout_mensuel_moyen: arrondir(coutTotal / (dureeAnnees * 12)),
    cout_par_km: kmTotal > 0 ? Number((coutTotal / kmTotal).toFixed(2)) : 0,
    detail: {
      carburant: arrondir(carburant),
      entretien: arrondir(entretien),
      assurance: arrondir(assurance),
      decote_estimee: arrondir(decote),
      autres: arrondir(autres),
    },
    evolution_annuelle: evolution,
  };
}
