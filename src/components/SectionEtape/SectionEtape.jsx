import styles from './SectionEtape.module.css';

/**
 * Étape numérotée du parcours (§3). La numérotation visible est ce qui
 * répond à « que dois-je faire maintenant ? ».
 */
export default function SectionEtape({ numero, titre, description, action, children }) {
  const idTitre = `etape-${numero}-titre`;

  return (
    <section className={styles.section} aria-labelledby={idTitre}>
      <header className={styles.entete}>
        <div className={styles.intitule}>
          <span className={`${styles.numero} chiffre`} aria-hidden="true">
            {String(numero).padStart(2, '0')}
          </span>
          <div>
            <h2 id={idTitre} className={styles.titre}>
              <span className="visuellement-cache">Étape {numero} — </span>
              {titre}
            </h2>
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
        </div>
        {action ? <div className={styles.action}>{action}</div> : null}
      </header>

      <div className={styles.contenu}>{children}</div>
    </section>
  );
}
