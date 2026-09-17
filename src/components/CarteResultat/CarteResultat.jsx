import { memo } from 'react';
import { Award } from 'lucide-react';
import BadgeMotorisation from '../BadgeMotorisation/BadgeMotorisation';
import {
  formatCoutParKm,
  formatPrix,
  formatPrixMensuel,
  nomVehicule,
} from '../../utils/format';
import styles from './CarteResultat.module.css';

/**
 * Résultat d'un véhicule. La carte du véhicule recommandé se distingue par un
 * filet or et une mention — pas par une couleur de fond criarde.
 */
function CarteResultat({ resultat, region, estRecommande, ecart }) {
  const { vehicule, coutTotal, coutMensuel, coutParKm } = resultat;

  return (
    <article className={`${styles.carte} ${estRecommande ? styles.recommande : ''}`}>
      <header className={styles.entete}>
        <div className={styles.identite}>
          <span className={styles.marque}>{vehicule.marque}</span>
          <h3 className={styles.modele}>{vehicule.modele}</h3>
        </div>
        <BadgeMotorisation motorisation={vehicule.motorisation} taille="petit" />
      </header>

      {estRecommande ? (
        <p className={styles.mention}>
          <Award size={13} strokeWidth={2} aria-hidden="true" />
          Le plus économique
        </p>
      ) : ecart > 0 ? (
        <p className={styles.ecart}>
          <span className="chiffre">+{formatPrix(ecart, region)}</span> par rapport au meilleur
        </p>
      ) : null}

      <p className={styles.total}>
        <span className={`${styles.totalValeur} chiffre`}>{formatPrix(coutTotal, region)}</span>
        <span className={styles.totalLabel}>coût total de possession</span>
      </p>

      <dl className={styles.details}>
        <div>
          <dt>Coût mensuel</dt>
          <dd className="chiffre">{formatPrixMensuel(coutMensuel, region)}</dd>
        </div>
        <div>
          <dt>Coût kilométrique</dt>
          <dd className="chiffre">{formatCoutParKm(coutParKm, region)}</dd>
        </div>
      </dl>

      <span className="visuellement-cache">
        {nomVehicule(vehicule)} : coût total {formatPrix(coutTotal, region)}.
      </span>
    </article>
  );
}

export default memo(CarteResultat);
