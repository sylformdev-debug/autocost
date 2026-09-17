# AutoCost

**Comparez le vrai coût de votre prochaine voiture.**

Application web de simulation et de comparaison du **coût total de possession (TCO)** de
plusieurs véhicules : énergie, entretien, assurance, décote et frais annexes, projetés sur toute
la durée de possession selon le kilométrage et la région de l'utilisateur.

Projet développé dans le cadre d'un projet académique.

---

## 1. Installation

Prérequis : **Node.js 20 ou plus** et npm.

```bash
git clone <url-du-depot>
cd autocost
npm install
```

## 2. Configuration (`.env`)

```bash
cp .env.example .env
```

| Variable            | Valeurs               | Rôle                                                       |
| ------------------- | --------------------- | ---------------------------------------------------------- |
| `VITE_DATA_SOURCE`  | `mock` \| `rest`      | Source des données. Défaut : `mock`.                        |
| `VITE_API_URL`      | URL sans slash final  | Base de l'API REST. **Obligatoire si `VITE_DATA_SOURCE=rest`.** |
| `VITE_API_TIMEOUT`  | entier (ms)           | Délai maximal d'une requête. Défaut : `12000`.              |

Seules les variables préfixées `VITE_` sont exposées au navigateur : **n'y placer aucun secret,
clé privée ou identifiant**. Le fichier `.env` est ignoré par Git ; seul `.env.example` est versionné.

> Si `VITE_DATA_SOURCE=rest` est demandé sans `VITE_API_URL`, l'application le signale en console
> et revient au jeu de démonstration plutôt que d'émettre des requêtes vers des chemins relatifs.

## 3. Lancement local

```bash
npm run dev        # serveur de développement       → http://localhost:5173
npm run lint       # analyse statique (oxlint)
```

Pour travailler contre une API conforme au contrat sans dépendre d'un serveur distant, un faux
serveur est fourni :

```bash
npm run api:demo   # http://127.0.0.1:5055
```

puis, dans `.env` :

```
VITE_DATA_SOURCE=rest
VITE_API_URL=http://127.0.0.1:5055/ok
```

Ce serveur expose aussi des préfixes de test, pour observer chaque état de l'interface :

| Préfixe     | Simule                                                              |
| ----------- | ------------------------------------------------------------------- |
| `/ok`       | réponses conformes au contrat                                        |
| `/err404`   | véhicule introuvable                                                 |
| `/err500`   | erreur serveur                                                       |
| `/lent`     | réponse différée de 5 s (déclenche le timeout)                       |
| `/casse`    | JSON valide mais hors contrat                                        |
| `/orphelin` | résultat portant sur un véhicule absent du catalogue                 |
| `/vide`     | catalogue vide                                                       |
| `/partiel`  | champs nuls, résultat sans `detail`, résultat sans `evolution_annuelle` |
| `/nocors`   | réponses valides mais sans en-tête CORS (bloquées par le navigateur) |

## 4. Build

```bash
npm run build      # génère dist/
npm run preview    # sert dist/ localement → http://localhost:4173
```

## 5. Déploiement sur Vercel

**Depuis l'interface Vercel**

1. Pousser le projet sur GitHub / GitLab / Bitbucket.
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer le dépôt.
3. Vercel détecte Vite automatiquement. Vérifier :
   - Framework Preset : **Vite**
   - Build Command : `npm run build`
   - Output Directory : `dist`
4. **Settings → Environment Variables** — ajouter, pour `Production` et `Preview` :
   - `VITE_DATA_SOURCE` = `mock` (ou `rest`)
   - `VITE_API_URL` = l'URL de l'API si `rest`
   - `VITE_API_TIMEOUT` = `12000` (facultatif)
5. **Deploy**.

**Depuis le terminal**

```bash
npm i -g vercel
vercel login
vercel          # déploiement de prévisualisation
vercel --prod   # mise en production
```

Le fichier `vercel.json` versionné configure déjà :

- la réécriture SPA (`/(.*) → /index.html`) — indispensable pour que `/simulateur` et
  `/vehicule/:id` fonctionnent en accès direct ou après rechargement ;
- le cache long des assets empreintés ;
- les en-têtes `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` et une `Content-Security-Policy`.

> La CSP interdit tout script externe. `connect-src` reste volontairement ouvert parce que
> l'URL de l'API est fournie par variable d'environnement : une fois l'API définitive connue,
> remplacer `connect-src *` par `connect-src 'self' https://votre-api` durcit encore la page.

> Toute variable `VITE_*` est lue **au moment du build**. Après l'avoir modifiée dans Vercel, il
> faut relancer un déploiement pour qu'elle soit prise en compte.

