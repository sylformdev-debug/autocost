import { memo } from 'react';
import { Award } from 'lucide-react';
import BadgeMotorisation from '../BadgeMotorisation/BadgeMotorisation';
import {
  formatCoutParKm,
  formatPrix,
  formatPrixMensuel,
  nomVehicule,
} from '../../utils/format';
import styles from './TableauComparatif.module.css';

/**
 * Tableau récapitulatif. Trié du moins cher au plus cher ; la ligne du
 * véhicule le plus économique est mise en évidence.
 * Sur mobile, défilement horizontal avec première colonne figée.
 */
function TableauComparatif({ resultats, region, idRecommande }) {
  const meilleur = resultats[0]?.coutTotal ?? 0;

  return (
    <div className={styles.enveloppe}>
      <table className={styles.tableau}>
        <caption className="visuellement-cache">
          Comparatif des coûts de possession, du moins cher au plus cher.
        </caption>
        <thead>
          <tr>
            <th scope="col">Véhicule</th>
            <th scope="col">Motorisation</th>
            <th scope="col" className={styles.nombre}>
              Coût total
            </th>
            <th scope="col" className={styles.nombre}>
              Coût mensuel
            </th>
            <th scope="col" className={styles.nombre}>
              Coût/km
            </th>
            <th scope="col" className={styles.nombre}>
              Écart
            </th>
          </tr>
        </thead>
        <tbody>
          {resultats.map((r) => {
            const recommande = r.vehiculeId === idRecommande;
            const ecart = r.coutTotal - meilleur;
            return (
              <tr key={r.vehiculeId} className={recommande ? styles.ligneRecommandee : ''}>
                <th scope="row" className={styles.vehicule}>
                  <span className={styles.nom}>{nomVehicule(r.vehicule)}</span>
                  {recommande ? (
                    <span className={styles.marque}>
                      <Award size={11} strokeWidth={2.2} aria-hidden="true" />
                      Le plus économique
                    </span>
                  ) : null}
                </th>
                <td>
                  <BadgeMotorisation motorisation={r.vehicule.motorisation} taille="petit" />
                </td>
                <td className={`${styles.nombre} ${styles.fort} chiffre`}>
                  {formatPrix(r.coutTotal, region)}
                </td>
                <td className={`${styles.nombre} chiffre`}>
                  {formatPrixMensuel(r.coutMensuel, region)}
                </td>
                <td className={`${styles.nombre} chiffre`}>
                  {formatCoutParKm(r.coutParKm, region)}
                </td>
                <td className={`${styles.nombre} ${styles.ecart} chiffre`}>
                  {ecart === 0 ? '—' : `+${formatPrix(ecart, region)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(TableauComparatif);
