import { useEffect } from 'react';
import Bouton from '../../components/Bouton/Bouton';
import styles from './NonTrouve.module.css';

export default function NonTrouve() {
  useEffect(() => {
    document.title = 'Page introuvable — AutoCost';
  }, []);

  return (
    <div className={`conteneur ${styles.page}`}>
      <p className={`${styles.code} chiffre`}>404</p>
      <h1 className={styles.titre}>Cette page n’existe pas</h1>
      <p className={styles.texte}>
        Le lien est peut-être obsolète. Reprenez depuis le simulateur ou la page d’accueil.
      </p>
      <div className={styles.actions}>
        <Bouton to="/simulateur" variante="primaire">
          Aller au simulateur
        </Bouton>
        <Bouton to="/" variante="discret">
          Retour à l’accueil
        </Bouton>
      </div>
    </div>
  );
}
