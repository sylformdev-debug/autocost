import { useId } from 'react';
import { CalendarRange, Gauge, MapPin } from 'lucide-react';
import { DUREE, KILOMETRAGE } from '../../constants/simulation';
import { REGION_OPTIONS } from '../../constants/regions';
import { formatKm } from '../../utils/format';
import { clamp } from '../../utils/validation';
import styles from './FormulaireSimulation.module.css';

/**
 * Paramètres d'usage. Champs contrôlés, validés en direct.
 * Le formulaire ne déclenche aucun appel : il remonte les valeurs au
 * simulateur, qui est seul responsable du lancement.
 */
export default function FormulaireSimulation({ parametres, onChanger, erreurs, avertissements }) {
  const idKm = useId();
  const idDuree = useId();
  const idRegion = useId();

  const champ = (id, valeurErreur, valeurAvertissement) => ({
    'aria-invalid': valeurErreur ? true : undefined,
    'aria-describedby':
      [valeurErreur ? `${id}-erreur` : null, valeurAvertissement ? `${id}-alerte` : null]
        .filter(Boolean)
        .join(' ') || undefined,
  });

  return (
    <div className={styles.grille}>
      {/* — Kilométrage — */}
      <div className={styles.champ}>
        <label htmlFor={idKm} className={styles.label}>
          <Gauge size={14} strokeWidth={1.75} aria-hidden="true" />
          Kilométrage annuel
        </label>
        <div className={`${styles.saisie} ${erreurs.kilometrageAnnuel ? styles.enErreur : ''}`}>
          <input
            id={idKm}
            type="number"
            inputMode="numeric"
            className="chiffre"
            value={parametres.kilometrageAnnuel}
            min={KILOMETRAGE.min}
            max={KILOMETRAGE.max}
            step={KILOMETRAGE.step}
            onChange={(e) =>
              onChanger('kilometrageAnnuel', e.target.value === '' ? '' : Number(e.target.value))
            }
            onBlur={(e) =>
              onChanger(
                'kilometrageAnnuel',
                clamp(e.target.value, KILOMETRAGE.min, KILOMETRAGE.max),
              )
            }
            {...champ(idKm, erreurs.kilometrageAnnuel, avertissements.kilometrageAnnuel)}
          />
          <span className={styles.unite}>km/an</span>
        </div>
        <input
          type="range"
          className={styles.curseur}
          value={Number(parametres.kilometrageAnnuel) || KILOMETRAGE.min}
          min={KILOMETRAGE.min}
          max={50000}
          step={KILOMETRAGE.step}
          onChange={(e) => onChanger('kilometrageAnnuel', Number(e.target.value))}
          aria-label={`Ajuster le kilométrage annuel, actuellement ${formatKm(
            parametres.kilometrageAnnuel,
          )}`}
        />
        <Messages
          id={idKm}
          erreur={erreurs.kilometrageAnnuel}
          avertissement={avertissements.kilometrageAnnuel}
          aide={`Entre ${formatKm(KILOMETRAGE.min)} et ${formatKm(KILOMETRAGE.max)}.`}
        />
      </div>

      {/* — Durée — */}
      <div className={styles.champ}>
        <label htmlFor={idDuree} className={styles.label}>
          <CalendarRange size={14} strokeWidth={1.75} aria-hidden="true" />
          Durée de possession
        </label>
        <div className={`${styles.saisie} ${erreurs.dureeAnnees ? styles.enErreur : ''}`}>
          <input
            id={idDuree}
            type="number"
            inputMode="numeric"
            className="chiffre"
            value={parametres.dureeAnnees}
            min={DUREE.min}
            max={DUREE.max}
            step={DUREE.step}
            onChange={(e) =>
              onChanger('dureeAnnees', e.target.value === '' ? '' : Number(e.target.value))
            }
            onBlur={(e) => onChanger('dureeAnnees', clamp(e.target.value, DUREE.min, DUREE.max))}
            {...champ(idDuree, erreurs.dureeAnnees, avertissements.dureeAnnees)}
          />
          <span className={styles.unite}>{Number(parametres.dureeAnnees) > 1 ? 'ans' : 'an'}</span>
        </div>
        <input
          type="range"
          className={styles.curseur}
          value={Number(parametres.dureeAnnees) || DUREE.min}
          min={DUREE.min}
          max={DUREE.max}
          step={DUREE.step}
          onChange={(e) => onChanger('dureeAnnees', Number(e.target.value))}
          aria-label={`Ajuster la durée de possession, actuellement ${
            parametres.dureeAnnees
          } ans`}
        />
        <Messages
          id={idDuree}
          erreur={erreurs.dureeAnnees}
          avertissement={avertissements.dureeAnnees}
          aide={`De ${DUREE.min} à ${DUREE.max} ans.`}
        />
      </div>

      {/* — Région — */}
      <div className={styles.champ}>
        <label htmlFor={idRegion} className={styles.label}>
          <MapPin size={14} strokeWidth={1.75} aria-hidden="true" />
          Région
        </label>
        <div className={`${styles.saisie} ${erreurs.region ? styles.enErreur : ''}`}>
          <select
            id={idRegion}
            className={styles.select}
            value={parametres.region}
            onChange={(e) => onChanger('region', e.target.value)}
            {...champ(idRegion, erreurs.region, null)}
          >
            {REGION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Messages
          id={idRegion}
          erreur={erreurs.region}
          aide="Détermine les prix de l’énergie, l’assurance et les taxes."
        />
      </div>
    </div>
  );
}

function Messages({ id, erreur, avertissement, aide }) {
  if (erreur) {
    return (
      <p id={`${id}-erreur`} className={styles.erreur} role="alert">
        {erreur}
      </p>
    );
  }
  if (avertissement) {
    return (
      <p id={`${id}-alerte`} className={styles.alerte}>
        {avertissement}
      </p>
    );
  }
  return <p className={styles.aide}>{aide}</p>;
}
