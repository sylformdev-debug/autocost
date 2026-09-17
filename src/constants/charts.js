/**
 * Palette des graphiques, dérivée de l'identité noir / or.
 * Aucune couleur aléatoire : chaque poste et chaque série a une teinte fixe,
 * ordonnée du plus clair au plus sombre pour rester lisible sur fond noir.
 */
export const COULEURS_POSTES = {
  carburant: '#E4C766',
  entretien: '#C9A227',
  assurance: '#9F8120',
  decote_estimee: '#6E5A1A',
  autres: '#454545',
};

/**
 * Séries de comparaison : or en tête (véhicule le plus économique), puis des
 * neutres chauds suffisamment contrastés entre eux sur fond noir.
 */
export const COULEURS_SERIES = ['#E4C766', '#EAE4D8', '#A89B86', '#797063'];

/**
 * Motif de trait par série : la couleur n'est jamais le seul signe distinctif
 * (daltonisme, impression noir et blanc).
 */
export const TRAITS_SERIES = [undefined, '7 3', '2 3', '10 3 2 3'];

export const GRILLE = 'rgba(201, 162, 39, 0.12)';
export const AXE = '#A7A7A7';

export const TOOLTIP_STYLE = {
  backgroundColor: '#111111',
  border: '1px solid rgba(201, 162, 39, 0.28)',
  borderRadius: '4px',
  color: '#F5F5F5',
  fontSize: '13px',
  padding: '10px 12px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
};
