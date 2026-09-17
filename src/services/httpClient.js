import { CONFIG } from './config';
import { ApiError, CODES, codeFromStatus, toApiError } from './errors';

/**
 * Client HTTP minimal : timeout, annulation, normalisation des erreurs.
 * C'est le SEUL endroit du projet qui appelle `fetch`.
 */
export async function request(chemin, { method = 'GET', body, signal } = {}) {
  if (!CONFIG.apiUrl) {
    throw new ApiError(CODES.NETWORK, { debug: 'VITE_API_URL non configurée' });
  }

  // Appelant déjà annulé (composant démonté entre-temps) : `addEventListener`
  // ne se déclencherait jamais et la requête partirait pour rien.
  if (signal?.aborted) {
    const annulee = new Error('cancelled');
    annulee.name = 'CancelledError';
    throw annulee;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeout);

  // Le signal appelant (démontage du composant) doit aussi annuler la requête.
  const onAbortExterne = () => controller.abort();
  signal?.addEventListener('abort', onAbortExterne);

  try {
    const response = await fetch(`${CONFIG.apiUrl}${chemin}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw new ApiError(codeFromStatus(response.status), {
        status: response.status,
        debug: `${method} ${chemin} → ${response.status}`,
      });
    }

    if (response.status === 204) return null;

    try {
      return await response.json();
    } catch (parseError) {
      throw new ApiError(CODES.FORMAT, { debug: parseError.message });
    }
  } catch (error) {
    // Annulation volontaire par l'appelant : ce n'est pas une erreur à afficher.
    if (error?.name === 'AbortError' && signal?.aborted) {
      const cancelled = new Error('cancelled');
      cancelled.name = 'CancelledError';
      throw cancelled;
    }
    throw toApiError(error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbortExterne);
  }
}
