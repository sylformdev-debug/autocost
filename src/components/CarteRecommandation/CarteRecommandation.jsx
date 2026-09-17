import { memo } from 'react';
import { Award } from 'lucide-react';
import {
  formatCoutParKm,
  formatKmParAn,
  formatPrix,
  formatPrixMensuel,
  formatAnnees,
  nomVehicule,
} from '../../utils/format';
import styles from './CarteRecommandation.module.css';

/**
 * Recommandation automatique (§21).
 * Elle découle uniquement des chiffres retournés par la simulation : le
 * véhicule au coût total le plus faible. Rien n'est extrapolé.
 */
function CarteRecommandation({ recommandation, second, parametres }) {
  if (!recommandation?.vehicule) return null;

  const { vehicule, coutTotal, coutMensuel, coutParKm } = recommandation;
  const { region, kilometrageAnnuel, dureeAnnees } = parametres;
  const economie = second ? second.coutTotal - coutTotal : null;

  return (
    <section className={`${styles.bloc} apparait`} aria-labelledby="titre-recommandation">
      <div className={styles.entete}>
        <span className={styles.etiquette}>
          <Award size={13} strokeWidth={2} aria-hidden="true" />
          Notre recommandation
        </span>
      </div>

      <div className={styles.corps}>
        <div className={styles.principal}>
          <h3 id="titre-recommandation" className={styles.nom}>
            {nomVehicule(vehicule)}
          </h3>
          <p className={styles.explication}>
            Sur la base d’un usage de {formatKmParAn(kilometrageAnnuel)} pendant{' '}
            {formatAnnees(dureeAnnees)}, ce véhicule présente le coût total de possession le plus
            faible de votre comparatif
            {economie > 0 ? (
              <>
                , avec <strong className="chiffre">{formatPrix(economie, region)}</strong> de moins
                que le suivant
              </>
            ) : null}
            .
          </p>
        </div>

        <dl className={styles.chiffres}>
          <div>
            <dt>Coût total</dt>
            <dd className={`${styles.valeurForte} chiffre`}>{formatPrix(coutTotal, region)}</dd>
          </div>
          <div>
            <dt>Par mois</dt>
            <dd className="chiffre">{formatPrixMensuel(coutMensuel, region)}</dd>
          </div>
          <div>
            <dt>Par kilomètre</dt>
            <dd className="chiffre">{formatCoutParKm(coutParKm, region)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export default memo(CarteRecommandation);
