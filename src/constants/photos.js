/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  VOS IMAGES — C'EST LE SEUL FICHIER À MODIFIER.                          ║
 * ║                                                                          ║
 * ║  1. PHOTO_ACCUEIL : la grande image de la page d'accueil                 ║
 * ║  2. PHOTOS        : une photo par véhicule                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Mode d'emploi
 * -------------
 * 1. Déposez vos images dans  public/vehicules/
 * 2. Décommentez la ligne du véhicule concerné et mettez le nom de VOTRE
 *    fichier. Le chemin commence par « / » et ne contient PAS « public ».
 *
 *        'veh_001': '/vehicules/clio.webp',
 *
 * 3. Enregistrez. En `npm run dev`, la page se met à jour toute seule.
 *
 * Tout véhicule laissé en commentaire garde l'illustration vectorielle : vous
 * pouvez n'ajouter que deux ou trois photos, l'application reste cohérente.
 * Une photo introuvable retombe aussi sur l'illustration — rien ne casse.
 *
 * Droits : n'utilisez que des images dont vous avez le droit de vous servir
 * (vos propres photos, ou une licence qui l'autorise explicitement). Les photos
 * de presse des constructeurs ne le permettent en général pas.
 * Détails et conseils de format : public/vehicules/LISEZMOI.md
 */
/* ═══════════════════════════════════════════════════════════════════════════
 * 1. IMAGE DE LA PAGE D'ACCUEIL
 *
 * Remplacez `null` par le chemin de votre image :
 *
 *      export const PHOTO_ACCUEIL = '/accueil.webp';
 *
 * Le fichier va dans  public/  (donc  public/accueil.webp ).
 * Laissez `null` pour garder l'illustration vectorielle actuelle.
 *
 * Format conseillé : 1200 × 570 px, WebP, moins de 150 ko. Le cadre est en
 * 21/10 et recadre au centre — une photo large, véhicule centré, fonctionne
 * mieux qu'une photo verticale.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const PHOTO_ACCUEIL = '/accueil.png';

/* ═══════════════════════════════════════════════════════════════════════════
 * 2. PHOTOS DES VÉHICULES
 * ═══════════════════════════════════════════════════════════════════════════ */
export const PHOTOS = {
  // ——— Renault ———
   'veh_001': '/vehicules/p1.png',                 // Renault Clio
   'veh_002': '/vehicules/p2.png',         // Renault Mégane E-Tech
   'veh_018': '/vehicules/p3.png',              // Renault Austral E-Tech

  // ——— Peugeot ———
  'veh_003': '/vehicules/p4.png',                  // Peugeot 208
   'veh_004': '/vehicules/p5.png',                 // Peugeot 3008 Hybrid

  // ——— Dacia ———
   'veh_005': '/vehicules/p6.png',                // Dacia Sandero
   'veh_006': '/vehicules/p7.png',                 // Dacia Spring

  // ——— Toyota ———
  'veh_007': '/vehicules/p8.png',                 // Toyota Yaris Hybride
  'veh_008': '/vehicules/p9.png',            // Toyota Corolla Touring Sports

  // ——— Volkswagen ———
   'veh_009': '/vehicules/p10.png',              // Volkswagen Golf TDI
   'veh_010': '/vehicules/p11.png',               // Volkswagen ID.3

  // ——— Autres marques ———
   'veh_011': '/vehicules/p1.png',                // Tesla Model 3
   'veh_012': '/vehicules/p2.png',          // Citroën C3 Aircross
   'veh_013': '/vehicules/p3.png',                  // BMW Série 1 118d
   'veh_014': '/vehicules/p4.png',                  // Kia Niro EV
   'veh_015': '/vehicules/p5.png',               // Hyundai Tucson Hybrid
   'veh_016': '/vehicules/p6.png',                    // Fiat 500e
  'veh_017': '/vehicules/p6.png',                // Škoda Octavia Combi TDI
};

/* ─────────────────────────────────────────────────────────────────────────
 * Ce qui suit fait le branchement. Vous n'avez pas besoin d'y toucher.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Une photo déclarée ici prend le pas sur celle que fournirait l'API : c'est un
 * choix explicite de votre part, il doit gagner.
 */
export function avecPhoto(vehicule) {
  if (!vehicule) return vehicule;
  const locale = PHOTOS[vehicule.id];
  return locale ? { ...vehicule, image: locale } : vehicule;
}

export function avecPhotos(vehicules) {
  return Array.isArray(vehicules) ? vehicules.map(avecPhoto) : vehicules;
}
