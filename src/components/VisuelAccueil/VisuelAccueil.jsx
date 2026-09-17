import { useState } from 'react';
import IllustrationHero from '../IllustrationHero/IllustrationHero';
import { PHOTO_ACCUEIL } from '../../constants/photos';
import styles from './VisuelAccueil.module.css';

/**
 * Grande image de la page d'accueil.
 *
 * Affiche la photo déclarée dans `constants/photos.js` (`PHOTO_ACCUEIL`), et
 * retombe sur l'illustration vectorielle si elle vaut `null` ou si le fichier
 * ne se charge pas.
 *
 * L'image est décorative : le titre de la page dit déjà tout ce qu'elle montre.
 * Elle est donc annoncée avec un `alt` vide plutôt qu'avec une description
 * redondante pour les lecteurs d'écran.
 *
 * Elle est au-dessus de la ligne de flottaison : chargement immédiat et
 * priorité haute, à l'inverse des vignettes de véhicules qui sont différées.
 */
export default function VisuelAccueil() {
  const [echouee, setEchouee] = useState(false);
  const afficherPhoto = Boolean(PHOTO_ACCUEIL) && !echouee;

  return (
    <div className={styles.cadre}>
      {afficherPhoto ? (
        <img
          src={PHOTO_ACCUEIL}
          alt=""
          className={styles.photo}
          decoding="async"
          fetchPriority="high"
          onError={() => setEchouee(true)}
        />
      ) : (
        <IllustrationHero />
      )}
    </div>
  );
}
