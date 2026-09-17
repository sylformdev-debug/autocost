import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const SHOTS = process.env.SHOTS ?? '/tmp/claude-0/shots';
// Chemin du binaire Chromium : laissé à Playwright sauf surcharge explicite.
const exe = process.env.CHROME_PATH || undefined;

const resultats = [];
const ok = (n, c, d = '') => resultats.push({ n, c, d });

const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: 'fr-FR' });
const page = await ctx.newPage();

const erreursConsole = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') erreursConsole.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => erreursConsole.push(`[pageerror] ${e.message}`));

const scrollH = () =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

// ————— 1. Accueil —————
await page.goto(BASE, { waitUntil: 'networkidle' });
ok('Accueil : titre', (await page.title()).includes('AutoCost'), await page.title());
ok('Accueil : H1', (await page.locator('h1').innerText()).includes('Comparez le vrai coût'));
ok('Accueil : pas de scroll horizontal (1440)', !(await scrollH()));
await page.screenshot({ path: `${SHOTS}/01-accueil-1440.png`, fullPage: true });

// ancre méthodologie
await page.click('a[href="/#methodologie"] >> nth=0').catch(() => {});
await page.waitForTimeout(500);

// Navigation interne : un <a href> rechargerait l'application et perdrait l'état
await page.evaluate(() => {
  window.__marqueurSpa = true;
});
await page
  .getByRole('navigation', { name: 'Navigation principale' })
  .getByRole('link', { name: 'Méthodologie' })
  .click();
await page.waitForTimeout(600);
ok(
  'Lien « Méthodologie » : navigation SPA sans rechargement',
  await page.evaluate(() => window.__marqueurSpa === true),
);

// ————— 2. Simulateur : chargement catalogue —————
await page.goto(`${BASE}/simulateur`, { waitUntil: 'networkidle' });
await page.waitForSelector('article input[type=checkbox]', { timeout: 8000 });
const nbInitial = await page.locator('article input[type=checkbox]').count();
ok('Catalogue : 8 véhicules au premier affichage', nbInitial === 8, `${nbInitial}`);
await page.getByRole('button', { name: /Afficher les \d+ autres/ }).click();
await page.waitForTimeout(300);
const nbTotal = await page.locator('article input[type=checkbox]').count();
ok('Dépliage → catalogue complet', nbTotal === 18, `${nbTotal} véhicules`);
// Filtre par motorisation
await page.getByRole('button', { name: 'Électrique', exact: true }).click();
await page.waitForTimeout(250);
const nbElec = await page.locator('article input[type=checkbox]').count();
ok('Filtre « Électrique »', nbElec === 6, `${nbElec} véhicules`);
await page.getByRole('button', { name: 'Toutes', exact: true }).click();
// Recherche
await page.fill('#recherche-vehicule', 'tesla');
await page.waitForTimeout(250);
ok('Recherche « tesla »', (await page.locator('article input[type=checkbox]').count()) === 1);
await page.fill('#recherche-vehicule', 'zzzz');
await page.waitForTimeout(250);
ok('Recherche sans résultat → état vide', (await page.getByText('Aucun véhicule ne correspond').count()) === 1);
await page.fill('#recherche-vehicule', '');
await page.waitForTimeout(250);

// bouton désactivé sans sélection
const btn = page.getByRole('button', { name: /Comparer les véhicules/i });
ok('Bouton désactivé sans véhicule', await btn.isDisabled());

// ————— 3. Sélection —————
for (const i of [0, 1, 2]) await page.locator('article label[for]').nth(i).click();
ok('3 véhicules sélectionnés', (await page.locator('article input:checked').count()) === 3);
ok('Bouton actif après sélection', await btn.isEnabled());

// ————— 4. Validation : km invalide —————
const champKm = page.locator('input[type=number]').first();
await champKm.fill('0');
await page.waitForTimeout(150);
ok('Km = 0 → bouton désactivé', await btn.isDisabled());
ok('Km = 0 → message d’erreur', await page.locator('[role=alert]').first().isVisible());
await champKm.fill('15000');
await champKm.blur();
await page.waitForTimeout(150);
ok('Km valide → bouton réactivé', await btn.isEnabled());

// ————— 5. Simulation —————
await btn.click();
await page.waitForSelector('#titre-tableau', { timeout: 10000 });
await page.waitForTimeout(700);

