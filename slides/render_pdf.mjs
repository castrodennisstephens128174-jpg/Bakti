import puppeteer from 'puppeteer';
import { writeFile } from 'node:fs/promises';

const url = 'file://' + process.cwd() + '/index.html';
const out = 'deck.pdf';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForFunction(() => typeof Chart !== 'undefined' && document.querySelectorAll('canvas').length >= 6, { timeout: 15000 });
await new Promise(r => setTimeout(r, 1500));

const total = 9;
const pdfBuffers = [];
for (let i = 1; i <= total; i++) {
  await page.evaluate((n) => {
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    document.querySelector(`[data-slide="${n}"]`).classList.add('active');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  }, i);
  await new Promise(r => setTimeout(r, 600));
  const buf = await page.pdf({
    width: '1280px',
    height: '720px',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  pdfBuffers.push(buf);
  console.log(`rendered slide ${i}/${total} (${buf.length}B)`);
}

const merged = await page.pdf({
  width: '1280px',
  height: '720px',
  printBackground: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
});

await writeFile(out, merged);
console.log(`wrote ${out} (${merged.length}B)`);
await browser.close();
