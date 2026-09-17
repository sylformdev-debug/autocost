import { useEffect, useRef } from 'react';
import { BarChart3, Play } from 'lucide-react';
import { useSimulateur } from '../../context/contexteSimulateur';
import { STATUTS } from '../../constants/statuts';
import SectionEtape from '../../components/SectionEtape/SectionEtape';
import SelecteurVehicules from '../../components/SelecteurVehicules/SelecteurVehicules';
import FormulaireSimulation from '../../components/FormulaireSimulation/FormulaireSimulation';
import BanniereSession from '../../components/BanniereSession/BanniereSession';
import Avertissement from '../../components/Avertissement/Avertissement';
import MessageErreur from '../../components/MessageErreur/MessageErreur';
import Bouton from '../../components/Bouton/Bouton';
import { Indicateur, SquelettesResultats } from '../../components/EtatChargement/EtatChargement';
import SyntheseResultats from '../../components/SyntheseResultats/SyntheseResultats';
import CarteRecommandation from '../../components/CarteRecommandation/CarteRecommandation';
import CarteResultat from '../../components/CarteResultat/CarteResultat';
import GraphiqueRepartition from '../../components/GraphiqueRepartition/GraphiqueRepartition';
import GraphiqueEvolution from '../../components/GraphiqueEvolution/GraphiqueEvolution';
import TableauComparatif from '../../components/TableauComparatif/TableauComparatif';
import { exporterComparatif } from '../../utils/export';
import { formatAnnees, formatDateHeure, formatKmParAn } from '../../utils/format';
import { getRegion } from '../../constants/regions';
import { MAX_VEHICULES } from '../../constants/simulation';
import styles from './Simulateur.module.css';

