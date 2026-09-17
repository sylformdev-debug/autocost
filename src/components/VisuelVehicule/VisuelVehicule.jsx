import { memo, useState } from 'react';
import SilhouetteVehicule from '../SilhouetteVehicule/SilhouetteVehicule';
import { nomVehicule } from '../../utils/format';
import styles from './VisuelVehicule.module.css';

/**
 * Visuel d'un véhicule.
 *
 * Deux sources possibles, dans cet ordre :
 *  1. `vehicule.image` — une vraie photographie, si le catalogue en fournit une
 *     (voir `public/vehicules/LISEZMOI.md`) ;
 *  2. sinon, l'illustration vectorielle correspondant au segment.
 *
 * Une image qui ne se charge pas (404, hors ligne, hôte bloqué) bascule aussi
 * sur l'illustration : la carte n'affiche jamais de cadre vide ni d'icône
 * d'image cassée.
 */
function VisuelVehicule({ vehicule, taille = 'carte' }) {
  const [imageEchouee, setImageEchouee] = useState(false);
  const afficherPhoto = Boolean(vehicule.image) && !imageEchouee;

  return (
    <div className={`${styles.cadre} ${styles[taille]}`}>
      {afficherPhoto ? (
        <img
          src={vehicule.image}
          alt={`Photographie — ${nomVehicule(vehicule)}`}
          className={styles.photo}
          loading="lazy"
          decoding="async"
          onError={() => setImageEchouee(true)}
        />
      ) : (
        <SilhouetteVehicule
          segment={vehicule.segment}
          motorisation={vehicule.motorisation}
          className={styles.illustration}
        />
      )}
    </div>
  );
}

export default memo(VisuelVehicule);
