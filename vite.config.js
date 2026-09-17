import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
});

// Note : un découpage manuel (`build.rollupOptions.output.manualChunks`) a été
// testé pour isoler React et Recharts dans des chunks mis en cache séparément.
// Il a été retiré : rolldown y regroupe aussi le code commun, si bien que la
// librairie de graphiques (≈ 400 kB) finissait téléchargée dès la page
// d'accueil. Le découpage automatique la laisse dans le chunk chargé à la
// demande du simulateur, ce qui compte davantage que la granularité du cache.
