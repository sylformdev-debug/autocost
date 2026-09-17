import { memo } from 'react';
import { CY, MONTANTS, PROFILS, ROUES, VITRAGES, profilDepuisSegment } from './silhouettes';
import styles from './SilhouetteVehicule.module.css';

/**
 * Illustration vectorielle d'un véhicule, choisie d'après son segment.
 *
 * Purement décorative : le véhicule est nommé en toutes lettres juste à côté,
 * donc l'image est retirée de l'arbre d'accessibilité.
 */
function SilhouetteVehicule({ segment, motorisation, className = '' }) {
  const profil = profilDepuisSegment(segment);
  const roue = ROUES[profil];
  const montant = MONTANTS[profil];
  const sol = CY + roue.r + 1;

  return (
    <svg
      viewBox="0 0 208 92"
      className={`${styles.svg} ${styles[motorisation] ?? ''} ${className}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="4" y1={sol} x2="204" y2={sol} className={styles.sol} />

      <path d={PROFILS[profil]} className={styles.caisse} />
      <path d={VITRAGES[profil]} className={styles.vitrage} />
      <line
        x1={montant.x}
        y1={montant.haut}
        x2={montant.x}
        y2={montant.bas}
        className={styles.montant}
      />

      {[roue.arriere, roue.avant].map((cx) => (
        <g key={cx}>
          {/* Le pneu est peint après la caisse : son remplissage masque le
              longeron, qui ne traverse donc pas la roue. */}
          <circle cx={cx} cy={CY} r={roue.r} className={styles.pneu} />
          <circle cx={cx} cy={CY} r={roue.r * 0.4} className={styles.jante} />
        </g>
      ))}
    </svg>
  );
}

export default memo(SilhouetteVehicule);
