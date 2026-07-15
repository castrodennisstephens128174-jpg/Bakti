import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? 'http://localhost:3005';
const SEED = 'GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47';
const RANDOM = 'GBU7GVNT52X7VNTG63RE23NE7CE344SNHVONEW4KANS4LY6ZP3KMDOL2';
const SHOTS = path.resolve(__dirname, '../../screen-shot');
mkdirSync(SHOTS, { recursive: true });

const shot = (page, name, fullPage = false) =>
  page.screenshot({ path: path.join(SHOTS, name), type: 'jpeg', quality: 85, fullPage });

async function login(context, publicKey) {
  const res = await context.request.post(`${BASE}/api/auth/test-login`, { data: { publicKey } });
  if (!res.ok()) throw new Error(`test-login failed: ${res.status()}`);
}

async function main() {
  const browser = await chromium.launch();

  // Landing (desktop)
  const desk = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const landing = await desk.newPage();
  await landing.goto(BASE, { waitUntil: 'domcontentloaded' });
  await landing.waitForTimeout(700);
  await shot(landing, '01-landing.jpg');

  // Dashboard with seeded allowances
  await login(desk, SEED);
  const dash = await desk.newPage();
  await dash.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await dash.getByTestId('allowance-list').waitFor({ timeout: 15000 });
  await dash.waitForTimeout(600);
  await shot(dash, '02-dashboard.jpg');

  // Create-allowance form open
  await dash.getByTestId('new-allowance-button').click();
  await dash.getByTestId('create-allowance-form').waitFor({ timeout: 8000 });
  await dash.getByTestId('recipient-name').fill('Nenek Wati (Grandma)');
  await dash.getByTestId('monthly-amount').fill('5');
  await dash.waitForTimeout(400);
  await shot(dash, '03-create-allowance.jpg');

  // Allowance detail — the Bapak Bambang plan with a real collected payout
  const list = await (await desk.request.get(`${BASE}/api/allowances`)).json();
  const bambang = list.data.find((a) => a.recipientName.includes('Bambang')) ?? list.data[0];
  const detail = await desk.newPage();
  await detail.goto(`${BASE}/allowances/${bambang.id}`, { waitUntil: 'domcontentloaded' });
  await detail.getByTestId('payout-list').waitFor({ timeout: 15000 });
  await detail.waitForTimeout(900);
  await shot(detail, '04-allowance-detail.jpg', true);

  // Stats
  const stats = await desk.newPage();
  await stats.goto(`${BASE}/stats`, { waitUntil: 'domcontentloaded' });
  await stats.waitForTimeout(700);
  await shot(stats, '05-stats.jpg');

  // Mobile landing (375px)
  const mob = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobPage = await mob.newPage();
  await mobPage.goto(BASE, { waitUntil: 'domcontentloaded' });
  await mobPage.waitForTimeout(700);
  await shot(mobPage, '06-mobile.jpg');

  // Empty state — a fresh wallet with no allowances
  const fresh = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await login(fresh, RANDOM);
  const emptyPage = await fresh.newPage();
  await emptyPage.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await emptyPage.getByTestId('empty-state').waitFor({ timeout: 10000 });
  await emptyPage.waitForTimeout(500);
  await shot(emptyPage, '07-empty-state.jpg');

  await browser.close();
  console.log('screenshots written to', SHOTS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
