import { memo, useId } from 'react';
import { Check, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BadgeMotorisation from '../BadgeMotorisation/BadgeMotorisation';
import VisuelVehicule from '../VisuelVehicule/VisuelVehicule';
import { formatConsommation, formatPrix, nomVehicule } from '../../utils/format';
import { getMotorisation } from '../../constants/simulation';
import styles from './CarteVehicule.module.css';

/**
 * Carte de sélection d'un véhicule.
 *
 * Accessibilité : la carte repose sur une vraie case à cocher masquée
 * visuellement. Elle est donc cochable au clavier, annoncée correctement par
 * les lecteurs d'écran, et le lien « Détails » reste une cible distincte.
 */
function CarteVehicule({ vehicule, selectionne, desactive, onBasculer, region }) {
  const id = useId();
  const { unite } = getMotorisation(vehicule.motorisation);
  const nom = nomVehicule(vehicule);

  return (
    <article
      className={`${styles.carte} ${selectionne ? styles.selectionnee : ''} ${
        desactive ? styles.desactivee : ''
      }`}
    >
      <input
        type="checkbox"
        id={id}
        className="visuellement-cache"
        checked={selectionne}
        disabled={desactive}
        onChange={() => onBasculer(vehicule.id)}
      />

      <VisuelVehicule vehicule={vehicule} />

      <label htmlFor={id} className={styles.zone}>
        <span className="visuellement-cache">
          {selectionne ? `Retirer ${nom} de la comparaison` : `Ajouter ${nom} à la comparaison`}
        </span>

        <span className={styles.marque}>{vehicule.marque}</span>
        <h3 className={styles.modele}>{vehicule.modele}</h3>

        <span className={styles.meta}>
          <BadgeMotorisation motorisation={vehicule.motorisation} taille="petit" />
          {vehicule.annee ? <span className={styles.annee}>{vehicule.annee}</span> : null}
          {vehicule.segment ? <span className={styles.annee}>{vehicule.segment}</span> : null}
        </span>

        <span className={styles.chiffres}>
          <span className={styles.chiffre}>
            <span className={styles.label}>Prix d’achat</span>
            <strong className="chiffre">{formatPrix(vehicule.prixAchat, region)}</strong>
          </span>
          <span className={styles.chiffre}>
            <span className={styles.label}>Consommation</span>
            <strong className="chiffre">
              {formatConsommation(vehicule.consommation, unite)}
            </strong>
          </span>
        </span>

        <span className={styles.coche} aria-hidden="true">
          <Check size={13} strokeWidth={2.6} />
        </span>
      </label>

      <Link
        to={`/vehicule/${vehicule.id}`}
        className={styles.lienDetail}
        aria-label={`Voir la fiche détaillée de ${nom}`}
      >
        Détails
        <ArrowUpRight size={13} strokeWidth={1.9} aria-hidden="true" />
      </Link>
    </article>
  );
}

export default memo(CarteVehicule);
