/** Sonde d'audit : accessibilité du DOM des graphiques, rendu à l'impression, coût des re-rendus. */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const exe = process.env.CHROME_PATH || undefined;
const browser = await chromium.launch({
  ...(exe ? { executablePath: exe } : {}),
  args: ['--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: 'fr-FR' });
const page = await ctx.newPage();

// ————— 0. Chargement de l'accueil : la librairie de graphiques doit rester dehors —————
const requetes = [];
page.on('request', (r) => requetes.push(r.url()));
await page.goto(BASE, { waitUntil: 'networkidle' });
const jsAccueil = requetes.filter((u) => u.endsWith('.js'));
console.log('JS chargé sur l’accueil :', jsAccueil.map((u) => u.split('/').pop()).join(', '));
console.log('  recharts chargé sur l’accueil :', jsAccueil.some((u) => u.includes('graphiques')));

// Navigation SPA : le lien « Méthodologie » ne doit pas recharger la page
await page.evaluate(() => { window.__marqueur = 'vivant'; });
await page.getByRole('navigation', { name: 'Navigation principale' })
  .getByRole('link', { name: 'Méthodologie' }).click();
await page.waitForTimeout(700);
const survit = await page.evaluate(() => window.__marqueur === 'vivant');
console.log('Navigation SPA conservée (pas de rechargement) :', survit);

await page.goto(`${BASE}/simulateur`, { waitUntil: 'networkidle' });
await page.waitForSelector('article input[type=checkbox]');
for (const i of [0, 1, 2]) await page.locator('article label[for]').nth(i).click();
await page.getByRole('button', { name: /Comparer les véhicules/i }).click();
await page.waitForSelector('#titre-tableau', { timeout: 10000 });
await page.waitForTimeout(900);

// ————— 1. DOM des graphiques : ce qu'un lecteur d'écran rencontre —————
const a11yGraphiques = await page.evaluate(() => {
  const surfaces = [...document.querySelectorAll('.recharts-wrapper')];
  return surfaces.map((el) => ({
    role: el.getAttribute('role'),
    tabindex: el.getAttribute('tabindex'),
    ariaHidden: el.closest('[aria-hidden]')?.getAttribute('aria-hidden') ?? null,
    elementsFocusables: el.querySelectorAll('[tabindex]:not([tabindex="-1"])').length,
  }));
});
console.log('Graphiques (DOM) :', JSON.stringify(a11yGraphiques));

// Nombre d'arrêts de tabulation dans la zone de résultats
const arretsTab = await page.evaluate(() => {
  const zone = document.querySelector('#resultats');
  return zone.querySelectorAll(
    'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])',
  ).length;
});
console.log('Arrêts de tabulation dans les résultats :', arretsTab);

// ————— 2. Coût des re-rendus pendant la saisie (résultats affichés) —————
const champKm = page.locator('input[type=number]').first();
await champKm.click();
const mesure = await page.evaluate(async () => {
  const champ = document.querySelector('input[type=number]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  const t0 = performance.now();
  for (let i = 0; i < 25; i += 1) {
    setter.call(champ, String(15000 + i * 100));
    champ.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => requestAnimationFrame(r));
  }
  return Math.round(performance.now() - t0);
});
console.log(`25 frappes clavier (résultats affichés) : ${mesure} ms  → ${(mesure / 25).toFixed(1)} ms/frappe`);

// ————— 3. Rendu à l'impression (export PDF) —————
await page.waitForTimeout(2500);
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(400);
const impression = await page.evaluate(() => {
  const doc = document.documentElement;
  const graphique = document.querySelector('.recharts-wrapper');
  const nav = document.querySelector('header');
  const rect = graphique?.getBoundingClientRect();
  return {
    largeurPage: doc.scrollWidth,
    debordementHorizontal: doc.scrollWidth > doc.clientWidth,
    navMasquee: nav ? getComputedStyle(nav).display === 'none' : null,
    largeurGraphique: rect ? Math.round(rect.width) : null,
    graphiqueDansLaPage: rect ? rect.right <= doc.clientWidth + 1 : null,
    fondBody: getComputedStyle(document.body).backgroundColor,
    couleurTexte: getComputedStyle(document.body).color,
    enteteImpressionVisible: [...document.querySelectorAll('div')].some(
      (d) => d.textContent?.startsWith('AutoCost — Comparatif') && getComputedStyle(d).display !== 'none',
    ),
  };
});
console.log('Impression :', JSON.stringify(impression, null, 1));
await page.screenshot({ path: '/tmp/claude-0/shots/print.png', fullPage: true });
await page.emulateMedia({ media: 'screen' });

await browser.close();
