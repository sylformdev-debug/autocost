import { useEffect } from 'react';
import { ArrowRight, Fuel, Wrench, ShieldCheck, TrendingDown, Receipt } from 'lucide-react';
import Bouton from '../../components/Bouton/Bouton';
import VisuelAccueil from '../../components/VisuelAccueil/VisuelAccueil';
import { LIBELLE_SOURCE, utiliseMock } from '../../services';
import { MAX_VEHICULES } from '../../constants/simulation';
import { REGION_OPTIONS } from '../../constants/regions';
import styles from './Accueil.module.css';

const ETAPES = [
  {
    numero: '01',
    titre: 'Choisir les véhicules',
    texte: `Jusqu’à ${MAX_VEHICULES} modèles comparés côte à côte, thermiques, hybrides ou électriques.`,
  },
  {
    numero: '02',
    titre: 'Définir votre utilisation',
    texte: 'Kilométrage annuel, durée de possession, région : le calcul part de votre réalité.',
  },
  {
    numero: '03',
    titre: 'Lancer la simulation',
    texte: 'Les coûts sont projetés année par année sur toute la durée retenue.',
  },
  {
    numero: '04',
    titre: 'Comparer les résultats',
    texte: 'Graphiques, tableau comparatif et recommandation du véhicule le plus économique.',
  },
];

const POSTES = [
  {
    icone: Fuel,
    titre: 'Énergie',
    texte: 'Carburant ou électricité, calculés sur une consommation d’usage réel.',
  },
  {
    icone: Wrench,
    titre: 'Entretien',
    texte: 'Révisions, pièces d’usure et vieillissement mécanique du véhicule.',
  },
  {
    icone: ShieldCheck,
    titre: 'Assurance',
    texte: 'Prime annuelle liée à la valeur du véhicule et à la région.',
  },
  {
    icone: TrendingDown,
    titre: 'Décote',
    texte: 'Le poste le plus sous-estimé : la valeur perdue à la revente.',
  },
  {
    icone: Receipt,
    titre: 'Frais annexes',
    texte: 'Carte grise, pneumatiques, contrôle technique et menus frais.',
  },
];

/** Aperçu statique et explicitement illustratif — aucune donnée n'est simulée ici. */
const APERCU = [
  { nom: 'Citadine électrique', part: 62, valeur: '0,29 €/km' },
  { nom: 'Citadine hybride', part: 78, valeur: '0,34 €/km' },
  { nom: 'Citadine essence', part: 100, valeur: '0,41 €/km' },
];

