import { Table2 } from 'lucide-react';
import styles from './AlternativeDonnees.module.css';

/**
 * Équivalent tabulaire d'un graphique (§24).
 * Un graphique n'est jamais la seule façon d'accéder à la donnée : chaque
 * visualisation est doublée d'un tableau réel, replié par défaut mais présent
 * dans le DOM et lisible par un lecteur d'écran.
 */
export default function AlternativeDonnees({ titre, colonnes, lignes }) {
  return (
    <details className={styles.bloc}>
      <summary className={styles.resume}>
        <Table2 size={13} strokeWidth={1.75} aria-hidden="true" />
        {titre}
      </summary>
      <div className={styles.defilement}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              {colonnes.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, i) => (
              <tr key={ligne[0] ?? i}>
                {ligne.map((cellule, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {cellule}
                    </th>
                  ) : (
                    <td key={j} className="chiffre">
                      {cellule}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