export default function Simulateur() {
  const {
    vehicules,
    chargementVehicules,
    erreurVehicules,
    rechargerVehicules,
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
  } = useSimulateur();

  const refResultats = useRef(null);
  const dejaDefile = useRef(false);

  const aDesResultats = Array.isArray(resultats) && resultats.length > 0;
  const enChargement = statut === STATUTS.CHARGEMENT;
  const recalcul = enChargement && aDesResultats;

  // Premier résultat : on amène l'utilisateur jusqu'à la zone de résultats.
  useEffect(() => {
    if (aDesResultats && !dejaDefile.current) {
      dejaDefile.current = true;
      refResultats.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (!aDesResultats) dejaDefile.current = false;
  }, [aDesResultats]);

  useEffect(() => {
    document.title = 'Simulation — AutoCost';
  }, []);

  return (
    <div className={`conteneur ${styles.page}`}>
      <header className={`${styles.entete} sans-impression`}>
        <p className="surtitre">Simulateur</p>
        <h1 className={styles.titre}>Votre simulation</h1>
        <p className={styles.sousTitre}>
          Comparez plusieurs véhicules selon votre utilisation réelle : énergie, entretien,
          assurance, décote et frais annexes, sur toute la durée de possession.
        </p>
      </header>

      {sessionProposee ? (
        <div className={styles.banniere}>
          <BanniereSession
            session={sessionProposee}
            onReprendre={reprendreSession}
            onIgnorer={ignorerSession}
          />
        </div>
      ) : null}

      {indisponibles.length > 0 ? (
        <div className={`${styles.banniere} sans-impression`}>
          <Avertissement onFermer={effacerIndisponibles}>
            {indisponibles.length === 1
              ? 'Un véhicule sélectionné n’est plus disponible et a été retiré de la comparaison.'
              : `${indisponibles.length} véhicules sélectionnés ne sont plus disponibles et ont été retirés de la comparaison.`}{' '}
            Les autres véhicules restent comparables.
          </Avertissement>
        </div>
      ) : null}

      {resultatsOrphelins.length > 0 ? (
        <div className={`${styles.banniere} sans-impression`}>
          <Avertissement ton="neutre">
            {resultatsOrphelins.length}{' '}
            {resultatsOrphelins.length === 1 ? 'résultat renvoyé' : 'résultats renvoyés'} par le
            serveur {resultatsOrphelins.length === 1 ? 'ne correspond' : 'ne correspondent'} à aucun
            véhicule du catalogue et {resultatsOrphelins.length === 1 ? 'n’a' : 'n’ont'} pas pu être
            affiché{resultatsOrphelins.length === 1 ? '' : 's'}.
          </Avertissement>
        </div>
      ) : null}

      {/* Les trois étapes de saisie sont exclues de l'export PDF : le document
          imprimé ne doit contenir que le comparatif (§23). */}
      <div className="sans-impression">
        {/* ————— ÉTAPE 1 ————— */}
        <SectionEtape
          numero={1}
          titre="Choisir les véhicules"
          description={`Sélectionnez jusqu’à ${MAX_VEHICULES} véhicules à mettre en regard.`}
        >
          <SelecteurVehicules
            vehicules={vehicules}
            chargement={chargementVehicules}
            erreur={erreurVehicules}
            onRecharger={rechargerVehicules}
            selection={parametres.vehiculeIds}
            onBasculer={basculerVehicule}
            onRetirer={retirerVehicule}
            onVider={viderSelection}
            vehiculesSelectionnes={vehiculesSelectionnes}
            region={parametres.region}
          />
        </SectionEtape>

        {/* ————— ÉTAPE 2 ————— */}
        <SectionEtape
          numero={2}
          titre="Définir votre utilisation"
          description="Ces trois paramètres déterminent l’intégralité du calcul."
        >
          <FormulaireSimulation
            parametres={parametres}
            onChanger={majParametre}
            erreurs={validation.erreurs}
            avertissements={validation.avertissements}
          />
        </SectionEtape>

        {/* ————— ÉTAPE 3 ————— */}
        <SectionEtape
          numero={3}
          titre="Lancer la simulation"
          description={
            aDesResultats
              ? 'Vos résultats se mettent à jour automatiquement à chaque modification.'
              : 'Le calcul se lance uniquement lorsque les paramètres sont valides.'
          }
        >
          <div className={styles.lancement}>
            <Bouton
              variante="primaire"
              taille="grand"
              icone={enChargement ? undefined : Play}
              onClick={() => lancer()}
              disabled={!validation.valide || enChargement}
              aria-describedby={!validation.valide ? 'raison-desactivation' : undefined}
            >
              {enChargement ? 'Calcul en cours…' : 'Comparer les véhicules'}
            </Bouton>

            {enChargement ? <Indicateur label="Simulation en cours" /> : null}

            {!validation.valide ? (
              <p id="raison-desactivation" className={styles.raison}>
                {validation.erreurs.vehicules ??
                  validation.erreurs.kilometrageAnnuel ??
                  validation.erreurs.dureeAnnees ??
                  validation.erreurs.region}
              </p>
            ) : null}
          </div>

          {statut === STATUTS.ERREUR && erreurSimulation ? (
            <div className={styles.erreurSimulation}>
              <MessageErreur
                erreur={erreurSimulation}
                titre="La simulation n’a pas abouti"
                onReessayer={validation.valide ? () => lancer() : undefined}
              />
            </div>
          ) : null}
        </SectionEtape>
      </div>

      {/* ————— RÉSULTATS ————— */}
      <div ref={refResultats} id="resultats" className={styles.zoneResultats}>
        {enChargement && !aDesResultats ? (
          <>
            <p className="visuellement-cache" aria-live="polite">
              Simulation en cours, veuillez patienter.
            </p>
            <SquelettesResultats />
          </>
        ) : null}

        {aDesResultats && parametresAppliques ? (
          <section className={styles.resultats} aria-label="Résultats de la simulation">
            {/* En-tête visible uniquement à l'impression / export PDF */}
            <div className={styles.enteteImpression} aria-hidden="true">
              <strong>AutoCost — Comparatif du coût total de possession</strong>
              <span>
                {formatDateHeure(dateSimulation ?? new Date())} ·{' '}
                {formatKmParAn(parametresAppliques.kilometrageAnnuel)} ·{' '}
                {formatAnnees(parametresAppliques.dureeAnnees)} ·{' '}
                {getRegion(parametresAppliques.region).label}
              </span>
            </div>

            <SyntheseResultats
              nombreVehicules={resultats.length}
              parametres={parametresAppliques}
              date={dateSimulation}
              recalculEnCours={recalcul}
              onExporter={exporterComparatif}
              onReinitialiser={reinitialiser}
            />

            <p className="visuellement-cache" aria-live="polite">
              {recalcul
                ? 'Mise à jour de la simulation en cours.'
                : `Simulation terminée. ${resultats.length} véhicules comparés.`}
            </p>

            <CarteRecommandation
              recommandation={recommandation}
              second={resultats[1] ?? null}
              parametres={parametresAppliques}
            />

            <div className={`${styles.cartes} ${recalcul ? styles.attenue : ''}`}>
              {resultats.map((r) => (
                <CarteResultat
                  key={r.vehiculeId}
                  resultat={r}
                  region={parametresAppliques.region}
                  estRecommande={r.vehiculeId === recommandation?.vehiculeId}
                  ecart={r.coutTotal - (recommandation?.coutTotal ?? r.coutTotal)}
                />
              ))}
            </div>

            <section className={styles.panneau} aria-labelledby="titre-repartition">
              <header className={styles.panneauEntete}>
                <h3 id="titre-repartition" className={styles.panneauTitre}>
                  Où part votre argent
                </h3>
                <p className={styles.panneauTexte}>
                  Décomposition du coût total par poste de dépense, sur toute la période.
                </p>
              </header>
              <GraphiqueRepartition
                resultats={resultats}
                region={parametresAppliques.region}
              />
            </section>

            <section className={styles.panneau} aria-labelledby="titre-evolution">
              <header className={styles.panneauEntete}>
                <h3 id="titre-evolution" className={styles.panneauTitre}>
                  Évolution du coût cumulé
                </h3>
                <p className={styles.panneauTexte}>
                  Ce que chaque véhicule vous aura coûté, année après année.
                </p>
              </header>
              <GraphiqueEvolution resultats={resultats} region={parametresAppliques.region} />
            </section>

            <section className={styles.panneau} aria-labelledby="titre-tableau">
              <header className={styles.panneauEntete}>
                <h3 id="titre-tableau" className={styles.panneauTitre}>
                  Tableau comparatif
                </h3>
                <p className={styles.panneauTexte}>
                  Classement du moins cher au plus cher, écart calculé par rapport au meilleur.
                </p>
              </header>
              <TableauComparatif
                resultats={resultats}
                region={parametresAppliques.region}
                idRecommande={recommandation?.vehiculeId}
              />
            </section>
          </section>
        ) : null}

        {!aDesResultats && !enChargement && statut !== STATUTS.ERREUR ? (
          <div className={`${styles.attente} sans-impression`}>
            <BarChart3 size={24} strokeWidth={1.2} aria-hidden="true" />
            <p className={styles.attenteTitre}>Vos résultats s’afficheront ici</p>
            <p className={styles.attenteTexte}>
              Choisissez au moins un véhicule, ajustez vos paramètres, puis lancez la comparaison.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