## 6. Utilisation de l'API

### 6.1 État réel de l'API fournie

L'énoncé désigne `https://carapi.app/api`. Vérification faite, **ce service ne correspond pas au
contrat demandé** :

- c'est une base de données automobile (`/years`, `/makes`, `/models`, `/trims`, décodeur VIN…) ;
- **elle n'expose ni `GET /vehicules` ni `POST /simulation`** — il n'existe aucun endpoint de calcul
  de coût de possession ;
- elle exige une authentification par jeton JWT obtenu depuis un compte, donc un secret qui
  **n'a pas sa place dans un frontend** (§33 du cahier des charges).

L'application n'invente donc **aucune connexion** à ce service. Elle est livrée branchée sur un jeu
de données de démonstration calculé localement, et la source active est affichée en clair dans
l'interface (section « Méthodologie » et pied de page).

### 6.2 Contrat implémenté

Le provider REST implémente exactement le contrat du cahier des charges :

| Méthode | Endpoint          | Réponse attendue                               |
| ------- | ----------------- | ---------------------------------------------- |
| `GET`   | `/vehicules`      | tableau de véhicules                           |
| `GET`   | `/vehicules/:id`  | un véhicule (`404` si inconnu)                 |
| `POST`  | `/simulation`     | `{ resultats: [...] }`                         |

Corps envoyé à `POST /simulation` :

```json
{
  "vehicule_ids": ["veh_001", "veh_002"],
  "kilometrage_annuel": 15000,
  "duree_annees": 5,
  "region": "FR"
}
```

Si l'enseignant fournit une API aux chemins différents, **un seul fichier est à modifier** :
`src/services/rest/restApi.js` (objet `ENDPOINTS`). Aucun composant React ne connaît d'URL.

### 6.3 Basculer mock ↔ API réelle

Le choix se fait uniquement par variable d'environnement. Les deux providers exposent la même
signature et renvoient des données au même format brut, normalisées par le même code :

```
src/services/
├── index.js              ← point d'entrée unique (choisit le provider)
├── config.js             ← lecture des variables d'environnement
├── httpClient.js         ← seul appel à fetch du projet (timeout, annulation)
├── errors.js             ← ApiError + messages utilisateur
├── normalize.js          ← normalisation défensive des réponses
├── rest/restApi.js       ← API réelle
└── mock/                 ← démonstration (données + moteur de calcul local)
```

Aucun mélange : le moteur de calcul local n'est jamais exécuté quand l'API réelle est active, et
aucune valeur n'est complétée localement à partir d'une réponse API incomplète — un poste manquant
est signalé comme tel dans l'interface.

### 6.4 Gestion des erreurs

| Situation              | Message affiché                                                              |
| ---------------------- | ---------------------------------------------------------------------------- |
| `400` / `422`          | Les paramètres renseignés sont invalides.                                     |
| `404`                  | Le véhicule sélectionné est introuvable.                                      |
| `5xx`, `401`, `403`    | Une erreur est survenue sur le serveur. Veuillez réessayer.                   |
| Réseau injoignable     | Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.    |
| Dépassement de délai   | Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez. |
| Réponse hors contrat   | La réponse du serveur est inexploitable. Réessayez dans quelques instants.    |

Aucun message technique n'atteint l'utilisateur ; le détail (`code`, `debug`) part en console en
mode développement uniquement.

## 7. Méthodologie de calcul (mode démonstration)

Pour chaque véhicule et chaque année de possession :

- **Énergie** — consommation homologuée × facteur d'usage réel (1,12 à 1,18 selon la motorisation,
  pertes de recharge incluses pour l'électrique) × prix régional du litre ou du kWh.
- **Entretien** — forfait annuel + coût kilométrique propres à la motorisation, majorés de 6 % par
  année d'âge, pondérés par un coefficient régional.
- **Assurance** — prime de base + pourcentage du prix d'achat, décroissante avec l'âge du véhicule.
- **Décote** — courbe de rétention annuelle par motorisation, dégradée au-delà de 15 000 km/an,
  avec une valeur résiduelle plancher de 7 % du prix d'achat.
- **Frais annexes** — carte grise la première année, pneumatiques au kilomètre, contrôle technique
  à partir de 4 ans puis tous les 2 ans, menus frais.

Le total est ramené au mois et au kilomètre. Les hypothèses sont centralisées dans
`src/services/mock/simulationEngine.js` et `src/constants/regions.js`.

Régions prises en charge : France, Belgique, Allemagne, Espagne, Suisse (avec la devise locale).
En ajouter une consiste à ajouter une entrée dans `src/constants/regions.js` — aucun autre fichier
n'est concerné.

