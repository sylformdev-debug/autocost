import styles from './Logo.module.css';

/** Marque typographique — un filet or et rien de plus. */
export default function Logo({ taille = 'normal' }) {
  return (
    <span className={`${styles.logo} ${styles[taille]}`}>
      <span className={styles.marque} aria-hidden="true" />
      <span className={styles.texte}>
        Auto<span className={styles.accent}>Cost</span>
      </span>
    </span>
  );
}
