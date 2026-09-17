import { AlertTriangle, RefreshCw } from 'lucide-react';
import Bouton from '../Bouton/Bouton';
import styles from './MessageErreur.module.css';

/**
 * Affichage d'une erreur, intégré à l'interface (jamais une alerte navigateur,
 * jamais un message technique). Le détail technique part en console uniquement.
 */
export default function MessageErreur({ erreur, onReessayer, titre }) {
  if (!erreur) return null;

  if (import.meta.env.DEV && erreur.debug) {
    // eslint-disable-next-line no-console
    console.error('[AutoCost]', erreur.code, erreur.debug);
  }

  return (
    <div className={styles.bloc} role="alert" aria-live="assertive">
      <AlertTriangle size={20} strokeWidth={1.75} className={styles.icone} aria-hidden="true" />
      <div className={styles.texte}>
        {titre ? <p className={styles.titre}>{titre}</p> : null}
        <p className={styles.message}>{erreur.message}</p>
      </div>
      {onReessayer ? (
        <Bouton variante="secondaire" taille="petit" icone={RefreshCw} onClick={onReessayer}>
          Réessayer
        </Bouton>
      ) : null}
    </div>
  );
}
