import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SimulateurContext } from './contexteSimulateur';
import { runSimulation } from '../services';
import { toApiError } from '../services/errors';
import { useVehicules } from '../hooks/useVehicules';
import { useDebounce } from '../hooks/useDebounce';
import { effacerSession, ecrireSession, lireSession } from '../utils/storage';
import { validerParametres } from '../utils/validation';
import { DEFAULT_REGION } from '../constants/regions';
import { DUREE, KILOMETRAGE, MAX_VEHICULES } from '../constants/simulation';
import { STATUTS } from '../constants/statuts';

const PARAMETRES_DEFAUT = {
  vehiculeIds: [],
  kilometrageAnnuel: KILOMETRAGE.defaut,
  dureeAnnees: DUREE.defaut,
  region: DEFAULT_REGION,
};

/** Clé stable d'un jeu de paramètres, pour détecter un vrai changement. */
const cleParametres = (p) =>
  JSON.stringify({
    v: [...p.vehiculeIds].sort(),
    k: Number(p.kilometrageAnnuel),
    d: Number(p.dureeAnnees),
    r: p.region,
  });

export function SimulateurProvider({ children }) {
  const { vehicules, chargement: chargementVehicules, erreur: erreurVehicules, recharger } =
    useVehicules();

  const [parametres, setParametres] = useState(PARAMETRES_DEFAUT);
  const [statut, setStatut] = useState(STATUTS.INACTIF);
  const [resultatsBruts, setResultatsBruts] = useState(null);
  const [parametresAppliques, setParametresAppliques] = useState(null);
  const [dateSimulation, setDateSimulation] = useState(null);
  const [erreurSimulation, setErreurSimulation] = useState(null);
  const [indisponibles, setIndisponibles] = useState([]);

  // Session précédente : lue une seule fois, jamais appliquée sans accord.
  const [sessionProposee, setSessionProposee] = useState(() => lireSession());
  const [persistanceActive, setPersistanceActive] = useState(() => lireSession() === null);

  const controleurRef = useRef(null);
  const cleAppliqueeRef = useRef(null);

  // Miroir des paramètres courants : permet à `lancer` de rester stable
  // (aucune dépendance) sans jamais lire une valeur périmée.
  const parametresRef = useRef(parametres);
  useEffect(() => {
    parametresRef.current = parametres;
  }, [parametres]);

  const validation = useMemo(() => validerParametres(parametres), [parametres]);

  /* ------------------------------------------------------------------ *
   * Sélection des véhicules
   * ------------------------------------------------------------------ */
  const basculerVehicule = useCallback((id) => {
    setParametres((p) => {
      if (p.vehiculeIds.includes(id)) {
        return { ...p, vehiculeIds: p.vehiculeIds.filter((v) => v !== id) };
      }
      if (p.vehiculeIds.length >= MAX_VEHICULES) return p;
      return { ...p, vehiculeIds: [...p.vehiculeIds, id] };
    });
  }, []);

  const retirerVehicule = useCallback((id) => {
    setParametres((p) => ({ ...p, vehiculeIds: p.vehiculeIds.filter((v) => v !== id) }));
  }, []);

  const viderSelection = useCallback(() => {
    setParametres((p) => ({ ...p, vehiculeIds: [] }));
  }, []);

  const majParametre = useCallback((cle, valeur) => {
    setParametres((p) => ({ ...p, [cle]: valeur }));
  }, []);

  /* ------------------------------------------------------------------ *
   * Réconciliation catalogue ↔ sélection
   * Un véhicule disparu du catalogue est retiré, et l'utilisateur prévenu.
   *
   * oxlint signale ici un `setState` dans un effet. C'est assumé : c'est
   * exactement le cas que la règle autorise — synchroniser un état utilisateur
   * (sa sélection) avec une source extérieure (le catalogue renvoyé par l'API).
   * La sélection ne peut pas être dérivée : elle doit survivre au rechargement
   * du catalogue, et l'avertissement affiché doit pouvoir être masqué.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (chargementVehicules || vehicules.length === 0) return;
    const connus = new Set(vehicules.map((v) => v.id));
    const manquants = parametres.vehiculeIds.filter((id) => !connus.has(id));
    if (manquants.length === 0) return;

    setIndisponibles((prev) => [...new Set([...prev, ...manquants])]);
    setParametres((p) => ({
      ...p,
      vehiculeIds: p.vehiculeIds.filter((id) => connus.has(id)),
    }));
  }, [vehicules, chargementVehicules, parametres.vehiculeIds]);

  /* ------------------------------------------------------------------ *
   * Lancement de la simulation
   * ------------------------------------------------------------------ */
  const lancer = useCallback(async (parametresForces) => {
    const p = parametresForces ?? parametresRef.current;
    const controle = validerParametres(p);
    if (!controle.valide) {
      // Garde-fou : aucune requête si les données sont invalides (§11).
      setStatut(STATUTS.ERREUR);
      setErreurSimulation(toApiError(new Error('Paramètres invalides')));
      return;
    }

    controleurRef.current?.abort();
    const controleur = new AbortController();
    controleurRef.current = controleur;

    setStatut(STATUTS.CHARGEMENT);
    setErreurSimulation(null);
    // L'utilisateur lance sa propre simulation : la proposition de reprise
    // devient caduque et ne doit pas rester à l'écran avec des chiffres périmés.
    setSessionProposee(null);

    try {
      const reponse = await runSimulation(
        {
          vehiculeIds: p.vehiculeIds,
          kilometrageAnnuel: Number(p.kilometrageAnnuel),
          dureeAnnees: Number(p.dureeAnnees),
          region: p.region,
        },
        { signal: controleur.signal },
      );
      if (controleur.signal.aborted) return;

      const rendus = new Set(reponse.resultats.map((r) => r.vehiculeId));
      const manquants = p.vehiculeIds.filter((id) => !rendus.has(id));

      setResultatsBruts(reponse.resultats);
      setParametresAppliques({ ...p, vehiculeIds: p.vehiculeIds.filter((id) => rendus.has(id)) });
      setDateSimulation(new Date().toISOString());
      setIndisponibles(manquants);
      if (manquants.length > 0) {
        setParametres((prev) => ({
          ...prev,
          vehiculeIds: prev.vehiculeIds.filter((id) => rendus.has(id)),
        }));
      }
      cleAppliqueeRef.current = cleParametres(p);
      setStatut(STATUTS.SUCCES);
      setPersistanceActive(true);
    } catch (e) {
      if (controleur.signal.aborted || e?.name === 'CancelledError') return;
      setErreurSimulation(toApiError(e));
      setStatut(STATUTS.ERREUR);
    }
  }, []);

  useEffect(() => () => controleurRef.current?.abort(), []);

  /* ------------------------------------------------------------------ *
   * Mise à jour dynamique (§20) : relance automatique, en différé, et
   * uniquement si une simulation a déjà été affichée et que les paramètres
   * ont réellement changé.
   * ------------------------------------------------------------------ */
  const cleCourante = cleParametres(parametres);
  const cleDifferee = useDebounce(cleCourante, 650);

  useEffect(() => {
    if (cleAppliqueeRef.current === null) return; // aucune simulation encore lancée
    if (!validation.valide) return;
    if (cleDifferee !== cleParametres(parametresRef.current)) return; // saisie en cours
    if (cleDifferee === cleAppliqueeRef.current) return; // rien n'a changé
    lancer();
  }, [cleDifferee, validation.valide, lancer]);

  /* ------------------------------------------------------------------ *
   * Persistance locale
   * ------------------------------------------------------------------ */
  // Différée : `parametres` change à chaque frappe, et une sérialisation JSON
  // suivie d'une écriture synchrone dans localStorage à chaque caractère coûte
  // cher sur un appareil modeste.
  useEffect(() => {
    if (!persistanceActive) return undefined;
    if (parametres.vehiculeIds.length === 0) return undefined;
    const timer = setTimeout(() => {
      ecrireSession({
        parametres,
        resultats: statut === STATUTS.SUCCES ? resultatsBruts : null,
        date: dateSimulation,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [persistanceActive, parametres, resultatsBruts, statut, dateSimulation]);

  const reprendreSession = useCallback(() => {
    if (!sessionProposee) return;
    setParametres(sessionProposee.parametres);
    setSessionProposee(null);
    setPersistanceActive(true);
    // On relance le calcul plutôt que d'afficher des résultats périmés :
    // les chiffres affichés correspondent toujours à un calcul réel.
    lancer(sessionProposee.parametres);
  }, [sessionProposee, lancer]);

  const ignorerSession = useCallback(() => {
    effacerSession();
    setSessionProposee(null);
    setPersistanceActive(true);
  }, []);

  const effacerIndisponibles = useCallback(() => setIndisponibles([]), []);

  const reinitialiser = useCallback(() => {
    controleurRef.current?.abort();
    cleAppliqueeRef.current = null;
    setParametres(PARAMETRES_DEFAUT);
    setResultatsBruts(null);
    setParametresAppliques(null);
    setDateSimulation(null);
    setErreurSimulation(null);
    setIndisponibles([]);
    setStatut(STATUTS.INACTIF);
    effacerSession();
  }, []);

  /* ------------------------------------------------------------------ *
   * Données dérivées
   * ------------------------------------------------------------------ */
  const parId = useMemo(() => new Map(vehicules.map((v) => [v.id, v])), [vehicules]);

  const vehiculesSelectionnes = useMemo(
    () => parametres.vehiculeIds.map((id) => parId.get(id)).filter(Boolean),
    [parametres.vehiculeIds, parId],
  );

  /**
   * Résultats enrichis du véhicule correspondant, triés du moins cher au plus
   * cher. Un résultat dont l'identifiant est absent du catalogue est mis de
   * côté explicitement : il serait sinon écarté sans que personne ne le sache.
   */
  const { resultats, resultatsOrphelins } = useMemo(() => {
    if (!resultatsBruts) return { resultats: null, resultatsOrphelins: [] };

    const liste = [];
    const orphelins = [];
    for (const r of resultatsBruts) {
      const vehicule = parId.get(r.vehiculeId);
      if (vehicule) liste.push({ ...r, vehicule });
      else orphelins.push(r.vehiculeId);
    }
    liste.sort((a, b) => a.coutTotal - b.coutTotal);

    // Tant que le catalogue n'est pas chargé, tout paraît orphelin : on ne
    // signale rien dans cet intervalle.
    return {
      resultats: liste,
      resultatsOrphelins: chargementVehicules || vehicules.length === 0 ? [] : orphelins,
    };
  }, [resultatsBruts, parId, chargementVehicules, vehicules]);

  /** Recommandation = coût total réel le plus faible. Jamais inventée. */
  const recommandation = useMemo(() => {
    if (!resultats || resultats.length === 0) return null;
    return resultats[0];
  }, [resultats]);

  const valeur = useMemo(
    () => ({
      // catalogue
      vehicules,
      chargementVehicules,
      erreurVehicules,
      rechargerVehicules: recharger,
      // paramètres
      parametres,
      majParametre,
      basculerVehicule,
      retirerVehicule,
      viderSelection,
      vehiculesSelectionnes,
      validation,
      // simulation
      statut,
      lancer,
      resultats,
      recommandation,
      parametresAppliques,
      dateSimulation,
      erreurSimulation,
      indisponibles,
      resultatsOrphelins,
      effacerIndisponibles,
      reinitialiser,
      // session
      sessionProposee,
      reprendreSession,
      ignorerSession,
    }),
    [
      vehicules,
      chargementVehicules,
      erreurVehicules,
      recharger,
      parametres,
      majParametre,
      basculerVehicule,
      retirerVehicule,
      viderSelection,
      vehiculesSelectionnes,
      validation,
      statut,
      lancer,
      resultats,
      recommandation,
      parametresAppliques,
      dateSimulation,
      erreurSimulation,
      indisponibles,
      resultatsOrphelins,
      effacerIndisponibles,
      reinitialiser,
      sessionProposee,
      reprendreSession,
      ignorerSession,
    ],
  );

  return <SimulateurContext.Provider value={valeur}>{children}</SimulateurContext.Provider>;
}
