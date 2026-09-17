import { Link } from 'react-router-dom';
import styles from './Bouton.module.css';

/**
 * Bouton unique de l'application (variantes : primaire, secondaire, discret).
 * Rend un <button>, un <a> ou un <Link> selon les props, sans jamais perdre
 * la sémantique ni le focus clavier.
 */
export default function Bouton({
  variante = 'primaire',
  taille = 'moyen',
  to,
  href,
  icone: Icone,
  iconeApres: IconeApres,
  pleineLargeur = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    styles.bouton,
    styles[variante],
    styles[taille],
    pleineLargeur ? styles.pleineLargeur : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const contenu = (
    <>
      {Icone ? <Icone size={16} strokeWidth={1.75} aria-hidden="true" /> : null}
      <span>{children}</span>
      {IconeApres ? <IconeApres size={16} strokeWidth={1.75} aria-hidden="true" /> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {contenu}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {contenu}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {contenu}
    </button>
  );
}
