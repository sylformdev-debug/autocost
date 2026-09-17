/**
 * Configuration de la source de données.
 *
 * Le choix se fait UNIQUEMENT par variables d'environnement Vite : aucun
 * composant React ne connaît ni l'URL de l'API, ni le provider utilisé.
 *
 *   VITE_DATA_SOURCE = mock | rest
 *   VITE_API_URL     = base de l'API REST (requise si VITE_DATA_SOURCE=rest)
 *   VITE_API_TIMEOUT = délai maximal d'une requête, en ms (défaut 12000)
 *
 * Voir .env.example et la section « API » du README.
 */

const env = import.meta.env ?? {};

const SOURCES = { MOCK: 'mock', REST: 'rest' };

const rawSource = String(env.VITE_DATA_SOURCE ?? '').trim().toLowerCase();
const rawApiUrl = String(env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
const rawTimeout = Number(env.VITE_API_TIMEOUT);

/**
 * Le mock est le défaut explicite. On ne bascule sur l'API réelle que si elle
 * est demandée ET qu'une URL est fournie — basculer sans URL produirait des
 * requêtes vers des chemins relatifs et une fausse impression de panne réseau.
 */
const sourceDemandee = rawSource === SOURCES.REST ? SOURCES.REST : SOURCES.MOCK;
const restUtilisable = sourceDemandee === SOURCES.REST && rawApiUrl.length > 0;

export const CONFIG = {
  source: restUtilisable ? SOURCES.REST : SOURCES.MOCK,
  apiUrl: rawApiUrl || null,
  timeout: Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 12000,
  /** Vrai si `rest` a été demandé mais qu'aucune URL n'est configurée. */
  restMalConfigure: sourceDemandee === SOURCES.REST && !restUtilisable,
};

export const SOURCE = SOURCES;
export const utiliseMock = () => CONFIG.source === SOURCES.MOCK;

/** Libellé affiché dans l'interface — l'utilisateur sait toujours d'où viennent les chiffres. */
export const LIBELLE_SOURCE = utiliseMock()
  ? 'Jeu de données de démonstration'
  : 'API connectée';

if (CONFIG.restMalConfigure) {
  // eslint-disable-next-line no-console
  console.warn(
    '[AutoCost] VITE_DATA_SOURCE=rest mais VITE_API_URL est vide : ' +
      'retour au jeu de données de démonstration.',
  );
}