## 8. Structure du projet

```
autocost/
├── public/                     favicon, image Open Graph, dossier photos (vide)
├── tests/                      faux serveur API + suites de vérification navigateur
├── src/
│   ├── components/             un dossier par composant (JSX + CSS Module)
│   │   ├── AlternativeDonnees/   équivalent tabulaire des graphiques
│   │   ├── Avertissement/
│   │   ├── BadgeMotorisation/
│   │   ├── BanniereSession/      reprise de la dernière simulation
│   │   ├── Bouton/
│   │   ├── CarteRecommandation/
│   │   ├── CarteResultat/
│   │   ├── CarteVehicule/
│   │   ├── ErrorBoundary/
│   │   ├── EtatChargement/       squelettes et indicateurs
│   │   ├── Footer/
│   │   ├── FormulaireSimulation/
│   │   ├── GraphiqueEvolution/
│   │   ├── GraphiqueRepartition/
│   │   ├── Logo/
│   │   ├── MessageErreur/
│   │   ├── Navbar/
│   │   ├── SectionEtape/
│   │   ├── IllustrationHero/     illustration vectorielle de l'accueil
│   │   ├── SelecteurVehicules/
│   │   ├── SilhouetteVehicule/   cinq profils vectoriels par segment
│   │   ├── SyntheseResultats/
│   │   ├── TableauComparatif/
│   │   ├── VisuelAccueil/        photo d'accueil si définie, illustration sinon
│   │   └── VisuelVehicule/       photo si disponible, illustration sinon
│   ├── pages/
│   │   ├── Accueil/
│   │   ├── Simulateur/
│   │   ├── DetailVehicule/
│   │   └── NonTrouve/
│   ├── context/                état du simulateur (Provider + hook séparés)
│   ├── hooks/                  useVehicules, useDebounce, useMediaQuery, useNavigationScroll
│   ├── services/               voir §6.3
│   ├── utils/                  format, validation, storage, export
│   ├── constants/              regions, simulation, charts, statuts, photos
│   ├── styles/                 tokens.css (identité visuelle) + base.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── vercel.json
└── index.html
```

Principes appliqués : composants réutilisables, logique métier hors du JSX, appels réseau isolés
dans `services/`, aucune URL d'API dispersée, une seule source de vérité pour les jetons de design
et les bornes métier.

## 9. Vérifications automatisées

Deux suites pilotent un vrai navigateur (Chromium) sur le build de production.

```bash
# une seule fois, pour télécharger le navigateur
npx playwright install chromium

# terminal 1
npm run build && npm run preview

# terminal 2
npm run test:parcours     # 46 vérifications : parcours, validation, graphiques,
                          # localStorage, responsive 320→1280, navigation clavier,
                          # navigation SPA, contenu de l'export PDF, accessibilité
                          # des graphiques

# suite API (reconstruit l'application pour chaque scénario)
npm run api:demo          # terminal 1
npm run test:api          # terminal 2 — 39 vérifications : provider REST conforme,
                          # 404, 500, timeout, réseau, réponse hors contrat,
                          # résultat hors catalogue, catalogue vide,
                          # données incomplètes, CORS bloqué, repli d'image

# suite de robustesse (sur le build de démonstration)
npm run test:robustesse   # 40 vérifications : cas limites du formulaire,
                          # valeurs affichées, graphiques de 1 à 4 véhicules,
                          # localStorage corrompu
```

Dernier passage : **46/46**, **39/39** et **40/40**, aucune erreur JavaScript ni avertissement
en console.

Une sonde d'audit complète le tableau (`node tests/audit.mjs`, préversion en cours d'exécution) :
poids du JavaScript chargé sur l'accueil, persistance de la navigation SPA, arbre d'accessibilité
des graphiques, coût des re-rendus pendant la saisie, et rendu en média `print`.

### 9.1 CORS

Un navigateur ne bloque pas une requête vers une autre origine : il bloque la **lecture de la
réponse** si le serveur n'a pas renvoyé l'en-tête `Access-Control-Allow-Origin`. Côté frontend,
`fetch` échoue alors comme une panne réseau — c'est indistinguable, et volontairement traité comme
tel : l'interface affiche « Impossible de contacter le serveur ».

Le scénario est reproduit par le préfixe `/nocors` du faux serveur et couvert par la suite API.
La cause exacte reste visible dans la console développeur du navigateur.

**La correction se fait côté API, jamais côté frontend.** Le serveur doit renvoyer :