export default function Accueil() {
  useEffect(() => {
    document.title = 'AutoCost — Comparez le vrai coût de votre voiture';
  }, []);

  return (
    <div className={styles.page}>
      {/* ————— HERO ————— */}
      <section className={`conteneur ${styles.hero}`}>
        <div className={styles.heroTexte}>
          <p className="surtitre">Coût total de possession</p>
          <h1 className={styles.titre}>
            Comparez le vrai coût
            <br />
            de votre prochaine voiture.
          </h1>
          <p className={styles.accroche}>
            Simulez vos dépenses et découvrez quel véhicule correspond réellement à votre budget —
            au-delà du prix affiché en concession.
          </p>
          <div className={styles.actions}>
            <Bouton to="/simulateur" variante="primaire" taille="grand" iconeApres={ArrowRight}>
              Commencer la simulation
            </Bouton>
            <Bouton href="#comment-ca-marche" variante="discret" taille="grand">
              Comment ça marche
            </Bouton>
          </div>
          <p className={styles.mentionRegions}>
            {REGION_OPTIONS.length} régions · {MAX_VEHICULES} véhicules comparables · projection
            jusqu’à 15 ans
          </p>
        </div>

        <aside className={styles.apercu} aria-label="Aperçu illustratif d’un comparatif">
          <div className={styles.illustration}>
            <VisuelAccueil />
          </div>

          <div className={styles.apercuEntete}>
            <span>Aperçu d’un comparatif</span>
            <span className={styles.apercuTag}>Exemple</span>
          </div>
          <ul className={styles.apercuListe}>
            {APERCU.map((ligne, i) => (
              <li key={ligne.nom} className={styles.apercuLigne}>
                <span className={styles.apercuNom}>{ligne.nom}</span>
                <span className={`${styles.apercuValeur} chiffre`}>{ligne.valeur}</span>
                <span className={styles.apercuBarre} aria-hidden="true">
                  <span
                    className={styles.apercuRemplissage}
                    style={{ width: `${ligne.part}%`, opacity: 1 - i * 0.28 }}
                  />
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.apercuNote}>
            Valeurs d’illustration. Vos chiffres proviendront de votre propre simulation.
          </p>
        </aside>
      </section>

      {/* ————— COMMENT ÇA MARCHE ————— */}
      <section className={`conteneur ${styles.section}`} id="comment-ca-marche">
        <h2 className={styles.titreSection}>Quatre étapes, deux minutes</h2>
        <ol className={styles.etapes}>
          {ETAPES.map((e) => (
            <li key={e.numero} className={styles.etape}>
              <span className={`${styles.etapeNumero} chiffre`}>{e.numero}</span>
              <h3 className={styles.etapeTitre}>{e.titre}</h3>
              <p className={styles.etapeTexte}>{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ————— CE QUE VOUS COMPAREZ ————— */}
      <section className={`conteneur ${styles.section}`} id="ce-que-vous-comparez">
        <h2 className={styles.titreSection}>Ce que vous comparez</h2>
        <p className={styles.introSection}>
          Le prix d’achat ne représente qu’une partie de la dépense. AutoCost additionne cinq postes
          sur toute la durée de possession.
        </p>
        <ul className={styles.postes}>
          {POSTES.map(({ icone: Icone, titre, texte }) => (
            <li key={titre} className={styles.poste}>
              <Icone size={17} strokeWidth={1.5} aria-hidden="true" />
              <h3 className={styles.posteTitre}>{titre}</h3>
              <p className={styles.posteTexte}>{texte}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ————— MÉTHODOLOGIE ————— */}
      <section className={`conteneur ${styles.section}`} id="methodologie">
        <h2 className={styles.titreSection}>Méthodologie & données</h2>
        <div className={styles.methodo}>
          <div>
            <h3 className={styles.methodoTitre}>Comment le coût est calculé</h3>
            <p className={styles.methodoTexte}>
              Chaque poste est projeté année par année : la consommation homologuée est corrigée
              d’un facteur d’usage réel, l’entretien augmente avec l’âge du véhicule, l’assurance
              suit sa valeur, et la décote est modélisée par une courbe de rétention annuelle
              dégradée par un kilométrage élevé. Le total est ensuite ramené au mois et au
              kilomètre.
            </p>
          </div>
          <div>
            <h3 className={styles.methodoTitre}>Source des données</h3>
            <p className={styles.methodoTexte}>
              Source active : <strong>{LIBELLE_SOURCE}</strong>.{' '}
              {utiliseMock()
                ? 'L’application fonctionne actuellement sur un jeu de données de démonstration, calculé localement. Aucun appel réseau n’est simulé : dès qu’une API conforme au contrat attendu est configurée, les mêmes écrans affichent ses réponses réelles.'
                : 'Les véhicules et les résultats affichés proviennent directement de l’API configurée. Aucune valeur n’est complétée localement.'}
            </p>
          </div>
        </div>
      </section>

      {/* ————— CTA FINAL ————— */}
      <section className={`conteneur ${styles.ctaFinal}`}>
        <h2 className={styles.ctaTitre}>Prêt à comparer&nbsp;?</h2>
        <p className={styles.ctaTexte}>
          Quelques paramètres suffisent pour savoir quel véhicule vous coûtera réellement le moins
          cher.
        </p>
        <Bouton to="/simulateur" variante="primaire" taille="grand" iconeApres={ArrowRight}>
          Commencer la simulation
        </Bouton>
      </section>
    </div>
  );
}
