import { memo } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import Bouton from '../Bouton/Bouton';
import { Indicateur } from '../EtatChargement/EtatChargement';
import { getRegion } from '../../constants/regions';
import { formatAnnees, formatDateHeure, formatKmParAn } from '../../utils/format';
import styles from './SyntheseResultats.module.css';

/**
 * En-tête de la zone de résultats : rappel des paramètres réellement utilisés
 * pour le calcul affiché (et non des paramètres en cours de modification).
 */
function SyntheseResultats({
  nombreVehicules,
  parametres,
  date,
  recalculEnCours,
  onExporter,
  onReinitialiser,
}) {
  const region = getRegion(parametres.region);

  return (
    <header className={styles.bloc}>
      <div className={styles.titreZone}>
        <h2 className={styles.titre}>Votre comparatif</h2>
        {recalculEnCours ? (
          <span className={styles.recalcul}>
            <Indicateur label="Mise à jour de la simulation" />
            Mise à jour…
          </span>
        ) : null}
      </div>

      <dl className={styles.parametres}>
        <div>
          <dt>Véhicules</dt>
          <dd className="chiffre">{nombreVehicules}</dd>
        </div>
        <div>
          <dt>Durée</dt>
          <dd className="chiffre">{formatAnnees(parametres.dureeAnnees)}</dd>
        </div>
        <div>
          <dt>Kilométrage</dt>
          <dd className="chiffre">{formatKmParAn(parametres.kilometrageAnnuel)}</dd>
        </div>
        <div>
          <dt>Région</dt>
          <dd>{region.label}</dd>
        </div>
      </dl>

      <div className={`${styles.actions} sans-impression`}>
        <Bouton variante="secondaire" taille="petit" icone={Download} onClick={onExporter}>
          Exporter le comparatif
        </Bouton>
        <Bouton variante="discret" taille="petit" icone={RotateCcw} onClick={onReinitialiser}>
          Nouvelle simulation
        </Bouton>
      </div>

      {date ? <p className={styles.date}>Simulation du {formatDateHeure(date)}</p> : null}
    </header>
  );
}

export default memo(SyntheseResultats);
