/**
 * Silhouettes de véhicules — dessins vectoriels ORIGINAUX.
 *
 * Aucune photographie ni logo de constructeur n'est utilisé : ce sont des
 * profils génériques par segment, qui ne représentent aucun modèle réel.
 * C'est un choix assumé — les photos de véhicules de marque appartiennent aux
 * constructeurs ou à leurs photographes et ne peuvent pas être embarquées dans
 * un site public. Voir `public/vehicules/LISEZMOI.md` pour ajouter vos propres
 * images sous licence.
 *
 * Repère commun (viewBox 0 0 208 92), avant du véhicule à droite :
 *  - bas de caisse  y = 72
 *  - roue arrière   (56, 70)  ·  roue avant (156, 70)  ·  rayon 14
 *
 * Chaque profil ne décrit que sa ligne HAUTE, du pare-chocs arrière au
 * pare-chocs avant. Le bas — identique pour tous — est ajouté par `BAS` : il
 * remonte en arc au-dessus de chaque roue, et ce sont ces passages de roue qui
 * font lire un dessin comme une voiture plutôt que comme une boîte.
 */

const Y_BAS = 72;
const CY_ROUE = 70;

/** Train roulant par segment : un SUV chausse plus grand qu'une citadine. */
export const ROUES = {
  citadine: { r: 13, arriere: 54, avant: 152, xArriere: 14 },
  compacte: { r: 14, arriere: 56, avant: 156, xArriere: 14 },
  berline: { r: 14, arriere: 54, avant: 160, xArriere: 12 },
  break: { r: 14, arriere: 54, avant: 160, xArriere: 12 },
  suv: { r: 16, arriere: 56, avant: 156, xArriere: 16 },
};

export const CY = CY_ROUE;

/**
 * Bas de caisse : pare-chocs avant → passage de roue avant → longeron →
 * passage de roue arrière → pare-chocs arrière. Généré pour que le rayon des
 * arcs suive toujours celui des roues.
 */
const bas = ({ r, arriere, avant, xArriere }) => {
  const a = r + 5; // le passage déborde légèrement du pneu
  return (
    ` L ${avant + a} ${Y_BAS} A ${a} ${a} 0 0 0 ${avant - a} ${Y_BAS}` +
    ` L ${arriere + a} ${Y_BAS} A ${a} ${a} 0 0 0 ${arriere - a} ${Y_BAS}` +
    ` L ${xArriere} ${Y_BAS} Z`
  );
};

/** Lignes hautes, du segment le plus court au plus haut. */
const HAUTS = {
  citadine:
    'M 14 72 L 14 50 C 14 43 17 39 23 37 L 44 32 C 46 24 51 20 58 20 ' +
    'L 104 20 C 110 20 114 22 117 26 L 131 42 L 172 46 C 183 47 189 52 190 60 L 191 72',

  compacte:
    'M 14 72 L 14 52 C 14 45 17 41 23 39 L 46 32 C 49 24 54 20 61 20 ' +
    'L 112 20 C 118 20 122 22 125 26 L 139 41 L 176 46 C 187 47 192 52 193 60 L 194 72',

  // Trois volumes : coffre marqué, capot long, pavillon bas.
  berline:
    'M 12 72 L 12 54 C 12 47 15 43 21 41 L 50 36 L 58 22 C 60 19 64 18 68 18 ' +
    'L 114 18 C 120 18 124 20 127 24 L 142 38 L 180 44 C 191 45 196 50 197 58 L 198 72',

  // Pavillon long et plat jusqu'au hayon, quasi vertical.
  break:
    'M 12 72 L 12 52 C 12 45 15 41 20 39 L 21 23 C 22 19 25 17 29 17 ' +
    'L 114 17 C 120 17 124 19 127 23 L 142 37 L 180 43 C 191 44 196 49 197 57 L 198 72',

  // Caisse haute, vitrage relevé, capot plus court.
  suv: 'M 16 72 L 16 44 C 16 36 19 31 26 29 L 50 23 C 53 15 58 11 66 11 ' +
    'L 114 11 C 120 11 125 13 128 17 L 142 30 L 174 36 C 185 38 191 43 192 52 L 193 72',
};

export const PROFILS = Object.fromEntries(
  Object.entries(HAUTS).map(([nom, haut]) => [nom, haut + bas(ROUES[nom])]),
);

/** Vitrage, séparé pour garder la ligne de caisse lisible. */
export const VITRAGES = {
  citadine: 'M 50 38 L 59 23 L 102 23 L 115 38 Z',
  compacte: 'M 52 37 L 62 23 L 110 23 L 123 37 Z',
  berline: 'M 56 35 L 69 21 L 112 21 L 125 36 Z',
  break: 'M 26 35 L 27 20 L 112 20 L 125 35 Z',
  suv: 'M 52 28 L 67 14 L 112 14 L 126 28 Z',
};

/** Montant central : sépare le vitrage en deux ouvertures (x, y haut, y bas). */
export const MONTANTS = {
  citadine: { x: 82, haut: 23, bas: 38 },
  compacte: { x: 86, haut: 23, bas: 37 },
  berline: { x: 88, haut: 21, bas: 35 },
  break: { x: 72, haut: 20, bas: 35 },
  suv: { x: 88, haut: 14, bas: 28 },
};

/** Le segment vient de l'API : on le ramène à l'une des cinq familles connues. */
export function profilDepuisSegment(segment) {
  const s = String(segment ?? '').trim().toLowerCase();
  if (s.includes('suv') || s.includes('crossover') || s.includes('4x4')) return 'suv';
  if (s.includes('break') || s.includes('touring') || s.includes('estate')) return 'break';
  if (s.includes('berline') || s.includes('sedan')) return 'berline';
  if (s.includes('citadine') || s.includes('urbaine') || s.includes('mini')) return 'citadine';
  return 'compacte';
}
