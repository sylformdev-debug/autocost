import { History } from 'lucide-react';
import Bouton from '../Bouton/Bouton';
import { formatAnnees, formatDateHeure, formatKmParAn } from '../../utils/format';
import styles from './BanniereSession.module.css';

/** Proposition de reprise de la dernière session enregistrée localement (§22). */
export default function BanniereSession({ session, onReprendre, onIgnorer }) {
  if (!session) return null;

  const { parametres, date, resultats } = session;
  const aResultats = Array.isArray(resultats) && resultats.length > 0;

  return (
    <div className={`${styles.bloc} sans-impression`} role="region" aria-label="Session précédente">
      <History size={17} strokeWidth={1.6} className={styles.icone} aria-hidden="true" />

      <div className={styles.texte}>
        <p className={styles.titre}>
          {aResultats ? 'Reprendre votre dernière simulation ?' : 'Reprendre vos derniers paramètres ?'}
        </p>
        <p className={styles.detail}>
          {parametres.vehiculeIds.length} véhicule
          {parametres.vehiculeIds.length > 1 ? 's' : ''} · {formatAnnees(parametres.dureeAnnees)} ·{' '}
          {formatKmParAn(parametres.kilometrageAnnuel)}
          {date ? ` · ${formatDateHeure(date)}` : ''}
        </p>
      </div>

      <div className={styles.actions}>
        <Bouton variante="secondaire" taille="petit" onClick={onReprendre}>
          Reprendre
        </Bouton>
        <Bouton variante="discret" taille="petit" onClick={onIgnorer}>
          Recommencer
        </Bouton>
      </div>
    </div>
  );
}
