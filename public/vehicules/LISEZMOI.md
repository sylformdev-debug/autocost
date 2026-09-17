# Images du site

## Image de la page d'accueil

Elle se change en une ligne, dans `src/constants/photos.js` :

```js
export const PHOTO_ACCUEIL = '/accueil.webp';
```

Le fichier va directement dans `public/` (donc `public/accueil.webp`).
Format conseillé : **1200 × 570 px**, WebP, moins de 150 ko — le cadre est en 21/10 et recadre
au centre. Laissez `null` pour garder l'illustration vectorielle.

Un voile sombre est appliqué en bas de l'image pour que l'aperçu chiffré placé juste en dessous
reste lisible. Pour l'enlever, supprimez le bloc `.cadre:has(.photo)::after` dans
`src/components/VisuelAccueil/VisuelAccueil.module.css`.

---

# Photographies de véhicules

Ce dossier est prévu pour vos propres images. **Il est vide volontairement.**

## Pourquoi aucune photo n'est livrée

Les photographies de véhicules de marque appartiennent aux constructeurs ou aux
photographes qui les ont prises. Les embarquer dans un site déployé publiquement —
même pour un projet académique — demande une licence. Les logos de marque sont par
ailleurs des marques déposées.

L'application affiche donc par défaut des **illustrations vectorielles originales**
(`src/components/SilhouetteVehicule/`), choisies selon le segment du véhicule
(citadine, compacte, berline, break, SUV). Elles ne représentent aucun modèle réel,
ne pèsent presque rien et restent nettes à toutes les tailles.

## Ajouter vos propres photos

1. Déposez vos fichiers ici, par exemple `public/vehicules/clio.webp`.
2. Renseignez le champ `image` du véhicule avec le chemin **absolu** correspondant :

   ```js
   {
     id: 'veh_001',
     marque: 'Renault',
     modele: 'Clio',
     image: '/vehicules/clio.webp',
     // …
   }
   ```

   Dans le jeu de démonstration : `src/services/mock/vehicules.data.js`.
   Depuis une API : le champ `image`, `image_url` ou `photo` de la réponse est lu
   automatiquement.

3. C'est tout. `VisuelVehicule` affiche la photo quand elle existe et retombe sur
   l'illustration sinon — y compris si le fichier est introuvable ou si le réseau
   échoue. Aucune icône d'image cassée ne peut apparaître.

## Recommandations

- **Format** : WebP ou AVIF, plus légers que JPEG à qualité égale.
- **Dimensions** : 800 × 350 px suffisent (le cadre est en 16/7). Au-delà, vous
  chargez des pixels que personne ne verra.
- **Poids** : visez moins de 80 ko par image. Vingt véhicules à 500 ko, c'est 10 Mo
  sur une connexion mobile.
- **Cadrage** : profil ou trois-quarts, véhicule centré, fond sobre. Le cadre
  recadre en `object-fit: cover`.

## Sources d'images réutilisables

- Photos sous licence libre : Wikimedia Commons, Unsplash, Pexels — vérifiez la
  licence de **chaque** fichier, elle varie d'une image à l'autre.
- Vos propres photographies : la solution la plus simple juridiquement.
- Les médiathèques presse des constructeurs : réservées à la presse, leurs
  conditions d'utilisation interdisent en général ce type de réemploi.

## Images hébergées ailleurs

Le champ `image` accepte aussi une URL `https://…`. Dans ce cas, la
`Content-Security-Policy` de `vercel.json` doit être élargie, sinon le navigateur
bloquera le chargement :

```
img-src 'self' data: https://votre-hebergeur-d-images
```

Une image locale ne demande aucune modification.