```
Access-Control-Allow-Origin: https://<votre-projet>.vercel.app
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

et répondre `204` aux requêtes `OPTIONS` de pré-vol. Aucun contournement n'est implémenté ici :
un proxy public tiers ferait transiter les données par un serveur inconnu, et désactiver la
sécurité du navigateur n'est pas envisageable pour un site en production.

### 9.2 Visuels des véhicules

Aucune photographie de constructeur n'est embarquée : ces images appartiennent aux marques ou
aux photographes, et un site déployé publiquement — même académique — a besoin d'une licence.
Les logos sont par ailleurs des marques déposées.

L'application affiche donc des **illustrations vectorielles originales**
(`src/components/SilhouetteVehicule/`), déclinées en cinq profils selon le segment du véhicule :
citadine, compacte, berline, break et SUV. Elles ne représentent aucun modèle réel, pèsent
quelques centaines d'octets et restent nettes à toutes les tailles. La page d'accueil a sa propre
illustration, plus détaillée (`src/components/IllustrationHero/`).

Le code accepte néanmoins de vraies photos : il suffit de renseigner le champ `image` d'un
véhicule (ou `image_url` / `photo` côté API). `VisuelVehicule` affiche la photo quand elle existe
et retombe sur l'illustration sinon — y compris lorsque le fichier est introuvable. Les URL sont
filtrées à la normalisation : seuls un chemin local absolu et une URL `http(s)` sont acceptés, ce
qui écarte un `javascript:` qui viendrait de l'API.

L'image de la page d'accueil suit le même principe : `PHOTO_ACCUEIL` dans le même fichier de
configuration, avec repli sur l'illustration si elle vaut `null` ou si le fichier manque.

Tout se règle depuis **`src/constants/photos.js`** — aucun composant à modifier. La marche à
suivre complète est dans `public/vehicules/LISEZMOI.md`.

## 10. Accessibilité

- Champs tous étiquetés, erreurs reliées par `aria-describedby`, `role="alert"` sur les messages.
- Sélection des véhicules construite sur de vraies cases à cocher : utilisable au clavier et
  correctement annoncée.
- Lien d'évitement en première tabulation, focus visible homogène, contrastes conformes.
- **Chaque graphique est doublé d'un tableau de données** réellement présent dans le DOM.
- Les courbes se distinguent par leur motif de trait autant que par leur couleur.
- `prefers-reduced-motion` respecté : toutes les animations sont neutralisées.
- Contrastes vérifiés par calcul : tous les couples texte/fond atteignent au moins 4,5:1.
- Les illustrations de véhicules sont décoratives : le modèle est nommé en toutes lettres à côté,
  donc elles sont retirées de l'arbre d'accessibilité plutôt que d'ajouter un texte redondant.
  Une vraie photographie, elle, reçoit un `alt` descriptif.
- Les SVG des graphiques sont retirés de l'arbre d'accessibilité (`aria-hidden`) et leur
  navigation clavier native est désactivée : le tableau équivalent est le chemin d'accès, plus
  utilisable qu'un parcours de points au clavier.

## 11. Export du comparatif

Le bouton « Exporter le comparatif » ouvre le dialogue d'impression du navigateur, piloté par une
feuille de style `@media print` dédiée : l'utilisateur choisit « Enregistrer au format PDF ».

Le document exporté ne contient que le comparatif : sélecteur de véhicules, formulaire, navigation
et pied de page en sont exclus, les couleurs passent en clair, et les libellés d'axes des
graphiques sont forcés en noir (ils portent leur couleur en attribut SVG et s'imprimaient sinon en
blanc sur blanc).

Ce choix évite une bibliothèque de génération PDF supplémentaire, et comme les graphiques sont des
SVG, ils sont exportés en vectoriel. Le document contient la date de simulation, les paramètres,
les véhicules, la recommandation, les coûts, le tableau comparatif et les deux graphiques.

## 12. Technologies

| Rôle             | Choix                          |
| ---------------- | ------------------------------ |
| Bibliothèque UI  | React 19                       |
| Build            | Vite 8                         |
| Routage          | React Router 7                 |
| Graphiques       | Recharts 3                     |
| Icônes           | lucide-react                   |
| Styles           | CSS Modules + variables CSS    |
| Polices          | Inter + Instrument Serif, auto-hébergées |
| Qualité          | oxlint, Playwright             |

Le projet ne contient aucun fichier TypeScript : les paquets `@types/react` et `@types/react-dom`,
hérités du gabarit Vite, ont été retirés.

Aucune bibliothèque de state management, de formulaires, de requêtes ou d'UI n'a été ajoutée :
le besoin est couvert par React et une centaine de lignes de logique dédiée.
#   a u t o c o s t  
 