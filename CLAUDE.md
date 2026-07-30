# Bakti

## Pitch deck — canonical copy

The deck that matters for submission/pitch is the **Google Drive file**, not just the local repo copy:

- URL: https://docs.google.com/presentation/d/13DUG2OGNvDcSU8HmOKMINn3MitXbTLJp/edit
- Drive file ID: `13DUG2OGNvDcSU8HmOKMINn3MitXbTLJp`
- File name on Drive: `bakti-pitch.pptx`
- It is a raw `.pptx` upload, **not** a native Google Slides doc — the Slides API
  (`presentations.get`) rejects it ("document must not be an Office file"). Edit it via
  the **Drive API**, overwriting file content in place (same file ID → same URL).

Source of truth for content is still `slides/marp/deck.md` (+ kept in sync with
`slides/index.html` and `slides/slides.md`, see below). After editing `deck.md`, regenerate
`slides/marp/deck.pptx` locally, then push that file to the Drive copy:

```bash
cd slides/marp
CHROME_PATH=~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npx marp deck.md --pptx --allow-local-files -o deck.pptx
CHROME_PATH=~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npx marp deck.md --pdf --allow-local-files -o deck.pdf
```

Then push the pptx to Drive (overwrite, same file ID, same URL):

```bash
mkdir -p /tmp/gapi && cd /tmp/gapi && npm install googleapis --no-audit --no-fund
node -e "
const { google } = await import('/tmp/gapi/node_modules/googleapis/build/src/index.js');
const fs = await import('node:fs');
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.HOME + '/.credentials/infra/google-sa.json',
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });
await drive.files.update({
  fileId: '13DUG2OGNvDcSU8HmOKMINn3MitXbTLJp',
  media: {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    body: fs.createReadStream('slides/marp/deck.pptx'),
  },
});
" --input-type=module
```

The service account `sheets-forms-bot@poors-tool.iam.gserviceaccount.com`
(`~/.credentials/infra/google-sa.json`) already has **writer** access on this Drive file —
confirmed 2026-07-29, no re-sharing needed.

## Slide sync — three files, always together

`slides/marp/deck.md` is the source. Every content edit must land in all three:

- `slides/marp/deck.md` (Marp source, `---`-delimited slides)
- `slides/index.html` (parallel HTML deck — separate `data-slide="N"` sections, its own
  `TOTAL` JS constant; slide numbering/`slide-num` spans must match `deck.md`'s slide count)
- `slides/slides.md` (plain-text mirror of the same content)

Regenerate `deck.pdf`/`deck.pptx` from `deck.md` after any edit (commands above), and push
the pptx to the Drive copy above — the repo's local pptx and the Drive copy are two
independent artifacts that must be updated together.

## Network

Product defaults to Stellar **mainnet**. Testnet is opt-in (`STELLAR_NETWORK=testnet` +
`NEXT_PUBLIC_STELLAR_NETWORK=testnet`). See `README.md` for the full picture — mainnet
escrow contract, the self-hosted SEP-31 anchor stub, and the two live deploys
(bakti-stellar.vercel.app mainnet, bakti-testnet.vercel.app testnet).
