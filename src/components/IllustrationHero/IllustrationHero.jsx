import styles from './IllustrationHero.module.css';

/**
 * Illustration principale de la page d'accueil — dessin vectoriel ORIGINAL.
 *
 * Aucune photographie de constructeur, aucun logo, aucun modèle identifiable :
 * un profil générique en trait, cohérent avec l'identité noir et or, et qui
 * reste net à toutes les tailles sans peser sur le chargement.
 *
 * Décorative : elle n'ajoute rien à ce que le titre dit déjà, donc elle est
 * retirée de l'arbre d'accessibilité.
 */
export default function IllustrationHero() {
  return (
    <svg
      viewBox="0 0 420 200"
      className={styles.svg}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Une seule source lumineuse, très douce, posée sous le véhicule. */}
        <radialGradient id="hero-lueur" cx="50%" cy="72%" r="58%">
          <stop offset="0%" stopColor="#C9A227" stopOpacity="0.18" />
          <stop offset="55%" stopColor="#C9A227" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-sol" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C9A227" stopOpacity="0" />
          <stop offset="28%" stopColor="#C9A227" stopOpacity="0.4" />
          <stop offset="72%" stopColor="#C9A227" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-ombre" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="50%" stopColor="#000000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="212" cy="120" rx="210" ry="96" fill="url(#hero-lueur)" />
      <ellipse cx="214" cy="176" rx="168" ry="8" fill="url(#hero-ombre)" />
      <line x1="10" y1="176" x2="414" y2="176" stroke="url(#hero-sol)" strokeWidth="1" />

      {/* — Caisse — */}
      <path
        className={styles.caisse}
        d="M 24 148 L 24 112 C 24 99 30 91 42 87 L 96 71
           C 104 50 118 39 140 39 L 250 39 C 264 39 274 43 280 51
           L 306 86 L 372 94 C 392 97 402 106 404 120 L 405 148
           L 345 148 A 35 35 0 0 0 275 148
           L 145 148 A 35 35 0 0 0 75 148 L 24 148 Z"
      />

      {/* — Vitrage et montants — */}
      <path className={styles.vitrage} d="M 110 80 L 137 47 L 246 47 L 277 80 Z" />
      <line className={styles.trait} x1="190" y1="47" x2="190" y2="80" />

      {/* — Ouvrants — */}
      <line className={styles.traitFin} x1="190" y1="84" x2="190" y2="139" />
      <line className={styles.traitFin} x1="112" y1="86" x2="112" y2="120" />
      <rect className={styles.trait} x="206" y="95" width="24" height="5" rx="2.5" />
      <rect className={styles.trait} x="132" y="95" width="24" height="5" rx="2.5" />

      {/* — Rétroviseur, optiques — */}
      <path className={styles.trait} d="M 281 78 L 296 76 C 300 76 301 79 298 81 L 283 84 Z" />
      <path className={styles.trait} d="M 383 101 L 399 104 C 402 105 402 110 398 110 L 383 109 Z" />
      <path className={styles.trait} d="M 27 106 L 41 104 C 44 104 45 109 42 110 L 27 112 Z" />

      {/* — Trains roulants — */}
      {[110, 310].map((cx) => (
        <g key={cx}>
          <circle className={styles.pneu} cx={cx} cy="142" r="31" />
          <circle className={styles.jante} cx={cx} cy="142" r="19" />
          <circle className={styles.moyeu} cx={cx} cy="142" r="5" />
          {[0, 72, 144, 216, 288].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                className={styles.rayon}
                x1={cx + Math.cos(rad) * 6}
                y1={142 + Math.sin(rad) * 6}
                x2={cx + Math.cos(rad) * 18}
                y2={142 + Math.sin(rad) * 18}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
