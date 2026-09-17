/**
 * Suite de robustesse : cas limites du formulaire, valeurs affichées,
 * graphiques selon le nombre de véhicules, et localStorage corrompu.
 * Se lance contre le build de démonstration (`npm run build && npm run preview`).
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const exe = process.env.CHROME_PATH || undefined;

const resultats = [];
const ok = (n, c, d = '') => resultats.push({ n, c, d });

const browser = await chromium.launch({
  ...(exe ? { executablePath: exe } : {}),
  args: ['--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fr-FR' });
const page = await ctx.newPage();

const erreursJs = [];
page.on('pageerror', (e) => erreursJs.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') erreursJs.push(`[console] ${m.text()}`);
});

const allerAuSimulateur = async () => {
  await page.goto(`${BASE}/simulateur`, { waitUntil: 'networkidle' });
  const recommencer = page.getByRole('button', { name: 'Recommencer' });
  if (await recommencer.count()) await recommencer.click();
  await page.waitForSelector('article input[type=checkbox]');
};

const bouton = () => page.getByRole('button', { name: /Comparer les véhicules/i });
const champKm = () => page.locator('input[type=number]').first();
const champDuree = () => page.locator('input[type=number]').nth(1);

/* ——————————————————————————————————————————————————————————————
 * 1. Validation du formulaire
 * —————————————————————————————————————————————————————————————— */
await allerAuSimulateur();
ok('Aucun véhicule → bouton désactivé', await bouton().isDisabled());
ok(
  'Aucun véhicule → raison affichée',
  (await page.getByText('Sélectionnez au moins un véhicule').count()) === 1,
);

await page.locator('article label[for]').nth(0).click();
ok('Un véhicule suffit pour activer le bouton', await bouton().isEnabled());

const casKm = [
  { valeur: '', libelle: 'vide', attenduDesactive: true },
  { valeur: '0', libelle: 'zéro', attenduDesactive: true },
  { valeur: '-5000', libelle: 'négatif', attenduDesactive: true },
  { valeur: '10', libelle: 'sous le minimum', attenduDesactive: true },
  { valeur: '999999999', libelle: 'démesuré', attenduDesactive: true },
  { valeur: '15000', libelle: 'valide', attenduDesactive: false },
];
for (const cas of casKm) {
  await champKm().fill(cas.valeur);
  await page.waitForTimeout(120);
  ok(
    `Kilométrage ${cas.libelle} → bouton ${cas.attenduDesactive ? 'désactivé' : 'actif'}`,
    (await bouton().isDisabled()) === cas.attenduDesactive,
  );
}

// Saisie de texte dans un champ numérique
await champKm().fill('');
await champKm().type('abc');
await page.waitForTimeout(120);
ok(
  'Kilométrage : texte refusé par le champ, bouton désactivé',
  (await champKm().inputValue()) === '' && (await bouton().isDisabled()),
);

// Écrêtage au flou
await champKm().fill('999999999');
await champKm().blur();
await page.waitForTimeout(200);
const kmEcrete = await champKm().inputValue();
ok('Kilométrage démesuré écrêté au maximum', kmEcrete === '100000', kmEcrete);

// Valeur décimale
await champKm().fill('15000.7');
await champKm().blur();
await page.waitForTimeout(200);
const kmDecimal = await champKm().inputValue();
ok(
  'Kilométrage décimal ramené à un entier',
  Number.isInteger(Number(kmDecimal)),
  kmDecimal,
);

await champKm().fill('15000');
await champKm().blur();

const casDuree = [
  { valeur: '', libelle: 'vide', attenduDesactive: true },
  { valeur: '0', libelle: 'zéro', attenduDesactive: true },
  { valeur: '-3', libelle: 'négative', attenduDesactive: true },
  { valeur: '2.5', libelle: 'décimale', attenduDesactive: true },
  { valeur: '99', libelle: 'trop élevée', attenduDesactive: true },
  { valeur: '5', libelle: 'valide', attenduDesactive: false },
];
for (const cas of casDuree) {
  await champDuree().fill(cas.valeur);
  await page.waitForTimeout(120);
  ok(
    `Durée ${cas.libelle} → bouton ${cas.attenduDesactive ? 'désactivé' : 'actif'}`,
    (await bouton().isDisabled()) === cas.attenduDesactive,
  );
}

await champDuree().fill('99');
await champDuree().blur();
await page.waitForTimeout(200);
ok('Durée trop élevée écrêtée au maximum', (await champDuree().inputValue()) === '15');
await champDuree().fill('5');
await champDuree().blur();

// Aucune requête ne doit partir tant que les données sont invalides
await champKm().fill('0');
await page.waitForTimeout(900);
ok(
  'Données invalides → aucun résultat calculé',
  (await page.locator('#titre-tableau').count()) === 0,
);
await champKm().fill('15000');
await champKm().blur();

/* ——————————————————————————————————————————————————————————————
 * 2. Graphiques selon le nombre de véhicules
 * —————————————————————————————————————————————————————————————— */
const lancer = async () => {
  await bouton().click();
  await page.waitForSelector('#titre-tableau', { timeout: 12000 });
  await page.waitForTimeout(800);
};

await lancer();
ok('1 véhicule : les deux graphiques se rendent', (await page.locator('.recharts-wrapper').count()) === 2);
ok('1 véhicule : une seule ligne au tableau', (await page.locator('table').last().locator('tbody tr').count()) === 1);
ok(
  '1 véhicule : il est aussi la recommandation',
  (await page.getByText('Le plus économique').count()) >= 1,
);

