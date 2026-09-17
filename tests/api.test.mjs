/**
 * Vérifie le provider REST contre le faux serveur conforme au contrat,
 * ainsi que chaque cas d'erreur du §8.
 * Lancer `node faux-serveur-api.mjs` avant, puis `node test-api.mjs`.
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { spawn } from 'node:child_process';

// Chemin du binaire Chromium : laissé à Playwright sauf surcharge explicite.
const exe = process.env.CHROME_PATH || undefined;
const PORT = 4180;
const resultats = [];
const ok = (n, c, d = '') => resultats.push({ n, c, d });

const scenarios = [
  {
    nom: 'API conforme',
    env: { VITE_DATA_SOURCE: 'rest', VITE_API_URL: 'http://127.0.0.1:5055/ok' },
    async verifier(page) {
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'networkidle' });
      await page.waitForSelector('article input[type=checkbox]', { timeout: 8000 });
      const n = await page.locator('article input[type=checkbox]').count();
      ok('REST : catalogue servi par l’API', n === 3, `${n} véhicules`);

      for (const i of [0, 1]) await page.locator('article label[for]').nth(i).click();
      await page.getByRole('button', { name: /Comparer les véhicules/i }).click();
      await page.waitForSelector('#titre-tableau', { timeout: 10000 });
      const lignes = await page.locator('table').last().locator('tbody tr').count();
      ok('REST : simulation via POST /simulation', lignes === 2, `${lignes} lignes`);

      await page.goto(`http://127.0.0.1:${PORT}/vehicule/api_002`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      ok(
        'REST : GET /vehicules/:id',
        (await page.locator('h1').innerText()).includes('Megane'),
        await page.locator('h1').innerText(),
      );

      await page.goto(`http://127.0.0.1:${PORT}/vehicule/inconnu`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      ok(
        'REST : 404 → « Le véhicule sélectionné est introuvable. »',
        (await page.getByText('Le véhicule sélectionné est introuvable.').count()) === 1,
      );
    },
  },
  {
    nom: 'Résultat hors catalogue',
    env: { VITE_DATA_SOURCE: 'rest', VITE_API_URL: 'http://127.0.0.1:5055/orphelin' },
    async verifier(page) {
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'networkidle' });
      await page.waitForSelector('article input[type=checkbox]', { timeout: 8000 });
      for (const i of [0, 1]) await page.locator('article label[for]').nth(i).click();
      await page.getByRole('button', { name: /Comparer les véhicules/i }).click();
      await page.waitForSelector('#titre-tableau', { timeout: 10000 });
      await page.waitForTimeout(600);
      ok(
        'Résultat sans véhicule connu → signalé, pas écarté en silence',
        (await page.getByText('ne correspond à aucun véhicule du catalogue', { exact: false }).count()) === 1,
      );
      ok(
        'Les résultats valides restent affichés',
        (await page.locator('table').last().locator('tbody tr').count()) === 2,
      );
    },
  },
  {
    nom: 'Catalogue vide',
    env: { VITE_DATA_SOURCE: 'rest', VITE_API_URL: 'http://127.0.0.1:5055/vide' },
    async verifier(page) {
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      ok(
        'Catalogue vide → état vide explicite',
        (await page.getByText('Le catalogue est vide pour le moment.').count()) === 1,
      );
      ok(
        'Catalogue vide → simulation impossible',
        await page.getByRole('button', { name: /Comparer les véhicules/i }).isDisabled(),
      );
      ok(
        'Catalogue vide → aucune erreur affichée à tort',
        (await page.getByText('Une erreur est survenue', { exact: false }).count()) === 0,
      );
    },
  },
  {
    nom: 'Données incomplètes',
    env: { VITE_DATA_SOURCE: 'rest', VITE_API_URL: 'http://127.0.0.1:5055/partiel' },
    async verifier(page) {
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'networkidle' });
      await page.waitForSelector('article input[type=checkbox]', { timeout: 8000 });

      const texteCatalogue = await page.locator('main').innerText();
      ok(
        'Catalogue lacunaire (prix/conso/marque nuls) → aucune valeur technique',
        !/undefined|NaN|\[object Object\]/.test(texteCatalogue),
      );
      ok(
        'Champ manquant remplacé par un tiret',
        texteCatalogue.includes('—'),
      );

      // Visuels : image absente → illustration ; URL hostile → jamais rendue
      const srcs = await page.$$eval('article img', (els) => els.map((e) => e.getAttribute('src')));
      ok(
        'URL d’image hostile rejetée par la normalisation',
        srcs.every((s) => !/^javascript:/i.test(s ?? '')),
        srcs.join(' | '),
      );
      await page.waitForTimeout(900);
      const illustrations = await page.$$eval('article svg', (els) => els.length);
      ok(
        'Photo introuvable → repli sur l’illustration vectorielle',
        illustrations >= 3,
        `${illustrations} illustrations`,
      );
      ok(
        'Aucune image cassée affichée',
        (await page.$$eval('article img', (els) =>
          els.filter((e) => e.complete && e.naturalWidth === 0).length,
        )) === 0,
      );

      for (const i of [0, 1, 2]) await page.locator('article label[for]').nth(i).click();
      await page.getByRole('button', { name: /Comparer les véhicules/i }).click();
      await page.waitForSelector('#titre-tableau', { timeout: 10000 });
      await page.waitForTimeout(800);

      ok(
        'Résultat sans `detail` → graphique de répartition dégradé mais rendu',
        (await page.getByText('Détail indisponible pour', { exact: false }).count()) === 1,
      );
      ok(
        'Résultat sans `evolution_annuelle` → courbe absente sans plantage',
        (await page.locator('.recharts-line').count()) === 1,
      );

      for (const d of await page.locator('details summary').all()) await d.click();
      await page.waitForTimeout(300);
      const texteResultats = await page.locator('#resultats').innerText();
      ok(
        'Résultats incomplets → aucune valeur technique affichée',
        !/undefined|NaN|\[object Object\]|null/.test(texteResultats),
        (texteResultats.match(/undefined|NaN|\[object Object\]|null/g) ?? []).join(', '),
      );
      ok(
        'Coût mensuel / coût par km absents → tiret',
        (await page.locator('table').last().innerText()).includes('—'),
      );
      ok(
        'Les trois véhicules restent comparés',
        (await page.locator('table').last().locator('tbody tr').count()) === 3,
      );
    },
  },
  {
    nom: 'CORS bloqué',
    env: { VITE_DATA_SOURCE: 'rest', VITE_API_URL: 'http://127.0.0.1:5055/nocors' },
    async verifier(page) {
      const messages = [];
      page.on('console', (m) => messages.push(m.text()));
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      ok(
        'CORS bloqué → message réseau compréhensible',
        (await page.getByText('Impossible de contacter le serveur.', { exact: false }).count()) === 1,
      );
      ok(
        'CORS bloqué → bouton Réessayer proposé',
        (await page.getByRole('button', { name: 'Réessayer' }).count()) === 1,
      );
      ok(
        'CORS bloqué → cause identifiable en console développeur',
        messages.some((m) => /CORS|Access-Control/i.test(m)),
        messages.filter((m) => /CORS|Access-Control/i.test(m)).slice(0, 1).join(''),
      );
    },
  },
  {
    nom: 'Erreur 500',
    env: { VITE_DATA_SOURCE: 'rest', VITE_API_URL: 'http://127.0.0.1:5055/err500' },
    async verifier(page) {
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      ok(
        '500 → « Une erreur est survenue sur le serveur. Veuillez réessayer. »',
        (await page.getByText('Une erreur est survenue sur le serveur. Veuillez réessayer.').count()) === 1,
      );
      ok('500 → bouton Réessayer proposé', (await page.getByRole('button', { name: 'Réessayer' }).count()) === 1);
    },
  },
  {
    nom: 'Réponse hors contrat',
    env: { VITE_DATA_SOURCE: 'rest', VITE_API_URL: 'http://127.0.0.1:5055/casse' },
    async verifier(page) {
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      ok(
        'Données mal formées → message métier, pas de page blanche',
        (await page.getByText('La réponse du serveur est inexploitable.', { exact: false }).count()) === 1,
      );
      ok('Données mal formées → application toujours affichée', (await page.locator('h1').count()) === 1);
    },
  },
  {
    nom: 'Timeout',
    env: {
      VITE_DATA_SOURCE: 'rest',
      VITE_API_URL: 'http://127.0.0.1:5055/lent',
      VITE_API_TIMEOUT: '1200',
    },
    async verifier(page) {
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      ok(
        'Timeout → « Le serveur met trop de temps à répondre… »',
        (await page.getByText('Le serveur met trop de temps à répondre.', { exact: false }).count()) === 1,
      );
    },
  },
  {
    nom: 'Serveur injoignable',
    env: { VITE_DATA_SOURCE: 'rest', VITE_API_URL: 'http://127.0.0.1:5999/api' },
    async verifier(page) {
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      ok(
        'Réseau → « Impossible de contacter le serveur… »',
        (await page.getByText('Impossible de contacter le serveur.', { exact: false }).count()) === 1,
      );
    },
  },
  {
    nom: 'rest sans URL → repli documenté sur le mock',
    env: { VITE_DATA_SOURCE: 'rest', VITE_API_URL: '' },
    async verifier(page) {
      await page.goto(`http://127.0.0.1:${PORT}/simulateur`, { waitUntil: 'networkidle' });
      await page.waitForSelector('article input[type=checkbox]', { timeout: 8000 });
      ok(
        'VITE_API_URL vide → bascule sur le jeu de démonstration',
        (await page.locator('article input[type=checkbox]').count()) === 8,
      );
    },
  },
];

const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--no-sandbox'] });

for (const s of scenarios) {
  const env = { ...process.env, ...s.env };
  execSync('npm run build', { env, stdio: 'ignore' });
  const serveur = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], {
    stdio: 'ignore',
    detached: true,
  });
  await new Promise((r) => setTimeout(r, 2500));

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fr-FR' });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  try {
    await s.verifier(page);
    ok(`${s.nom} : aucune exception de rendu`, erreurs.length === 0, erreurs.join(' | '));
  } catch (e) {
    ok(`${s.nom} : scénario exécuté`, false, e.message.split('\n')[0]);
  }
  await ctx.close();
  try {
    process.kill(-serveur.pid);
  } catch {
    /* déjà arrêté */
  }
  await new Promise((r) => setTimeout(r, 400));
}

await browser.close();

const echecs = resultats.filter((r) => !r.c);
console.log(`\n${resultats.length - echecs.length}/${resultats.length} vérifications API OK`);
for (const r of resultats) console.log(`${r.c ? ' OK ' : 'FAIL'}  ${r.n}${r.d ? ' — ' + r.d : ''}`);
