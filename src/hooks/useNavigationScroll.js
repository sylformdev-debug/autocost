import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Remet la vue en haut à chaque changement de page, et gère les ancres
 * (`/#methodologie`) que React Router ne traite pas nativement.
 */
export function useNavigationScroll() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Le contenu de la nouvelle page doit être monté avant de viser l'ancre.
      const frame = requestAnimationFrame(() => {
        const cible = document.getElementById(hash.slice(1));
        if (cible) cible.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [pathname, hash]);
}