const lignes = await page.locator('table').last().locator('tbody tr').count();
ok('Tableau comparatif : 3 lignes', lignes === 3, `${lignes}`);
ok('Recommandation affichée', await page.locator('#titre-recommandation').isVisible());
ok(
  'Mention « Le plus économique »',
  (await page.getByText('Le plus économique').count()) >= 1,
);

const nbSvg = await page.locator('.recharts-wrapper').count();
ok('Deux graphiques rendus', nbSvg === 2, `${nbSvg} graphiques`);
ok(
  'Graphique répartition : barres empilées',
  (await page.locator('.recharts-bar-rectangle').count()) >= 10,
);
ok('Graphique évolution : courbes', (await page.locator('.recharts-line').count()) === 3);

// tri croissant du tableau
const couts = await page.locator('table').last().locator('tbody tr td:nth-child(3)').allInnerTexts();
const nums = couts.map((t) => Number(t.replace(/[^\d]/g, '')));
ok('Tableau trié par coût croissant', nums.every((v, i) => i === 0 || nums[i - 1] <= v), nums.join(' < '));

// cohérence coût mensuel = total / (durée*12)
const mensuels = await page.locator('table').last().locator('tbody tr td:nth-child(4)').allInnerTexts();
const m0 = Number(mensuels[0].replace(/[^\d]/g, ''));
ok(
  'Cohérence coût mensuel ≈ total / 60',
  Math.abs(m0 - nums[0] / 60) <= 2,
  `${m0} vs ${Math.round(nums[0] / 60)}`,
);

// alternative textuelle des graphiques
ok('Alternative tabulaire présente', (await page.locator('details summary').count()) === 2);

await page.screenshot({ path: `${SHOTS}/02-resultats-1440.png`, fullPage: true });
ok('Résultats : pas de scroll horizontal (1440)', !(await scrollH()));

// ————— 5 bis. Contenu de l'export PDF —————
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(400);
const pdf = await page.evaluate(() => {
  // `getComputedStyle` renvoie le display propre de l'élément même quand c'est
  // un ancêtre qui est masqué : on mesure donc le rendu réel.
  const visible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };
  return {
    selecteurMasque: !visible(document.querySelector('#recherche-vehicule')),
    formulaireMasque: !visible(document.querySelector('input[type=number]')),
    navMasquee: !visible(document.querySelector('header')),
    tableauPresent: visible(document.querySelector('#titre-tableau')),
    recommandationPresente: visible(document.querySelector('#titre-recommandation')),
    couleurAxes: document.querySelector('.recharts-cartesian-axis-tick-value')
      ? getComputedStyle(document.querySelector('.recharts-cartesian-axis-tick-value')).fill
      : null,
  };
});
ok('Export PDF : sélecteur de véhicules exclu', pdf.selecteurMasque);
ok('Export PDF : formulaire exclu', pdf.formulaireMasque);
ok('Export PDF : navigation exclue', pdf.navMasquee);
ok('Export PDF : recommandation et tableau présents', pdf.tableauPresent && pdf.recommandationPresente);
ok(
  'Export PDF : libellés d’axes lisibles (non blancs)',
  pdf.couleurAxes === 'rgb(17, 17, 17)',
  pdf.couleurAxes ?? 'introuvable',
);
await page.emulateMedia({ media: 'screen' });
await page.waitForTimeout(300);

// ————— 6. Mise à jour dynamique —————
const totalAvant = (await page.locator('table').last().locator('tbody tr td:nth-child(3)').first().innerText()).trim();
await champKm.fill('30000');
await champKm.blur();
await page.waitForTimeout(2200);
const totalApres = (await page.locator('table').last().locator('tbody tr td:nth-child(3)').first().innerText()).trim();
ok('Relance automatique au changement de paramètre', totalAvant !== totalApres, `${totalAvant} → ${totalApres}`);

// ————— 7. Changement de région (devise) —————
await page.selectOption('select', 'CH');
await page.waitForTimeout(2200);
const enCHF = await page.locator('table').last().locator('tbody tr td:nth-child(3)').first().innerText();
ok('Changement de région → devise CHF', /CHF/.test(enCHF), enCHF);
await page.selectOption('select', 'FR');
await page.waitForTimeout(2200);

// ————— 8. Retrait d’un véhicule —————
await page.locator('[class*="puce"] button').first().click();
await page.waitForTimeout(2200);
const lignes2 = await page.locator('table').last().locator('tbody tr').count();
ok('Retrait d’un véhicule → 2 lignes', lignes2 === 2, `${lignes2}`);

