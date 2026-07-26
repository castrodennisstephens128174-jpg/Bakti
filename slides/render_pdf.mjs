import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = 'file://' + process.cwd() + '/index.html';
const total = 10;
const perSlideDir = path.resolve(process.cwd(), '../public');

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

await page.waitForFunction(
  () => typeof Chart !== 'undefined' && document.querySelectorAll('canvas').length >= 6,
  { timeout: 15000 },
);
await page.waitForTimeout(500);

await mkdir(perSlideDir, { recursive: true });

for (let i = 1; i <= total; i++) {
  await page.evaluate((n) => {
    document.querySelectorAll('.slide').forEach((s) => s.classList.remove('active'));
    document.querySelector(`[data-slide="${n}"]`).classList.add('active');
  }, i);
  await page.waitForTimeout(400);
  const buf = await page.pdf({
    width: '1280px',
    height: '720px',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  const outPath = path.join(perSlideDir, `slide_${i}.pdf`);
  await writeFile(outPath, buf);
  console.log(`rendered slide ${i}/${total} -> ${outPath} (${buf.length}B)`);
}

await browser.close();
console.log(`done. Per-slide PDFs written to ${perSlideDir}. Merge separately (see slides output).`);
