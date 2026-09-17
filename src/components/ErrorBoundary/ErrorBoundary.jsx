import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

/**
 * Filet de sécurité : une exception de rendu ne doit jamais produire un écran
 * blanc. On affiche un état lisible et une porte de sortie.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erreur: null };
  }

  static getDerivedStateFromError(erreur) {
    return { erreur };
  }

  componentDidCatch(erreur, info) {
    // eslint-disable-next-line no-console
    console.error('[AutoCost] Erreur de rendu :', erreur, info?.componentStack);
  }

  render() {
    if (!this.state.erreur) return this.props.children;

    return (
      <div className={styles.bloc} role="alert">
        <AlertTriangle size={26} strokeWidth={1.4} className={styles.icone} aria-hidden="true" />
        <h1 className={styles.titre}>Cette section n’a pas pu s’afficher</h1>
        <p className={styles.texte}>
          Une erreur inattendue est survenue. Rechargez la page pour repartir d’un état sain ; vos
          paramètres enregistrés restent disponibles.
        </p>
        <button
          type="button"
          className={styles.bouton}
          onClick={() => window.location.reload()}
        >
          Recharger la page
        </button>
      </div>
    );
  }
}
