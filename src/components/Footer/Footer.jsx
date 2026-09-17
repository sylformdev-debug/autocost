import { Link } from 'react-router-dom';
import Logo from '../Logo/Logo';
import { LIBELLE_SOURCE } from '../../services';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={`${styles.pied} sans-impression`}>
      <div className={`conteneur ${styles.interieur}`}>
        <div className={styles.identite}>
          <Logo />
          <p className={styles.slogan}>Simulez. Comparez. Décidez.</p>
        </div>

        <nav className={styles.liens} aria-label="Liens utiles">
          <Link to="/simulateur">Simulation</Link>
          <Link to="/#comment-ca-marche">Comment ça marche</Link>
          <Link to="/#methodologie">Méthodologie</Link>
        </nav>

        <div className={styles.mentions}>
          <p>Projet développé dans le cadre d’un projet académique.</p>
          <p className={styles.source}>Source des données : {LIBELLE_SOURCE}</p>
        </div>
      </div>
    </footer>
  );
}
