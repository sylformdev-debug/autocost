import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Plus } from 'lucide-react';
import { getVehicleById } from '../../services';
import { toApiError } from '../../services/errors';
import { useSimulateur } from '../../context/contexteSimulateur';
import BadgeMotorisation from '../../components/BadgeMotorisation/BadgeMotorisation';
import VisuelVehicule from '../../components/VisuelVehicule/VisuelVehicule';
import Bouton from '../../components/Bouton/Bouton';
import MessageErreur from '../../components/MessageErreur/MessageErreur';
import { Squelette } from '../../components/EtatChargement/EtatChargement';
import { formatConsommation, formatPrix, nomVehicule } from '../../utils/format';
import { getMotorisation, MAX_VEHICULES } from '../../constants/simulation';
import styles from './DetailVehicule.module.css';

/** Fiche détaillée d'un véhicule (GET /vehicules/:id). */
export default function DetailVehicule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { parametres, basculerVehicule } = useSimulateur();

  /**
   * Le résultat est mémorisé AVEC l'identifiant auquel il correspond. L'état
   * d'affichage s'en déduit : plus rien à resynchroniser quand l'URL change,
   * et aucun risque d'afficher un instant la fiche précédente.
   */
  const [resultat, setResultat] = useState({ id: null, vehicule: null, erreur: null });
  const [tentative, setTentative] = useState(0);
  const controleurRef = useRef(null);

  const correspond = resultat.id === String(id);
  const vehicule = correspond ? resultat.vehicule : null;
  const erreur = correspond ? resultat.erreur : null;
  const chargement = !correspond;

  useEffect(() => {
    controleurRef.current?.abort();
    const controleur = new AbortController();
    controleurRef.current = controleur;

    getVehicleById(id, { signal: controleur.signal })
      .then((v) => {
        if (controleur.signal.aborted) return;
        setResultat({ id: String(id), vehicule: v, erreur: null });
      })
      .catch((e) => {
        if (controleur.signal.aborted || e?.name === 'CancelledError') return;
        setResultat({ id: String(id), vehicule: null, erreur: toApiError(e) });
      });

    return () => controleurRef.current?.abort();
    // `tentative` est incrémenté par le bouton « Réessayer ».
  }, [id, tentative]);

  /** Nouvelle tentative déclenchée par l'utilisateur. */
  const reessayer = useCallback(() => {
    setResultat({ id: null, vehicule: null, erreur: null });
    setTentative((n) => n + 1);
  }, []);

  useEffect(() => {
    document.title = vehicule ? `${nomVehicule(vehicule)} — AutoCost` : 'Véhicule — AutoCost';
  }, [vehicule]);

  const selectionne = vehicule ? parametres.vehiculeIds.includes(vehicule.id) : false;
  const selectionPleine = parametres.vehiculeIds.length >= MAX_VEHICULES;

  return (
    <div className={`conteneur ${styles.page}`}>
      <Link to="/simulateur" className={styles.retour}>
        <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
        Retour au simulateur
      </Link>

      {chargement ? (
        <div className={styles.squelette} aria-live="polite" aria-busy="true">
          <Squelette hauteur={12} largeur="110px" />
          <Squelette hauteur={44} largeur="min(420px, 80%)" />
          <Squelette hauteur={18} largeur="180px" />
          <Squelette hauteur={140} radius="var(--r-md)" />
          <span className="visuellement-cache">Chargement de la fiche véhicule.</span>
        </div>
      ) : erreur ? (
        <div className={styles.erreur}>
          <MessageErreur
            erreur={erreur}
            titre="Fiche indisponible"
            onReessayer={erreur.code === 'NOT_FOUND' ? undefined : reessayer}
          />
          <Bouton to="/simulateur" variante="secondaire">
            Revenir au catalogue
          </Bouton>
        </div>
      ) : vehicule ? (
        <article className={styles.fiche}>
          <header className={styles.entete}>
            <p className={styles.marque}>{vehicule.marque}</p>
            <h1 className={styles.modele}>{vehicule.modele}</h1>
            <div className={styles.meta}>
              <BadgeMotorisation motorisation={vehicule.motorisation} />
              {vehicule.annee ? <span>{vehicule.annee}</span> : null}
              {vehicule.segment ? <span>{vehicule.segment}</span> : null}
              {vehicule.places ? <span>{vehicule.places} places</span> : null}
            </div>
          </header>

          <div className={styles.visuel}>
            <VisuelVehicule vehicule={vehicule} taille="fiche" />
          </div>

          <dl className={styles.caracteristiques}>
            <div>
              <dt>Prix d’achat</dt>
              <dd className={`${styles.valeurForte} chiffre`}>
                {formatPrix(vehicule.prixAchat, parametres.region)}
              </dd>
            </div>
            <div>
              <dt>Consommation moyenne</dt>
              <dd className="chiffre">
                {formatConsommation(
                  vehicule.consommation,
                  getMotorisation(vehicule.motorisation).unite,
                )}
              </dd>
            </div>
            <div>
              <dt>Motorisation</dt>
              <dd>{getMotorisation(vehicule.motorisation).label}</dd>
            </div>
            <div>
              <dt>Année</dt>
              <dd className="chiffre">{vehicule.annee ?? '—'}</dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <Bouton
              variante={selectionne ? 'secondaire' : 'primaire'}
              icone={selectionne ? Check : Plus}
              onClick={() => {
                basculerVehicule(vehicule.id);
                if (!selectionne) navigate('/simulateur');
              }}
              disabled={!selectionne && selectionPleine}
            >
              {selectionne ? 'Dans la comparaison' : 'Ajouter à la comparaison'}
            </Bouton>
            {!selectionne && selectionPleine ? (
              <p className={styles.note}>
                Comparaison complète ({MAX_VEHICULES} véhicules). Retirez-en un pour ajouter
                celui-ci.
              </p>
            ) : null}
          </div>

          <p className={styles.avertissement}>
            Le coût de possession de ce véhicule dépend de votre usage : lancez une simulation pour
            obtenir des chiffres qui vous correspondent.
          </p>
        </article>
      ) : null}
    </div>
  );
}
