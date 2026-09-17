import { Info, X } from 'lucide-react';
import styles from './Avertissement.module.css';

/** Information non bloquante : l'utilisateur peut continuer. */
export default function Avertissement({ children, onFermer, ton = 'alerte' }) {
  return (
    <div className={`${styles.bloc} ${styles[ton]}`} role="status">
      <Info size={16} strokeWidth={1.75} className={styles.icone} aria-hidden="true" />
      <p className={styles.texte}>{children}</p>
      {onFermer ? (
        <button
          type="button"
          className={styles.fermer}
          onClick={onFermer}
          aria-label="Masquer cet avertissement"
        >
          <X size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
