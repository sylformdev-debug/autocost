import { useMemo, useState } from 'react';
import { Search, X, CarFront } from 'lucide-react';
import CarteVehicule from '../CarteVehicule/CarteVehicule';
import MessageErreur from '../MessageErreur/MessageErreur';
import Avertissement from '../Avertissement/Avertissement';
import { SquelettesVehicules } from '../EtatChargement/EtatChargement';
import { MAX_VEHICULES, MOTORISATIONS } from '../../constants/simulation';
import { nomVehicule } from '../../utils/format';
import styles from './SelecteurVehicules.module.css';

const FILTRES = [
  { value: 'tous', label: 'Toutes' },
  ...Object.entries(MOTORISATIONS).map(([value, { label }]) => ({ value, label })),
];

/** Nombre de véhicules affichés avant de déplier le catalogue complet. */
const LIMITE_INITIALE = 8;

/** Sélection du catalogue : recherche, filtre, grille, résumé de la sélection. */
export default function SelecteurVehicules({
  vehicules,
  chargement,
  erreur,
  onRecharger,
  selection,
  onBasculer,
  onRetirer,
  onVider,
  vehiculesSelectionnes,
  region,
}) {
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('tous');
  const [toutAfficher, setToutAfficher] = useState(false);

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return vehicules.filter((v) => {
      const correspondFiltre = filtre === 'tous' || v.motorisation === filtre;
      if (!correspondFiltre) return false;
      if (!terme) return true;
      return `${v.marque} ${v.modele} ${v.segment ?? ''}`.toLowerCase().includes(terme);
    });
  }, [vehicules, recherche, filtre]);

  const selectionPleine = selection.length >= MAX_VEHICULES;

  // Le catalogue complet repousserait les étapes suivantes hors de l'écran :
  // on n'en montre qu'une partie tant que l'utilisateur n'a pas filtré.
  const listeRestreinte = !toutAfficher && recherche.trim() === '' && filtre === 'tous';
  // Un véhicule déjà sélectionné reste toujours visible, même hors des premiers.
  const visibles = listeRestreinte
    ? filtres.filter((v, i) => i < LIMITE_INITIALE || selection.includes(v.id))
    : filtres;
  const restants = filtres.length - visibles.length;

  if (erreur) {
    return (
      <MessageErreur
        erreur={erreur}
        titre="Catalogue indisponible"
        onReessayer={onRecharger}
      />
    );
  }

  return (
    <div className={styles.bloc}>
      <div className={styles.barre}>
        <div className={styles.recherche}>
          <Search size={15} strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            id="recherche-vehicule"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une marque ou un modèle"
            aria-label="Rechercher un véhicule par marque ou modèle"
            disabled={chargement}
          />
          {recherche ? (
            <button
              type="button"
              onClick={() => setRecherche('')}
              className={styles.effacer}
              aria-label="Effacer la recherche"
            >
              <X size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div
          className={styles.filtres}
          role="group"
          aria-label="Filtrer par motorisation"
        >
          {FILTRES.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${styles.filtre} ${filtre === f.value ? styles.filtreActif : ''}`}
              onClick={() => setFiltre(f.value)}
              aria-pressed={filtre === f.value}
              disabled={chargement}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {selection.length > 0 ? (
        <div className={styles.selection}>
          <span className={styles.selectionTitre}>
            Sélection <span className="chiffre">({selection.length}/{MAX_VEHICULES})</span>
          </span>
          <ul className={styles.puces}>
            {vehiculesSelectionnes.map((v) => (
              <li key={v.id}>
                <span className={styles.puce}>
                  {nomVehicule(v)}
                  <button
                    type="button"
                    onClick={() => onRetirer(v.id)}
                    aria-label={`Retirer ${nomVehicule(v)} de la comparaison`}
                  >
                    <X size={13} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className={styles.vider} onClick={onVider}>
            Tout retirer
          </button>
        </div>
      ) : null}

      {selectionPleine ? (
        <Avertissement ton="neutre">
          Maximum atteint : {MAX_VEHICULES} véhicules comparés à la fois, pour que les graphiques
          restent lisibles. Retirez-en un pour en ajouter un autre.
        </Avertissement>
      ) : null}

      {chargement ? (
        <SquelettesVehicules nombre={6} />
      ) : filtres.length === 0 ? (
        <div className={styles.vide}>
          <CarFront size={26} strokeWidth={1.2} aria-hidden="true" />
          <p className={styles.videTitre}>Aucun véhicule ne correspond</p>
          <p className={styles.videTexte}>
            {vehicules.length === 0
              ? 'Le catalogue est vide pour le moment.'
              : 'Modifiez votre recherche ou changez de filtre.'}
          </p>
        </div>
      ) : (
        <>
          <ul className={styles.grille}>
            {visibles.map((v) => {
              const selectionne = selection.includes(v.id);
              return (
                <li key={v.id}>
                  <CarteVehicule
                    vehicule={v}
                    region={region}
                    selectionne={selectionne}
                    desactive={!selectionne && selectionPleine}
                    onBasculer={onBasculer}
                  />
                </li>
              );
            })}
          </ul>

          {restants > 0 || toutAfficher ? (
            <button
              type="button"
              className={styles.deplier}
              onClick={() => setToutAfficher((v) => !v)}
              aria-expanded={toutAfficher}
            >
              {restants > 0
                ? `Afficher les ${restants} autres véhicules`
                : 'Réduire la liste'}
            </button>
          ) : null}

          <p className="visuellement-cache" aria-live="polite">
            {visibles.length} véhicule{visibles.length > 1 ? 's' : ''} affiché
            {visibles.length > 1 ? 's' : ''} sur {filtres.length}, {selection.length} sélectionné
            {selection.length > 1 ? 's' : ''}.
          </p>
        </>
      )}
    </div>
  );
}
