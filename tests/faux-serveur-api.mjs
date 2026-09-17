/**
 * Serveur de test conforme au contrat du cahier des charges.
 * Sert uniquement à VÉRIFIER le provider REST de l'application — il ne fait
 * pas partie du livrable applicatif et n'est jamais importé par le front.
 *
 *   node faux-serveur-api.mjs      → écoute sur http://127.0.0.1:5055
 *
 * Préfixes disponibles :
 *   /ok      → réponses valides
 *   /err500  → erreur serveur
 *   /err404  → véhicule introuvable
 *   /lent    → réponse différée de 5 s (test du timeout)
 *   /casse   → JSON syntaxiquement valide mais hors contrat
 *   /orphelin → simulation renvoyant un résultat pour un véhicule absent du catalogue
 *   /vide     → catalogue vide
 *   /partiel  → données incomplètes : champs nuls, résultat sans `detail`,
 *               résultat sans `evolution_annuelle`
 *   /nocors   → réponses valides mais SANS en-tête CORS (bloqué par le navigateur)
 */
import { createServer } from 'node:http';

const VEHICULES = [
  {
    id: 'api_001',
    marque: 'Renault',
    modele: 'Clio',
    motorisation: 'essence',
    prix_achat: 21000,
    consommation_moyenne: 5.5,
    annee: 2025,
  },
  {
    id: 'api_002',
    marque: 'Renault',
    modele: 'Megane E-Tech',
    motorisation: 'electrique',
    prix_achat: 35000,
    consommation_moyenne: 16.5,
    annee: 2025,
  },
  {
    id: 'api_003',
    marque: 'Peugeot',
    modele: '208',
    motorisation: 'essence',
    prix_achat: 22400,
    consommation_moyenne: 5.3,
    annee: 2025,
  },
];

const simulation = (ids, km, duree) => ({
  resultats: ids.map((id, i) => {
    const total = 28450 + i * 3200 + km * 0.02 * duree;
    return {
      vehicule_id: id,
      cout_total: Math.round(total),
      cout_mensuel_moyen: Math.round(total / (duree * 12)),
      cout_par_km: Number((total / (km * duree)).toFixed(2)),
      detail: {
        carburant: Math.round(total * 0.22),
        entretien: Math.round(total * 0.11),
        assurance: Math.round(total * 0.18),
        decote_estimee: Math.round(total * 0.3),
        autres: Math.round(total * 0.19),
      },
      evolution_annuelle: Array.from({ length: duree }, (_, a) => ({
        annee: a + 1,
        cout_cumule: Math.round((total / duree) * (a + 1)),
      })),
    };
  }),
});

const json = (res, code, corps, { cors = true } = {}) => {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    ...(cors
      ? {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        }
      : {}),
  });
  res.end(JSON.stringify(corps));
};

/** Catalogue volontairement lacunaire : champs nuls, absents ou mal typés. */
const VEHICULES_PARTIELS = [
  {
    id: 'part_001',
    marque: 'Renault',
    modele: 'Clio',
    motorisation: 'essence',
    prix_achat: null,
    consommation_moyenne: 5.5,
    // Fichier absent : doit retomber sur l'illustration, sans image cassée.
    image: '/vehicules/fichier-absent.webp',
  },
  {
    id: 'part_002',
    marque: null,
    modele: 'Modèle sans marque',
    motorisation: 'inconnue',
    prix_achat: '22400',
    consommation_moyenne: null,
    annee: null,
    // URL hostile : doit être rejetée par la normalisation.
    image: 'javascript:alert(document.domain)',
  },
  {
    id: 'part_003',
    marque: 'Peugeot',
    modele: '208',
    motorisation: 'electrique',
    prix_achat: 22400,
    consommation_moyenne: 15.1,
    annee: 2025,
  },
];

/** Résultats incomplets : sans détail, sans évolution, avec des valeurs nulles. */
const simulationPartielle = (ids) => ({
  resultats: ids.map((id, i) => {
    if (i === 0) {
      // Pas de `detail` du tout
      return {
        vehicule_id: id,
        cout_total: 28450,
        cout_mensuel_moyen: null,
        cout_par_km: 0.38,
        evolution_annuelle: [
          { annee: 1, cout_cumule: 9200 },
          { annee: 2, cout_cumule: 14800 },
        ],
      };
    }
    if (i === 1) {
      // Pas d'`evolution_annuelle`
      return {
        vehicule_id: id,
        cout_total: 31200,
        cout_mensuel_moyen: 520,
        cout_par_km: null,
        detail: {
          carburant: 6200,
          entretien: null,
          assurance: 5200,
          decote_estimee: 8500,
          autres: 5450,
        },
      };
    }
    return { vehicule_id: id, cout_total: 33000 };
  }),
});

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});

  const url = new URL(req.url, 'http://x');
  const [, prefixe, ...reste] = url.pathname.split('/');
  const chemin = `/${reste.join('/')}`;

  const cors = prefixe !== 'nocors';

  if (prefixe === 'err500') return json(res, 500, { message: 'boom' });
  if (prefixe === 'err404') return json(res, 404, { message: 'not found' });
  if (prefixe === 'casse') return json(res, 200, { inattendu: true });
  if (prefixe === 'lent') await new Promise((r) => setTimeout(r, 5000));

  if (req.method === 'GET' && chemin === '/vehicules') {
    if (prefixe === 'vide') return json(res, 200, []);
    if (prefixe === 'partiel') return json(res, 200, VEHICULES_PARTIELS);
    return json(res, 200, VEHICULES, { cors });
  }

  if (req.method === 'GET' && chemin.startsWith('/vehicules/')) {
    const id = decodeURIComponent(chemin.split('/')[2]);
    const v = VEHICULES.find((x) => x.id === id);
    return v ? json(res, 200, v) : json(res, 404, { message: 'introuvable' });
  }

  if (req.method === 'POST' && chemin === '/simulation') {
    let brut = '';
    for await (const morceau of req) brut += morceau;
    let corps;
    try {
      corps = JSON.parse(brut);
    } catch {
      return json(res, 400, { message: 'json invalide' });
    }
    const ids = Array.isArray(corps.vehicule_ids) ? corps.vehicule_ids : [];
    if (ids.length === 0) return json(res, 400, { message: 'vehicule_ids requis' });

    // Le scénario « partiel » a son propre catalogue : il est traité avant la
    // recherche dans le catalogue nominal.
    if (prefixe === 'partiel') return json(res, 200, simulationPartielle(ids));

    const connus = ids.filter((id) => VEHICULES.some((v) => v.id === id));
    if (connus.length === 0) return json(res, 404, { message: 'aucun véhicule' });

    const rendus =
      prefixe === 'orphelin' ? [...connus, 'api_inconnu_999'] : connus;
    return json(
      res,
      200,
      simulation(rendus, Number(corps.kilometrage_annuel), Number(corps.duree_annees)),
    );
  }

  return json(res, 404, { message: 'route inconnue' });
}).listen(5055, '127.0.0.1', () => {
  console.log('Faux serveur API prêt sur http://127.0.0.1:5055');
});
