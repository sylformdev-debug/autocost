/**
 * Export du comparatif (§23).
 *
 * Choix technique : impression navigateur pilotée par une feuille de style
 * `@media print` dédiée, plutôt qu'une bibliothèque de génération PDF.
 *  - aucune dépendance supplémentaire (bundle inchangé) ;
 *  - les graphiques sont des SVG : ils s'impriment en vectoriel, net ;
 *  - l'utilisateur choisit « Enregistrer au format PDF » dans le dialogue,
 *    ou imprime directement.
 *
 * Le document imprimé contient la date, les paramètres, les véhicules, les
 * coûts, la recommandation, le tableau et les graphiques.
 */
export function exporterComparatif() {
  if (typeof window === 'undefined' || typeof window.print !== 'function') return false;
  window.print();
  return true;
}