// ————— 9. localStorage —————
const stocke = await page.evaluate(() => window.localStorage.getItem('autocost:v1:session'));
ok('Session enregistrée en localStorage', !!stocke && stocke.includes('vehiculeIds'));

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
ok(
  'Bannière « Reprendre » proposée au retour',
  (await page.getByText(/Reprendre votre dernière simulation/).count()) === 1,
);
await page.getByRole('button', { name: 'Reprendre' }).click();
await page.waitForSelector('#titre-tableau', { timeout: 10000 });
ok('Reprise → résultats recalculés', (await page.locator('table').last().locator('tbody tr').count()) === 2);

// ————— 10. Fiche véhicule + 404 —————
await page.goto(`${BASE}/vehicule/veh_001`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
ok('Fiche véhicule affichée', (await page.locator('h1').innerText()).length > 0, await page.locator('h1').innerText());

await page.goto(`${BASE}/vehicule/inexistant`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
ok(
  'Véhicule inconnu → message métier',
  (await page.getByText('Le véhicule sélectionné est introuvable.').count()) === 1,
);

await page.goto(`${BASE}/page-qui-nexiste-pas`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
ok('Route inconnue → page 404', (await page.getByText('Cette page n’existe pas').count()) === 1);

// ————— 11. Responsive —————
for (const [w, h, nom] of [
  [320, 700, '320'],
  [390, 844, '390'],
  [768, 1024, '768'],
  [1280, 900, '1280'],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${BASE}/simulateur`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const banniere = page.getByRole('button', { name: 'Recommencer' });
  if (await banniere.count()) await banniere.click();
  await page.waitForSelector('article input[type=checkbox]');
  for (const i of [0, 1]) await page.locator('article label[for]').nth(i).click();
  await page.getByRole('button', { name: /Comparer les véhicules/i }).click();
  await page.waitForSelector('#titre-tableau', { timeout: 10000 });
  await page.waitForTimeout(600);
  ok(`Responsive ${nom}px : pas de scroll horizontal`, !(await scrollH()));
  await page.screenshot({ path: `${SHOTS}/03-simulateur-${nom}.png`, fullPage: true });
  await page.evaluate(() => window.localStorage.clear());
}

// ————— 12. Navigation clavier —————
await page.setViewportSize({ width: 1440, height: 950 });
await page.goto(`${BASE}/simulateur`, { waitUntil: 'networkidle' });
await page.waitForSelector('article input[type=checkbox]');
await page.keyboard.press('Tab');
const premierFocus = await page.evaluate(() => document.activeElement?.className ?? '');
ok('Premier Tab → lien d’évitement', premierFocus.includes('lien-evitement'), premierFocus);

// coche au clavier
await page.locator('article input[type=checkbox]').first().focus();
await page.keyboard.press('Space');
ok('Sélection au clavier', (await page.locator('article input:checked').count()) === 1);

// ————— 13. Graphiques : retirés de l'arbre d'accessibilité —————
await page.locator('article label[for]').nth(1).click();
await page.getByRole('button', { name: /Comparer les véhicules/i }).click();
await page.waitForSelector('#titre-tableau', { timeout: 10000 });
await page.waitForTimeout(700);
const a11yGraphiques = await page.evaluate(() =>
  [...document.querySelectorAll('.recharts-wrapper')].map((el) => ({
    masque: el.closest('[aria-hidden="true"]') !== null,
    focusables: el.querySelectorAll('[tabindex]:not([tabindex="-1"])').length,
  })),
);
ok(
  'Graphiques hors de l’arbre d’accessibilité (tableau équivalent fourni)',
  a11yGraphiques.length === 2 && a11yGraphiques.every((g) => g.masque && g.focusables === 0),
  JSON.stringify(a11yGraphiques),
);

const echecs = resultats.filter((r) => !r.c);
console.log(`\n${resultats.length - echecs.length}/${resultats.length} tests OK`);
for (const r of resultats) console.log(`${r.c ? ' OK ' : 'FAIL'}  ${r.n}${r.d ? ' — ' + r.d : ''}`);
console.log('\nConsole (erreurs/avertissements) :', erreursConsole.length === 0 ? 'aucun' : '');
for (const e of [...new Set(erreursConsole)]) console.log('  ' + e);

await browser.close();
