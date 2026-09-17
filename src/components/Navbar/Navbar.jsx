import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from '../Logo/Logo';
import Bouton from '../Bouton/Bouton';
import styles from './Navbar.module.css';

/** En-tête fixe. Se densifie au défilement, sans animation tapageuse. */
export default function Navbar() {
  const [defile, setDefile] = useState(false);

  useEffect(() => {
    const onScroll = () => setDefile(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.entete} ${defile ? styles.dense : ''} sans-impression`}>
      <div className={`conteneur ${styles.interieur}`}>
        <Link to="/" className={styles.logo} aria-label="AutoCost — accueil">
          <Logo />
        </Link>

        <nav className={styles.nav} aria-label="Navigation principale">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${styles.lien} ${isActive ? styles.actif : ''}`}
          >
            Accueil
          </NavLink>
          {/* <Link> et non <a> : un <a href> rechargerait toute l'application
              et ferait perdre la simulation en cours. */}
          <Link to="/#methodologie" className={styles.lien}>
            Méthodologie
          </Link>
          <Bouton to="/simulateur" variante="secondaire" taille="petit">
            Simulateur
          </Bouton>
        </nav>
      </div>
    </header>
  );
}
