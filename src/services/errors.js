/**
 * Erreurs applicatives.
 *
 * Règle : aucun composant n'affiche jamais un message technique brut.
 * Le réseau produit une `ApiError` porteuse d'un message déjà rédigé pour
 * l'utilisateur ; le détail technique reste dans `debug` (console uniquement).
 */

export const CODES = {
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  FORMAT: 'FORMAT',
  UNKNOWN: 'UNKNOWN',
};

export const MESSAGES = {
  [CODES.VALIDATION]: 'Les paramètres renseignés sont invalides.',
  [CODES.NOT_FOUND]: 'Le véhicule sélectionné est introuvable.',
  [CODES.SERVER]: 'Une erreur est survenue sur le serveur. Veuillez réessayer.',
  [CODES.NETWORK]:
    'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.',
  [CODES.TIMEOUT]:
    'Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez.',
  [CODES.FORMAT]:
    'La réponse du serveur est inexploitable. Réessayez dans quelques instants.',
  [CODES.UNKNOWN]: 'Une erreur inattendue est survenue. Veuillez réessayer.',
};

export class ApiError extends Error {
  constructor(code, { status = null, debug = null, retryable = true } = {}) {
    const resolvedCode = MESSAGES[code] ? code : CODES.UNKNOWN;
    super(MESSAGES[resolvedCode]);
    this.name = 'ApiError';
    this.code = resolvedCode;
    this.status = status;
    this.debug = debug;
    this.retryable = retryable;
  }
}

/** Traduit un statut HTTP en code applicatif (§8 du cahier des charges). */
export function codeFromStatus(status) {
  if (status === 400 || status === 422) return CODES.VALIDATION;
  if (status === 404) return CODES.NOT_FOUND;
  if (status === 408 || status === 504) return CODES.TIMEOUT;
  if (status >= 500) return CODES.SERVER;
  if (status === 401 || status === 403) return CODES.SERVER;
  return CODES.UNKNOWN;
}

/** Garantit qu'une valeur remontée d'un `catch` est toujours une ApiError. */
export function toApiError(error) {
  if (error instanceof ApiError) return error;
  if (error?.name === 'AbortError') {
    return new ApiError(CODES.TIMEOUT, { debug: error.message });
  }
  if (error instanceof TypeError) {
    return new ApiError(CODES.NETWORK, { debug: error.message });
  }
  return new ApiError(CODES.UNKNOWN, { debug: error?.message ?? String(error) });
}