for (const i of [1, 2, 3]) await page.locator('article label[for]').nth(i).click();
await page.waitForTimeout(2200);
ok('4 véhicules : tableau complet', (await page.locator('table').last().locator('tbody tr').count()) === 4);
ok('4 véhicules : 4 courbes distinctes', (await page.locator('.recharts-line').count()) === 4);

// Durée d'un an : l'évolution n'a qu'un point
await champDuree().fill('1');
await champDuree().blur();
await page.waitForTimeout(2400);
ok(
  'Durée de 1 an : graphique d’évolution toujours rendu',
  (await page.locator('.recharts-wrapper').count()) === 2,
);
await champDuree().fill('5');
await champDuree().blur();
await page.waitForTimeout(2400);

/* ——————————————————————————————————————————————————————————————
 * 3. Aucune valeur technique à l'écran
 * —————————————————————————————————————————————————————————————— */
const texteResultats = await page.locator('#resultats').innerText();
// On déplie aussi les tableaux alternatifs
for (const d of await page.locator('details summary').all()) await d.click();
await page.waitForTimeout(300);
const texteComplet = await page.locator('#resultats').innerText();

const interdits = ['undefined', 'NaN', '[object Object]', 'null'];
const trouves = interdits.filter((t) => texteComplet.includes(t));
ok(
  'Aucune valeur technique affichée (undefined / NaN / null / [object Object])',
  trouves.length === 0,
  trouves.join(', '),
);
ok('Zone de résultats non vide', texteResultats.length > 200);

/* ——————————————————————————————————————————————————————————————
 * 4. localStorage : données corrompues ou aberrantes
 * —————————————————————————————————————————————————————————————— */
const CLE = 'autocost:v1:session';
const casStockage = [
  { libelle: 'JSON invalide', valeur: '{{{' },
  { libelle: 'JSON valide mais vide', valeur: '{}' },
  { libelle: 'parametres absents', valeur: '{"resultats":[]}' },
  { libelle: 'vehiculeIds non tableau', valeur: '{"parametres":{"vehiculeIds":"veh_001","kilometrageAnnuel":15000,"dureeAnnees":5,"region":"FR"}}' },
  { libelle: 'kilométrage textuel', valeur: '{"parametres":{"vehiculeIds":["veh_001"],"kilometrageAnnuel":"beaucoup","dureeAnnees":5,"region":"FR"}}' },
  { libelle: 'kilométrage hors bornes', valeur: '{"parametres":{"vehiculeIds":["veh_001"],"kilometrageAnnuel":99999999,"dureeAnnees":5,"region":"FR"}}' },
  { libelle: 'durée décimale', valeur: '{"parametres":{"vehiculeIds":["veh_001"],"kilometrageAnnuel":15000,"dureeAnnees":2.5,"region":"FR"}}' },
  { libelle: 'région inexistante', valeur: '{"parametres":{"vehiculeIds":["veh_001"],"kilometrageAnnuel":15000,"dureeAnnees":5,"region":"ZZ"}}' },
  { libelle: 'valeurs nulles', valeur: '{"parametres":null,"resultats":null,"date":null}' },
  { libelle: 'tableau au lieu d’un objet', valeur: '[1,2,3]' },
];

for (const cas of casStockage) {
  const avant = erreursJs.length;
  await page.evaluate(
    ([cle, valeur]) => window.localStorage.setItem(cle, valeur),
    [CLE, cas.valeur],
  );
  await page.goto(`${BASE}/simulateur`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const catalogueAffiche = (await page.locator('article input[type=checkbox]').count()) > 0;
  ok(
    `localStorage — ${cas.libelle} : application fonctionnelle`,
    catalogueAffiche && erreursJs.length === avant,
    erreursJs.slice(avant).join(' | '),
  );
}

// Session valide mais dont les véhicules n'existent plus
await page.evaluate((cle) => {
  window.localStorage.setItem(
    cle,
    JSON.stringify({
      parametres: {
        vehiculeIds: ['veh_inexistant_1', 'veh_inexistant_2'],
        kilometrageAnnuel: 15000,
        dureeAnnees: 5,
        region: 'FR',
      },
      resultats: null,
      date: new Date().toISOString(),
    }),
  );
}, CLE);
await page.goto(`${BASE}/simulateur`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const avantReprise = erreursJs.length;
const boutonReprendre = page.getByRole('button', { name: 'Reprendre' });
ok('Session avec véhicules disparus : reprise proposée', (await boutonReprendre.count()) === 1);
if (await boutonReprendre.count()) {
  await boutonReprendre.click();
  await page.waitForTimeout(1500);
}
ok(
  'Reprise de véhicules disparus : avertissement, pas de plantage',
  erreursJs.length === avantReprise &&
    (await page.locator('article input[type=checkbox]').count()) > 0,
  erreursJs.slice(avantReprise).join(' | '),
);

// Nettoyage
await page.evaluate(() => window.localStorage.clear());

/* —————————————————————————————————————————————————————————————— */
await browser.close();

const echecs = resultats.filter((r) => !r.c);
console.log(`\n${resultats.length - echecs.length}/${resultats.length} vérifications de robustesse OK`);
for (const r of resultats) console.log(`${r.c ? ' OK ' : 'FAIL'}  ${r.n}${r.d ? ' — ' + r.d : ''}`);
console.log(
  '\nErreurs JavaScript pendant toute la session :',
  erreursJs.length === 0 ? 'aucune' : erreursJs.join(' | '),
);
