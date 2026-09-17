import styles from './EtatChargement.module.css';

/** Bloc gris animé occupant la place du contenu à venir (évite le saut de mise en page). */
export function Squelette({ hauteur = 16, largeur = '100%', radius = 'var(--r-sm)' }) {
  return (
    <span
      className={styles.squelette}
      style={{ height: hauteur, width: largeur, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** Grille de cartes fantômes pendant le chargement du catalogue. */
export function SquelettesVehicules({ nombre = 6 }) {
  return (
    <div className={styles.grille} aria-hidden="true">
      {Array.from({ length: nombre }, (_, i) => (
        <div key={i} className={styles.carte}>
          <Squelette hauteur={11} largeur="38%" />
          <Squelette hauteur={20} largeur="72%" />
          <Squelette hauteur={11} largeur="50%" />
          <div className={styles.ligne}>
            <Squelette hauteur={32} largeur="46%" />
            <Squelette hauteur={32} largeur="46%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Squelette de la zone de résultats, pendant le recalcul. */
export function SquelettesResultats() {
  return (
    <div className={styles.resultats} aria-hidden="true">
      <Squelette hauteur={112} radius="var(--r-lg)" />
      <div className={styles.ligne}>
        <Squelette hauteur={148} radius="var(--r-md)" />
        <Squelette hauteur={148} radius="var(--r-md)" />
      </div>
      <Squelette hauteur={260} radius="var(--r-md)" />
    </div>
  );
}

/** Indicateur discret, utilisé dans un bouton ou à côté d'un titre. */
export function Indicateur({ label = 'Chargement en cours' }) {
  return (
    <span className={styles.indicateur} role="status">
      <span className={styles.rond} aria-hidden="true" />
      <span className="visuellement-cache">{label}</span>
    </span>
  );
}
